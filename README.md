# SafeHome-RAG

SafeHome-RAG is a full-stack residential operations CRM for communities, blocks, apartments, residents, maintenance, billing, visitors, parking, amenities, notices, documents, inventory, reporting, and audit history.

This repository contains the completed Phase 1 CRM plus a governed Phase 2 intelligence layer. Claude performs optional reasoning, while authenticated backend services retain validation, authorization, confirmation, persistence, and audit responsibility. When Claude is unavailable or unconfigured, deterministic fallback logic keeps the core CRM operational.

## Project Handover

A complete handover document for future development is available at:

[docs/PROJECT_HANDOVER.md](docs/PROJECT_HANDOVER.md)

This file contains the current project status, completed features, architecture, pending Phase 2 AI work, environment variables, setup steps, and recommended next implementation order.

## Stack

- React 18, Vite, React Router, Lucide icons, and plain CSS
- Node.js, Express, MongoDB Atlas, and Mongoose
- JWT authentication and bcrypt password hashing
- REST APIs with server-side role and record scoping
- Anthropic Claude SDK with JSON validation and safe deterministic fallbacks
- Keyword retrieval plus CRM graph context for practical GraphRAG-style answers
- Multer and XLSX for preview-before-confirmation bulk onboarding

## Local setup

1. Copy `backend/.env.example` to `backend/.env` and configure Atlas plus a strong `JWT_SECRET`. `ANTHROPIC_API_KEY` is optional; never expose it to the frontend or commit it.
2. Optionally copy `frontend/.env.example` to `frontend/.env`; the default API URL is already `http://localhost:5000/api`.
3. Install, seed, and start both applications:

```bash
cd backend
npm install
npm run seed
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. All seeded accounts use `Demo@123` for local review.

## Demo identities

| Role | Email |
| --- | --- |
| Main Admin | `admin@safehome.com` |
| Block A Admin | `blocka.admin@safehome.com` |
| Resident One | `resident1@safehome.com` |
| Technician Suresh | `technician@safehome.com` |
| Security Officer | `security@safehome.com` |
| Facility Manager | `facility@safehome.com` |

The login page retains four review shortcuts while also accepting credentials directly.

## Phase 1 capabilities

- Community, block, apartment, resident, owner, and tenant records
- Complaint tickets, comments, SLA, escalation, reopen, technician assignment, and work orders
- Monthly and repair bills, manual payment status, receipts, and due dates
- Visitor approvals/check-out, vehicle registration, and parking assignment
- Amenity catalogue, resident booking, and admin approval
- Notices, document metadata, maintenance inventory, and stock usage
- Scoped dashboards, operational reports, CSV export, and audit logs
- Main Admin, Block Admin, Resident, Technician, Facility Manager, and Security access rules

## Phase 2 capabilities

- Claude-assisted complaint category, severity, safety risk, missing-information, action and confidence analysis
- Deterministic fallback analysis when Claude is missing, unavailable, or invalid
- Ranked technician recommendations that never auto-assign
- SLA breach-risk prediction and collective incident detection
- Knowledge ingestion, keyword retrieval, CRM graph context, grounded answers, sources and safety warnings
- Permission-controlled CRM chatbot with confirmations and audit events
- Two-step Excel onboarding: validated preview followed by explicit Main Admin confirmation
- Provider, model, confidence, fallback, human-review and audit governance fields

See [backend/README.md](backend/README.md), [docs/PHASE_2_AI_LAYER.md](docs/PHASE_2_AI_LAYER.md), and [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md).
