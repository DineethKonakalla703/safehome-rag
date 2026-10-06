import Incident from '../models/Incident.js';
import Ticket from '../models/Ticket.js';
import { scopedFilter } from '../middleware/auth.js';
import { writeAIAudit } from '../ai/aiAuditLogger.js';
import { detectCollectiveIncidents } from '../ai/collectiveIncidentDetector.js';
import { recommendTechnicians } from '../ai/technicianRecommender.js';
import { predictSlaRisk } from '../ai/slaRiskPredictor.js';
import { AppError, asyncHandler, ok } from '../utils/http.js';

const filterFor = (user) => scopedFilter(user, { residentField: 'residentId', blockField: 'blockId', technicianField: 'assignedTechnicianId' });
async function scopedTicket(user, ticketId) { const ticket = await Ticket.findOne({ ticketId, ...filterFor(user) }); if (!ticket) throw new AppError(404, 'Ticket not found in your access scope.'); return ticket; }

export const recommendForTicket = asyncHandler(async (req, res) => {
  const ticket = await scopedTicket(req.user, req.body.ticketId); const recommendations = await recommendTechnicians(ticket); ticket.recommendedTechnicians = recommendations; await ticket.save();
  await writeAIAudit({ action: 'AI_TECHNICIAN_RECOMMENDATION_GENERATED', entityType: 'Ticket', entityId: ticket.ticketId, actorId: req.user.userId, message: `${recommendations.length} recommendations generated; no technician was assigned.` }); ok(res, recommendations);
});
export const predictForTicket = asyncHandler(async (req, res) => {
  const ticket = await scopedTicket(req.user, req.body.ticketId); const prediction = await predictSlaRisk(ticket); ticket.slaPrediction = prediction; await ticket.save();
  await writeAIAudit({ action: 'AI_SLA_RISK_PREDICTION_GENERATED', entityType: 'Ticket', entityId: ticket.ticketId, actorId: req.user.userId, message: `${prediction.riskLevel} SLA risk (${prediction.riskScore}).` }); ok(res, prediction);
});
export const detectIncidents = asyncHandler(async (req, res) => ok(res, await detectCollectiveIncidents({ communityId: req.user.communityId, blockId: req.user.role === 'BLOCK_SUB_ADMIN' ? req.user.blockId : req.body.blockId, actorId: req.user.userId })));
export const listIncidents = asyncHandler(async (req, res) => ok(res, await Incident.find(req.user.role === 'BLOCK_SUB_ADMIN' ? { blockId: req.user.blockId } : { communityId: req.user.communityId }).sort({ detectedAt: -1 }).lean()));
export const reviewAIAnalysis = asyncHandler(async (req, res) => { const ticket = await scopedTicket(req.user, req.params.ticketId); if (!ticket.aiAnalysis) throw new AppError(409, 'Ticket has no AI analysis.'); ticket.aiAnalysis.reviewedByHuman = true; ticket.aiAnalysis.reviewedBy = req.user.userId; ticket.aiAnalysis.reviewedAt = new Date(); await ticket.save(); await writeAIAudit({ action: 'AI_ANALYSIS_HUMAN_REVIEWED', entityType: 'Ticket', entityId: ticket.ticketId, actorId: req.user.userId, message: 'AI analysis reviewed by an authorized human.' }); ok(res, ticket.aiAnalysis); });
export const aiInsights = asyncHandler(async (req, res) => {
  const filter = filterFor(req.user); const [highRisk, pendingReview, slaRisk, incidents, recent] = await Promise.all([Ticket.countDocuments({ ...filter, 'aiAnalysis.safetyRisk': true }), Ticket.countDocuments({ ...filter, 'aiAnalysis.humanApprovalRequired': true, 'aiAnalysis.reviewedByHuman': { $ne: true } }), Ticket.countDocuments({ ...filter, 'slaPrediction.riskLevel': { $in: ['High', 'Critical'] } }), Incident.countDocuments(req.user.role === 'BLOCK_SUB_ADMIN' ? { blockId: req.user.blockId, status: { $ne: 'Resolved' } } : { communityId: req.user.communityId, status: { $ne: 'Resolved' } }), Ticket.find(filter).sort({ createdAt: -1 }).limit(10).lean()]);
  ok(res, { summary: { highRisk, pendingReview, slaRisk, incidents }, recent });
});
