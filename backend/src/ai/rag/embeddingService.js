import crypto from 'node:crypto';

function generateFeatureEmbedding(text, dimensions = 64) {
  const vector = new Array(dimensions).fill(0);
  const words = String(text || '').toLowerCase().match(/[a-z0-9]{3,}/g) || [];
  if (!words.length) return vector;

  for (const word of words) {
    const hash = crypto.createHash('md5').update(word).digest();
    const index = hash.readUInt16BE(0) % dimensions;
    const sign = hash.readUInt8(2) % 2 === 0 ? 1 : -1;
    vector[index] += sign;
  }

  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return norm > 0 ? vector.map((val) => Number((val / norm).toFixed(6))) : vector;
}

export async function createEmbedding(text) {
  const provider = process.env.EMBEDDING_PROVIDER || 'local';
  const enabled = process.env.VECTOR_SEARCH_ENABLED === 'true';

  if (!enabled && provider === 'keyword-fallback') {
    return [];
  }

  if (provider === 'local' || provider === 'feature-hash-v1') {
    return generateFeatureEmbedding(text);
  }

  return [];
}

export const embeddingStatus = () => ({
  provider: process.env.EMBEDDING_PROVIDER || 'keyword-fallback',
  model: process.env.EMBEDDING_MODEL || 'feature-hash-v1',
  enabled: process.env.VECTOR_SEARCH_ENABLED === 'true',
  vectorIndex: process.env.MONGODB_VECTOR_INDEX_NAME || 'knowledge_vector_index',
  message: process.env.VECTOR_SEARCH_ENABLED === 'true'
    ? 'Atlas Vector Search enabled.'
    : 'Keyword fallback search is active.',
});
