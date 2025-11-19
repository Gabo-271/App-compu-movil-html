// ======================================================
// HYBRID API - Firebase Auth + Sebastian.cl APIs
// ======================================================

import { 
  signInWithPopup, 
  signInWithRedirect, 
  GoogleAuthProvider, 
  getAuth, 
  onAuthStateChanged,
  User as FirebaseUser,
  getRedirectResult
} from 'firebase/auth';
import app from './firebase';

// ======================================================
// CONFIGURATION
// ======================================================

const API_BASE_URL = 'https://api.sebastian.cl';
const AUTH_ENDPOINT = '/Auth/v1/tokens'; // Endpoint correcto según OpenAPI
const VOTE_ENDPOINT = '/vote/v1';

// Configuración Firebase
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// ======================================================
// INTERFACES
// ======================================================

interface User {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  firebaseUid: string;
  googleToken: string;
}

interface ApiCredentials {
  apiToken: string;
  apiKey: string;
}

interface AuthTokenResponse {
  token: string;
  redirectUrl: string;
  created: string;
}

interface JwtResponse {
  jwt: string;
  created: string;
}

interface RequestCodePayload {
  successUrl: string;
  failedUrl: string;
}

export interface Poll {
  token: string;
  name: string;
  active: boolean;
  owner: boolean;
  options: PollOption[];
}

export interface PollOption {
  selection: number;
  choice: string;
}

interface VotePayload {
  pollToken: string;
  selection: number;
}

interface VoteResponse {
  ok: boolean;
  message: string;
  created: string;
}

interface PollResults {
  name: string;
  results: Array<{
    choice: string;
    total: number;
  }>;
}

// ======================================================
// CONFIGURATION HELPERS
// ======================================================

const getApiCredentials = (): ApiCredentials => ({
  apiToken: import.meta.env.VITE_API_TOKEN || 'sebastian.cl',
  apiKey: import.meta.env.VITE_API_KEY || 'aaa-bbb-ccc-ddd'
});

const getAuthHeaders = (): HeadersInit => {
  const creds = getApiCredentials();
  return {
    'Content-Type': 'application/json',
    'X-API-TOKEN': creds.apiToken,
    'X-API-KEY': creds.apiKey,
  };
};

