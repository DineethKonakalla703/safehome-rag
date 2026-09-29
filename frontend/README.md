# SafeHome-RAG Frontend

This is the review-ready Priority 1 interface: a responsive residential CRM dashboard powered by mock data, localStorage, and deterministic AI simulation rules. It has no backend or database; Priority 2 may introduce an API and MongoDB Atlas.

## Setup

```bash
npm install
npm run dev
```

Create a production bundle with:

```bash
npm run build
```

## Routes

- `/login` — demo role picker
- `/main-admin/dashboard` — global dashboard
- `/block-admin/dashboard` — Block A dashboard
- `/resident/dashboard` — resident summary
- `/resident/create-complaint` — complaint form
- `/tickets` — role-filtered tickets
- `/tickets/:id` — ticket workflow and analysis
- `/billing` — role-filtered billing

All application routes except `/login` require a user selected on the demo login screen. Data changes are stored in the browser under `safehome_tickets` and `safehome_bills`.

