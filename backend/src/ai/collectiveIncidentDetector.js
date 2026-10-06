import Incident from '../models/Incident.js';
import Ticket from '../models/Ticket.js';
import { nextPublicId } from '../utils/http.js';
import { writeAIAudit } from './aiAuditLogger.js';

const incidentFamilies = [
  { category: 'water-supply', label: 'Water Supply', terms: ['water', 'leak', 'leakage', 'plumb', 'pipe', 'drain', 'seepage'] },
  { category: 'gas-safety', label: 'Gas Safety', terms: ['gas', 'lpg'] },
  { category: 'fire-safety', label: 'Fire Safety', terms: ['fire', 'smoke', 'burning'] },
  { category: 'lift-emergency', label: 'Lift Emergency', terms: ['lift', 'elevator'] },
  { category: 'electrical', label: 'Electrical', terms: ['electric', 'switchboard', 'spark', 'power', 'current', 'wiring'] },
  { category: 'structural', label: 'Structural', terms: ['structural', 'crack', 'ceiling', 'wall damage'] },
  { category: 'housekeeping', label: 'Housekeeping', terms: ['garbage', 'waste', 'cleaning', 'housekeeping'] },
  { category: 'parking', label: 'Parking', terms: ['parking', 'vehicle', 'slot'] },
];

const ticketText = (ticket) => `${ticket.aiAnalysis?.category || ''} ${ticket.category || ''} ${ticket.title || ''} ${ticket.description || ''}`.toLowerCase();
export function classifyIncidentCategory(ticket) {
  const text = ticketText(ticket);
  const family = incidentFamilies.find((item) => item.terms.some((term) => text.includes(term)));
  if (family) return { category: family.category, label: family.label };
  const category = String(ticket.aiAnalysis?.category || ticket.category || 'general-maintenance').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { category: category || 'general-maintenance', label: (category || 'general-maintenance').replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) };
}

export async function detectCollectiveIncidents({ ticket = null, communityId, blockId, actorId = 'AI_SERVICE', hours = 72 }) {
  const effectiveBlockId = blockId || ticket?.blockId;
  const scope = { communityId: communityId || ticket?.communityId, createdAt: { $gte: new Date(Date.now() - hours * 3600000) } };
  if (effectiveBlockId) scope.blockId = effectiveBlockId;
  const tickets = await Ticket.find(scope).sort({ createdAt: -1 });
  const groups = new Map();
  for (const item of tickets) { const family = classifyIncidentCategory(item); const key = `${item.blockId}::${family.category}`; groups.set(key, { label: family.label, tickets: [...(groups.get(key)?.tickets || []), item] }); }
  const incidents = [];
  for (const [groupKey, group] of groups) {
    const related = group.tickets;
    if (related.length < 3) continue;
    const [groupBlockId, category] = groupKey.split('::');
    const existing = await Incident.findOne({ blockId: groupBlockId, category, status: { $nin: ['Resolved', 'RESOLVED', 'CLOSED', 'FALSE_POSITIVE'] } });
    const incidentId = existing?.incidentId || await nextPublicId(Incident, 'incidentId', 'INC');
    const severity = related.some((item) => ['Critical', 'High'].includes(item.severity)) ? 'High' : 'Medium';
    const confidence = Math.min(0.98, 0.68 + related.length * 0.06);
    const data = { incidentId, title: `${groupBlockId} ${group.label} Issue`, category, blockId: groupBlockId, communityId: scope.communityId, severity, confidence, status: existing?.status || 'DETECTED', relatedTickets: related.map((item) => item.ticketId), affectedBlocks: [groupBlockId], affectedApartments: [...new Set(related.map((item)=>item.apartmentId).filter(Boolean))], detectedBy: 'keyword-family-and-time-window', aiReason: `${related.length} semantically similar ${group.label.toLowerCase()} tickets were reported in the same block within ${hours} hours.`, detectedAt: existing?.detectedAt || new Date(), timeline: existing?.timeline?.length ? existing.timeline : [{ action: 'INCIDENT_DETECTED', details: `${related.length} tickets grouped with confidence ${confidence}.`, performedBy: actorId }] };
    const incident = await Incident.findOneAndUpdate({ incidentId }, data, { upsert: true, new: true, runValidators: true });
    await Ticket.updateMany({ ticketId: { $in: data.relatedTickets } }, { relatedIncidentId: incidentId });
    if (!existing) await writeAIAudit({ action: 'INCIDENT_DETECTED', entityType: 'Incident', entityId: incidentId, actorId, message: data.aiReason });
    incidents.push(incident);
  }
  return incidents;
}
