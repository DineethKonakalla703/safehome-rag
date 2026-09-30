import { apiRequest, createCrudApi } from './apiClient';
export const amenityApi = createCrudApi('/amenities');
export const bookingApi = { ...createCrudApi('/amenity-bookings'), setStatus: (id, status) => apiRequest(`/amenity-bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }) };
