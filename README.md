# SafeHome-RAG

SafeHome-RAG is a review-ready Priority 1 college-project prototype for residential complaint management, maintenance coordination, and billing. Its sophisticated responsive dashboard demonstrates one complete workflow with a React frontend, mock data, rule-based AI simulation, and browser localStorage.

## Priority 1 scope

The prototype supports demo login, role-aware dashboards, complaint creation, rule-based safety analysis, block-restricted ticket access, technician assignment, ticket status changes, demo bill generation, and automatically updated dashboard summaries.

It intentionally does **not** include a backend, database, real authentication, file upload, payment gateway, external API, real AI model, or GraphRAG.

## Technology

- React + Vite
- React Router
- Lucide React icons
- Plain CSS
- `mockData.js` and `localStorage`

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown by Vite. Verify a production build with `npm run build`.

## Demo users

| Role | Demo identity | Email |
| --- | --- | --- |
| Main Admin | Main Admin | admin@safehome.com |
| Block Sub Admin | Block A Admin | blocka.admin@safehome.com |
| Resident | Resident One | resident1@safehome.com |
| Technician | Technician Suresh | technician@safehome.com |

The login screen is a role picker; no password is required.

## Suggested demo flow

1. Enter as Main Admin and review the community dashboard.
2. Log out and enter as Resident One.
3. Create a complaint with: “Water is leaking near the electrical switchboard in A-102.”
4. Review the high-risk rule-based analysis on the ticket.
5. Log in as Block A Admin and open the new Block A ticket.
6. Assign Suresh, update the status to In Progress, and generate a demo bill.
7. Open Billing and return to the dashboard to show updated summaries.

## Current features

- Protected client-side routes and role-based navigation
- Main Admin, Block Admin, Resident, and Technician views
- Role-based ticket and bill filtering
- Four deterministic complaint-analysis rules
- Persistent ticket, timeline, assignment, status, and bill changes
- Responsive desktop and mobile layout
- Polished SaaS-style dashboards, case-file ticket details, status badges, and billing summaries
- Seeded review data and safe empty states

## Future phases

Priority 2 can introduce an Express API, secure authentication, server-side authorization, and MongoDB Atlas. Later phases may add uploads, notifications, payments, analytics, and retrieval-augmented AI. These are deliberately outside this MVP.

See [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for the review walkthrough.

