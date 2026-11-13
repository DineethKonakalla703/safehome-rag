import { apiRequest, createCrudApi } from './apiClient';
export const vehicleApi = createCrudApi('/vehicles');
export const parkingApi = { ...createCrudApi('/parking-slots'), assign: (id, vehicleId) => apiRequest(`/parking-slots/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ vehicleId }) }) };
