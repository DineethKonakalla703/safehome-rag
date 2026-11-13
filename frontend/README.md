# SafeHome-RAG Frontend

Responsive Phase 1 residential CRM built with React, Vite, React Router, Lucide icons, and plain CSS. It consumes the authenticated backend API for all active screens; the legacy Priority 1 mock utilities remain only as historical prototype fixtures and are not imported by the application flow.

## Setup

Optionally copy `.env.example` to `.env` to override the default API URL:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

```bash
npm install
npm run dev
```

Run `npm run build` to verify the production bundle. Start the backend first; otherwise the UI displays the exact recovery command.

Routes are protected by the stored JWT and role checks. Navigation exposes dashboards, property and resident records, tickets and work orders, billing, visitors, parking, amenities, notices, document metadata, inventory, reports, and audit logs according to the signed-in user's role.
