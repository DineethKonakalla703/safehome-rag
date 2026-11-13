import { apiRequest } from './apiClient';
export const getAIInsights = () => apiRequest('/ai/insights');
export const getIncidents = () => apiRequest('/ai/incidents');
export const detectIncidents = (blockId) => apiRequest('/ai/detect-incidents', { method: 'POST', body: JSON.stringify({ blockId }) });
export const recommendTechnicians = (ticketId) => apiRequest('/ai/recommend-technicians', { method: 'POST', body: JSON.stringify({ ticketId }) });
export const predictSlaRisk = (ticketId) => apiRequest('/ai/predict-sla-risk', { method: 'POST', body: JSON.stringify({ ticketId }) });
export const recommendVendors = (ticketId) => apiRequest('/ai/recommend-vendors', { method: 'POST', body: JSON.stringify({ ticketId }) });
export const reviewAIAnalysis = (ticketId) => apiRequest(`/ai/tickets/${ticketId}/review`, { method: 'PATCH', body: '{}' });
export const getAIFeedbackAnalytics = () => apiRequest('/ai/analytics');
