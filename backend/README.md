# SafeHome-RAG Phase 2 API

Node.js and Express API backed by MongoDB Atlas. Phase 2 preserves the Phase 1 CRM and adds Claude-assisted complaint intelligence, deterministic technician and SLA scoring, collective incident detection, grounded knowledge support, a permission-controlled CRM chatbot, and two-step Excel onboarding.

Claude performs reasoning only. Authenticated backend controllers enforce authorization, validate data, request confirmation for sensitive actions, perform database writes, and create audit logs. If Claude is unavailable, complaint classification and chatbot routing continue with safe deterministic rules.

## Configure and run

Copy `.env.example` to `.env`, keep it private, and replace the placeholders:

```env
PORT=5000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER_URL/safehome_rag
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=3d
ANTHROPIC_API_KEY=
CLAUDE_MODEL=claude-3-5-sonnet-latest
AI_PROVIDER=claude
AI_FALLBACK_ENABLED=true
```

`ANTHROPIC_API_KEY` is optional for the fallback demo. It is read only by the backend and must never be exposed to Vite or committed.

```bash
npm install
npm run seed
npm run check
npm run dev
```

Use `npm start` for a production-style process. The default API URL is `http://localhost:5000/api`.

## Response and access model

Success responses use `{ "success": true, "data": ... }`. Errors use `{ "success": false, "error": { "message": "..." } }` with an appropriate HTTP status. Except for health, demo-user discovery, and login, endpoints require `Authorization: Bearer <token>`.

`MAIN_ADMIN` has community-wide access. `BLOCK_SUB_ADMIN` and `SECURITY` are constrained to their assigned block. `RESIDENT` is constrained to personal records, `TECHNICIAN` to assigned work, and `FACILITY_MANAGER` to operational resources. AI routes reuse these scopes.

## API groups

| Group | Routes |
| --- | --- |
| Health and auth | `GET /api/health`, `POST /api/auth/login`, `GET /api/auth/me` |
| Core CRM | Existing users, references, properties, tickets, work orders, billing, visitors, parking, amenities, notices, documents, inventory, reports, dashboards, and audit routes |
| AI insights | `GET /api/ai/insights`, `POST /api/ai/recommend-technicians`, `POST /api/ai/predict-sla-risk` |
| Incidents | `GET /api/ai/incidents`, `POST /api/ai/detect-incidents` |
| Human review | `PATCH /api/ai/tickets/:ticketId/review` |
| Knowledge | `POST/GET /api/knowledge/documents`, `GET /api/knowledge/documents/:documentId`, `POST /api/knowledge/query` |
| Chatbot | `POST /api/chatbot/message` |
| Excel onboarding | `POST /api/import/preview-block-residents`, `POST /api/import/confirm-block-residents` |

## Bulk import safety

Only Main Admin can upload an `.xlsx` or `.xls` workbook. Preview validates required headers and rows and stores a temporary import record; it does not create CRM records. Confirmation uses the preview ID and creates only validated, non-duplicate data. Required columns are `flat_number`, `floor_number`, `resident_name`, and `phone`.

## Seed data

The repeatable seed resets demo collections and creates Green Valley Residency, Blocks A/B, all six roles, residents, technicians with workload/rating data, a high-risk ticket, a normal ticket, billing and operational records, plus four knowledge documents and their searchable chunks. The demo password is `Demo@123`.

See `../docs/PHASE_2_AI_LAYER.md` and the focused design documents in `../docs` for architecture, governance, GraphRAG, chatbot, Claude, and bulk-import details.
