# SafeHome Copilot (AI automation layer)

SafeHome Copilot turns the platform into an AI-operated workspace. Users can chat or talk to it, and it can search records, create, update and delete them, run workflows (assign technicians, change statuses, approve visitors, generate bills…), read analytics, answer knowledge-base questions, and move the user to the right screen.

## How it works

```
Browser (Copilot panel, voice) ──SSE──▶ POST /api/agent/chat
                                          │  Claude tool-use loop (backend/src/ai/agent/agentRunner.js)
                                          ▼
                     tools.js ──loopback HTTP as the signed-in user──▶ existing REST API
```

- **The same permissions as the UI.** Every tool call goes through the platform's own REST endpoints with the user's JWT, so role checks, block/resident scoping, validation and audit logs are unchanged. The agent cannot do anything the user couldn't do by clicking.
- **Approval before changes.** Creates, updates, deletes and workflow actions pause the run and show an approval card ("Approve" / "Decline", or say "yes" / "no"). The conversation resumes from exactly where it stopped. *Autopilot* (settings) skips approval for routine changes; deletes and bulk billing always ask.
- **Bulk build from one sentence.** "Create 4 communities, each with 3 blocks of 10 apartments" becomes one `bulk_build` plan (a tree with counts, templates like `{n}` / `{letter}` and parent links like `@parent.blockId`). The plan is checked against the totals Claude intends (`expected_totals`) and sent back to Claude if they don't match. You then see the record counts and approve once, even with Autopilot on. Progress streams live, and a result card shows every created community → block → apartment with IDs and links. Max 500 records per run.
- **Navigation.** The `navigate` tool moves the user's app to any page their role can open (`PAGES` in `catalog.js`), including detail pages like `/tickets/TK004`.
- **Start-of-session briefing.** After login the Copilot opens, checks what needs attention for the user's role, summarises the top priorities and navigates to the best starting page. It can be turned off in Copilot settings; the sunrise button runs it on demand.
- **Voice.** Mic button, navbar mic, or `Alt+V` for speech input (Chrome/Edge Web Speech API). Replies are read aloud for voice requests; *Hands-free* mode keeps listening after each reply.
- **Audit.** Every turn writes `AI_AGENT_TURN`, every approved change `AI_AGENT_ACTION_APPROVED`, plus the normal per-record audit entries.

## Files

| Area | File |
| --- | --- |
| Resources, actions, reports, page allow-list | `backend/src/ai/agent/catalog.js` |
| Tool schemas + execution | `backend/src/ai/agent/tools.js` |
| Claude loop, approvals, session persistence | `backend/src/ai/agent/agentRunner.js` |
| API (SSE) | `backend/src/controllers/agentController.js`, `routes/agentRoutes.js` |
| Conversation storage | `backend/src/models/AgentSession.js` |
| Frontend state, voice, briefing, navigation | `frontend/src/ai/CopilotContext.jsx`, `useVoice.js` |
| UI (floating drawer + `/ai-chatbot` page) | `frontend/src/ai/CopilotPanel.jsx`, `copilot.css` |

## Extending it

- New CRUD resource → add an entry to `RESOURCES` in `catalog.js` (path, id field, verbs, model for schema hints).
- New workflow → add to `ACTIONS` (method, path, `write`, `destructive`, `roles`).
- New screen → add the route to `PAGES` for the roles that can open it.

## Community modules in the catalog

`catalog.js` exposes the community and operations modules to the agent:

- **Resources:** `staff`, `ledger-entries`, `polls`, `events`, `sos-alerts` (read-only; alerts are raised through the action).
- **Actions:** `staff_check_in`, `staff_check_out` (the id may be a pass code), `poll_vote`, `poll_close`, `event_rsvp`, `sos_raise`, `sos_acknowledge`, `sos_resolve`.
- **More resources:** `move-requests`, `parcels` (list only), `maintenance-schedules`, `forum-posts`.
- **More actions:** `move_approve` (move-outs with unpaid dues need `overrideDues`), `move_reject`, `move_complete`, `move_cancel`, `parcel_log`, `parcel_collect` (needs the resident's code), `parcel_return`, `maintenance_mark_done`, `forum_comment`, `forum_like`.
- **Report:** `accounts`, which returns `/accounts/summary` over 12 months.

Every write still goes through the approval card. The dynamic context gives the current time in IST and converts every UTC timestamp in tool results to IST (`toIst` in `tools.js`) before the model sees it, so dates near midnight are not off by one day. Pickup codes, vote lists, RSVPs, entry logs and service history are left out of the schema the model sees.

## Configuration (`backend/.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | — | Required for the Copilot |
| `CLAUDE_MODEL` | `claude-sonnet-4-6` | Model for the agent and other AI features |
| `AGENT_MAX_STEPS` | 12 | Max tool round-trips per turn |
| `AGENT_MAX_TOKENS` | 4096 | Max output tokens per model call |
| `AGENT_RATE_LIMIT_MAX` | 120 | Copilot requests per client per 15 minutes |

The previous intent-classifier chatbot is still available at `/ai-chatbot/classic` (it hosts the bulk Excel resident import).
