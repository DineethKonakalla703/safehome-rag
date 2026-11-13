import Bill from '../models/Bill.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import WorkOrder from '../models/WorkOrder.js';
import { scopedFilter } from '../middleware/auth.js';
import { asyncHandler, ok } from '../utils/http.js';

const ticketScope = (user) => scopedFilter(user, { residentField: 'residentId', blockField: 'blockId', technicianField: 'assignedTechnicianId' });
const billScope = (user) => scopedFilter(user, { residentField: 'residentId', blockField: 'blockId' });

const groupedCount = (Model, match, field) => Model.aggregate([{ $match: match }, { $group: { _id: `$${field}`, count: { $sum: 1 } } }, { $sort: { count: -1 } }]);

export const ticketReport = asyncHandler(async (req, res) => {
  const match = ticketScope(req.user);
  const [byStatus, byCategory, highRisk, byBlock] = await Promise.all([groupedCount(Ticket, match, 'status'), groupedCount(Ticket, match, 'category'), Ticket.countDocuments({ ...match, safetyRisk: true }), groupedCount(Ticket, match, 'blockId')]);
  ok(res, { byStatus, byCategory, highRisk, byBlock });
});
export const billingReport = asyncHandler(async (req, res) => {
  const match = billScope(req.user);
  const [byStatus, totals] = await Promise.all([groupedCount(Bill, match, 'paymentStatus'), Bill.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$totalAmount' }, lateFees: { $sum: '$lateFee' } } }])]);
  ok(res, { byStatus, totalAmount: totals[0]?.total || 0, lateFees: totals[0]?.lateFees || 0 });
});
export const technicianReport = asyncHandler(async (req, res) => ok(res, { workload: await groupedCount(WorkOrder, scopedFilter(req.user, { blockField: 'blockId', technicianField: 'technicianId' }), 'technicianId'), completed: await WorkOrder.countDocuments({ ...scopedFilter(req.user, { blockField: 'blockId', technicianField: 'technicianId' }), status: 'Completed' }) }));
export const residentReport = asyncHandler(async (req, res) => ok(res, { byBlock: await groupedCount(User, { role: 'RESIDENT', ...scopedFilter(req.user, { residentField: 'userId', blockField: 'blockId' }) }, 'blockId'), active: await User.countDocuments({ role: 'RESIDENT', status: 'Active', ...scopedFilter(req.user, { residentField: 'userId', blockField: 'blockId' }) }) }));
export const slaReport = asyncHandler(async (req, res) => {
  const scope = ticketScope(req.user); const now = new Date();
  ok(res, { overdue: await Ticket.countDocuments({ ...scope, slaDueDate: { $lt: now }, status: { $nin: ['Resolved', 'Closed'] } }), withinSla: await Ticket.countDocuments({ ...scope, $or: [{ slaDueDate: { $gte: now } }, { status: { $in: ['Resolved', 'Closed'] } }] }) });
});
