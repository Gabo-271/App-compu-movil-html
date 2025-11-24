// src/services/apiService.js

// 🚨 IMPORTANTE: Dejamos la URL base vacía para que el PROXY de Vite la maneje.
// Vite tomará las rutas que inician con /v1 y las redirigirá a 
// 'https://api.sebastian.cl/vote'.
const API_BASE_URL = ""; 

/**
 * Función genérica para manejar peticiones a la API.
 * @param {string} endpoint - La ruta específica de la API (ej. "/v1/polls/").
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE).
 * @param {string} authToken - Token de autorización Bearer (incluye "Bearer ").
 * @param {object} body - Cuerpo de la solicitud para métodos POST/PUT.
 */
const apiCall = async (endpoint, method = 'GET', authToken, body = null) => {
    // La URL será algo como "/v1/polls/", y Vite la proxyará.
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log('🌐 [API] Iniciando petición:');
    console.log('  📍 URL:', url);
    console.log('  🎯 Método:', method);
    console.log('  🎫 Token:', authToken ? authToken.substring(0, 60) + '...' : 'NO TOKEN');
    console.log('  📦 Body:', body ? JSON.stringify(body) : 'NO BODY');
    
    const headers = {
        'Content-Type': 'application/json',
    };

    if (authToken) {
        // Encabezado Bearer necesario para todas las operaciones
        headers['Authorization'] = authToken;
        console.log('  🔐 Header Authorization configurado');
    } else {
        console.log('  ❌ NO SE PROPORCIONÓ TOKEN');
        throw new Error("Se requiere autenticación (Token Bearer) para esta operación.");
    }

    const config = {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
    };

    console.log('  📋 Configuración final de la petición:', {
        url,
        method,
        headers: { ...headers, Authorization: headers.Authorization ? headers.Authorization.substring(0, 60) + '...' : 'NO AUTH' },
        body: config.body
    });

    try {
        console.log('  🚀 Enviando petición fetch...');
        const response = await fetch(url, config);
        
        console.log('  📨 Respuesta recibida:');
        console.log('    ✅ Status:', response.status);
        console.log('    📊 Status Text:', response.statusText);
        console.log('    🔍 OK:', response.ok);
        console.log('    🌐 URL final:', response.url);

        // Manejo de errores HTTP 
        if (!response.ok) {
            console.log('    ❌ Respuesta no OK, intentando leer error...');
            try {
                // Intentar leer el detalle del error (ProblemDetail)
                const errorData = await response.json();
                console.log('    📄 Error data:', errorData);
                const errorMessage = errorData.detail || `Fallo en la API con estado ${response.status}`;
                throw new Error(errorMessage);
            } catch (e) {
                console.log('    ⚠️ No se pudo leer JSON del error:', e);
                // Si no puede leer JSON (ej. error de red o 500 simple)
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
        }
        
        // Si la respuesta es exitosa (200, 201, 202), retornamos el cuerpo o un mensaje de éxito.
        if (response.status === 202) {
            console.log('    ✅ Respuesta 202 - Operación aceptada');
            return { ok: true, message: "Operación aceptada/eliminada" };
        }
        
        // Si no hay contenido (ej. DELETE exitoso), o si la API devuelve JSON.
        console.log('    📖 Leyendo respuesta JSON...');
        try {
            const responseText = await response.text();
            console.log('    📄 Respuesta como texto:', responseText.substring(0, 200) + '...');
            
            // Verificar si es HTML (probable error del proxy)
            if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
                console.log('    ⚠️ La respuesta es HTML en lugar de JSON - posible problema de proxy');
                throw new Error('La API devolvió HTML en lugar de JSON. Verificar configuración del proxy.');
            }
            
            const responseData = JSON.parse(responseText);
            console.log('    ✅ Datos JSON parseados:', responseData);
            return responseData;
        } catch (parseError) {
            console.log('    ❌ Error parseando JSON:', parseError.message);
            throw parseError;
        }
        
    } catch (error) {
        console.log('  🔥 ERROR en petición fetch:');
        console.log('    ❌ Error:', error.message);
        console.log('    🔍 Stack:', error.stack);
        throw error;
    }
};

