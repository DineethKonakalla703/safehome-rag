import WorkOrder from '../models/WorkOrder.js';
import Ticket from '../models/Ticket.js';
import { scopedFilter } from '../middleware/auth.js';
import { writeAudit } from '../utils/audit.js';
import { AppError, asyncHandler, created, nextPublicId, ok, requireFields } from '../utils/http.js';

const filterFor = (user) => scopedFilter(user, { blockField: 'blockId', technicianField: 'technicianId', residentField: 'residentId' });

export const listWorkOrders = asyncHandler(async (req, res) => {
  const records = await WorkOrder.find(filterFor(req.user)).sort({ createdAt: -1 }).lean();
  const ticketIds = [...new Set(records.map((r) => r.ticketId))];
  const tickets = await Ticket.find({ ticketId: { $in: ticketIds } })
    .select('ticketId apartmentId category severity safetyRisk residentId')
    .lean();
  const ticketMap = new Map(tickets.map((t) => [t.ticketId, t]));
  const enriched = records.map((r) => {
    const t = ticketMap.get(r.ticketId);
    return {
      ...r,
      apartmentId: t?.apartmentId || '',
      category: t?.category || '',
      severity: t?.severity || '',
      safetyRisk: t?.safetyRisk || false,
    };
  });
  ok(res, enriched);
});

export const createWorkOrder = asyncHandler(async (req, res) => {
  requireFields(req.body, ['ticketId', 'technicianId']);
  const ticket = await Ticket.findOne({ ticketId: req.body.ticketId, ...scopedFilter(req.user, { blockField: 'blockId' }) });
  if (!ticket) throw new AppError(404, 'Ticket not found.');
  if (await WorkOrder.exists({ ticketId: ticket.ticketId })) throw new AppError(409, 'A work order already exists for this ticket.');
  const workOrderId = await nextPublicId(WorkOrder, 'workOrderId', 'WO');
  const record = await WorkOrder.create({ workOrderId, ticketId: ticket.ticketId, technicianId: req.body.technicianId, blockId: ticket.blockId, communityId: ticket.communityId, title: req.body.title || ticket.title, description: req.body.description || ticket.description, scheduledAt: req.body.scheduledAt || null });
  await writeAudit({ action: 'WORK_ORDER_CREATED', entityType: 'WorkOrder', entityId: workOrderId, actorId: req.user.userId, message: `${workOrderId} created for ${ticket.ticketId}.` });
  created(res, record);
});

export const updateWorkOrderStatus = asyncHandler(async (req, res) => {
  requireFields(req.body, ['status']);
  if (!['Assigned', 'In Progress', 'Completed', 'Cancelled'].includes(req.body.status)) throw new AppError(400, 'Invalid work order status.');
  const record = await WorkOrder.findOne({ workOrderId: req.params.id, ...filterFor(req.user) });
  if (!record) throw new AppError(404, 'Work order not found.');
  record.status = req.body.status;
  if (req.body.completionNote !== undefined) record.completionNote = req.body.completionNote;
  if (record.status === 'Completed') record.completedAt = new Date();
  await record.save();
  if (record.status === 'Completed') await Ticket.findOneAndUpdate({ ticketId: record.ticketId }, { status: 'Resolved', $push: { timeline: { message: 'Work order completed', actor: req.user.userId } } });
  else if (record.status === 'In Progress') await Ticket.findOneAndUpdate({ ticketId: record.ticketId }, { status: 'In Progress', $push: { timeline: { message: 'Work order started', actor: req.user.userId } } });
  await writeAudit({ action: 'WORK_ORDER_STATUS_UPDATED', entityType: 'WorkOrder', entityId: record.workOrderId, actorId: req.user.userId, message: `${record.workOrderId} updated to ${record.status}.` });
  ok(res, record);
});
