// Static SVG charts from results/summary.json (own measurements only). Usage: node experiments/make_charts.mjs
import { readFileSync, writeFileSync } from 'node:fs';
const S = JSON.parse(readFileSync('results/summary.json', 'utf8'));
const SYS = ['KEYWORD', 'BM25', 'DENSE', 'SH_HYBRID', 'SH_DEPLOYED', 'PROTO_GRAPH'];
const LABEL = { KEYWORD: 'Keyword', BM25: 'BM25', DENSE: 'Dense (MiniLM)', SH_HYBRID: 'SafeHome hybrid', SH_DEPLOYED: 'SafeHome deployed', PROTO_GRAPH: 'Graph prototype*' };
const C = { s1: '#2a78d6', s2: '#eb6834', s3: '#1baf7a', ink: '#0b0b0b', ink2: '#52514e', grid: '#e4e3df', bg: '#fcfcfb' };
const FONT = 'font-family="Inter, Segoe UI, Arial, sans-serif"';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const bar = (x, y, w, h, fill, tip) => `<path d="M${x},${y + h} V${y + Math.min(4, h)} Q${x},${y} ${x + Math.min(4, w / 2)},${y} H${x + w - Math.min(4, w / 2)} Q${x + w},${y} ${x + w},${y + Math.min(4, h)} V${y + h} Z" fill="${fill}"><title>${esc(tip)}</title></path>`;
const svg = (w, h, body, title, note) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(title)}"><rect width="${w}" height="${h}" fill="${C.bg}"/><text x="24" y="30" ${FONT} font-size="16" font-weight="600" fill="${C.ink}">${esc(title)}</text>${body}<text x="24" y="${h - 12}" ${FONT} font-size="11" fill="${C.ink2}">${esc(note)}</text></svg>\n`;

// ---- Chart 1: grouped bars, 3 metrics × 6 systems, with 95% bootstrap CI whiskers ----
{
  const M = [['ndcgAtK', 'nDCG@5', C.s1], ['recallAtK', 'Recall@5', C.s2], ['mrr', 'MRR', C.s3]];
  const W = 900; const H = 440; const L = 60; const T = 80; const PH = 260; const PW = W - L - 30; const g = PW / SYS.length; const bw = 30; const gap = 2;
  let b = '';
  M.forEach(([, name, col], i) => { const lx = L + i * 120; b += `<rect x="${lx}" y="46" width="12" height="12" rx="2" fill="${col}"/><text x="${lx + 18}" y="57" ${FONT} font-size="12" fill="${C.ink2}">${name}</text>`; });
  for (let v = 0; v <= 1.0001; v += 0.25) { const y = T + PH - v * PH; b += `<line x1="${L}" x2="${W - 30}" y1="${y}" y2="${y}" stroke="${C.grid}" stroke-width="1"/><text x="${L - 8}" y="${y + 4}" text-anchor="end" ${FONT} font-size="11" fill="${C.ink2}">${v.toFixed(2)}</text>`; }
  SYS.forEach((s, si) => {
    const gx = L + si * g + (g - (bw * 3 + gap * 2)) / 2;
    M.forEach(([m, name, col], mi) => {
      const d = S.descriptive[s].overall[m]; const x = gx + mi * (bw + gap); const h = d.mean * PH;
      b += bar(x, T + PH - h, bw, h, col, `${LABEL[s]} — ${name}: ${d.mean.toFixed(3)} (95% CI ${d.ci95[0].toFixed(2)}–${d.ci95[1].toFixed(2)}, n=${d.n})`);
      const y0 = T + PH - d.ci95[0] * PH; const y1 = T + PH - d.ci95[1] * PH; const cx = x + bw / 2;
      b += `<line x1="${cx}" x2="${cx}" y1="${y0}" y2="${y1}" stroke="${C.ink}" stroke-width="1.2"/><line x1="${cx - 4}" x2="${cx + 4}" y1="${y0}" y2="${y0}" stroke="${C.ink}" stroke-width="1.2"/><line x1="${cx - 4}" x2="${cx + 4}" y1="${y1}" y2="${y1}" stroke="${C.ink}" stroke-width="1.2"/>`;
    });
    b += `<text x="${L + si * g + g / 2}" y="${T + PH + 20}" text-anchor="middle" ${FONT} font-size="12" fill="${C.ink}">${esc(LABEL[s])}</text>`;
  });
  b += `<line x1="${L}" x2="${W - 30}" y1="${T + PH}" y2="${T + PH}" stroke="${C.ink2}" stroke-width="1"/>`;
  writeFileSync('charts/fig1_retrieval_quality_overall.svg', svg(W, H, b, 'Retrieval quality on 50 answerable questions (mean, 95% bootstrap CI)', '*Rule-based research prototype, not part of SafeHome; written by the question author, so an optimistic upper bound. Own experiment, 2026-11-13.'));
}

