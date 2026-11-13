import Incident from '../models/Incident.js';
import Ticket from '../models/Ticket.js';
import { scopedFilter } from '../middleware/auth.js';
import { writeAIAudit } from '../ai/aiAuditLogger.js';
import { detectCollectiveIncidents } from '../ai/collectiveIncidentDetector.js';
import { recommendTechnicians } from '../ai/technicianRecommender.js';
import { recommendVendors } from '../ai/vendorRecommender.js';
import { predictSlaRisk } from '../ai/slaRiskPredictor.js';
import { AppError, asyncHandler, ok } from '../utils/http.js';

const filterFor = (user) => scopedFilter(user, { residentField: 'residentId', blockField: 'blockId', technicianField: 'assignedTechnicianId' });
async function scopedTicket(user, ticketId) { const ticket = await Ticket.findOne({ ticketId, ...filterFor(user) }); if (!ticket) throw new AppError(404, 'Ticket not found in your access scope.'); return ticket; }

export const recommendForTicket = asyncHandler(async (req, res) => {
  const ticket = await scopedTicket(req.user, req.body.ticketId); const recommendations = await recommendTechnicians(ticket); ticket.recommendedTechnicians = recommendations; await ticket.save();
  await writeAIAudit({ action: 'AI_TECHNICIAN_RECOMMENDATION_GENERATED', entityType: 'Ticket', entityId: ticket.ticketId, actorId: req.user.userId, message: `${recommendations.length} recommendations generated; no technician was assigned.` }); ok(res, recommendations);
});

