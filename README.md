# Notes API

RESTful Notes application built with **Node.js**, **Express**, and **PostgreSQL**, following a clean **Controller → Service → Repository** architecture, secured behind an **NGINX reverse proxy** acting as an API Gateway and WAF.

---

## Architecture

```
Client (Browser / Postman)
         │
         │  http://localhost:8000
         ▼
┌─────────────────────────────────┐
│          NGINX Gateway          │  security-firewalls/nginx.conf
│                                 │  security-firewalls/conf.d/notes.conf
│  • WAF — SQLi / XSS / Path     │
│    Traversal / Command injection│
│  • Rate limiting (global+write) │
│  • Bot & null-byte detection    │
│  • Security headers             │
│  • Request ID injection         │
└────────────┬────────────────────┘
             │  proxy_pass  http://api-service:8292
             ▼
┌─────────────────────────────────┐
│       Express Application       │
│                                 │
│  requestLogger                  │  src/middleware/requestLogger.js
│  ──────────────────────────     │
│  Security & CORS (helmet/cors)  │
│  Rate Limiters (express-rate-   │
│    limit: global + write)       │
│  Body Parser (10 kb cap)        │
│  ──────────────────────────     │
│  Router + Validator + Sanitizer │  src/routes/notes.js
│                                 │  src/validators/noteValidator.js
│                                 │  src/middleware/sanitize.js
│  ──────────────────────────     │
│  Controller  (HTTP in/out)      │  src/controllers/notesController.js
│  ──────────────────────────     │
│  Service     (business logic)   │  src/services/notesService.js
│  ──────────────────────────     │
│  Repository  (raw SQL)          │  src/repositories/notesRepository.js
└────────────┬────────────────────┘
             │
             ▼
        PostgreSQL
      (connection pool)
```

---

## Project Structure

```
notes-api/
├── security-firewalls/
│   ├── nginx.conf               # Main nginx config (upstreams, rate zones)
│   ├── conf.d/
│   │   └── notes.conf           # Server block — WAF rules + proxy
│   └── html/                    # Custom error pages (optional)
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
## Architecture Without Nginx
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
npm run dev    # development (nodemon) — direct on :8292
npm start      # production
```

---

## Docker

Runs migrations automatically before starting the server.  
All traffic flows through NGINX on **port 8000**.

```bash
# Build and start everything (NGINX + API + PostgreSQL + Frontend)
docker compose up --build

# Background
docker compose up --build -d

# Logs
docker compose logs -f api
docker compose logs -f nginx-gateway

# Tear down
docker compose down

# Tear down + wipe database volume
docker compose down -v
```

### Service URLs (Docker)

| Service  | Public URL                        | Internal                  |
|----------|-----------------------------------|---------------------------|
| Frontend | `http://localhost:8000`           | `frontend:3000`           |
| API      | `http://localhost:8000/api/notes` | `api-service:8292`        |
| Health   | `http://localhost:8000/health`    | answered by NGINX directly |
| Postgres | internal only                     | `postgres:5432`           |

> The Node.js API is **not exposed directly** in production — all requests pass through NGINX.

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

# Rate limiting (Express layer)
RATE_LIMIT_PER_MINUTE=100
WRITE_RATE_LIMIT_PER_MINUTE=30

# CORS — comma-separated allowed origins. Empty = allow all (dev only)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## Tests

49 tests across 4 suites. No real database needed — each layer is independently mocked.

```bash
npm test                  # all tests
npm run test:unit         # repository + service only
npm run test:integration  # HTTP + rate limit tests
```

### Results

```
Test Suites: 4 passed, 4 total
Tests:       49 passed, 49 total
Time:        2.224 s
```

### Test strategy

| File | Layer mocked | What it tests |
|------|-------------|---------------|
| `unit/notesRepository.test.js` | pg pool | Raw SQL correctness — INSERT, SELECT, UPDATE, DELETE |
| `unit/notesService.test.js` | repository | Business logic, AppError 404 throws |
| `integration/notes.test.js` | service | Full HTTP pipeline, status codes, response shape |
| `integration/rateLimit.test.js` | service | Global limiter, write limiter, header behaviour |

### Unit test coverage

**`notesRepository`** — 10 cases
- `create`: executes INSERT, passes `null` content when omitted
- `findAll`: returns all rows, returns empty array when table is empty
- `findById`: returns matched row, returns `null` when not found
- `update`: executes UPDATE, returns `null` when ID does not exist
- `delete`: returns `true` when deleted, `false` when not found

**`notesService`** — 10 cases
- `createNote`: trims input, calls `repository.create`, passes `null` content when missing
- `getAllNotes`: delegates to repository
- `getNoteById`: returns note when found, throws `AppError(404)` when not found
- `updateNote`: fetches note first then updates with trimmed values, throws 404 when missing
- `deleteNote`: resolves when deleted, throws 404 when not found

---

## API Reference

**Base URL (Docker):** `http://localhost:8000`  
**Base URL (local dev):** `http://localhost:8292`

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

**422 Unprocessable Entity** (missing title)
```json
{
  "status": "error",
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "title is required",
  "timestamp": "2026-03-04T10:00:00.000Z"
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

**404 Not Found**
```json
{
  "status": "error",
  "statusCode": 404,
  "error": "Not Found",
  "message": "Note with id abc not found",
  "timestamp": "2026-03-04T10:00:00.000Z"
}
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

