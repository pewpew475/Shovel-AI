---
name: shovel-ai-design
description: AI-powered general-purpose scraper platform. Natural language command → NVIDIA NIM intent parsing → Firecrawl scraping → AI validation → cleaned dataset with in-app dashboard and multi-format export.
metadata:
  type: project
---

# Shovel AI — Design Spec

**Date:** 2026-06-27  
**Goal:** Replace the masala-specific scraper with a general-purpose AI-powered data collection platform  
**User:** Single admin (credentials in env)  
**Stack:** Next.js 15, TypeScript, SQLite (better-sqlite3), Tailwind CSS, NVIDIA NIM, Firecrawl  

---

## 1. Architecture

```
Browser (Next.js 15 App Router)
  ├── /login                     → admin credential check (env-based)
  ├── /dashboard                 → job list, global stats, quick-start
  ├── /jobs/new                  → command input → AI intent preview → run
  └── /jobs/[id]                 → live progress + results table + charts + exports

Middleware (auth guard)
  └── every route except /login checks session cookie → 401 redirects to /login

API Routes
  ├── POST /api/auth/login        → validates admin creds, sets httpOnly cookie
  ├── POST /api/auth/logout       → clears session cookie + DB row
  ├── POST /api/jobs              → create job, parse intent via NVIDIA NIM
  ├── GET  /api/jobs              → list all jobs from SQLite
  ├── GET  /api/jobs/[id]         → job detail + results
  ├── POST /api/jobs/[id]/run     → start scrape engine (non-blocking)
  ├── GET  /api/jobs/[id]/status  → live poll (3s interval)
  └── GET  /api/jobs/[id]/export?format=xlsx|json|xml

AI Layer (NVIDIA NIM)
  ├── Intent Parser   → nvidia/llama-3.1-nemotron-ultra-253b-v1
  │     Input:  raw command string
  │     Output: { role, location, fields[], scrapeQueries[], targetCount, filters }
  ├── Schema Generator → nvidia/llama-3.1-nemotron-ultra-253b-v1
  │     Output: Zod schema object + Firecrawl extraction prompt string
  └── Data Validator  → meta/llama-3.3-70b-instruct (batched 10 records, ≤40 RPM)
        Input:  scraped record + required fields list
        Output: { valid: boolean, missingFields: string[], cleanedRecord: object }

Scraper Engine
  ├── ScraperAdapter interface   → swap/add backends without touching engine
  ├── FirecrawlAdapter           → search + scrape via @mendable/firecrawl-js
  └── CustomUrlAdapter           → direct scrape of user-provided URL with generated schema

SQLite (better-sqlite3)
  ├── jobs     → id, command, parsedIntent (JSON), status, createdAt, updatedAt
  ├── results  → id, jobId, record (JSON), valid, missingFields (JSON), createdAt
  └── sessions → token, expiresAt
```

---

## 2. UI/UX Design

### Design System

**Neomorphism** — cards and inputs appear extruded from the surface using dual box-shadows (light top-left `#ffffff`, dark bottom-right `#c8d0e7`). Page background: `#f0f4f8`. Elements feel physically raised.

**Claymorphism** — stat bubbles, status chips, action buttons use inflated rounded shapes (`border-radius: 20–28px`), soft pastel fills, subtle inner glow. Feels tactile and modern.

**Color Palette:**
| Token        | Value     | Usage                                  |
|--------------|-----------|----------------------------------------|
| Surface      | `#f0f4f8` | Page background                        |
| Card         | `#ffffff` | Neomorphic card fills                  |
| Sky Blue     | `#7EC8E3` | Accents, active states, progress       |
| Sky Light    | `#B8E4F2` | Hover states, clay bubble fills        |
| Gray         | `#8899aa` | Secondary text, borders                |
| Dark         | `#0d1117` | Headings, primary text                 |
| Success      | `#6ee7b7` | Complete status                        |
| Warning      | `#fcd34d` | Running status                         |
| Error        | `#f87171` | Error status                           |

### Page Layouts

**`/login`**
- Centered neomorphic card (max-width 420px)
- Shovel AI logo + tagline
- Email + password inputs with inset shadow styling
- Sky-blue clay login button
- No sign-up link (single admin)

**`/dashboard`**
- Top bar: 4 clay stat bubbles — Total Jobs / Running / Completed / Total Records Collected
- Below: job cards grid (2 cols desktop, 1 col mobile)
  - Each card: command preview (truncated), status chip, record count, created date, "Open" button
- Floating clay "New Scrape" button bottom-right

**`/jobs/new`**
- Full-width neomorphic inset textarea
- Placeholder: `"e.g. Get me job postings for senior React developers in San Francisco"`
- Below textarea: scraper source selector (Firecrawl / Custom URL)
  - Custom URL: text input for URL appears when selected
- AI Preview Panel (appears after 800ms debounce on typing):
  - Shows parsed intent: Role, Location, Fields list, Target Count, Queries preview
  - Editable fields before running
- Large sky-blue clay "Parse & Preview" button → confirms intent
- "Run Scrape" button (enabled after preview confirmed)

**`/jobs/[id]`**
- Left column (40%):
  - Job command heading
  - Circular progress ring (sky blue fill)
  - Counter stats: Records / Valid / Invalid / Duplicates Skipped
  - Current source label (truncated URL)
  - Scrollable scraper log feed (last 20 lines)
  - Stop button (if running)
- Right column (60%), tabbed:
  - **Table tab** — paginated results table, field columns dynamic from parsedIntent, valid/invalid badge per row, search/filter bar
  - **Charts tab** — bar chart (records collected over time), pie chart (field completeness %), powered by recharts
  - **Exports tab** — 3 clay download buttons: XLSX, JSON, XML

