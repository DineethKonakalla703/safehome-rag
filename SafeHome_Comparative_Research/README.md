# SafeHome-RAG — Comparative Research Package

This package benchmarks SafeHome-RAG against existing applications and published RAG/GraphRAG research systems.

**Headline finding:** SafeHome's current retriever did **not** outperform keyword search or BM25 (differences not significant after correction). It was significantly worse than a dense MiniLM Vector RAG baseline. A query-conditioned graph prototype solved multi-hop questions, but that result is an optimistic upper bound. Details are in `RESULTS_AND_DISCUSSION.md`.

## Documents

| File | Content |
|---|---|
| `FEATURE_COMPARISON.md` | Table 1 — features vs. Buildium, AppFolio, Yardi Breeze |
| `EXISTING_SYSTEMS_REVIEW.md` | Per-product evidence with URLs (plus MyGate, ADDA) |
| `RAG_SYSTEM_COMPARISON.md` | Table 2 — SafeHome retrieval vs. keyword, BM25, dense Vector RAG |
| `GRAPHRAG_SYSTEM_COMPARISON.md` | Table 3 — vs. MS GraphRAG, LightRAG, HippoRAG / HippoRAG 2, Fast-GraphRAG |
| `QUANTITATIVE_METRICS_COMPARISON.md` | Tables 4–6, each split into comparable and non-comparable parts |
| `MAINTENANCE_DOMAIN_EVALUATION.md` | Dataset, annotation procedure, Table 7 |
| `STATISTICAL_ANALYSIS.md` | CIs, permutation tests, Holm correction |
| `RESULTS_AND_DISCUSSION.md` | Findings, discussion, limitations, future work |
| `COMPARISON_REFERENCES.md` | IEEE-style references |
| `COMPARISON_DATA.csv` | Every own measurement in one flat table |
| `charts/*.svg` | Figures 1–3 |

## Reproduce (from this folder; Node 20+)

Install the dense-embedding dependency, once:

```bash
cd experiments && npm install && cd ..
```

Rebuild the dataset; the output is byte-identical:

```bash
node dataset/build_dataset.mjs
```

Run the retrieval experiment. It downloads all-MiniLM-L6-v2 once (~90 MB) and makes no LLM calls:

```bash
node experiments/run_retrieval.mjs
```

Compute statistics, which writes `results/summary.json` and `COMPARISON_DATA.csv`:

```bash
node experiments/analyze.mjs
```

Regenerate the charts:

```bash
node experiments/make_charts.mjs
```

Re-run the parity check. It is read-only against the database configured in `backend/.env`:

```bash
node experiments/parity_check.mjs
```

Generation evaluation is billable, so it does nothing without `--confirm`:

```bash
node experiments/run_generation_eval.mjs --dry-run
```

## Integrity notes

- No application code or application data was modified. The parity check only reads from the database.
- Competitor products were **not tested**; their rows rest on public vendor documentation.
- Published research numbers are reported with their source and are **never** mixed into the comparable tables.
- Ground truth was written by an AI assistant and checked automatically, **not by humans**. Review it before publication.
- `ml-vision/benchmark_evaluation.json` contains **simulated** numbers and must not be cited.
