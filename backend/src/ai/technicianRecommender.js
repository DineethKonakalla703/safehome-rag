import Technician from '../models/Technician.js';
import { callClaudeJson } from './claudeClient.js';
import { explanationSystemPrompt } from './claudePrompts.js';

const categoryTerms = (ticket) => `${ticket.category || ''} ${ticket.title || ''}`.toLowerCase();
export async function recommendTechnicians(ticket) {
  const technicians = await Technician.find({ communityId: ticket.communityId }).lean();
  const terms = categoryTerms(ticket);
  const ranked = technicians.map((tech) => {
    const skill = String(tech.skill || '').toLowerCase();
    let score = 10;
    if ((terms.includes('electrical') && skill.includes('electric')) || (terms.includes('plumb') && skill.includes('plumb')) || (terms.includes('lift') && skill.includes('lift')) || (terms.includes('general') && skill.includes('general'))) score += 35;
    if ((ticket.safetyRisk || ticket.aiAnalysis?.safetyRisk) && terms.includes('electrical') && skill.includes('electric')) score += 8;
    if (tech.available) score += 15;
    score += Math.max(0, 12 - Number(tech.workload || 0) * 3);
    score += Math.round(Number(tech.rating || 0) * 2);
    if (!tech.blockId || tech.blockId === ticket.blockId) score += 8;
    return { technicianId: tech.technicianId, name: tech.name, score: Math.min(100, score), reason: `${tech.skill} skill; ${tech.available ? 'available' : 'currently unavailable'}; workload ${tech.workload}; rating ${tech.rating}.`, generatedAt: new Date() };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
  const fallback = { recommendations: ranked.map((item) => ({ technicianId: item.technicianId, reason: item.reason })) };
  const explained = await callClaudeJson(explanationSystemPrompt, JSON.stringify({ task: 'Explain each ranked technician recommendation without changing scores', ticket: { category: ticket.category, severity: ticket.severity, safetyRisk: ticket.safetyRisk, blockId: ticket.blockId }, recommendations: ranked }), fallback);
  const byId = new Map((explained?.recommendations || []).map((item) => [item.technicianId, item.reason]));
  return ranked.map((item) => ({ ...item, reason: byId.get(item.technicianId) || item.reason }));
}
