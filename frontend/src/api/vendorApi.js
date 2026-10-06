import { apiRequest } from './apiClient';

export const listVendors = () => apiRequest('/vendors');
export const getVendor = (id) => apiRequest(`/vendors/${id}`);
export const createVendor = (data) => apiRequest('/vendors', { method: 'POST', body: JSON.stringify(data) });
export const updateVendor = (id, data) => apiRequest(`/vendors/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteVendor = (id) => apiRequest(`/vendors/${id}`, { method: 'DELETE' });
