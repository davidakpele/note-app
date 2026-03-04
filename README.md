# Notes API

RESTful Notes application built with **Node.js**, **Express**, and **PostgreSQL**, following a clean **Controller → Service → Repository** architecture.

---

## Architecture

```
HTTP Request
     │
     ▼
┌──────────────────────┐
│  requestLogger       │  src/middleware/requestLogger.js
└──────────┬───────────┘
           │
     ▼
┌──────────────────────┐
│  Security & CORS     │  helmet, cors
│  Rate Limiters       │  express-rate-limit (global + write)
│  Body Parser         │  express.json({ limit: '10kb' })
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Router + Validator  │  src/routes/notes.js
│  Sanitizer           │  src/middleware/sanitize.js
│                      │  src/validators/noteValidator.js
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Controller          │  src/controllers/notesController.js
│  HTTP in → HTTP out  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Service             │  src/services/notesService.js
│  Business logic      │
│  Throws AppError     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Repository          │  src/repositories/notesRepository.js
│  Raw SQL only        │
└──────────┬───────────┘
           │
           ▼
      PostgreSQL
    (connection pool)
```

---

## Project Structure

```
notes-api/
├── src/
│   ├── server.js
│   ├── app.js
│   ├── controllers/
│   │   └── notesController.js
│   ├── services/
│   │   └── notesService.js
│   ├── repositories/
│   │   └── notesRepository.js
│   ├── routes/
│   │   └── notes.js
│   ├── validators/
│   │   └── noteValidator.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   ├── requestLogger.js
│   │   └── sanitize.js
│   ├── utils/
│   │   └── AppError.js
│   └── db/
│       ├── pool.js
│       └── migrate.js
├── tests/
│   ├── unit/
│   │   ├── notesRepository.test.js
│   │   └── notesService.test.js
│   └── integration/
│       ├── notes.test.js
│       └── rateLimit.test.js
├── .env.example
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── jest.config.json
└── package.json
```

---

## Setup

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 2. Install
```bash
npm install
```

### 3. Configure
```bash
cp .env.example .env
# edit .env with your credentials
```

### 4. Create the database
```bash
psql -U postgres -c "CREATE DATABASE notes_db;"
```

### 5. Run migrations
```bash
npm run migrate
```

### 6. Start
```bash
npm run dev    # development (nodemon)
npm start      # production
```

---

## Docker

Runs migrations automatically before starting the server.

```bash
# Build and start everything (API + PostgreSQL)
docker compose up --build

# Background
docker compose up --build -d

# Logs
docker compose logs -f api

# Tear down
docker compose down

# Tear down + wipe database volume
docker compose down -v
```

---

## Environment Variables

```dotenv
# Server
PORT=8292
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=notes_db
DB_USER=postgres
DB_PASSWORD=yourpassword

# Connection pool
DB_POOL_MAX=10
DB_POOL_MIN=2
DB_IDLE_TIMEOUT=30000
DB_CONN_TIMEOUT=5000

# Rate limiting
RATE_LIMIT_PER_MINUTE=100
WRITE_RATE_LIMIT_PER_MINUTE=30

# CORS — comma-separated allowed origins. Empty = allow all (dev only)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## Tests

No real database needed — each layer is independently mocked.

```bash
npm test                  # all tests
npm run test:unit         # repository + service only
npm run test:integration  # HTTP + rate limit tests
```

### Test strategy

| File | Layer mocked | What it tests |
|------|-------------|---------------|
| `unit/notesRepository.test.js` | pg pool | Raw SQL queries |
| `unit/notesService.test.js` | repository | Business logic, AppError throws |
| `integration/notes.test.js` | service | Full HTTP pipeline, status codes, response shape |
| `integration/rateLimit.test.js` | service | Global limiter, write limiter, header behaviour |

---

## API Reference

**Base URL:** `http://localhost:8292`

### Health
```
GET /health
→ 200 { "status": "ok", "timestamp": "..." }
```

---

### Create a Note
```
POST /api/notes
Content-Type: application/json
```
| Field | Required | Rules |
|-------|----------|-------|
| `title` | ✅ | max 255 characters |
| `content` | ❌ | free text |

