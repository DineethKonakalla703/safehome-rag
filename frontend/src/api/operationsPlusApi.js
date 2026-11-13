import { apiRequest } from './apiClient';

const json = (method, body) => ({ method, body: JSON.stringify(body || {}) });

export const moveApi = {
  list: () => apiRequest('/move-requests'),
  create: (body) => apiRequest('/move-requests', json('POST', body)),
  approve: (id, note, overrideDues = false) => apiRequest(`/move-requests/${id}/approve`, json('PATCH', { note, overrideDues })),
  reject: (id, note) => apiRequest(`/move-requests/${id}/reject`, json('PATCH', { note })),
  complete: (id) => apiRequest(`/move-requests/${id}/complete`, json('PATCH')),
  cancel: (id) => apiRequest(`/move-requests/${id}/cancel`, json('PATCH')),
};
export const parcelApi = {
  list: (status) => apiRequest(`/parcels${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  log: (body) => apiRequest('/parcels', json('POST', body)),
  collect: (id, pickupCode, collectedByName) => apiRequest(`/parcels/${id}/collect`, json('PATCH', { pickupCode, collectedByName })),
  markReturned: (id) => apiRequest(`/parcels/${id}/return`, json('PATCH')),
};
export const maintenanceApi = {
  list: () => apiRequest('/maintenance'),
  get: (id) => apiRequest(`/maintenance/${id}`),
  create: (body) => apiRequest('/maintenance', json('POST', body)),
  update: (id, body) => apiRequest(`/maintenance/${id}`, json('PATCH', body)),
  remove: (id) => apiRequest(`/maintenance/${id}`, { method: 'DELETE' }),
  complete: (id, body) => apiRequest(`/maintenance/${id}/complete`, json('POST', body)),
};
export const forumApi = {
  list: (kind) => apiRequest(`/forum${kind ? `?kind=${encodeURIComponent(kind)}` : ''}`),
  get: (id) => apiRequest(`/forum/${id}`),
  create: (body) => apiRequest('/forum', json('POST', body)),
  update: (id, body) => apiRequest(`/forum/${id}`, json('PATCH', body)),
  remove: (id) => apiRequest(`/forum/${id}`, { method: 'DELETE' }),
  comment: (id, text) => apiRequest(`/forum/${id}/comments`, json('POST', { text })),
  removeComment: (id, commentId) => apiRequest(`/forum/${id}/comments/${commentId}`, { method: 'DELETE' }),
  like: (id) => apiRequest(`/forum/${id}/like`, json('POST')),
};

export const COURIERS = ['Amazon', 'Flipkart', 'Swiggy / Zomato', 'Blinkit / Zepto', 'BlueDart', 'Delhivery', 'DTDC', 'India Post', 'Myntra', 'Other'];
export const ASSET_CATEGORIES = ['Lift', 'Generator', 'Water Pump', 'Fire Safety', 'STP / WTP', 'CCTV', 'Electrical', 'Plumbing', 'Gym Equipment', 'Swimming Pool', 'Pest Control', 'Other'];
export const FREQUENCIES = ['Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'];
export const POST_KINDS = ['Discussion', 'Buy / Sell', 'Lost & Found', 'Recommendation', 'Help Needed', 'Announcement'];
