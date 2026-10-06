import { apiRequest } from './apiClient';
export const sendChatMessage = (body) => apiRequest('/chatbot/message', { method: 'POST', body: JSON.stringify(body) });
