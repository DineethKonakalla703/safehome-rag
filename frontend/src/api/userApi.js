import { apiRequest, normalizeUser } from './apiClient';
export async function getDemoUsers() { return (await apiRequest('/users/demo')).map(normalizeUser); }
export async function getUsers() { return (await apiRequest('/users')).map(normalizeUser); }
export async function login(email, password) { const data = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); return { ...data, user: normalizeUser(data.user) }; }
export async function getMe() { return normalizeUser(await apiRequest('/auth/me')); }
export async function changePassword(currentPassword, newPassword) {
  return apiRequest('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
export async function requestPasswordReset(email) {
  return apiRequest('/auth/request-password-reset', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}
export async function resetPassword(token, newPassword) {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}
