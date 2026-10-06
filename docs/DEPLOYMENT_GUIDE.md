# SafeHome-RAG Production Deployment Guide

This guide describes how to configure, deploy, and operate the SafeHome-RAG system in production environments.

---

## 1. Architecture Overview

- **Frontend:** React 18 SPA built with Vite, served via Nginx or Cloudflare/Vercel.
- **Backend:** Node.js/Express REST API containerized with Docker, executing behind a reverse proxy (Nginx / Cloudflare / Traefik).
- **Database:** MongoDB Atlas M10+ cluster with replica set support (required for transactions) and Atlas Vector Search index.
- **AI & Fallback:** Anthropic Claude 3.5 Sonnet client with zero-downtime deterministic fallback rules.
- **Background Tasks:** Node-cron scheduled SLA monitoring and proactive escalations.

---

## 2. Environment Variables Checklist

### Backend (`backend/.env`)

```dotenv
# Server & Security
PORT=5000
NODE_ENV=production
CLIENT_URL=https://app.yourcommunity.com
JWT_SECRET=generate_with_openssl_rand_hex_64
JWT_EXPIRES_IN=3d

# Database (Must be a MongoDB replica set or Atlas cluster)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/safehome_rag?retryWrites=true&w=majority

# Anthropic Claude Intelligence
ANTHROPIC_API_KEY=sk-ant-api03-...
CLAUDE_MODEL=claude-3-5-sonnet-latest
AI_PROVIDER=claude
AI_FALLBACK_ENABLED=true
AI_REQUEST_TIMEOUT_MS=30000
CHATBOT_MAX_MESSAGE_LENGTH=2000

# Rate Limiting & Protection
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX_REQUESTS=300
LOGIN_RATE_LIMIT_MAX=10

# Upload Safeguards
MAX_IMAGE_UPLOAD_MB=5
MAX_EXCEL_UPLOAD_MB=5
MAX_EXCEL_ROWS=1000
MAX_EXCEL_SHEETS=3

# Embeddings & Vector Search
EMBEDDING_PROVIDER=local
EMBEDDING_MODEL=feature-hash-v1
MONGODB_VECTOR_INDEX_NAME=knowledge_vector_index
VECTOR_SEARCH_ENABLED=false

# Proactive SLA Monitoring
SLA_MONITOR_ENABLED=true
SLA_MONITOR_INTERVAL_MINUTES=15
```

### Frontend (`frontend/.env`)

```dotenv
VITE_API_BASE_URL=https://api.yourcommunity.com/api
```

---

## 3. MongoDB Atlas Indexes

To ensure peak performance under concurrent workloads, ensure the following compound and unique indexes exist:

1. **Users:**
   - `{ userId: 1 }` (unique)
   - `{ email: 1 }` (unique)
   - `{ communityId: 1, blockId: 1, role: 1 }`
2. **Tickets:**
   - `{ ticketId: 1 }` (unique)
   - `{ communityId: 1, blockId: 1, status: 1 }`
   - `{ residentId: 1 }`
   - `{ assignedTechnicianId: 1 }`
   - `{ slaDueDate: 1 }`
3. **Incidents:**
   - `{ incidentId: 1 }` (unique)
   - `{ communityId: 1, blockId: 1, status: 1 }`
4. **Knowledge Chunks:**
   - `{ chunkId: 1 }` (unique)
   - `{ documentId: 1 }`
   - **Vector Search Index (JSON definition):**
     ```json
     {
       "fields": [
         {
           "numDimensions": 64,
           "path": "embedding",
           "similarity": "cosine",
           "type": "vector"
         }
       ]
     }
     ```

---

## 4. Containerized Deployment (Docker Compose)

To build and start both containers with Docker Compose:

```bash
# 1. Provide production environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your production secrets

# 2. Start services
docker compose up -d --build

# 3. View logs
docker compose logs -f backend
```

---

## 5. Health & Readiness Endpoints

The backend exposes two dedicated operational endpoints:

- **Liveness:** `GET /api/health`
  - Returns `200 OK` with service uptime, timestamp, and database state.
- **Readiness:** `GET /api/readiness`
  - Returns `200 OK` when MongoDB is actively connected and ready for traffic.
  - Returns `503 Service Unavailable` if MongoDB is reconnecting or down.

---

## 6. Backup & Recovery

- **Automated Snapshots:** Configure MongoDB Atlas Continuous Cloud Backups (retaining 7 daily snapshots).
- **Uploaded Complaint Images:** Persistent volume at `/app/uploads/tickets` should be backed up to object storage (AWS S3 or equivalent) nightly.
- **Disaster Recovery:**
  ```bash
  # Restore MongoDB Atlas snapshot
  mongorestore --uri="mongodb+srv://cluster.mongodb.net" --archive="safehome_backup.gz" --gzip
  ```