// --- SERVICIOS DE ENCUESTAS (Polls) ---

/**
 * GET /v1/polls/ - Listar encuestas disponibles.
 * @param {string} authToken - Token de autorización Bearer.
 * @returns {Promise<Array<object>>} - Listado de objetos encuesta.
 */
export const fetchPolls = (authToken) => {
    console.log('📊 [SERVICE] fetchPolls llamado con token:', authToken ? authToken.substring(0, 60) + '...' : 'NO TOKEN');
    return apiCall("/v1/polls/", 'GET', authToken);
};

/**
 * GET /v1/polls/{pollToken} - Obtener una encuesta específica por su token.
 * @param {string} pollToken - Token único de la encuesta.
 * @param {string} authToken - Token de autorización Bearer.
 * @returns {Promise<object>} - Objeto encuesta.
 */
export const fetchPollByToken = (pollToken, authToken) => {
    return apiCall(`/v1/polls/${pollToken}`, 'GET', authToken);
};

/**
 * POST /v1/polls/ - Crear una nueva encuesta.
 * @param {object} pollData - Datos de la nueva encuesta (name, options).
 * @param {string} authToken - Token de autorización Bearer.
 * @returns {Promise<object>} - La encuesta creada (con token asignado).
 */
export const createPoll = (pollData, authToken) => {
    return apiCall("/v1/polls/", 'POST', authToken, pollData);
};

/**
 * PUT /v1/polls/ - Actualizar una encuesta existente.
 * Requiere el 'token' dentro de pollData.
 * @param {object} pollData - Datos actualizados de la encuesta (token, name, active, options).
 * @param {string} authToken - Token de autorización Bearer.
 * @returns {Promise<object>} - La encuesta actualizada.
 */
export const updatePoll = (pollData, authToken) => {
    return apiCall("/v1/polls/", 'PUT', authToken, pollData);
};

/**
 * DELETE /v1/polls/{pollToken} - Eliminar una encuesta.
 * @param {string} pollToken - Token único de la encuesta a eliminar.
 * @param {string} authToken - Token de autorización Bearer.
 * @returns {Promise<object>} - Respuesta de aceptación (202).
 */
export const deletePoll = (pollToken, authToken) => {
    return apiCall(`/v1/polls/${pollToken}`, 'DELETE', authToken);
};

// --- SERVICIOS DE VOTACIONES (Votes) ---

/**
 * POST /v1/vote/election - Registrar un voto del usuario autenticado.
 * @param {string} pollToken - Token de la encuesta a votar.
 * @param {number} selection - Opción seleccionada (código de alternativa).
 * @param {string} authToken - Token de autorización Bearer.
 * @returns {Promise<object>} - Objeto respuesta estándar de la API.
 */
export const registerVote = (pollToken, selection, authToken) => {
    console.log('🗳️ [SERVICE] registerVote llamado:');
    console.log('  🎫 pollToken:', pollToken);
    console.log('  🔢 selection:', selection);
    console.log('  🎫 authToken:', authToken ? authToken.substring(0, 60) + '...' : 'NO TOKEN');
    
    const votoBody = {
        pollToken,
        selection,
    };
    console.log('  📦 Body que se enviará:', votoBody);
    return apiCall("/v1/vote/election", 'POST', authToken, votoBody);
};

/**
 * GET /v1/vote/{pollToken}/results - Obtener los resultados de una encuesta.
 * @param {string} pollToken - Token único de la encuesta.
 * @param {string} authToken - Token de autorización Bearer.
 * @returns {Promise<object>} - Objeto resultado (name y listado de conteos).
 */
export const fetchPollResults = (pollToken, authToken) => {
    return apiCall(`/v1/vote/${pollToken}/results`, 'GET', authToken);
};