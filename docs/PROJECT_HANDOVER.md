# SafeHome-RAG Project Handover

Status labels used throughout this document:

- **COMPLETED** — present in the repository and part of the last committed working baseline unless noted otherwise.
- **PARTIAL** — some implementation exists, but it is incomplete, unverified, or currently only present as uncommitted work.
- **PENDING** — not implemented in the inspected repository.

> **Important repository state:** the last committed stable baseline is commit `013c693` on branch `dev`. The current working tree contains unfinished Phase 2/security work and must not be committed as a single batch without review. In particular, `backend/src/ai/rag/embeddingService.js` and `backend/src/ai/rag/vectorStore.js` are deleted locally while current files still import them. Treat the dirty working tree as **PARTIAL and not build-ready** until this is resolved.

## 1. Executive Summary

SafeHome-RAG is a B.Tech CSE capstone project titled **“SafeHome-RAG: AI-Powered Residential Management, Maintenance and Billing CRM.”** It is a full-stack residential operations platform for apartments, gated communities, societies, and multi-block communities.

The project has a completed Phase 1 CRM foundation covering authentication, role-scoped administration, maintenance operations, billing, visitors, parking, amenities, notices, document metadata, inventory, reporting, and audit history. A governed Phase 2 AI layer is also present in a usable but incomplete form: complaint analysis, deterministic fallbacks, technician recommendations, on-demand SLA risk prediction, incident detection, keyword-based knowledge support, a permission-aware chatbot, and preview-before-confirmation Excel import exist. Production-grade vector retrieval, image analysis, the full chatbot CRUD catalogue, proactive monitoring, and several reliability controls remain pending or partial.

Academic details:

- Guide: Dr. Ganesh Reddy Karri, Professor Grade 1, School of Computer Science and Engineering, VIT-AP
- Samyamanthula Akhilesh — Full Stack, API and Database Lead
- Konakalla Dineeth Lakshmi Nath — System Architect and Full Stack Integration Lead
- Ramisetty Verra Venkata Lakshman — Testing, Documentation and Review Presentation Lead
- Mogulluri Atul — Frontend UI and Demo Flow Lead

## 2. Problem Statement

Residential communities often manage complaints and daily operations through WhatsApp messages, phone calls, paper registers, spreadsheets, and disconnected tools. This leads to delayed action, weak tracking, unclear ownership, missed escalations, inconsistent billing, and limited reporting. SafeHome-RAG addresses this by centralizing residential operations in a role-based CRM and adding a carefully governed AI assistance layer for maintenance analysis and decision support.

## 3. Project Goals

- **COMPLETED:** Provide one CRM for communities, blocks, apartments, residents, technicians, complaints, work orders, bills, payments, visitors, vehicles, parking, amenities, notices, documents, inventory, reports, and audit logs.
- **COMPLETED:** Enforce authenticated, role-scoped workflows for six user roles.
- **COMPLETED:** Support the resident complaint → ticket → work order → technician → bill/payment → report/audit workflow.
- **PARTIAL:** Add AI recommendations and explanations without allowing the model to bypass backend validation, permissions, or audit controls.
- **PENDING:** Add production-grade image understanding, embeddings/vector search, complete chatbot actions, monitoring, automated tests, and deployment hardening.

## 4. Tech Stack

Frontend:

- **COMPLETED:** React 18, Vite, JavaScript/JSX, React Router, Lucide icons, and plain CSS.

Backend:

- **COMPLETED:** Node.js, Express.js, MongoDB Atlas, Mongoose, JWT, bcrypt, CORS, Morgan, and dotenv.
- **PARTIAL:** Helmet, Express rate limiting, Zod, node-cron, upload safeguards, and additional production controls are present only in the current unfinished working tree.

AI and data processing:

- **COMPLETED:** Anthropic SDK integration with structured JSON handling and deterministic fallback behavior.
- **COMPLETED:** Multer and XLSX-based two-step bulk onboarding in the committed Phase 2 baseline.
- **PARTIAL:** GraphRAG-style support currently uses document chunks, keyword retrieval, and CRM graph context.
- **PENDING:** Claude Vision complaint analysis, real embeddings, and MongoDB Atlas Vector Search.

Testing and deployment:

