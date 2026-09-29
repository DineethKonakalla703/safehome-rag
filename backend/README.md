# SafeHome-RAG Priority 2 API

The backend is a Node.js/Express REST API backed by MongoDB Atlas and Mongoose. It persists the Priority 2 demo workflow while keeping authentication deliberately simple.

## Architecture

- `src/config` — MongoDB connection and status
- `src/models` — Mongoose schemas for users, community data, operations, billing, and audit history
- `src/controllers` — request validation, role filtering, workflows, and dashboard aggregation
- `src/routes` — REST route definitions
- `src/utils` — deterministic analysis, response helpers, serializers, and audit helpers
- `src/seed` — repeatable demo dataset
- `src/server.js` — Express application entry point

API responses consistently use either:

```json
{ "success": true, "data": {} }
```

or:

```json
{ "success": false, "error": { "message": "..." } }
```

## Environment

Copy `.env.example` to `.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER_URL/safehome_rag
CLIENT_URL=http://localhost:5173
```

Create a MongoDB Atlas cluster, create a database user, permit your development IP, and use a URI whose database is `safehome_rag`. Do not commit `.env`.

## Install and run

```bash
npm install
npm run seed
npm run dev
```

Production-style start:

```bash
npm start
```

## Endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API and MongoDB status |
| GET | `/api/users` | All demo users |
| GET | `/api/users/demo` | Login role cards |
| GET | `/api/reference` | Communities, blocks, apartments, technicians |
| GET | `/api/tickets` | Role-filtered ticket list |
| GET | `/api/tickets/:ticketId` | Role-filtered ticket detail |
| POST | `/api/tickets` | Create and classify a complaint |
| PATCH | `/api/tickets/:ticketId/assign` | Assign a technician and audit the action |
| PATCH | `/api/tickets/:ticketId/status` | Update status and audit the action |
| GET | `/api/bills` | Role-filtered bill list |
| POST | `/api/bills` | Create one bill per ticket and audit the action |
| GET | `/api/dashboard/main-admin` | Global summary |
| GET | `/api/dashboard/block-admin/:blockId` | Restricted block summary |
| GET | `/api/dashboard/resident/:residentId` | Personal resident summary |

Ticket and bill lists accept `role`, `userId`, and `blockId` query parameters. These demonstrate server-side scoping but are not a replacement for authenticated authorization.

## Seed behavior

`npm run seed` clears the demo collections and recreates the canonical Priority 2 dataset, including `TK001`, `BILL001`, and the four demo users. Running it more than once does not create duplicates.

## Priority 2 limitations

- Demo role selection; no JWT or password authentication
- Query-based role context is for review only
- Deterministic rules instead of a real AI service
- No payment gateway, uploads, notifications, or GraphRAG
- MongoDB Atlas is required for persistent operation

These controls should be replaced by authenticated server-side authorization in a production phase.

