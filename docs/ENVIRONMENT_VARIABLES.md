# SafeHome-RAG Environment Variables Reference

This document provides a comprehensive list of all environment variables supported by the backend and frontend services.

---

## Backend (`backend/.env`)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Number | `5000` | Port on which the Express REST API listens. |
| `MONGODB_URI` | String | `mongodb://localhost:27017/safehome-rag` | MongoDB connection string. Supports Atlas replica sets for transactions. |
| `CLIENT_URL` | String | `http://localhost:5173` | Allowed frontend origin for CORS. Multiple origins separated by commas. |
| `JWT_SECRET` | String | *Required* | Strong random secret key used for signing JWT tokens. |
| `JWT_EXPIRES_IN` | String | `7d` | Lifetime of issued JWT authentication tokens. |
| `ANTHROPIC_API_KEY` | String | Optional | Server-side Anthropic API key for Claude 3.5 Sonnet. |
| `CLAUDE_MODEL` | String | `claude-3-5-sonnet-20241022` | Claude model version identifier for reasoning & vision. |
| `AI_PROVIDER` | String | `claude` | Active AI provider (`claude` or `rules`). |
| `AI_FALLBACK_ENABLED` | Boolean | `true` | When true, automatically falls back to deterministic rule engine upon API error. |
| `AI_REQUEST_TIMEOUT_MS` | Number | `10000` | Maximum timeout before fallback activates (10 seconds). |
| `CHATBOT_MAX_MESSAGE_LENGTH` | Number | `1000` | Maximum permitted characters in a single chatbot prompt. |
| `RATE_LIMIT_WINDOW_MINUTES` | Number | `15` | Window for Express rate limiting. |
| `RATE_LIMIT_MAX_REQUESTS` | Number | `300` | General API request ceiling per IP per window. |
| `LOGIN_RATE_LIMIT_MAX` | Number | `10` | Maximum failed login attempts before throttling IP. |
| `MAX_IMAGE_UPLOAD_MB` | Number | `5` | Maximum image size for ticket photo attachments in megabytes. |
| `MAX_EXCEL_UPLOAD_MB` | Number | `5` | Maximum Excel spreadsheet size for bulk onboarding in megabytes. |
| `MAX_EXCEL_ROWS` | Number | `1000` | Maximum rows permitted in bulk onboarding spreadsheets. |
| `MAX_EXCEL_SHEETS` | Number | `3` | Maximum sheet tabs allowed in bulk workbooks. |
| `EMBEDDING_PROVIDER` | String | `local-hash` | Vector embedding engine (`local-hash` or external provider). |
| `EMBEDDING_MODEL` | String | `feature-hash-64d` | Dimension representation for local vector calculations. |
| `MONGODB_VECTOR_INDEX_NAME` | String | `vector_index` | Name of Atlas Vector Search index on `knowledgechunks` collection. |
| `VECTOR_SEARCH_ENABLED` | Boolean | `false` | When true, attempts Atlas `$vectorSearch` before falling back to cosine search. |
| `SLA_MONITOR_ENABLED` | Boolean | `true` | Activates background scheduled SLA proactive monitoring cron job. |
| `SLA_MONITOR_INTERVAL_MINUTES` | Number | `15` | Frequency of proactive SLA deadline recalculation sweeps. |

---

## Frontend (`frontend/.env`)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | String | `/api` | Base URL for REST API endpoints consumed by Vite client. |
