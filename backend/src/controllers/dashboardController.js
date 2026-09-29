import Bill from '../models/Bill.js';
import Block from '../models/Block.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import { AppError, asyncHandler, ok } from '../utils/http.js';
import { decorateTickets } from '../utils/serializers.js';

const openFilter = { $nin: ['Resolved', 'Closed'] };

export const mainAdminDashboard = asyncHandler(async (req, res) => {
  const [totalBlocks, totalResidents, totalTickets, openTickets, highRiskTickets, pendingBills, paidBills, amountRows, recent] = await Promise.all([
    Block.countDocuments(), User.countDocuments({ role: 'RESIDENT' }), Ticket.countDocuments(), Ticket.countDocuments({ status: openFilter }), Ticket.countDocuments({ safetyRisk: true }), Bill.countDocuments({ paymentStatus: 'Pending' }), Bill.countDocuments({ paymentStatus: 'Paid' }), Bill.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]), Ticket.find().sort({ createdAt: -1 }).limit(5),
  ]);
  ok(res, { summary: { totalBlocks, totalResidents, totalTickets, openTickets, highRiskTickets, pendingBills, paidBills, totalBillingAmount: amountRows[0]?.total || 0 }, recentTickets: await decorateTickets(recent) });
});

export const blockAdminDashboard = asyncHandler(async (req, res) => {
  const block = await Block.findOne({ blockId: req.params.blockId }).lean();
  if (!block) throw new AppError(404, 'Block not found.');
  const filter = { blockId: block.blockId };
  const [blockResidents, blockTickets, openComplaints, highRiskTickets, pendingBills, recent] = await Promise.all([
    User.countDocuments({ ...filter, role: 'RESIDENT' }), Ticket.countDocuments(filter), Ticket.countDocuments({ ...filter, status: openFilter }), Ticket.countDocuments({ ...filter, safetyRisk: true }), Bill.countDocuments({ ...filter, paymentStatus: 'Pending' }), Ticket.find(filter).sort({ createdAt: -1 }).limit(5),
  ]);
  ok(res, { summary: { blockName: block.name, blockResidents, blockTickets, openComplaints, highRiskTickets, pendingBills }, recentTickets: await decorateTickets(recent) });
});

export const residentDashboard = asyncHandler(async (req, res) => {
  const resident = await User.findOne({ userId: req.params.residentId, role: 'RESIDENT' }).lean();
  if (!resident) throw new AppError(404, 'Resident not found.');
  const filter = { residentId: resident.userId };
  const [myTickets, openTickets, myBills, pendingRows, recent] = await Promise.all([
    Ticket.countDocuments(filter), Ticket.countDocuments({ ...filter, status: openFilter }), Bill.countDocuments(filter), Bill.aggregate([{ $match: { ...filter, paymentStatus: 'Pending' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]), Ticket.find(filter).sort({ createdAt: -1 }).limit(5),
  ]);
  ok(res, { summary: { myTickets, openTickets, myBills, pendingAmount: pendingRows[0]?.total || 0, recentTicketStatus: recent[0]?.status || 'No tickets' }, recentTickets: await decorateTickets(recent) });
});

