---
name: masala-lead-scraper-design
description: One-time B2B lead scraper for masala retailers and distributors in Delhi. Minimal Next.js app with Firecrawl, live progress UI, and Excel export.
metadata:
  type: project
---

# Masala Lead Scraper — Design Spec

**Date:** 2026-06-26  
**Goal:** Generate 5,000 verified masala retailer/distributor contacts in Delhi  
**Output:** Single Excel file (Name, Phone, WhatsApp, Address, Locality)  
**Use:** One-time data collection, not a production SaaS

---

## Architecture

Single Next.js 15 app. No database. No Redis. No Docker.

```
Browser → Next.js UI (one page)
              ↓ POST /api/scrape/start — kicks off scraper
         Scraper Engine (runs in Next.js server process)
              ↓ Firecrawl Search API → discover URLs (220 queries)
              ↓ Firecrawl Scrape API → extract contacts per URL
              ↓ In-memory Map (dedup by normalized phone)
              ↓ JSON checkpoint file (resume on crash)
         GET /api/scrape/status → polled every 3s for live counter
         GET /api/scrape/download → streams XLSX file
```

---

## Search Query Generation

**11 business types × 20 Delhi localities = 220 queries**

Business types:
- masala retailer, spice distributor, kirana wholesaler, masala wholesaler
- spice shop, grocery distributor, FMCG distributor, provision store
- dry fruit shop, spice supplier, masala dealer

Localities (20):
- Khari Baoli, Chandni Chowk, Naya Bazar, Sadar Bazar, Karol Bagh
- Rohini, Pitampura, Punjabi Bagh, Janakpuri, Dwarka
- Laxmi Nagar, Shahdara, Uttam Nagar, Mayur Vihar, Preet Vihar
- Okhla, Nehru Place, South Delhi, North Delhi, East Delhi

---

## Discovery Strategy (both in parallel)

1. **Firecrawl Search API** — Google search for each query → collect result URLs
2. **Direct directory scrape** — JustDial and IndiaMART search pages when accessible

---

## Extraction

Firecrawl scrape each discovered URL with LLM extract schema:
```typescript
{
  businessName: string,
  phone: string[],
  whatsapp: string,
  address: string,
  locality: string
}
```

---

## Deduplication

- Normalize phone: strip spaces, dashes, country code (+91/0), keep 10 digits
- Deduplicate by normalized phone number (Map key)
- Skip if name + address are both empty

---

## Data Fields (Excel columns)

| Column | Source |
|--------|--------|
| Business Name | Extracted |
| Phone | Extracted + normalized |
| WhatsApp | Extracted + normalized |
| Address | Extracted |
| Locality | Extracted or inferred from query |

---

## UI (single page)

- Status badge: Idle / Running / Complete / Error
- Progress bar: N / 5,000
- Live counters: Leads Found, Duplicates Skipped, Queries Done / 220
- Current source label
- Start button (disabled while running)
- Download button (enabled when complete)
- Polls `/api/scrape/status` every 3 seconds

---

## Stack

- Next.js 15 (App Router)
- TypeScript
- `@mendable/firecrawl-js`
- `xlsx` (SheetJS)
- Tailwind CSS + shadcn/ui (Progress, Button, Badge)
- `.env.local` → `FIRECRAWL_API_KEY`

---

## Files

```
src/
  app/
    page.tsx                  # UI shell (server component)
    layout.tsx
    api/
      scrape/
        start/route.ts        # POST: begin scraping
        status/route.ts       # GET: live counters
        download/route.ts     # GET: stream XLSX
  lib/
    queries.ts                # generate 220 search strings
    firecrawl.ts              # Firecrawl SDK client + helpers
    scraper.ts                # main engine: search → scrape → dedup
    extract.ts                # normalize phone, parse fields
    store.ts                  # in-memory Map + JSON checkpoint
    excel.ts                  # build XLSX buffer from store
  components/
    scraper-dashboard.tsx     # client component: live UI
```

---

## Constraints

- Rate limit: 2 concurrent Firecrawl requests (polite, avoids bans)
- Retry: 3 attempts with exponential backoff per URL
- Stop condition: 5,000 unique leads OR all 220 queries done
- Checkpoint: write JSON every 50 leads (resume after crash)
