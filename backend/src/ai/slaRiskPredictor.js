import Technician from '../models/Technician.js';
import { callClaudeJson } from './claudeClient.js';
import { explanationSystemPrompt } from './claudePrompts.js';

export async function predictSlaRisk(ticket) {
  const tech = ticket.assignedTechnicianId ? await Technician.findOne({ technicianId: ticket.assignedTechnicianId }).lean() : null;
  let score = { Low: 0.15, Medium: 0.35, High: 0.58, Critical: 0.78 }[ticket.severity] || 0.25;
  if (!ticket.assignedTechnicianId) score += 0.16;
  if (ticket.escalationFlag) score += 0.16;
  if (ticket.safetyRisk || ticket.aiAnalysis?.safetyRisk) score += 0.12;
  if (tech?.workload >= 3) score += 0.1;
  if (ticket.slaDueDate) {
    const remaining = new Date(ticket.slaDueDate).getTime() - Date.now();
    if (remaining <= 0) score += 0.3;
    else if (remaining < 4 * 3600000) score += 0.2;
    else if (remaining < 12 * 3600000) score += 0.1;
  }
  if (['Resolved', 'Closed'].includes(ticket.status)) score = 0.05;
  score = Math.max(0, Math.min(1, score));
  const riskLevel = score >= 0.85 ? 'Critical' : score >= 0.65 ? 'High' : score >= 0.35 ? 'Medium' : 'Low';
  const fallbackReason = `${ticket.severity} severity; status ${ticket.status}; ${ticket.assignedTechnicianId ? 'technician assigned' : 'no technician assigned'}; ${ticket.escalationFlag ? 'escalated' : 'not escalated'}${ticket.slaDueDate ? `; SLA due ${new Date(ticket.slaDueDate).toISOString()}` : ''}.`;
  const explained = await callClaudeJson(explanationSystemPrompt, JSON.stringify({ task: 'Explain an SLA risk score without changing it', riskLevel, riskScore: score, facts: fallbackReason }), { reason: fallbackReason });
  return { riskLevel, riskScore: Number(score.toFixed(2)), reason: typeof explained?.reason === 'string' ? explained.reason : fallbackReason, predictedAt: new Date() };
}
