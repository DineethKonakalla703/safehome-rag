// Statistics over results/raw_per_question.json + latency_raw.json. Deterministic (seeded PRNG).
// Usage (from SafeHome_Comparative_Research/): node experiments/analyze.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const rows = JSON.parse(readFileSync('results/raw_per_question.json', 'utf8'));
const latency = JSON.parse(readFileSync('results/latency_raw.json', 'utf8'));
const meta = JSON.parse(readFileSync('results/run_meta.json', 'utf8'));
const deployed = JSON.parse(readFileSync('results/parity_and_deployed_latency.json', 'utf8'));

let seed = 20261114; const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const B = 10000; const PERM = 10000;
const SYSTEMS = ['KEYWORD', 'BM25', 'DENSE', 'SH_HYBRID', 'SH_DEPLOYED', 'PROTO_GRAPH'];
const METRICS = ['precisionAtK', 'recallAtK', 'hitAtK', 'completeAtK', 'mrr', 'ndcgAtK', 'contextPrecision', 'contextRecall', 'answerContainment'];
const TYPES = ['F', 'S', 'H', 'M', 'G'];

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const sd = (a) => { if (a.length < 2) return 0; const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const pctl = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.ceil(p * s.length) - 1))]; };
function bootCI(a) { const n = a.length; const ms = []; for (let b = 0; b < B; b += 1) { let s = 0; for (let i = 0; i < n; i += 1) s += a[Math.floor(rnd() * n)]; ms.push(s / n); } ms.sort((x, y) => x - y); return [ms[Math.floor(0.025 * B)], ms[Math.floor(0.975 * B) - 1]]; }
const r4 = (x) => (x === null || Number.isNaN(x) ? null : +x.toFixed(4));
const describe = (a) => { const v = a.filter((x) => x !== null && x !== undefined); if (!v.length) return null; const [lo, hi] = bootCI(v); return { n: v.length, mean: r4(mean(v)), median: r4(median(v)), sd: r4(sd(v)), ci95: [r4(lo), r4(hi)] }; };

const get = (sys, metric, filter = () => true) => rows.filter((r) => r.system === sys && r.type !== 'U' && filter(r)).sort((a, b) => a.qid.localeCompare(b.qid)).map((r) => r[metric]);

// ---- 1. Descriptive stats: overall (answerable, n = 50) and per type ----
const descriptive = {};
for (const s of SYSTEMS) {
  descriptive[s] = { overall: {}, byType: {} };
  for (const m of METRICS) descriptive[s].overall[m] = describe(get(s, m));
  for (const t of TYPES) { descriptive[s].byType[t] = {}; for (const m of METRICS) descriptive[s].byType[t][m] = describe(get(s, m, (r) => r.type === t)); }
}

// ---- 2. Unanswerable questions: no-result rate ----
const unanswerable = Object.fromEntries(SYSTEMS.map((s) => { const u = rows.filter((r) => r.system === s && r.type === 'U'); return [s, { n: u.length, noResultRate: r4(mean(u.map((r) => r.noResult))) }]; }));

// ---- 3. Latency (in-process, repetitions 1..4 used; rep 0 included as well since warm-up was separate) ----
const latencyStats = Object.fromEntries(SYSTEMS.map((s) => { const v = latency[s].map((x) => x.ms); return [s, { n: v.length, mean: r4(mean(v)), median: r4(median(v)), sd: r4(sd(v)), p95: r4(pctl(v, 0.95)), min: r4(Math.min(...v)), max: r4(Math.max(...v)), ci95Mean: bootCI(v).map(r4) }]; }));

