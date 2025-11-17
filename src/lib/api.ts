// Servicio de API para votaciones con autenticación
import type { Vote } from './firestore';

// Configuración de la API
const VOTE_API_BASE_URL = 'https://api.sebastian.cl/vote';
const AUTH_API_BASE_URL = 'https://api.sebastian.cl/Auth';
const API_TIMEOUT = 10000; // 10 segundos

// Headers requeridos por la pasarela de autenticación
const API_HEADERS = {
  'X-API-TOKEN': import.meta.env.VITE_API_TOKEN || '',
  'X-API-KEY': import.meta.env.VITE_API_KEY || '',
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Interfaces para la API de votaciones
interface ApiEncuesta {
  token: string;
  name: string;
  active?: boolean;
  owner?: boolean;
  options: Array<{
    selection: number;
    choice: string;
  }>;
}

interface ApiVoto {
  pollToken: string;
  selection: number;
}

interface ApiResultado {
  name: string;
  results: Array<{
    choice: string;
    total: number;
  }>;
}

// Interfaces para la pasarela de autenticación
interface TokenVO {
  token: string;
  redirectUrl: string;
  created: string;
}

interface JwtVO {
  jwt: string;
  created: string;
}

interface ResponseVO {
  ok: boolean;
  message: string;
  created: string;
}

// Estado de autenticación
let currentJWT: string | null = localStorage.getItem('api_jwt');
let jwtExpiry: number = parseInt(localStorage.getItem('jwt_expiry') || '0');

// Función para verificar si el JWT está válido
const isJWTValid = (): boolean => {
  return currentJWT !== null && Date.now() < jwtExpiry;
};

// Función para limpiar autenticación
const clearAuth = (): void => {
  currentJWT = null;
  jwtExpiry = 0;
  localStorage.removeItem('api_jwt');
  localStorage.removeItem('jwt_expiry');
};

// Función para guardar JWT
const saveJWT = (jwt: string): void => {
  currentJWT = jwt;
  // JWT típicamente dura 1 hora, pero guardamos con margen de seguridad
  jwtExpiry = Date.now() + (50 * 60 * 1000); // 50 minutos
  localStorage.setItem('api_jwt', jwt);
  localStorage.setItem('jwt_expiry', jwtExpiry.toString());
};

// Autenticación: Paso 1 - Solicitar token de login
export const requestLoginToken = async (): Promise<string> => {
  console.log('🚀 [AUTH API] Iniciando solicitud de token de login');
  console.log('🔗 [AUTH API] URL:', `${AUTH_API_BASE_URL}/v1/tokens/login`);
  console.log('🔑 [AUTH API] Headers:', {
    'X-API-TOKEN': API_HEADERS['X-API-TOKEN'] ? '***' + API_HEADERS['X-API-TOKEN'].slice(-4) : 'NO_SET',
    'X-API-KEY': API_HEADERS['X-API-KEY'] ? '***' + API_HEADERS['X-API-KEY'].slice(-4) : 'NO_SET'
  });
  
  try {
    console.log('🔐 [AUTH API] Enviando petición GET...');
    
    const response = await fetch(`${AUTH_API_BASE_URL}/v1/tokens/login`, {
      method: 'GET',
      headers: {
        'X-API-TOKEN': API_HEADERS['X-API-TOKEN'],
        'X-API-KEY': API_HEADERS['X-API-KEY']
      }
    });

    console.log('📡 [AUTH API] Respuesta recibida - Status:', response.status);
    console.log('📡 [AUTH API] Content-Type:', response.headers.get('content-type'));
    
    if (!response.ok) {
      console.error('❌ [AUTH API] Error HTTP en solicitud de token');
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    const data: TokenVO = await response.json();
    console.log('✅ [AUTH API] Token de login obtenido exitosamente');
    console.log('🎫 [AUTH API] Token:', data.token);
    console.log('🔗 [AUTH API] Redirect URL:', data.redirectUrl);
    console.log('📅 [AUTH API] Creado en:', data.created);
    
    return data.redirectUrl;
  } catch (error) {
    console.error('❌ Error solicitando token de login:', error);
    throw error;
  }
};

// Obtener todas las encuestas
export const fetchVotesFromApi = async (): Promise<Vote[]> => {
  try {
    console.log('🌐 Obteniendo encuestas desde API...');
    
    if (!isJWTValid()) {
      throw new Error('No hay autenticación válida para la API');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${VOTE_API_BASE_URL}/v1/polls/`, {
      method: 'GET',
      headers: {
        ...API_HEADERS,
        'Authorization': `Bearer ${currentJWT}`
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }
    
    const data: ApiEncuesta[] = await response.json();
    console.log('✅ [VOTE API] Encuestas recibidas:', data.length);
    console.log('📊 [VOTE API] Datos raw:', data.map(e => ({ token: e.token, name: e.name, active: e.active })));
    console.log('🔄 [VOTE API] Iniciando transformación a formato interno...');
    
    // Transformar al formato interno
    const votes: Vote[] = data.map(encuesta => {
      const categories = ['Gobierno', 'Desarrollo', 'Transporte', 'Educación', 'Salud', 'Economía'];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      
      return {
        id: encuesta.token,
        title: encuesta.name,
        description: `Descripción detallada de la encuesta: ${encuesta.name}. Esta es una consulta importante que requiere la participación ciudadana.`,
        shortDescription: encuesta.name.substring(0, 80) + (encuesta.name.length > 80 ? '...' : ''),
        status: (encuesta.active !== false ? 'active' : 'closed') as 'active' | 'closed',
        startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + (30 + Math.random() * 60) * 24 * 60 * 60 * 1000),
        category: randomCategory,
        createdBy: 'api-system',
        createdAt: new Date(),
        totalVotes: 0,
        userVotes: {},
        options: encuesta.options.map(option => ({
          id: option.selection.toString(),
          text: option.choice,
          votes: 0 // Se actualizará con los resultados reales
        }))
      };
    });
    
    return votes;
    
  } catch (error: any) {
    console.error('❌ Error obteniendo encuestas desde API:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La API tardó demasiado en responder');
    }
    
    throw error;
  }
};

// Verificar si la API está disponible
export const checkApiAvailability = async (): Promise<boolean> => {
  console.log('🌐 [API CHECK] Verificando disponibilidad de API...');
  
  try {
    // Verificar si tenemos credenciales
    console.log('🔑 [API CHECK] Verificando credenciales...');
    console.log('🔑 [API CHECK] X-API-TOKEN presente:', !!API_HEADERS['X-API-TOKEN']);
    console.log('🔑 [API CHECK] X-API-KEY presente:', !!API_HEADERS['X-API-KEY']);
    console.log('🔗 [API CHECK] Vote API URL:', VOTE_API_BASE_URL);
    console.log('🔗 [API CHECK] Auth API URL:', AUTH_API_BASE_URL);
    
    if (!API_HEADERS['X-API-TOKEN'] || !API_HEADERS['X-API-KEY']) {
      console.warn('⚠️ [API CHECK] Credenciales de API no configuradas en .env.local');
      console.log('📝 [API CHECK] Se necesitan: VITE_API_TOKEN y VITE_API_KEY');
      return false;
    }
    
    // Verificar si tenemos JWT válido
    console.log('🎫 [API CHECK] Verificando JWT...');
    const jwtValid = isJWTValid();
    console.log('🎫 [API CHECK] JWT válido:', jwtValid);
    
    if (!jwtValid) {
      console.warn('⚠️ [API CHECK] JWT no válido o expirado - se necesita autenticación');
      console.log('🔄 [API CHECK] Para obtener JWT: usar requestLoginToken() y luego getJWTFromToken()');
      return false;
    }
    
    console.log('🎫 [API CHECK] JWT OK, verificando conectividad...');
    
    // Hacer una petición simple para verificar conectividad
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    console.log('⏱️ [API CHECK] Timeout configurado: 3 segundos');
    
    const response = await fetch(`${VOTE_API_BASE_URL}/v1/polls/`, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${currentJWT}`,
        ...API_HEADERS
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log('📡 [API CHECK] Respuesta recibida - Status:', response.status);
    console.log('📡 [API CHECK] Headers de respuesta:', [...response.headers.entries()]);
    
    const isAvailable = response.ok || response.status === 404;
    console.log('✅ [API CHECK] API disponible:', isAvailable);
    
    return isAvailable;
    
  } catch (error) {
    console.error('❌ [API CHECK] Error verificando API:', error);
    console.log('🔍 [API CHECK] Tipo de error:', error instanceof Error ? error.name : typeof error);
    return false;
  }
};

// Verificar estado de autenticación
export const isAuthenticated = (): boolean => {
  return isJWTValid();
};

// Obtener JWT desde token
export const getJWTFromToken = async (token: string): Promise<string> => {
  console.log('🚀 [JWT API] Iniciando obtención de JWT');
  console.log('🎫 [JWT API] Token input:', token);
  console.log('🔗 [JWT API] URL:', `${AUTH_API_BASE_URL}/v1/tokens/${token}/jwt`);
  
  try {
    console.log('🔑 [JWT API] Enviando petición para obtener JWT...');
    
    const response = await fetch(`${AUTH_API_BASE_URL}/v1/tokens/${token}/jwt`, {
      method: 'GET',
      headers: {
        'X-API-TOKEN': API_HEADERS['X-API-TOKEN'],
        'X-API-KEY': API_HEADERS['X-API-KEY']
      }
    });

    console.log('📡 [JWT API] Respuesta recibida - Status:', response.status);
    
    if (!response.ok) {
      console.error('❌ [JWT API] Error HTTP obteniendo JWT');
      const errorText = await response.text();
      console.error('📝 [JWT API] Error body:', errorText);
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    const data: JwtVO = await response.json();
    console.log('✅ [JWT API] JWT obtenido correctamente');
    console.log('🎫 [JWT API] JWT preview:', data.jwt.substring(0, 20) + '...');
    console.log('📅 [JWT API] Creado en:', data.created);
    console.log('⏰ [JWT API] Guardando JWT con expiración de 50 minutos');
    
    saveJWT(data.jwt);
    return data.jwt;
  } catch (error) {
    console.error('❌ Error obteniendo JWT:', error);
    throw error;
  }
};