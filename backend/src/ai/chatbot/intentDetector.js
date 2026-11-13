import { fallbackChatIntent } from '../aiFallbackRules.js';
import { callClaudeJson } from '../claudeClient.js';
import { chatbotSystemPrompt } from '../claudePrompts.js';

export const supportedIntents = ['SHOW_TICKETS','SHOW_SLA_RISK_TICKETS','SHOW_INCIDENTS','CREATE_TICKET','CREATE_BLOCK','CREATE_APARTMENT','CREATE_RESIDENT','CREATE_NOTICE','GENERATE_BILL','CREATE_VISITOR_REQUEST','CREATE_AMENITY_BOOKING','UPDATE_TICKET_STATUS','ASSIGN_TECHNICIAN','SHOW_BILLS','SHOW_WORK_ORDERS','RECOMMEND_TECHNICIAN','PREDICT_SLA_RISK','QUERY_KNOWLEDGE','SHOW_VISITORS','SHOW_REPORT_SUMMARY','BULK_CREATE_BLOCK_RESIDENTS','UNKNOWN'];
export async function detectIntent(message, role) {
  const fallback = fallbackChatIntent(message);
  const result = await callClaudeJson(chatbotSystemPrompt, JSON.stringify({ message, role, allowedIntents: supportedIntents, outputSchema: { intent: 'allowed intent', entities: {}, requiresConfirmation: 'boolean', response: 'short string' } }), fallback);
  if (!supportedIntents.includes(result?.intent) || typeof result?.entities !== 'object') return fallback;
  return { intent: result.intent, entities: result.entities || {}, requiresConfirmation: Boolean(result.requiresConfirmation), missingFields: Array.isArray(result.missingFields) ? result.missingFields : [], response: String(result.response || fallback.response) };
}
