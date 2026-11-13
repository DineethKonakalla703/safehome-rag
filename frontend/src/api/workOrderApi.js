import { apiRequest, apiUpload } from './apiClient';

export const getWorkOrders = () => apiRequest('/work-orders');
export const createWorkOrder = (body) => apiRequest('/work-orders', { method: 'POST', body: JSON.stringify(body) });
export const updateWorkOrderStatus = (id, status, completionNote = '') => apiRequest(`/work-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, completionNote }) });
export const uploadWorkOrderCompletionImage = (id, file, status = '', completionNote = '') => {
  const formData = new FormData();
  formData.append('image', file);
  if (status) formData.append('status', status);
  if (completionNote) formData.append('completionNote', completionNote);
  return apiUpload(`/work-orders/${id}/completion-image`, formData);
};
