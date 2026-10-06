import { apiRequest } from './apiClient';

export async function getIncidents() {
  return apiRequest('/incidents');
}

export async function getIncident(id) {
  return apiRequest(`/incidents/${id}`);
}

export async function updateIncidentStatus(id, status, extra = {}) {
  return apiRequest(`/incidents/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, ...extra }),
  });
}

export async function addIncidentComment(id, comment) {
  return apiRequest(`/incidents/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  });
}

export async function assignIncident(id, { assignedTo, assignedToType }) {
  return apiRequest(`/incidents/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify({ assignedTo, assignedToType }),
  });
}

export async function mergeTicketToIncident(id, ticketId) {
  return apiRequest(`/incidents/${id}/merge-ticket`, {
    method: 'POST',
    body: JSON.stringify({ ticketId }),
  });
}

export async function removeTicketFromIncident(id, ticketId) {
  return apiRequest(`/incidents/${id}/remove-ticket`, {
    method: 'POST',
    body: JSON.stringify({ ticketId }),
  });
}

export async function notifyAffectedResidents(id, message) {
  return apiRequest(`/incidents/${id}/notify-residents`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export async function getIncidentAudit(id) {
  return apiRequest(`/incidents/${id}/audit`);
}
