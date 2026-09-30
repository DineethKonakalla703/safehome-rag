import { apiRequest, normalizeUser } from './apiClient';
export async function getDemoUsers() { return (await apiRequest('/users/demo')).map(normalizeUser); }
export async function getUsers() { return (await apiRequest('/users')).map(normalizeUser); }
export async function login(email, password) { const data = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); return { ...data, user: normalizeUser(data.user) }; }
export async function getMe() { return normalizeUser(await apiRequest('/auth/me')); }
