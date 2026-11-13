import crypto from 'node:crypto';
import Apartment from '../models/Apartment.js';
import Bill from '../models/Bill.js';
import ForumPost from '../models/ForumPost.js';
import LedgerEntry from '../models/LedgerEntry.js';
import MaintenanceSchedule, { FREQUENCIES } from '../models/MaintenanceSchedule.js';
import MoveRequest from '../models/MoveRequest.js';
import Parcel from '../models/Parcel.js';
import Resident from '../models/Resident.js';
import { createSystemNotification } from '../services/notificationService.js';
import { writeAudit } from '../utils/audit.js';
import { AppError, asyncHandler, created, nextPublicId, ok, requireFields } from '../utils/http.js';

const ADMINS = ['MAIN_ADMIN', 'FACILITY_MANAGER'];
const blockOrGlobal = (user) => ({ $or: [{ blockId: user.blockId }, { blockId: null }] });
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const audit = (req, action, entityType, entityId, message) => writeAudit({ action, entityType, entityId, actorId: req.user.userId, message });
const notifyEach = async (roles, payload) => { for (const role of roles) await createSystemNotification({ role, ...payload }); }; // sequential: ids are allocated in order

// ======================= Move-in / move-out =======================
const moveFilter = (user) => {
  if (ADMINS.includes(user.role)) return {};
  if (['BLOCK_SUB_ADMIN', 'SECURITY'].includes(user.role)) return { blockId: user.blockId };
  if (user.role === 'RESIDENT') return { residentId: user.userId };
  return { _id: null };
};
const pendingDuesFor = async (residentId) => (await Bill.find({ residentId, paymentStatus: 'Pending' }).select('totalAmount').lean()).reduce((n, b) => n + (b.totalAmount || 0), 0);

