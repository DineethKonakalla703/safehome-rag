import Bill from '../models/Bill.js';
import Ticket from '../models/Ticket.js';
import { writeAudit } from '../utils/audit.js';
import { AppError, asyncHandler, created, nextPublicId, ok, requireFields } from '../utils/http.js';
import { decorateBills } from '../utils/serializers.js';
import User from '../models/User.js';
import { scopedFilter } from '../middleware/auth.js';
import { notifyBillCreated, notifyBillPaid } from '../services/notificationService.js';
import { calculateTaxBreakdown, createPaymentOrder, generateInvoiceNumber, verifyPaymentSignature } from '../services/paymentGatewayService.js';

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
  notifyBillCreated(record).catch((err) => console.warn(`Notification error: ${err.message}`));
  created(res, (await decorateBills([record]))[0]);
});

export const updateBillStatus = asyncHandler(async (req, res) => {
  requireFields(req.body, ['status']);
  if (!['Pending', 'Paid', 'Failed', 'Cancelled'].includes(req.body.status)) throw new AppError(400, 'Invalid payment status.');
  const record = await Bill.findOne({ billId: req.params.id, ...scopedFilter(req.user, { residentField: 'residentId', blockField: 'blockId' }) });
  if (!record) throw new AppError(404, 'Bill not found.');
  record.paymentStatus = req.body.status;
  record.paymentMethod = req.body.paymentMethod || record.paymentMethod;
  if (record.paymentStatus === 'Paid') {
    record.paidAt = new Date();
    record.receiptNumber = record.receiptNumber || `RCT-${Date.now()}`;
  }
  await record.save();
  await writeAudit({ action: 'BILL_STATUS_UPDATED', entityType: 'Bill', entityId: record.billId, actorId: req.user.userId, message: `${record.billId} updated to ${record.paymentStatus}.` });
  if (record.paymentStatus === 'Paid') {
    notifyBillPaid(record).catch((err) => console.warn(`Notification error: ${err.message}`));
  }
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
    const createdBill = await Bill.create({ billId, ticketId, residentId: resident.userId, apartmentId: resident.apartmentId, blockId: resident.blockId, communityId: resident.communityId, serviceCharge: amount, partsCharge: 0, totalAmount: amount, billType: 'Monthly', billingMonth: month, paymentStatus: 'Pending', dueDate: req.body.dueDate || new Date(Date.now() + 15 * 86400000) });
    generated.push(createdBill);
    notifyBillCreated(createdBill).catch((err) => console.warn(`Notification error: ${err.message}`));
  }
  await writeAudit({ action: 'MONTHLY_BILLS_GENERATED', entityType: 'Bill', entityId: month, actorId: req.user.userId, message: `${generated.length} monthly bills generated for ${month}.` });
  created(res, await decorateBills(generated));
});

export const residentBills = asyncHandler(async (req, res) => {
  if (req.user.role === 'RESIDENT' && req.user.userId !== req.params.residentId) throw new AppError(403, 'You can only view your own bills.');
  const records = await Bill.find({ residentId: req.params.residentId, ...scopedFilter(req.user, { residentField: 'residentId', blockField: 'blockId' }) }).sort({ generatedAt: -1 });
  ok(res, await decorateBills(records));
});

export const createCheckoutOrder = asyncHandler(async (req, res) => {
  const bill = await Bill.findOne({ billId: req.params.id, ...scopedFilter(req.user, { residentField: 'residentId', blockField: 'blockId' }) });
  if (!bill) throw new AppError(404, 'Bill not found.');
  if (bill.paymentStatus === 'Paid') throw new AppError(400, 'This bill has already been settled.');

  const orderData = await createPaymentOrder(bill);
  bill.orderId = orderData.orderId;
  await bill.save();

  ok(res, {
    ...orderData,
    billId: bill.billId,
    totalAmount: bill.totalAmount,
    taxBreakdown: calculateTaxBreakdown(bill.totalAmount),
  });
});

