import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  performHybridLogin,
  checkExistingAuth,
  signOutFirebase,
  fetchPolls,
  submitVote as submitVoteAPI,
  fetchPollResults,
  createPoll,
  updatePoll,
  deletePoll,
  getStoredUser,
  getStoredJWT,
  Poll as ApiPoll
} from '../lib/hybridApi';

// ======================================================
// INTERFACES
// ======================================================

interface User {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
}

interface Vote {
  id: string; // token de la API
  title: string; // name de la API
  description: string; // generado
  shortDescription: string; // generado
  status: 'active' | 'closed'; // basado en active de la API
  startDate: Date; // generado
  endDate: Date; // generado
  category: string; // generado
  options: VoteOption[];
  createdBy: string; // basado en owner de la API
  createdAt: Date; // generado
  totalVotes: number; // calculado
  userVotes?: { [userId: string]: string };
  userVote?: string;
  apiPoll?: ApiPoll; // referencia a los datos originales de la API
}

interface VoteOption {
  id: string; // selection de la API convertido a string
  text: string; // choice de la API
  votes: number; // calculado desde resultados
  selection: number; // selection original de la API
}

type Screen = 'login' | 'voting-list' | 'voting-detail' | 'profile' | 'loading' | 'empty' | 'success' | 'error';

interface VoteAppState {
  user: User | null;
  currentScreen: Screen;
  selectedVote: Vote | null;
  votes: Vote[];
  isLoading: boolean;
  error: string | null;
  isDarkMode: boolean;
  searchQuery: string;
  selectedCategory: string;
  dataSource: 'api' | 'mock';
  apiStatus: 'checking' | 'available' | 'unavailable' | 'error';
}

interface VoteAppContextType {
  state: VoteAppState;
  login: (useRedirect?: boolean) => Promise<void>;
  logout: () => Promise<void>; // Cambiar a async
  navigateTo: (screen: Screen, vote?: Vote) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleDarkMode: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  submitVote: (voteId: string, optionId: string) => Promise<void>;
  showSuccess: () => void;
  loadVotings: () => Promise<void>;
  createNewPoll: (pollData: { name: string; options: Array<{ choice: string }> }) => Promise<void>;
  updatePoll: (vote: Vote) => Promise<void>;
  deletePoll: (voteId: string) => Promise<void>;
  viewPollResults: (voteId: string) => Promise<void>;
}

// ======================================================
// DATA TRANSFORMATION
// ======================================================

// Transformar datos de API al formato interno
const transformApiPollsToVotes = (apiPolls: ApiPoll[]): Vote[] => {
  return apiPolls.map((poll, index) => ({
    id: poll.token,
    title: poll.name,
    description: `Encuesta: ${poll.name}`,
    shortDescription: poll.name.length > 50 ? poll.name.substring(0, 47) + '...' : poll.name,
    status: poll.active ? 'active' : 'closed' as 'active' | 'closed',
    startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    category: ['Gobierno', 'Desarrollo', 'Educación', 'Salud', 'Transporte'][index % 5],
    options: poll.options.map((option) => ({
      id: option.selection.toString(),
      text: option.choice,
      votes: Math.floor(Math.random() * 100), // Placeholder, se actualiza con resultados reales
      selection: option.selection
    })),
    createdBy: poll.owner ? 'user' : 'system',
    createdAt: new Date(),
    totalVotes: Math.floor(Math.random() * 500),
    userVotes: {},
    apiPoll: poll
  }));
};

// Generar categorías aleatorias pero consistentes
const getCategoryForIndex = (index: number): string => {
  const categories = ['Gobierno', 'Desarrollo', 'Educación', 'Salud', 'Transporte'];
  return categories[index % categories.length];
};

// ======================================================
// USER HELPERS
// ======================================================

const getUserFromStorage = (): User | null => {
  try {
    return getStoredUser();
  } catch {
    return null;
  }
};

const clearAuthData = async () => {
  try {
    await signOutFirebase();
    console.log('🚪 [CONTEXT] Datos de autenticación limpiados');
  } catch (error) {
    console.error('Error limpiando autenticación:', error);
  }
};

// ======================================================
// MOCK DATA FALLBACK
// ======================================================