export const listMoves = asyncHandler(async (req, res) => {
  const filter = { ...moveFilter(req.user) };
  if (req.user.role === 'SECURITY') filter.status = { $in: ['Approved', 'Completed'] };
  if (req.query.status) filter.status = req.query.status;
  ok(res, await MoveRequest.find(filter).sort({ scheduledDate: 1 }).lean());
});
export const getMove = asyncHandler(async (req, res) => {
  const record = await MoveRequest.findOne({ requestId: req.params.id, ...moveFilter(req.user) }).lean();
  if (!record) throw new AppError(404, 'Move request not found.');
  ok(res, record);
});
export const createMove = asyncHandler(async (req, res) => {
  requireFields(req.body, ['type', 'scheduledDate']);
  if (!['Move-In', 'Move-Out'].includes(req.body.type)) throw new AppError(400, 'type must be Move-In or Move-Out.');
  let resident;
  if (req.user.role === 'RESIDENT') resident = { residentId: req.user.userId, name: req.user.name, apartmentId: req.user.apartmentId, blockId: req.user.blockId, communityId: req.user.communityId };
  else {
    requireFields(req.body, ['residentId']);
    resident = await Resident.findOne({ residentId: req.body.residentId, ...(req.user.role === 'BLOCK_SUB_ADMIN' ? { blockId: req.user.blockId } : {}) }).lean();
    if (!resident) throw new AppError(404, `Resident ${req.body.residentId} not found in your scope.`);
  }
  if (!resident.apartmentId) throw new AppError(400, 'The resident has no apartment on record.');
  const scheduledDate = new Date(req.body.scheduledDate);
  if (Number.isNaN(scheduledDate.getTime())) throw new AppError(400, 'scheduledDate is not a valid date.');
  const day = new Date(scheduledDate); day.setHours(0, 0, 0, 0); const next = new Date(day); next.setDate(day.getDate() + 1);
  const clash = await MoveRequest.findOne({ blockId: resident.blockId, status: { $in: ['Pending', 'Approved'] }, scheduledDate: { $gte: day, $lt: next }, timeSlot: req.body.timeSlot || '09:00-13:00', needsLift: true });
  if (clash && req.body.needsLift !== false) throw new AppError(409, `The service lift in ${resident.blockId} is already booked for ${clash.timeSlot} on ${fmtDate(day)} (${clash.requestId}). Pick another slot.`);
  const pendingDues = req.body.type === 'Move-Out' ? await pendingDuesFor(resident.residentId) : 0;
  const requestId = await nextPublicId(MoveRequest, 'requestId', 'MV');
  const record = await MoveRequest.create({
    requestId, type: req.body.type, residentId: resident.residentId, residentName: resident.name, apartmentId: resident.apartmentId, blockId: resident.blockId || null, communityId: resident.communityId || req.user.communityId,
    scheduledDate, timeSlot: req.body.timeSlot || '09:00-13:00', needsLift: req.body.needsLift !== false, vehicleNumber: req.body.vehicleNumber || '', moversCompany: req.body.moversCompany || '', notes: req.body.notes || '', pendingDues,
    timeline: [{ message: `${req.body.type} requested for ${fmtDate(scheduledDate)}${pendingDues ? ` (₹${pendingDues} dues pending)` : ''}`, actor: req.user.userId }], createdBy: req.user.userId,
  });
  await notifyEach(['BLOCK_SUB_ADMIN', 'MAIN_ADMIN'], { title: `${record.type} request ${requestId}`, message: `${record.residentName}, ${record.apartmentId} on ${fmtDate(scheduledDate)} ${record.timeSlot}.`, type: 'MOVE', entityType: 'MoveRequest', entityId: requestId });
  await audit(req, 'MOVE_REQUESTED', 'MoveRequest', requestId, `${record.type} requested for ${record.apartmentId}.`);
  created(res, record);
});
export const decideMove = (decision) => asyncHandler(async (req, res) => {
  const record = await MoveRequest.findOne({ requestId: req.params.id, ...moveFilter(req.user) });
  if (!record) throw new AppError(404, 'Move request not found.');
  const allowed = { approve: ['Pending'], reject: ['Pending'], complete: ['Approved'], cancel: ['Pending', 'Approved'] }[decision];
  if (!allowed.includes(record.status)) throw new AppError(409, `Request is ${record.status}; cannot ${decision}.`);
  if (decision === 'cancel' && req.user.role === 'RESIDENT' && record.residentId !== req.user.userId) throw new AppError(403, 'You can only cancel your own request.');
  if (decision === 'approve' && record.type === 'Move-Out') {
    record.pendingDues = await pendingDuesFor(record.residentId);
    if (record.pendingDues > 0 && !req.body.overrideDues) throw new AppError(409, `₹${record.pendingDues} in bills is still unpaid. Collect the dues first, or approve with overrideDues: true.`);
  }
  const note = String(req.body.note || '').slice(0, 300);
  record.status = { approve: 'Approved', reject: 'Rejected', complete: 'Completed', cancel: 'Cancelled' }[decision];
  if (decision === 'approve' || decision === 'reject') { record.decidedBy = req.user.userId; record.decidedAt = new Date(); record.decisionNote = note; }
  if (decision === 'complete') {
    record.completedAt = new Date();
    await Apartment.updateOne({ apartmentId: record.apartmentId }, { status: record.type === 'Move-In' ? 'Occupied' : 'Vacant' });
    await Resident.updateOne({ residentId: record.residentId }, record.type === 'Move-In' ? { moveInDate: record.completedAt } : { moveOutDate: record.completedAt });
  }
  record.timeline.push({ message: `${record.status} by ${req.user.name}${note ? `: ${note}` : ''}${decision === 'approve' && record.pendingDues ? ` (dues ₹${record.pendingDues} overridden)` : ''}`, actor: req.user.userId });
  await record.save();
  if (decision !== 'cancel' || req.user.role !== 'RESIDENT') await createSystemNotification({ userId: record.residentId, title: `${record.type} ${record.requestId} ${record.status.toLowerCase()}`, message: decision === 'approve' ? `Confirmed for ${fmtDate(record.scheduledDate)} ${record.timeSlot}. Security has been informed.` : note || `Your request is now ${record.status.toLowerCase()}.`, type: 'MOVE', entityType: 'MoveRequest', entityId: record.requestId });
  if (decision === 'approve') await createSystemNotification({ role: 'SECURITY', title: `Expected ${record.type}: ${record.apartmentId}`, message: `${record.residentName} on ${fmtDate(record.scheduledDate)} ${record.timeSlot}${record.vehicleNumber ? `, vehicle ${record.vehicleNumber}` : ''}${record.needsLift ? ', service lift booked' : ''}.`, type: 'MOVE', entityType: 'MoveRequest', entityId: record.requestId });
  await audit(req, `MOVE_${record.status.toUpperCase()}`, 'MoveRequest', record.requestId, `${record.requestId} ${record.status}.`);
  ok(res, record);
});