- **PARTIAL:** One Node test file exists for AI fallback behavior; the package exposes `npm test`.
- **PENDING:** Broad backend integration tests, Playwright/Cypress frontend E2E tests, and production deployment infrastructure.

## 5. Repository Structure

Key inspected paths:

```text
safehome-rag/
├── backend/
│   ├── src/
│   │   ├── ai/              # Claude, fallback, recommendation, SLA, incident, RAG, chatbot
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Auth, CRM resources, AI, knowledge, import, reports
│   │   ├── middleware/      # Authentication, authorization, errors; partial security/upload work
│   │   ├── models/          # Mongoose collection models
│   │   ├── routes/          # REST route modules
│   │   ├── seed/            # Demo data seeding
│   │   ├── services/        # Bulk import service
│   │   ├── tests/           # Limited Node tests
│   │   └── utils/           # Rules, audit, Excel parsing and utilities
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # Backend API wrappers
│   │   ├── components/      # Layout, CRM and AI UI components
│   │   ├── data/            # Legacy mock data retained as a fallback/reference
│   │   ├── pages/           # Role dashboards, CRM management and AI pages
│   │   └── utils/           # Authentication and frontend utilities
│   ├── .env.example
│   └── package.json
├── docs/                    # Architecture, AI, governance, chatbot and demo documents
├── demo/
├── screenshots/
├── deliverables/
└── README.md
```

Generated folders such as `node_modules` and `dist` must remain untracked.

## 6. Current Git/Branch Status

- Branch: `dev`
- Upstream at inspection: `dev...origin/dev`
- Last committed baseline: `013c693` — `Stabilize Phase 2 incident and chatbot fixes`
- Earlier milestones: `a1e5628` Phase 2 AI layer, `27b2afc` login refinement, `c981b87` Phase 1 core CRM.
- **PARTIAL:** The working tree is dirty with many modified and untracked files from an interrupted production-hardening effort.
- **BLOCKER:** Local deletions of `backend/src/ai/rag/embeddingService.js` and `backend/src/ai/rag/vectorStore.js` conflict with imports in `knowledgeIngestion.js` and `retriever.js`.
- No documentation changes from this task should be confused with the pre-existing application changes.
- Do not commit or discard the application changes blindly. Review them against `013c693` first.

## 7. Phase 1 Completion Status

Phase 1 is **COMPLETED** as the core CRM foundation. The inspected code contains the relevant models, controllers/routes, frontend pages/API wrappers, role navigation, seed data, and workflow support. Phase 1 includes:

- React/Vite frontend and Express/Mongoose backend.
- MongoDB Atlas persistence.
- JWT authentication and bcrypt password hashing.
- Role and record scoping for Main Admin, Block Admin, Resident, Technician, Security, and Facility Manager.
- Core residential, maintenance, billing, operations, reporting, and audit modules.
- Seeded demo records and an end-to-end complaint-to-payment demonstration flow.

This completion statement applies to the committed Phase 1/Phase 2 baseline. The current dirty working tree requires repair before another build can be considered verified.

## 8. Completed Features

The following are **COMPLETED** in the committed baseline:

- Community, block, apartment, resident, and technician management.
- Ticket creation, detail, comments, escalation, SLA fields/tracking, assignment, status changes, and reopen flow.
- Work orders and technician-oriented work views.
- Monthly/repair billing and manual payment recording.
- Visitor/security workflow.
- Vehicle and parking allocation management.
- Amenity catalogue, booking, and approval flow.
- Notices and document metadata.
- Inventory and stock usage.
- Reports and CSV export.
- Audit log storage and admin viewing.
- Role-specific frontend navigation and backend authorization.
- Seeded CRM and knowledge demonstration data.
- Complaint analysis, safe rule fallback, technician recommendation, SLA prediction, basic collective incidents, grounded knowledge answers, chatbot reads/limited writes, and two-step Excel import.

## 9. Backend Architecture

The backend is an ES module Express application started from `backend/src/server.js`. It loads environment variables, connects to MongoDB through `backend/src/config/db.js`, mounts REST route modules under `/api`, and applies centralized not-found/error handling.

Architecture layers:

- Routes authenticate and authorize requests, then call controllers.
- Controllers coordinate request validation, role scoping, models, services, and response formatting.
- Mongoose models persist CRM, AI, import, knowledge, and audit data.
- AI modules isolate Claude calls, response parsing, fallbacks, scoring, and retrieval.
- Existing services/controllers, rather than Claude, perform database writes.
- `backend/src/seed/seed.js` resets and creates demonstration data; run it only against the intended development database.

