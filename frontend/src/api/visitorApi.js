import { apiRequest, createCrudApi } from './apiClient';

export const visitorApi = {
  ...createCrudApi('/visitors'),
  approve: (id) => apiRequest(`/visitors/${id}/approve`, { method: 'PATCH' }),
  checkIn: (id) => apiRequest(`/visitors/${id}/check-in`, { method: 'PATCH' }),
  exit: (id) => apiRequest(`/visitors/${id}/exit`, { method: 'PATCH' }),
  verifyPass: (code) => apiRequest(`/visitors/verify-pass?passCode=${encodeURIComponent(code)}`),
};
