# SafeHome-RAG

SafeHome-RAG is a full-stack residential operations CRM for communities, blocks, apartments, residents, maintenance, billing, visitors, parking, amenities, notices, documents, inventory, reporting, and audit history.

This repository now contains the Phase 1 core product: a sophisticated React dashboard connected to an authenticated Express and MongoDB Atlas API. The name describes the long-term project direction; this phase deliberately does **not** include generative AI, GraphRAG, or a chatbot. Complaint classification remains a transparent deterministic rule simulation.

## Stack

- React 18, Vite, React Router, Lucide icons, and plain CSS
- Node.js, Express, MongoDB Atlas, and Mongoose
- JWT authentication and bcrypt password hashing
- REST APIs with server-side role and record scoping

## Local setup

1. Copy `backend/.env.example` to `backend/.env` and configure Atlas plus a strong `JWT_SECRET`.
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

See [backend/README.md](backend/README.md) for the API reference and [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for the review flow.
