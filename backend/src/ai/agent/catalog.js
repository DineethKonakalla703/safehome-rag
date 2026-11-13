// Catalog of everything the AI agent can see and do.
// Every operation is executed through the platform's own REST API as the signed-in user,
// so role checks, record scoping, validation and audit logging stay identical to the UI.

import Community from '../../models/Community.js';
import Block from '../../models/Block.js';
import Apartment from '../../models/Apartment.js';
import Resident from '../../models/Resident.js';
import Visitor from '../../models/Visitor.js';
import Vehicle from '../../models/Vehicle.js';
import ParkingSlot from '../../models/ParkingSlot.js';
import Amenity from '../../models/Amenity.js';
import AmenityBooking from '../../models/AmenityBooking.js';
import Notice from '../../models/Notice.js';
import Document from '../../models/Document.js';
import InventoryItem from '../../models/InventoryItem.js';
import Vendor from '../../models/Vendor.js';
import Ticket from '../../models/Ticket.js';
import Bill from '../../models/Bill.js';
import WorkOrder from '../../models/WorkOrder.js';
import Incident from '../../models/Incident.js';
import Technician from '../../models/Technician.js';
import StaffMember from '../../models/StaffMember.js';
import LedgerEntry from '../../models/LedgerEntry.js';
import Poll from '../../models/Poll.js';
import CommunityEvent from '../../models/CommunityEvent.js';
import SosAlert from '../../models/SosAlert.js';
import MoveRequest from '../../models/MoveRequest.js';
import Parcel from '../../models/Parcel.js';
import MaintenanceSchedule from '../../models/MaintenanceSchedule.js';
import ForumPost from '../../models/ForumPost.js';

const MANAGERS = ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER'];

