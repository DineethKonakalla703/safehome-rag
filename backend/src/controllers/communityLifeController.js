import Bill from '../models/Bill.js';
import CommunityEvent from '../models/CommunityEvent.js';
import LedgerEntry, { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../models/LedgerEntry.js';
import Poll from '../models/Poll.js';
import SosAlert from '../models/SosAlert.js';
import StaffMember from '../models/StaffMember.js';
import { scopedFilter } from '../middleware/auth.js';
import { createSystemNotification } from '../services/notificationService.js';
import { writeAudit } from '../utils/audit.js';
import { AppError, asyncHandler, created, nextPublicId, ok, requireFields } from '../utils/http.js';
import { createResourceController } from './resourceController.js';

const MANAGERS = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'];
// Block-level users see their block's records plus community-wide (blockId null) ones.
const blockOrGlobal = (user) => ({ $or: [{ blockId: user.blockId }, { blockId: null }] });

// ---------------- Staff & domestic help ----------------
const staffFilter = (user) => {
  if (['MAIN_ADMIN', 'FACILITY_MANAGER'].includes(user.role)) return {};
  if (['BLOCK_SUB_ADMIN', 'SECURITY'].includes(user.role)) return blockOrGlobal(user);
  if (user.role === 'RESIDENT') return { residentId: user.userId };
  return { _id: null };
};
const staffBase = createResourceController({ Model: StaffMember, idField: 'staffId', prefix: 'STF', required: ['name', 'phone', 'staffType'], scope: { residentField: 'residentId', blockField: 'blockId' } });
const hideLog = ({ entryLog, ...rest }) => ({ ...rest, recentEntries: (entryLog || []).slice(-5).reverse() });
export const staffController = {
  ...staffBase,
  list: asyncHandler(async (req, res) => ok(res, (await StaffMember.find(staffFilter(req.user)).sort({ name: 1 }).lean()).map(hideLog))),
  get: asyncHandler(async (req, res) => {
    const record = await StaffMember.findOne({ staffId: req.params.id, ...staffFilter(req.user) }).lean();
    if (!record) throw new AppError(404, 'Staff member not found.');
    ok(res, { ...record, entryLog: (record.entryLog || []).slice(-50).reverse() });
  }),
  update: asyncHandler(async (req, res) => {
    const record = await StaffMember.findOne({ staffId: req.params.id, ...staffFilter(req.user) });
    if (!record) throw new AppError(404, 'Staff member not found.');
    const editable = ['name', 'phone', 'staffType', 'employment', 'workingDays', 'shift', 'status', ...(req.user.role === 'RESIDENT' ? [] : ['policeVerified', 'apartmentId', 'blockId', 'residentId'])];
    for (const key of editable) if (req.body[key] !== undefined) record[key] = req.body[key];
    await record.save();
    await writeAudit({ action: 'STAFF_UPDATED', entityType: 'StaffMember', entityId: record.staffId, actorId: req.user.userId, message: `Staff ${record.staffId} updated.` });
    ok(res, hideLog(record.toObject()));
  }),
  remove: asyncHandler(async (req, res) => {
    const record = await StaffMember.findOneAndDelete({ staffId: req.params.id, ...staffFilter(req.user) });
    if (!record) throw new AppError(404, 'Staff member not found.');
    await writeAudit({ action: 'STAFF_DELETED', entityType: 'StaffMember', entityId: record.staffId, actorId: req.user.userId, message: `Staff ${record.staffId} removed.` });
    ok(res, { id: record.staffId, deleted: true });
  }),
};

const gateMove = (type) => asyncHandler(async (req, res) => {
  const code = String(req.params.id).toUpperCase();
  const record = await StaffMember.findOne({ $and: [{ $or: [{ staffId: code }, { passCode: code }] }, staffFilter(req.user)] });
  if (!record) throw new AppError(404, 'Staff member not found.');
  if (record.status !== 'Active') throw new AppError(409, `${record.name} is ${record.status} and cannot enter.`);
  if (type === 'IN' && record.insideNow) throw new AppError(409, `${record.name} is already inside.`);
  if (type === 'OUT' && !record.insideNow) throw new AppError(409, `${record.name} is not inside.`);
  record.insideNow = type === 'IN';
  if (type === 'IN') record.lastEntryAt = new Date(); else record.lastExitAt = new Date();
  record.entryLog.push({ type, by: req.user.userId });
  if (record.entryLog.length > 300) record.entryLog = record.entryLog.slice(-300);
  await record.save();
  await writeAudit({ action: type === 'IN' ? 'STAFF_CHECKED_IN' : 'STAFF_CHECKED_OUT', entityType: 'StaffMember', entityId: record.staffId, actorId: req.user.userId, message: `${record.name} ${type === 'IN' ? 'entered' : 'left'}.` });
  if (record.residentId && record.employment === 'Private') {
    await createSystemNotification({ userId: record.residentId, title: `${record.staffType} ${type === 'IN' ? 'arrived' : 'left'}`, message: `${record.name} ${type === 'IN' ? 'entered' : 'left'} the gate at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.`, type: 'STAFF', entityType: 'StaffMember', entityId: record.staffId });
  }
  ok(res, hideLog(record.toObject()));
});
export const staffCheckIn = gateMove('IN');
export const staffCheckOut = gateMove('OUT');

// ---------------- Society accounts ----------------
const ledgerBase = createResourceController({ Model: LedgerEntry, idField: 'entryId', prefix: 'TXN', required: ['type', 'category', 'amount'], scope: { blockField: 'blockId', includeGlobalRecords: true }, sort: { date: -1, createdAt: -1 } });
export const ledgerController = {
  ...ledgerBase,
  create: asyncHandler(async (req, res, next) => {
    const { type, category } = req.body || {};
    if (type === 'Income' && category && !INCOME_CATEGORIES.includes(category)) throw new AppError(400, `"${category}" is an expense category. Income categories: ${INCOME_CATEGORIES.join(', ')}.`);
    if (type === 'Expense' && category && !EXPENSE_CATEGORIES.includes(category)) throw new AppError(400, `"${category}" is an income category. Expense categories: ${EXPENSE_CATEGORIES.join(', ')}.`);
    return ledgerBase.create(req, res, next);
  }),
};

export const accountsSummary = asyncHandler(async (req, res) => {
  const months = Math.min(24, Math.max(1, Number(req.query.months) || 6));
  const since = new Date(); since.setMonth(since.getMonth() - (months - 1)); since.setDate(1); since.setHours(0, 0, 0, 0);
  const ledgerScope = ['MAIN_ADMIN', 'FACILITY_MANAGER', 'RESIDENT'].includes(req.user.role) ? {} : blockOrGlobal(req.user);
  const billScope = req.user.role === 'RESIDENT' ? {} : scopedFilter(req.user, { residentField: 'residentId', blockField: 'blockId' });
  const [entries, bills] = await Promise.all([LedgerEntry.find(ledgerScope).lean(), Bill.find(billScope).lean()]);
  // Local calendar month (not UTC) so entries land in the month users see.
  const monthKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`; };
  const monthly = {};
  for (let i = 0; i < months; i += 1) { const d = new Date(since); d.setMonth(since.getMonth() + i); monthly[monthKey(d)] = { month: monthKey(d), income: 0, expense: 0 }; }
  const byCategory = {};
  let income = 0; let expense = 0;
  for (const e of entries) {
    if (e.type === 'Income') income += e.amount; else expense += e.amount;
    const key = `${e.type}|${e.category}`; byCategory[key] = (byCategory[key] || 0) + e.amount;
    const m = monthly[monthKey(e.date)]; if (m) m[e.type === 'Income' ? 'income' : 'expense'] += e.amount;
  }
  let billsCollected = 0; let billsOutstanding = 0; let overdueCount = 0;
  for (const b of bills) {
    if (b.paymentStatus === 'Paid') {
      billsCollected += b.totalAmount || 0;
      const m = monthly[monthKey(b.paidAt || b.updatedAt || b.generatedAt)]; if (m) m.income += b.totalAmount || 0;
    } else if (b.paymentStatus === 'Pending') {
      billsOutstanding += b.totalAmount || 0;
      if (b.dueDate && new Date(b.dueDate) < new Date()) overdueCount += 1;
    }
  }
  if (billsCollected) byCategory['Income|Resident bills (paid)'] = billsCollected;
  const totalIncome = income + billsCollected;
  ok(res, {
    totalIncome, totalExpense: expense, balance: totalIncome - expense,
    billsCollected, billsOutstanding, overdueBills: overdueCount,
    byCategory: Object.entries(byCategory).map(([key, total]) => { const [type, category] = key.split('|'); return { type, category, total }; }).sort((a, b) => b.total - a.total),
    monthly: Object.values(monthly),
    entryCount: entries.length,
    categories: { income: INCOME_CATEGORIES, expense: EXPENSE_CATEGORIES },
  });
});

// ---------------- Polls & voting ----------------
const pollFilter = (user) => (['MAIN_ADMIN', 'FACILITY_MANAGER'].includes(user.role) ? {} : ['BLOCK_SUB_ADMIN', 'RESIDENT', 'SECURITY'].includes(user.role) ? blockOrGlobal(user) : { _id: null });
const isClosed = (poll) => poll.status === 'Closed' || (poll.closesAt && new Date(poll.closesAt) < new Date());
function serializePoll(poll, user) {
  const counts = Object.fromEntries(poll.options.map((o) => [o.optionId, 0]));
  for (const v of poll.votes || []) if (v.optionId in counts) counts[v.optionId] += 1;
  const total = (poll.votes || []).length;
  const mine = (poll.votes || []).find((v) => v.userId === user.userId);
  const { votes, ...rest } = poll;
  return {
    ...rest,
    status: isClosed(poll) ? 'Closed' : 'Open',
    totalVotes: total,
    myVote: mine?.optionId || null,
    results: poll.options.map((o) => ({ ...o, votes: counts[o.optionId], percent: total ? Math.round((counts[o.optionId] / total) * 100) : 0 })),
    leading: total ? poll.options.reduce((best, o) => (counts[o.optionId] > counts[best.optionId] ? o : best), poll.options[0]).text : null,
  };
}
export const listPolls = asyncHandler(async (req, res) => ok(res, (await Poll.find(pollFilter(req.user)).sort({ createdAt: -1 }).lean()).map((p) => serializePoll(p, req.user))));
export const getPoll = asyncHandler(async (req, res) => {
  const poll = await Poll.findOne({ pollId: req.params.id, ...pollFilter(req.user) }).lean();
  if (!poll) throw new AppError(404, 'Poll not found.');
  ok(res, serializePoll(poll, req.user));
});
const normalizeOptions = (options) => {
  const list = Array.isArray(options) ? options : String(options || '').split(/\n|,|;/);
  return list.map((o) => (typeof o === 'string' ? o : o?.text)).map((t) => String(t || '').trim()).filter(Boolean).slice(0, 12).map((text, i) => ({ optionId: `O${i + 1}`, text }));
};
export const createPoll = asyncHandler(async (req, res) => {
  requireFields(req.body, ['title', 'options']);
  const options = normalizeOptions(req.body.options);
  if (options.length < 2) throw new AppError(400, 'Give at least two options.');
  const blockAdmin = req.user.role === 'BLOCK_SUB_ADMIN';
  const pollId = await nextPublicId(Poll, 'pollId', 'POLL');
  const poll = await Poll.create({
    pollId, title: req.body.title, description: req.body.description || '', kind: req.body.kind || 'Poll', options,
    onePerApartment: req.body.onePerApartment !== false,
    targetType: blockAdmin ? 'Block' : req.body.targetType || 'Community',
    blockId: blockAdmin ? req.user.blockId : (req.body.targetType === 'Block' ? req.body.blockId || null : null),
    communityId: req.body.communityId || req.user.communityId,
    closesAt: req.body.closesAt ? new Date(req.body.closesAt) : null,
    createdBy: req.user.userId,
  });
  await writeAudit({ action: 'POLL_CREATED', entityType: 'Poll', entityId: pollId, actorId: req.user.userId, message: `Poll "${poll.title}" created.` });
  await createSystemNotification({ role: 'RESIDENT', title: `New ${poll.kind.toLowerCase()}: ${poll.title}`, message: 'Your vote is requested. Open Polls & Voting to respond.', type: 'POLL', entityType: 'Poll', entityId: pollId });
  created(res, serializePoll(poll.toObject(), req.user));
});
export const updatePoll = asyncHandler(async (req, res) => {
  const poll = await Poll.findOne({ pollId: req.params.id, ...pollFilter(req.user) });
  if (!poll) throw new AppError(404, 'Poll not found.');
  for (const key of ['title', 'description', 'kind', 'status']) if (req.body[key] !== undefined) poll[key] = req.body[key];
  if (req.body.closesAt !== undefined) poll.closesAt = req.body.closesAt ? new Date(req.body.closesAt) : null;
  if (req.body.options !== undefined) {
    if (poll.votes.length) throw new AppError(409, 'Options cannot change after voting has started.');
    poll.options = normalizeOptions(req.body.options);
  }
  await poll.save();
  await writeAudit({ action: 'POLL_UPDATED', entityType: 'Poll', entityId: poll.pollId, actorId: req.user.userId, message: `Poll ${poll.pollId} updated.` });
  ok(res, serializePoll(poll.toObject(), req.user));
});
export const deletePoll = asyncHandler(async (req, res) => {
  const poll = await Poll.findOneAndDelete({ pollId: req.params.id, ...pollFilter(req.user) });
  if (!poll) throw new AppError(404, 'Poll not found.');
  await writeAudit({ action: 'POLL_DELETED', entityType: 'Poll', entityId: poll.pollId, actorId: req.user.userId, message: `Poll ${poll.pollId} deleted.` });
  ok(res, { id: poll.pollId, deleted: true });
});
export const votePoll = asyncHandler(async (req, res) => {
  const poll = await Poll.findOne({ pollId: req.params.id, ...pollFilter(req.user) });
  if (!poll) throw new AppError(404, 'Poll not found.');
  if (isClosed(poll)) throw new AppError(409, 'This poll is closed.');
  const option = poll.options.find((o) => o.optionId === req.body.optionId || o.text.toLowerCase() === String(req.body.optionId || req.body.option || '').toLowerCase());
  if (!option) throw new AppError(400, `Choose one of: ${poll.options.map((o) => `${o.optionId} (${o.text})`).join(', ')}.`);
  const existing = poll.votes.find((v) => v.userId === req.user.userId);
  if (!existing && poll.onePerApartment && req.user.apartmentId && poll.votes.some((v) => v.apartmentId === req.user.apartmentId)) throw new AppError(409, 'Your apartment has already voted in this poll.');
  if (existing) { existing.optionId = option.optionId; existing.at = new Date(); } else poll.votes.push({ userId: req.user.userId, apartmentId: req.user.apartmentId || null, optionId: option.optionId });
  await poll.save();
  await writeAudit({ action: 'POLL_VOTED', entityType: 'Poll', entityId: poll.pollId, actorId: req.user.userId, message: `Vote recorded in ${poll.pollId}.` });
  ok(res, serializePoll(poll.toObject(), req.user));
});

// ---------------- Events & calendar ----------------
const eventBase = createResourceController({ Model: CommunityEvent, idField: 'eventId', prefix: 'EVT', required: ['title', 'startAt'], scope: { blockField: 'blockId', includeGlobalRecords: true }, sort: { startAt: 1 } });
const eventFilter = (user) => (['MAIN_ADMIN', 'FACILITY_MANAGER'].includes(user.role) ? {} : ['BLOCK_SUB_ADMIN', 'RESIDENT', 'SECURITY'].includes(user.role) ? blockOrGlobal(user) : { _id: null });
const serializeEvent = (event, user) => {
  const rsvps = event.rsvps || [];
  const going = rsvps.filter((r) => r.response === 'Going');
  return { ...event, rsvps: undefined, goingCount: going.length, headcount: going.reduce((n, r) => n + 1 + (r.guests || 0), 0), maybeCount: rsvps.filter((r) => r.response === 'Maybe').length, myRsvp: rsvps.find((r) => r.userId === user.userId)?.response || null, attendees: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'].includes(user.role) ? going.map((r) => r.name || r.userId) : undefined };
};
export const eventController = {
  ...eventBase,
  list: asyncHandler(async (req, res) => {
    const filter = { ...eventFilter(req.user) };
    if (req.query.upcoming === 'true') filter.startAt = { $gte: new Date(Date.now() - 6 * 3600000) };
    ok(res, (await CommunityEvent.find(filter).sort({ startAt: 1 }).lean()).map((e) => serializeEvent(e, req.user)));
  }),
  get: asyncHandler(async (req, res) => {
    const event = await CommunityEvent.findOne({ eventId: req.params.id, ...eventFilter(req.user) }).lean();
    if (!event) throw new AppError(404, 'Event not found.');
    ok(res, serializeEvent(event, req.user));
  }),
};
export const rsvpEvent = asyncHandler(async (req, res) => {
  const response = req.body.response || 'Going';
  if (!['Going', 'Maybe', 'Not Going'].includes(response)) throw new AppError(400, 'Response must be Going, Maybe or Not Going.');
  const event = await CommunityEvent.findOne({ eventId: req.params.id, ...eventFilter(req.user) });
  if (!event) throw new AppError(404, 'Event not found.');
  if (event.status !== 'Scheduled') throw new AppError(409, `This event is ${event.status.toLowerCase()}.`);
  const guests = Math.max(0, Math.min(10, Number(req.body.guests) || 0));
  const goingHeadcount = event.rsvps.filter((r) => r.response === 'Going' && r.userId !== req.user.userId).reduce((n, r) => n + 1 + (r.guests || 0), 0);
  if (response === 'Going' && event.capacity && goingHeadcount + 1 + guests > event.capacity) throw new AppError(409, 'This event is full.');
  const existing = event.rsvps.find((r) => r.userId === req.user.userId);
  if (existing) Object.assign(existing, { response, guests, at: new Date() });
  else event.rsvps.push({ userId: req.user.userId, name: req.user.name, response, guests });
  await event.save();
  ok(res, serializeEvent(event.toObject(), req.user));
});

// ---------------- Emergency SOS ----------------
const sosFilter = (user) => {
  if (['MAIN_ADMIN', 'FACILITY_MANAGER'].includes(user.role)) return {};
  if (['BLOCK_SUB_ADMIN', 'SECURITY'].includes(user.role)) return blockOrGlobal(user);
  return { raisedBy: user.userId };
};
export const raiseSos = asyncHandler(async (req, res) => {
  const emergencyType = req.body.emergencyType || 'Other';
  const recent = await SosAlert.findOne({ raisedBy: req.user.userId, status: 'Active', createdAt: { $gte: new Date(Date.now() - 2 * 60000) } });
  if (recent) return ok(res, { ...recent.toObject(), duplicate: true });
  const alertId = await nextPublicId(SosAlert, 'alertId', 'SOS');
  const alert = await SosAlert.create({
    alertId, emergencyType, message: String(req.body.message || '').slice(0, 500), location: String(req.body.location || '').slice(0, 200),
    raisedBy: req.user.userId, raisedByName: req.user.name, raisedByRole: req.user.role,
    residentId: req.user.role === 'RESIDENT' ? req.user.userId : null, apartmentId: req.user.apartmentId || null, blockId: req.user.blockId || null, communityId: req.user.communityId || null,
    timeline: [{ message: `SOS raised: ${emergencyType}`, actor: req.user.userId }],
  });
  const where = [alert.apartmentId && `apartment ${alert.apartmentId}`, alert.blockId && `block ${alert.blockId}`, alert.location].filter(Boolean).join(', ') || 'location not given';
  // Sequential: notification IDs are allocated sequentially, so parallel inserts would collide.
  for (const role of ['SECURITY', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER']) {
    await createSystemNotification({ role, title: `SOS ${alertId}: ${emergencyType}`, message: `${req.user.name} needs help (${where}). ${alert.message}`.trim(), type: 'SOS', entityType: 'SosAlert', entityId: alertId });
  }
  await writeAudit({ action: 'SOS_RAISED', entityType: 'SosAlert', entityId: alertId, actorId: req.user.userId, message: `${emergencyType} SOS raised (${where}).` });
  created(res, alert);
});
export const listSos = asyncHandler(async (req, res) => {
  const filter = { ...sosFilter(req.user) };
  if (req.query.status === 'open') filter.status = { $in: ['Active', 'Acknowledged'] };
  else if (req.query.status) filter.status = req.query.status;
  ok(res, await SosAlert.find(filter).sort({ createdAt: -1 }).limit(200).lean());
});
export const getSos = asyncHandler(async (req, res) => {
  const alert = await SosAlert.findOne({ alertId: req.params.id, ...sosFilter(req.user) }).lean();
  if (!alert) throw new AppError(404, 'SOS alert not found.');
  ok(res, alert);
});
const sosStep = (kind) => asyncHandler(async (req, res) => {
  const alert = await SosAlert.findOne({ alertId: req.params.id, ...sosFilter(req.user) });
  if (!alert) throw new AppError(404, 'SOS alert not found.');
  if (['Resolved', 'False Alarm'].includes(alert.status)) throw new AppError(409, `This alert is already ${alert.status.toLowerCase()}.`);
  if (kind === 'ack') {
    alert.status = 'Acknowledged'; alert.acknowledgedBy = req.user.userId; alert.acknowledgedAt = new Date();
    alert.timeline.push({ message: `Acknowledged by ${req.user.name}${req.body.note ? `: ${req.body.note}` : ''}`, actor: req.user.userId });
  } else {
    alert.status = req.body.falseAlarm ? 'False Alarm' : 'Resolved'; alert.resolvedBy = req.user.userId; alert.resolvedAt = new Date(); alert.resolutionNote = req.body.note || '';
    alert.timeline.push({ message: `${alert.status} by ${req.user.name}${req.body.note ? `: ${req.body.note}` : ''}`, actor: req.user.userId });
  }
  await alert.save();
  await createSystemNotification({ userId: alert.raisedBy, title: `SOS ${alert.alertId} ${alert.status.toLowerCase()}`, message: kind === 'ack' ? `${req.user.name} is responding to your alert.` : `Your alert was marked ${alert.status.toLowerCase()}.`, type: 'SOS', entityType: 'SosAlert', entityId: alert.alertId });
  await writeAudit({ action: kind === 'ack' ? 'SOS_ACKNOWLEDGED' : 'SOS_RESOLVED', entityType: 'SosAlert', entityId: alert.alertId, actorId: req.user.userId, message: `${alert.alertId} ${alert.status}.` });
  ok(res, alert);
});
export const acknowledgeSos = sosStep('ack');
export const resolveSos = sosStep('resolve');
