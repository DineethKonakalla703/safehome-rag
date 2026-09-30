import { apiRequest, normalizeTicket } from './apiClient';
export async function getTickets() { return (await apiRequest('/tickets')).map(normalizeTicket); }
export async function getTicket(id) { return normalizeTicket(await apiRequest(`/tickets/${id}`)); }
export async function createTicket(body) { return normalizeTicket(await apiRequest('/tickets', { method: 'POST', body: JSON.stringify(body) })); }
export async function assignTicket(id, technicianId) { return normalizeTicket(await apiRequest(`/tickets/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ technicianId }) })); }
export async function updateTicketStatus(id, status) { return normalizeTicket(await apiRequest(`/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })); }
export async function addTicketComment(id, message) { return normalizeTicket(await apiRequest(`/tickets/${id}/comments`, { method: 'POST', body: JSON.stringify({ message }) })); }
export async function reopenTicket(id) { return normalizeTicket(await apiRequest(`/tickets/${id}/reopen`, { method: 'POST' })); }
export async function escalateTicket(id, escalated = true) { return normalizeTicket(await apiRequest(`/tickets/${id}/escalate`, { method: 'PATCH', body: JSON.stringify({ escalated }) })); }
