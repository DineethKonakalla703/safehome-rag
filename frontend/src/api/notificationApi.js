import { apiRequest } from './apiClient';

export const listNotifications = () => apiRequest('/notifications');
export const markNotificationRead = (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH', body: '{}' });