const mockVotes: Vote[] = [
  {
    id: '1',
    title: 'Presupuesto Municipal 2024',
    description: 'Votación para decidir la distribución del presupuesto municipal',
    shortDescription: 'Presupuesto Municipal 2024',
    status: 'active',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-12-15'),
    category: 'Gobierno',
    options: [
      { id: '1a', text: 'Priorizar infraestructura', votes: 45 },
      { id: '1b', text: 'Invertir en educación', votes: 62 },
      { id: '1c', text: 'Mejorar servicios de salud', votes: 38 }
    ],
    createdBy: 'system',
    createdAt: new Date('2024-01-01'),
    totalVotes: 145,
    userVotes: {}
  },
  {
    id: '2',
    title: 'Nuevo Parque Recreativo',
    description: 'Propuesta para construcción de parque en el sector norte',
    shortDescription: 'Nuevo Parque Recreativo',
    status: 'active',
    startDate: new Date('2024-01-10'),
    endDate: new Date('2024-12-30'),
    category: 'Desarrollo',
    options: [
      { id: '2a', text: 'Aprobar construcción', votes: 78 },
      { id: '2b', text: 'Rechazar propuesta', votes: 22 }
    ],
    createdBy: 'system',
    createdAt: new Date('2024-01-05'),
    totalVotes: 100,
    userVotes: {}
  }
];

// ======================================================
// CONTEXT
// ======================================================

const initialState: VoteAppState = {
  user: null,
  currentScreen: 'loading',
  selectedVote: null,
  votes: [],
  isLoading: true,
  error: null,
  isDarkMode: false,
  searchQuery: '',
  selectedCategory: 'Todos',
  dataSource: 'api',
  apiStatus: 'checking'
};

const VoteAppContext = createContext<VoteAppContextType | undefined>(undefined);

// ======================================================
// PROVIDER
// ======================================================

