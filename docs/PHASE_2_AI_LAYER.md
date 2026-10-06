# Phase 2 AI Layer

Phase 2 extends the existing CRM; it does not replace Phase 1 controllers, authorization, validation, persistence, or audit behavior.

## Flow

1. Authenticated user initiates a supported request.
2. Claude optionally returns structured JSON reasoning.
3. Backend validates the JSON and uses deterministic fallback when it is missing or invalid.
4. Backend checks role and record scope.
5. Sensitive operations require confirmation or human approval.
6. Existing services write MongoDB records and audit events.

Implemented features include complaint intelligence, technician recommendations, SLA prediction, incident detection, knowledge support, a permission-controlled chatbot, and two-step Excel onboarding.

Claude never receives MongoDB credentials and never writes directly to MongoDB.
