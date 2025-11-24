import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithPopup, 
  signInWithRedirect, 
  GoogleAuthProvider, 
  getAuth, 
  onAuthStateChanged,
  User as FirebaseUser,
  getRedirectResult
} from 'firebase/auth';
import app from '../lib/firebase';

// ======================================================
// INTERFACES
// ======================================================

interface User {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  firebaseUid: string;
  googleAccessToken?: string; // Almacenar el access token de Google
  googleIdToken?: string; // Almacenar el ID token de Google (lo que necesita Sebastian.cl)
}

interface VoteOption {
  id: string;
  text: string;
  votes: number;
}

interface Vote {
  id: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  description: string; // Campo adicional para descripción
  options: VoteOption[];
  startDate: Date;
  endDate: Date;
  category: string;
  status: 'active' | 'closed';
  createdBy: string;
  imageUrl?: string;
}

interface UserVote {
  id: string;
  userId: string;
  voteId: string;
  selectedOptionId: string;
  timestamp: Date;
}

interface VoteAppState {
  user: User | null;
  currentScreen: 'home' | 'login' | 'voting-list' | 'voting-detail' | 'profile' | 'loading' | 'empty' | 'success' | 'error' | 'poll-management';
  selectedVote: Vote | null;
  votes: Vote[];
  userVotes: UserVote[];
  isLoading: boolean;
  error: string | null;
  isDarkMode: boolean;
  searchQuery: string;
  selectedCategory: string;
  dataSource: 'api' | 'loading';
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
  loadVotings: (user?: User) => Promise<void>;
  // Nuevas funciones para gestión de encuestas
  createPoll: (pollData: { name: string; options: { selection: number; choice: string; }[]; token?: string; }) => Promise<any>;
  updatePoll: (pollData: { token: string; name: string; active: boolean; options: { selection: number; choice: string; }[]; }) => Promise<any>;
  getPollDetails: (pollToken: string) => Promise<any>;
  deletePoll: (pollToken: string) => Promise<any>;
}

// ======================================================
// FIREBASE CONFIGURATION
// ======================================================

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.addScope('openid');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');

// Forzar obtención de ID Token de Google
googleProvider.setCustomParameters({
  'access_type': 'offline',
  'prompt': 'consent'
});

// ======================================================
// CONTEXT
// ======================================================

const VoteAppContext = createContext<VoteAppContextType | undefined>(undefined);

