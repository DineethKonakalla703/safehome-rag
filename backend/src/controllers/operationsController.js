import AmenityBooking from '../models/AmenityBooking.js';
import InventoryItem from '../models/InventoryItem.js';
import ParkingSlot from '../models/ParkingSlot.js';
import Vehicle from '../models/Vehicle.js';
import Visitor from '../models/Visitor.js';
import { AppError, asyncHandler, ok, requireFields } from '../utils/http.js';
import { writeAudit } from '../utils/audit.js';
import { scopedFilter } from '../middleware/auth.js';

async function updateAndAudit({ Model, filter, update, action, entityType, entityId, actorId, message }) {
  const record = await Model.findOneAndUpdate(filter, update, { new: true, runValidators: true });
  if (!record) throw new AppError(404, `${entityType} not found.`);
  await writeAudit({ action, entityType, entityId, actorId, message });
  return record;
}

import { notifyVisitorEvent } from '../services/notificationService.js';

const visitorScope = (user) => scopedFilter(user, { residentField: 'residentId', blockField: 'blockId' });

export const approveVisitor = asyncHandler(async (req, res) => {
  const record = await updateAndAudit({
    Model: Visitor,
    filter: { visitorId: req.params.id, ...visitorScope(req.user) },
    update: { status: 'Approved', approvedBy: req.user.userId },
    action: 'VISITOR_APPROVED',
    entityType: 'Visitor',
    entityId: req.params.id,
    actorId: req.user.userId,
    message: `Visitor ${req.params.id} approved.`,
  });
  await notifyVisitorEvent(record, 'REGISTERED');
  ok(res, record);
});

export const checkInVisitor = asyncHandler(async (req, res) => {
  const visitor = await Visitor.findOne({ visitorId: req.params.id, ...visitorScope(req.user) });
  if (!visitor) throw new AppError(404, 'Visitor record not found.');
  visitor.status = 'Inside';
  visitor.entryTime = new Date();
  await visitor.save();
  await writeAudit({
    action: 'VISITOR_CHECKED_IN',
    entityType: 'Visitor',
    entityId: visitor.visitorId,
    actorId: req.user.userId,
    message: `Visitor ${visitor.name} verified and checked in at security gate.`,
  });
  await notifyVisitorEvent(visitor, 'CHECKED_IN');
  ok(res, visitor);
});

export const verifyGatePass = asyncHandler(async (req, res) => {
  const query = (req.query.passCode || req.params.code || '').trim().toUpperCase();
  if (!query) throw new AppError(400, 'Gate pass code or visitor phone is required.');
  const visitor = await Visitor.findOne({
    $or: [{ passCode: query }, { visitorId: query }, { phone: query }],
    ...visitorScope(req.user),
  });
  if (!visitor) throw new AppError(404, 'No visitor found matching this pass code or phone number.');
  ok(res, visitor);
});

export const exitVisitor = asyncHandler(async (req, res) => {
  const record = await updateAndAudit({
    Model: Visitor,
    filter: { visitorId: req.params.id, ...visitorScope(req.user) },
    update: { status: 'Exited', exitTime: new Date() },
    action: 'VISITOR_EXITED',
    entityType: 'Visitor',
    entityId: req.params.id,
    actorId: req.user.userId,
    message: `Visitor ${req.params.id} checked out.`,
  });
  ok(res, record);
});


export const assignParking = asyncHandler(async (req, res) => {
  requireFields(req.body, ['vehicleId']);
  const vehicle = await Vehicle.findOne({ vehicleId: req.body.vehicleId });
  if (!vehicle) throw new AppError(404, 'Vehicle not found.');
  const slot = await ParkingSlot.findOne({ slotId: req.params.id, ...scopedFilter(req.user, { blockField: 'blockId' }) });
  if (!slot) throw new AppError(404, 'Parking slot not found.');
  if (vehicle.blockId !== slot.blockId) throw new AppError(400, 'Vehicle and parking slot must be in the same block.');
  if (slot.status === 'Assigned' && slot.assignedTo !== vehicle.vehicleId) throw new AppError(409, 'Parking slot is already assigned.');
  slot.status = 'Assigned'; slot.assignedTo = vehicle.vehicleId; vehicle.parkingSlotId = slot.slotId;
  await Promise.all([slot.save(), vehicle.save(), writeAudit({ action: 'PARKING_ASSIGNED', entityType: 'ParkingSlot', entityId: slot.slotId, actorId: req.user.userId, message: `${slot.slotId} assigned to ${vehicle.vehicleId}.` })]);
  ok(res, slot);
});

export const updateBookingStatus = asyncHandler(async (req, res) => {
  requireFields(req.body, ['status']);
  if (!['Pending', 'Approved', 'Rejected', 'Cancelled'].includes(req.body.status)) throw new AppError(400, 'Invalid booking status.');
  ok(res, await updateAndAudit({ Model: AmenityBooking, filter: { bookingId: req.params.id, ...scopedFilter(req.user, { residentField: 'residentId', blockField: 'blockId' }) }, update: { status: req.body.status }, action: 'BOOKING_STATUS_UPDATED', entityType: 'AmenityBooking', entityId: req.params.id, actorId: req.user.userId, message: `Booking ${req.params.id} updated to ${req.body.status}.` }));
});

export const useInventory = asyncHandler(async (req, res) => {
  requireFields(req.body, ['quantity']);
  const quantity = Number(req.body.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) throw new AppError(400, 'Usage quantity must be greater than zero.');
  const item = await InventoryItem.findOne({ itemId: req.params.id });
  if (!item) throw new AppError(404, 'Inventory item not found.');
  if (item.quantity < quantity) throw new AppError(409, 'Insufficient stock.');
  item.quantity -= quantity; item.lastUpdatedBy = req.user.userId; await item.save();
  await writeAudit({ action: 'INVENTORY_USED', entityType: 'InventoryItem', entityId: item.itemId, actorId: req.user.userId, message: `${quantity} ${item.unit} used from ${item.itemId}.` });
  ok(res, item);
});
