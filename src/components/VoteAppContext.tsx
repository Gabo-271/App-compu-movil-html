import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { getVotes, submitVote as firebaseSubmitVote, getUserVotes, initializeSampleData } from '../lib/firestore';
import { isFirebaseConfigured } from '../lib/firebase';
import type { User, Vote, VoteOption, UserVote } from '../lib/firestore';

// Importación de funciones de API como funciones dinámicas para evitar problemas de módulo
const fetchVotesFromApi = async (): Promise<Vote[]> => {
  try {
    const { fetchVotesFromApi: apiFunction } = await import('../lib/api');
    return await apiFunction();
  } catch (error) {
    console.error('Error importando API:', error);
    throw error;
  }
};

const checkApiAvailability = async (): Promise<boolean> => {
  try {
    const { checkApiAvailability: apiFunction } = await import('../lib/api');
    return await apiFunction();
  } catch (error) {
    console.error('Error verificando API:', error);
    return false;
  }
};

interface VoteAppState {
  user: User | null;
  currentScreen: 'home' | 'login' | 'voting-list' | 'voting-detail' | 'profile' | 'loading' | 'empty' | 'success' | 'error';
  selectedVote: Vote | null;
  votes: Vote[];
  userVotes: UserVote[];
  isLoading: boolean;
  error: string | null;
  isDarkMode: boolean;
  searchQuery: string;
  selectedCategory: string;
  dataSource: 'api' | 'firebase' | 'mock';
  apiStatus: 'checking' | 'available' | 'unavailable' | 'error';
}

