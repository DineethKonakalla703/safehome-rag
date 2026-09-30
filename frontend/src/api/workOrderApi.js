import { apiRequest } from './apiClient';
export const getWorkOrders = () => apiRequest('/work-orders');
export const createWorkOrder = (body) => apiRequest('/work-orders', { method: 'POST', body: JSON.stringify(body) });
export const updateWorkOrderStatus = (id, status, completionNote = '') => apiRequest(`/work-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, completionNote }) });
