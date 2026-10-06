import KnowledgeChunk from '../../models/KnowledgeChunk.js';

const terms = (value) => new Set(String(value || '').toLowerCase().match(/[a-z0-9]{3,}/g) || []);

export function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || !vecA.length || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i += 1) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? Math.max(0, dotProduct / denom) : 0;
}

export async function keywordSearch(query, limit = 6) {
  const queryTerms = terms(query);
  const chunks = await KnowledgeChunk.find().lean();
  return chunks
    .map((chunk) => {
      const contentTerms = terms(chunk.content);
      const matches = [...queryTerms].filter((term) => contentTerms.has(term)).length;
      return {
        ...chunk,
        keywordScore: queryTerms.size ? matches / queryTerms.size : 0,
        score: queryTerms.size ? matches / queryTerms.size : 0,
        matchType: 'keyword',
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function vectorSearch(embedding, limit = 6) {
  if (!Array.isArray(embedding) || !embedding.length) return [];
  const indexName = process.env.MONGODB_VECTOR_INDEX_NAME || 'knowledge_vector_index';
  const atlasEnabled = process.env.VECTOR_SEARCH_ENABLED === 'true';

  if (atlasEnabled) {
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
      return results.map((r) => ({ ...r, vectorScore: r.score || 0.85, score: r.score || 0.85, matchType: 'atlas-vector' }));
    } catch (error) {
      console.warn(`Atlas vector search failed (${error.message}); falling back to in-memory cosine similarity.`);
    }
  }

  // Local/In-memory vector similarity
  const chunks = await KnowledgeChunk.find({ 'embedding.0': { $exists: true } }).lean();
  return chunks
    .map((chunk) => {
      const sim = cosineSimilarity(embedding, chunk.embedding);
      return {
        ...chunk,
        vectorScore: sim,
        score: sim,
        matchType: 'vector-cosine',
      };
    })
    .filter((item) => item.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function hybridSearch({ query, queryVector = [], limit = 6 }) {
  const chunks = await KnowledgeChunk.find().lean();
  if (!chunks.length) return [];

  const queryTerms = terms(query);
  const hasVector = Array.isArray(queryVector) && queryVector.length > 0;

  const scored = chunks.map((chunk) => {
    // 1. Keyword overlap score
    const contentTerms = terms(chunk.content);
    const matches = [...queryTerms].filter((term) => contentTerms.has(term)).length;
    const keywordScore = queryTerms.size ? matches / queryTerms.size : 0;

    // 2. Vector cosine similarity score
    let vectorScore = 0;
    if (hasVector && Array.isArray(chunk.embedding) && chunk.embedding.length) {
      vectorScore = cosineSimilarity(queryVector, chunk.embedding);
    }

    // Combined reciprocal rank / weighted hybrid score
    const hybridScore = hasVector && vectorScore > 0
      ? (keywordScore * 0.45) + (vectorScore * 0.55)
      : keywordScore;

    const matchType = (keywordScore > 0 && vectorScore > 0)
      ? 'hybrid'
      : vectorScore > 0
        ? 'vector'
        : 'keyword';

    return {
      ...chunk,
      keywordScore: Number(keywordScore.toFixed(4)),
      vectorScore: Number(vectorScore.toFixed(4)),
      score: Number(hybridScore.toFixed(4)),
      matchType,
    };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
