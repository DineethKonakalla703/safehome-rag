# GraphRAG System Comparison — SafeHome-RAG vs. Microsoft GraphRAG, LightRAG, HippoRAG / HippoRAG 2, Fast-GraphRAG (Table 3)

**Scope decision (user, this study):** published results only for MS GraphRAG, LightRAG and HippoRAG 2. These systems were **not run** on the SafeHome dataset; doing so needs heavy LLM calls for graph construction. Their numbers below come from their own papers or repositories, on **different datasets, models and metrics**, and are **not comparable** with SafeHome-RAG's numbers.

## 1. What "GraphRAG" means in SafeHome-RAG

`buildGraphContext()` (`backend/src/ai/rag/graphContextBuilder.js`) queries MongoDB for the role-scoped five most recent tickets, or one ticket if a `ticketId` is given, plus their block, apartment and technician records, and passes them to Claude as JSON. The graph is the **existing CRM schema**: Block → Apartment → Ticket → Technician.

SafeHome's graph context has none of the following:
- LLM-based entity or relation extraction from text,
- community detection or summaries,
- personalised PageRank or any traversal,
- conditioning on the user's question.

It is therefore closer to *structured context injection* than to GraphRAG as defined in [2], [4] or [6].

## Table 3. GraphRAG system comparison (architecture and published evidence)

| System | Graph construction | Retrieval over graph | Query-conditioned | Indexing cost (published) | Peer review | Headline published result (own dataset; not comparable) |
|---|---|---|---|---|---|---|
| **SafeHome-RAG (deployed)** | None (uses existing relational CRM records) | Latest-5 tickets + 1-hop joins | **No** | ≈ 0 LLM tokens; DB queries only (66.6 ms mean incl. KB retrieval, own measurement) | — | Own experiment: on 10 multi-hop questions, nDCG@5 = 0.06 and Recall@5 = 0.045 |
| **Graph-expanded prototype** (this study; *not part of SafeHome*) | None (CRM records) | Rule-based entity linking → 1–2-hop traversal (above-flat relation, apartment → tickets, recurring-issue policy) | Yes | 0 LLM tokens; 0.47 ms/query in-process | — | Own experiment: on the same 10 multi-hop questions, nDCG@5 = 0.942 and Recall@5 = 0.98 (optimistic; see §3) |
| Microsoft GraphRAG [2][3] | LLM entity/relation extraction → Leiden communities → LLM community summaries | Global map-reduce over community summaries; local search | Yes | MuSiQue (11,656 passages): 115.5 M tokens, 277 min (measured by the HippoRAG 2 authors [6], Table 12) | No (arXiv v2, Feb 2025) | Comprehensiveness win rate vs. naive semantic search 72–83 % (podcast) and 72–80 % (news), LLM judge [2] |
| LightRAG [4] | LLM entity/relation extraction; key-value profiles | Dual-level (low/high) keyword-matched graph retrieval + vectors | Yes | MuSiQue: 68.5 M tokens, 235 min [6] | Yes (Findings of EMNLP 2025) | Overall win rate vs. NaiveRAG: 67.6 / 61.2 / 84.8 / 60.0 % (Agriculture / CS / Legal / Mix); GPT-4o-mini is both generator and judge [4] |
| HippoRAG [5] | LLM OpenIE triples + synonym edges | Personalised PageRank from query entities | Yes | Online retrieval ≈ $0.1 and ≈ 3 min per 1,000 queries ([5] Table 17); the paper states 10–20× (abstract) and 10–30× (body) cheaper than iterative retrieval | Yes (NeurIPS 2024) | Average Recall@5: 72.9 (with ColBERTv2) vs. 65.6 for ColBERTv2 alone and 58.4 for BM25 (MuSiQue, 2Wiki, HotpotQA) [5] |
| HippoRAG 2 [6] | OpenIE triples + passage nodes + dense–sparse integration | PPR with recognition-memory filtering | Yes | MuSiQue: 9.2 M tokens, 99.5 min; 1.2 s per query [6] | Yes (ICML 2025) | Average F1 59.8 vs. NV-Embed-v2 57.0, GraphRAG 49.6, LightRAG 6.6; average Recall@5 78.2 vs. 73.4 [6] |
| Fast-GraphRAG [7] | LLM entity extraction | PageRank-based | Yes | Not reported in a peer-reviewed source | No (vendor README) | 2Wiki "all evidence retrieved" 0.96 / 0.93 vs. VectorDB 0.49 / 0.42 (vendor-run) [7] |

