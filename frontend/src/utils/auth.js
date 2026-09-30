const USER_KEY = 'safehome_current_user';
const TOKEN_KEY = 'safehome_token';

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; } catch { return null; }
}

export function setCurrentUser(user) { localStorage.setItem(USER_KEY, JSON.stringify(user)); }
export function setSession(user, token) { setCurrentUser(user); localStorage.setItem(TOKEN_KEY, token); }
export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function logout() { localStorage.removeItem(USER_KEY); localStorage.removeItem(TOKEN_KEY); }
export function isLoggedIn() { return Boolean(getCurrentUser() && getToken()); }