export const verifyCheckoutPayment = asyncHandler(async (req, res) => {
  requireFields(req.body, ['orderId', 'paymentId']);
  const { orderId, paymentId, signature, paymentMethod } = req.body;

  const bill = await Bill.findOne({ billId: req.params.id, ...scopedFilter(req.user, { residentField: 'residentId', blockField: 'blockId' }) });
  if (!bill) throw new AppError(404, 'Bill not found.');
  if (bill.paymentStatus === 'Paid') throw new AppError(400, 'This bill has already been paid.');

  const isValid = verifyPaymentSignature({ orderId, paymentId, signature });
  if (!isValid) throw new AppError(400, 'Payment verification failed: Invalid transaction signature.');

  bill.paymentStatus = 'Paid';
  bill.paymentMethod = paymentMethod || 'Online - UPI / Card';
  bill.paidAt = new Date();
  bill.paymentId = paymentId;
  bill.orderId = orderId;
  bill.receiptNumber = bill.receiptNumber || `RCT-${bill.billId}-${Date.now().toString().slice(-6)}`;
  bill.taxInvoiceNumber = generateInvoiceNumber(bill.billId);
  bill.taxBreakdown = calculateTaxBreakdown(bill.totalAmount);

  await bill.save();
  await writeAudit({
    action: 'BILL_PAID_GATEWAY',
    entityType: 'Bill',
    entityId: bill.billId,
    actorId: req.user.userId,
    message: `Payment of ₹${bill.totalAmount} verified via gateway (${paymentId}).`,
  });

  notifyBillPaid(bill).catch((err) => console.warn(`Notification error: ${err.message}`));
  ok(res, (await decorateBills([bill]))[0]);
});

export const getTaxInvoiceData = asyncHandler(async (req, res) => {
  const bill = await Bill.findOne({ billId: req.params.id, ...scopedFilter(req.user, { residentField: 'residentId', blockField: 'blockId' }) });
  if (!bill) throw new AppError(404, 'Bill not found.');

  const decorated = (await decorateBills([bill]))[0];
  const taxInfo = bill.taxBreakdown?.baseAmount ? bill.taxBreakdown : calculateTaxBreakdown(bill.totalAmount);
  const invoiceNumber = bill.taxInvoiceNumber || generateInvoiceNumber(bill.billId);

  const invoiceData = {
    invoiceNumber,
    bill: decorated,
    society: {
      name: 'Green Valley Residency Resident Welfare Association',
      registrationNumber: 'AP/RWA/2024/0981',
      gstin: '37AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      address: 'Green Valley Residency, Auto Nagar Bypass, Vijayawada, AP - 520007',
      contactEmail: 'accounts@safehome-residency.org',
      contactPhone: '+91 866 245 9900',
    },
    sacCode: '9995',
    sacDescription: 'Resident Society Maintenance & Property Facility Repairs',
    taxBreakdown: taxInfo,
    paymentProof: {
      paymentStatus: bill.paymentStatus,
      paidAt: bill.paidAt,
      paymentMethod: bill.paymentMethod || 'Online Gateway',
      receiptNumber: bill.receiptNumber,
      paymentId: bill.paymentId,
      orderId: bill.orderId,
    },
  };

  ok(res, invoiceData);
});

export const handlePaymentWebhook = asyncHandler(async (req, res) => {
  const { event, payload } = req.body || {};
  if (event === 'payment.captured' && payload?.payment?.entity?.order_id) {
    const orderId = payload.payment.entity.order_id;
    const paymentId = payload.payment.entity.id;
    const bill = await Bill.findOne({ orderId });
    if (bill && bill.paymentStatus !== 'Paid') {
      bill.paymentStatus = 'Paid';
      bill.paidAt = new Date();
      bill.paymentId = paymentId;
      bill.paymentMethod = 'Gateway Webhook';
      bill.receiptNumber = bill.receiptNumber || `RCT-${bill.billId}-${Date.now().toString().slice(-6)}`;
      bill.taxInvoiceNumber = generateInvoiceNumber(bill.billId);
      bill.taxBreakdown = calculateTaxBreakdown(bill.totalAmount);
      await bill.save();
      notifyBillPaid(bill).catch((err) => console.warn(`Notification error: ${err.message}`));
    }
  }
  ok(res, { received: true });
});

