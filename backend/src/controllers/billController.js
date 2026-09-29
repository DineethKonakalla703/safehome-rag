import Bill from '../models/Bill.js';
import Ticket from '../models/Ticket.js';
import { writeAudit } from '../utils/audit.js';
import { AppError, asyncHandler, created, nextPublicId, ok, requireFields } from '../utils/http.js';
import { decorateBills } from '../utils/serializers.js';

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
  const records = await Bill.find(billFilter(req.query)).sort({ generatedAt: -1 });
  ok(res, await decorateBills(records), { count: records.length });
});

export const createBill = asyncHandler(async (req, res) => {
  requireFields(req.body, ['ticketId', 'actorId']);
  const existing = await Bill.findOne({ ticketId: req.body.ticketId });
  if (existing) throw new AppError(409, 'A bill already exists for this ticket.', { billId: existing.billId });
  const ticket = await Ticket.findOne({ ticketId: req.body.ticketId });
  if (!ticket) throw new AppError(404, 'Ticket not found.');
  const serviceCharge = Number(req.body.serviceCharge ?? 300);
  const partsCharge = Number(req.body.partsCharge ?? 200);
  if (!Number.isFinite(serviceCharge) || !Number.isFinite(partsCharge) || serviceCharge < 0 || partsCharge < 0) throw new AppError(400, 'Charges must be non-negative numbers.');
  const billId = await nextPublicId(Bill, 'billId', 'BILL');
  const record = await Bill.create({ billId, ticketId: ticket.ticketId, residentId: ticket.residentId, apartmentId: ticket.apartmentId, blockId: ticket.blockId, communityId: ticket.communityId, serviceCharge, partsCharge, totalAmount: serviceCharge + partsCharge, paymentStatus: 'Pending' });
  await writeAudit({ action: 'BILL_CREATED', entityType: 'Bill', entityId: billId, actorId: req.body.actorId, message: `${billId} generated for ${ticket.ticketId}.` });
  created(res, (await decorateBills([record]))[0]);
});

