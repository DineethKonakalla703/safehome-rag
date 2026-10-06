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

    // Spatial & Temporal Proximity Analysis
    const apartments = related.map((t) => String(t.apartmentId || '')).filter(Boolean);
    const floors = apartments.map((apt) => (apt.match(/\d+/) || [''])[0].slice(0, 1));
    const floorClusters = new Set(floors);
    const floorProximity = floors.length > 0 && floorClusters.size <= Math.ceil(floors.length / 2);

    const now = Date.now();
    const recent24hCount = related.filter((t) => (now - new Date(t.createdAt).getTime()) <= 24 * 3600000).length;
    const timeDecayFactor = recent24hCount >= 2 ? 0.12 : 0.05;
    const proximityBonus = floorProximity ? 0.08 : 0.02;

    const confidence = Number(Math.min(0.99, 0.68 + (related.length * 0.04) + timeDecayFactor + proximityBonus).toFixed(2));
    const locationDetail = floorProximity ? ` clustered across common floors (${[...floorClusters].join(', ')})` : '';

    const data = {
      incidentId,
      title: `${groupBlockId} ${group.label} Issue`,
      category,
      blockId: groupBlockId,
      communityId: scope.communityId,
      severity,
      confidence,
      status: existing?.status || 'DETECTED',
      relatedTickets: related.map((item) => item.ticketId),
      affectedBlocks: [groupBlockId],
      affectedApartments: [...new Set(apartments)],
      detectedBy: 'hybrid-proximity-and-time-decay',
      aiReason: `${related.length} semantically similar ${group.label.toLowerCase()} tickets were reported in ${groupBlockId}${locationDetail} with ${recent24hCount} occurrences in the last 24h (confidence: ${Math.round(confidence * 100)}%).`,
      detectedAt: existing?.detectedAt || new Date(),
      timeline: existing?.timeline?.length
        ? existing.timeline
        : [{ action: 'INCIDENT_DETECTED', details: `${related.length} tickets clustered with ${Math.round(confidence * 100)}% confidence based on proximity and time decay.`, performedBy: actorId }],
    };
    const incident = await Incident.findOneAndUpdate({ incidentId }, data, { upsert: true, new: true, runValidators: true });
    await Ticket.updateMany({ ticketId: { $in: data.relatedTickets } }, { relatedIncidentId: incidentId });
    if (!existing) await writeAIAudit({ action: 'INCIDENT_DETECTED', entityType: 'Incident', entityId: incidentId, actorId, message: data.aiReason });
    incidents.push(incident);
  }
  return incidents;
}
