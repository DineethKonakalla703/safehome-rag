import Bill from '../../models/Bill.js';
import Ticket from '../../models/Ticket.js';
import Visitor from '../../models/Visitor.js';
import WorkOrder from '../../models/WorkOrder.js';
import { scopedFilter } from '../../middleware/auth.js';
import { buildGraphContext } from '../rag/graphContextBuilder.js';
import { retrieveKnowledge } from '../rag/retriever.js';
import { generateGroundedAnswer } from '../rag/answerGenerator.js';
import { recommendTechnicians } from '../technicianRecommender.js';
import { predictSlaRisk } from '../slaRiskPredictor.js';
import { buildBulkImportInstruction } from './bulkCrudIntentHandler.js';

const ticketScope = (user) => scopedFilter(user, { residentField: 'residentId', blockField: 'blockId', technicianField: 'assignedTechnicianId' });
export async function routeTool({ intent, entities, user }) {
  if (intent === 'SHOW_TICKETS') return Ticket.find({ ...ticketScope(user), ...(entities.status === 'open' ? { status: { $nin: ['Resolved', 'Closed'] } } : {}) }).sort({ createdAt: -1 }).limit(20).lean();
  if (intent === 'SHOW_BILLS') return Bill.find(scopedFilter(user, { residentField: 'residentId', blockField: 'blockId' })).sort({ createdAt: -1 }).limit(20).lean();
  if (intent === 'SHOW_WORK_ORDERS') return WorkOrder.find(scopedFilter(user, { blockField: 'blockId', technicianField: 'technicianId' })).sort({ createdAt: -1 }).limit(20).lean();
  if (intent === 'SHOW_VISITORS') return Visitor.find(scopedFilter(user, { residentField: 'residentId', blockField: 'blockId' })).sort({ createdAt: -1 }).limit(20).lean();
  if (intent === 'RECOMMEND_TECHNICIAN' || intent === 'PREDICT_SLA_RISK') {
    const ticket = await Ticket.findOne({ ticketId: entities.ticketId, ...ticketScope(user) });
    if (!ticket) throw new Error('Ticket was not found in your access scope.');
    return intent === 'RECOMMEND_TECHNICIAN' ? recommendTechnicians(ticket) : predictSlaRisk(ticket);
  }
  if (intent === 'QUERY_KNOWLEDGE') { const retrieved = await retrieveKnowledge(entities.question); return generateGroundedAnswer(entities.question, retrieved, await buildGraphContext(user, entities)); }
  if (intent === 'SHOW_REPORT_SUMMARY') { const [tickets, open, highRisk] = await Promise.all([Ticket.countDocuments(ticketScope(user)), Ticket.countDocuments({ ...ticketScope(user), status: { $nin: ['Resolved', 'Closed'] } }), Ticket.countDocuments({ ...ticketScope(user), safetyRisk: true })]); return { tickets, open, highRisk }; }
  if (intent === 'BULK_CREATE_BLOCK_RESIDENTS') return buildBulkImportInstruction(entities);
  if (intent === 'CREATE_TICKET' || intent === 'CREATE_NOTICE') return { executed: false, message: 'This write action requires the dedicated validated CRM form/API and was not executed by the chatbot.' };
  return null;
}
