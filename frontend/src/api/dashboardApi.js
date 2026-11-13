import { apiRequest, normalizeTicket } from './apiClient';
export async function getDashboard(user) { const path = user.role === 'MAIN_ADMIN' ? '/dashboard/main-admin' : user.role === 'BLOCK_SUB_ADMIN' ? `/dashboard/block-admin/${user.blockId}` : `/dashboard/resident/${user.id}`; const data = await apiRequest(path); return { ...data, recentTickets: data.recentTickets.map(normalizeTicket) }; }
