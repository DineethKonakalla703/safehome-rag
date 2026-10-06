# Hybrid GraphRAG-style Design

Manual knowledge documents are stored and split into chunks. The current retriever uses deterministic keyword scoring. The embedding field and service adapter are present for a later embedding provider.

Authorized graph context can connect tickets with blocks, apartments and assigned technicians. A knowledge query combines retrieved chunks with role-scoped CRM context, then asks Claude to answer only from that context. When Claude is unavailable, the highest-scoring source is returned as a grounded fallback.

Responses contain `answer`, `sources`, `confidence`, and `safetyWarning`. Insufficient context produces an explicit knowledge-base limitation rather than invented content.
