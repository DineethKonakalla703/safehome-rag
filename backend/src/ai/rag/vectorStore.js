import KnowledgeChunk from '../../models/KnowledgeChunk.js';

const terms = (value) => new Set(String(value || '').toLowerCase().match(/[a-z0-9]{3,}/g) || []);
export async function keywordSearch(query, limit = 6) {
  const queryTerms = terms(query); const chunks = await KnowledgeChunk.find().lean();
  return chunks.map((chunk) => { const contentTerms = terms(chunk.content); const matches = [...queryTerms].filter((term) => contentTerms.has(term)).length; return { ...chunk, score: queryTerms.size ? matches / queryTerms.size : 0 }; }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
}
