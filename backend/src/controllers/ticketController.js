import Apartment from '../models/Apartment.js';
import Block from '../models/Block.js';
import Technician from '../models/Technician.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import WorkOrder from '../models/WorkOrder.js';
import { analyzeComplaintWithAI } from '../ai/complaintAnalyzer.js';
import { detectCollectiveIncidents } from '../ai/collectiveIncidentDetector.js';
import { writeAIAudit } from '../ai/aiAuditLogger.js';
import { writeAudit } from '../utils/audit.js';
import { AppError, asyncHandler, created, nextPublicId, ok, requireFields } from '../utils/http.js';
import { decorateTickets } from '../utils/serializers.js';
import { scopedFilter } from '../middleware/auth.js';

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

const authFilter = (user) => scopedFilter(user, { residentField: 'residentId', blockField: 'blockId', technicianField: 'assignedTechnicianId' });

export const listTickets = asyncHandler(async (req, res) => {
  const filter = req.user ? authFilter(req.user) : await roleFilter(req.query);
  const records = await Ticket.find(filter).sort({ createdAt: -1 });
  ok(res, await decorateTickets(records), { count: records.length });
});

export const getTicket = asyncHandler(async (req, res) => {
  const filter = req.user ? authFilter(req.user) : await roleFilter(req.query);
  const record = await Ticket.findOne({ ticketId: req.params.ticketId, ...filter });
  if (!record) throw new AppError(404, 'Ticket not found.');
  ok(res, (await decorateTickets([record]))[0]);
});

export const createTicket = asyncHandler(async (req, res) => {
  if (req.user.role === 'RESIDENT') req.body = { ...req.body, residentId: req.user.userId, apartmentId: req.user.apartmentId, blockId: req.user.blockId, communityId: req.user.communityId };
  requireFields(req.body, ['title', 'description', 'residentId', 'apartmentId', 'blockId', 'communityId']);
  const [resident, apartment, block] = await Promise.all([
    User.findOne({ userId: req.body.residentId, role: 'RESIDENT' }), Apartment.findOne({ apartmentId: req.body.apartmentId }), Block.findOne({ blockId: req.body.blockId }),
  ]);
  if (!resident || !apartment || !block) throw new AppError(400, 'Resident, apartment, or block reference is invalid.');
  if (apartment.blockId !== block.blockId || resident.blockId !== block.blockId || apartment.communityId !== req.body.communityId || block.communityId !== req.body.communityId || resident.communityId !== req.body.communityId) throw new AppError(400, 'Resident, apartment, block, and community references must match.');
  if (req.user.role === 'BLOCK_SUB_ADMIN' && req.user.blockId !== block.blockId) throw new AppError(403, 'You can only create tickets in your assigned block.');
  const analysis = await analyzeComplaintWithAI({ title: req.body.title, description: req.body.description, category: req.body.category, resident: { userId: resident.userId, apartmentId: resident.apartmentId, blockId: resident.blockId }, block: { blockId: block.blockId, name: block.name }, apartment: { apartmentId: apartment.apartmentId, number: apartment.number } });
  const ticketId = await nextPublicId(Ticket, 'ticketId', 'TK');
  const record = await Ticket.create({
    ticketId, title: req.body.title, description: req.body.description, residentId: req.body.residentId, apartmentId: req.body.apartmentId, blockId: req.body.blockId, communityId: req.body.communityId,
    category: analysis.category, severity: analysis.severity, safetyRisk: analysis.safetyRisk, suggestedAction: analysis.suggestedAction, humanApprovalRequired: analysis.safetyRisk, aiAnalysis: { ...analysis, humanApprovalRequired: analysis.safetyRisk, reviewedByHuman: false, createdAt: new Date() }, status: 'New', priority: analysis.severity, slaDueDate: new Date(Date.now() + (analysis.severity === 'Critical' ? 1 : analysis.severity === 'High' ? 4 : analysis.severity === 'Medium' ? 24 : 72) * 3600000), timeline: [
      { message: `Ticket created by ${resident.name}`, actor: resident.userId },
      { message: analysis.safetyRisk ? `${analysis.fallbackUsed ? 'Fallback rules' : 'Claude'} detected a safety risk` : `${analysis.fallbackUsed ? 'Fallback rule' : 'Claude'} analysis completed`, actor: 'AI_SERVICE' },
    ],
  });
  await writeAudit({ action: 'TICKET_CREATED', entityType: 'Ticket', entityId: ticketId, actorId: resident.userId, message: `Complaint created with ${analysis.severity.toLowerCase()} severity.` });
  await writeAIAudit({ action: 'AI_COMPLAINT_ANALYSIS_GENERATED', entityType: 'Ticket', entityId: ticketId, actorId: resident.userId, message: `${analysis.provider} analysis generated with confidence ${analysis.confidence}; fallback ${analysis.fallbackUsed}.` });
  if (analysis.safetyRisk) await writeAIAudit({ action: 'AI_SAFETY_RISK_DETECTED', entityType: 'Ticket', entityId: ticketId, actorId: resident.userId, message: `${analysis.safetyRiskType || 'Safety risk'} requires human approval.` });
  detectCollectiveIncidents({ ticket: record, actorId: resident.userId }).catch((error) => console.warn(`Incident detection skipped: ${error.message}`));
  created(res, (await decorateTickets([record]))[0]);
});