Current API families include auth, users, reference data, tickets, bills, dashboards, communities, blocks, apartments, residents, work orders, visitors, vehicles, parking slots, amenities, bookings, notices, documents, inventory, reports, audit logs, AI, knowledge, chatbot, and import. Incident and notification routes exist only in unfinished local work and are **PARTIAL**.

## 10. Frontend Architecture

The frontend is a React/Vite single-page application. `frontend/src/App.jsx` declares route-level access, `Layout`/`Sidebar` provide role-specific navigation, and `frontend/src/api/` contains resource-specific API wrappers around the authenticated API client.

Verified page groups:

- **COMPLETED:** Login; Main Admin, Block Admin, Resident, Technician/Security views; tickets; complaint creation; billing; CRM management pages; reports and audit logs.
- **COMPLETED/PARTIAL:** AI Insights, Collective Incidents, Knowledge Support, and AI Chatbot pages exist and are connected to the committed Phase 2 APIs.
- **PENDING:** Dedicated incident detail/lifecycle UI, image complaint upload experience, complete chatbot action/confirmation UI, and production notification center.

The legacy `frontend/src/data/mockData.js` remains, but the primary integrated flow uses backend APIs.

## 11. MongoDB Collections and Relationships

MongoDB’s default `_id` is the primary key for every collection. The application also uses domain identifiers such as `userId`, `communityId`, `blockId`, `apartmentId`, `residentId`, `technicianId`, `ticketId`, `workOrderId`, and `billId` to connect records.

Actual model files found:

- **COMPLETED Phase 1:** `User`, `Community`, `Block`, `Apartment`, `Resident`, `Technician`, `Ticket`, `WorkOrder`, `Bill`, `Visitor`, `Vehicle`, `ParkingSlot`, `Amenity`, `AmenityBooking`, `Notice`, `Document`, `InventoryItem`, and `AuditLog`.
- **COMPLETED Phase 2 baseline:** `AIConversation`, `BulkImport`, `Incident`, `KnowledgeDocument`, and `KnowledgeChunk`.
- **PARTIAL/uncommitted:** `ChatbotConfirmation` and `Notification` models currently exist as untracked files and must be reviewed before adoption.

Typical relationships:

- User/resident → apartment → block → community.
- Ticket → resident/apartment/block/community and optionally technician/work order/bill/incident.
- Work order → ticket and assigned technician.
- Bill → ticket/resident/apartment/block/community.
- Vehicle → resident/apartment/parking slot.
- Booking → resident and amenity.
- Knowledge chunks → knowledge document; retrieved context may be supplemented with allowed CRM entities.

Mongoose does not provide SQL-style foreign-key enforcement here; controllers and services must validate references and user scope.

## 12. Authentication and Roles

- **COMPLETED:** JWT login and authenticated API access.
- **COMPLETED:** Password hashing with bcrypt.
- **COMPLETED:** Protected frontend routes and backend role authorization.
- **COMPLETED:** Roles: `MAIN_ADMIN`, `BLOCK_SUB_ADMIN`, `RESIDENT`, `TECHNICIAN`, `SECURITY`, and `FACILITY_MANAGER`.
- **COMPLETED:** Main Admin has global scope; Block Admin is restricted to the assigned block; Resident is restricted to personal records; technician/security/facility access is module-specific.
- **PARTIAL/uncommitted:** Password onboarding fields and additional login rate limiting/security work exist locally but are not yet verified.
- **PENDING:** Complete temporary-password, forced-change, reset, activation, and invitation workflow.

## 13. Current CRM Workflows

### Resident complaint workflow — **COMPLETED**

Resident logs in → creates a complaint/ticket → Block Admin or Main Admin reviews it → admin comments, escalates, or manages SLA details → admin assigns a technician or creates a work order → technician views and updates assigned work → resident/admin tracks progress → a chargeable bill can be generated → manual payment can be recorded → reports and audit logs reflect the activity.

### Visitor/security workflow — **COMPLETED**

Resident/admin creates a visitor record → security views scoped visitor details → visitor status/check-in/check-out information is updated → actions are retained in operational/audit data.