const getVoteHeaders = (jwt: string): HeadersInit => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${jwt}`,
});

// ======================================================
// STORAGE HELPERS
// ======================================================

const STORAGE_KEYS = {
  JWT: 'vote_app_jwt',
  TEMP_TOKEN: 'vote_temp_token',
  USER_DATA: 'vote_user_data'
};

export const getStoredJWT = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.JWT);
  } catch {
    return null;
  }
};

export const setStoredJWT = (jwt: string) => {
  try {
    localStorage.setItem(STORAGE_KEYS.JWT, jwt);
  } catch (error) {
    console.error('Error storing JWT:', error);
  }
};

export const getStoredUser = (): User | null => {
  try {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: User) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user data:', error);
  }
};

export const clearAuthStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.JWT);
    localStorage.removeItem(STORAGE_KEYS.TEMP_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error('Error clearing auth storage:', error);
  }
};

// ======================================================
// FIREBASE AUTHENTICATION
// ======================================================

export const signInWithGoogle = async (useRedirect = false): Promise<User> => {
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
              const hybridUser = await createUserFromFirebase(user);
              resolve(hybridUser);
            } catch (error) {
              reject(error);
            }
          }
        });
      });
    } else {
      console.log('🪟 [FIREBASE] Usando popup...');
      result = await signInWithPopup(auth, googleProvider);
    }
    
    if (!result?.user) {
      throw new Error('No se pudo obtener información del usuario');
    }
    
    const hybridUser = await createUserFromFirebase(result.user);
    console.log('✅ [FIREBASE] Usuario autenticado:', hybridUser.name);
    
    return hybridUser;
    
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

const createUserFromFirebase = async (firebaseUser: FirebaseUser): Promise<User> => {
  const token = await firebaseUser.getIdToken();
  
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || 'Usuario',
    email: firebaseUser.email || '',
    photoUrl: firebaseUser.photoURL || '',
    firebaseUid: firebaseUser.uid,
    googleToken: token
  };
};

export const checkExistingAuth = async (): Promise<User | null> => {
  console.log('🔍 [FIREBASE] Verificando autenticación existente...');
  
  try {
    // Verificar redirect result primero
    const result = await getRedirectResult(auth);
    if (result?.user) {
      console.log('🔄 [FIREBASE] Usuario desde redirect encontrado');
      const user = await createUserFromFirebase(result.user);
      
      // Intentar autenticar con Sebastian API
      try {
        console.log('🔐 [SEBASTIAN] Intentando autenticación automática...');
        await authenticateWithSebastianAPI(user.googleToken);
        setStoredUser(user);
        console.log('✅ [HYBRID] Autenticación completa exitosa');
        return user;
      } catch (error) {
        console.error('❌ [SEBASTIAN] Error en autenticación automática:', error);
        // Guardar el usuario de Firebase aunque falle Sebastian
        // El usuario podrá intentar de nuevo más tarde
        setStoredUser(user);
        console.log('⚠️ [HYBRID] Usuario de Firebase guardado, Sebastian pendiente');
        return user;
      }
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
          const hybridUser = await createUserFromFirebase(user);
          
          // Verificar si ya tenemos JWT almacenado
          const storedJWT = getStoredJWT();
          if (storedJWT) {
            console.log('🎫 [SEBASTIAN] JWT existente encontrado');
            setStoredUser(hybridUser);
            resolve(hybridUser);
          } else {
            console.log('⚠️ [SEBASTIAN] No hay JWT, pero usuario Firebase válido');
            setStoredUser(hybridUser);
            resolve(hybridUser); // Permitir acceso con Firebase, Sebastian se puede hacer después
          }
        } catch (error) {
          console.error('❌ [FIREBASE] Error creando usuario híbrido:', error);
          resolve(null);
        }
      } else {
        console.log('👤 [FIREBASE] No hay usuario autenticado');
        resolve(null);
      }
    });
  });
};

export const signOutFirebase = async () => {
  console.log('🚪 [FIREBASE] Cerrando sesión...');
  await auth.signOut();
  clearAuthStorage();
};

// ======================================================
// SEBASTIAN.CL API AUTHENTICATION
// ======================================================

export const authenticateWithSebastianAPI = async (googleToken: string): Promise<string> => {
  console.log('🔐 [SEBASTIAN] Iniciando autenticación con API...');
  console.log('📤 [SEBASTIAN] Google Token:', googleToken);
  console.log('📤 [SEBASTIAN] X-API-TOKEN:', getApiCredentials().apiToken);
  console.log('📤 [SEBASTIAN] X-API-KEY:', getApiCredentials().apiKey);
  
  try {
    // Paso 1: Solicitar token para autenticación
    console.log('📝 [SEBASTIAN] Solicitando token de autenticación...');
    console.log('🌐 [SEBASTIAN] URL:', `${API_BASE_URL}${AUTH_ENDPOINT}/request`);
    
    const requestCodePayload: RequestCodePayload = {
      successUrl: `${window.location.origin}/auth-success`,
      failedUrl: `${window.location.origin}/auth-failed`
    };
    
    console.log('📤 [SEBASTIAN] Request Payload:', JSON.stringify(requestCodePayload, null, 2));
    console.log('📤 [SEBASTIAN] Headers:', JSON.stringify(getAuthHeaders(), null, 2));
    
    const tokenResponse = await fetch(`${API_BASE_URL}${AUTH_ENDPOINT}/request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestCodePayload)
    });
    
    console.log('📥 [SEBASTIAN] Token Response Status:', tokenResponse.status);
    console.log('📥 [SEBASTIAN] Token Response Headers:', Object.fromEntries(tokenResponse.headers.entries()));
    
    const tokenResponseText = await tokenResponse.text();
    console.log('📥 [SEBASTIAN] Token Raw Response:', tokenResponseText);
    
    let tokenData: AuthTokenResponse;
    try {
      tokenData = JSON.parse(tokenResponseText);
      console.log('📥 [SEBASTIAN] Token Parsed JSON:', JSON.stringify(tokenData, null, 2));
    } catch (parseError) {
      console.error('❌ [SEBASTIAN] Error parsing token response:', parseError);
      throw new Error(`Error parseando respuesta del token: ${tokenResponseText}`);
    }
    
    if (!tokenResponse.ok) {
      console.error('❌ [SEBASTIAN] Error response:', tokenData);
      throw new Error(`Error solicitando token: ${tokenResponse.status} - ${tokenResponseText}`);
    }
    
    console.log('✅ [SEBASTIAN] Token obtenido:', tokenData.token);
    
    // Paso 2: Obtener JWT usando el token
    console.log('🎫 [SEBASTIAN] Obteniendo JWT...');
    console.log('🌐 [SEBASTIAN] JWT URL:', `${API_BASE_URL}${AUTH_ENDPOINT}/${tokenData.token}/jwt`);
    
    const jwtResponse = await fetch(`${API_BASE_URL}${AUTH_ENDPOINT}/${tokenData.token}/jwt`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    console.log('📥 [SEBASTIAN] JWT Response Status:', jwtResponse.status);
    console.log('📥 [SEBASTIAN] JWT Response Headers:', Object.fromEntries(jwtResponse.headers.entries()));
    
    const jwtResponseText = await jwtResponse.text();
    console.log('📥 [SEBASTIAN] JWT Raw Response:', jwtResponseText);
    
    let jwtData: JwtResponse;
    try {
      jwtData = JSON.parse(jwtResponseText);
      console.log('📥 [SEBASTIAN] JWT Parsed JSON:', JSON.stringify(jwtData, null, 2));
    } catch (parseError) {
      console.error('❌ [SEBASTIAN] Error parsing JWT response:', parseError);
      throw new Error(`Error parseando respuesta del JWT: ${jwtResponseText}`);
    }
    
    if (!jwtResponse.ok) {
      console.error('❌ [SEBASTIAN] JWT Error response:', jwtData);
      throw new Error(`Error obteniendo JWT: ${jwtResponse.status} - ${jwtResponseText}`);
    }
    
    console.log('✅ [SEBASTIAN] JWT obtenido exitosamente');
    console.log('🎫 [SEBASTIAN] JWT Token:', jwtData.jwt);
    
    // Almacenar JWT
    setStoredJWT(jwtData.jwt);
    
    return jwtData.jwt;
    
  } catch (error) {
    console.error('❌ [SEBASTIAN] Error en autenticación:', error);
    throw error;
  }
};