export function VoteAppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VoteAppState>({
    user: null,
    currentScreen: 'loading',
    selectedVote: null,
    votes: [],
    userVotes: [],
    isLoading: true,
    error: null,
    isDarkMode: false,
    searchQuery: '',
    selectedCategory: 'Todos',
    dataSource: 'loading'
  });

  // ======================================================
  // FIREBASE AUTH FUNCTIONS
  // ======================================================

  const signInWithGoogle = async (useRedirect = true): Promise<User> => {
    console.log('🔐 [FIREBASE] Iniciando autenticación con Google...');
    
    try {
      let result;
      
      if (useRedirect) {
        console.log('🔄 [FIREBASE] Usando redirect...');
        await signInWithRedirect(auth, googleProvider);
        // El resultado se obtiene después del redirect
        return new Promise((resolve, reject) => {
          const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
              unsubscribe();
              try {
                // En redirect, no tenemos acceso fácil al Google token
                const appUser = await createUserFromFirebase(user);
                resolve(appUser);
              } catch (error) {
                reject(error);
              }
            }
          });
        });
      } else {
        console.log('🪟 [FIREBASE] Usando popup...');
        try {
          result = await signInWithPopup(auth, googleProvider);
          
          if (!result?.user) {
            throw new Error('No se pudo obtener información del usuario');
          }
          
          // Obtener tokens de Google del resultado
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const googleAccessToken = credential?.accessToken;
          const googleIdToken = credential?.idToken; // Esto es lo que necesita Sebastian.cl
          
          const appUser = await createUserFromFirebase(result.user, googleAccessToken, googleIdToken);
          
          console.log('✅ [FIREBASE] Usuario autenticado:', appUser.name);
          console.log('🔑 [FIREBASE] Google Access Token guardado:', googleAccessToken ? 'SÍ' : 'NO');
          console.log('🆔 [FIREBASE] Google ID Token guardado:', googleIdToken ? 'SÍ' : 'NO');
          
          return appUser;
        } catch (popupError) {
          console.error('❌ [FIREBASE] Error con popup:', popupError);
          throw popupError;
        }
      }
      
      return appUser;
      
    } catch (error: any) {
      console.error('❌ [FIREBASE] Error en autenticación:', error);
      
      if (error.code === 'auth/popup-blocked') {
        throw new Error('popup-blocked');
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Autenticación cancelada por el usuario');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Error de conexión. Verifica tu internet.');
      }
      
      throw new Error(error.message || 'Error de autenticación');
    }
  };

  const createUserFromFirebase = async (firebaseUser: FirebaseUser, googleAccessToken?: string, googleIdToken?: string): Promise<User> => {
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'Usuario',
      email: firebaseUser.email || '',
      photoUrl: firebaseUser.photoURL || '',
      firebaseUid: firebaseUser.uid,
      googleAccessToken: googleAccessToken,
      googleIdToken: googleIdToken
    };
  };

  const checkExistingAuth = async (): Promise<User | null> => {
    console.log('🔍 [FIREBASE] Verificando autenticación existente...');
    
    try {
      // Verificar redirect result primero
      const result = await getRedirectResult(auth);
      if (result?.user) {
        console.log('🔄 [FIREBASE] Usuario desde redirect encontrado');
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const googleAccessToken = credential?.accessToken;
        const googleIdToken = credential?.idToken;
        const user = await createUserFromFirebase(result.user, googleAccessToken, googleIdToken);
        return user;
      }
    } catch (error) {
      console.warn('⚠️ [FIREBASE] Error verificando redirect:', error);
    }
    
    // Verificar usuario actual
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        if (user) {
          console.log('👤 [FIREBASE] Usuario actual encontrado:', user.email);
          try {
            const appUser = await createUserFromFirebase(user); // Sin Google token en reconexión
            resolve(appUser);
          } catch (error) {
            console.error('❌ [FIREBASE] Error creando usuario:', error);
            resolve(null);
          }
        } else {
          console.log('👤 [FIREBASE] No hay usuario autenticado');
          resolve(null);
        }
      });
    });
  };

  const signOutFirebase = async () => {
    console.log('🚪 [FIREBASE] Cerrando sesión...');
    await auth.signOut();
  };

  // ======================================================
  // INITIALIZATION
  // ======================================================

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🚀 [AUTH] Inicializando autenticación...');
      
      try {
        // Primero, verificar si hay un resultado de redirect pendiente
        const redirectResult = await getRedirectResult(auth);
        
        if (redirectResult?.user) {
          console.log('🔄 [AUTH] Resultado de redirect encontrado');
          
          // Obtener tokens de Google del resultado de redirect
          const credential = GoogleAuthProvider.credentialFromResult(redirectResult);
          const googleAccessToken = credential?.accessToken;
          const googleIdToken = credential?.idToken;
          
          const appUser = await createUserFromFirebase(redirectResult.user, googleAccessToken, googleIdToken);
          
          console.log('✅ [AUTH] Usuario autenticado vía redirect:', appUser.name);
          console.log('🔑 [AUTH] Google Access Token:', googleAccessToken ? 'SÍ' : 'NO');
          console.log('🆔 [AUTH] Google ID Token:', googleIdToken ? 'SÍ' : 'NO');
          
          setState(prev => ({
            ...prev,
            user: appUser,
            currentScreen: 'voting-list',
            isLoading: false
          }));
          
          // Cargar votaciones automáticamente
          await loadVotings();
          return;
        }
        
        // Si no hay redirect, verificar usuario existente
        const existingUser = await checkExistingAuth();
        
        if (existingUser) {
          console.log('👤 [AUTH] Usuario existente encontrado:', existingUser.name);
          setState(prev => ({
            ...prev,
            user: existingUser,
            currentScreen: 'voting-list',
            isLoading: false
          }));
          
          // Cargar votaciones automáticamente
          await loadVotings();
        } else {
          console.log('👤 [AUTH] No hay usuario autenticado');
          setState(prev => ({
            ...prev,
            currentScreen: 'login',
            isLoading: false
          }));
        }
      } catch (error) {
        console.error('❌ [AUTH] Error en inicialización:', error);
        setState(prev => ({
          ...prev,
          currentScreen: 'login',
          isLoading: false,
          error: 'Error de inicialización'
        }));
      }
    };
    
    initializeAuth();
  }, []);

  // Inicialización del dark mode
  useEffect(() => {
    // Restaurar preferencia de dark mode desde localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    const prefersDark = savedDarkMode === 'true' || 
      (savedDarkMode === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setState(prev => ({ ...prev, isDarkMode: prefersDark }));
    
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // ======================================================
  // API FUNCTIONS (USANDO TU PROPIA API)
  // ======================================================

  // Función helper para obtener el token de Google ID Token (lo que necesita Sebastian.cl)
  const getAuthToken = async (user?: User): Promise<string> => {
    console.log('🎫 [TOKEN] Verificando usuario autenticado...');
    
    const currentUser = user || state.user;
    
    if (!auth.currentUser || !currentUser) {
      console.log('❌ [TOKEN] No hay usuario autenticado');
      throw new Error('Usuario no autenticado');
    }
    
    console.log('👤 [TOKEN] Usuario encontrado:', auth.currentUser.email);
    
    // Primero intentar usar el Google ID Token guardado
    if (currentUser.googleIdToken) {
      console.log('✅ [TOKEN] Usando Google ID Token guardado (lo que necesita Sebastian.cl)');
      console.log('🆔 [TOKEN] Google ID Token:', currentUser.googleIdToken.substring(0, 50) + '...');
      return currentUser.googleIdToken;
    }
    
    // Si no tenemos Google ID Token, usar Firebase como fallback
    console.log('⚠️ [TOKEN] No hay Google ID Token, usando Firebase Token como fallback');
    console.log('🔄 [TOKEN] Obteniendo ID Token de Firebase...');
    
    const firebaseToken = await auth.currentUser.getIdToken();
    console.log('✅ [TOKEN] Token de Firebase obtenido:', firebaseToken.substring(0, 50) + '...');
    
    return firebaseToken;
  };

  const loadVoteResults = async (votes: Vote[]) => {
    console.log('📊 [RESULTS] Cargando resultados de votaciones...');
    
    try {
      const jwtToken = await getAuthToken();
      
      // Cargar resultados para cada encuesta en paralelo
      const resultsPromises = votes.map(async (vote) => {
        try {
          const response = await fetch(`/api/sebastian/vote/v1/vote/${vote.id}/results`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${jwtToken}`,
              'accept': 'application/json'
            }
          });
          
          if (response.ok) {
            const results = await response.json();
            console.log(`📈 [RESULTS] Resultados para ${vote.title}:`, results);
            
            // Actualizar opciones con conteos reales
            const updatedOptions = vote.options.map(option => {
              const result = results.results.find((r: any) => r.choice === option.text);
              return {
                ...option,
                votes: result ? result.total : 0
              };
            });
            
            return { ...vote, options: updatedOptions };
          } else {
            console.warn(`⚠️ [RESULTS] No se pudieron cargar resultados para: ${vote.title}`);
            return vote; // Retornar sin cambios si hay error
          }
        } catch (error) {
          console.warn(`⚠️ [RESULTS] Error cargando resultados para ${vote.title}:`, error);
          return vote; // Retornar sin cambios si hay error
        }
      });
      
      const votesWithResults = await Promise.all(resultsPromises);
      
      // Actualizar estado con los resultados
      setState(prev => ({
        ...prev,
        votes: votesWithResults
      }));
      
      console.log('✅ [RESULTS] Resultados cargados para todas las encuestas');
      
    } catch (error) {
      console.error('❌ [RESULTS] Error general cargando resultados:', error);
      // No hacer nada crítico, las encuestas seguirán funcionando sin conteos
    }
  };

  const loadVotings = async (user?: User) => {
    console.log('📊 [API] Cargando encuestas desde Sebastian.cl...');
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const jwtToken = await getAuthToken(user);
      console.log('🔐 [API] Token JWT obtenido para Sebastian.cl');
      console.log('📤 [API] Conectando con Sebastian.cl:', jwtToken.substring(0, 60) + '...');
      console.log('🎫 [API] Tipo de token:', jwtToken.startsWith('ya29') ? 'Google Access Token' : 'Firebase ID Token');
      console.log('🎫 [API] Token completo para debug:', jwtToken);
      
      // Conectar con Sebastian.cl API a través del proxy
      const response = await fetch('/api/sebastian/vote/v1/polls/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🌐 [API] Response status:', response.status);
      console.log('🌐 [API] Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [API] Error response body:', errorText);
        throw new Error(`Error en API Sebastian.cl: ${response.status} ${response.statusText}`);
      }
      
      const sebastianData = await response.json();
      console.log('📊 [API] Datos recibidos de Sebastian.cl:', sebastianData.length || 0, 'encuestas');
      
      // Transformar datos de Sebastian.cl al formato de la app
      const transformedVotes: Vote[] = sebastianData
        .filter((poll: any) => poll.active) // Solo encuestas activas
        .map((poll: any) => ({
          id: poll.token,
          title: poll.name,
          shortDescription: `Encuesta con ${poll.options?.length || 0} opciones disponibles`,
          longDescription: poll.name,
          description: poll.name, // Añadir campo description
          options: poll.options?.map((option: any) => ({
            id: option.selection.toString(),
            text: option.choice,
            votes: 0 // Se actualizará con los resultados
          })) || [],
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días desde ahora
          category: 'Educación', // Todas son de UTEM, categoría educación
          status: 'active' as const,
          createdBy: 'Sebastian.cl',
          imageUrl: undefined
        }));
      
      setState(prev => ({
        ...prev,
        votes: transformedVotes,
        dataSource: 'api',
        isLoading: false
      }));
      
      console.log('✅ [API] Estado actualizado con encuestas:');
      console.log('  - Encuestas cargadas:', transformedVotes.length);
      console.log('  - DataSource:', 'api');
      console.log('  - IsLoading:', false);
      console.log('  - Encuestas detalladas:', transformedVotes);
      console.log('✅ [API] Carga completada -', transformedVotes.length, 'encuestas activas desde Sebastian.cl');
      
      // Cargar resultados para todas las encuestas en paralelo
      await loadVoteResults(transformedVotes);
      
    } catch (error) {
      console.error('❌ [API] Error cargando desde Sebastian.cl:', error);
      setState(prev => ({
        ...prev,
        error: `Error conectando con Sebastian.cl: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        isLoading: false,
        votes: [] // Lista vacía en caso de error
      }));
    }
  };

  // ======================================================
  // SEBASTIAN.CL API ENDPOINTS
  // ======================================================

  // ✅ Ya implementado: loadVotings() - GET /v1/polls/
  // ✅ Ya implementado: submitVote() - POST /v1/vote/election  
  // ✅ Ya implementado: loadVoteResults() - GET /v1/vote/{pollToken}/results

  const createPoll = async (pollData: {
    name: string;
    options: { selection: number; choice: string; }[];
    token?: string;
  }) => {
    try {
      console.log('🆕 [CREATE_POLL] Creando nueva encuesta...');
      
      const jwtToken = await getAuthToken();
      const requestBody = {
        token: pollData.token || `poll_${Date.now()}`, // Generar token único si no se proporciona
        name: pollData.name,
        options: pollData.options
      };
      
      console.log('📤 [CREATE_POLL] Datos de la encuesta:', requestBody);
      
      const response = await fetch('/api/sebastian/vote/v1/polls/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [CREATE_POLL] Error:', response.status, errorText);
        throw new Error(`Error creando encuesta: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ [CREATE_POLL] Encuesta creada:', result);
      
      // Recargar encuestas para mostrar la nueva
      await loadVotings();
      
      return result;
    } catch (error) {
      console.error('❌ [CREATE_POLL] Error creando encuesta:', error);
      throw error;
    }
  };

  const updatePoll = async (pollData: {
    token: string;
    name: string;
    active: boolean;
    options: { selection: number; choice: string; }[];
  }) => {
    try {
      console.log('🔄 [UPDATE_POLL] Actualizando encuesta...');
      
      const jwtToken = await getAuthToken();
      
      console.log('📤 [UPDATE_POLL] Datos de actualización:', pollData);
      
      const response = await fetch('/api/sebastian/vote/v1/polls/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pollData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [UPDATE_POLL] Error:', response.status, errorText);
        
        let errorMessage = `Error actualizando encuesta: ${response.status}`;
        if (response.status === 500) {
          try {
            const errorObj = JSON.parse(errorText);
            if (errorObj.detail && errorObj.detail.includes('No tiene permiso')) {
              errorMessage = 'No tienes permisos para actualizar esta encuesta (solo el creador puede modificarla)';
            }
          } catch {}
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('✅ [UPDATE_POLL] Encuesta actualizada:', result);
      
      // Recargar encuestas para mostrar los cambios
      await loadVotings();
      
      return result;
    } catch (error) {
      console.error('❌ [UPDATE_POLL] Error actualizando encuesta:', error);
      throw error;
    }
  };

  const getPollDetails = async (pollToken: string) => {
    try {
      console.log('🔍 [GET_POLL] Obteniendo detalles de encuesta...');
      
      const jwtToken = await getAuthToken();
      
      const response = await fetch(`/api/sebastian/vote/v1/polls/${pollToken}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [GET_POLL] Error:', response.status, errorText);
        throw new Error(`Error obteniendo encuesta: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ [GET_POLL] Detalles obtenidos:', result);
      
      return result;
    } catch (error) {
      console.error('❌ [GET_POLL] Error obteniendo encuesta:', error);
      throw error;
    }
  };

  const deletePoll = async (pollToken: string) => {
    try {
      console.log('🗑️ [DELETE_POLL] Eliminando encuesta...');
      
      const jwtToken = await getAuthToken();
      
      const response = await fetch(`/api/sebastian/vote/v1/polls/${pollToken}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [DELETE_POLL] Error:', response.status, errorText);
        
        let errorMessage = `Error eliminando encuesta: ${response.status}`;
        if (response.status === 500) {
          try {
            const errorObj = JSON.parse(errorText);
            if (errorObj.detail && errorObj.detail.includes('No tiene permiso')) {
              errorMessage = 'No tienes permisos para eliminar esta encuesta (solo el creador puede eliminarla)';
            }
          } catch {}
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('✅ [DELETE_POLL] Encuesta eliminada:', result);
      
      // Recargar encuestas para reflejar la eliminación
      await loadVotings();
      
      return result;
    } catch (error) {
      console.error('❌ [DELETE_POLL] Error eliminando encuesta:', error);
      throw error;
    }
  };

  // ======================================================
  // CONTEXT ACTIONS (funciones ya existentes)
  // ======================================================

  const login = async (useRedirect = true) => {
    try {
      console.log('🔐 [LOGIN] Iniciando login...');
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const user = await signInWithGoogle(useRedirect);
      
      setState(prev => ({
        ...prev,
        user,
        currentScreen: 'voting-list',
        isLoading: false
      }));
      
      // Cargar votaciones después del login, pasando el usuario
      await loadVotings(user);
      
      console.log('✅ [LOGIN] Login exitoso:', user.name);
    } catch (error) {
      console.error('❌ [LOGIN] Error en login:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error de autenticación'
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 [LOGOUT] Cerrando sesión...');
      await signOutFirebase();
      
      setState(prev => ({
        ...prev,
        currentScreen: 'login',
        user: null,
        selectedVote: null,
        votes: [],
        userVotes: [],
        searchQuery: '',
        selectedCategory: 'Todos',
        dataSource: 'loading'
      }));
      
      console.log('✅ [LOGOUT] Sesión cerrada');
    } catch (error) {
      console.error('❌ [LOGOUT] Error en logout:', error);
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
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const toggleDarkMode = () => {
    setState(prev => {
      const newDarkMode = !prev.isDarkMode;
      // Aplicar/quitar clase dark del elemento HTML
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'false');
      }
      return { ...prev, isDarkMode: newDarkMode };
    });
  };

  const setSearchQuery = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  };

  const setSelectedCategory = (category: string) => {
    setState(prev => ({ ...prev, selectedCategory: category }));
  };

  const submitVote = async (voteId: string, optionId: string) => {
    try {
      console.log('🗳️ [VOTE] Enviando voto a Sebastian.cl...');
      console.log('🗳️ [VOTE] Parámetros recibidos - voteId:', voteId, 'optionId:', optionId);
      
      if (!voteId || !optionId) {
        throw new Error('Parámetros de voto inválidos');
      }
      
      const jwtToken = await getAuthToken();
      console.log('🔐 [VOTE] Token JWT listo para Sebastian.cl');
      console.log('📤 [VOTE] Enviando voto - Token:', jwtToken.substring(0, 60) + '...');
      console.log('🗳️ [VOTE] Parámetros finales - voteId:', voteId, 'optionId:', optionId);
      
      const requestUrl = `/api/sebastian/vote/v1/vote/election`;
      const requestBody = {
        pollToken: voteId, // Sebastian.cl espera pollToken, no el ID en la URL
        selection: parseInt(optionId) // Sebastian.cl espera un número
      };
      
      console.log('📡 [VOTE] URL de solicitud:', requestUrl);
      console.log('📦 [VOTE] Cuerpo de la solicitud:', JSON.stringify(requestBody));
      
      // Enviar voto a Sebastian.cl API a través del proxy
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📨 [VOTE] Respuesta recibida - Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [VOTE] Error en Sebastian.cl:', response.status, errorText);
        
        let errorMessage = `Error enviando voto: ${response.status}`;
        
        // Manejar errores específicos
        if (response.status === 500) {
          try {
            const errorObj = JSON.parse(errorText);
            if (errorObj.detail && errorObj.detail.includes('ya registra un voto')) {
              errorMessage = 'Ya has votado en esta encuesta anteriormente';
            } else {
              errorMessage = errorObj.detail || 'Error interno del servidor';
            }
          } catch {
            errorMessage = 'Ya has votado en esta encuesta o error del servidor';
          }
        } else if (response.status === 409) {
          errorMessage = 'Ya has emitido tu voto en esta encuesta';
        } else if (response.status === 401) {
          errorMessage = 'Sesión expirada, por favor inicia sesión nuevamente';
        } else if (response.status === 404) {
          errorMessage = 'Encuesta no encontrada o inactiva';
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('✅ [VOTE] Voto enviado exitosamente a Sebastian.cl');
      console.log('📊 [VOTE] Resultado completo:', result);
      
      // Registrar el voto localmente para evitar votar de nuevo
      const userVote = {
        id: `${voteId}_${state.user?.id}_${Date.now()}`,
        userId: state.user?.id || '',
        voteId: voteId,
        selectedOptionId: optionId,
        timestamp: new Date()
      };
      
      console.log('📝 [VOTE] Registrando voto localmente:', userVote);
      
      setState(prev => {
        const newState = {
          ...prev,
          userVotes: [...prev.userVotes, userVote]
        };
        console.log('📊 [VOTE] Nuevo estado de userVotes:', newState.userVotes);
        return newState;
      });
      
      console.log('✅ [VOTE] Proceso de votación completado exitosamente');
      
      // Recargar votaciones para obtener resultados actualizados
      console.log('🔄 [VOTE] Recargando votaciones...');
      await loadVotings();
      
    } catch (error) {
      console.error('❌ [VOTE] Error enviando voto a Sebastian.cl:', error);
      throw error;
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
      loadVotings,
      // Nuevas funciones para gestión de encuestas
      createPoll,
      updatePoll,
      getPollDetails,
      deletePoll
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

export const getCategoryColor = (category: string) => {
  const colors: { [key: string]: { bg: string, text: string, border: string } } = {
    'Gobierno': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700' },
    'Desarrollo': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-700' },
    'Transporte': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-700' },
    'Educación': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-700' },
    'Salud': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-700' },
    'Economía': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-700' },
  };
  return colors[category] || colors['Gobierno'];
};