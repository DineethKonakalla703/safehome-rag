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

## Mobile app (iOS & Android)

`mobile/` is a native app built with Expo SDK 58 and Expo Router. It uses the same backend, the same accounts and the same role rules as the web app.

| Tab | Resident | Security | Technician | Facility Manager / Admins |
|---|---|---|---|---|
| Home | Dues, open requests, parcels waiting, quick actions, SOS | Visitors inside, expected guests, parcels, staff on premises | Assigned and in-progress jobs | Key numbers, maintenance due, shortcuts |
| Requests | Raise and follow complaints, chat with the team | — (hidden) | Start / resolve jobs | Update status, comment |
| Gate | Invite guests (gate pass you can share), parcel pickup codes | Verify pass, allow entry, mark exit, log parcels, hand over with code | — (hidden) | Admins: same as security; FM hidden |
| Copilot | The same Claude agent as the web, streamed live, with Approve / Decline for any change, an "Open" button for pages it points to, and optional read-aloud | | | |
| More | Bills, society accounts, move in/out, staff & help, parcels, maintenance, notices, events (RSVP), polls (vote), forum, SOS, notifications, sign out — each shown only to roles that can use it | | | |

Run it (the backend must be running):

```bash
cd mobile
npm install
npx expo start
```

- **Phone:** install Expo Go, connect the phone to the same Wi-Fi as your computer, and scan the QR code. The app works out the API address from the dev server (`http://<your-computer-ip>:5000/api`). Allow Node through the Windows firewall on port 5000 if the phone can't connect.
- **Emulator / browser:** press `a` (Android emulator, uses `10.0.2.2`), `i` (iOS simulator) or `w` (web preview at `http://localhost:8081`).
- **Another network or a deployed backend:** copy `mobile/.env.example` to `mobile/.env` and set `EXPO_PUBLIC_API_URL`. Everything with the `EXPO_PUBLIC_` prefix is bundled into the app, so never put secrets there. The Claude key stays on the backend.
- **Store builds:** `npx eas-cli@latest build --platform android` (or `ios`) after `eas login`. App id: `com.safehome.residences`. The icon, adaptive icon and splash screen are already set up in `mobile/app.json`.

Sign-in tokens are kept in the device keychain (expo-secure-store). Demo-account shortcuts appear on the login screen in development builds only.

## Brand & design

- **Mark:** a navy shield with a brass roofline and a keyhole doorway. Files are in `frontend/public/brand/`: `safehome-mark.svg` (for light backgrounds), `safehome-mark-reversed.svg` (for dark backgrounds), `safehome-app-icon.svg`, and PNG sizes 64–512. The app icons are in `mobile/assets/`.
- **Palette:** ink navy `#0F1A2C`, brushed brass `#B8924A` / `#C9A45C`, warm ivory `#F5F3EE`.
- **Type:** Fraunces for display headings and Manrope for the interface.
- **Where it lives:** web tokens in `frontend/src/styles/theme.css`; mobile tokens in `mobile/src/theme.js`.
- **Using a different logo** (for example one generated in ChatGPT): replace the SVG/PNG files with the same names. For mobile, also replace `icon.png` (1024×1024), `adaptive-icon.png` (mark centred on a transparent 1024 canvas), `splash-icon.png`, `mark.png` and `mark-reversed.png` in `mobile/assets/`.

## AI Copilot (automation layer)

A Claude-powered operator is built into every screen (floating button, `Ctrl+K`, or the mic / `Alt+V` for voice). It can search, create, update and delete records, run workflows, read analytics and navigate the app, always with the signed-in user's permissions and an approval step before changes. After login it gives a start-of-session briefing and opens the most useful page. See [docs/AI_COPILOT.md](docs/AI_COPILOT.md).

## Community, safety & operations modules

| Module | Page | Who | What it does |
|---|---|---|---|
| Staff & domestic help | `/staff` | Residents register their own help; admins and security manage everyone | Gate pass code per staff member, police-verification flag, check-in/out at the gate desk, "inside now" status, and a notification to the employing resident on every entry and exit |
| Society accounts | `/accounts` | Main Admin and FM write; block admins read; residents and security see the summary | Income/expense ledger with fixed categories, monthly chart, category breakdown, balance. Paid resident bills count as income automatically, and outstanding dues are shown |
| Polls & voting | `/polls` | Managers create; residents and admins vote | Polls, surveys and resolutions; one vote per apartment (changeable until close), live results, optional closing date, community-wide or one block |
| Events | `/events` | Managers create; everyone RSVPs | Calendar grouped by month, Going/Maybe/Not Going with guests, capacity limits, attendee list for organisers, cancel/complete |
| Emergency SOS | red **SOS** button on every page, plus `/sos` | Anyone raises; security, admins and FM respond | Choose an emergency type, then security/admins/FM are notified at once. A pulsing banner shows on every responder screen until the alert is acknowledged and resolved, with a timeline. Duplicate presses within 2 minutes are merged |
| Move-in / move-out | `/move-requests` | Residents (or admins on their behalf) request; block/main admins approve; security completes | Books the service lift by time slot and refuses clashes. Before approving a move-out it checks for unpaid bills (an admin can override). Approval informs security. Completing a move sets the apartment to Occupied or Vacant and records the resident's move date |
| Parcels & deliveries | `/parcels` | Security logs and hands over; residents see their own | Security logs the courier and the parcel's location. The resident is notified with a 4-digit pickup code and must show it to collect. Parcels can also be marked as returned |
| Preventive maintenance / AMC | `/maintenance` | Main Admin and FM manage; technicians record services; block admins view | Schedules for lifts, generators, pumps, fire systems and more, each marked Overdue, Due Soon or On Track, plus AMC renewal alerts. Recording a service sets the next due date; if an admin or FM enters a cost, it also adds a ledger expense. An hourly check reminds the facility manager |
| Forum & marketplace | `/forum` | Everyone except technicians | Discussion, buy/sell with prices, lost & found, recommendations and requests for help. Supports replies and likes. Admins post announcements, pin posts and hide them (the author is told why) |

The AI Copilot knows all of these modules. Examples: "register my new cook Ramesh, 98xxxxxx, 7–9 AM", "what's our balance this year and the biggest expense?", "create a poll on EV chargers with Yes/No", "RSVP me for Diwali with 2 guests", "check in pass code STK3F9QA", "log an Amazon parcel for A102", "which maintenance is overdue?", "approve MV003".

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
