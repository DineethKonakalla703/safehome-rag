export const extractText = (input) => String(input || '').replace(/\s+/g, ' ').trim();
export function splitText(text, maxLength = 900) {
  const words = extractText(text).split(' '); const chunks = []; let current = '';
  for (const word of words) { if (`${current} ${word}`.trim().length > maxLength && current) { chunks.push(current); current = word; } else current = `${current} ${word}`.trim(); }
  if (current) chunks.push(current); return chunks;
}
