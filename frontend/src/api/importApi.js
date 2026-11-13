import { apiRequest, apiUpload } from './apiClient';
export function previewBlockResidents(file, blockName) { const data = new FormData(); data.append('file', file); data.append('blockName', blockName); return apiUpload('/import/preview-block-residents', data); }
export const confirmBlockResidents = (importId, confirm = true) => apiRequest('/import/confirm-block-residents', { method: 'POST', body: JSON.stringify({ importId, confirm }) });
