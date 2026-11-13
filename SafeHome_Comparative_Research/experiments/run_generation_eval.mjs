// READY-TO-RUN, NOT EXECUTED in this study (user chose a zero-cost, retrieval-only evaluation).
// Generates answers with Claude from each system's top-5 retrieved context, then scores them with an
// LLM judge: faithfulness, answer relevancy, answer correctness (vs. gold answer) and hallucination
// (on unanswerable questions: did the model answer instead of saying the information is unavailable?).
//
// Cost guard: does nothing billable unless --confirm is passed. `--dry-run` prints the call count.
// Usage (from SafeHome_Comparative_Research/):
//   node experiments/run_generation_eval.mjs --dry-run
//   node experiments/run_generation_eval.mjs --confirm [--systems DENSE,SH_HYBRID,SH_DEPLOYED]
// Needs ANTHROPIC_API_KEY in backend/.env. Generator = CLAUDE_MODEL from backend/.env (the model SafeHome
// uses), so every system is compared with the same generator. Judge = JUDGE_MODEL (default claude-opus-5-5).
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const require = createRequire(new URL('../../backend/package.json', import.meta.url));
require('dotenv').config({ path: new URL('../../backend/.env', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1') });
const Anthropic = (await import('../../backend/node_modules/@anthropic-ai/sdk/index.mjs')).default;

const args = process.argv.slice(2);
const SYSTEMS = (args.find((a) => a.startsWith('--systems='))?.split('=')[1] || 'KEYWORD,BM25,DENSE,SH_HYBRID,SH_DEPLOYED,PROTO_GRAPH').split(',');
const GEN_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
const JUDGE_MODEL = process.env.JUDGE_MODEL || 'claude-opus-5-5';
const units = new Map(JSON.parse(readFileSync('dataset/units.json', 'utf8')).map((u) => [u.unitId, u.text]));
const questions = JSON.parse(readFileSync('dataset/questions.json', 'utf8'));
const rows = JSON.parse(readFileSync('results/raw_per_question.json', 'utf8')).filter((r) => SYSTEMS.includes(r.system));

const calls = rows.length * 2;
console.log(`${rows.length} (system, question) pairs → ${calls} API calls (generator ${GEN_MODEL}, judge ${JUDGE_MODEL}).`);
if (args.includes('--dry-run') || !args.includes('--confirm')) { console.log('No calls made. Pass --confirm to run (billable).'); process.exit(0); }
if (!process.env.ANTHROPIC_API_KEY) { console.error('ANTHROPIC_API_KEY missing in backend/.env'); process.exit(1); }

const client = new Anthropic();
const text = (r) => r.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
const GEN_SYSTEM = 'You are a residential-society maintenance assistant. Answer ONLY from the provided context. If the context does not contain the answer, reply exactly: "The available records do not contain this information." Be concise.';
const JUDGE_SYSTEM = `You are a strict evaluator of retrieval-augmented answers. Return JSON only:
{"faithfulness":0-1,"answerRelevancy":0-1,"answerCorrectness":0-1|null,"hallucinated":true|false,"rationale":"<=40 words"}
- faithfulness: fraction of claims in ANSWER supported by CONTEXT.
- answerRelevancy: how directly ANSWER addresses QUESTION.
- answerCorrectness: 1 if ANSWER agrees with GOLD (semantic match), 0 if not, null when GOLD is null.
- hallucinated: GOLD is null (unanswerable) and ANSWER asserts a specific answer instead of declining; or ANSWER states facts absent from CONTEXT.`;

const out = [];
for (const r of rows) {
  const q = questions.find((x) => x.qid === r.qid);
  const context = r.top.map((id, i) => `[${i + 1}] (${id}) ${units.get(id) || ''}`).join('\n\n');
  const gen = await client.messages.create({ model: GEN_MODEL, max_tokens: 400, system: GEN_SYSTEM, messages: [{ role: 'user', content: `CONTEXT:\n${context}\n\nQUESTION: ${q.question}` }] });
  const answer = text(gen);
  const judge = await client.messages.create({ model: JUDGE_MODEL, max_tokens: 400, system: JUDGE_SYSTEM, messages: [{ role: 'user', content: `QUESTION: ${q.question}\nGOLD: ${q.answer ?? 'null'}\nCONTEXT:\n${context}\n\nANSWER: ${answer}` }] });
  let scores = null; try { scores = JSON.parse(text(judge).replace(/^```(json)?|```$/g, '').trim()); } catch { scores = { parseError: text(judge) }; }
  out.push({ system: r.system, qid: r.qid, type: r.type, answer, ...scores, usage: { gen: gen.usage, judge: judge.usage } });
  process.stdout.write('.');
}
writeFileSync('results/generation_eval_raw.json', JSON.stringify({ generator: GEN_MODEL, judge: JUDGE_MODEL, date: new Date().toISOString(), rows: out }, null, 1));
console.log('\nWrote results/generation_eval_raw.json — aggregate it with the same bootstrap/permutation code as analyze.mjs.');