// ======================================================
// VOTING API FUNCTIONS
// ======================================================

export const fetchPolls = async (): Promise<Poll[]> => {
  console.log('📊 [VOTING] Obteniendo encuestas...');
  
  const jwt = getStoredJWT();
  console.log('🎫 [VOTING] JWT Token:', jwt ? `${jwt.substring(0, 50)}...` : 'NO DISPONIBLE');
  
  if (!jwt) {
    throw new Error('No hay token de autenticación');
  }
  
  try {
    const url = `${API_BASE_URL}${VOTE_ENDPOINT}/polls/`;
    const headers = getVoteHeaders(jwt);
    
    console.log('🌐 [VOTING] URL:', url);
    console.log('📤 [VOTING] Headers:', JSON.stringify(headers, null, 2));
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    console.log('📥 [VOTING] Response Status:', response.status);
    console.log('📥 [VOTING] Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📥 [VOTING] Raw Response:', responseText);
    
    let polls: Poll[];
    try {
      polls = JSON.parse(responseText);
      console.log('📥 [VOTING] Parsed JSON:', JSON.stringify(polls, null, 2));
    } catch (parseError) {
      console.error('❌ [VOTING] Error parsing polls response:', parseError);
      throw new Error(`Error parseando respuesta de encuestas: ${responseText}`);
    }
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error('🔒 [VOTING] Token expirado o inválido');
        throw new Error('Token expirado. Inicia sesión nuevamente.');
      }
      console.error('❌ [VOTING] Error response:', polls);
      throw new Error(`Error obteniendo encuestas: ${response.status} - ${responseText}`);
    }
    
    console.log('✅ [VOTING] Encuestas obtenidas exitosamente:', polls.length);
    
    return polls;
    
  } catch (error) {
    console.error('❌ [VOTING] Error obteniendo encuestas:', error);
    throw error;
  }
};

