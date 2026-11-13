# Quantitative Metrics Comparison (Tables 4, 5, 6)

Each table has two parts:
- **Part A — Comparable.** Own experiments: same 60 questions, same 162-unit corpus, same `splitText(900)` chunking, same laptop, run 2026-11-13/14.
- **Part B — Not comparable.** Published results on other datasets, with other models and metric definitions. They are shown for context only and must **not** be read side by side with Part A.

Missing values use the required wording: *Not publicly reported* · *Not measured* · *Not applicable* · *Not comparable*.

**Test environment:**

| Item | Value |
|---|---|
| CPU | Intel Core i5-1340P (16 logical cores) |
| Memory | 15.6 GB RAM |
| OS | Windows 11 (10.0.26200, x64) |
| Runtime | Node v24.15.0 |
| Dense model | Xenova/all-MiniLM-L6-v2 (ONNX fp32) via @huggingface/transformers 3.7.6 |

---

## Table 4. Retrieval performance

### Part A — Comparable (own experiment; 50 answerable questions; K = 5; mean with 95 % bootstrap CI)

| System | Precision@5 | Recall@5 | Hit@5 | MRR (top 10) | nDCG@5 | Context Precision* | Context Recall* |
|---|---|---|---|---|---|---|---|
| Keyword DB search | 0.184 [0.140, 0.232] | 0.601 [0.476, 0.720] | 0.680 | 0.587 [0.463, 0.707] | 0.550 [0.428, 0.669] | 0.559 | 0.601 |
| BM25 | 0.176 [0.140, 0.216] | 0.607 [0.482, 0.725] | 0.700 | 0.577 [0.464, 0.691] | 0.539 [0.423, 0.655] | 0.550 | 0.607 |
| Dense Vector RAG (MiniLM) | 0.216 [0.184, 0.252] | 0.742 [0.642, 0.837] | **0.880** | **0.764** [0.659, 0.862] | **0.701** [0.599, 0.797] | **0.748** | 0.742 |
| SafeHome hybrid (same corpus) | 0.148 [0.112, 0.188] | 0.492 [0.370, 0.614] | 0.600 | 0.500 [0.378, 0.622] | 0.435 [0.325, 0.547] | 0.466 | 0.492 |
| SafeHome as deployed | 0.116 [0.084, 0.148] | 0.419 [0.296, 0.543] | 0.520 | 0.433 [0.309, 0.562] | 0.384 [0.271, 0.501] | 0.424 | 0.429† |
| Graph-expanded prototype‡ | **0.272** [0.220, 0.328] | **0.806** [0.708, 0.896] | **0.880** | 0.685 [0.585, 0.783] | 0.692 [0.598, 0.779] | 0.688 | **0.806** |

**Notes to Part A:**
- \* *Non-LLM* versions computed against gold document IDs:
  - Context Precision = AP@5, rank-aware, normalised by min(hits, |gold|).
  - Context Recall = the fraction of gold units present in the returned context.
  - These are **not** the LLM-judged RAGAS metrics [11][12], which are in Table 5 and were not measured.
- † For the deployed configuration the context also includes the fixed graph JSON (5 tickets plus their apartments and technicians), so Context Recall can exceed Recall@5.
- ‡ The graph-expanded prototype is not part of SafeHome-RAG. Its linking rules were written by the question author, so treat it as an optimistic upper bound.
- **Unanswerable questions (n = 10).** Every system returned at least one result for all 10, so the no-result rate is 0.00 for all. None of the retrievers abstains, so abstention would have to happen at generation time, which was not measured.

### Part B — Not comparable (published; different datasets, models and K)

