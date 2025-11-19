// api.ts - configuración para api.sebastian.cl
// ======================================================
// CONFIG
// ======================================================

export const VOTE_API_BASE_URL = "https://api.sebastian.cl/vote";
export const AUTH_API_BASE_URL = "https://api.sebastian.cl/UtemAuth";

export const API_HEADERS = {
  "X-API-TOKEN": import.meta.env.VITE_API_TOKEN ?? "sebastian.cl",
  "X-API-KEY": import.meta.env.VITE_API_KEY ?? "aaa-bbb-ccc-ddd",
  "Content-Type": "application/json",
  "Accept": "application/json"
};

// Guardamos el JWT y token temporal
let currentJWT: string | null = localStorage.getItem('vote_app_jwt');
let tempToken: string | null = localStorage.getItem('vote_temp_token');

// ======================================================
// LOG HELPERS
// ======================================================

const log = {
  info: (...a: any[]) => console.log("[API]", ...a),
  warn: (...a: any[]) => console.warn("[API]", ...a),
  error: (...a: any[]) => console.error("[API]", ...a),
};

// ======================================================
// JWT HANDLING
// ======================================================

export function setJWT(jwt: string) {
  currentJWT = jwt;
  localStorage.setItem('vote_app_jwt', jwt);
  log.info("✅ JWT almacenado");
}

export function getJWT(): string | null {
  return currentJWT;
}

export function clearJWT() {
  currentJWT = null;
  localStorage.removeItem('vote_app_jwt');
  log.info("🗑️ JWT eliminado");
}

export function setTempToken(token: string) {
  tempToken = token;
  localStorage.setItem('vote_temp_token', token);
  log.info("⏳ Token temporal almacenado");
}

export function getTempToken(): string | null {
  return tempToken;
}

export function clearTempToken() {
  tempToken = null;
  localStorage.removeItem('vote_temp_token');
  log.info("🗑️ Token temporal eliminado");
}

function getAuthorizationHeader() {
  return currentJWT ? { Authorization: `Bearer ${currentJWT}` } : {};
}

function isJWTValid() {
  if (!currentJWT) return false;
  try {
    const [, payload] = currentJWT.split(".");
    const decoded = JSON.parse(atob(payload));
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

// ======================================================
// INTERFACES
// ======================================================

interface TokenResponse {
  token: string;
  redirectUrl: string;
  created: string;
}

interface JWTResponse {
  jwt: string;
  created: string;
}

interface Poll {
  token: string;
  name: string;
  active: boolean;
  owner: boolean;
  options: Array<{
    selection: number;
    choice: string;
  }>;
}

// ======================================================
// AUTH FLOW
// ======================================================

// Paso 1: Solicitar token de login y redirigir
export async function requestLoginToken(): Promise<void> {
  log.info("🚀 Paso 1: Solicitando token de login...");
  
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/v1/tokens/login`, {
      method: "GET",
      headers: API_HEADERS
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    const data: TokenResponse = await response.json();
    log.info("✅ Token obtenido:", data.token);
    log.info("🔗 Redirect URL:", data.redirectUrl);
    
    // Guardar token temporal y redirigir
    setTempToken(data.token);
    window.location.href = data.redirectUrl;
    
  } catch (error) {
    log.error("❌ Error en requestLoginToken:", error);
    throw error;
  }
}

// Paso 2: Obtener JWT desde token temporal (después del callback)
export async function getJWTFromToken(token: string): Promise<string> {
  log.info("🚀 Paso 2: Obteniendo JWT desde token:", token);

  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/v1/tokens/${token}/jwt`, {
      method: "POST",
      headers: API_HEADERS
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    const data: JWTResponse = await response.json();
    log.info("✅ JWT obtenido exitosamente");
    
    // Guardar JWT y limpiar token temporal
    setJWT(data.jwt);
    clearTempToken();
    
    return data.jwt;
    
  } catch (error) {
    log.error("❌ Error en getJWTFromToken:", error);
    clearTempToken();
    throw error;
  }
}

// ======================================================
// API CHECK
// ======================================================

export async function checkApiAvailability(): Promise<boolean> {
  log.info("🔍 Verificando disponibilidad de API...");

  if (!isJWTValid()) {
    log.warn("⚠️ JWT inválido o no existente");
    return false;
  }

  try {
    // Crear headers sin valores undefined
    const baseHeaders = {
      ...API_HEADERS,
      ...getAuthorizationHeader(),
    };

    // Filtrar undefined values
    const cleanHeaders = Object.fromEntries(
      Object.entries(baseHeaders).filter(([_, value]) => value !== undefined && value !== null && value !== "")
    ) as Record<string, string>;

    const response = await fetch(`${VOTE_API_BASE_URL}/v1/polls/`, {
      method: "HEAD",
      headers: cleanHeaders,
    });

    const isAvailable = response.ok || response.status === 404; // 404 también significa que la API está disponible
    log.info(isAvailable ? "✅ API disponible" : "❌ API no disponible");
    return isAvailable;

  } catch (e) {
    log.error("❌ Error conectando a API:", e);
    return false;
  }
}

// ======================================================
// POLLS API
// ======================================================

export async function fetchVotesFromApi(): Promise<Poll[]> {
  log.info("📊 Obteniendo encuestas desde API...");

  if (!isJWTValid()) {
    log.warn("⚠️ JWT no válido → no se consultará API");
    throw new Error("JWT inválido. Inicia sesión nuevamente.");
  }

  try {
    // Crear headers sin valores undefined
    const baseHeaders = {
      ...API_HEADERS,
      ...getAuthorizationHeader(),
    };

    // Filtrar undefined values
    const cleanHeaders = Object.fromEntries(
      Object.entries(baseHeaders).filter(([_, value]) => value !== undefined && value !== null && value !== "")
    ) as Record<string, string>;

    const response = await fetch(`${VOTE_API_BASE_URL}/v1/polls/`, {
      method: "GET",
      headers: cleanHeaders,
    });

    if (!response.ok) {
      if (response.status === 401) {
        log.error("🔑 Token expirado o inválido");
        clearJWT();
        throw new Error("Sesión expirada. Inicia sesión nuevamente.");
      }
      
      const errorText = await response.text();
      log.error("❌ Error HTTP:", response.status, errorText);
      throw new Error(`Error de API: ${response.status} - ${response.statusText}`);
    }

    const data: Poll[] = await response.json();
    log.info("✅ Encuestas obtenidas:", data.length);
    log.info("📋 Encuestas:", data.map(p => ({ token: p.token, name: p.name, active: p.active })));
    
    return data;
    
  } catch (error) {
    log.error("❌ Error en fetchVotesFromApi:", error);
    throw error;
  }
}