**201 Created**
```json
{
  "status": "success",
  "data": {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "title": "My Note",
    "content": "Optional body",
    "created_at": "2024-01-15T10:00:00.000Z",
    "updated_at": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### Get All Notes
```
GET /api/notes
→ 200 { "status": "success", "count": 2, "data": [ ...notes ] }
```

---

### Get a Note
```
GET /api/notes/:id
→ 200  note found
→ 404  note not found
→ 400  invalid UUID
```

---

### Update a Note
```
PUT /api/notes/:id
Content-Type: application/json
→ 200  updated note
→ 404  note not found
→ 422  validation error
```

---

### Delete a Note
```
DELETE /api/notes/:id
→ 200  { "status": "success", "message": "Note <id> deleted successfully" }
→ 404  note not found
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad request / invalid UUID |
| 404 | Not found |
| 422 | Validation failed |
| 429 | Too many requests |
| 500 | Unexpected server error |

---

## Security

### Security Headers (helmet)

| Header | Value | Protects against |
|--------|-------|-----------------|
| `Content-Security-Policy` | strict `'self'` only | XSS, injections |
| `Strict-Transport-Security` | 1 year + preload | SSL stripping |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `X-Frame-Options` | `deny` | Clickjacking |
| `X-XSS-Protection` | enabled | Legacy XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Data leakage |
| `Cross-Origin-*` | `same-origin` | Cross-origin isolation |

### CORS
Controlled by `ALLOWED_ORIGINS` in `.env`. Only listed origins are allowed in production. Credentials, `X-Request-Id`, and rate limit headers are explicitly exposed.

### Rate Limiting

| Limiter | Routes | Default |
|---------|--------|---------|
| Global | All requests | 100 req/min |
| Write | POST, PUT, DELETE | 30 req/min |

Exceeding either limit returns a JSON `429` response. Both limits are configurable via `.env` with no code changes.

### Input Sanitization
All write request bodies pass through `sanitize.js` before validation — strips null bytes and trims whitespace on every string field.

### Connection Limiting
The PostgreSQL pool is capped at `DB_POOL_MAX` connections (default 10). Idle connections are dropped after `DB_IDLE_TIMEOUT` ms (default 30s). New connection attempts timeout after `DB_CONN_TIMEOUT` ms (default 5s), preventing thread exhaustion under load.

### Body Size Limit
Payloads over 10kb are rejected outright — blocks payload flood attacks.

---

## Request Logging

Every request is logged as a structured JSON record after the response finishes:

```json
{
  "timestamp": "2026-03-03T20:47:14.925Z",
  "level": "INFO",
  "requestId": "a1b2c3d4-...",
  "method": "GET",
  "url": "/api/notes",
  "statusCode": 200,
  "duration": "4.21ms",
  "ip": "::1",
  "userAgent": "PostmanRuntime/7.36",
  "contentLength": 312
}
```

| Level | Status codes |
|-------|-------------|
| `INFO` | 2xx, 3xx |
| `WARN` | 4xx |
| `ERROR` | 5xx |

- `INFO` / `WARN` → `stdout`
- `ERROR` → `stderr`
- Silent in `NODE_ENV=test` to keep test output clean
- `X-Request-Id` header echoed back on every response for client-side tracing

---

## Error Response Shape

Every error — validation, 404, rate limit, database, or unexpected crash — returns the same envelope:

```json
{
  "status": "error",
  "statusCode": 404,
  "error": "Not Found",
  "message": "Note with id abc not found",
  "timestamp": "2026-03-03T20:47:14.925Z"
}
```

In `NODE_ENV=development`, unexpected 500 errors additionally include `details.stack` for debugging. In production, internals are never exposed.

---

## Design Decisions

- **Controller / Service / Repository split** — each layer has exactly one responsibility. Swapping `pg` for an ORM only touches the repository.
- **Raw SQL with `pg`** — explicit, readable, no ORM magic.
- **UUID primary key** — avoids exposing sequential IDs.
- **DB trigger for `updated_at`** — guarantees accuracy regardless of how rows are updated.
- **AppError** — shaped error class with HTTP status code; keeps controllers and services clean.
- **`createApp()` factory** — the Express app accepts injected config so tests can run with tiny rate limits without hitting real thresholds.
- **Fresh `MemoryStore` per app instance** — prevents rate limit state from bleeding between test suites running in the same process.
- **Layered test strategy** — each layer mocks only the one directly below it for precise, fast isolation.