| System | Metric | Value | Dataset | Source (date) |
|---|---|---|---|---|
| BM25 | Recall@2 / Recall@5 (avg) | 46.5 / 58.4 | MuSiQue, 2Wiki, HotpotQA (1,000-question subsets) | HippoRAG [5] Table 2 (NeurIPS 2024) |
| ColBERTv2 | Recall@2 / Recall@5 (avg) | 53.9 / 65.6 | same | [5] Table 2 |
| HippoRAG (ColBERTv2) | Recall@2 / Recall@5 (avg) | 57.4 / 72.9 | same | [5] Table 2 |
| NV-Embed-v2 | Recall@5 (avg) | 73.4 | HippoRAG 2 benchmark suite | HippoRAG 2 [6] Table 3 (ICML 2025) |
| HippoRAG 2 | Recall@5 (avg) | 78.2 | same | [6] Table 3 |
| Fast-GraphRAG vs. VectorDB | all-evidence retrieved | 0.96 / 0.93 vs. 0.49 / 0.42 | 2Wiki (vendor subset) | [7] README (not peer-reviewed) |
| all-MiniLM-L6-v2 | nDCG@10 (MTEB retrieval avg) | 41.95 | MTEB retrieval (15 datasets) | MTEB [13] (EACL 2023) |
| all-MiniLM-L6-v2 | nDCG@10 | HotpotQA 46.51; NQ 43.87; SciFact 64.51 | BEIR via MTEB | [13] |
| MS GraphRAG, LightRAG | Precision@K / Recall@K / MRR | Not publicly reported (evaluated by LLM win rate) | — | [2][4] |
| Buildium, AppFolio, Yardi Breeze | any retrieval metric | Not publicly reported | — | `EXISTING_SYSTEMS_REVIEW.md` |

---

## Table 5. Generation quality

### Part A — Comparable (own experiment)

| System | Faithfulness | Answer Relevancy | Answer Correctness | Hallucination Rate |
|---|---|---|---|---|
| SafeHome-RAG (Claude generator) | Not measured | Not measured | Not measured | Not measured |
| Dense Vector RAG + same generator | Not measured | Not measured | Not measured | Not measured |
| Keyword / BM25 + same generator | Not measured | Not measured | Not measured | Not measured |

**Why "Not measured".** The user chose a zero-cost, retrieval-only study, so no Claude generation or LLM-judge calls were made.

**The script is ready but has not been run.** `experiments/run_generation_eval.mjs` generates answers from each system's top-5 context with one fixed Claude model. It then scores faithfulness, answer relevancy, answer correctness against the gold `answer` field, and hallucination on the unanswerable set, using an LLM judge with a fixed rubric.

**Retrieval-level proxy (not a generation metric).** *Answer containment* is the share of answerable questions whose gold answer string appears somewhere in the retrieved context:

| System | Answer containment |
|---|---|
| Keyword | 0.78 |
| BM25 | 0.84 |
| Dense | 0.94 |
| SafeHome hybrid | 0.78 |
| SafeHome deployed | 0.70 |
| Prototype | 0.84 |

This proxy is weak. Several answers are technician names, and Water Leakage and HVAC each have only one technician, so the name appears in many units.

### Part B — Not comparable (published)

| System | Metric | Value | Dataset / judge | Source |
|---|---|---|---|---|
| HippoRAG 2 vs. NV-Embed-v2 vs. GraphRAG vs. LightRAG vs. HippoRAG | QA F1 (avg) | 59.8 / 57.0 / 49.6 / 6.6 / 53.1 | HippoRAG 2 suite | [6] Table 2 |
| Vanilla RAG vs. HippoRAG 2 vs. Community-Local (Llama-3.1-8B) | F1 on NQ | 64.78 / 61.03 / 63.01 | NQ | Han et al. [8] (arXiv v4) |
| same | F1 on HotpotQA | 60.04 / 63.01 / 61.66 | HotpotQA | [8] |
| RAG w/ rerank vs. MS-GraphRAG vs. HippoRAG 2 vs. LightRAG vs. Fast-GraphRAG | Accuracy, Fact Retrieval | 60.92 / 49.29 / 60.14 / 58.62 / 56.95 | GraphRAG-Bench (Novel) | Xiang et al. [9] Table 2 |
| same | Accuracy, Complex Reasoning | 42.93 / 50.93 / 53.38 / 49.07 / 48.55 | same | [9] Table 2 |
| No-RAG vs. BM25 vs. GraphRAG vs. HippoRAG vs. RAPTOR | Accuracy | 70.68 / 71.66 / 72.50 / 72.64 / 73.58 | GraphRAG-Bench (CS textbook) | Xiao et al. [10] Table 4 |
| LightRAG vs. NaiveRAG | Overall win rate (LightRAG %) | 67.6 / 61.2 / 84.8 / 60.0 | UltraDomain (Agri / CS / Legal / Mix); GPT-4o-mini judge | [4] Table 1 |
| LightRAG vs. GraphRAG | Overall win rate (LightRAG %) | 54.8 / 52.0 / 52.8 / 49.6 | same | [4] Table 1 |
| MS GraphRAG (community summaries) vs. naive semantic search | Comprehensiveness win rate | 72–83 % (podcast); 72–80 % (news) | LLM-generated sensemaking questions | Edge et al. [2] (arXiv v2) |
| RAGAS metric validation | Agreement with human judges | Faithfulness 0.95; answer relevance 0.78; context relevance 0.70 | WikiEval (50 pages) | Es et al. [11] (validates the metric, not a RAG system) |
| Hallucination rate (any of the above) | — | Not publicly reported in a comparable form | — | — |
| Buildium, AppFolio, Yardi Breeze | any generation metric | Not publicly reported | — | — |

