# SafeHome-RAG Phase 1 API

Node.js and Express REST API backed by MongoDB Atlas. It provides JWT authentication, role-scoped operational data, Mongoose validation, consistent JSON responses, and audit logging.

## Configure and run

Copy `.env.example` to `.env` and replace the placeholders:

```env
PORT=5000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER_URL/safehome_rag
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=8h
```

Then run:

```bash
npm install
npm run seed
npm run dev
```

Use `npm start` for a production-style process and `npm run check` for the entry-point syntax check. Never commit `.env`.

## Response format

Success responses use `{ "success": true, "data": ... }`. Errors use `{ "success": false, "error": { "message": "..." } }` with an appropriate HTTP status.

Except for health, demo-user discovery, and login, endpoints require `Authorization: Bearer <token>`.

## API groups

| Group | Routes |
| --- | --- |
| Health and auth | `GET /api/health`, `POST /api/auth/login`, `GET /api/auth/me` |
| Users and references | `GET /api/users`, `GET /api/users/demo`, `GET /api/reference` |
| Property records | CRUD `/api/communities`, `/api/blocks`, `/api/apartments`, `/api/residents` |
| Tickets | list/detail/create plus `assign`, `status`, `comments`, `reopen`, and `escalate` actions under `/api/tickets` |
| Work orders | `GET/POST /api/work-orders`, `PATCH /api/work-orders/:id/status` |
| Billing | list/create, status, monthly generation, and resident history under `/api/bills` |
| Visitors | CRUD plus `PATCH /api/visitors/:id/approve` and `/exit` |
| Parking | CRUD `/api/vehicles`, CRUD `/api/parking-slots`, and parking assignment |
| Amenities | CRUD `/api/amenities`, CRUD `/api/amenity-bookings`, and booking status |
| Communications | CRUD `/api/notices` and metadata-only `/api/documents` |
| Inventory | CRUD `/api/inventory` plus `POST /api/inventory/:id/use` |
| Dashboards | main admin, block admin, and resident views under `/api/dashboard` |
| Analytics | ticket, billing, technician, resident, and SLA endpoints under `/api/reports` |
| Accountability | `GET /api/audit-logs` (Main Admin) |

## Access model

`MAIN_ADMIN` has global access. `BLOCK_SUB_ADMIN` and `SECURITY` are constrained to their assigned block. `RESIDENT` is constrained to personal records, while `TECHNICIAN` is constrained to assigned work. `FACILITY_MANAGER` can operate maintenance resources globally. Mutation routes add audit records.

## Seed data

The repeatable seed resets Phase 1 collections and creates Green Valley Residency, Blocks A/B, apartments, six role accounts, three technicians, a safety-risk ticket, repair bill, visitor, vehicle and slots, amenities and a booking, notice, document metadata, inventory, and an initial audit event. The demo password is `Demo@123`.

No real AI API, GraphRAG, chatbot, payment gateway, or binary file storage is included in Phase 1.
