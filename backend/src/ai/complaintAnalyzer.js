import { aiConfig } from './aiConfig.js';
import { fallbackComplaintAnalysis } from './aiFallbackRules.js';
import { callClaudeJson } from './claudeClient.js';
import { complaintSystemPrompt } from './claudePrompts.js';

const severities = ['Low', 'Medium', 'High', 'Critical'];
function valid(value) {
  return value && typeof value.category === 'string' && severities.includes(value.severity) && typeof value.safetyRisk === 'boolean' && Array.isArray(value.missingInfo) && typeof value.suggestedAction === 'string' && Number.isFinite(Number(value.confidence)) && Number(value.confidence) >= 0 && Number(value.confidence) <= 1;
}

export async function analyzeComplaintWithAI(input) {
  const fallback = fallbackComplaintAnalysis(input);
  const raw = await callClaudeJson(complaintSystemPrompt, JSON.stringify({ task: 'Analyze this complaint', complaint: input, outputSchema: { category: 'string', severity: 'Low | Medium | High | Critical', safetyRisk: 'boolean', safetyRiskType: 'string or null', missingInfo: ['string'], suggestedAction: 'string', confidence: '0 to 1' } }), fallback);
  if (raw === fallback || raw?.fallbackUsed === true || !valid(raw)) return fallback;
  return { ...raw, confidence: Number(raw.confidence), provider: aiConfig.provider, modelVersion: aiConfig.model, fallbackUsed: false };
}
