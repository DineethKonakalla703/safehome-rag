export function parseClaudeJson(value) {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = Math.min(...['{', '['].map((token) => cleaned.indexOf(token)).filter((index) => index >= 0));
  if (!Number.isFinite(start)) return null;
  const objectEnd = cleaned.lastIndexOf('}');
  const arrayEnd = cleaned.lastIndexOf(']');
  const end = Math.max(objectEnd, arrayEnd);
  if (end < start) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
}