Security is applied in **two layers** — NGINX (gateway) and Express (application).

### Layer 1 — NGINX API Gateway / WAF

All public traffic enters through NGINX on port `8000`. Malicious requests are blocked before they ever reach Node.js.

#### WAF Protection

| Attack type | How it's blocked |
|-------------|-----------------|
| SQL Injection | Regex on URI + query string (`union select`, `drop table`, `sleep()`, etc.) |
| XSS | Blocks `<script>`, `javascript:`, `onerror=`, `eval()`, `<iframe>`, etc. |
| Path Traversal | Blocks `../`, `%2e%2e`, `%252e%252e`, Windows `..\\` variants |
| Command Injection | Blocks null bytes, `\|`, `&&`, backticks, `${}` |
| Sensitive File Access | Blocks `.env`, `.git`, `passwd`, `shadow`, `/proc/`, `.aws` |
| Encoded Attacks | Catches `%2f`, `%5c`, double-encoded `%252f` variants |

All blocked requests are logged to `/var/log/nginx/attacks.log` with full request details.

#### Rate Limiting (NGINX)

| Zone | Limit | Applied to |
|------|-------|-----------|
| `global` | 100 req/min | All requests |
| `write` | 30 req/min | POST, PUT, DELETE |
| `per_ip` | 60 req/min | Per IP connection tracking |

#### Security Headers (NGINX)

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), microphone=()` |

#### Other Gateway Features
- **Request ID** — `X-Request-ID` injected at NGINX and forwarded to Node.js for end-to-end tracing
- **Body size cap** — `10kb` enforced at NGINX before body reaches the application
- **Hidden file block** — any request to `/.` paths (`.env`, `.git`, etc.) blocked at NGINX level
- **Malicious IP map** — `geo $is_malicious` block for manual IP blocklist without reloading config
- **Proxy hardening** — `server_tokens off`, keepalive pooling to upstream, strict timeouts (connect 5s, send/read 10s)
- **Health check** — `/health` answered directly by NGINX, no upstream hit required

---

### Layer 2 — Express Application

Requests that pass NGINX still go through application-level defences.

#### Security Headers (helmet)

| Header | Value | Protects against |
|--------|-------|-----------------|
| `Content-Security-Policy` | strict `'self'` only | XSS, injections |
| `Strict-Transport-Security` | 1 year + preload | SSL stripping |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `X-Frame-Options` | `deny` | Clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Data leakage |
| `Cross-Origin-*` | `same-origin` | Cross-origin isolation |

#### CORS
Controlled by `ALLOWED_ORIGINS` in `.env`. Only listed origins are allowed in production.

#### Rate Limiting (Express)

| Limiter | Routes | Default |
|---------|--------|---------|
| Global | All requests | 100 req/min |
| Write | POST, PUT, DELETE | 30 req/min |

#### Input Sanitization
All write request bodies pass through `sanitize.js` — strips null bytes and trims whitespace on every string field.

#### Connection Limiting
The PostgreSQL pool is capped at `DB_POOL_MAX` connections (default 10). Idle connections are dropped after `DB_IDLE_TIMEOUT` ms. New connection attempts timeout after `DB_CONN_TIMEOUT` ms, preventing thread exhaustion under load.

---

## Request Logging

Every request is logged as structured JSON after the response finishes:

```json
{
  "timestamp": "2026-03-04T20:47:14.925Z",
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

| Level | Status codes | Output |
|-------|-------------|--------|
| `INFO` | 2xx, 3xx | `stdout` |
| `WARN` | 4xx | `stdout` |
| `ERROR` | 5xx | `stderr` |

Silent in `NODE_ENV=test` to keep test output clean.  
NGINX additionally writes to `/var/log/nginx/api.log`, `/var/log/nginx/attacks.log`, and `/var/log/nginx/security_blocked.log`.

---

## Error Response Shape

Every error — validation, 404, rate limit, database, or unexpected crash — returns the same envelope:

```json
{
  "status": "error",
  "statusCode": 404,
  "error": "Not Found",
  "message": "Note with id abc not found",
  "timestamp": "2026-03-04T20:47:14.925Z"
}
```

In `NODE_ENV=development`, unexpected 500 errors additionally include `details.stack`. In production, internals are never exposed.

---

## Design Decisions

- **NGINX as API Gateway** — WAF and rate limiting at the network edge, keeping the Node.js app lean and focused on business logic.
- **Two-layer security** — NGINX blocks known attack patterns; Express handles application-level validation and sanitization. Neither layer trusts the other blindly.
- **Controller / Service / Repository split** — each layer has exactly one responsibility. Swapping `pg` for an ORM only touches the repository.
- **Raw SQL with `pg`** — explicit, readable, no ORM magic. Parameterised queries prevent SQL injection at the driver level.
- **UUID primary key** — avoids exposing sequential IDs.
- **DB trigger for `updated_at`** — guarantees timestamp accuracy regardless of how rows are updated.
- **AppError** — shaped error class with HTTP status code; keeps controllers and services free of `res` references.
- **`createApp()` factory** — the Express app accepts injected config so tests can run with tiny rate limits without touching real thresholds.
- **Fresh `MemoryStore` per app instance** — prevents rate limit state bleeding between test suites in the same process.
- **Layered test strategy** — each layer mocks only the one directly below it for precise, fast isolation.