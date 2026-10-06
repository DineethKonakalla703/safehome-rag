import Incident from '../models/Incident.js';
import Ticket from '../models/Ticket.js';
import { nextPublicId } from '../utils/http.js';
import { writeAIAudit } from './aiAuditLogger.js';

const canonical = (ticket) => String(ticket.aiAnalysis?.category || ticket.category || 'General Maintenance').toLowerCase().split(/[+/]/)[0].trim();
export async function detectCollectiveIncidents({ ticket = null, communityId, blockId, actorId = 'AI_SERVICE', hours = 72 }) {
  const effectiveBlockId = blockId || ticket?.blockId;
  const scope = { communityId: communityId || ticket?.communityId, createdAt: { $gte: new Date(Date.now() - hours * 3600000) } };
  if (effectiveBlockId) scope.blockId = effectiveBlockId;
  const tickets = await Ticket.find(scope).sort({ createdAt: -1 });
  const groups = new Map();
  for (const item of tickets) { const key = `${item.blockId}::${canonical(item)}`; groups.set(key, [...(groups.get(key) || []), item]); }
  const incidents = [];
  for (const [groupKey, related] of groups) {
    if (related.length < 3) continue;
    const [groupBlockId, category] = groupKey.split('::');
    const existing = await Incident.findOne({ blockId: groupBlockId, category, status: { $ne: 'Resolved' } });
    const incidentId = existing?.incidentId || await nextPublicId(Incident, 'incidentId', 'INC');
    const severity = related.some((item) => ['Critical', 'High'].includes(item.severity)) ? 'High' : 'Medium';
    const data = { incidentId, title: `${groupBlockId} ${category.replace(/\b\w/g, (char) => char.toUpperCase())} Issue`, category, blockId: groupBlockId, communityId: scope.communityId, severity, status: existing?.status || 'Open', relatedTickets: related.map((item) => item.ticketId), detectedBy: 'hybrid-rules', aiReason: `${related.length} similar tickets were reported in the same block within ${hours} hours.`, detectedAt: existing?.detectedAt || new Date() };
    const incident = await Incident.findOneAndUpdate({ incidentId }, data, { upsert: true, new: true, runValidators: true });
    await Ticket.updateMany({ ticketId: { $in: data.relatedTickets } }, { relatedIncidentId: incidentId });
    if (!existing) await writeAIAudit({ action: 'INCIDENT_DETECTED', entityType: 'Incident', entityId: incidentId, actorId, message: data.aiReason });
    incidents.push(incident);
  }
  return incidents;
}