// ---- 4. Paired sign-flip permutation tests + Holm–Bonferroni ----
function permTest(a, b) {
  const d = a.map((x, i) => x - b[i]); const n = d.length; const obs = Math.abs(mean(d)); let ext = 0;
  for (let p = 0; p < PERM; p += 1) { let s = 0; for (let i = 0; i < n; i += 1) s += rnd() < 0.5 ? d[i] : -d[i]; if (Math.abs(s / n) >= obs - 1e-12) ext += 1; }
  return { meanDiff: mean(d), p: (ext + 1) / (PERM + 1), nonZeroPairs: d.filter((x) => x !== 0).length, n };
}
const COMPARISONS = [
  ['SH_HYBRID', 'KEYWORD', null], ['SH_HYBRID', 'BM25', null], ['SH_HYBRID', 'DENSE', null],
  ['SH_DEPLOYED', 'SH_HYBRID', null], ['DENSE', 'BM25', null],
  ['PROTO_GRAPH', 'SH_HYBRID', 'G'], ['PROTO_GRAPH', 'DENSE', 'G'], ['PROTO_GRAPH', 'SH_HYBRID', 'H'], ['PROTO_GRAPH', 'DENSE', 'H'],
];
const TEST_METRICS = ['ndcgAtK', 'recallAtK', 'mrr'];
const tests = [];
for (const [a, b, type] of COMPARISONS) for (const m of TEST_METRICS) {
  const f = type ? (r) => r.type === type : () => true;
  const xa = get(a, m, f); const xb = get(b, m, f);
  const t = permTest(xa, xb); const ma = mean(xa); const mb = mean(xb);
  tests.push({ a, b, subset: type || 'answerable (F,S,H,M,G)', metric: m, n: t.n, meanA: r4(ma), meanB: r4(mb), absoluteDiff: r4(t.meanDiff), relativeImprovementPct: mb ? r4(((ma - mb) / mb) * 100) : null, nonZeroPairs: t.nonZeroPairs, pRaw: r4(t.p) });
}
// Holm over the full family of tests
const order = tests.map((t, i) => [t.pRaw, i]).sort((x, y) => x[0] - y[0]); let running = 0;
order.forEach(([p, i], k) => { running = Math.max(running, Math.min(1, (tests.length - k) * p)); tests[i].pHolm = r4(running); tests[i].significantAt05 = running < 0.05; });

// ---- 5. Latency reduction vs deployed, and vs DENSE ----
const reduction = (base, x) => r4(((base - x) / base) * 100);
const latencyComparisons = {
  formula: 'reduction % = (baseline − system) / baseline × 100 on mean latency; improvement % = (system − baseline) / baseline × 100 on a quality metric',
  SH_HYBRID_vs_DENSE_meanLatencyReductionPct: reduction(latencyStats.DENSE.mean, latencyStats.SH_HYBRID.mean),
  BM25_vs_DENSE_meanLatencyReductionPct: reduction(latencyStats.DENSE.mean, latencyStats.BM25.mean),
};

const summary = { generated: new Date().toISOString(), bootstrapResamples: B, permutations: PERM, prngSeed: 20261114, environment: meta.environment, systems: meta.systems, deployed, descriptive, unanswerable, latencyStats, tests, latencyComparisons };
writeFileSync('results/summary.json', JSON.stringify(summary, null, 1));