// ---- Chart 2: heatmap nDCG@5 by question type (sequential single hue, values labeled) ----
{
  const TYPES = [['F', 'Factual'], ['S', 'Paraphrase'], ['H', 'Historical'], ['M', 'Multi-doc'], ['G', 'Multi-hop']];
  const W = 760; const H = 390; const L = 170; const T = 80; const cw = 110; const ch = 40;
  const ramp = (v) => { const a = [252, 252, 251]; const z = [16, 77, 150]; return `rgb(${a.map((x, i) => Math.round(x + (z[i] - x) * v)).join(',')})`; };
  let b = '';
  TYPES.forEach(([, n], i) => { b += `<text x="${L + i * cw + cw / 2}" y="${T - 10}" text-anchor="middle" ${FONT} font-size="12" fill="${C.ink}">${n}</text>`; });
  SYS.forEach((s, si) => {
    b += `<text x="${L - 10}" y="${T + si * ch + ch / 2 + 4}" text-anchor="end" ${FONT} font-size="12" fill="${C.ink}">${esc(LABEL[s])}</text>`;
    TYPES.forEach(([t, n], ti) => {
      const v = S.descriptive[s].byType[t].ndcgAtK.mean; const x = L + ti * cw; const y = T + si * ch;
      b += `<rect x="${x + 1}" y="${y + 1}" width="${cw - 2}" height="${ch - 2}" rx="3" fill="${ramp(v)}"><title>${esc(`${LABEL[s]} — ${n}: nDCG@5 ${v.toFixed(3)} (n=10)`)}</title></rect><text x="${x + cw / 2}" y="${y + ch / 2 + 4}" text-anchor="middle" ${FONT} font-size="12" fill="${v > 0.55 ? '#ffffff' : C.ink}">${v.toFixed(2)}</text>`;
    });
  });
  writeFileSync('charts/fig2_ndcg_by_question_type.svg', svg(W, H, b, 'nDCG@5 by question type (10 questions per cell)', '*Rule-based research prototype, not part of SafeHome. Small n per cell: treat differences as indicative. Own experiment, 2026-11-13.'));
}

// ---- Chart 3: latency, horizontal bars on log10 axis (single series) ----
{
  const rowsL = [...SYS.map((s) => [LABEL[s] + ' (in-process)', S.latencyStats[s].mean, S.latencyStats[s].p95]), ['SafeHome deployed (MongoDB Atlas)', S.deployed.deployedLatencyMs.mean, S.deployed.deployedLatencyMs.p95]];
  const W = 860; const H = 400; const L = 270; const T = 70; const rh = 38; const PW = W - L - 60; const lo = -1; const hi = 2;
  const xs = (v) => L + ((Math.log10(v) - lo) / (hi - lo)) * PW;
  let b = '';
  [0.1, 1, 10, 100].forEach((v) => { b += `<line x1="${xs(v)}" x2="${xs(v)}" y1="${T - 6}" y2="${T + rowsL.length * rh}" stroke="${C.grid}"/><text x="${xs(v)}" y="${T + rowsL.length * rh + 18}" text-anchor="middle" ${FONT} font-size="11" fill="${C.ink2}">${v} ms</text>`; });
  rowsL.forEach(([n, m, p95], i) => {
    const y = T + i * rh + 8; const w = xs(m) - L;
    b += `<text x="${L - 10}" y="${y + 15}" text-anchor="end" ${FONT} font-size="12" fill="${C.ink}">${esc(n)}</text>`;
    b += `<path d="M${L},${y} H${L + w - 4} Q${L + w},${y} ${L + w},${y + 4} V${y + 18} Q${L + w},${y + 22} ${L + w - 4},${y + 22} H${L} Z" fill="${C.s1}"><title>${esc(`${n}: mean ${m.toFixed(3)} ms, p95 ${p95.toFixed(3)} ms`)}</title></path>`;
    b += `<text x="${L + w + 6}" y="${y + 15}" ${FONT} font-size="11" fill="${C.ink2}">${m < 1 ? m.toFixed(2) : m.toFixed(1)} ms</text>`;
  });
  writeFileSync('charts/fig3_query_latency.svg', svg(W, H, b, 'Mean retrieval latency per query (log scale; excludes LLM generation)', 'In-process: 60 questions × 5 reps, same laptop. Atlas row: real deployed functions incl. network, 60 × 2 reps. Not comparable to published end-to-end times.'));
}
console.log('charts written');
