# Feature Comparison — SafeHome-RAG vs. Buildium, AppFolio Property Manager and Yardi Breeze (Table 1)

**Evidence type matters.** This table compares *documented product features*, not measured performance.
- SafeHome-RAG cells are verified against this repository's source code (file paths given). Most were also exercised in local testing during development.
- Competitor cells rest **only on public vendor documentation** (accessed 2026-11-14). **No competitor product was installed, licensed or tested.**
- Absence of a mention in vendor documentation is labelled *Not publicly established*, never *Not available*. No page found during this review explicitly stated that a feature is unsupported, so the label *Not available according to verified documentation* does not occur.

Labels: **Available** · **Partially available** · **Not publicly established** · **Not available according to verified documentation** · **Planned in SafeHome-RAG**

## Table 1. Feature comparison

| # | Feature | SafeHome-RAG (code-verified) | Buildium | AppFolio Property Manager | Yardi Breeze / Breeze Premier |
|---|---|---|---|---|---|
| 1 | Resident management | Available | Available [B1] | Available [A9] | Available [Y1] |
| 2 | Maintenance request creation (resident) | Available | Available [B1] | Available [A7] | Available [Y1][Y5] |
| 3 | Work-order management | Available | Available [B2] | Available [A7][A8] | Available [Y1] |
| 4 | Technician / vendor assignment | Available | Available [B2] | Available [A7][A11] | Available [Y1] |
| 5 | Maintenance history | Available | Partially available [B2] | Partially available [A7] | Available [Y1] |
| 6 | Notifications | Available (in-app; web push for critical alerts) | Partially available (text/email; push not documented) [B1] | Partially available (text/email; push not documented) [A9] | Partially available (text/email) [Y1] |
| 7 | Dashboards and analytics | Available | Available (Growth tier and above) [B3][B4] | Available (tiered) [A8][A4][A5] | Partially available (financial reports; no dashboards described) [Y1][Y2] |
| 8 | Document management | Available | Available [B5] | Available [A9][A10][A5] | Partially available [Y1][Y3][Y4] |
| 9 | AI-assisted maintenance (triage, classification, routing) | Available (Claude-based ticket analysis and agent) | Available (Lumina AI Maintenance Agent; Premium plan or paid add-on) [B6][B7] | Available (Realm-X Maintenance Performer) [A1][A2][A5][A6] | Not publicly established for Breeze (Yardi maintenance AI is in the enterprise suite) [Y6][Y7] |
| 10 | Knowledge retrieval (natural-language Q&A over documents/data) | Available (RAG over a knowledge base plus CRM graph context) | Partially available (AI Assistant; document summarisation in Lumina AI Workforce) [B8][B6] | Available (Realm-X Assistant; document Q&A, Fall 2026) [A3][A5][A6] | Partially available (RentCafe Chat IQ add-on, leasing scope) [Y1][Y8] |
| 11 | Predictive / intelligent maintenance | Partially available (rule-based SLA-risk score; collective-incident detection; no failure-prediction model) | Partially available ("predictive maintenance insights" claimed, method not described; Premium or add-on) [B7] | Not publicly established [A7][A5] | Not publicly established |
| 12 | Gated-community modules (visitors/gate pass, parcels, polls, forum, SOS) | Available | Not publicly established [B1] | Partially available (HOA product only; surveys) [A10][A9] | Not publicly established [Y4] |
| 13 | Native mobile apps | Partially available (Expo/React Native app in `mobile/`; exercised only in the Expo web preview; not published to app stores) | Available [B1][B2] | Available [A12][A7] | Partially available (RentCafe Resident app; staff app not named) [Y5][Y2] |

Bracketed codes resolve to URLs in `EXISTING_SYSTEMS_REVIEW.md` §5 and `COMPARISON_REFERENCES.md`.

## SafeHome-RAG evidence (source files)

| # | Evidence in this repository |
|---|---|
| 1 | `backend/src/models/Resident.js`, `Apartment.js`, `Block.js`; `routes/coreRoutes.js` |
| 2–4 | `models/Ticket.js`, `models/WorkOrder.js`, `models/Technician.js`, `models/Vendor.js`; `routes/ticketRoutes.js`, `workOrderRoutes.js`; `ai/vendorRecommender.js` (rule-based vendor scoring) |
| 5 | Ticket history per apartment/technician in `models/Ticket.js`; it is queried by the agent tools (`ai/agent/tools.js`) |
| 6 | `models/Notification.js`, `services/notificationService.js` (web push broadcast for critical alerts) |
| 7 | `controllers/dashboardController.js`, `routes/reportRoutes.js` |
| 8 | `models/Document.js`, `models/KnowledgeDocument.js`, `ai/rag/knowledgeIngestion.js` |
| 9 | `ai/agent/agentRunner.js`, `ai/chatbot/*`, `ai/claudeClient.js` (Claude model configured as `claude-sonnet-4-6`) |
| 10 | `ai/rag/retriever.js`, `ai/rag/vectorStore.js` (`hybridSearch`), `ai/rag/graphContextBuilder.js` (`buildGraphContext`) |
| 11 | `ai/slaRiskPredictor.js`: a hand-weighted additive score over severity, assignment, escalation, safety, workload and SLA time remaining; Claude only explains the score. `ai/collectiveIncidentDetector.js`: keyword-family grouping. **Neither is a trained predictive model.** The `ml-vision/` image classifier ships a *synthetic* benchmark file (see `MAINTENANCE_DOMAIN_EVALUATION.md` §1) and has no measured accuracy. |
| 12 | `models/Visitor.js`, `Parcel.js`, `Poll.js`, `ForumPost.js`, `SosAlert.js`; `routes/communityLifeRoutes.js`, `operationsPlusRoutes.js` |
| 13 | `mobile/src/app/**` (Expo Router) |

## How to read this table

- **Common to all four products:** rows 1–4 (resident records, request intake, work orders, assignment) are table stakes for the category.
- **Where commercial products are ahead:** Buildium and AppFolio document mature, tier-packaged AI maintenance agents, published native apps, accounting and leasing. These are large production systems with many customers. SafeHome-RAG is an academic prototype with seeded data.
- **Where SafeHome-RAG differs:**
  - It combines (a) Indian gated-community modules, (b) a knowledge-base RAG pipeline and (c) a CRM graph context in one system.
  - Among the three required comparators, only AppFolio's HOA product documents some of these modules.
  - Indian society apps such as MyGate and ADDA document the community modules but not knowledge retrieval (see `EXISTING_SYSTEMS_REVIEW.md` §4).
  - This is a *combination* difference, not evidence of better quality. Feature presence says nothing about how well a feature works.
- **AI features change fast.** AppFolio shipped AI updates in Jun 2025, Oct 2025, Jun 2026, Sep 2026 and Oct 2026 (see the review). This table is a snapshot as of 2026-11-14.
