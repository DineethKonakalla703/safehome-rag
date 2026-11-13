import { apiRequest, createCrudApi } from './apiClient';

const post = (path, body = {}) => apiRequest(path, { method: 'POST', body: JSON.stringify(body) });
const patch = (path, body = {}) => apiRequest(path, { method: 'PATCH', body: JSON.stringify(body) });

export const staffApi = { ...createCrudApi('/staff'), checkIn: (id) => patch(`/staff/${id}/check-in`), checkOut: (id) => patch(`/staff/${id}/check-out`) };
export const ledgerApi = { ...createCrudApi('/accounts'), summary: (months = 6) => apiRequest(`/accounts/summary?months=${months}`) };
export const pollApi = { ...createCrudApi('/polls'), vote: (id, optionId) => post(`/polls/${id}/vote`, { optionId }), close: (id) => patch(`/polls/${id}/close`) };
export const eventApi = { ...createCrudApi('/events'), rsvp: (id, response, guests = 0) => post(`/events/${id}/rsvp`, { response, guests }) };
export const sosApi = {
  list: (status) => apiRequest(`/sos${status ? `?status=${status}` : ''}`),
  raise: (body) => post('/sos', body),
  acknowledge: (id, note) => patch(`/sos/${id}/acknowledge`, { note }),
  resolve: (id, note, falseAlarm = false) => patch(`/sos/${id}/resolve`, { note, falseAlarm }),
};

export const STAFF_TYPES = ['Maid', 'Cook', 'Driver', 'Nanny', 'Gardener', 'Car Cleaner', 'Society Staff', 'Security Guard', 'Electrician', 'Plumber', 'Other'];
export const EVENT_CATEGORIES = ['Festival', 'Meeting', 'AGM', 'Sports', 'Kids', 'Workshop', 'Health', 'Maintenance', 'Other'];
export const EMERGENCY_TYPES = ['Medical', 'Fire', 'Gas Leak', 'Security Threat', 'Lift Stuck', 'Flooding', 'Electrical Hazard', 'Other'];
