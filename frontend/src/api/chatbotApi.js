import { apiRequest } from './apiClient';
export const sendChatMessage = (body) => apiRequest('/chatbot/message', { method: 'POST', body: JSON.stringify(body) });
export const cancelChatbotConfirmation=(id)=>apiRequest(`/chatbot/confirmation/${id}/cancel`,{method:'POST'});