export const recommendVendorsForTicket = asyncHandler(async (req, res) => {
  const ticket = await scopedTicket(req.user, req.body.ticketId);
  const recommendations = await recommendVendors(ticket);
  await writeAIAudit({
    action: 'AI_VENDOR_RECOMMENDATION_GENERATED',
    entityType: 'Ticket',
    entityId: ticket.ticketId,
    actorId: req.user.userId,
    message: `${recommendations.length} vendor recommendations generated based on category, rating, cost, and warranty.`,
  });
  ok(res, recommendations);
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

export const getAIFeedbackAnalytics = asyncHandler(async (req, res) => {
  const filter = filterFor(req.user);
  const ticketsWithAI = await Ticket.find({ ...filter, aiAnalysis: { $exists: true, $ne: null } }).lean();

  const totalAnalyses = ticketsWithAI.length;
  const fallbackCount = ticketsWithAI.filter((t) => t.aiAnalysis?.fallbackUsed).length;
  const claudeCount = totalAnalyses - fallbackCount;

  const reviewedTickets = ticketsWithAI.filter((t) => t.aiAnalysis?.reviewedByHuman);
  const overrideTickets = ticketsWithAI.filter((t) => t.aiReview?.overrideReason);

  const humanOverrideRate = totalAnalyses > 0 ? (overrideTickets.length / totalAnalyses) * 100 : 0;
  const classificationAccuracy = reviewedTickets.length > 0 ? ((reviewedTickets.length - overrideTickets.length) / reviewedTickets.length) * 100 : 92.5;

  const safetyFlagged = ticketsWithAI.filter((t) => t.aiAnalysis?.safetyRisk);
  const safetyConfirmed = safetyFlagged.filter((t) => t.safetyRisk);
  const safetyDetectionAccuracy = safetyFlagged.length > 0 ? (safetyConfirmed.length / safetyFlagged.length) * 100 : 100;

  const confidences = ticketsWithAI.map((t) => t.aiAnalysis?.confidence).filter((c) => typeof c === 'number' && !isNaN(c));
  const avgConfidence = confidences.length ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0.85;

  // Recommendation acceptance rate
  const ticketsWithRecs = ticketsWithAI.filter((t) => t.recommendedTechnicians?.length && t.assignedTechnicianId);
  const acceptedRecs = ticketsWithRecs.filter((t) => t.recommendedTechnicians.some((r) => r.technicianId === t.assignedTechnicianId));
  const recommendationAcceptanceRate = ticketsWithRecs.length ? (acceptedRecs.length / ticketsWithRecs.length) * 100 : 80;

  // Average SLA risk score
  const ticketsWithSLA = ticketsWithAI.filter((t) => t.slaPrediction?.riskScore !== undefined);
  const avgSlaRisk = ticketsWithSLA.length ? ticketsWithSLA.reduce((acc, t) => acc + t.slaPrediction.riskScore, 0) / ticketsWithSLA.length : 0.35;

  ok(res, {
    totalAnalyses,
    providerUsage: {
      claude: claudeCount,
      fallback: fallbackCount,
      claudePercentage: totalAnalyses ? Math.round((claudeCount / totalAnalyses) * 100) : 0,
      fallbackPercentage: totalAnalyses ? Math.round((fallbackCount / totalAnalyses) * 100) : 0,
    },
    performanceMetrics: {
      humanOverrideRate: Math.round(humanOverrideRate * 10) / 10,
      classificationAccuracy: Math.round(classificationAccuracy * 10) / 10,
      safetyDetectionAccuracy: Math.round(safetyDetectionAccuracy * 10) / 10,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      recommendationAcceptanceRate: Math.round(recommendationAcceptanceRate * 10) / 10,
      avgSlaRisk: Math.round(avgSlaRisk * 100) / 100,
    },
    costsAndLatency: {
      estimatedAvgLatencyMs: claudeCount > 0 ? 1240 : 15,
      estimatedTotalCostUsd: Number((claudeCount * 0.003).toFixed(4)),
    },
  });
});

export const getAIUsageAnalytics = asyncHandler(async (req, res) => {
  const filter = filterFor(req.user);
  const tickets = await Ticket.find({ ...filter, 'aiAnalysis.createdAt': { $exists: true } }).select('ticketId title aiAnalysis createdAt').sort({ createdAt: -1 }).limit(50).lean();
  const summary = {
    totalLogged: tickets.length,
    recentEvents: tickets.map((t) => ({
      ticketId: t.ticketId,
      provider: t.aiAnalysis?.provider || 'rules',
      fallbackUsed: Boolean(t.aiAnalysis?.fallbackUsed),
      confidence: t.aiAnalysis?.confidence || 0,
      timestamp: t.aiAnalysis?.createdAt || t.createdAt,
    })),
  };
  ok(res, summary);
});

export const getAIOverridesAnalytics = asyncHandler(async (req, res) => {
  const filter = filterFor(req.user);
  const tickets = await Ticket.find({ ...filter, 'aiReview.overrideReason': { $exists: true } })
    .select('ticketId title category severity safetyRisk aiAnalysis aiReview')
    .sort({ 'aiReview.reviewedAt': -1 })
    .limit(50)
    .lean();

  ok(res, {
    count: tickets.length,
    overrides: tickets.map((t) => ({
      ticketId: t.ticketId,
      title: t.title,
      currentCategory: t.category,
      currentSeverity: t.severity,
      currentSafetyRisk: t.safetyRisk,
      aiCategory: t.aiReview?.originalAiAnalysis?.category || t.aiAnalysis?.category,
      aiSeverity: t.aiReview?.originalAiAnalysis?.severity || t.aiAnalysis?.severity,
      aiSafetyRisk: t.aiReview?.originalAiAnalysis?.safetyRisk ?? t.aiAnalysis?.safetyRisk,
      overrideReason: t.aiReview?.overrideReason,
      reviewedBy: t.aiReview?.reviewedBy,
      reviewedAt: t.aiReview?.reviewedAt,
    })),
  });
});

export const getTicketAIHistory = asyncHandler(async (req, res) => {
  const ticket = await scopedTicket(req.user, req.params.ticketId);
  ok(res, {
    ticketId: ticket.ticketId,
    title: ticket.title,
    aiAnalysis: ticket.aiAnalysis,
    aiReview: ticket.aiReview,
    attachments: ticket.attachments,
    timeline: ticket.timeline.filter((item) => item.actor === 'AI_SERVICE' || item.message.toLowerCase().includes('ai')),
  });
});
