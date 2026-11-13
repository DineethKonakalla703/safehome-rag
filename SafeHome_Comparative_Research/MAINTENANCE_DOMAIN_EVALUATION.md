# Maintenance-Domain Evaluation (Phases 1, 5, 6 and Table 7)

## 1. Pre-existing evaluation artefacts in the repository (Phase 1)

| Artefact | Finding | Citable? |
|---|---|---|
| `ml-vision/benchmark_evaluation.json` | Reports `final_accuracy: 95.2` and `macro_f1: 0.95` for a MobileNetV2 damage classifier with 6 classes. When no dataset is present, `display_benchmark_simulation()` in `ml-vision/train_maintenance_vision.py` writes hard-coded values, so these figures are **simulated, not measured**. | **No.** Do not cite 95.2 % or 0.95 as results. A real dataset and training run are needed. |
| RAG / GraphRAG evaluation | No retrieval or answer-quality evaluation existed before this study. | — |

All original files were left unmodified (integrity rules 8 and 12).

## 2. Dataset: "SafeHome Maintenance QA v1" (Phase 6)

All files are generated deterministically by `dataset/build_dataset.mjs` (seeded mulberry32 PRNG, seed 42, fixed dates). Re-running it reproduces identical files.

### 2.1 Corpus (162 retrieval units)

| Unit kind | Count | Origin |
|---|---|---|
| Knowledge documents | 7 | **Real SafeHome seed documents** (KDOC001–007), copied verbatim from `backend/src/seed/seed.js` |
| Knowledge documents | 22 | **Synthetic**, written by the AI assistant for this study (KDOC101–122). Topics: HVAC, appliances, water heater, drains, seepage, terrace waterproofing, MCB/RCCB, earthing, gas, DG, fire, pest control, recurring-issue policy (KDOC115), technician SLA (KDOC116), lift AMC, RO, carpentry, preventive-maintenance calendar (KDOC120), pumps and service lift (KDOC122). |
| Tickets | 80 | **Synthetic.** 16 are planted scenarios (e.g. A-203 plumbing ×4, C-402 plumbing ×3, leakage above/below flats). 64 are random. All are rendered as text units. |
| Apartments | 45 | Synthetic graph: 3 blocks × 5 floors × 3 flats, with a "directly above" relation |
| Technicians | 8 | Synthetic names and specialisations |

### 2.2 Questions (60; 10 per type)

| Type | What it tests | Gold evidence | Example |
|---|---|---|---|
| F — factual | Lexical lookup in one document | 1 document | "What are the quiet hours in the society?" → KDOC005 ("10:00 PM") |
| S — semantic | Paraphrase with little word overlap | 1 document | "My cooling unit is on but the bedroom still feels hot…" → KDOC102 ("filter") |
| H — historical | Ticket history of one apartment and category | All matching tickets, computed from the graph | "Has A-203 had plumbing problems before, and who fixed the most recent one?" → 4 tickets ("Imran Shaikh") |
| M — multi-document | Combine two policies | 2 documents | Burst pipe near the electrical panel → KDOC001 + KDOC002 |
| G — multi-hop graph | Relation traversal: flat above → tickets → technician; recurrence policy; aggregation | Apartment + ticket(s) (+ policy) | "Damp patch on the ceiling of A-202. Who fixed the most recent leakage in the flat directly above?" → APT-A-202 + TKH061 ("Mohan Das") |
| U — unanswerable | Information not in the corpus | none | "What is the chlorine dosing schedule for the swimming pool?" |

### 2.3 Annotation procedure and quality control

1. **Who wrote the ground truth.** Gold evidence and answers were **written by the AI assistant (Claude)**, not by domain experts. For types H and G the gold is **computed programmatically** from the synthetic graph (e.g. all tickets with apartmentId = X and category = Y), which removes manual labelling error for those types.
2. **Automated consistency checks** in `build_dataset.mjs`:
   - every answerable question's gold IDs exist;
   - its answer string appears in at least one gold unit;
   - each U question's key entity does not exist in the corpus.
   The validator reported **0 problems**.
3. **Not human-verified.** Before publication, the authors should review all 60 items manually and record inter-annotator agreement. Ideally, add questions written by people who have not seen the retrieval rules.
4. **Known weaknesses:**
   - Water Leakage and HVAC each have only one technician, so the answers to G01–G06 and G09 are trivially the same name.
   - The G questions follow templates.
   - The synthetic documents are cleaner than real society documents.
   - 10 questions per type gives wide confidence intervals.

## 3. Systems under identical conditions (Phase 5)

