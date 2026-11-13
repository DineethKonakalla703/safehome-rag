// Retrieval systems compared under identical conditions (same units, chunking, questions, hardware).
// SafeHome components are IMPORTED from the application source, not re-implemented, except the
// in-memory form of hybridSearch(), whose scoring formula is reproduced exactly (see parity_check.mjs).
import { createEmbedding } from '../../backend/src/ai/rag/embeddingService.js';
import { splitText } from '../../backend/src/ai/rag/textExtractor.js';
import { cosineSimilarity } from '../../backend/src/ai/rag/vectorStore.js';

// Identical to `terms` in backend/src/ai/rag/vectorStore.js (not exported there).
export const terms = (value) => new Set(String(value || '').toLowerCase().match(/[a-z0-9]{3,}/g) || []);
const tokens = (value) => String(value || '').toLowerCase().match(/[a-z0-9]{3,}/g) || [];

export function chunkUnits(units) {
  const chunks = [];
  for (const u of units) splitText(u.text).forEach((content, i) => chunks.push({ chunkId: `${u.unitId}#${i}`, unitId: u.unitId, kind: u.kind, content }));
  return chunks;
}

// ---- 1. Keyword search: SafeHome keywordSearch() scoring (term-overlap ratio), i.e. DB-style keyword lookup ----
export function keywordSystem(chunks) {
  const idx = chunks.map((c) => ({ ...c, t: terms(c.content) }));
  return (q, limit) => {
    const qt = terms(q);
    return idx.map((c) => ({ c, score: qt.size ? [...qt].filter((x) => c.t.has(x)).length / qt.size : 0 }))
      .filter((r) => r.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
  };
}

// ---- 2. BM25 (Okapi, k1 = 1.2, b = 0.75) ----
export function bm25System(chunks, k1 = 1.2, b = 0.75) {
  const docs = chunks.map((c) => { const tf = new Map(); const tk = tokens(c.content); tk.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1)); return { c, tf, len: tk.length }; });
  const N = docs.length; const avg = docs.reduce((s, d) => s + d.len, 0) / N; const df = new Map();
  docs.forEach((d) => d.tf.forEach((_, t) => df.set(t, (df.get(t) || 0) + 1)));
  const idf = (t) => Math.log(1 + (N - (df.get(t) || 0) + 0.5) / ((df.get(t) || 0) + 0.5));
  return (q, limit) => {
    const qt = [...new Set(tokens(q))];
    return docs.map((d) => ({ c: d.c, score: qt.reduce((s, t) => { const f = d.tf.get(t) || 0; return s + (f ? idf(t) * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.len / avg)) : 0); }, 0) }))
      .filter((r) => r.score > 0).sort((a, b2) => b2.score - a.score).slice(0, limit);
  };
}

// ---- 3. Dense vector RAG: all-MiniLM-L6-v2 sentence embeddings, cosine, top-k (no threshold) ----
export async function denseSystem(chunks, embed) {
  const vecs = await embed(chunks.map((c) => c.content));
  const idx = chunks.map((c, i) => ({ c, v: vecs[i] }));
  return async (q, limit) => {
    const [qv] = await embed([q]);
    return idx.map((r) => ({ c: r.c, score: cosineSimilarity(qv, r.v) })).sort((a, b) => b.score - a.score).slice(0, limit);
  };
}

// ---- 4. SafeHome hybrid retrieval (production formula from hybridSearch) ----
// score = 0.45 * keywordOverlap + 0.55 * cosine(feature-hash-v1 embeddings) when cosine > 0, else keywordOverlap; keep score > 0.
export async function safehomeHybridSystem(chunks) {
  const idx = [];
  for (const c of chunks) idx.push({ c, t: terms(c.content), e: await createEmbedding(c.content) });
  return async (q, limit) => {
    const qt = terms(q); const qv = await createEmbedding(q).catch(() => []);
    return idx.map((r) => {
      const kw = qt.size ? [...qt].filter((x) => r.t.has(x)).length / qt.size : 0;
      const vs = qv.length && r.e.length ? cosineSimilarity(qv, r.e) : 0;
      return { c: r.c, score: Number((vs > 0 ? kw * 0.45 + vs * 0.55 : kw).toFixed(4)) };
    }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
  };
}

// ---- 5. SafeHome AS DEPLOYED: hybrid over knowledge documents only (limit 6) + graph context ----
// buildGraphContext() for an admin-scoped user with no ticketId returns the 5 most recent tickets plus
// their apartments/blocks/technicians. It is NOT conditioned on the question.
export function safehomeDeployed(hybridKb, graph) {
  const recent = [...graph.tickets].sort((a, b) => b.reportedOn.localeCompare(a.reportedOn) || b.ticketId.localeCompare(a.ticketId)).slice(0, 5);
  const ctxUnits = [...recent.map((t) => t.ticketId), ...new Set(recent.map((t) => `APT-${t.apartmentId}`)), ...new Set(recent.map((t) => t.technicianId))];
  return async (q) => {
    const kb = await hybridKb(q, 6);
    return { ranked: [...new Set(kb.map((r) => r.c.unitId))], graph: ctxUnits };
  };
}

// ---- 6. RESEARCH PROTOTYPE (not part of SafeHome): query-conditioned graph expansion + SafeHome hybrid ----
// Entity linking by rules (apartment ids, blocks, categories, relation words), 1-2 hop traversal over the
// CRM graph, linked evidence ranked first, hybrid results fill the rest. Written by the same author as the
// questions, so results are an optimistic upper bound for this design, not a fair competitor.
const CAT_WORDS = [['Water Leakage', /damp|seep|leak(age)? in the flat|ceiling|wet patch|leakage/], ['Plumbing', /plumb|tap|sink|flush|drain|pipe/], ['Electrical', /electric|mcb|socket|shock|power|light/], ['HVAC', /air.?condition|\bac\b|cooling|hvac/], ['Appliances', /appliance|geyser|washing machine|exhaust/], ['Carpentry', /door|carpent|hinge|wardrobe/]];
export function graphExpandedSystem(hybridAll, graph) {
  const aptById = new Map(graph.apartments.map((a) => [a.apartmentId, a]));
  const byRecent = (a, b) => b.reportedOn.localeCompare(a.reportedOn);
  return async (q, limit) => {
    const text = q.toLowerCase();
    const apts = [...q.matchAll(/\b([A-C]-[1-5]0[1-3])\b/g)].map((m) => m[1]).filter((x) => aptById.has(x));
    const blockM = q.match(/Block ([A-C])\b/);
    const cat = (CAT_WORDS.find(([, re]) => re.test(text)) || [])[0];
    const linked = [];
    for (const id of apts) {
      const apt = aptById.get(id);
      const target = /above|upstairs|ceiling/.test(text) && apt.above ? apt.above : id;
      linked.push(`APT-${id}`);
      const ts = graph.tickets.filter((t) => t.apartmentId === target && (!cat || t.category === cat)).sort(byRecent);
      linked.push(...ts.map((t) => t.ticketId));
      if (/recurring|escalat/.test(text)) linked.push('KDOC115');
    }
    if (!apts.length && blockM && cat && /most|which technician/.test(text)) {
      linked.push(...graph.tickets.filter((t) => t.block === blockM[1] && t.category === cat).sort(byRecent).map((t) => t.ticketId));
    }
    const hy = await hybridAll(q, 40);
    const ordered = [...new Set([...linked, ...hy.map((r) => r.c.unitId)])];
    return { ordered: ordered.slice(0, limit), linkedCount: new Set(linked).size };
  };
}
