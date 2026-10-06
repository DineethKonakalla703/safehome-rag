export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');
export const assetUrl = (value) => value?.startsWith('/') ? `${API_ORIGIN}${value}` : value;
export const OFFLINE_MESSAGE = 'Backend API is not running. Start backend using: cd backend && npm run dev';

export class ApiError extends Error {
  constructor(message, status = 0, details = null) { super(message); this.name = 'ApiError'; this.status = status; this.details = details; }
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('safehome_token');
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  } catch { throw new ApiError(OFFLINE_MESSAGE); }
  let payload;
  try { payload = await response.json(); } catch { throw new ApiError('The backend returned an unreadable response.', response.status); }
  if (!response.ok || payload.success === false) {
    if (response.status === 401 && token) window.dispatchEvent(new Event('safehome:unauthorized'));
    throw new ApiError(payload?.error?.message || `Request failed with status ${response.status}.`, response.status, payload?.error?.details);
  }
  return payload.data;
}

export async function apiUpload(path, formData, options = {}) {
  const token = localStorage.getItem('safehome_token');
  let response;
  try { response = await fetch(`${API_BASE_URL}${path}`, { ...options, method: options.method || 'POST', body: formData, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } }); }
  catch { throw new ApiError(OFFLINE_MESSAGE); }
  let payload; try { payload = await response.json(); } catch { throw new ApiError('The backend returned an unreadable response.', response.status); }
  if (!response.ok || payload.success === false) throw new ApiError(payload?.error?.message || `Request failed with status ${response.status}.`, response.status, payload?.error?.details);
  return payload.data;
}

export const queryString = (params = {}) => { const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')); return query.toString() ? `?${query}` : ''; };
export const dateOnly = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';
export const normalizeUser = (user) => ({ ...user, id: user.userId });
export const normalizeTicket = (ticket) => ({ ...ticket, id: ticket.ticketId, createdAt: dateOnly(ticket.createdAt), timeline: (ticket.timeline || []).map((item) => ({ ...item, text: item.message, at: item.timestamp ? new Date(item.timestamp).toLocaleString() : '' })) });
export const normalizeBill = (bill) => ({ ...bill, id: bill.billId, generatedAt: dateOnly(bill.generatedAt), dueDate: dateOnly(bill.dueDate) });

export function createCrudApi(path) {
  return {
    list: () => apiRequest(path),
    get: (id) => apiRequest(`${path}/${id}`),
    create: (body) => apiRequest(path, { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiRequest(`${path}/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id) => apiRequest(`${path}/${id}`, { method: 'DELETE' }),
  };
}