### Parking/vehicle workflow — **COMPLETED**

Vehicle records and parking slots are managed → vehicles/residents are linked to slots → admins track availability and allocation.

### Amenity workflow — **COMPLETED**

Resident requests a booking → authorized admin/facility role approves or rejects → booking state and charge are tracked.

### Billing workflow — **COMPLETED**

Authorized user generates a monthly or repair bill → manual payment is recorded → payment status changes → reporting/CSV output and audit records can be reviewed.

## 14. AI / Phase 2 Current Status

Phase 2 is **PARTIAL overall**.

- **COMPLETED:** Claude client abstraction, JSON parsing, safe fallback rules, complaint category/severity/safety/missing-information/action/confidence analysis.
- **COMPLETED:** Deterministic technician scoring with AI-assisted explanation; recommendations do not auto-assign.
- **COMPLETED:** On-demand SLA risk prediction.
- **COMPLETED:** Basic collective incident detection using recent ticket similarity rules.
- **PARTIAL:** Incident lifecycle management beyond initial detection/grouping.
- **PARTIAL:** GraphRAG-style knowledge support uses stored documents, chunks, keyword retrieval, CRM graph context, sources, and safety warnings; real vector retrieval is not complete.
- **PARTIAL:** AI chatbot supports intent detection, permissions, reads, and selected confirmed actions; the full CRUD catalogue is not implemented.
- **COMPLETED baseline / PARTIAL production readiness:** Excel preview-and-confirm import exists, but transactional writes and stronger file protections remain pending.
- **PENDING:** Claude Vision/image complaint analysis, vendor recommendation, proactive SLA monitoring, real embeddings/Atlas Vector Search, AI reanalysis/human correction, and feedback analytics.

## 15. Planned Claude AI Integration

The core Claude integration is **COMPLETED** through these existing files:

- `backend/src/ai/claudeClient.js`
- `backend/src/ai/claudePrompts.js`
- `backend/src/ai/claudeJsonParser.js`
- `backend/src/ai/aiFallbackRules.js`

Required design rules:

- Claude performs reasoning only; controllers/services validate and execute.
- The key is read only from `backend/.env` via `ANTHROPIC_API_KEY` and is never sent to the frontend.
- Claude responses must be structured JSON and schema/range checked before persistence.
- Missing keys, API failures, timeouts, or invalid JSON must trigger deterministic fallback behavior.
- Claude must never receive authority to write directly to MongoDB.
- Sensitive output requires human review, authorization, confirmation, and audit history.

Further hardening of request timeouts, response validation, observability, and model-version reporting is **PARTIAL** in the dirty working tree.

## 16. Planned GraphRAG Design

The intended hybrid design combines:

1. Knowledge documents and chunked text.
2. Semantic/vector retrieval when enabled.
3. Keyword fallback retrieval.
4. Authorized CRM graph context such as tickets, blocks, apartments, technicians, related history, and safety guidance.
5. Claude generation constrained to the supplied context.
6. Source references, confidence, and safety warnings in the response.

Current status:

- **COMPLETED:** Knowledge document/chunk models, ingestion path, keyword retrieval, graph context builder, and grounded answer generation exist in the committed baseline.
- **PARTIAL/BLOCKED locally:** `embeddingService.js` and `vectorStore.js` are deleted in the working tree although imports remain.
- **PENDING:** Production embeddings, Atlas Vector Search index/query implementation, retrieval evaluation, and role-scoped source-level authorization tests.

If context is insufficient, the answer must state that the knowledge base does not contain enough information.

## 17. Planned AI Chatbot and CRUD Tools

The chatbot is a safe CRM operation assistant, not an autonomous database agent.

Current status:

- **COMPLETED:** Authenticated message endpoint, conversation support, intent detection, permission guard, tool router, audit events, read/query intents, and selected confirmation-based operations in the committed baseline.
- **COMPLETED:** Main Admin prompt-based creation of a block was previously validated through the governed confirmation path, not through direct Claude database access.
- **PARTIAL/uncommitted:** `chatbotCrudTools.js`, `confirmationStore.js`, persistent confirmation model, and expanded action routing exist locally but are unfinished/unverified.
- **PENDING:** Complete, tested CRUD tools for complaints, notices, bills, visitors, bookings, ticket status, assignment, apartments, residents, and all listed report/incident queries.

