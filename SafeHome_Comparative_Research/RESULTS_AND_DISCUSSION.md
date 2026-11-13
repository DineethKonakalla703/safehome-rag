# Results and Discussion — Comparative Benchmarking of SafeHome-RAG

## 1. Summary of findings

1. **Features.** SafeHome-RAG documents a broad feature set: resident, ticket and work-order management, gated-community modules, a Claude copilot with RAG, and a mobile app. In **kind**, this is comparable to Buildium and AppFolio. Both of those now document agentic maintenance AI as well (AppFolio Realm-X, 2025–2026; Buildium Lumina AI Workforce). What distinguishes SafeHome is the **combination** of features, not any single capability.
2. **Knowledge retrieval.** On a 60-question maintenance benchmark run under identical conditions, **SafeHome's production hybrid retriever did not outperform** traditional keyword search or BM25.
   - It scored lower: nDCG@5 0.435 vs. 0.550 and 0.539. These gaps are not significant after Holm correction.
   - It was **significantly worse than a conventional dense Vector RAG baseline** (nDCG@5 0.701; Holm p = 0.003).
   - The cause is the 64-dimensional hashing "embedding", which carries no semantic information.
3. **Graph reasoning.** The deployed graph context is not conditioned on the question. On multi-hop questions it scored worst of all systems (Recall@5 0.045).
   - A query-conditioned graph-expansion prototype reached Recall@5 0.98 on the same questions (Holm p ≈ 0.03 vs. SafeHome hybrid).
   - That prototype is not part of SafeHome, and its linking rules were authored alongside the questions, so the gain is an **optimistic upper bound**.
4. **Efficiency.** SafeHome's retrieval is extremely cheap in-process: 0.51 ms per query, no model and no LLM tokens. That is 98.1 % lower latency than the dense baseline, which needs 27.3 ms and about 660 MB of extra memory.
   - The deployed path is dominated by database round trips (66.6 ms mean, 74.3 ms p95 against MongoDB Atlas).
   - Published LLM-built GraphRAG systems cost 9–116 M indexing tokens on a 11.6k-passage corpus [6]. A schema-based graph avoids that cost entirely.
5. **Generation quality** (faithfulness, answer relevancy, correctness, hallucination) was **not measured**. A ready-to-run script is provided.

## 2. Research-paper tables (index)

| Table | Content | Location |
|---|---|---|
| Table 1 | Feature comparison: SafeHome-RAG vs. Buildium, AppFolio, Yardi Breeze | `FEATURE_COMPARISON.md` |
| Table 2 | RAG system comparison | `RAG_SYSTEM_COMPARISON.md` |
| Table 3 | GraphRAG system comparison | `GRAPHRAG_SYSTEM_COMPARISON.md` |
| Table 4 | Retrieval performance (comparable and non-comparable parts) | `QUANTITATIVE_METRICS_COMPARISON.md` |
| Table 5 | Generation quality (not measured; published context) | `QUANTITATIVE_METRICS_COMPARISON.md` |
| Table 6 | Computational performance | `QUANTITATIVE_METRICS_COMPARISON.md` |
| Table 7 | Maintenance-specific evaluation by question type | `MAINTENANCE_DOMAIN_EVALUATION.md` |
| Statistics | CIs, permutation tests, Holm correction | `STATISTICAL_ANALYSIS.md` |
| Figure 1 | Overall retrieval quality with 95 % CIs | `charts/fig1_retrieval_quality_overall.svg` |
| Figure 2 | nDCG@5 heat-map by question type | `charts/fig2_ndcg_by_question_type.svg` |
| Figure 3 | Query latency (log scale) | `charts/fig3_query_latency.svg` |

## 3. Discussion (Phase 9)

### 3.1 What advantages does SafeHome-RAG demonstrate?

- **Breadth of integrated features for gated communities.** Among the three required comparators, only AppFolio's HOA product documents some community modules. SafeHome-RAG has visitors and gate passes, parcels, polls, a forum and SOS in the same system as maintenance and AI (Table 1).
- **Retrieval cost.**
  - Its retriever needs no model download, no GPU and no LLM tokens to index.
  - Measured latency is sub-millisecond in-process, and memory overhead is negligible (Table 6).
  - Graph context comes from the existing CRM schema at near-zero construction cost, where published GraphRAG systems need tens of millions of tokens (Table 6, Part B).
- **Transparency and reproducibility.** The production retriever reproduced exactly in a harness (60/60 parity). Every number in this study can be regenerated from scripts in this folder.

It **does not** demonstrate better retrieval quality than standard baselines (§3.4).

### 3.2 Which features are common across existing systems?

All reviewed products document four things: resident records, maintenance request intake (usually with photos), work-order tracking, and technician or vendor assignment. Most also document text or email notifications, some analytics, and resident mobile apps. Generative-AI triage and natural-language Q&A became common in 2025–2026 among the larger US vendors: AppFolio and Buildium document them, while Yardi Breeze documents only invoice AI and a leasing chatbot.

### 3.3 Which capabilities distinguish SafeHome-RAG?

1. Indian gated-community operations sit in the same data model as maintenance tickets. MyGate and ADDA document these modules but not knowledge retrieval (Review §5).
2. A RAG pipeline over society policies sits alongside CRM context in one assistant. AppFolio documents comparable natural-language Q&A, so this is not unique among commercial products.
3. The implementation is open and inspectable, with a measured evaluation. No commercial vendor publishes retrieval or answer-quality metrics, so **no quality comparison with commercial AI is possible** from public evidence.

### 3.4 Does RAG improve knowledge retrieval over traditional database search?

**It depends on the retriever, and SafeHome's current one does not.**

