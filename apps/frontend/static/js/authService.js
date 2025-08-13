// ===============================
// Servicio de Autenticación API MeloSport
// ===============================

const API_BASE_URL = "http://127.0.0.1:8000/api";
const TOKEN_KEY = "access";
const REFRESH_KEY = "refresh";

/**
 * Guarda los tokens en localStorage
 */
function saveTokens(access, refresh) {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
}

/**
 * Obtiene el token de acceso desde localStorage
 */
function getAccessToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Elimina los tokens (logout)
 */
function clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
}

/**
 * Solicita un nuevo token usando usuario y contraseña
 */
async function login(username, password) {
    const response = await fetch(`${API_BASE_URL}/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
        throw new Error("Error al iniciar sesión");
    }

    const data = await response.json();
    saveTokens(data.access, data.refresh);
    return data;
}

/**
 * Refresca el token de acceso usando el token de refresh
 */
async function refreshToken() {
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) throw new Error("No hay token de refresh disponible");

    const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh })
    });

    if (!response.ok) {
        clearTokens();
        throw new Error("No se pudo refrescar el token");
    }

    const data = await response.json();
    localStorage.setItem(TOKEN_KEY, data.access);
    return data.access;
}

/**
 * Hace una petición GET autenticada (si hay token)
 */
async function authGet(endpoint) {
    const token = getAccessToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });

    if (!response.ok) throw new Error(`Error en GET ${endpoint}`);
    return response.json();
}

// Exportar funciones (si usas módulos ES6)
if (typeof window !== "undefined") {
    window.authService = {
        login,
        refreshToken,
        authGet,
        getAccessToken,
        clearTokens
    };
}
