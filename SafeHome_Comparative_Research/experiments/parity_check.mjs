// Parity check (READ-ONLY): the real SafeHome hybridSearch() running against MongoDB vs the in-memory
// reproduction in systems.mjs, on the chunks actually stored in the database. Also measures real
// end-to-end retrieval latency of the deployed functions (retrieveKnowledge + buildGraphContext).
// Usage (from SafeHome_Comparative_Research/): node experiments/parity_check.mjs
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
const require = createRequire(new URL('../../backend/package.json', import.meta.url));
require('dotenv').config({ path: new URL('../../backend/.env', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1') });
const mongoose = (await import('../../backend/node_modules/mongoose/index.js')).default;
const { hybridSearch } = await import('../../backend/src/ai/rag/vectorStore.js');
const { retrieveKnowledge } = await import('../../backend/src/ai/rag/retriever.js');
const { buildGraphContext } = await import('../../backend/src/ai/rag/graphContextBuilder.js');
const { createEmbedding } = await import('../../backend/src/ai/rag/embeddingService.js');
const { safehomeHybridSystem } = await import('./systems.mjs');
const KnowledgeChunk = (await import('../../backend/src/models/KnowledgeChunk.js')).default;

await mongoose.connect(process.env.MONGODB_URI, { dbName: 'safehome_rag' });
const stored = await KnowledgeChunk.find().lean();
const harness = await safehomeHybridSystem(stored.map((c) => ({ chunkId: c.chunkId, unitId: c.documentId, content: c.content })));
const questions = JSON.parse(readFileSync('dataset/questions.json', 'utf8'));

let identical = 0; const mismatches = [];
for (const q of questions) {
  const real = await hybridSearch({ query: q.question, queryVector: await createEmbedding(q.question), limit: 6 });
  const mine = await harness(q.question, 6);
  const a = real.map((r) => `${r.chunkId}:${r.score}`).join('|'); const b = mine.map((r) => `${r.c.chunkId}:${r.score}`).join('|');
  if (a === b) identical += 1; else mismatches.push({ qid: q.qid, real: a, harness: b });
}

// Real deployed retrieval latency (MongoDB Atlas round trips included), admin-scoped graph context.
const admin = { role: 'MAIN_ADMIN', userId: 'U001' };
const lat = [];
for (let rep = 0; rep < 3; rep += 1) for (const q of questions) {
  const s = performance.now();
  await Promise.all([retrieveKnowledge(q.question), buildGraphContext(admin)]);
  if (rep > 0) lat.push(performance.now() - s);
}
lat.sort((x, y) => x - y);
const pct = (p) => lat[Math.min(lat.length - 1, Math.ceil(p * lat.length) - 1)];
const out = {
  storedChunks: stored.length, questions: questions.length, identicalRankingsAndScores: identical, mismatches,
  deployedLatencyMs: { n: lat.length, mean: +(lat.reduce((s, x) => s + x, 0) / lat.length).toFixed(1), median: +pct(0.5).toFixed(1), p95: +pct(0.95).toFixed(1), min: +lat[0].toFixed(1), max: +lat[lat.length - 1].toFixed(1) },
  note: 'Latency = retrieveKnowledge(question) + buildGraphContext(admin) in parallel against MongoDB Atlas from this laptop; excludes the Claude generation call.',
};
writeFileSync('results/parity_and_deployed_latency.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify({ ...out, mismatches: out.mismatches.length }, null, 1));
await mongoose.disconnect();
