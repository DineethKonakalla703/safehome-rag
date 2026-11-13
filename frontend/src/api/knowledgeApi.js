import { apiRequest } from './apiClient';
export const listKnowledgeDocuments = () => apiRequest('/knowledge/documents');
export const createKnowledgeDocument = (body) => apiRequest('/knowledge/documents', { method: 'POST', body: JSON.stringify(body) });
export const queryKnowledge = (question, ticketId) => apiRequest('/knowledge/query', { method: 'POST', body: JSON.stringify({ question, ticketId }) });
export const reindexKnowledgeDocument = (documentId) => apiRequest(`/knowledge/documents/${documentId}/reindex`, { method: 'POST', body: '{}' });
export const getKnowledgeChunks = (documentId) => apiRequest(`/knowledge/chunks/${documentId}`);
