import Bill from '../models/Bill.js';
import Ticket from '../models/Ticket.js';
import { writeAudit } from '../utils/audit.js';
import { AppError, asyncHandler, created, nextPublicId, ok, requireFields } from '../utils/http.js';
import { decorateBills } from '../utils/serializers.js';
import User from '../models/User.js';
import { scopedFilter } from '../middleware/auth.js';

function billFilter({ role, userId, blockId }) {
  if (role === 'BLOCK_SUB_ADMIN') {
    if (!blockId) throw new AppError(400, 'blockId is required for Block Sub Admin filtering.');
    return { blockId };
  }
  if (role === 'RESIDENT') {
    if (!userId) throw new AppError(400, 'userId is required for Resident filtering.');
    return { residentId: userId };
  }
  if (role === 'TECHNICIAN') return { _id: null };
  return {};
}

export const listBills = asyncHandler(async (req, res) => {
  const filter = req.user ? scopedFilter(req.user, { residentField: 'residentId', blockField: 'blockId' }) : billFilter(req.query);
  const records = await Bill.find(filter).sort({ generatedAt: -1 });
  ok(res, await decorateBills(records), { count: records.length });
});

export const createBill = asyncHandler(async (req, res) => {
  requireFields(req.body, ['ticketId']);
  const existing = await Bill.findOne({ ticketId: req.body.ticketId });
  if (existing) throw new AppError(409, 'A bill already exists for this ticket.', { billId: existing.billId });
  const ticket = await Ticket.findOne({ ticketId: req.body.ticketId, ...scopedFilter(req.user, { residentField: 'residentId', blockField: 'blockId' }) });
  if (!ticket) throw new AppError(404, 'Ticket not found.');
  const serviceCharge = Number(req.body.serviceCharge ?? 300);
  const partsCharge = Number(req.body.partsCharge ?? 200);
  if (!Number.isFinite(serviceCharge) || !Number.isFinite(partsCharge) || serviceCharge < 0 || partsCharge < 0) throw new AppError(400, 'Charges must be non-negative numbers.');
  const billId = await nextPublicId(Bill, 'billId', 'BILL');
  const record = await Bill.create({ billId, ticketId: ticket.ticketId, residentId: ticket.residentId, apartmentId: ticket.apartmentId, blockId: ticket.blockId, communityId: ticket.communityId, serviceCharge, partsCharge, totalAmount: serviceCharge + partsCharge, paymentStatus: 'Pending', billType: 'Repair', dueDate: req.body.dueDate || new Date(Date.now() + 14 * 86400000) });
  await writeAudit({ action: 'BILL_CREATED', entityType: 'Bill', entityId: billId, actorId: req.user.userId, message: `${billId} generated for ${ticket.ticketId}.` });
  created(res, (await decorateBills([record]))[0]);
});

export const updateBillStatus = asyncHandler(async (req, res) => {
  requireFields(req.body, ['status']);
  if (!['Pending', 'Paid', 'Failed', 'Cancelled'].includes(req.body.status)) throw new AppError(400, 'Invalid payment status.');
  const record = await Bill.findOne({ billId: req.params.id, ...scopedFilter(req.user, { residentField: 'residentId', blockField: 'blockId' }) });
  if (!record) throw new AppError(404, 'Bill not found.');
  record.paymentStatus = req.body.status;
  record.paymentMethod = req.body.paymentMethod || record.paymentMethod;
  if (record.paymentStatus === 'Paid') { record.paidAt = new Date(); record.receiptNumber = record.receiptNumber || `RCT-${Date.now()}`; }
  await record.save();
  await writeAudit({ action: 'BILL_STATUS_UPDATED', entityType: 'Bill', entityId: record.billId, actorId: req.user.userId, message: `${record.billId} updated to ${record.paymentStatus}.` });
  ok(res, (await decorateBills([record]))[0]);
});

export const generateMonthlyBills = asyncHandler(async (req, res) => {
  const month = req.body.month || new Date().toISOString().slice(0, 7);
  const amount = Number(req.body.amount ?? 1500);
  if (!Number.isFinite(amount) || amount < 0) throw new AppError(400, 'Monthly amount must be a non-negative number.');
  const residents = await User.find({ role: 'RESIDENT', status: 'Active', ...scopedFilter(req.user, { residentField: 'userId', blockField: 'blockId' }) }).lean();
  const generated = [];
  for (const resident of residents) {
    const ticketId = `MONTHLY-${resident.userId}-${month}`;
    if (await Bill.exists({ ticketId })) continue;
    const billId = await nextPublicId(Bill, 'billId', 'BILL');
    generated.push(await Bill.create({ billId, ticketId, residentId: resident.userId, apartmentId: resident.apartmentId, blockId: resident.blockId, communityId: resident.communityId, serviceCharge: amount, partsCharge: 0, totalAmount: amount, billType: 'Monthly', billingMonth: month, paymentStatus: 'Pending', dueDate: req.body.dueDate || new Date(Date.now() + 15 * 86400000) }));
  }
  await writeAudit({ action: 'MONTHLY_BILLS_GENERATED', entityType: 'Bill', entityId: month, actorId: req.user.userId, message: `${generated.length} monthly bills generated for ${month}.` });
  created(res, await decorateBills(generated));
});

export const residentBills = asyncHandler(async (req, res) => {
  if (req.user.role === 'RESIDENT' && req.user.userId !== req.params.residentId) throw new AppError(403, 'You can only view your own bills.');
  const records = await Bill.find({ residentId: req.params.residentId, ...scopedFilter(req.user, { residentField: 'residentId', blockField: 'blockId' }) }).sort({ generatedAt: -1 });
  ok(res, await decorateBills(records));
});
