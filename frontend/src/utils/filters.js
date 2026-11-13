export function filterTicketsByUser(tickets, user) {
  if (!user) return [];
  if (user.role === 'MAIN_ADMIN') return tickets;
  if (user.role === 'BLOCK_SUB_ADMIN') return tickets.filter((ticket) => ticket.blockId === user.blockId);
  if (user.role === 'RESIDENT') return tickets.filter((ticket) => ticket.residentId === user.id);
  if (user.role === 'TECHNICIAN') return tickets.filter((ticket) => ticket.assignedTechnicianId === (user.technicianId || user.id));
  return [];
}

export function filterBillsByUser(bills, user) {
  if (!user) return [];
  if (user.role === 'MAIN_ADMIN') return bills;
  if (user.role === 'BLOCK_SUB_ADMIN') return bills.filter((bill) => bill.blockId === user.blockId);
  if (user.role === 'RESIDENT') return bills.filter((bill) => bill.residentId === user.id);
  return [];
}