## 2. Independent benchmarks of graph-based vs. vector RAG (published)

| Study | Finding relevant to SafeHome | Source |
|---|---|---|
| Han et al., "RAG vs. GraphRAG" (arXiv, v4) | With Llama-3.1-8B, vanilla RAG F1 was higher on single-hop NQ (64.78 vs. HippoRAG 2 61.03 vs. Community-Local 63.01). On multi-hop HotpotQA the order flipped (60.04 vs. 63.01 vs. 61.66). In short, **RAG is better for single-hop questions and GraphRAG for multi-hop questions.** | [8] |
| GraphRAG-Bench, Xiang et al. | On the Novel corpus, RAG with reranking scored highest on fact retrieval (60.92), while HippoRAG 2 led complex reasoning (53.38). MS-GraphRAG global search used ~331k prompt tokens per query, against 879 for vanilla RAG. | [9] |
| GraphRAG-Bench, Xiao et al. | Gains are modest: accuracy was BM25 71.66, GraphRAG 72.50, HippoRAG 72.64 and RAPTOR 73.58, with no-RAG at 70.68. Graph construction needed 33–84 M tokens. | [10] |

## 3. Own-experiment result on the multi-hop maintenance questions (comparable within this study only)

| System (same 10 G-type questions) | nDCG@5 | Recall@5 | MRR | Complete@5 |
|---|---|---|---|---|
| SafeHome deployed | 0.060 | 0.045 | 0.160 | 0.0 |
| SafeHome hybrid (all units indexed) | 0.120 | 0.110 | 0.240 | 0.0 |
| BM25 | 0.182 | 0.185 | 0.297 | 0.0 |
| Dense Vector RAG | 0.249 | 0.310 | 0.349 | 0.0 |
| Graph-expanded prototype | **0.942** | **0.980** | **0.900** | **0.9** |

- **Significance.** Prototype vs. SafeHome hybrid: Holm-adjusted p = 0.031 (nDCG@5) and p = 0.036 (Recall@5). Prototype vs. dense: p = 0.036 (Recall@5) and p = 0.107 (nDCG@5, not significant). Each test uses n = 10.
- **Interpretation.** The direction agrees with the published pattern in [8] and [9]: structure helps multi-hop questions and gives no gain on single-hop ones. On F, S and M questions the prototype equals the SafeHome hybrid, because no entities link and it falls back to the hybrid.
- **The prototype's advantage is an upper bound, not a fair win.**
  - Its entity-linking rules (apartment-ID regex, "above/ceiling" → upstairs flat, "recurring" → policy document KDOC115) were written by the same author as the questions.
  - Questions G01–G06 ask about the flat "directly above", which matches a rule exactly.
  - Real residents will phrase questions in ways no rule anticipates.
  - A fair test needs questions written by people blind to the linker, or a learned/LLM entity linker such as those in [2], [4] and [6].

## 4. Overhead of graph-based retrieval

**Own measurements, in-process, same laptop**

| System | Mean latency per query | Index build | LLM tokens |
|---|---|---|---|
| Prototype graph expansion | 0.47 ms (p95 0.94) | — | none |
| SafeHome hybrid | 0.51 ms (p95 0.81) | 34 ms | none |
| Dense | 27.3 ms (p95 60.5) | 9.9 s | none |

- The prototype's graph adds no measurable overhead here: rule-based linking over 45 apartments and 80 tickets is trivial.
- No LLM tokens are used for graph construction, because the graph already exists in the CRM schema.

**Published (different scale, not comparable)**
- LLM-built graphs cost tens of millions of tokens and hours to index: 115.5 M tokens and 277 min for GraphRAG on MuSiQue [6].
- Query-time token use can be about 100× that of vanilla RAG: ~100k tokens per query for LightRAG and ~331k for MS-GraphRAG global search, against 879 for vanilla RAG [9].

**Conclusion.** For SafeHome's domain, much of the "graph" is already structured data. A schema-based graph avoids almost all of the published GraphRAG construction cost. The open problem is query-conditioned entity linking, not graph construction.