// ---- 6. COMPARISON_DATA.csv (own measurements only; external results are in the markdown tables) ----
const esc = (v) => (v === null || v === undefined ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const csv = [['source', 'system', 'subset', 'metric', 'n', 'mean', 'median', 'sd', 'ci95_low', 'ci95_high', 'unit', 'dataset', 'conditions'].join(',')];
const cond = 'same corpus, chunking, questions and hardware; measured 2026-11-13/14';
for (const s of SYSTEMS) {
  for (const m of METRICS) { const d = descriptive[s].overall[m]; if (d) csv.push(['own-experiment', s, 'answerable', m, d.n, d.mean, d.median, d.sd, d.ci95[0], d.ci95[1], 'ratio', 'SafeHome maintenance QA v1 (60 q)', cond].map(esc).join(',')); }
  for (const t of TYPES) for (const m of ['recallAtK', 'ndcgAtK', 'mrr', 'completeAtK']) { const d = descriptive[s].byType[t][m]; if (d) csv.push(['own-experiment', s, `type ${t}`, m, d.n, d.mean, d.median, d.sd, d.ci95[0], d.ci95[1], 'ratio', 'SafeHome maintenance QA v1 (60 q)', cond].map(esc).join(',')); }
  csv.push(['own-experiment', s, 'unanswerable', 'noResultRate', unanswerable[s].n, unanswerable[s].noResultRate, '', '', '', '', 'ratio', 'SafeHome maintenance QA v1 (60 q)', cond].map(esc).join(','));
  const l = latencyStats[s]; csv.push(['own-experiment', s, 'all 60 q × 5 reps', 'latencyMs', l.n, l.mean, l.median, l.sd, l.ci95Mean[0], l.ci95Mean[1], 'ms', 'SafeHome maintenance QA v1 (60 q)', `${cond}; in-process, p95=${l.p95}`].map(esc).join(','));
  csv.push(['own-experiment', s, 'all', 'cpuMsPerQuery', REPS_N(), meta.systems[s].cpuMsPerQuery, '', '', '', '', 'ms', 'SafeHome maintenance QA v1 (60 q)', `${cond}; process.cpuUsage`].map(esc).join(','));
  if (meta.systems[s].indexMs !== null && meta.systems[s].indexMs !== undefined) csv.push(['own-experiment', s, 'all', 'indexBuildMs', 1, meta.systems[s].indexMs, '', '', '', '', 'ms', 'SafeHome maintenance QA v1 (162 units)', cond].map(esc).join(','));
}
const dl = deployed.deployedLatencyMs;
csv.push(['own-experiment', 'SafeHome deployed functions (MongoDB Atlas)', 'all 60 q × 2 reps', 'latencyMs', dl.n, dl.mean, dl.median, '', '', '', 'ms', 'SafeHome maintenance QA v1 (60 q) against live seeded DB', `retrieveKnowledge + buildGraphContext, network included, p95=${dl.p95}`].map(esc).join(','));
for (const t of tests) csv.push(['own-experiment-test', `${t.a} vs ${t.b}`, t.subset, `${t.metric} diff`, t.n, t.absoluteDiff, '', '', '', '', 'ratio', 'SafeHome maintenance QA v1', `paired permutation p=${t.pRaw}, Holm p=${t.pHolm}, rel. change ${t.relativeImprovementPct}%`].map(esc).join(','));
function REPS_N() { return meta.environment.repetitions * meta.environment.questions; }
writeFileSync('COMPARISON_DATA.csv', `${csv.join('\n')}\n`);

// ---- console digest ----
const short = (s, m) => descriptive[s].overall[m]?.mean;
console.log('system      P@5   R@5   Hit@5 Cmp@5 MRR   nDCG  CtxP  CtxR  Ans   U-noRes lat(ms)');
for (const s of SYSTEMS) console.log(s.padEnd(11), ...METRICS.map((m) => String(short(s, m)?.toFixed(3)).padStart(5)), String(unanswerable[s].noResultRate).padStart(6), String(latencyStats[s].mean.toFixed(3)).padStart(8));
console.log('\nnDCG@5 by type'); for (const s of SYSTEMS) console.log(s.padEnd(11), TYPES.map((t) => `${t}:${descriptive[s].byType[t].ndcgAtK.mean.toFixed(3)}`).join(' '));
console.log('\nR@5 by type'); for (const s of SYSTEMS) console.log(s.padEnd(11), TYPES.map((t) => `${t}:${descriptive[s].byType[t].recallAtK.mean.toFixed(3)}`).join(' '));
console.log('\ntests'); for (const t of tests) console.log(`${t.a} vs ${t.b} [${t.subset[0]}] ${t.metric}: ${t.meanA} vs ${t.meanB} diff ${t.absoluteDiff} p=${t.pRaw} holm=${t.pHolm}`);