export function VoteAppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VoteAppState>(initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  // ======================================================
  // INICIALIZACIÓN
  // ======================================================
  
  useEffect(() => {
    if (!isInitialized) {
      console.log('🚀 [CONTEXT] Inicializando VoteAppProvider...');
      setIsInitialized(true);
      initializeAuth();
    }
  }, [isInitialized]);

  const initializeAuth = async () => {
    try {
      console.log('🔍 [CONTEXT] Verificando autenticación existente...');
      
      // Verificar si hay usuario autenticado en Firebase
      const existingUser = await checkExistingAuth();
      
      if (existingUser) {
        console.log('👤 [CONTEXT] Usuario encontrado:', existingUser.name);
        setState(prev => ({
          ...prev,
          user: existingUser,
          currentScreen: 'voting-list',
          isLoading: false
        }));
        
        // Solo cargar votaciones si hay usuario autenticado
        console.log('📊 [CONTEXT] Cargando votaciones...');
        await loadVotingsInternal();
      } else {
        console.log('ℹ️ [CONTEXT] No hay autenticación, mostrando login');
        setState(prev => ({
          ...prev,
          currentScreen: 'login',
          isLoading: false
        }));
      }
      
    } catch (error) {
      console.error('❌ [CONTEXT] Error en inicialización:', error);
      setState(prev => ({
        ...prev,
        error: 'Error inicializando la aplicación',
        currentScreen: 'login', // Mostrar login en caso de error
        isLoading: false
      }));
    }
  };

  // ======================================================
  // API FUNCTIONS
  // ======================================================

  const loadVotingsInternal = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, apiStatus: 'checking' }));
      
      // Verificar si hay usuario autenticado antes de intentar cargar datos
      const storedUser = getUserFromStorage();
      if (!storedUser) {
        console.log('⚠️ [CONTEXT] No hay usuario autenticado, usando datos mock');
        setState(prev => ({
          ...prev,
          votes: mockVotes,
          dataSource: 'mock',
          apiStatus: 'unavailable',
          isLoading: false
        }));
        return;
      }
      
      // Verificar si tenemos JWT para Sebastian API
      const storedJWT = getStoredJWT();
      if (!storedJWT) {
        console.log('⚠️ [CONTEXT] No hay JWT de Sebastian, usando datos mock');
        setState(prev => ({
          ...prev,
          votes: mockVotes,
          dataSource: 'mock',
          apiStatus: 'unavailable',
          isLoading: false
        }));
        return;
      }
      
      console.log('📊 [CONTEXT] Obteniendo encuestas desde API...');
      const apiPolls = await fetchPolls();
      console.log('✅ [CONTEXT] Datos recibidos:', apiPolls);
      
      if (!apiPolls || apiPolls.length === 0) {
        setState(prev => ({
          ...prev,
          votes: [],
          currentScreen: 'empty',
          dataSource: 'api',
          apiStatus: 'available',
          isLoading: false
        }));
        return;
      }
      
      // Transformar datos al formato interno
      const transformedVotes = transformApiPollsToVotes(apiPolls);
      console.log('🔄 [CONTEXT] Datos transformados:', transformedVotes.length);
      
      setState(prev => ({
        ...prev,
        votes: transformedVotes,
        dataSource: 'api',
        apiStatus: 'available',
        isLoading: false
      }));
      
    } catch (error) {
      console.error('❌ [CONTEXT] Error cargando votaciones:', error);
      
      // Fallback a datos mock
      console.warn('🎭 [CONTEXT] Fallback a datos mock');
      setState(prev => ({
        ...prev,
        votes: mockVotes,
        dataSource: 'mock',
        apiStatus: 'error',
        isLoading: false,
        error: null // Limpiar el error ya que tenemos fallback
      }));
    }
  };

  // ======================================================
  // CONTEXT FUNCTIONS
  // ======================================================

  const login = async (useRedirect = false) => {
    try {
      console.log('🔐 [CONTEXT] Iniciando proceso de login híbrido...');
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const user = await performHybridLogin(useRedirect);
      
      setState(prev => ({
        ...prev,
        user,
        currentScreen: 'voting-list',
        isLoading: false
      }));
      
      // Cargar votaciones
      await loadVotingsInternal();
      
    } catch (error: any) {
      console.error('❌ [CONTEXT] Error en login:', error);
      
      let errorMessage = 'Error al iniciar sesión. Intenta nuevamente.';
      
      if (error.message === 'popup-blocked') {
        throw error; // Dejar que LoginScreen maneje esto
      } else if (error.message?.includes('network')) {
        errorMessage = 'Error de conexión. Verifica tu internet.';
      } else if (error.message?.includes('canceled')) {
        errorMessage = 'Autenticación cancelada.';
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 [CONTEXT] Cerrando sesión...');
      await clearAuthData();
      setState(initialState);
      // Dar un momento para que se limpie el estado antes de recargar
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('❌ [CONTEXT] Error en logout:', error);
      // Forzar logout incluso si hay error
      setState(initialState);
      window.location.reload();
    }
  };

  const loadVotings = async () => {
    console.log('🔄 [CONTEXT] Recargando votaciones...');
    await loadVotingsInternal();
  };

  const navigateTo = (screen: Screen, vote?: Vote) => {
    setState(prev => ({
      ...prev,
      currentScreen: screen,
      selectedVote: vote || null,
      error: null
    }));
  };

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const toggleDarkMode = () => {
    setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
    document.documentElement.classList.toggle('dark');
  };

  const setSearchQuery = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  };

  const setSelectedCategory = (category: string) => {
    setState(prev => ({ ...prev, selectedCategory: category }));
  };

  const submitVote = async (voteId: string, optionId: string) => {
    console.log('🗳️ [CONTEXT] Enviando voto:', voteId, '->', optionId);
    
    if (!state.user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Encontrar el voto y la opción
      const vote = state.votes.find(v => v.id === voteId);
      if (!vote) {
        throw new Error('Encuesta no encontrada');
      }
      
      const option = vote.options.find(o => o.id === optionId);
      if (!option) {
        throw new Error('Opción no encontrada');
      }
      
      // Enviar voto a la API
      await submitVoteAPI(voteId, option.selection);
      
      // Actualizar estado local
      setState(prev => ({
        ...prev,
        votes: prev.votes.map(v =>
          v.id === voteId
            ? { ...v, userVote: optionId }
            : v
        ),
        isLoading: false
      }));
      
      showSuccess();
      
    } catch (error: any) {
      console.error('❌ [CONTEXT] Error enviando voto:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error.message || 'Error enviando voto'
      }));
      throw error;
    }
  };

  const showSuccess = () => {
    setState(prev => ({ ...prev, currentScreen: 'success' }));
    setTimeout(() => {
      navigateTo('voting-list');
    }, 2000);
  };

  const createNewPoll = async (pollData: { name: string; options: Array<{ choice: string }> }) => {
    console.log('📋 [CONTEXT] Creando nueva encuesta:', pollData.name);
    
    if (!state.user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const newApiPoll = {
        name: pollData.name,
        active: true,
        owner: true,
        options: pollData.options.map((opt, index) => ({
          selection: index + 1,
          choice: opt.choice
        }))
      };
      
      const createdPoll = await createPoll(newApiPoll);
      
      // Transformar y agregar al estado
      const newVote = transformApiPollsToVotes([createdPoll])[0];
      
      setState(prev => ({
        ...prev,
        votes: [...prev.votes, newVote],
        isLoading: false
      }));
      
      console.log('✅ [CONTEXT] Encuesta creada exitosamente');
      
    } catch (error: any) {
      console.error('❌ [CONTEXT] Error creando encuesta:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error.message || 'Error creando encuesta'
      }));
      throw error;
    }
  };

  const updatePollFunction = async (vote: Vote) => {
    console.log('✏️ [CONTEXT] Actualizando encuesta:', vote.id);
    
    if (!state.user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      if (!vote.apiPoll) {
        throw new Error('Datos de la encuesta no disponibles');
      }
      
      const updatedApiPoll = {
        ...vote.apiPoll,
        name: vote.title,
        active: vote.status === 'active'
      };
      
      const updatedPoll = await updatePoll(updatedApiPoll);
      
      // Actualizar en el estado
      const updatedVote = transformApiPollsToVotes([updatedPoll])[0];
      
      setState(prev => ({
        ...prev,
        votes: prev.votes.map(v => v.id === vote.id ? updatedVote : v),
        isLoading: false
      }));
      
      console.log('✅ [CONTEXT] Encuesta actualizada exitosamente');
      
    } catch (error: any) {
      console.error('❌ [CONTEXT] Error actualizando encuesta:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error.message || 'Error actualizando encuesta'
      }));
      throw error;
    }
  };

  const deletePollFunction = async (voteId: string) => {
    console.log('🗑️ [CONTEXT] Eliminando encuesta:', voteId);
    
    if (!state.user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      await deletePoll(voteId);
      
      // Eliminar del estado
      setState(prev => ({
        ...prev,
        votes: prev.votes.filter(v => v.id !== voteId),
        isLoading: false
      }));
      
      console.log('✅ [CONTEXT] Encuesta eliminada exitosamente');
      
    } catch (error: any) {
      console.error('❌ [CONTEXT] Error eliminando encuesta:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error.message || 'Error eliminando encuesta'
      }));
      throw error;
    }
  };

  const viewPollResults = async (voteId: string) => {
    console.log('📈 [CONTEXT] Obteniendo resultados:', voteId);
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const results = await fetchPollResults(voteId);
      
      // Actualizar voto con resultados reales
      setState(prev => ({
        ...prev,
        votes: prev.votes.map(vote => {
          if (vote.id === voteId) {
            const updatedOptions = vote.options.map(option => {
              const result = results.results.find(r => r.choice === option.text);
              return {
                ...option,
                votes: result ? result.total : 0
              };
            });
            
            return {
              ...vote,
              options: updatedOptions,
              totalVotes: results.results.reduce((total, r) => total + r.total, 0)
            };
          }
          return vote;
        }),
        isLoading: false
      }));
      
      console.log('✅ [CONTEXT] Resultados obtenidos exitosamente');
      
    } catch (error: any) {
      console.error('❌ [CONTEXT] Error obteniendo resultados:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error.message || 'Error obteniendo resultados'
      }));
      throw error;
    }
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <VoteAppContext.Provider value={{
      state,
      login,
      logout,
      navigateTo,
      setLoading,
      setError,
      toggleDarkMode,
      setSearchQuery,
      setSelectedCategory,
      submitVote,
      showSuccess,
      loadVotings,
      createNewPoll,
      updatePoll: updatePollFunction,
      deletePoll: deletePollFunction,
      viewPollResults
    }}>
      {children}
    </VoteAppContext.Provider>
  );
}

// ======================================================
// HOOK
// ======================================================

export function useVoteApp() {
  const context = useContext(VoteAppContext);
  if (context === undefined) {
    throw new Error('useVoteApp debe ser usado dentro de un VoteAppProvider');
  }
  return context;
}

// ======================================================
// HELPERS
// ======================================================

export const getCategoryColor = (category: string) => {
  const colors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    'Gobierno': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700', icon: 'text-blue-600 dark:text-blue-400' },
    'Desarrollo': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-700', icon: 'text-green-600 dark:text-green-400' },
    'Educación': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-700', icon: 'text-purple-600 dark:text-purple-400' },
    'Salud': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-700', icon: 'text-red-600 dark:text-red-400' },
    'Transporte': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-700', icon: 'text-yellow-600 dark:text-yellow-400' },
    'Todos': { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-600', icon: 'text-slate-600 dark:text-slate-400' }
  };
  return colors[category] || colors['Todos'];
};