export const assignTechnician = asyncHandler(async (req, res) => {
  requireFields(req.body, ['technicianId']);
  const [ticket, technician] = await Promise.all([Ticket.findOne({ ticketId: req.params.ticketId, ...authFilter(req.user) }), Technician.findOne({ technicianId: req.body.technicianId })]);
  if (!ticket) throw new AppError(404, 'Ticket not found.');
  if (!technician) throw new AppError(400, 'Technician not found.');
  if (technician.communityId !== ticket.communityId || (technician.blockId && technician.blockId !== ticket.blockId)) throw new AppError(400, 'Technician is not assigned to this ticket location.');
  ticket.assignedTechnicianId = technician.technicianId;
  if (ticket.status === 'New') ticket.status = 'Assigned';
  ticket.timeline.push({ message: `Technician assigned: ${technician.name}`, actor: req.user.userId });
  await ticket.save();
  const existingWorkOrder = await WorkOrder.findOne({ ticketId: ticket.ticketId });
  if (!existingWorkOrder) {
    const workOrderId = await nextPublicId(WorkOrder, 'workOrderId', 'WO');
    await WorkOrder.create({ workOrderId, ticketId: ticket.ticketId, technicianId: technician.technicianId, blockId: ticket.blockId, communityId: ticket.communityId, title: ticket.title, description: ticket.description, status: 'Assigned' });
  } else if (existingWorkOrder.technicianId !== technician.technicianId) {
    existingWorkOrder.technicianId = technician.technicianId; existingWorkOrder.status = 'Assigned'; await existingWorkOrder.save();
  }
  await writeAudit({ action: 'TECHNICIAN_ASSIGNED', entityType: 'Ticket', entityId: ticket.ticketId, actorId: req.user.userId, message: `${technician.name} assigned to ${ticket.ticketId}.` });
  ok(res, (await decorateTickets([ticket]))[0]);
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  requireFields(req.body, ['status']);
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId, ...authFilter(req.user) });
  if (!ticket) throw new AppError(404, 'Ticket not found.');
  if (!['New', 'Assigned', 'In Progress', 'Resolved', 'Closed'].includes(req.body.status)) throw new AppError(400, 'Invalid ticket status.');
  if (req.user.role === 'TECHNICIAN' && !['In Progress', 'Resolved'].includes(req.body.status)) throw new AppError(403, 'Technicians can only start or resolve assigned work.');
  ticket.status = req.body.status;
  ticket.timeline.push({ message: `Status updated to ${req.body.status}`, actor: req.user.userId });
  await ticket.save();
  await writeAudit({ action: 'STATUS_UPDATED', entityType: 'Ticket', entityId: ticket.ticketId, actorId: req.user.userId, message: `${ticket.ticketId} status updated to ${req.body.status}.` });
  ok(res, (await decorateTickets([ticket]))[0]);
});

export const addComment = asyncHandler(async (req, res) => {
  requireFields(req.body, ['message']);
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId, ...authFilter(req.user) });
  if (!ticket) throw new AppError(404, 'Ticket not found.');
  ticket.comments.push({ message: req.body.message, actorId: req.user.userId });
  ticket.timeline.push({ message: 'Comment added', actor: req.user.userId });
  await ticket.save();
  await writeAudit({ action: 'TICKET_COMMENTED', entityType: 'Ticket', entityId: ticket.ticketId, actorId: req.user.userId, message: `Comment added to ${ticket.ticketId}.` });
  ok(res, (await decorateTickets([ticket]))[0]);
});

export const reopenTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId, ...authFilter(req.user) });
  if (!ticket) throw new AppError(404, 'Ticket not found.');
  if (!['Resolved', 'Closed'].includes(ticket.status)) throw new AppError(409, 'Only resolved or closed tickets can be reopened.');
  ticket.status = 'New'; ticket.timeline.push({ message: 'Ticket reopened', actor: req.user.userId }); await ticket.save();
  await writeAudit({ action: 'TICKET_REOPENED', entityType: 'Ticket', entityId: ticket.ticketId, actorId: req.user.userId, message: `${ticket.ticketId} reopened.` });
  ok(res, (await decorateTickets([ticket]))[0]);
});

export const escalateTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId, ...authFilter(req.user) });
  if (!ticket) throw new AppError(404, 'Ticket not found.');
  ticket.escalationFlag = req.body.escalated !== false;
  ticket.priority = ticket.escalationFlag ? 'Critical' : ticket.priority;
  ticket.timeline.push({ message: ticket.escalationFlag ? 'Ticket escalated' : 'Escalation cleared', actor: req.user.userId }); await ticket.save();
  await writeAudit({ action: 'TICKET_ESCALATION_UPDATED', entityType: 'Ticket', entityId: ticket.ticketId, actorId: req.user.userId, message: `${ticket.ticketId} escalation set to ${ticket.escalationFlag}.` });
  ok(res, (await decorateTickets([ticket]))[0]);
});