interface VoteAppContextType {
  state: VoteAppState;
  login: (useRedirect?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  navigateTo: (screen: VoteAppState['currentScreen'], vote?: Vote) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleDarkMode: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  submitVote: (voteId: string, optionId: string) => Promise<void>;
  showSuccess: () => void;
  loadVotes: () => Promise<void>;
}

const VoteAppContext = createContext<VoteAppContextType | undefined>(undefined);

// Datos mock para modo demo
const mockVotes: Vote[] = [
  {
    id: '1',
    title: 'Presupuesto Municipal 2024',
    description: 'Votación para decidir la distribución del presupuesto municipal del próximo año. Se evaluarán propuestas para mejoras en infraestructura, educación, salud y servicios públicos.',
    shortDescription: 'Distribución del presupuesto municipal para el próximo año',
    status: 'active',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-02-15'),
    category: 'Gobierno',
    options: [
      { id: '1a', text: 'Priorizar infraestructura vial', votes: 45 },
      { id: '1b', text: 'Invertir en educación pública', votes: 62 },
      { id: '1c', text: 'Mejorar servicios de salud', votes: 38 },
      { id: '1d', text: 'Fortalecer seguridad ciudadana', votes: 29 }
    ],
    createdBy: 'system',
    createdAt: new Date('2024-01-01'),
    totalVotes: 174,
    userVotes: {}
  },
  {
    id: '2',
    title: 'Nuevo Parque Recreativo',
    description: 'Propuesta para la construcción de un nuevo parque recreativo en el sector norte de la ciudad.',
    shortDescription: 'Construcción de parque recreativo en sector norte',
    status: 'active',
    startDate: new Date('2024-01-10'),
    endDate: new Date('2024-01-30'),
    category: 'Desarrollo',
    options: [
      { id: '2a', text: 'Aprobar construcción del parque', votes: 78 },
      { id: '2b', text: 'Rechazar la propuesta', votes: 22 }
    ],
    createdBy: 'system',
    createdAt: new Date('2024-01-05'),
    totalVotes: 100,
    userVotes: {}
  },
  {
    id: '3',
    title: 'Sistema de Educación Digital',
    description: 'Implementación de plataforma digital para la educación pública.',
    shortDescription: 'Plataforma digital para educación pública',
    status: 'active',
    startDate: new Date('2024-01-20'),
    endDate: new Date('2024-02-20'),
    category: 'Educación',
    options: [
      { id: '3a', text: 'Implementar plataforma completa', votes: 89 },
      { id: '3b', text: 'Fase piloto en 5 escuelas', votes: 112 },
      { id: '3c', text: 'Posponer implementación', votes: 34 }
    ],
    createdBy: 'system',
    createdAt: new Date('2024-01-10'),
    totalVotes: 235,
    userVotes: {}
  }
];
// Función para obtener colores por categoría
export const getCategoryColor = (category: string) => {
  const colors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    'Gobierno': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-700', icon: 'text-indigo-600 dark:text-indigo-400' },
    'Desarrollo': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-700', icon: 'text-teal-600 dark:text-teal-400' },
    'Transporte': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-700', icon: 'text-orange-600 dark:text-orange-400' },
    'Educación': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-700', icon: 'text-purple-600 dark:text-purple-400' },
    'Salud': { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-700', icon: 'text-rose-600 dark:text-rose-400' },
    'Economía': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-700', icon: 'text-emerald-600 dark:text-emerald-400' },
    'Todos': { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-600', icon: 'text-slate-600 dark:text-slate-400' }
  };
  return colors[category] || colors['Todos'];
};

export function VoteAppProvider({ children }: { children: ReactNode }) {
  const firebaseAuth = useFirebaseAuth();
  
  console.log('🔧 VoteAppProvider - Firebase Auth Estado:');
  console.log('   User:', firebaseAuth.user);
  console.log('   Loading:', firebaseAuth.isLoading);
  console.log('   Error:', firebaseAuth.error);
  console.log('   Firebase configurado:', isFirebaseConfigured());
  
  const [state, setState] = useState<VoteAppState>({
    user: null,
    currentScreen: 'loading', // Siempre empezar con loading
    selectedVote: null,
    votes: [],
    userVotes: [],
    isLoading: true, // Siempre empezar cargando
    error: null,
    isDarkMode: false,
    searchQuery: '',
    selectedCategory: 'Todos',
    dataSource: 'mock', // Por defecto mock
    apiStatus: 'checking' // Verificando API al inicio
  });

  // Cargar votos cuando el usuario se autentica
  useEffect(() => {
    if (firebaseAuth.user && !firebaseAuth.isLoading) {
      console.log('📄 Usuario autenticado, cargando votos...');
      
      if (isFirebaseConfigured()) {
        loadVotes();
        loadUserVotes();
      } else {
        // Modo demo: usar datos mock
        console.log('🎭 Modo demo: usando votos mock');
        setState(prev => ({
          ...prev,
          votes: mockVotes,
          userVotes: [],
          isLoading: false
        }));
      }
    }
  }, [firebaseAuth.user, firebaseAuth.isLoading]);

  // Red de seguridad adicional - timeout en VoteAppContext
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      console.warn('🚨 TIMEOUT EMERGENCIA - Forzando navegación después de 2 segundos');
      setState(prev => {
        if (prev.isLoading) {
          return {
            ...prev,
            isLoading: false,
            currentScreen: 'login',
            user: null
          };
        }
        return prev;
      });
    }, 2000);

