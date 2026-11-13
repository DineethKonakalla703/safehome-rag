# Phase 1 Review Demo

Start the seeded backend on port 5000, then start the Vite frontend. All demo users use password `Demo@123`.

1. Sign in as **Main Admin** and show the global database-backed dashboard.
2. Open Communities, Blocks, Apartments, and Residents; add or edit a record to demonstrate authenticated CRUD and audit history.
3. Sign in as **Resident One** and create: “Water is leaking near the electrical switchboard in A-102.”
4. On ticket details, show the rule-based safety flag, SLA, comments, timeline, and resident context.
5. Sign in as **Block A Admin**. Show the restricted Block A dashboard and assign **Suresh — Electrician**. This creates a work order.
6. Sign in as **Technician Suresh**, open Assigned Work Orders, add a completion note, and complete the work.
7. Return as Block Admin, generate a repair bill, open Billing, and mark it paid to create a receipt.
8. As Resident One, register/approve a visitor, add a vehicle, and book an amenity.
9. As Security Officer, demonstrate visitor approval and check-out.
10. As Main Admin, create a notice, review documents and inventory, export reports as CSV, and finish with Audit Logs.

Emphasize that Phase 1 uses JWT authentication, MongoDB persistence, role scoping, and deterministic safety rules. AI APIs, GraphRAG, chatbot, payment gateway, and binary file uploads are intentionally future work.
