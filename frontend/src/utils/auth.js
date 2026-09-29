const USER_KEY = 'safehome_current_user';

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; } catch { return null; }
}

export function setCurrentUser(user) { localStorage.setItem(USER_KEY, JSON.stringify(user)); }
export function logout() { localStorage.removeItem(USER_KEY); }
export function isLoggedIn() { return Boolean(getCurrentUser()); }

