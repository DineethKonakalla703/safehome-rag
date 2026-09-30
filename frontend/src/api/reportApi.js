import { apiRequest } from './apiClient';
export const getReports = () => Promise.all(['tickets', 'billing', 'technicians', 'residents', 'sla'].map(async (name) => [name, await apiRequest(`/reports/${name}`)])).then(Object.fromEntries);
export const getAuditLogs = () => apiRequest('/audit-logs');
