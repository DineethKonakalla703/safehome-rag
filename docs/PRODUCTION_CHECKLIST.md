# SafeHome-RAG Production Deployment Checklist

This checklist verifies all technical, security, database, and operational prerequisites before promoting SafeHome-RAG to production.

---

## 1. Secrets & Authentication Hygiene
- [ ] Strong random `JWT_SECRET` generated (min 32 bytes entropy).
- [ ] No `.env` files committed to Git (verified via `git status` and `.gitignore`).
- [ ] `ANTHROPIC_API_KEY` stored securely in environment secrets manager / KMS.
- [ ] Default demo passwords replaced in production databases.
- [ ] Passwords hashed with bcrypt (salt factor 12).
- [ ] `mustChangePassword` enforced for newly onboarded resident accounts.

---

## 2. API & Network Hardening
- [ ] HTTPS enforced across both frontend and API domains with TLS 1.3 certificates.
- [ ] `CLIENT_URL` configured strictly with production origin (no wildcard `*`).
- [ ] Helmet HTTP headers active (`X-Content-Type-Options`, `X-Frame-Options`, CSP).
- [ ] Global API rate limiting active (`300 requests / 15 min`).
- [ ] Login rate limiting active (`10 failed attempts / 15 min`).
- [ ] Request correlation IDs (`x-request-id`) logged on all API requests.

---

## 3. Database & Persistence (MongoDB Atlas)
- [ ] MongoDB connection uses TLS/SSL (`+srv` protocol).
- [ ] Dedicated non-root database user with role-scoped permissions.
- [ ] Unique indices verified:
  - `users.email` (unique)
  - `users.userId` (unique)
  - `tickets.ticketId` (unique)
  - `knowledgechunks.chunkId` (unique)
  - `vendors.vendorId` (unique)
- [ ] Atlas Vector Search index configured on `knowledgechunks` (`vector_index`, 64 or 1536 dimensions).
- [ ] Multi-document ACID transactions tested on replica set.
- [ ] Automated daily Atlas snapshot backups enabled with 7-day retention.

---

## 4. File Processing & Upload Security
- [ ] Image uploads limited to 5 MB with JPEG/PNG/WebP magic byte verification.
- [ ] Uploaded image paths sanitized and stored under UUID filenames.
- [ ] Excel uploads limited to 5 MB, 1,000 rows, 3 sheets with formula rejection.
- [ ] Persistent storage volume mounted for `/uploads` in container environments.

---

## 5. Background Jobs & Resilience
- [ ] SLA proactive monitoring cron job active (`node-cron` every 15 min).
- [ ] AI fallback rules active when Claude API is unreachable or times out.
- [ ] Central error handler logs errors without leaking stack traces to clients.
- [ ] Health and readiness probes (`/api/health`, `/api/readiness`) wired to container orchestrator.

---

## 6. Testing & Build Verification
- [ ] Backend test suite passes (`npm test`, 100% pass rate).
- [ ] Frontend production build passes cleanly (`npm run build`).
- [ ] Docker container images build cleanly (`docker-compose build`).