// ======================= Parcels =======================
const parcelFilter = (user) => {
  if (ADMINS.includes(user.role)) return {};
  if (['BLOCK_SUB_ADMIN', 'SECURITY'].includes(user.role)) return blockOrGlobal(user);
  if (user.role === 'RESIDENT') return { $or: [{ residentId: user.userId }, ...(user.apartmentId ? [{ apartmentId: user.apartmentId }] : [])] };
  return { _id: null };
};
const hideCode = (p, user) => (['RESIDENT'].includes(user.role) ? p : { ...p, pickupCode: undefined });
export const listParcels = asyncHandler(async (req, res) => {
  const filter = { ...parcelFilter(req.user) };
  if (req.query.status) filter.status = req.query.status;
  ok(res, (await Parcel.find(filter).sort({ receivedAt: -1 }).limit(500).lean()).map((p) => hideCode(p, req.user)));
});
export const logParcel = asyncHandler(async (req, res) => {
  requireFields(req.body, ['apartmentId']);
  const resident = await Resident.findOne({ apartmentId: req.body.apartmentId, status: { $ne: 'Inactive' } }).sort({ createdAt: -1 }).lean();
  const apartment = await Apartment.findOne({ apartmentId: req.body.apartmentId }).lean();
  if (!resident && !apartment) throw new AppError(404, `Apartment ${req.body.apartmentId} not found.`);
  const blockId = resident?.blockId || apartment?.blockId || null;
  if (['BLOCK_SUB_ADMIN', 'SECURITY'].includes(req.user.role) && req.user.blockId && blockId && blockId !== req.user.blockId) throw new AppError(403, `Apartment ${req.body.apartmentId} is outside your block.`);
  const parcelId = await nextPublicId(Parcel, 'parcelId', 'PCL');
  const pickupCode = String(crypto.randomInt(1000, 10000));
  const record = await Parcel.create({
    parcelId, residentId: resident?.residentId || null, residentName: resident?.name || '', apartmentId: req.body.apartmentId, blockId, communityId: resident?.communityId || apartment?.communityId || req.user.communityId,
    courier: req.body.courier || 'Other', description: req.body.description || '', trackingRef: req.body.trackingRef || '', packages: Math.max(1, Number(req.body.packages) || 1), storageLocation: req.body.storageLocation || 'Security cabin', pickupCode, receivedBy: req.user.userId,
  });
  if (record.residentId) await createSystemNotification({ userId: record.residentId, title: `📦 Parcel at the gate (${record.courier})`, message: `${record.packages} package(s) ${record.description ? `— ${record.description} ` : ''}kept at ${record.storageLocation}. Pickup code: ${pickupCode}.`, type: 'PARCEL', entityType: 'Parcel', entityId: parcelId });
  await audit(req, 'PARCEL_RECEIVED', 'Parcel', parcelId, `Parcel for ${record.apartmentId} logged.`);
  created(res, { ...record.toObject(), pickupCode: undefined, residentNotified: Boolean(record.residentId) });
});
export const collectParcel = asyncHandler(async (req, res) => {
  const record = await Parcel.findOne({ parcelId: req.params.id, ...parcelFilter(req.user) });
  if (!record) throw new AppError(404, 'Parcel not found.');
  if (record.status !== 'At Gate') throw new AppError(409, `Parcel is already ${record.status.toLowerCase()}.`);
  if (String(req.body.pickupCode || '').trim() !== record.pickupCode && !(req.body.override && ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN'].includes(req.user.role))) throw new AppError(400, 'Pickup code does not match.');
  record.status = 'Collected'; record.collectedAt = new Date(); record.collectedByName = req.body.collectedByName || record.residentName; record.releasedBy = req.user.userId;
  await record.save();
  if (record.residentId) await createSystemNotification({ userId: record.residentId, title: 'Parcel collected', message: `${record.parcelId} (${record.courier}) was collected by ${record.collectedByName || 'you'}.`, type: 'PARCEL', entityType: 'Parcel', entityId: record.parcelId });
  await audit(req, 'PARCEL_COLLECTED', 'Parcel', record.parcelId, `${record.parcelId} handed over.`);
  ok(res, hideCode(record.toObject(), req.user));
});
export const returnParcel = asyncHandler(async (req, res) => {
  const record = await Parcel.findOne({ parcelId: req.params.id, ...parcelFilter(req.user) });
  if (!record) throw new AppError(404, 'Parcel not found.');
  if (record.status !== 'At Gate') throw new AppError(409, `Parcel is already ${record.status.toLowerCase()}.`);
  record.status = 'Returned'; record.releasedBy = req.user.userId; await record.save();
  await audit(req, 'PARCEL_RETURNED', 'Parcel', record.parcelId, `${record.parcelId} returned to courier.`);
  ok(res, hideCode(record.toObject(), req.user));
});

// ======================= Preventive maintenance / AMC =======================
const DAY = 86400000;
const pmFilter = (user) => (['MAIN_ADMIN', 'FACILITY_MANAGER', 'TECHNICIAN'].includes(user.role) ? {} : user.role === 'BLOCK_SUB_ADMIN' ? blockOrGlobal(user) : { _id: null });
const addDays = (d, n) => new Date(new Date(d).getTime() + n * DAY);
function decorate(s) {
  const now = Date.now(); const due = new Date(s.nextDueAt).getTime(); const days = Math.ceil((due - now) / DAY);
  const amcDays = s.amcExpiry ? Math.ceil((new Date(s.amcExpiry).getTime() - now) / DAY) : null;
  const { history, ...rest } = s;
  return {
    ...rest, daysToDue: days,
    dueState: s.status === 'Paused' ? 'Paused' : days < 0 ? 'Overdue' : days <= 7 ? 'Due Soon' : 'On Track',
    amcState: amcDays === null ? null : amcDays < 0 ? 'AMC Expired' : amcDays <= 30 ? 'AMC Renewal Due' : 'AMC Active',
    amcDaysLeft: amcDays, serviceCount: (history || []).length, recentServices: (history || []).slice(-5).reverse(),
  };
}
export const listSchedules = asyncHandler(async (req, res) => ok(res, (await MaintenanceSchedule.find(pmFilter(req.user)).sort({ nextDueAt: 1 }).lean()).map(decorate)));
export const getSchedule = asyncHandler(async (req, res) => {
  const s = await MaintenanceSchedule.findOne({ scheduleId: req.params.id, ...pmFilter(req.user) }).lean();
  if (!s) throw new AppError(404, 'Schedule not found.');
  ok(res, { ...decorate(s), history: (s.history || []).slice().reverse() });
});
const pmFields = ['assetName', 'category', 'location', 'blockId', 'vendorId', 'frequency', 'amcProvider', 'amcExpiry', 'amcCost', 'checklist', 'status', 'nextDueAt', 'lastDoneAt'];
const pickPm = (body) => Object.fromEntries(pmFields.filter((k) => body[k] !== undefined).map((k) => [k, ['amcExpiry', 'nextDueAt', 'lastDoneAt'].includes(k) ? (body[k] ? new Date(body[k]) : null) : k === 'amcCost' ? Number(body[k]) || 0 : body[k] === '' && ['blockId', 'vendorId'].includes(k) ? null : body[k]]));
export const createSchedule = asyncHandler(async (req, res) => {
  requireFields(req.body, ['assetName']);
  const data = pickPm(req.body);
  if (data.frequency && !FREQUENCIES[data.frequency]) throw new AppError(400, `frequency must be one of ${Object.keys(FREQUENCIES).join(', ')}.`);
  if (!data.nextDueAt) data.nextDueAt = data.lastDoneAt ? addDays(data.lastDoneAt, FREQUENCIES[data.frequency || 'Monthly']) : addDays(Date.now(), 1);
  const scheduleId = await nextPublicId(MaintenanceSchedule, 'scheduleId', 'PM');
  const record = await MaintenanceSchedule.create({ ...data, scheduleId, communityId: req.user.communityId, createdBy: req.user.userId });
  await audit(req, 'PM_SCHEDULE_CREATED', 'MaintenanceSchedule', scheduleId, `${record.assetName} ${record.frequency} schedule created.`);
  created(res, decorate(record.toObject()));
});
export const updateSchedule = asyncHandler(async (req, res) => {
  const record = await MaintenanceSchedule.findOne({ scheduleId: req.params.id, ...pmFilter(req.user) });
  if (!record) throw new AppError(404, 'Schedule not found.');
  Object.assign(record, pickPm(req.body)); await record.save();
  await audit(req, 'PM_SCHEDULE_UPDATED', 'MaintenanceSchedule', record.scheduleId, `${record.scheduleId} updated.`);
  ok(res, decorate(record.toObject()));
});
export const deleteSchedule = asyncHandler(async (req, res) => {
  const record = await MaintenanceSchedule.findOneAndDelete({ scheduleId: req.params.id, ...pmFilter(req.user) });
  if (!record) throw new AppError(404, 'Schedule not found.');
  await audit(req, 'PM_SCHEDULE_DELETED', 'MaintenanceSchedule', record.scheduleId, `${record.scheduleId} deleted.`);
  ok(res, { id: record.scheduleId, deleted: true });
});
export const completeService = asyncHandler(async (req, res) => {
  const record = await MaintenanceSchedule.findOne({ scheduleId: req.params.id, ...pmFilter(req.user) });
  if (!record) throw new AppError(404, 'Schedule not found.');
  const doneAt = req.body.doneAt ? new Date(req.body.doneAt) : new Date();
  const cost = Math.max(0, Number(req.body.cost) || 0);
  let ledgerEntryId = null;
  if (cost > 0 && ADMINS.includes(req.user.role)) {
    ledgerEntryId = await nextPublicId(LedgerEntry, 'entryId', 'TXN');
    await LedgerEntry.create({ entryId: ledgerEntryId, type: 'Expense', category: record.category === 'Lift' ? 'Lift AMC' : record.category === 'Generator' ? 'Generator / Diesel' : record.category === 'Pest Control' ? 'Pest Control' : 'Repairs & Maintenance', amount: cost, date: doneAt, description: `${record.assetName} service (${record.scheduleId})${req.body.note ? ` — ${req.body.note}` : ''}`, vendorId: record.vendorId, blockId: record.blockId, communityId: record.communityId, createdBy: req.user.userId });
  }
  record.history.push({ doneAt, by: req.user.userId, byName: req.user.name, note: String(req.body.note || '').slice(0, 500), cost, ledgerEntryId });
  record.lastDoneAt = doneAt; record.nextDueAt = addDays(doneAt, FREQUENCIES[record.frequency] || 30); record.lastReminderFor = null;
  await record.save();
  await audit(req, 'PM_SERVICE_DONE', 'MaintenanceSchedule', record.scheduleId, `${record.assetName} serviced; next due ${fmtDate(record.nextDueAt)}.`);
  ok(res, { ...decorate(record.toObject()), ledgerEntryId });
});

// Hourly sweep: tell the facility manager about services due within a day and AMCs expiring within 30 days (once per due date).
export async function runMaintenanceReminders() {
  const soon = addDays(Date.now(), 1);
  const due = await MaintenanceSchedule.find({ status: 'Active', nextDueAt: { $lte: soon } });
  let sent = 0;
  for (const s of due) {
    if (s.lastReminderFor && new Date(s.lastReminderFor).getTime() === new Date(s.nextDueAt).getTime()) continue;
    const overdue = new Date(s.nextDueAt) < new Date();
    await notifyEach(['FACILITY_MANAGER'], { title: `${overdue ? 'Overdue' : 'Due'}: ${s.assetName} service`, message: `${s.frequency} ${s.category} maintenance ${overdue ? 'was due' : 'is due'} on ${fmtDate(s.nextDueAt)}${s.location ? ` (${s.location})` : ''}. ${s.scheduleId}`, type: 'MAINTENANCE', entityType: 'MaintenanceSchedule', entityId: s.scheduleId });
    s.lastReminderFor = s.nextDueAt; await s.save(); sent += 1;
  }
  return { checked: due.length, sent };
}
export function startMaintenanceReminders() {
  const tick = () => runMaintenanceReminders().catch((e) => console.warn(`Maintenance reminder sweep failed: ${e.message}`));
  setTimeout(tick, 15000); setInterval(tick, 3600000).unref?.();
}

// ======================= Forum & marketplace =======================
const FORUM_ROLES = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER', 'RESIDENT', 'SECURITY'];
const MODERATORS = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN'];
const forumFilter = (user) => ({ ...(user.communityId ? { communityId: user.communityId } : {}), ...(MODERATORS.includes(user.role) ? {} : { $or: [{ hidden: false }, { authorId: user.userId }] }) });
const serializePost = (p, user, full = false) => ({
  ...p, likes: undefined, likeCount: (p.likes || []).length, likedByMe: (p.likes || []).includes(user.userId),
  commentCount: (p.comments || []).length, comments: full ? p.comments : (p.comments || []).slice(-2),
  mine: p.authorId === user.userId, canModerate: MODERATORS.includes(user.role),
});
const loadPost = async (req) => { const p = await ForumPost.findOne({ postId: req.params.id, ...forumFilter(req.user) }); if (!p) throw new AppError(404, 'Post not found.'); return p; };
export const listPosts = asyncHandler(async (req, res) => {
  const filter = { ...forumFilter(req.user) };
  if (req.query.kind) filter.kind = req.query.kind;
  ok(res, (await ForumPost.find(filter).sort({ pinned: -1, createdAt: -1 }).limit(300).lean()).map((p) => serializePost(p, req.user)));
});
export const getPost = asyncHandler(async (req, res) => ok(res, serializePost((await loadPost(req)).toObject(), req.user, true)));
export const createPost = asyncHandler(async (req, res) => {
  requireFields(req.body, ['title']);
  const kind = req.body.kind || 'Discussion';
  if (kind === 'Announcement' && !MODERATORS.includes(req.user.role) && req.user.role !== 'FACILITY_MANAGER') throw new AppError(403, 'Only admins can post announcements.');
  const postId = await nextPublicId(ForumPost, 'postId', 'POST');
  const record = await ForumPost.create({
    postId, kind, title: String(req.body.title).slice(0, 150), body: String(req.body.body || '').slice(0, 5000),
    price: kind === 'Buy / Sell' && req.body.price !== undefined && req.body.price !== '' ? Math.max(0, Number(req.body.price) || 0) : null,
    condition: kind === 'Buy / Sell' ? req.body.condition || null : null,
    authorId: req.user.userId, authorName: req.user.name, authorRole: req.user.role, apartmentId: req.user.apartmentId || null, blockId: req.user.blockId || null, communityId: req.user.communityId,
    pinned: MODERATORS.includes(req.user.role) && Boolean(req.body.pinned),
  });
  await audit(req, 'FORUM_POST_CREATED', 'ForumPost', postId, `${kind} post "${record.title}".`);
  created(res, serializePost(record.toObject(), req.user, true));
});
export const updatePost = asyncHandler(async (req, res) => {
  const p = await loadPost(req);
  const mod = MODERATORS.includes(req.user.role);
  if (p.authorId !== req.user.userId && !mod) throw new AppError(403, 'You can only edit your own posts.');
  if (p.authorId === req.user.userId) for (const k of ['title', 'body', 'price', 'condition', 'status', 'kind']) if (req.body[k] !== undefined) p[k] = req.body[k];
  if (mod) for (const k of ['pinned', 'hidden', 'status']) if (req.body[k] !== undefined) p[k] = req.body[k];
  await p.save();
  if (mod && req.body.hidden === true && p.authorId !== req.user.userId) await createSystemNotification({ userId: p.authorId, title: 'Your post was hidden by a moderator', message: `"${p.title}" is no longer visible to other residents.${req.body.reason ? ` Reason: ${req.body.reason}` : ''}`, type: 'FORUM', entityType: 'ForumPost', entityId: p.postId });
  await audit(req, 'FORUM_POST_UPDATED', 'ForumPost', p.postId, `${p.postId} updated${mod && req.body.hidden !== undefined ? ` (hidden=${p.hidden})` : ''}.`);
  ok(res, serializePost(p.toObject(), req.user, true));
});
export const deletePost = asyncHandler(async (req, res) => {
  const p = await loadPost(req);
  if (p.authorId !== req.user.userId && !MODERATORS.includes(req.user.role)) throw new AppError(403, 'You can only delete your own posts.');
  await p.deleteOne();
  await audit(req, 'FORUM_POST_DELETED', 'ForumPost', p.postId, `${p.postId} deleted.`);
  ok(res, { id: p.postId, deleted: true });
});
export const commentPost = asyncHandler(async (req, res) => {
  const text = String(req.body.text || '').trim().slice(0, 2000);
  if (!text) throw new AppError(400, 'Comment text is required.');
  const p = await loadPost(req);
  if (p.status === 'Closed') throw new AppError(409, 'This post is closed for comments.');
  p.comments.push({ commentId: `C${Date.now().toString(36)}${crypto.randomInt(100, 999)}`, authorId: req.user.userId, authorName: req.user.name, authorRole: req.user.role, apartmentId: req.user.apartmentId || null, text });
  await p.save();
  if (p.authorId !== req.user.userId) await createSystemNotification({ userId: p.authorId, title: `New reply on "${p.title.slice(0, 40)}"`, message: `${req.user.name}: ${text.slice(0, 120)}`, type: 'FORUM', entityType: 'ForumPost', entityId: p.postId });
  ok(res, serializePost(p.toObject(), req.user, true));
});
export const deleteComment = asyncHandler(async (req, res) => {
  const p = await loadPost(req);
  const c = p.comments.find((x) => x.commentId === req.params.commentId);
  if (!c) throw new AppError(404, 'Comment not found.');
  if (c.authorId !== req.user.userId && !MODERATORS.includes(req.user.role)) throw new AppError(403, 'You can only delete your own comments.');
  p.comments = p.comments.filter((x) => x.commentId !== c.commentId); await p.save();
  ok(res, serializePost(p.toObject(), req.user, true));
});
export const likePost = asyncHandler(async (req, res) => {
  const p = await loadPost(req);
  p.likes = p.likes.includes(req.user.userId) ? p.likes.filter((u) => u !== req.user.userId) : [...p.likes, req.user.userId];
  await p.save();
  ok(res, serializePost(p.toObject(), req.user));
});
export { FORUM_ROLES };
