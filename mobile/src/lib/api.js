import Constants from 'expo-constants';
import { Platform } from 'react-native';

// API base URL: EXPO_PUBLIC_API_URL wins. Otherwise, in development, reuse the IP of the machine
// running the Expo dev server (works for phones on the same Wi-Fi), with emulator/web fallbacks.
function resolveApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  const hostUri = Constants.expoConfig?.hostUri || '';
  const host = hostUri.split(':')[0];
  if (Platform.OS === 'web') return 'http://localhost:5000/api';
  if (host && host !== 'localhost' && host !== '127.0.0.1') return `http://${host}:5000/api`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
}
export const API_URL = resolveApiUrl();

let authToken = null;
let onUnauthorized = null;
export const setAuthToken = (token) => { authToken = token; };
export const getAuthToken = () => authToken;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.status = status; }
}

export async function api(path, { method = 'GET', body, timeout = 20000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    throw new ApiError(error.name === 'AbortError' ? 'The server took too long to respond.' : `Can't reach SafeHome at ${API_URL}. Check that the backend is running and your phone is on the same network.`);
  } finally {
    clearTimeout(timer);
  }
  let payload = null;
  try { payload = await response.json(); } catch { /* non-JSON */ }
  if (!response.ok || payload?.success === false) {
    if (response.status === 401 && authToken && onUnauthorized) onUnauthorized();
    throw new ApiError(payload?.error?.message || payload?.message || `Request failed (${response.status}).`, response.status);
  }
  return payload?.data;
}

// Returns null instead of throwing for endpoints a role may not be allowed to read.
export const tryApi = (path) => api(path).catch(() => null);