Every write action must require an authenticated user, role permission, validated entities, preview/confirmation where sensitive, execution through an existing controller/service, and an audit log.

## 18. Planned Bulk Excel Import Flow

Expected safe flow:

Main Admin uploads Excel → chatbot/import endpoint identifies the request → backend verifies Main Admin permission → parser validates workbook and rows → preview reports valid rows, errors, duplicates, and warnings → no records are created during preview → Main Admin confirms → backend services create block/apartments/residents/users and optional vehicle/parking records → audit log records the outcome.

Status:

- **COMPLETED:** Multer/XLSX parsing, validation, preview, stored import state, explicit confirmation, and creation service exist in the committed Phase 2 baseline.
- **PARTIAL:** Additional workbook/row limits and parser safeguards are present in unfinished local changes.
- **PENDING:** MongoDB transaction wrapping, malware scanning hook, comprehensive MIME/file-signature validation, robust rollback, and full automated integration coverage.

Claude may detect `BULK_CREATE_BLOCK_RESIDENTS` and extract the block name, but it must not insert raw rows or bypass the import service.

## 19. Planned Image Complaint Analysis

- **PENDING:** Uploading complaint images and sending safe image content to Claude Vision.
- **PARTIAL/uncommitted:** Attachment controller, image upload middleware, ticket attachment fields/routes, and related frontend form/detail changes exist locally but have not been verified as a complete flow.
- **PENDING:** File signature validation, malware scan hook, secure storage strategy, image retention policy, authorization tests, and image-analysis result validation.

The intended design is: authenticated complaint upload → backend file validation → safe storage/reference → Claude Vision analysis → strict structured result validation → merge as a recommendation into ticket AI analysis → human review for safety-sensitive output → audit log. Images and API keys must never be embedded in logs.

## 20. Planned Incident Management Lifecycle

- **COMPLETED:** Basic automatic/manual collective incident detection and ticket linking exist in the committed Phase 2 baseline.
- **PARTIAL/uncommitted:** Expanded incident model, controller, routes, and notification-related files exist locally.
- **PENDING:** Fully tested lifecycle states, merge/split, reassignment of linked tickets, resolution/reopen flow, timeline/history, role-scoped incident detail UI, notifications, confidence/proximity/asset-aware similarity, and end-to-end audit coverage.

Recommended lifecycle: detected → admin review → confirmed/merged/dismissed → active mitigation → resolved → optionally reopened. Ticket links and audit history should remain immutable enough for review.

## 21. Security and Validation Requirements

- **COMPLETED:** JWT authentication, bcrypt hashing, role checks, record scoping, environment-based secrets, CORS, and central error handling.
- **PARTIAL/uncommitted:** Helmet, global/login rate limits, restrictive CORS logic, request IDs, sanitization, Zod helpers, AI timeout/message limits, file size/row limits, and readiness endpoint.
- **PENDING:** Comprehensive per-route schemas, consistent object-level authorization tests, secure refresh/reset strategy if required, complete password onboarding, malware scanning integration, security regression tests, and production secret rotation procedures.

Required controls:

- Rate limiting and login-attempt limiting.
- Helmet security headers and restrictive production CORS.
- Request correlation IDs without leaking sensitive values.
- Chatbot message length limits and AI request timeouts.
- MIME, extension, file-signature, filename, workbook, sheet, and row validation.
- MongoDB transactions for multi-record imports.
- Temporary passwords, forced password change, reset, invitation placeholder, and account activation status.
- No `.env`, credentials, tokens, database URIs, uploaded sensitive data, or API keys in Git or logs.

## 22. Testing Status and Required Tests

- **COMPLETED (limited):** `backend/src/tests/aiFallback.test.js` exists, and backend `package.json` maps `npm test` to Node’s test runner.
- **PARTIAL:** Historical manual validation covered login roles and the principal CRM/AI demonstration flows at the committed baseline.
- **PENDING:** Backend integration tests for authentication, authorization, CRUD, ticket/work-order/billing, incidents, chatbot confirmation, import rollback, knowledge access, uploads, and AI fallback.
- **PENDING:** Frontend component/E2E setup; Playwright or Cypress is not currently configured.
- **PENDING:** CI execution, coverage reporting, load tests, security tests, and production smoke tests.