---

## Table 6. Computational performance

### Part A — Comparable (own experiment; 60 questions × 5 repetitions = 300 queries per system; LLM generation excluded)

| System | Mean latency (ms) [95 % CI] | Median | P95 | Throughput (queries/s, single-thread, = 1000 / mean) | CPU ms / query | Index build | Memory (process RSS) | LLM cost |
|---|---|---|---|---|---|---|---|---|
| Keyword | 0.18 [0.14, 0.24] | 0.13 | 0.28 | ≈ 5,500 | 0.16 | 1.5 ms | 270.7 MB, no change | $0 |
| BM25 | 0.19 [0.18, 0.20] | 0.18 | 0.28 | ≈ 5,400 | 0.31 | 2.8 ms | 270.7 MB, no change | $0 |
| Dense (MiniLM) | 27.29 [25.10, 29.51] | 19.02 | 60.47 | ≈ 37 | 240.42§ | 9,926 ms (9,784 ms model load) | 270.7 → 932.4 MB | $0 (local model) |
| SafeHome hybrid | 0.51 [0.42, 0.63] | 0.36 | 0.81 | ≈ 2,000 | 3.85 | 34 ms | 932.4 → 933.7 MB | $0 |
| SafeHome deployed (in-process harness) | 0.30 [0.22, 0.42] | 0.15 | 0.66 | ≈ 3,400 | 0.99 | — | — | $0 |
| Prototype graph expansion | 0.47 [0.44, 0.51] | 0.40 | 0.94 | ≈ 2,100 | 0.57 | — | — | $0 |
| **SafeHome deployed functions against MongoDB Atlas** (`retrieveKnowledge` + `buildGraphContext`, network included; n = 120) | **66.6** | 65.0 | 74.3 | ≈ 15 (sequential) | Not measured | — | Not measured | $0 for retrieval; generation not measured |

**Notes to Part A:**
- **CPU per query.** CPU ms/query exceeds wall-clock time for the dense model (§) because ONNX Runtime runs on several threads.
- **Memory.** RSS was measured sequentially in one process, so later systems inherit the dense model's memory. Only the dense row's increase is attributable to that system.
- **Throughput.** It is derived from mean latency, not from a concurrent load test.
- **Latency reductions** (formula: (baseline − system) / baseline × 100):
  - SafeHome hybrid vs. dense: **98.1 %** lower mean in-process latency;
  - BM25 vs. dense: 99.3 % lower.

### Part B — Not comparable (published; LLM-based indexing at far larger scale)

| System | Indexing tokens | Indexing time | Query time | Dataset | Source |
|---|---|---|---|---|---|
| MS GraphRAG | 115.5 M | 277 min | 10.7 s / query | MuSiQue (11,656 passages) | HippoRAG 2 [6] Table 12 |
| LightRAG | 68.5 M | 235 min | 13.3 s / query | same | [6] Table 12 |
| HippoRAG 2 | 9.2 M | 99.5 min | 1.2 s / query | same | [6] Table 12 |
| NV-Embed-v2 (dense) | — | 12.1 min | 0.3 s / query | same | [6] Table 12 |
| MS GraphRAG (C0 vs. text summarisation) | 26,657 vs. 1,014,611 query-time tokens (podcast); 39,770 vs. 1,707,694 (news) | — | — | podcast / news | [2] Table 2 |
| Vanilla RAG / LightRAG / MS-GraphRAG global | 879 / 100,832 / 331,375 prompt tokens per query | — | — | GraphRAG-Bench Novel | [9] |
| GraphRAG / LightRAG / HippoRAG | 79.9 M / 83.9 M / 33.0 M graph-construction tokens | — | — | CS textbook corpus | Xiao et al. [10] Table 2 |
| HippoRAG online retrieval | — | — | ≈ $0.1 and ≈ 3 min per 1,000 queries | multi-hop QA | [5] Table 17 |
| Buildium, AppFolio, Yardi Breeze | Not publicly reported | Not publicly reported | Not publicly reported | — | — |
