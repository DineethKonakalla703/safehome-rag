# RAG System Comparison — SafeHome-RAG vs. Conventional Retrieval and Vector RAG (Table 2)

## 1. What SafeHome-RAG actually implements (verified in code)

The live configuration is read from `backend/.env` without exposing values: `VECTOR_SEARCH_ENABLED` unset, `EMBEDDING_PROVIDER` unset (default `local`).

| Component | Implementation | File |
|---|---|---|
| Chunking | `splitText(maxLength = 900)` | `backend/src/ai/rag/textExtractor.js` |
| "Embedding" | `feature-hash-v1`: 64-dimensional MD5 feature hashing of tokens (a hashing trick, **not a learned semantic embedding**) | `backend/src/ai/rag/embeddingService.js` |
| Vector index | MongoDB Atlas Vector Search code exists but is **disabled** in this deployment (`VECTOR_SEARCH_ENABLED` unset) | `backend/src/ai/rag/vectorStore.js` |
| Ranking (`hybridSearch`) | `score = 0.45 × keyword-overlap ratio + 0.55 × cosine(hash vectors)`; keyword-only when cosine = 0; keeps score > 0; top 6 | `vectorStore.js` |
| Tokeniser | `/[a-z0-9]{3,}/g` on lower-cased text | `vectorStore.js` |
| Graph context | `buildGraphContext(user, ticketId?)`: the role-scoped latest 5 tickets (or one given ticket) with their blocks, apartments and technicians, serialised as JSON. **Not conditioned on the question.** | `graphContextBuilder.js` |
| Generator | Claude (`CLAUDE_MODEL=claude-sonnet-4-6`) via the agent and chatbot | `ai/claudeClient.js`, `ai/agent/agentRunner.js` |
| Knowledge base (seeded) | 7 documents stored as 26 chunks in MongoDB | `backend/src/seed/seed.js`, DB |

**Parity check (own experiment, 2026-11-14).** `experiments/parity_check.mjs` ran the production `hybridSearch()` against MongoDB and the in-memory harness on the 26 stored chunks. Both produced **identical rankings and scores for 60/60 questions**, so the harness results below are valid for the deployed code.

## Table 2. RAG system comparison

| System | Retriever | Embedding / representation | Graph use | Generator | Evidence status | Retrieval nDCG@5 on SafeHome maintenance QA (n = 50) |
|---|---|---|---|---|---|---|
| **SafeHome-RAG (hybrid, same corpus)** | Keyword overlap + hashed-vector cosine | feature-hash-v1, 64-d | none in this configuration | Claude (not invoked in this study) | Own experiment | **0.435** [0.325, 0.547] |
| **SafeHome-RAG as deployed** | KB-only hybrid (top 6) + fixed recent-ticket graph context | feature-hash-v1 | non-query-conditioned CRM context | Claude (not invoked) | Own experiment | **0.384** [0.271, 0.501] |
| Traditional database keyword search (baseline) | Term-overlap ratio (SafeHome's own keyword scorer) | none | none | — | Own experiment | 0.550 [0.428, 0.669] |
| BM25 (Okapi, k1 = 1.2, b = 0.75) [15] | Lexical, probabilistic | none | none | — | Own experiment | 0.539 [0.423, 0.655] |
| Conventional Vector RAG (dense) | Cosine top-k | all-MiniLM-L6-v2, 384-d [14][18][19] | none | — | Own experiment | **0.701** [0.599, 0.797] |
| Original RAG (Lewis et al. 2020) [1] | DPR dense retriever + BART generator | DPR | none | BART | Published only | Not comparable (different datasets) |
| NV-Embed-v2 dense retrieval (as reported in HippoRAG 2) [6] | Dense | NV-Embed-v2 | none | LLM reader (see [6]) | Published only | Not comparable |
| ColBERTv2 (as reported in HippoRAG) [5] | Late-interaction dense | ColBERTv2 | none | — | Published only | Not comparable |

Values in brackets are 95 % bootstrap confidence intervals (10,000 resamples). The generator column is "not invoked" because the user chose a zero-cost, retrieval-only study; see `QUANTITATIVE_METRICS_COMPARISON.md` Table 5.

## 2. Findings (own experiment, identical conditions)

1. **Dense Vector RAG retrieved best overall.** It is significantly better than SafeHome's hybrid on nDCG@5 (+0.266, Holm-adjusted p = 0.003), Recall@5 (+0.250, p = 0.019) and MRR (+0.264, p = 0.003).
2. **SafeHome's hybrid scored *lower* than plain keyword search and BM25.** Keyword search was ahead by 0.115 nDCG@5 and BM25 by 0.104. Unadjusted p was 0.010 and 0.023, but **neither difference is significant after Holm correction** (p = 0.15 and 0.29). The data therefore do **not** support the claim that SafeHome's RAG improves on traditional database search. If anything, the evidence leans the other way.
3. **Why the hybrid underperforms.** The 64-dimensional MD5 hash "embedding" has no semantic generalisation: paraphrases with different words hash to unrelated buckets, and the 64 buckets collide. Mixing this signal at weight 0.55 with the keyword ratio adds noise without adding semantic recall. The comparison of keyword search alone (0.550) with hybrid (0.435) on the same corpus is in effect an ablation of the hashed-vector term.
4. **Where lexical and hashed methods are adequate.** On factual questions that reuse document vocabulary (type F), every method reaches nDCG@5 of 0.80–1.00. The gap opens on paraphrased (S) and historical (H) questions; see `MAINTENANCE_DOMAIN_EVALUATION.md`.
5. **Cost of the dense baseline.**
   - Mean in-process query latency was 27.3 ms versus 0.51 ms for the SafeHome hybrid; SafeHome's hybrid is 98.1 % lower.
   - Indexing 162 chunks took 9.9 s, including a 9.8 s model load.
   - Process resident memory rose by about 660 MB after loading the model.
   - The deployed SafeHome retrieval is dominated by MongoDB Atlas round trips (66.6 ms mean, 74.3 ms p95), so the in-process difference is small next to the network cost.

## 3. Implication (not a change made to the application)

**Not implemented.** No application code was changed (integrity rule 12).

The measurements suggest that replacing `feature-hash-v1` with a learned sentence embedding would likely raise SafeHome's retrieval quality toward the dense baseline. The code already has hooks for this (`EMBEDDING_PROVIDER`, the Atlas vector index).

**Still to measure.** That would need its own experiment on the deployed path, including a hybrid weighting sweep.