The current dirty tree was not built or tested during this documentation-only task. Repair the missing RAG modules before treating any test result as representative of the whole working tree.

## 23. Deployment Readiness

Deployment readiness is **PENDING**.

The repo has local development commands, environment examples, a health endpoint, and an uncommitted readiness endpoint. It does not contain a verified production deployment configuration covering all of the following:

- Backend and frontend hosting.
- Production environment/secret management.
- Separate production MongoDB database and indexes.
- HTTPS and trusted proxy configuration.
- Central logging, monitoring, alerting, and request tracing.
- Scheduled backups and restore testing.
- Health/readiness/liveness checks wired to deployment infrastructure.
- CI/CD, automated migrations/index creation, and rollback documentation.

## 24. Environment Variables

Only variable names and safe placeholders are documented. Never copy real values into this file or Git.

Backend (`backend/.env`, ignored):

```dotenv
PORT=<backend-port>
MONGODB_URI=<mongodb-connection-string>
CLIENT_URL=<allowed-frontend-origin>
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=<token-duration>
ANTHROPIC_API_KEY=<server-side-api-key>
CLAUDE_MODEL=<claude-model-name>
AI_PROVIDER=<provider-name>
AI_FALLBACK_ENABLED=<true-or-false>
AI_REQUEST_TIMEOUT_MS=<milliseconds>
CHATBOT_MAX_MESSAGE_LENGTH=<character-limit>
RATE_LIMIT_WINDOW_MINUTES=<minutes>
RATE_LIMIT_MAX_REQUESTS=<request-count>
LOGIN_RATE_LIMIT_MAX=<attempt-count>
MAX_IMAGE_UPLOAD_MB=<megabytes>
MAX_EXCEL_UPLOAD_MB=<megabytes>
MAX_EXCEL_ROWS=<row-count>
MAX_EXCEL_SHEETS=<sheet-count>
EMBEDDING_PROVIDER=<provider-name>
EMBEDDING_MODEL=<embedding-model-name>
MONGODB_VECTOR_INDEX_NAME=<atlas-index-name>
VECTOR_SEARCH_ENABLED=<true-or-false>
SLA_MONITOR_ENABLED=<true-or-false>
SLA_MONITOR_INTERVAL_MINUTES=<minutes>
```

Frontend (`frontend/.env`, ignored):

```dotenv
VITE_API_BASE_URL=<backend-api-base-url>
```

The minimum original CRM configuration uses `PORT`, `MONGODB_URI`, `CLIENT_URL`, `JWT_SECRET`, and `JWT_EXPIRES_IN`. AI configuration is optional because fallback rules keep core ticket analysis operational. The remaining production-oriented variables are represented in the current environment example but some depend on unfinished local code.

## 25. Local Setup Instructions

Use separate terminals. Create local `.env` files from the examples and supply only development credentials. Never run the seed command against production because it deletes and recreates collections.

Backend:

