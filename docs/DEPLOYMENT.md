# SafeHome-RAG Production Deployment

This document provides quick references and deployment instructions for deploying SafeHome-RAG to production environments. For the complete step-by-step container orchestration walkthrough, refer to [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

---

## 1. Quick Docker Compose Launch

For local production evaluation or single-server deployment:

```bash
# 1. Clone repository and navigate to root
cd safehome-rag

# 2. Configure environment variables in backend/.env
cp backend/.env.example backend/.env
# Edit backend/.env with your production MONGODB_URI and JWT_SECRET

# 3. Build and launch services in background
docker-compose up -d --build

# 4. Verify running containers
docker-compose ps

# 5. Check logs
docker-compose logs -f backend
```

Services exposed:
- **Frontend (Nginx reverse proxy):** `http://localhost:80` (or `http://your-server-ip`)
- **Backend API:** `http://localhost:5000` (internal network routing from Nginx via `/api`)

---

## 2. Health & Readiness Verification

Probes available for monitoring:

```bash
# General health check
curl http://localhost:5000/api/health

# Database readiness probe (returns 200 when MongoDB is connected, 503 otherwise)
curl http://localhost:5000/api/readiness
```

---

## 3. Production Architecture

```
[ Clients / Mobile Browsers ]
             │
             ▼ (HTTPS: 443)
┌─────────────────────────────────┐
│     Nginx Reverse Proxy         │ (Static React SPA + TLS Termination)
└────────────────┬────────────────┘
                 │
                 ▼ (Internal Network: /api)
┌─────────────────────────────────┐
│    Node.js Express Backend      │
│  - JWT & Rate Limiting Guard    │
│  - Proactive SLA Cron Job       │
│  - Multi-Resource Controllers   │
└────────┬───────────────┬────────┘
         │               │
         ▼               ▼
┌─────────────────┐  ┌───────────────────────┐
│ MongoDB Atlas   │  │ Anthropic Claude API  │
│ - Replica Set   │  │ - 3.5 Sonnet Vision   │
│ - Vector Search │  │ - Governed Fallbacks  │
└─────────────────┘  └───────────────────────┘
```
