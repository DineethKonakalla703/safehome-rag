# AI CRM Chatbot Design

The chatbot classifies a message into a fixed allowlist of intents. Backend code normalizes entities, checks role permissions, requests confirmation for sensitive operations, routes only to safe server tools, and records audit events.

Supported read and reasoning flows include tickets, bills, work orders, visitors, reports, technician recommendations, SLA risk and knowledge queries. Bulk onboarding returns an upload and preview workflow. Claude does not call Mongoose and cannot bypass backend scoping.

Unknown or unauthorized requests return safe explanatory responses.
