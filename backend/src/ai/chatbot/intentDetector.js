import { fallbackChatIntent } from '../aiFallbackRules.js';
import { callClaudeJson } from '../claudeClient.js';
import { chatbotSystemPrompt } from '../claudePrompts.js';

export const supportedIntents = ['SHOW_TICKETS', 'CREATE_TICKET', 'SHOW_BILLS', 'SHOW_WORK_ORDERS', 'RECOMMEND_TECHNICIAN', 'PREDICT_SLA_RISK', 'QUERY_KNOWLEDGE', 'SHOW_VISITORS', 'SHOW_REPORT_SUMMARY', 'CREATE_NOTICE', 'BULK_CREATE_BLOCK_RESIDENTS', 'UNKNOWN'];
export async function detectIntent(message, role) {
  const fallback = fallbackChatIntent(message);
  const result = await callClaudeJson(chatbotSystemPrompt, JSON.stringify({ message, role, allowedIntents: supportedIntents, outputSchema: { intent: 'allowed intent', entities: {}, requiresConfirmation: 'boolean', response: 'short string' } }), fallback);
  if (!supportedIntents.includes(result?.intent) || typeof result?.entities !== 'object') return fallback;
  return { intent: result.intent, entities: result.entities || {}, requiresConfirmation: Boolean(result.requiresConfirmation), response: String(result.response || fallback.response) };
}
