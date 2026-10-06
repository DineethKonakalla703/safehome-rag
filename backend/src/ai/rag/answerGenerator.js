import { callClaudeJson } from '../claudeClient.js';
import { groundedAnswerSystemPrompt } from '../claudePrompts.js';

export async function generateGroundedAnswer(question, retrieved, graphContext) {
  const sources = [...new Map(retrieved.map((item) => [item.documentId, { title: item.document.title, documentId: item.documentId }])).values()];
  const contextText = retrieved.map((item) => `[${item.document.title}] ${item.content}`).join('\n');
  const safetyWarning = /electrical|gas|fire|smoke|lift|structural|danger/i.test(`${question} ${contextText}`);
  const fallback = retrieved.length ? { answer: `Based on the available knowledge: ${retrieved[0].content}`, confidence: Math.min(0.85, 0.55 + retrieved[0].score * 0.3), safetyWarning } : { answer: 'The knowledge base does not contain enough information to answer this question.', confidence: 0.2, safetyWarning };
  const result = await callClaudeJson(groundedAnswerSystemPrompt, JSON.stringify({ question, knowledgeChunks: retrieved.map((item) => ({ title: item.document.title, content: item.content })), authorizedCrmContext: graphContext, outputSchema: { answer: 'string', confidence: '0 to 1', safetyWarning: 'boolean' } }), fallback);
  return { answer: typeof result?.answer === 'string' ? result.answer : fallback.answer, sources, confidence: Math.max(0, Math.min(1, Number(result?.confidence ?? fallback.confidence))), safetyWarning: Boolean(result?.safetyWarning ?? fallback.safetyWarning) };
}
