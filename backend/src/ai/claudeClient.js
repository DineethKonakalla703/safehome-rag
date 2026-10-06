import Anthropic from '@anthropic-ai/sdk';
import { aiConfig } from './aiConfig.js';
import { parseClaudeJson } from './claudeJsonParser.js';

export async function callClaudeJson(systemPrompt, userPrompt, fallbackValue) {
  if (!process.env.ANTHROPIC_API_KEY) return fallbackValue;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL || aiConfig.model,
      max_tokens: 1200,
      temperature: 0,
      system: `${systemPrompt}\nReturn valid JSON only. Do not include markdown fences or commentary.`,
      messages: [{ role: 'user', content: userPrompt }],
    }, { signal: AbortSignal.timeout(Number(process.env.AI_REQUEST_TIMEOUT_MS || 30000)) });
    const text = response.content.filter((item) => item.type === 'text').map((item) => item.text).join('\n');
    return parseClaudeJson(text) ?? fallbackValue;
  } catch (error) {
    console.warn(`Claude request failed; safe fallback used (${error.name || 'Error'}).`);
    return fallbackValue;
  }
}

export async function callClaudeVisionJson(systemPrompt, userPrompt, imageBase64, mediaType, fallbackValue) {
  if (!process.env.ANTHROPIC_API_KEY) return fallbackValue;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({ model: process.env.CLAUDE_MODEL || aiConfig.model, max_tokens: 1000, temperature: 0, system: `${systemPrompt}\nReturn valid JSON only.`, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } }, { type: 'text', text: userPrompt }] }] }, { signal: AbortSignal.timeout(Number(process.env.AI_REQUEST_TIMEOUT_MS || 30000)) });
    const text = response.content.filter((item) => item.type === 'text').map((item) => item.text).join('\n');
    return parseClaudeJson(text) ?? fallbackValue;
  } catch (error) { console.warn(`Claude vision failed; image retained without AI analysis (${error.name || 'Error'}).`); return fallbackValue; }
}