```bash
cd backend
npm install
npm run seed
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend production build:

```bash
cd frontend
npm run build
```

Backend tests:

```bash
cd backend
npm test
```

Only the limited AI fallback test is configured. Broad automated tests are **PENDING**. For the current dirty tree, first resolve the missing RAG files or return to a reviewed stable baseline before starting the applications.

## 26. How to Demo the Current Product

Use the seeded development database and role accounts described by the project’s demo documentation; do not put credentials in this handover.

1. Start MongoDB-connected backend and the frontend.
2. Log in as Resident and create a safety-sensitive complaint such as water leakage near an electrical switchboard.
3. Open the ticket to show category, severity, safety flag, suggested action, confidence, provider/fallback metadata, and human-review warning.
4. Log in as Block Admin/Main Admin; review the ticket, generate technician recommendations, and show that no technician is auto-assigned.
5. Manually assign a technician, create/view a work order, and update its progress using the authorized role.
6. Generate a bill, record a manual payment, and show reports/audit history.
7. Demonstrate visitor/security, vehicle/parking, amenity booking, notice, document metadata, and inventory pages.
8. Demonstrate AI Insights, SLA risk, collective incidents, knowledge support, and safe chatbot reads.
9. For bulk onboarding, upload a valid sample workbook, show the preview, prove that preview creates nothing, then confirm using Main Admin and review the audit log.
10. Repeat a complaint analysis without a configured Claude key to demonstrate deterministic fallback behavior.

Use commit `013c693` or a repaired/reviewed descendant for a presentation. Do not demo the currently dirty tree until its import failures and partial files are resolved.

## 27. Pending Work

Highest priority:

1. **PARTIAL:** Review, repair, test, then commit/push the latest stable local fixes; do not commit the dirty tree as-is.
2. **PENDING:** Image-based complaint analysis.
3. **PENDING:** Real vector embeddings and MongoDB Atlas Vector Search.
4. **PARTIAL:** Complete chatbot CRUD tools.
5. **PARTIAL:** Complete incident management lifecycle.

AI improvements:

6. **PENDING:** AI reanalysis and human correction.
7. **PENDING:** Proactive SLA monitoring.
8. **PENDING:** Vendor recommendation.
9. **PENDING:** Better incident similarity using embeddings, proximity, time scoring, asset relationships, and confidence.
10. **PENDING:** AI feedback analytics.

Security and reliability:

11. **PARTIAL:** Strong request validation.
12. **PARTIAL:** API protection: rate limiting, login limiting, Helmet, restrictive CORS, correlation IDs, chatbot length limits, and AI timeout.
13. **PARTIAL:** Safer file processing: MIME/signature checks, sanitized filenames, workbook limits, and malware scan hook.
14. **PENDING:** Transactional bulk imports with MongoDB transactions.
15. **PARTIAL:** Password onboarding: temporary password, forced change, reset, invitation placeholder, and activation status.

Testing and deployment:

16. **PENDING:** Automated backend integration tests.
17. **PENDING:** Frontend E2E tests.
18. **PENDING:** Production backend/frontend deployment, environment management, production MongoDB, HTTPS, logging, monitoring, backups, and deployment health checks.

## 28. Recommended Next Implementation Order

1. Commit current fixes if any.
2. Security and validation foundation.
3. Incident lifecycle management.
4. Complete chatbot CRUD tools.
5. Transaction-based Excel import.
6. Password onboarding.
7. Image complaint upload and Claude Vision.
8. Atlas Vector Search and real embeddings.
9. Proactive SLA alerts.
10. Vendor recommendation.
11. Better incident similarity.
12. AI reanalysis and human correction.
13. AI feedback analytics.
14. Backend integration tests.
15. Frontend E2E tests.
16. Deployment and monitoring documentation.
17. Final UI/UX polish.

## 29. Instructions for Future AI Coding Agents

- Read this handover document first.
- Inspect actual code before modifying.
- Do not remove Phase 1 functionality.
- Do not bypass authentication or authorization.
- Do not let Claude directly write to MongoDB.
- Use backend services/controllers for CRUD.
- Validate all inputs and all Claude outputs.
- Require confirmation for sensitive chatbot actions.
- Add audit logs for all AI-assisted actions.
- Keep fallback logic when Claude API is unavailable.
- Do not commit secrets.
- Keep changes small and test after each major feature.
- Prefer production-safe implementation over demo-only shortcuts.
- Before any implementation, inspect `git status`, `git diff`, and commit `013c693`; preserve unrelated user changes.
- Resolve or restore the missing RAG modules before running the current working tree.
- Never run `npm run seed` without confirming that `MONGODB_URI` points to the intended disposable development database.
- Keep Phase 2’s authority boundary explicit: Claude reasons; authenticated backend code validates, authorizes, confirms, persists, and audits.

## 30. Known Limitations

- The current working tree is not a verified build and contains a known missing-module problem in the RAG path.
- Several security, upload, incident, notification, password, and chatbot files exist only as partial/untracked local work.
- Keyword retrieval is the dependable current knowledge fallback; production vector search is not implemented.
- Image complaint/Claude Vision support is not complete.
- Collective incident detection is rule-oriented and lacks production-grade lifecycle management and semantic/geospatial scoring.
- SLA prediction is on demand; proactive scheduled alerts are not verified as complete.
- Chatbot CRUD coverage is incomplete.
- Excel import is not transactionally atomic and needs deeper file-security controls.
- Test coverage is minimal; no frontend E2E framework is configured.
- No production deployment, monitoring, backups, or CI/CD configuration was verified.
- Seed execution is destructive to the configured database collections.
- Some status assertions are based on static code inspection and the known committed baseline; the current dirty tree was intentionally not executed during this documentation-only task.