| Key | System | Corpus indexed | Notes |
|---|---|---|---|
| KEYWORD | Traditional DB keyword search | all 162 units | SafeHome's own term-overlap scorer |
| BM25 | Okapi BM25 (k1 = 1.2, b = 0.75) | all 162 | Standard lexical baseline [15] |
| DENSE | Conventional Vector RAG | all 162 | all-MiniLM-L6-v2, cosine top-k |
| SH_HYBRID | SafeHome `hybridSearch` formula | all 162 | Production code imported; parity 60/60 with the DB version |
| SH_DEPLOYED | SafeHome as deployed | 29 KB documents + fixed graph context | Tickets reach the model only through `buildGraphContext` (latest 5, not query-conditioned) |
| PROTO_GRAPH | Graph-expanded prototype (**not SafeHome**) | all 162 + graph | Rule-based linking; optimistic upper bound |

Every system shares the same chunking (`splitText(900)`), the same questions, the same metric code (`experiments/run_retrieval.mjs`) and the same machine. Each system made no LLM calls.

## Table 7. Maintenance-specific evaluation (same questions, same ground truth; n = 10 per type)

### nDCG@5

| System | F | S | H | M | G | All answerable (n = 50) |
|---|---|---|---|---|---|---|
| Keyword | 0.900 | 0.600 | 0.373 | 0.698 | 0.178 | 0.550 |
| BM25 | 0.900 | 0.582 | 0.281 | 0.749 | 0.182 | 0.539 |
| Dense Vector RAG | **1.000** | **0.863** | 0.631 | **0.764** | 0.249 | **0.701** |
| SafeHome hybrid | 0.800 | 0.449 | 0.196 | 0.610 | 0.120 | 0.435 |
| SafeHome deployed | 0.800 | 0.449 | 0.000 | 0.610 | 0.060 | 0.384 |
| Graph prototype‡ | 0.800 | 0.449 | **0.656** | 0.610 | **0.942** | 0.692 |

### Recall@5

| System | F | S | H | M | G |
|---|---|---|---|---|---|
| Keyword | 0.90 | 0.60 | 0.55 | 0.75 | 0.21 |
| BM25 | 0.90 | 0.80 | 0.35 | 0.80 | 0.19 |
| Dense | **1.00** | **0.90** | 0.75 | 0.75 | 0.31 |
| SafeHome hybrid | 0.80 | 0.60 | 0.30 | 0.65 | 0.11 |
| SafeHome deployed | 0.80 | 0.60 | 0.00 | 0.65 | 0.05 |
| Graph prototype‡ | 0.80 | 0.60 | **1.00** | 0.65 | **0.98** |

### MRR and Complete@5 (all gold units in the top 5)

| System | MRR F / S / H / M / G | Complete@5 F / S / H / M / G |
|---|---|---|
| Keyword | 0.90 / 0.62 / 0.34 / 0.81 / 0.27 | 0.9 / 0.6 / 0.5 / 0.5 / 0.0 |
| BM25 | 0.90 / 0.53 / 0.33 / 0.83 / 0.30 | 0.9 / 0.8 / 0.3 / 0.6 / 0.0 |
| Dense | 1.00 / 0.85 / 0.70 / 0.93 / 0.35 | 1.0 / 0.9 / 0.6 / 0.5 / 0.0 |
| SafeHome hybrid | 0.80 / 0.42 / 0.24 / 0.80 / 0.24 | 0.8 / 0.6 / 0.2 / 0.3 / 0.0 |
| SafeHome deployed | 0.80 / 0.40 / 0.00 / 0.80 / 0.16 | 0.8 / 0.6 / 0.0 / 0.3 / 0.0 |
| Graph prototype‡ | 0.80 / 0.42 / 0.50 / 0.80 / 0.90 | 0.8 / 0.6 / 1.0 / 0.3 / 0.9 |

‡ Not part of SafeHome-RAG. Its rules were authored alongside the questions.

**Commercial products and published GraphRAG systems:** *Not measured* on this dataset. Commercial products were not licensed. MS GraphRAG, LightRAG and HippoRAG 2 were excluded by the scope decision to use published results only.

### Observations

1. **Deployed SafeHome cannot answer history questions by retrieval.**
   - Tickets are not in the knowledge base, and `buildGraphContext` supplies only the 5 most recent tickets whatever the question.
   - So H questions score 0.00 Recall@5. G questions reach 0.05, from the occasional overlap with recent tickets.
   - In the live app the agent can still call ticket-lookup tools (`ai/agent/tools.js`). That tool path was **not evaluated** here.
2. **Multi-hop (G) questions defeat every flat retriever** (Complete@5 = 0 for all four). Query-conditioned traversal fixes this in the prototype. This is the pattern reported in [8] and [9].
3. **On paraphrases (S) the learned embedding is clearly ahead** (0.863 vs. 0.449–0.600). This is the case where semantic retrieval is expected to help.
4. **Plain lexical methods are competitive** on F and M questions, where the questions reuse document wording.