    return () => clearTimeout(emergencyTimeout);
  }, []); // Solo ejecutar una vez al montar

  // Sincronizar user de Firebase con state local
  useEffect(() => {
    console.log('🔄 VoteAppContext - Estado Firebase cambió:');
    console.log('   User:', firebaseAuth.user);
    console.log('   Loading:', firebaseAuth.isLoading);
    console.log('   Error:', firebaseAuth.error);
    
    // Lógica simplificada de navegación
    if (firebaseAuth.isLoading && !firebaseAuth.user) {
      // Todavía cargando autenticación Y no hay usuario
      setState(prev => ({
        ...prev,
        isLoading: true,
        currentScreen: 'loading',
        error: firebaseAuth.error
      }));
    } else if (firebaseAuth.user) {
      // Usuario autenticado, ir a la lista de votos
      console.log('   ✅ Usuario autenticado, navegando a voting-list');
      setState(prev => ({
        ...prev,
        user: firebaseAuth.user,
        isLoading: false, // SIEMPRE false cuando hay usuario
        currentScreen: 'voting-list',
        error: firebaseAuth.error
      }));
    } else {
      // No hay usuario, ir a login
      console.log('   ❌ No hay usuario, navegando a login');
      setState(prev => ({
        ...prev,
        user: null,
        isLoading: false,
        currentScreen: 'login',
        error: firebaseAuth.error
      }));
    }
  }, [firebaseAuth.user, firebaseAuth.isLoading, firebaseAuth.error]);

  // Cargar votos cuando el usuario se autentica
  useEffect(() => {
    if (firebaseAuth.user) {
      if (isFirebaseConfigured()) {
        loadVotes();
        loadUserVotes();
      } else {
        // Modo demo: usar datos mock
        setState(prev => ({
          ...prev,
          votes: mockVotes,
          userVotes: [],
          isLoading: false
        }));
      }
    }
  }, [firebaseAuth.user]);

  // Inicializar datos de ejemplo en primera carga (solo si Firebase está configurado)
  useEffect(() => {
    if (isFirebaseConfigured()) {
      const initData = async () => {
        try {
          await initializeSampleData();
        } catch (error) {
          console.error('Error inicializando datos:', error);
        }
      };
      initData();
    }
  }, []);

  const loadVotes = async () => {
    console.log('🚀 [VOTE CONTEXT] === INICIANDO CARGA DE VOTACIONES ===');
    console.log('📊 [VOTE CONTEXT] Estado actual:');
    console.log('  - Fuente de datos:', state.dataSource);
    console.log('  - Estado API:', state.apiStatus);
    console.log('  - Usuario autenticado:', !!firebaseAuth.user);
    console.log('  - Firebase configurado:', isFirebaseConfigured());
    
    try {
      setLoading(true);
      console.log('⏳ [VOTE CONTEXT] Iniciando proceso de carga...');
      
      // Prioridad 1: Intentar cargar desde API
      if (state.dataSource === 'api' || state.dataSource === 'firebase') {
        console.log('🌐 [VOTE CONTEXT] === INTENTANDO CARGA DESDE API ===');
        
        try {
          console.log('🔍 [VOTE CONTEXT] Verificando disponibilidad de API...');
          const isApiReady = await checkApiAvailability();
          console.log('📡 [VOTE CONTEXT] Resultado verificación API:', isApiReady);
          
          if (isApiReady) {
            console.log('✅ [VOTE CONTEXT] API disponible - Cargando votaciones...');
            const apiVotes = await fetchVotesFromApi();
            console.log('📊 [VOTE CONTEXT] Votaciones recibidas de API:', apiVotes.length);
            console.log('📋 [VOTE CONTEXT] Resumen votaciones:', apiVotes.map(v => ({ id: v.id, title: v.title.substring(0, 30) + '...' })));
            
            // Mapear votos y verificar si el usuario ya votó
            const votesWithUserVotes = apiVotes.map(vote => ({
              ...vote,
              userVote: vote.userVotes && firebaseAuth.user ? vote.userVotes[firebaseAuth.user.id] : undefined
            }));
            
            setState(prev => ({
              ...prev,
              votes: votesWithUserVotes,
              dataSource: 'api' as const,
              apiStatus: 'available' as const,
              isLoading: false
            }));
            
            console.log('🎯 [VOTE CONTEXT] === CARGA DESDE API COMPLETADA EXITOSAMENTE ===');
            return;
            
          } else {
            console.log('⚠️ [VOTE CONTEXT] API no disponible - Intentando Firebase...');
            setState(prev => ({ ...prev, apiStatus: 'unavailable' as const }));
          }
          
        } catch (apiError) {
          console.error('❌ [VOTE CONTEXT] Error cargando desde API:', apiError);
          setState(prev => ({ ...prev, apiStatus: 'error' as const }));
        }
      }
      
      // Prioridad 2: Firebase fallback
      if (isFirebaseConfigured() && (state.dataSource === 'firebase' || state.dataSource === 'api')) {
        console.log('🔥 [VOTE CONTEXT] === INTENTANDO CARGA DESDE FIREBASE ===');
        
        try {
          console.log('🔥 [VOTE CONTEXT] Cargando votaciones desde Firebase...');
          const firebaseVotes = await getVotes();
          console.log('📊 [VOTE CONTEXT] Votaciones recibidas de Firebase:', firebaseVotes.length);
          
          // Mapear votos y verificar si el usuario ya votó
          const votesWithUserVotes = firebaseVotes.map(vote => ({
            ...vote,
            userVote: vote.userVotes && firebaseAuth.user ? vote.userVotes[firebaseAuth.user.id] : undefined
          }));
          
          setState(prev => ({
            ...prev,
            votes: votesWithUserVotes,
            dataSource: 'firebase' as const,
            isLoading: false
          }));
          
          console.log('🎯 [VOTE CONTEXT] === CARGA DESDE FIREBASE COMPLETADA ===');
          return;
          
        } catch (firebaseError) {
          console.error('❌ [VOTE CONTEXT] Error cargando desde Firebase:', firebaseError);
        }
      }
      
      // Prioridad 3: Mock data (último recurso)
      console.log('📝 [VOTE CONTEXT] === USANDO DATOS MOCK COMO FALLBACK ===');
      console.log('📊 [VOTE CONTEXT] Votaciones mock cargadas:', mockVotes.length);
      
      setState(prev => ({
        ...prev,
        votes: mockVotes,
        dataSource: 'mock' as const,
        isLoading: false
      }));
      
      console.log('🎯 [VOTE CONTEXT] === CARGA CON DATOS MOCK COMPLETADA ===');
      
    } catch (error: any) {
      console.error('💥 [VOTE CONTEXT] === ERROR CRÍTICO EN CARGA ===');
      console.error('💥 [VOTE CONTEXT] Error:', error);
      console.error('💥 [VOTE CONTEXT] Stack:', error.stack);
      
      setError('Error al cargar las votaciones');
      
      // Último fallback de emergencia
      setState(prev => ({
        ...prev,
        votes: mockVotes,
        dataSource: 'mock' as const,
        isLoading: false
      }));
    }
  };

  const loadUserVotes = async () => {
    if (!firebaseAuth.user) return;
    
    try {
      const userVotesData = await getUserVotes(firebaseAuth.user.id);
      setState(prev => ({
        ...prev,
        userVotes: userVotesData
      }));
    } catch (error) {
      console.error('Error cargando votos del usuario:', error);
    }
  };

  const login = async (useRedirect = false) => {
    try {
      await firebaseAuth.signInWithGoogle(useRedirect);
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseAuth.signOut();
      setState(prev => ({
        ...prev,
        currentScreen: 'login',
        selectedVote: null,
        votes: [],
        userVotes: [],
        searchQuery: '',
        selectedCategory: 'Todos'
      }));
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  };

  const navigateTo = (screen: VoteAppState['currentScreen'], vote?: Vote) => {
    setState(prev => ({
      ...prev,
      currentScreen: screen,
      selectedVote: vote || null
    }));
  };

  const setLoading = (loading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: loading
    }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({
      ...prev,
      error
    }));
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
    if (!firebaseAuth.user) {
      throw new Error('Usuario no autenticado');
    }

    if (!isFirebaseConfigured()) {
      // Modo demo: simular voto
      setState(prev => ({
        ...prev,
        votes: prev.votes.map(vote =>
          vote.id === voteId
            ? { 
                ...vote, 
                userVote: optionId,
                options: vote.options.map(option =>
                  option.id === optionId
                    ? { ...option, votes: option.votes + 1 }
                    : option
                ),
                totalVotes: vote.totalVotes + 1
              }
            : vote
        )
      }));
      return;
    }

    try {
      setLoading(true);
      await firebaseSubmitVote(firebaseAuth.user.id, voteId, optionId);
      
      // Recargar votos para mostrar la actualización
      await loadVotes();
      await loadUserVotes();
    } catch (error) {
      console.error('Error al enviar voto:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = () => {
    setState(prev => ({ ...prev, currentScreen: 'success' }));
    setTimeout(() => {
      setState(prev => ({ ...prev, currentScreen: 'voting-list' }));
    }, 2000);
  };

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
      loadVotes
    }}>
      {children}
    </VoteAppContext.Provider>
  );
}

export function useVoteApp() {
  const context = useContext(VoteAppContext);
  if (context === undefined) {
    throw new Error('useVoteApp must be used within a VoteAppProvider');
  }
  return context;
}