---

## 3. Data Flow & AI Pipeline

```
1. User types: "Get me job postings for React developers in Bangalore"

2. POST /api/jobs
   → Intent Parser (nemotron-ultra-253b):
     {
       role: "React Developer",
       location: "Bangalore",
       fields: ["jobTitle","company","salary","location","applyUrl","postedDate"],
       targetCount: 500,
       filters: {},
       scrapeQueries: [
         "React developer jobs Bangalore",
         "React frontend jobs Bangalore India",
         "React developer hiring Bangalore 2024",
         ...
       ]
     }
   → Schema Generator (nemotron-ultra-253b):
     Zod schema + Firecrawl extraction prompt tailored to job postings
   → Job saved to SQLite (status: pending)

3. User sees AI Preview Panel → reviews/edits fields → confirms

4. POST /api/jobs/[id]/run
   → FirecrawlAdapter:
     for each scrapeQuery:
       search(query, limit=5) → URLs
       for each URL: scrapeUrl(url, { schema, prompt }) → raw records
     dedup by hash(company + jobTitle + location)
   → CustomUrlAdapter (if user provided URL):
     direct scrapeUrl with same schema

5. Data Validator (llama-3.3-70b, batched 10):
   Rate-limited: 1.5s between batches (stays under 40 RPM)
   Per record: checks all required fields present + plausible values
   → valid records saved to results table (valid=true)
   → invalid records saved with missingFields[] (valid=false)

6. Export layer:
   XLSX: sanitized cells (formula injection protection), styled headers
   JSON: array of clean record objects
   XML:  <dataset><record>...</record></dataset> structure
   In-app charts: recharts bar + pie from results table aggregates
```

**Rate limit handling:** At 10 records/batch × 40 RPM max = 400 validated records/min. With 1.5s spacing between batches, actual rate stays at ~36 RPM, safely under limit.

---

## 4. Security

### Authentication
- Credentials: `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` (bcrypt) in `.env.local`
- `npm run setup` script: prompts for plaintext password once, writes bcrypt hash to `.env.local`
- Login: `bcryptjs.compare(submitted, ADMIN_PASSWORD_HASH)`
- Session: signed `httpOnly`, `sameSite=strict` cookie, 24hr expiry, token stored in SQLite sessions table
- Middleware: all routes except `/login` and `/api/auth/login` check cookie → redirect to `/login` on failure

### CSRF
- State-changing POST endpoints check `Origin` header matches server host
- Login endpoint exempt (no session exists yet)

### Excel Formula Injection Fix
- Any cell value starting with `=`, `+`, `-`, `@` gets prefixed with `'` before writing to XLSX

### Environment Variables (all gitignored via `.gitignore`)
```env
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=          # bcrypt hash generated by npm run setup
SESSION_SECRET=               # random 32-byte hex for cookie signing
FIRECRAWL_API_KEY=
NVIDIA_API_KEY=
NVIDIA_MODEL_PARSE=nvidia/llama-3.1-nemotron-ultra-253b-v1
NVIDIA_MODEL_VALIDATE=meta/llama-3.3-70b-instruct
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
```

---

## 5. File Structure

```
src/
  app/
    layout.tsx
    globals.css                        # neomorphism + claymorphism tokens
    login/
      page.tsx
    dashboard/
      page.tsx
    jobs/
      new/
        page.tsx
      [id]/
        page.tsx
    api/
      auth/
        login/route.ts
        logout/route.ts
      jobs/
        route.ts                       # GET list, POST create
        [id]/
          route.ts                     # GET detail
          run/route.ts                 # POST start scrape
          status/route.ts              # GET live poll
          export/route.ts              # GET xlsx|json|xml
  components/
    ui/                                # button, badge, progress (existing)
    layout/
      sidebar.tsx
      top-bar.tsx
    dashboard/
      stat-bubble.tsx
      job-card.tsx
    jobs/
      command-input.tsx
      intent-preview.tsx
      source-selector.tsx
      progress-panel.tsx
      results-table.tsx
      charts-panel.tsx
      export-panel.tsx
      log-feed.tsx
  lib/
    db.ts                              # better-sqlite3 singleton + migrations
    auth.ts                            # bcrypt compare, session create/verify
    middleware.ts                      # Next.js auth middleware
    ai/
      intent-parser.ts                 # NVIDIA NIM intent + schema generation
      validator.ts                     # NVIDIA NIM data validation, rate-limited
      nvidia-client.ts                 # shared OpenAI-compatible NIM client
    scrapers/
      adapter.ts                       # ScraperAdapter interface
      firecrawl.ts                     # FirecrawlAdapter
      custom-url.ts                    # CustomUrlAdapter
      engine.ts                        # orchestrates adapter + dedup + checkpoint
    export/
      xlsx.ts                          # formula-safe XLSX builder
      json.ts                          # JSON export builder
      xml.ts                           # XML export builder
    utils.ts
  scripts/
    setup.ts                           # npm run setup: generate bcrypt hash
```

---

## 6. Dependencies to Add

```json
{
  "better-sqlite3": "^9.x",
  "bcryptjs": "^2.x",
  "openai": "^4.x",
  "recharts": "^2.x",
  "cookie": "^0.x"
}
```
`openai` package used for NVIDIA NIM (NIM is OpenAI-compatible API).

---

## 7. Constraints & Non-Goals

- Single admin only — no multi-user, no role system
- No Redis, no Docker, no external queue — Next.js server process handles scrape engine
- No real-time WebSocket — 3s polling is sufficient for progress updates
- Scraper backends limited to Firecrawl + Custom URL now; ScraperAdapter interface makes adding Apify etc. trivial later
- No email/password reset — admin changes creds directly in `.env.local` + re-runs setup