export const fetchPollById = async (pollToken: string): Promise<Poll> => {
  console.log('🔍 [VOTING] Obteniendo encuesta:', pollToken);
  
  const jwt = getStoredJWT();
  if (!jwt) {
    throw new Error('No hay token de autenticación');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${VOTE_ENDPOINT}/polls/${pollToken}`, {
      method: 'GET',
      headers: getVoteHeaders(jwt)
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Encuesta no encontrada');
      }
      if (response.status === 401) {
        throw new Error('Token expirado. Inicia sesión nuevamente.');
      }
      throw new Error(`Error obteniendo encuesta: ${response.status}`);
    }
    
    const poll: Poll = await response.json();
    console.log('✅ [VOTING] Encuesta obtenida:', poll.name);
    
    return poll;
    
  } catch (error) {
    console.error('❌ [VOTING] Error obteniendo encuesta:', error);
    throw error;
  }
};

export const submitVote = async (pollToken: string, selection: number): Promise<VoteResponse> => {
  console.log('🗳️ [VOTING] Enviando voto:', pollToken, '->', selection);
  
  const jwt = getStoredJWT();
  if (!jwt) {
    throw new Error('No hay token de autenticación');
  }
  
  try {
    const votePayload: VotePayload = {
      pollToken,
      selection
    };
    
    const response = await fetch(`${API_BASE_URL}${VOTE_ENDPOINT}/vote/election`, {
      method: 'POST',
      headers: getVoteHeaders(jwt),
      body: JSON.stringify(votePayload)
    });
    
    if (!response.ok) {
      if (response.status === 409) {
        throw new Error('Ya has votado en esta encuesta');
      }
      if (response.status === 404) {
        throw new Error('Encuesta o opción no encontrada');
      }
      if (response.status === 401) {
        throw new Error('Token expirado. Inicia sesión nuevamente.');
      }
      throw new Error(`Error enviando voto: ${response.status}`);
    }
    
    const result: VoteResponse = await response.json();
    console.log('✅ [VOTING] Voto enviado exitosamente:', result.message);
    
    return result;
    
  } catch (error) {
    console.error('❌ [VOTING] Error enviando voto:', error);
    throw error;
  }
};

export const fetchPollResults = async (pollToken: string): Promise<PollResults> => {
  console.log('📈 [VOTING] Obteniendo resultados:', pollToken);
  
  const jwt = getStoredJWT();
  if (!jwt) {
    throw new Error('No hay token de autenticación');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${VOTE_ENDPOINT}/vote/${pollToken}/results`, {
      method: 'GET',
      headers: getVoteHeaders(jwt)
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Resultados no encontrados');
      }
      if (response.status === 401) {
        throw new Error('Token expirado. Inicia sesión nuevamente.');
      }
      throw new Error(`Error obteniendo resultados: ${response.status}`);
    }
    
    const results: PollResults = await response.json();
    console.log('✅ [VOTING] Resultados obtenidos:', results.name);
    
    return results;
    
  } catch (error) {
    console.error('❌ [VOTING] Error obteniendo resultados:', error);
    throw error;
  }
};

