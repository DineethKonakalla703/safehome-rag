import { apiRequest, createCrudApi } from './apiClient';
export const inventoryApi = { ...createCrudApi('/inventory'), use: (id, quantity) => apiRequest(`/inventory/${id}/use`, { method: 'POST', body: JSON.stringify({ quantity }) }) };
