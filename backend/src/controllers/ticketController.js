import Apartment from '../models/Apartment.js';
import Block from '../models/Block.js';
import Technician from '../models/Technician.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import { analyzeComplaint } from '../utils/aiRules.js';
import { writeAudit } from '../utils/audit.js';
import { AppError, asyncHandler, created, nextPublicId, ok, requireFields } from '../utils/http.js';
import { decorateTickets } from '../utils/serializers.js';

async function roleFilter(query) {
  const { role, userId, blockId } = query;
  if (role === 'BLOCK_SUB_ADMIN') {
    if (!blockId) throw new AppError(400, 'blockId is required for Block Sub Admin filtering.');
    return { blockId };
  }
  if (role === 'RESIDENT') {
    if (!userId) throw new AppError(400, 'userId is required for Resident filtering.');
    return { residentId: userId };
  }
  if (role === 'TECHNICIAN') {
    if (!userId) throw new AppError(400, 'userId is required for Technician filtering.');
    const user = await User.findOne({ userId }).lean();
    return { assignedTechnicianId: user?.technicianId || '__none__' };
  }
  return {};
}

export const listTickets = asyncHandler(async (req, res) => {
  const filter = await roleFilter(req.query);
  const records = await Ticket.find(filter).sort({ createdAt: -1 });
  ok(res, await decorateTickets(records), { count: records.length });
});

export const getTicket = asyncHandler(async (req, res) => {
  const filter = await roleFilter(req.query);
  const record = await Ticket.findOne({ ticketId: req.params.ticketId, ...filter });
  if (!record) throw new AppError(404, 'Ticket not found.');
  ok(res, (await decorateTickets([record]))[0]);
});

export const createTicket = asyncHandler(async (req, res) => {
  requireFields(req.body, ['title', 'description', 'residentId', 'apartmentId', 'blockId', 'communityId']);
  const [resident, apartment, block] = await Promise.all([
    User.findOne({ userId: req.body.residentId, role: 'RESIDENT' }), Apartment.findOne({ apartmentId: req.body.apartmentId }), Block.findOne({ blockId: req.body.blockId }),
  ]);
  if (!resident || !apartment || !block) throw new AppError(400, 'Resident, apartment, or block reference is invalid.');
  if (apartment.blockId !== block.blockId || resident.blockId !== block.blockId) throw new AppError(400, 'Resident, apartment, and block must belong to the same block.');
  const analysis = analyzeComplaint(req.body.description);
  const ticketId = await nextPublicId(Ticket, 'ticketId', 'TK');
  const record = await Ticket.create({
    ticketId, title: req.body.title, description: req.body.description, residentId: req.body.residentId, apartmentId: req.body.apartmentId, blockId: req.body.blockId, communityId: req.body.communityId,
    ...analysis, status: 'New', timeline: [
      { message: `Ticket created by ${resident.name}`, actor: resident.userId },
      { message: analysis.safetyRisk ? 'AI simulation detected high safety risk' : 'AI simulation completed', actor: 'RULE_ENGINE' },
    ],
  });
  await writeAudit({ action: 'TICKET_CREATED', entityType: 'Ticket', entityId: ticketId, actorId: resident.userId, message: `Complaint created with ${analysis.severity.toLowerCase()} severity.` });
  created(res, (await decorateTickets([record]))[0]);
});

export const assignTechnician = asyncHandler(async (req, res) => {
  requireFields(req.body, ['technicianId', 'actorId']);
  const [ticket, technician] = await Promise.all([Ticket.findOne({ ticketId: req.params.ticketId }), Technician.findOne({ technicianId: req.body.technicianId })]);
  if (!ticket) throw new AppError(404, 'Ticket not found.');
  if (!technician) throw new AppError(400, 'Technician not found.');
  ticket.assignedTechnicianId = technician.technicianId;
  if (ticket.status === 'New') ticket.status = 'Assigned';
  ticket.timeline.push({ message: `Technician assigned: ${technician.name}`, actor: req.body.actorId });
  await ticket.save();
  await writeAudit({ action: 'TECHNICIAN_ASSIGNED', entityType: 'Ticket', entityId: ticket.ticketId, actorId: req.body.actorId, message: `${technician.name} assigned to ${ticket.ticketId}.` });
  ok(res, (await decorateTickets([ticket]))[0]);
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  requireFields(req.body, ['status', 'actorId']);
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
  if (!ticket) throw new AppError(404, 'Ticket not found.');
  if (!['New', 'Assigned', 'In Progress', 'Resolved', 'Closed'].includes(req.body.status)) throw new AppError(400, 'Invalid ticket status.');
  ticket.status = req.body.status;
  ticket.timeline.push({ message: `Status updated to ${req.body.status}`, actor: req.body.actorId });
  await ticket.save();
  await writeAudit({ action: 'STATUS_UPDATED', entityType: 'Ticket', entityId: ticket.ticketId, actorId: req.body.actorId, message: `${ticket.ticketId} status updated to ${req.body.status}.` });
  ok(res, (await decorateTickets([ticket]))[0]);
});

