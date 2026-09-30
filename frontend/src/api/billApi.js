import { apiRequest, normalizeBill } from './apiClient';
export async function getBills() { return (await apiRequest('/bills')).map(normalizeBill); }
export async function createBill(ticketId) { return normalizeBill(await apiRequest('/bills', { method: 'POST', body: JSON.stringify({ ticketId }) })); }
export async function updateBillStatus(id, status, paymentMethod = 'Manual') { return normalizeBill(await apiRequest(`/bills/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, paymentMethod }) })); }
export async function generateMonthlyBills(body) { return (await apiRequest('/bills/monthly-generate', { method: 'POST', body: JSON.stringify(body) })).map(normalizeBill); }
export async function getResidentBills(id) { return (await apiRequest(`/bills/resident/${id}`)).map(normalizeBill); }
