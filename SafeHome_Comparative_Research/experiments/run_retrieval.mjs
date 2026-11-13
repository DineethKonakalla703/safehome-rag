// Runs every retrieval system on the same 60 questions and records per-question metrics, latency,
// CPU time and memory. No LLM calls are made (zero API cost).
// Usage: node experiments/run_retrieval.mjs   (from SafeHome_Comparative_Research/)
import { readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { pipeline, env } from '@huggingface/transformers';
import { bm25System, chunkUnits, denseSystem, graphExpandedSystem, keywordSystem, safehomeDeployed, safehomeHybridSystem } from './systems.mjs';

const K = 5; const REPS = 5; const POOL = 40;
const units = JSON.parse(readFileSync('dataset/units.json', 'utf8'));
const graph = JSON.parse(readFileSync('dataset/graph.json', 'utf8'));
const questions = JSON.parse(readFileSync('dataset/questions.json', 'utf8'));
const unitText = new Map(units.map((u) => [u.unitId, u.text]));
const chunksAll = chunkUnits(units);
const chunksKb = chunkUnits(units.filter((u) => u.kind === 'document'));
const mem = () => { const m = process.memoryUsage(); return { rssMB: +(m.rss / 1048576).toFixed(1), heapMB: +(m.heapUsed / 1048576).toFixed(1) }; };

env.allowRemoteModels = true;
const t0 = performance.now();
const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'fp32' });
const modelLoadMs = performance.now() - t0;
const embed = async (texts) => { const out = await extractor(texts, { pooling: 'mean', normalize: true }); return out.tolist(); };

const build = async (name, fn) => { const m0 = mem(); const s = performance.now(); const sys = await fn(); return { name, sys, indexMs: +(performance.now() - s).toFixed(1), memBefore: m0, memAfter: mem() }; };
const built = {
  KEYWORD: await build('Keyword search (term overlap)', () => keywordSystem(chunksAll)),
  BM25: await build('BM25', () => bm25System(chunksAll)),
  DENSE: await build('Vector RAG (all-MiniLM-L6-v2)', () => denseSystem(chunksAll, embed)),
  SH_HYBRID: await build('SafeHome hybrid (same corpus)', () => safehomeHybridSystem(chunksAll)),
};
const shKb = await safehomeHybridSystem(chunksKb);
built.SH_DEPLOYED = { name: 'SafeHome as deployed (KB hybrid + graph context)', sys: safehomeDeployed(shKb, graph), indexMs: null };
built.PROTO_GRAPH = { name: 'Prototype: graph-expanded hybrid (not in SafeHome)', sys: graphExpandedSystem(built.SH_HYBRID.sys, graph), indexMs: null };

// ---- metrics ----
const dedupe = (rows) => [...new Set(rows.map((r) => r.c.unitId))];
function score(q, ranked, contextSet = null) {
  const gold = new Set(q.gold); const top = ranked.slice(0, K);
  const ctx = contextSet || top;
  const rel = top.map((u) => gold.has(u));
  const hits = rel.filter(Boolean).length;
  const firstRank = ranked.slice(0, 10).findIndex((u) => gold.has(u));
  const dcg = rel.reduce((s, r, i) => s + (r ? 1 / Math.log2(i + 2) : 0), 0);
  const idcg = [...Array(Math.min(K, gold.size))].reduce((s, _, i) => s + 1 / Math.log2(i + 2), 0);
  let apNum = 0; let seen = 0; rel.forEach((r, i) => { if (r) { seen += 1; apNum += seen / (i + 1); } });
  const ctxHits = ctx.filter((u) => gold.has(u)).length;
  const answerIn = q.answer ? ctx.some((u) => (unitText.get(u) || '').toLowerCase().includes(q.answer.toLowerCase())) : null;
  return {
    precisionAtK: hits / K, recallAtK: gold.size ? hits / gold.size : null, hitAtK: hits > 0 ? 1 : 0,
    completeAtK: gold.size && [...gold].every((g) => top.includes(g)) ? 1 : 0,
    mrr: firstRank >= 0 ? 1 / (firstRank + 1) : 0, ndcgAtK: idcg ? dcg / idcg : 0,
    contextPrecision: hits ? apNum / Math.min(hits, gold.size) : 0, // rank-aware (AP@K), non-LLM
    contextRecall: gold.size ? ctxHits / gold.size : null, contextSize: ctx.length,
    answerContainment: answerIn === null ? null : answerIn ? 1 : 0,
  };
}

const rows = []; const latency = {};
for (const [key, b] of Object.entries(built)) {
  latency[key] = [];
  // warm-up
  for (const q of questions.slice(0, 3)) await b.sys(q.question, POOL);
  const cpu0 = process.cpuUsage();
  for (let rep = 0; rep < REPS; rep += 1) {
    for (const q of questions) {
      const s = performance.now();
      const out = await b.sys(q.question, POOL);
      const ms = performance.now() - s;
      latency[key].push({ qid: q.qid, rep, ms });
      if (rep > 0) continue;
      let ranked; let ctx = null; let returned;
      if (key === 'SH_DEPLOYED') { ranked = [...out.ranked, ...out.graph]; ctx = ranked; returned = out.ranked.length; }
      else if (key === 'PROTO_GRAPH') { ranked = out.ordered; returned = out.ordered.length; }
      else { ranked = dedupe(out); returned = out.length; }
      rows.push({ system: key, qid: q.qid, type: q.type, returnedChunks: returned, top: ranked.slice(0, K), ...(q.type === 'U' ? { noResult: returned === 0 ? 1 : 0 } : score(q, ranked, ctx)) });
    }
  }
  const cpu = process.cpuUsage(cpu0);
  built[key].cpuMsPerQuery = +(((cpu.user + cpu.system) / 1000) / (REPS * questions.length)).toFixed(3);
}

const environment = {
  date: new Date().toISOString(), node: process.version, platform: `${os.type()} ${os.release()} ${os.arch()}`,
  cpu: os.cpus()[0]?.model, logicalCores: os.cpus().length, totalMemGB: +(os.totalmem() / 1073741824).toFixed(1),
  embeddingModel: 'Xenova/all-MiniLM-L6-v2 (ONNX, fp32, mean pooling, L2-normalised) via @huggingface/transformers 3.7.6',
  safehomeEmbedding: 'feature-hash-v1 (64-dim MD5 feature hashing) from backend/src/ai/rag/embeddingService.js',
  chunking: 'splitText(maxLength = 900) from backend/src/ai/rag/textExtractor.js, applied to every system',
  K, repetitions: REPS, candidatePool: POOL, modelLoadMs: +modelLoadMs.toFixed(0),
  units: units.length, chunksAll: chunksAll.length, chunksKb: chunksKb.length, questions: questions.length,
};
const systems = Object.fromEntries(Object.entries(built).map(([k, b]) => [k, { name: b.name, indexMs: b.indexMs, cpuMsPerQuery: b.cpuMsPerQuery, memBefore: b.memBefore, memAfter: b.memAfter }]));
writeFileSync('results/raw_per_question.json', JSON.stringify(rows, null, 1));
writeFileSync('results/latency_raw.json', JSON.stringify(latency));
writeFileSync('results/run_meta.json', JSON.stringify({ environment, systems }, null, 2));
console.log(JSON.stringify({ environment, systems }, null, 1));
