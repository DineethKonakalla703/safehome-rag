import KnowledgeChunk from '../../models/KnowledgeChunk.js';

const terms = (value) => new Set(String(value || '').toLowerCase().match(/[a-z0-9]{3,}/g) || []);

export async function keywordSearch(query, limit = 6) {
  const queryTerms = terms(query);
  const chunks = await KnowledgeChunk.find().lean();
  return chunks
    .map((chunk) => {
      const contentTerms = terms(chunk.content);
      const matches = [...queryTerms].filter((term) => contentTerms.has(term)).length;
      return { ...chunk, score: queryTerms.size ? matches / queryTerms.size : 0 };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function vectorSearch(embedding, limit = 6) {
  if (!Array.isArray(embedding) || !embedding.length) return [];
  const indexName = process.env.MONGODB_VECTOR_INDEX_NAME || 'knowledge_vector_index';
  try {
    const results = await KnowledgeChunk.aggregate([
      {
        $vectorSearch: {
          index: indexName,
          path: 'embedding',
          queryVector: embedding,
          numCandidates: limit * 10,
          limit,
        },
      },
    ]);
    return results;
  } catch (error) {
    console.warn(`Vector search failed (${error.message}); falling back to keyword search.`);
    return [];
  }
}
