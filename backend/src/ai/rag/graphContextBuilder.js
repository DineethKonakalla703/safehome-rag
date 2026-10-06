import Apartment from '../../models/Apartment.js';
import Block from '../../models/Block.js';
import Technician from '../../models/Technician.js';
import Ticket from '../../models/Ticket.js';
import { scopedFilter } from '../../middleware/auth.js';

export async function buildGraphContext(user, { ticketId } = {}) {
  const ticketFilter = scopedFilter(user, { residentField: 'residentId', blockField: 'blockId', technicianField: 'assignedTechnicianId' });
  const tickets = ticketId ? await Ticket.find({ ticketId, ...ticketFilter }).limit(1).lean() : await Ticket.find(ticketFilter).sort({ createdAt: -1 }).limit(5).lean();
  const blockIds = [...new Set(tickets.map((item) => item.blockId))]; const apartmentIds = [...new Set(tickets.map((item) => item.apartmentId))]; const technicianIds = [...new Set(tickets.map((item) => item.assignedTechnicianId).filter(Boolean))];
  const [blocks, apartments, technicians] = await Promise.all([Block.find({ blockId: { $in: blockIds } }).lean(), Apartment.find({ apartmentId: { $in: apartmentIds } }).lean(), Technician.find({ technicianId: { $in: technicianIds } }).lean()]);
  return { tickets: tickets.map(({ description, ...item }) => ({ ...item, description: String(description).slice(0, 500) })), blocks, apartments, technicians };
}
