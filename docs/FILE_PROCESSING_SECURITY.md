# SafeHome-RAG File Processing & Security Guide

This document describes the security architecture and defensive controls governing file uploads across the SafeHome-RAG platform (Excel bulk onboarding workbooks and resident complaint image attachments).

---

## 1. Threat Model & Upload Vectors

SafeHome-RAG processes two categories of user uploads:
1. **Spreadsheets (`.xlsx`, `.xls`):** Uploaded by Main Admins during community and resident onboarding.
2. **Images (`.jpg`, `.jpeg`, `.png`, `.webp`):** Uploaded by Residents and Admins during complaint submission or ticket progress updates.

Potential attack vectors mitigated:
- Malicious executable upload disguised with fake extensions.
- Formula injection / CSV injection (`=CMD|' /C ...'!A0`).
- Denial of Service via deeply nested XML "Zip Bombs" or billion laughs.
- Unsanitized path traversal filenames (`../../etc/passwd`).
- Memory exhaustion via massive workbooks or multi-gigabyte images.
- Unauthenticated file access or arbitrary database alteration.

---

## 2. Spreadsheet Processing Controls (`excelParser.js`)

All Excel ingestion executes through strict multi-layer validation before any database preview is generated:

### 2.1 File Signature (Magic Bytes) Verification
Raw file buffers are inspected for valid Office file signatures:
- **Zip-based OOXML (`.xlsx`):** Byte header `[0x50, 0x4B]` (`PK..`).
- **OLE Compound Document (`.xls`):** Byte header `[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]`.
Files lacking these valid signatures are rejected immediately with HTTP 400.

### 2.2 Workbook & Complexity Limits
- **Max File Size:** Defaults to 5 MB (`MAX_EXCEL_UPLOAD_MB`).
- **Sheet Limit:** Maximum 3 sheets per workbook (`MAX_EXCEL_SHEETS`). Extra sheets trigger HTTP 400.
- **Row Limit:** Maximum 1,000 rows per sheet (`MAX_EXCEL_ROWS`).
- **Cell Size Limit:** Any cell exceeding 10,000 characters is rejected to protect memory buffers.

### 2.3 Formula Injection Mitigation
Every parsed cell is examined. If `cell.f` is present (indicating an Excel formula), the entire workbook is rejected with:
`"Excel formulas are not allowed."`
Only raw alphanumeric data is accepted.

### 2.4 Transactional Isolation
- Ingestion is separated into **Preview** and **Confirm** steps.
- Preview never writes to MongoDB.
- Confirmation executes within a MongoDB replica-set transaction session with automatic rollback upon any partial failure.

---

## 3. Image Processing Controls (`imageUpload.js` & `attachmentController.js`)

Image uploads for maintenance complaints undergo server-side validation:

### 3.1 MIME & Extension Strict Whitelist
Allowed MIME types and extensions:
- `image/jpeg` (`.jpg`, `.jpeg`)
- `image/png` (`.png`)
- `image/webp` (`.webp`)

### 3.2 Binary Signature Validation
Uploaded binary streams are checked using `validImageSignature()`:
- **JPEG:** Header begins with `0xFF, 0xD8, 0xFF`.
- **PNG:** Header begins with `0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A`.
- **WEBP:** Header contains `RIFF....WEBP`.

Files failing magic byte inspection are deleted from disk immediately (`fs.unlink`) and an error is returned.

### 3.3 Path Sanitization & UUID Storage
- Original filenames are sanitized to prevent directory traversal:
  `safeOriginalName = path.basename(name).replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 120)`
- Files are saved on disk with crypto-random UUIDs (`${Date.now()}-${crypto.randomUUID()}.${ext}`).
- Absolute server paths are never exposed to clients; only relative public mount points (`/uploads/tickets/...`) are returned.

### 3.4 AI Vision Pipeline Guard
Image buffers passed to Claude Vision are sent as base64 strings only after size and signature validation. If Claude Vision is unreachable or returns invalid schema data, deterministic fallbacks ensure ticket workflow continuity without crashing.
