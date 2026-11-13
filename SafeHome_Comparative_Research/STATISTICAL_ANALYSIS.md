# Statistical Analysis (Phase 7)

Produced by `experiments/analyze.mjs` from `results/raw_per_question.json` and `results/latency_raw.json`. The full output is in `results/summary.json`; a flat table is in `COMPARISON_DATA.csv`. All randomness is seeded (PRNG seed 20261114), so re-running gives identical numbers.

## 1. Methods

| Quantity | Definition |
|---|---|
| Mean, median, SD | Over per-question scores (n = 50 answerable, or 10 per type). SD uses n − 1. |
| 95 % CI | Percentile bootstrap of the mean, 10,000 resamples [17]. |
| Improvement % | (system − baseline) / baseline × 100, on a quality metric. |
| Reduction % | (baseline − system) / baseline × 100, on latency or cost. |
| Significance test | Two-sided **paired sign-flip permutation test** on per-question differences (10,000 permutations; p = (extreme + 1) / (10,000 + 1)). It is chosen because scores are bounded and non-normal (many 0/1 values); it makes no normality assumption. |
| Multiple comparisons | **Holm–Bonferroni** [16] over the whole family of 27 tests (9 comparisons × 3 metrics: nDCG@5, Recall@5, MRR). |
| Latency | 300 timed queries per system (60 × 5 repetitions after 3 warm-up queries). Mean, median, p95 (nearest rank), and a bootstrap CI of the mean. |

## 2. Descriptive statistics — answerable questions (n = 50)

| System | nDCG@5 mean (median, SD) [95 % CI] | Recall@5 mean (median, SD) [95 % CI] | MRR mean (median, SD) [95 % CI] |
|---|---|---|---|
| Keyword | 0.550 (0.613, 0.439) [0.428, 0.669] | 0.601 (0.900, 0.449) [0.476, 0.720] | 0.587 (1.000, 0.444) [0.463, 0.707] |
| BM25 | 0.539 (0.622, 0.423) [0.423, 0.655] | 0.607 (1.000, 0.446) [0.482, 0.725] | 0.577 (0.500, 0.415) [0.464, 0.691] |
| Dense | 0.701 (0.960, 0.363) [0.599, 0.797] | 0.742 (1.000, 0.356) [0.642, 0.837] | 0.764 (1.000, 0.376) [0.659, 0.862] |
| SafeHome hybrid | 0.435 (0.431, 0.408) [0.325, 0.547] | 0.492 (0.500, 0.446) [0.370, 0.614] | 0.500 (0.333, 0.448) [0.378, 0.622] |
| SafeHome deployed | 0.384 (0.226, 0.422) [0.271, 0.501] | 0.419 (0.225, 0.453) [0.296, 0.543] | 0.433 (0.225, 0.467) [0.309, 0.562] |
| Graph prototype | 0.692 (0.693, 0.330) [0.598, 0.779] | 0.806 (1.000, 0.347) [0.708, 0.896] | 0.685 (1.000, 0.360) [0.585, 0.783] |

Per-type statistics for every metric are in `results/summary.json` → `descriptive.<SYSTEM>.byType`.

## 3. Hypothesis tests (paired permutation; Holm-adjusted, family of 27)

