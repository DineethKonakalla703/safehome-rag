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
    });
    const text = response.content.filter((item) => item.type === 'text').map((item) => item.text).join('\n');
    return parseClaudeJson(text) ?? fallbackValue;
  } catch (error) {
    console.warn(`Claude request failed; safe fallback used (${error.name || 'Error'}).`);
    return fallbackValue;
  }
}