- **A learned dense embedding helps.**
  - Dense Vector RAG beat BM25 significantly on nDCG@5 (+0.163, Holm p = 0.036) and MRR (+0.187, p = 0.010).
  - It beat keyword search on every metric, by the largest margin on paraphrased questions (S: 0.863 vs. 0.600).
  - This matches the general expectation that semantic retrieval helps when the wording differs from the documents.
- **SafeHome's hybrid of keywords plus hashed vectors does not help.**
  - It scored 0.115 nDCG@5 *below* keyword search alone, which is the same scorer without the hashed-vector term (not significant after correction).
  - Feature hashing preserves only exact token identity, which the keyword term already captures, and adds collision noise.
- **Where traditional search is sufficient.** Factual questions that reuse document vocabulary (type F) score 0.90 nDCG@5 with keyword search and BM25.

### 3.5 Does GraphRAG improve multi-hop maintenance reasoning over Vector RAG?

- **SafeHome's deployed graph context does not.** It ignores the question, so on multi-hop questions it did worse than dense retrieval (Recall@5 0.045 vs. 0.31).
- **A query-conditioned graph does.** In the prototype, Recall@5 on G questions rose from 0.31 (dense) to 0.98 (Holm p = 0.036). On history questions, Recall@5 went from 0.75 to 1.00, though that difference is not significant.
- **This is consistent with published evidence.** Han et al. [8] and GraphRAG-Bench [9] report that graph methods help on multi-hop and complex reasoning but not on single-hop lookup. In our data the prototype's gain is likewise confined to H and G questions; on F, S and M questions it equals the hybrid.
- **Caveat.** The prototype's rules were written with knowledge of the question templates. The size of the gain will shrink on real resident phrasing, and the authors should present it as feasibility evidence, not as a performance claim.

### 3.6 What overhead does graph-based retrieval introduce?

- **Here, almost none.** The prototype took 0.47 ms per query vs. 0.51 ms for the hybrid. The graph is the existing relational schema, and linking is rule-based.
- **Published LLM-built graphs are expensive** (different datasets, not comparable):
  - MS GraphRAG: 115.5 M tokens and 277 min to index MuSiQue [6];
  - query-time prompts of about 100k tokens (LightRAG) and 331k (MS-GraphRAG global), vs. 879 for vanilla RAG [9].
- **Overhead will grow** if SafeHome adopts LLM-based entity linking for robustness. Each query would then need an extra LLM call, which was not measured.

### 3.7 Limitations

1. **Synthetic data.**
   - 22 of 29 documents and all tickets, apartments and technicians are synthetic. Only the 7 seeded KB documents are real SafeHome content.
   - The ground truth was written by an AI assistant, with automated checks only. **It has not been human-verified.**
2. **Small sample.** 60 questions (10 per type) mean wide CIs and limited power.
3. **Optimistic prototype.** Its rules and the questions share an author.
4. **Retrieval only.** No generation, faithfulness or hallucination metrics were measured. The deployed agent's tool calls (`ai/agent/tools.js`) were not evaluated, and in practice they may answer history questions that retrieval misses.
5. **No competitor runs.** MS GraphRAG, LightRAG and HippoRAG 2 were not run on this dataset; their numbers are not comparable. Commercial products were not tested; feature evidence is vendor marketing.
6. **Single machine.** Latency was measured on one laptop. Throughput is derived from latency, not load-tested. Memory figures are sequential in one process.
7. **Answer-containment proxy is weak.** Single-technician categories make some answers trivial.
8. **Vision benchmark.** The existing `ml-vision` benchmark (95.2 % accuracy) is **simulated** and must not be cited.

### 3.8 Improvements required for future research

1. **Replace `feature-hash-v1` with a learned embedding** (local MiniLM-class or an API embedding) and enable the Atlas vector index already in the code. Then re-run this benchmark on the deployed path and sweep the 0.45/0.55 hybrid weights.
2. **Make graph context query-conditioned:** entity linking (apartment, block, category, relation) → traversal → ranked evidence. Compare rule-based, embedding-based and LLM-based linkers on questions written by people blind to the linker.
3. **Index ticket history** (or expose it through retrieval) so that history questions can be answered without relying on tool calls.
4. **Run the generation evaluation** with the provided script, and add a human-rated subset to calibrate the LLM judge.
5. **Run published GraphRAG systems on the same dataset** (HippoRAG 2 is the cheapest per [6]) for a genuinely comparable Table 3.
6. **Build a real dataset.** Collect anonymised real tickets and resident questions with consent, and use at least two human annotators with agreement statistics.
7. **Train and evaluate the vision model** on a real labelled dataset before reporting any accuracy.

## 4. Conditions under which each approach performs best

| Approach | Best when | Weak when |
|---|---|---|
| Keyword / BM25 | Questions reuse document vocabulary; zero infrastructure; sub-ms latency | Paraphrases; relational or multi-hop questions |
| Dense Vector RAG | Paraphrased natural-language questions; single-hop policy lookup | Relational questions about specific apartments or technicians; costs ~10 s to load and ~660 MB of memory |
| SafeHome hybrid (current) | Cheap, deterministic, no dependencies | Paraphrases (no semantics); underperforms keyword search alone in this benchmark |
| SafeHome deployed graph context | "What is happening recently?" overviews | Any question about a specific older ticket, apartment or relation |
| Query-conditioned graph expansion | Apartment, technician and history questions over structured CRM data | Free-text questions with no linkable entity (falls back to the hybrid) |
| LLM-built GraphRAG (published) | Global sensemaking over large unstructured corpora [2]; complex reasoning [9] | High indexing and query token cost; single-hop facts [8][9] |