| Comparison | Subset (n) | Metric | Mean A | Mean B | Δ (A − B) | Relative change | p (raw) | p (Holm) | Significant at α = 0.05 |
|---|---|---|---|---|---|---|---|---|---|
| SafeHome hybrid vs. Keyword | answerable (50) | nDCG@5 | 0.435 | 0.550 | −0.115 | −20.9 % | 0.010 | 0.147 | No |
| | | Recall@5 | 0.492 | 0.601 | −0.109 | −18.1 % | 0.037 | 0.323 | No |
| | | MRR | 0.500 | 0.587 | −0.087 | −14.9 % | 0.063 | 0.344 | No |
| SafeHome hybrid vs. BM25 | answerable (50) | nDCG@5 | 0.435 | 0.539 | −0.104 | −19.3 % | 0.023 | 0.294 | No |
| | | Recall@5 | 0.492 | 0.607 | −0.115 | −18.9 % | 0.057 | 0.344 | No |
| | | MRR | 0.500 | 0.577 | −0.078 | −13.4 % | 0.090 | 0.358 | No |
| SafeHome hybrid vs. Dense | answerable (50) | nDCG@5 | 0.435 | 0.701 | −0.266 | −38.0 % | 0.0001 | **0.003** | **Yes** |
| | | Recall@5 | 0.492 | 0.742 | −0.250 | −33.7 % | 0.0008 | **0.019** | **Yes** |
| | | MRR | 0.500 | 0.764 | −0.264 | −34.6 % | 0.0001 | **0.003** | **Yes** |
| SafeHome deployed vs. SafeHome hybrid | answerable (50) | nDCG@5 | 0.384 | 0.435 | −0.051 | −11.7 % | 0.031 | 0.323 | No |
| | | Recall@5 | 0.419 | 0.492 | −0.073 | −14.8 % | 0.029 | 0.323 | No |
| | | MRR | 0.433 | 0.500 | −0.067 | −13.4 % | 0.0009 | **0.021** | **Yes** |
| Dense vs. BM25 | answerable (50) | nDCG@5 | 0.701 | 0.539 | +0.163 | +30.2 % | 0.002 | **0.036** | **Yes** |
| | | Recall@5 | 0.742 | 0.607 | +0.135 | +22.2 % | 0.032 | 0.323 | No |
| | | MRR | 0.764 | 0.577 | +0.187 | +32.3 % | 0.0004 | **0.010** | **Yes** |
| Prototype vs. SafeHome hybrid | G (10) | nDCG@5 | 0.942 | 0.120 | +0.823 | +687.7 % | 0.001 | **0.031** | **Yes** |
| | | Recall@5 | 0.980 | 0.110 | +0.870 | +790.9 % | 0.002 | **0.036** | **Yes** |
| | | MRR | 0.900 | 0.240 | +0.660 | +275.5 % | 0.024 | 0.294 | No |
| Prototype vs. Dense | G (10) | nDCG@5 | 0.942 | 0.249 | +0.693 | +278.7 % | 0.006 | 0.107 | No |
| | | Recall@5 | 0.980 | 0.310 | +0.670 | +216.1 % | 0.002 | **0.036** | **Yes** |
| | | MRR | 0.900 | 0.349 | +0.551 | +157.7 % | 0.020 | 0.286 | No |
| Prototype vs. SafeHome hybrid | H (10) | nDCG@5 | 0.656 | 0.196 | +0.461 | +235.2 % | 0.003 | 0.052 | No (borderline) |
| | | Recall@5 | 1.000 | 0.300 | +0.700 | +233.3 % | 0.008 | 0.120 | No |
| | | MRR | 0.500 | 0.235 | +0.265 | +112.8 % | 0.047 | 0.328 | No |
| Prototype vs. Dense | H (10) | nDCG@5 | 0.656 | 0.631 | +0.025 | +4.0 % | 0.827 | 0.827 | No |
| | | Recall@5 | 1.000 | 0.750 | +0.250 | +33.3 % | 0.123 | 0.370 | No |
| | | MRR | 0.500 | 0.695 | −0.195 | −28.1 % | 0.209 | 0.418 | No |

Relative changes on small bases (e.g. 0.11 → 0.98) look very large. Report the absolute Δ as the primary effect size.

## 4. Latency statistics (ms, in-process, n = 300 per system)

| System | Mean [95 % CI] | Median | SD | P95 | Min | Max |
|---|---|---|---|---|---|---|
| Keyword | 0.182 [0.145, 0.235] | 0.133 | 0.408 | 0.279 | 0.059 | 6.146 |
| BM25 | 0.186 [0.178, 0.196] | 0.180 | 0.076 | 0.283 | 0.081 | 0.880 |
| Dense | 27.29 [25.10, 29.51] | 19.02 | 19.94 | 60.47 | 6.10 | 152.49 |
| SafeHome hybrid | 0.511 [0.416, 0.634] | 0.362 | 0.977 | 0.812 | 0.235 | 11.22 |
| SafeHome deployed | 0.297 [0.222, 0.420] | 0.148 | 0.915 | 0.657 | 0.089 | 15.18 |
| Graph prototype | 0.470 [0.438, 0.508] | 0.400 | 0.317 | 0.942 | 0.259 | 4.163 |
| Deployed functions on MongoDB Atlas (n = 120) | 66.6 | 65.0 | — | 74.3 | 59.3 | 108.9 |

Latency reductions on mean latency:

| Comparison | Reduction |
|---|---|
| SafeHome hybrid vs. Dense | **98.1 %** |
| BM25 vs. Dense | 99.3 % |

No significance test is run on latency. The differences span orders of magnitude, and the measurements are not independent across repetitions.

## 5. Statistical caveats

- **Sample size and power.** n = 50 (or 10 per type) gives limited power. A true difference of about 0.1 nDCG may not reach significance after Holm correction, so "not significant" means "not demonstrated", not "equal".
- **Dependence between questions.** Questions within a type share templates, so they are not fully independent. The bootstrap and permutation tests treat questions as exchangeable units.
- **A single run of each system.** The retrieval systems are deterministic, so quality scores do not vary across runs. Latency does vary, and has 5 repetitions.
- **Choice of test family.** The 27-test family was fixed before the results were inspected, as listed in `analyze.mjs` (`COMPARISONS`).
