import { apiRequest, createCrudApi } from './apiClient';
export const visitorApi = { ...createCrudApi('/visitors'), approve: (id) => apiRequest(`/visitors/${id}/approve`, { method: 'PATCH' }), exit: (id) => apiRequest(`/visitors/${id}/exit`, { method: 'PATCH' }) };