export const createPoll = async (poll: Omit<Poll, 'token'>): Promise<Poll> => {
  console.log('📝 [VOTING] Creando encuesta:', poll.name);
  
  const jwt = getStoredJWT();
  if (!jwt) {
    throw new Error('No hay token de autenticación');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${VOTE_ENDPOINT}/polls/`, {
      method: 'POST',
      headers: getVoteHeaders(jwt),
      body: JSON.stringify(poll)
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token expirado. Inicia sesión nuevamente.');
      }
      throw new Error(`Error creando encuesta: ${response.status}`);
    }
    
    const createdPoll: Poll = await response.json();
    console.log('✅ [VOTING] Encuesta creada:', createdPoll.token);
    
    return createdPoll;
    
  } catch (error) {
    console.error('❌ [VOTING] Error creando encuesta:', error);
    throw error;
  }
};

export const updatePoll = async (poll: Poll): Promise<Poll> => {
  console.log('✏️ [VOTING] Actualizando encuesta:', poll.token);
  
  const jwt = getStoredJWT();
  if (!jwt) {
    throw new Error('No hay token de autenticación');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${VOTE_ENDPOINT}/polls/`, {
      method: 'PUT',
      headers: getVoteHeaders(jwt),
      body: JSON.stringify(poll)
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token expirado. Inicia sesión nuevamente.');
      }
      if (response.status === 403) {
        throw new Error('No tienes permisos para actualizar esta encuesta');
      }
      if (response.status === 404) {
        throw new Error('Encuesta no encontrada');
      }
      throw new Error(`Error actualizando encuesta: ${response.status}`);
    }
    
    const updatedPoll: Poll = await response.json();
    console.log('✅ [VOTING] Encuesta actualizada:', updatedPoll.token);
    
    return updatedPoll;
    
  } catch (error) {
    console.error('❌ [VOTING] Error actualizando encuesta:', error);
    throw error;
  }
};

export const deletePoll = async (pollToken: string): Promise<VoteResponse> => {
  console.log('🗑️ [VOTING] Eliminando encuesta:', pollToken);
  
  const jwt = getStoredJWT();
  if (!jwt) {
    throw new Error('No hay token de autenticación');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${VOTE_ENDPOINT}/polls/${pollToken}`, {
      method: 'DELETE',
      headers: getVoteHeaders(jwt)
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Token expirado. Inicia sesión nuevamente.');
      }
      if (response.status === 403) {
        throw new Error('No tienes permisos para eliminar esta encuesta');
      }
      if (response.status === 404) {
        throw new Error('Encuesta no encontrada');
      }
      throw new Error(`Error eliminando encuesta: ${response.status}`);
    }
    
    const result: VoteResponse = await response.json();
    console.log('✅ [VOTING] Encuesta eliminada:', result.message);
    
    return result;
    
  } catch (error) {
    console.error('❌ [VOTING] Error eliminando encuesta:', error);
    throw error;
  }
};

// ======================================================
// AVAILABILITY CHECK
// ======================================================

export const checkApiAvailability = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}${AUTH_ENDPOINT}/login`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    return response.ok;
  } catch (error) {
    console.warn('⚠️ [API] APIs no disponibles:', error);
    return false;
  }
};

// ======================================================
// HYBRID AUTHENTICATION FLOW
// ======================================================

export const performHybridLogin = async (useRedirect = false): Promise<User> => {
  console.log('🚀 [HYBRID] Iniciando flujo híbrido de autenticación...');
  
  try {
    // Paso 1: Autenticarse con Firebase/Google
    const firebaseUser = await signInWithGoogle(useRedirect);
    console.log('✅ [HYBRID] Firebase auth exitoso');
    
    // Paso 2: Intentar autenticarse con API Sebastian.cl
    try {
      console.log('🔐 [HYBRID] Intentando autenticación con Sebastian API...');
      await authenticateWithSebastianAPI(firebaseUser.googleToken);
      console.log('✅ [HYBRID] Sebastian API auth exitoso');
    } catch (sebastianError) {
      console.warn('⚠️ [HYBRID] Sebastian API falló, continuando solo con Firebase:', sebastianError);
      // No lanzar error, continuar con Firebase solamente
    }
    
    // Paso 3: Almacenar información del usuario (incluso si Sebastian falló)
    setStoredUser(firebaseUser);
    
    console.log('🎉 [HYBRID] Flujo híbrido completado (Firebase: ✅, Sebastian: ' + (getStoredJWT() ? '✅' : '⚠️') + ')');
    return firebaseUser;
    
  } catch (error) {
    console.error('❌ [HYBRID] Error en flujo híbrido:', error);
    clearAuthStorage();
    throw error;
  }
};