// resource key -> REST path, id field, which CRUD verbs the REST API exposes, create body hint
export const RESOURCES = {
  tickets: { path: '/tickets', idField: 'ticketId', Model: Ticket, verbs: ['list', 'get', 'create'], page: '/tickets', detailPage: '/tickets/:id',
    createHint: 'title, description, optional category. Residents: own apartment is auto-filled. Admins must also give residentId (a User userId of a RESIDENT), apartmentId, blockId, communityId.' },
  bills: { path: '/bills', idField: 'billId', Model: Bill, verbs: ['list', 'create'], page: '/billing',
    createHint: 'ticketId, optional serviceCharge (default 300), partsCharge (default 200). Generates a repair bill for a ticket.' },
  'work-orders': { path: '/work-orders', idField: 'workOrderId', Model: WorkOrder, verbs: ['list', 'create'], page: '/work-orders',
    createHint: 'ticketId, technicianId, optional title, description.' },
  communities: { path: '/communities', idField: 'communityId', Model: Community, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/communities' },
  blocks: { path: '/blocks', idField: 'blockId', Model: Block, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/blocks', createHint: 'name (e.g. "Block D"). communityId is auto-filled.' },
  apartments: { path: '/apartments', idField: 'apartmentId', Model: Apartment, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/apartments' },
  residents: { path: '/residents', idField: 'residentId', Model: Resident, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/residents' },
  visitors: { path: '/visitors', idField: 'visitorId', Model: Visitor, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/visitors',
    createHint: 'name, phone, purpose. Residents: residentId/apartmentId/blockId are auto-filled; others must supply them.' },
  vehicles: { path: '/vehicles', idField: 'vehicleId', Model: Vehicle, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/vehicles' },
  'parking-slots': { path: '/parking-slots', idField: 'slotId', Model: ParkingSlot, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/parking' },
  amenities: { path: '/amenities', idField: 'amenityId', Model: Amenity, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/amenities' },
  'amenity-bookings': { path: '/amenity-bookings', idField: 'bookingId', Model: AmenityBooking, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/bookings',
    createHint: 'amenityId, date (YYYY-MM-DD), timeSlot (e.g. "18:00-19:00"). Residents: residentId/blockId auto-filled.' },
  notices: { path: '/notices', idField: 'noticeId', Model: Notice, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/notices',
    createHint: 'title, message, targetType ("Community" or "Block"), blockId when targetType is Block.' },
  documents: { path: '/documents', idField: 'documentId', Model: Document, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/documents' },
  inventory: { path: '/inventory', idField: 'itemId', Model: InventoryItem, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/inventory' },
  vendors: { path: '/vendors', idField: 'vendorId', Model: Vendor, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/vendors' },
  incidents: { path: '/incidents', idField: 'incidentId', Model: Incident, verbs: ['list', 'get'], page: '/collective-incidents', detailPage: '/incidents/:id' },
  technicians: { path: '/reference', idField: 'technicianId', Model: Technician, verbs: ['list'], page: '/technicians', pick: 'technicians' },
  users: { path: '/users', idField: 'userId', verbs: ['list'] },
  notifications: { path: '/notifications', idField: 'notificationId', verbs: ['list'] },
  'audit-logs': { path: '/audit-logs', idField: 'entityId', verbs: ['list'], page: '/audit-logs' },
  'knowledge-documents': { path: '/knowledge/documents', idField: 'documentId', verbs: ['list', 'get', 'create'], page: '/knowledge-support',
    createHint: 'title, type (e.g. "SOP", "Policy", "FAQ"), content (full text), optional category.' },
  staff: { path: '/staff', idField: 'staffId', Model: StaffMember, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/staff',
    createHint: 'name, phone, staffType (Maid, Cook, Driver, Nanny, Gardener, Car Cleaner, Society Staff, Security Guard, Electrician, Plumber, Other), employment ("Private" for a resident’s domestic help, "Society" for society staff), optional workingDays, shift. Residents: their apartment is auto-filled. A gate passCode is generated automatically — tell the user to share it.' },
  'ledger-entries': { path: '/accounts', idField: 'entryId', Model: LedgerEntry, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/accounts',
    createHint: 'type ("Income" or "Expense"), category (must match the type — see enum), amount (rupees), date (YYYY-MM-DD), description, optional paymentMode, reference, vendorId, blockId (omit for society-wide).' },
  polls: { path: '/polls', idField: 'pollId', Model: Poll, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/polls',
    createHint: 'title (the question), options (array of 2-12 option strings), optional kind (Poll, Survey, Resolution), description, closesAt (YYYY-MM-DD), targetType + blockId for a block-only poll. List results include per-option votes, percent, totalVotes, leading and myVote.' },
  events: { path: '/events', idField: 'eventId', Model: CommunityEvent, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/events',
    createHint: 'title, startAt (ISO datetime with +05:30 offset), optional endAt, category (Festival, Meeting, AGM, Sports, Kids, Workshop, Health, Maintenance, Other), location (default Clubhouse), capacity (0 = unlimited), description, targetType + blockId for a block-only event. To cancel, update status to "Cancelled".' },
  'sos-alerts': { path: '/sos', idField: 'alertId', Model: SosAlert, verbs: ['list', 'get'], page: '/sos' },
  'move-requests': { path: '/move-requests', idField: 'requestId', Model: MoveRequest, verbs: ['list', 'get', 'create'], page: '/move-requests',
    createHint: 'type ("Move-In" or "Move-Out"), scheduledDate (YYYY-MM-DD), optional timeSlot ("09:00-13:00" or "14:00-18:00"), needsLift (default true), vehicleNumber, moversCompany, notes. Residents: own apartment auto-filled; admins must give residentId. Move-out records any unpaid bill total as pendingDues. Approve / reject / complete / cancel via run_action.' },
  parcels: { path: '/parcels', idField: 'parcelId', Model: Parcel, verbs: ['list'], page: '/parcels' },
  'maintenance-schedules': { path: '/maintenance', idField: 'scheduleId', Model: MaintenanceSchedule, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/maintenance',
    createHint: 'assetName, category (see enum), frequency (Weekly, Fortnightly, Monthly, Quarterly, Half-Yearly, Yearly), optional location, lastDoneAt or nextDueAt (YYYY-MM-DD; nextDueAt defaults to lastDoneAt + frequency), amcProvider, amcExpiry, amcCost, vendorId, blockId, checklist (one step per line). List rows include dueState (Overdue / Due Soon / On Track), daysToDue and amcState.' },
  'forum-posts': { path: '/forum', idField: 'postId', Model: ForumPost, verbs: ['list', 'get', 'create', 'update', 'delete'], page: '/forum',
    createHint: 'kind (Discussion, Buy / Sell, Lost & Found, Recommendation, Help Needed, Announcement — admins only), title, body, and for Buy / Sell: price (rupees), condition (New, Like New, Good, Fair). Posts are signed with the user’s name and apartment, so only post when the user asks to.' },
};

// Workflow actions beyond plain CRUD. write=true needs user confirmation (unless auto-approve is on).
export const ACTIONS = {
  ticket_update_status: { method: 'PATCH', path: '/tickets/:id/status', write: true, body: 'status: New | Assigned | In Progress | Resolved | Closed', roles: [...MANAGERS, 'TECHNICIAN'] },
  ticket_assign_technician: { method: 'PATCH', path: '/tickets/:id/assign', write: true, body: 'technicianId', roles: MANAGERS },
  ticket_add_comment: { method: 'POST', path: '/tickets/:id/comments', write: true, body: 'message' },
  ticket_escalate: { method: 'PATCH', path: '/tickets/:id/escalate', write: true, body: 'escalated (boolean, default true)', roles: MANAGERS },
  ticket_reopen: { method: 'POST', path: '/tickets/:id/reopen', write: true, body: 'none', roles: ['RESIDENT', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN'] },
  ticket_reanalyze_ai: { method: 'POST', path: '/tickets/:id/reanalyze', write: false, body: 'none', roles: MANAGERS },
  bill_update_status: { method: 'PATCH', path: '/bills/:id/status', write: true, body: 'status: Pending | Paid | Failed | Cancelled, optional paymentMethod', roles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'RESIDENT'] },
  bills_generate_monthly: { method: 'POST', path: '/bills/monthly-generate', write: true, destructive: true, body: 'optional month (YYYY-MM), amount (default 1500)', roles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN'] },
  work_order_update_status: { method: 'PATCH', path: '/work-orders/:id/status', write: true, body: 'status: Assigned | In Progress | Completed | Cancelled, optional completionNote', roles: [...MANAGERS, 'TECHNICIAN'] },
  visitor_approve: { method: 'PATCH', path: '/visitors/:id/approve', write: true, body: 'none', roles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'SECURITY', 'RESIDENT'] },
  visitor_check_in: { method: 'PATCH', path: '/visitors/:id/check-in', write: true, body: 'none', roles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'SECURITY'] },
  visitor_exit: { method: 'PATCH', path: '/visitors/:id/exit', write: true, body: 'none', roles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'SECURITY'] },
  booking_update_status: { method: 'PATCH', path: '/amenity-bookings/:id/status', write: true, body: 'status: Pending | Approved | Rejected | Cancelled', roles: MANAGERS },
  parking_assign: { method: 'PATCH', path: '/parking-slots/:id/assign', write: true, body: 'vehicleId', roles: MANAGERS },
  inventory_use: { method: 'POST', path: '/inventory/:id/use', write: true, body: 'quantity (number)', roles: ['MAIN_ADMIN', 'FACILITY_MANAGER', 'TECHNICIAN'] },
  incident_update_status: { method: 'PATCH', path: '/incidents/:id/status', write: true, body: 'status: DETECTED | MONITORING | ASSIGNED | RESOLVED | CLOSED | FALSE_POSITIVE', roles: MANAGERS },
  incident_notify_residents: { method: 'POST', path: '/incidents/:id/notify-residents', write: true, body: 'optional message', roles: MANAGERS },
  ai_recommend_technicians: { method: 'POST', path: '/ai/recommend-technicians', write: false, idInBody: 'ticketId', body: 'none (pass the ticket id as id)', roles: MANAGERS },
  ai_recommend_vendors: { method: 'POST', path: '/ai/recommend-vendors', write: false, idInBody: 'ticketId', body: 'none (pass the ticket id as id)', roles: MANAGERS },
  ai_predict_sla_risk: { method: 'POST', path: '/ai/predict-sla-risk', write: false, idInBody: 'ticketId', body: 'none (pass the ticket id as id)', roles: MANAGERS },
  ai_detect_incidents: { method: 'POST', path: '/ai/detect-incidents', write: false, body: 'optional blockId', roles: MANAGERS },
  knowledge_query: { method: 'POST', path: '/knowledge/query', write: false, body: 'question', roles: null },
  staff_check_in: { method: 'PATCH', path: '/staff/:id/check-in', write: true, body: 'none (id may be the staffId or the gate passCode)', roles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'SECURITY'] },
  staff_check_out: { method: 'PATCH', path: '/staff/:id/check-out', write: true, body: 'none (id may be the staffId or the gate passCode)', roles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'SECURITY'] },
  poll_vote: { method: 'POST', path: '/polls/:id/vote', write: true, body: '{ optionId } — the option id (O1, O2…) or its exact text', roles: ['RESIDENT', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN'] },
  poll_close: { method: 'PATCH', path: '/polls/:id/close', write: true, body: 'none', roles: MANAGERS },
  event_rsvp: { method: 'POST', path: '/events/:id/rsvp', write: true, body: '{ response: "Going" | "Maybe" | "Not Going", guests?: number }', roles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER', 'RESIDENT', 'SECURITY'] },
  sos_raise: { method: 'POST', path: '/sos', write: true, body: '{ emergencyType: Medical | Fire | Gas Leak | Security Threat | Lift Stuck | Flooding | Electrical Hazard | Other, message?, location? } — alerts security and admins immediately. Only when the user clearly reports a real emergency; also tell them to call 112 if life is at risk.', roles: null },
  sos_acknowledge: { method: 'PATCH', path: '/sos/:id/acknowledge', write: true, body: '{ note? }', roles: [...MANAGERS, 'SECURITY'] },
  sos_resolve: { method: 'PATCH', path: '/sos/:id/resolve', write: true, body: '{ note?, falseAlarm?: boolean }', roles: [...MANAGERS, 'SECURITY'] },
  move_approve: { method: 'PATCH', path: '/move-requests/:id/approve', write: true, body: '{ note?, overrideDues?: boolean } — move-out with unpaid bills is refused unless overrideDues is true; ask the user before overriding', roles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN'] },
  move_reject: { method: 'PATCH', path: '/move-requests/:id/reject', write: true, body: '{ note } (reason)', roles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN'] },
  move_complete: { method: 'PATCH', path: '/move-requests/:id/complete', write: true, body: 'none — also sets the apartment Occupied/Vacant and the resident move date', roles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'SECURITY'] },
  move_cancel: { method: 'PATCH', path: '/move-requests/:id/cancel', write: true, body: 'none', roles: ['RESIDENT', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN'] },
  parcel_log: { method: 'POST', path: '/parcels', write: true, body: '{ apartmentId, courier (Amazon, Flipkart, Swiggy / Zomato, Blinkit / Zepto, BlueDart, Delhivery, DTDC, India Post, Myntra, Other), description?, packages?, storageLocation? } — notifies the resident with a 4-digit pickup code (no id needed)', roles: ['SECURITY', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN'] },
  parcel_collect: { method: 'PATCH', path: '/parcels/:id/collect', write: true, body: '{ pickupCode, collectedByName? } — the code the resident shows', roles: ['SECURITY', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN'] },
  parcel_return: { method: 'PATCH', path: '/parcels/:id/return', write: true, body: 'none', roles: ['SECURITY', 'MAIN_ADMIN', 'BLOCK_SUB_ADMIN'] },
  maintenance_mark_done: { method: 'POST', path: '/maintenance/:id/complete', write: true, body: '{ note?, cost?, doneAt? (YYYY-MM-DD) } — schedules the next service; cost > 0 by an admin/FM also adds a ledger expense', roles: ['MAIN_ADMIN', 'FACILITY_MANAGER', 'TECHNICIAN'] },
  forum_comment: { method: 'POST', path: '/forum/:id/comments', write: true, body: '{ text }', roles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER', 'RESIDENT', 'SECURITY'] },
  forum_like: { method: 'POST', path: '/forum/:id/like', write: true, body: 'none (toggles)', roles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER', 'RESIDENT', 'SECURITY'] },
  notifications_mark_all_read: { method: 'PATCH', path: '/notifications/read-all', write: true, body: 'none', roles: null },
};

export const REPORTS = {
  dashboard: { roles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'RESIDENT'], path: (user) => user.role === 'MAIN_ADMIN' ? '/dashboard/main-admin' : user.role === 'BLOCK_SUB_ADMIN' ? `/dashboard/block-admin/${user.blockId}` : `/dashboard/resident/${user.userId}` },
  tickets: { roles: MANAGERS, path: () => '/reports/tickets' },
  billing: { roles: MANAGERS, path: () => '/reports/billing' },
  technicians: { roles: MANAGERS, path: () => '/reports/technicians' },
  residents: { roles: MANAGERS, path: () => '/reports/residents' },
  sla: { roles: MANAGERS, path: () => '/reports/sla' },
  ai_insights: { roles: MANAGERS, path: () => '/ai/insights' },
  ai_usage: { roles: MANAGERS, path: () => '/ai/analytics/usage' },
  accounts: { roles: ['MAIN_ADMIN', 'BLOCK_SUB_ADMIN', 'FACILITY_MANAGER', 'RESIDENT', 'SECURITY'], path: () => '/accounts/summary?months=12' },
};

// Pages the UI exposes per role (mirrors frontend/src/components/Sidebar.jsx + App.jsx routes).
const ADMIN_COMMON = ['/residents', '/tickets', '/work-orders', '/billing', '/visitors', '/parking', '/notices', '/reports'];
export const PAGES = {
  MAIN_ADMIN: ['/main-admin/dashboard', '/ai-insights', '/collective-incidents', '/knowledge-support', '/ai-chatbot', '/communities', '/blocks', '/apartments', ...ADMIN_COMMON, '/technicians', '/vendors', '/amenities', '/bookings', '/documents', '/inventory', '/vehicles', '/accounts', '/staff', '/polls', '/events', '/sos', '/move-requests', '/parcels', '/maintenance', '/forum', '/audit-logs'],
  BLOCK_SUB_ADMIN: ['/block-admin/dashboard', '/ai-insights', '/collective-incidents', '/knowledge-support', '/ai-chatbot', '/blocks', '/apartments', ...ADMIN_COMMON, '/bookings', '/documents', '/vehicles', '/accounts', '/staff', '/polls', '/events', '/sos', '/move-requests', '/parcels', '/maintenance', '/forum'],
  RESIDENT: ['/resident/dashboard', '/knowledge-support', '/ai-chatbot', '/resident/create-complaint', '/tickets', '/billing', '/visitors', '/vehicles', '/amenities', '/bookings', '/notices', '/documents', '/staff', '/polls', '/events', '/accounts', '/sos', '/parcels', '/move-requests', '/forum'],
  TECHNICIAN: ['/technician/dashboard', '/knowledge-support', '/ai-chatbot', '/work-orders', '/tickets', '/inventory', '/sos', '/maintenance'],
  SECURITY: ['/security/dashboard', '/visitors', '/ai-chatbot', '/sos', '/staff', '/events', '/polls', '/accounts', '/parcels', '/move-requests', '/forum'],
  FACILITY_MANAGER: ['/ai-chatbot', '/ai-insights', '/collective-incidents', '/knowledge-support', '/work-orders', '/tickets', '/residents', '/vendors', '/amenities', '/bookings', '/inventory', '/reports', '/accounts', '/staff', '/events', '/polls', '/sos', '/maintenance', '/move-requests', '/parcels', '/forum'],
};

export const DETAIL_PAGES = { MAIN_ADMIN: ['/tickets/', '/incidents/'], BLOCK_SUB_ADMIN: ['/tickets/', '/incidents/'], FACILITY_MANAGER: ['/tickets/', '/incidents/'], RESIDENT: ['/tickets/'], TECHNICIAN: ['/tickets/'], SECURITY: [] };

export const pageAllowed = (role, path) => {
  const clean = String(path || '').split('?')[0];
  return (PAGES[role] || []).includes(clean) || (DETAIL_PAGES[role] || []).some((prefix) => clean.startsWith(prefix) && clean.length > prefix.length);
};

// Compact field summary from a Mongoose schema so Claude knows exact field names and enums.
const HIDDEN = new Set(['_id', 'createdAt', 'updatedAt', 'timeline', 'comments', 'attachments', 'aiAnalysis', 'aiHistory', 'embedding', 'password', 'votes', 'rsvps', 'entryLog', 'history', 'likes', 'pickupCode', 'lastReminderFor']);
function describeSchema(Model) {
  if (!Model) return '';
  const fields = [];
  Model.schema.eachPath((name, type) => {
    const root = name.split('.')[0];
    if (HIDDEN.has(root) || name.includes('.')) return;
    let text = name;
    const enums = type.enumValues?.length ? type.enumValues : type.options?.enum;
    if (Array.isArray(enums) && enums.length) text += `(${enums.join('|')})`;
    else if (type.instance && !['String', 'Mixed', 'ObjectId'].includes(type.instance)) text += `:${type.instance.toLowerCase()}`;
    if (type.isRequired) text += '*';
    fields.push(text);
  });
  return fields.join(', ');
}

export function catalogText() {
  const resources = Object.entries(RESOURCES).map(([key, r]) => {
    const schema = describeSchema(r.Model);
    return `- ${key} [${r.verbs.join(',')}] id=${r.idField}${schema ? `\n    fields: ${schema}` : ''}${r.createHint ? `\n    create: ${r.createHint}` : ''}`;
  }).join('\n');
  const actions = Object.entries(ACTIONS).map(([key, a]) => `- ${key}${a.write ? ' (changes data)' : ''}: body { ${a.body} }${a.roles ? ` roles: ${a.roles.join('/')}` : ''}`).join('\n');
  return `RESOURCES (use with query_records / get_record / create_record / update_record / delete_record; * = required):\n${resources}\n\nACTIONS (use with run_action):\n${actions}\n\nREPORTS (use with get_report): ${Object.keys(REPORTS).join(', ')}`;
}
