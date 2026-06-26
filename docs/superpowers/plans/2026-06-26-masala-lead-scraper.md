# Masala Lead Scraper — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal Next.js 15 app that scrapes 5,000 masala retailer/distributor contacts in Delhi via Firecrawl, shows live progress, and exports a formatted Excel file.

**Architecture:** Single Next.js 15 app, no database. Global in-memory Map stores leads. File-based checkpoint (`checkpoint.json`) enables resume. API routes handle start/status/download. A `'use client'` component polls status every 3 seconds.

**Tech Stack:** Next.js 15, TypeScript, `@mendable/firecrawl-js`, `xlsx` (SheetJS), `zod`, Tailwind CSS, shadcn/ui (Button, Badge, Progress), Vitest

## Global Constraints

- Node.js ≥ 20
- Next.js 15.3.x, App Router only
- TypeScript strict mode
- Firecrawl concurrency: max 2 parallel requests
- Target: 5,000 unique leads or 220 queries exhausted
- Dedup key: normalized 10-digit phone number
- All imports use `@/` alias for `src/`
- `FIRECRAWL_API_KEY` from `.env.local` only

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `vitest.config.ts`
- Create: `.env.example`
- Create: `src/app/globals.css`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "masala-lead-scraper",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "^15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@mendable/firecrawl-js": "^1.23.0",
    "xlsx": "^0.18.5",
    "zod": "^3.23.8",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2",
    "lucide-react": "^0.454.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.6.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.ts**

```typescript
import type { NextConfig } from 'next';
const nextConfig: NextConfig = {};
export default nextConfig;
```

- [ ] **Step 4: Create tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss';
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

- [ ] **Step 5: Create postcss.config.js**

```javascript
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- [ ] **Step 6: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';
export default defineConfig({
  test: { environment: 'node' },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
```

- [ ] **Step 7: Create .env.example**

```
FIRECRAWL_API_KEY=your_key_here
```

- [ ] **Step 8: Create src/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}
body { background-color: hsl(var(--background)); color: hsl(var(--foreground)); }
```

- [ ] **Step 9: Create src/lib/utils.ts**

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 10: Install deps and init shadcn**

Run in project root:
```bash
npm install
npx shadcn@latest init --defaults
npx shadcn@latest add button badge progress
```
Expected: `src/components/ui/button.tsx`, `badge.tsx`, `progress.tsx` created.

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "feat: scaffold Next.js 15 project with shadcn"
```

---

### Task 2: Query Generator

**Files:**
- Create: `src/lib/queries.ts`
- Create: `src/__tests__/queries.test.ts`

**Interfaces:**
- Produces: `generateQueries(): string[]` — 220 strings, format `"<type> in <locality> Delhi"`

- [ ] **Step 1: Write failing test — create src/__tests__/queries.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import { generateQueries } from '@/lib/queries';

describe('generateQueries', () => {
  it('returns exactly 220 queries', () => {
    expect(generateQueries()).toHaveLength(220);
  });
  it('contains no duplicates', () => {
    const q = generateQueries();
    expect(new Set(q).size).toBe(220);
  });
  it('each query contains "Delhi"', () => {
    expect(generateQueries().every(q => q.includes('Delhi'))).toBe(true);
  });
  it('includes expected locality and type', () => {
    const q = generateQueries();
    expect(q.some(s => s.includes('Chandni Chowk'))).toBe(true);
    expect(q.some(s => s.includes('masala retailer'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- queries
```
Expected output: `Cannot find module '@/lib/queries'`

- [ ] **Step 3: Create src/lib/queries.ts**

```typescript
const BUSINESS_TYPES = [
  'masala retailer',
  'spice distributor',
  'kirana wholesaler',
  'masala wholesaler',
  'spice shop',
  'grocery distributor',
  'FMCG distributor',
  'provision store',
  'dry fruit shop',
  'spice supplier',
  'masala dealer',
];

const LOCALITIES = [
  'Khari Baoli', 'Chandni Chowk', 'Naya Bazar', 'Sadar Bazar', 'Karol Bagh',
  'Rohini', 'Pitampura', 'Punjabi Bagh', 'Janakpuri', 'Dwarka',
  'Laxmi Nagar', 'Shahdara', 'Uttam Nagar', 'Mayur Vihar', 'Preet Vihar',
  'Okhla', 'Nehru Place', 'South Delhi', 'North Delhi', 'East Delhi',
];

export function generateQueries(): string[] {
  return BUSINESS_TYPES.flatMap(type =>
    LOCALITIES.map(loc => `${type} in ${loc} Delhi`)
  );
}

export { LOCALITIES };
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test -- queries
```
Expected: 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries.ts src/__tests__/queries.test.ts
git commit -m "feat: query generator (11 types × 20 localities = 220 queries)"
```

---

### Task 3: Phone Normalization & Lead Parsing

**Files:**
- Create: `src/lib/extract.ts`
- Create: `src/__tests__/extract.test.ts`

**Interfaces:**
- Produces: `interface Lead { businessName: string; phone: string; whatsapp: string; address: string; locality: string; }`
- Produces: `interface RawExtract { businessName?: string; phones?: string[]; whatsapp?: string; address?: string; locality?: string; }`
- Produces: `normalizePhone(raw: string): string` — 10-digit string or `''`
- Produces: `parseLead(raw: RawExtract, fallbackLocality: string): Lead | null`

- [ ] **Step 1: Write failing test — create src/__tests__/extract.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import { normalizePhone, parseLead } from '@/lib/extract';

describe('normalizePhone', () => {
  it('strips +91 prefix', () => expect(normalizePhone('+91 98765 43210')).toBe('9876543210'));
  it('strips leading 0', () => expect(normalizePhone('09876543210')).toBe('9876543210'));
  it('strips spaces and dashes', () => expect(normalizePhone('98765-43210')).toBe('9876543210'));
  it('handles 91 without plus', () => expect(normalizePhone('919876543210')).toBe('9876543210'));
  it('returns empty for non-phone', () => expect(normalizePhone('N/A')).toBe(''));
  it('returns empty for empty string', () => expect(normalizePhone('')).toBe(''));
});

describe('parseLead', () => {
  it('returns null when no phone and no name', () => {
    expect(parseLead({ phones: [], address: 'addr', businessName: '' }, 'Rohini')).toBeNull();
  });
  it('uses first normalized phone', () => {
    const lead = parseLead({ businessName: 'Spice Hub', phones: ['+91 98765 43210'], address: '1 MG Rd' }, 'Chandni Chowk');
    expect(lead?.phone).toBe('9876543210');
  });
  it('uses fallbackLocality when locality missing', () => {
    const lead = parseLead({ businessName: 'X', phones: ['9876543210'], address: 'Y', locality: '' }, 'Karol Bagh');
    expect(lead?.locality).toBe('Karol Bagh');
  });
  it('sets whatsapp to first phone when not provided', () => {
    const lead = parseLead({ businessName: 'X', phones: ['9876543210'], address: 'Y' }, 'Okhla');
    expect(lead?.whatsapp).toBe('9876543210');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- extract
```
Expected: `Cannot find module '@/lib/extract'`

- [ ] **Step 3: Create src/lib/extract.ts**

```typescript
export interface Lead {
  businessName: string;
  phone: string;
  whatsapp: string;
  address: string;
  locality: string;
}

export interface RawExtract {
  businessName?: string;
  phones?: string[];
  whatsapp?: string;
  address?: string;
  locality?: string;
}

export function normalizePhone(raw: string): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.length === 10 ? digits : '';
}

export function parseLead(raw: RawExtract, fallbackLocality: string): Lead | null {
  const name = raw.businessName?.trim() ?? '';
  const phones = (raw.phones ?? []).map(normalizePhone).filter(Boolean);
  const whatsapp = normalizePhone(raw.whatsapp ?? '') || phones[0] ?? '';
  const address = raw.address?.trim() ?? '';
  const locality = raw.locality?.trim() || fallbackLocality;

  if (!name && phones.length === 0) return null;

  return { businessName: name, phone: phones[0] ?? '', whatsapp, address, locality };
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test -- extract
```
Expected: 10 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/extract.ts src/__tests__/extract.test.ts
git commit -m "feat: phone normalization and lead parser"
```

---

### Task 4: In-Memory Store

**Files:**
- Create: `src/lib/store.ts`
- Create: `src/__tests__/store.test.ts`

**Interfaces:**
- Consumes: `Lead`, `normalizePhone` from `@/lib/extract`
- Produces: `interface ScraperState { status: 'idle'|'running'|'complete'|'error'; queriesDone: number; totalQueries: number; duplicatesSkipped: number; currentSource: string; error?: string; }`
- Produces: `state: ScraperState` — mutable singleton
- Produces: `addLead(lead: Lead): boolean`
- Produces: `getLeads(): Lead[]`
- Produces: `getCount(): number`
- Produces: `isTargetReached(): boolean`
- Produces: `saveCheckpoint(): void`
- Produces: `resetStore(): void` — test helper

- [ ] **Step 1: Write failing test — create src/__tests__/store.test.ts**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { addLead, getCount, getLeads, isTargetReached, resetStore, state } from '@/lib/store';

beforeEach(() => resetStore());

describe('addLead', () => {
  it('adds lead and returns true', () => {
    expect(addLead({ businessName: 'A', phone: '9876543210', whatsapp: '', address: 'X', locality: 'Y' })).toBe(true);
    expect(getCount()).toBe(1);
  });
  it('rejects duplicate phone and increments duplicatesSkipped', () => {
    addLead({ businessName: 'A', phone: '9876543210', whatsapp: '', address: 'X', locality: 'Y' });
    expect(addLead({ businessName: 'B', phone: '9876543210', whatsapp: '', address: 'Z', locality: 'W' })).toBe(false);
    expect(getCount()).toBe(1);
    expect(state.duplicatesSkipped).toBe(1);
  });
  it('allows no-phone leads keyed by name+address', () => {
    addLead({ businessName: 'A', phone: '', whatsapp: '', address: '1 Road', locality: 'X' });
    expect(addLead({ businessName: 'B', phone: '', whatsapp: '', address: '2 Road', locality: 'X' })).toBe(true);
    expect(getCount()).toBe(2);
  });
  it('rejects lead with no phone AND no name', () => {
    expect(addLead({ businessName: '', phone: '', whatsapp: '', address: 'addr', locality: 'loc' })).toBe(false);
  });
});

describe('isTargetReached', () => {
  it('returns false when below 5000', () => expect(isTargetReached()).toBe(false));
});

describe('getLeads', () => {
  it('returns stored leads as array', () => {
    addLead({ businessName: 'A', phone: '9876543210', whatsapp: '', address: 'X', locality: 'Y' });
    expect(getLeads()[0].businessName).toBe('A');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- store
```

- [ ] **Step 3: Create src/lib/store.ts**

```typescript
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { type Lead, normalizePhone } from '@/lib/extract';

export interface ScraperState {
  status: 'idle' | 'running' | 'complete' | 'error';
  queriesDone: number;
  totalQueries: number;
  duplicatesSkipped: number;
  currentSource: string;
  error?: string;
}

const TARGET = 5000;
const CHECKPOINT_PATH = join(process.cwd(), 'checkpoint.json');

const leadsMap = new Map<string, Lead>();

export const state: ScraperState = {
  status: 'idle',
  queriesDone: 0,
  totalQueries: 220,
  duplicatesSkipped: 0,
  currentSource: '',
};

function makeKey(lead: Lead): string {
  const phone = normalizePhone(lead.phone);
  if (phone) return phone;
  const fallback = `${lead.businessName}-${lead.address}`.toLowerCase().trim();
  return fallback;
}

// Load checkpoint on module init (skipped in test env)
if (process.env.NODE_ENV !== 'test' && existsSync(CHECKPOINT_PATH)) {
  try {
    const data = JSON.parse(readFileSync(CHECKPOINT_PATH, 'utf-8')) as { leads?: Lead[]; queriesDone?: number };
    for (const lead of data.leads ?? []) {
      const key = makeKey(lead);
      if (key) leadsMap.set(key, lead);
    }
    state.queriesDone = data.queriesDone ?? 0;
  } catch { /* corrupted checkpoint — ignore */ }
}

export function addLead(lead: Lead): boolean {
  const key = makeKey(lead);
  if (!key || leadsMap.has(key)) {
    state.duplicatesSkipped++;
    return false;
  }
  leadsMap.set(key, lead);
  if (leadsMap.size % 50 === 0) saveCheckpoint();
  return true;
}

export function getLeads(): Lead[] {
  return Array.from(leadsMap.values());
}

export function getCount(): number {
  return leadsMap.size;
}

export function isTargetReached(): boolean {
  return leadsMap.size >= TARGET;
}

export function saveCheckpoint(): void {
  try {
    writeFileSync(CHECKPOINT_PATH, JSON.stringify({ leads: getLeads(), queriesDone: state.queriesDone }));
  } catch { /* non-fatal */ }
}

export function resetStore(): void {
  leadsMap.clear();
  state.status = 'idle';
  state.queriesDone = 0;
  state.totalQueries = 220;
  state.duplicatesSkipped = 0;
  state.currentSource = '';
  delete state.error;
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test -- store
```
Expected: 7 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/store.ts src/__tests__/store.test.ts
git commit -m "feat: in-memory store with dedup and JSON checkpoint"
```

---

### Task 5: Excel Export

**Files:**
- Create: `src/lib/excel.ts`
- Create: `src/__tests__/excel.test.ts`

**Interfaces:**
- Consumes: `Lead` from `@/lib/extract`
- Produces: `buildExcelBuffer(leads: Lead[]): Buffer`

- [ ] **Step 1: Write failing test — create src/__tests__/excel.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { buildExcelBuffer } from '@/lib/excel';
import type { Lead } from '@/lib/extract';

const sample: Lead[] = [
  { businessName: 'Spice Hub', phone: '9876543210', whatsapp: '9876543210', address: '1 MG Road', locality: 'Chandni Chowk' },
  { businessName: 'Masala King', phone: '9123456780', whatsapp: '', address: '42 Khari Baoli', locality: 'Khari Baoli' },
];

describe('buildExcelBuffer', () => {
  it('returns a Buffer', () => {
    expect(Buffer.isBuffer(buildExcelBuffer(sample))).toBe(true);
  });
  it('has correct column headers', () => {
    const wb = XLSX.read(buildExcelBuffer(sample), { type: 'buffer' });
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets[wb.SheetNames[0]]);
    const headers = Object.keys(rows[0]);
    expect(headers).toContain('Business Name');
    expect(headers).toContain('Phone');
    expect(headers).toContain('WhatsApp');
    expect(headers).toContain('Address');
    expect(headers).toContain('Locality');
  });
  it('has correct row count', () => {
    const wb = XLSX.read(buildExcelBuffer(sample), { type: 'buffer' });
    expect(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test -- excel
```

- [ ] **Step 3: Create src/lib/excel.ts**

```typescript
import * as XLSX from 'xlsx';
import type { Lead } from '@/lib/extract';

export function buildExcelBuffer(leads: Lead[]): Buffer {
  const rows = leads.map((l, i) => ({
    'S.No': i + 1,
    'Business Name': l.businessName,
    'Phone': l.phone,
    'WhatsApp': l.whatsapp,
    'Address': l.address,
    'Locality': l.locality,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 },   // S.No
    { wch: 40 },  // Business Name
    { wch: 15 },  // Phone
    { wch: 15 },  // WhatsApp
    { wch: 60 },  // Address
    { wch: 20 },  // Locality
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Masala Leads');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test -- excel
```
Expected: 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/excel.ts src/__tests__/excel.test.ts
git commit -m "feat: Excel export with S.No + 5 data columns"
```

---

### Task 6: Firecrawl Client

**Files:**
- Create: `src/lib/firecrawl.ts`

**Interfaces:**
- Consumes: `RawExtract` from `@/lib/extract`
- Produces: `searchAndScrape(query: string): Promise<RawExtract[]>`
- Produces: `scrapeDirectory(url: string): Promise<RawExtract[]>`
- Produces: `buildJustDialUrl(businessType: string, locality: string): string`

- [ ] **Step 1: Create src/lib/firecrawl.ts**

```typescript
import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';
import type { RawExtract } from '@/lib/extract';

const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });

const MultiLeadSchema = z.object({
  businesses: z.array(z.object({
    businessName: z.string().optional().describe('Name of the business'),
    phones: z.array(z.string()).optional().describe('All phone numbers on the page'),
    whatsapp: z.string().optional().describe('WhatsApp number if explicitly listed'),
    address: z.string().optional().describe('Full address'),
    locality: z.string().optional().describe('Area or locality within Delhi'),
  })).describe('All businesses listed on this page'),
});

const EXTRACT_PROMPT = 'Extract all business listings. For each: name, all phone numbers, WhatsApp number, full address, locality in Delhi.';

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch {
      if (i === retries - 1) return null;
      await new Promise(res => setTimeout(res, 1000 * 2 ** i));
    }
  }
  return null;
}

export async function searchAndScrape(query: string): Promise<RawExtract[]> {
  const searchResult = await withRetry(() => app.search(query, { limit: 5 }));
  if (!searchResult?.data) return [];

  const urls = (searchResult.data as Array<{ url?: string }>)
    .map(r => r.url)
    .filter((u): u is string => Boolean(u));

  const results: RawExtract[] = [];
  for (const url of urls) {
    const scrapeResult = await withRetry(() =>
      app.scrapeUrl(url, {
        formats: ['extract'],
        extract: { schema: MultiLeadSchema, prompt: EXTRACT_PROMPT },
      })
    );
    const extract = scrapeResult?.extract as { businesses?: RawExtract[] } | undefined;
    if (extract?.businesses) results.push(...extract.businesses);
  }
  return results;
}

export async function scrapeDirectory(url: string): Promise<RawExtract[]> {
  const result = await withRetry(() =>
    app.scrapeUrl(url, {
      formats: ['extract'],
      extract: { schema: MultiLeadSchema, prompt: EXTRACT_PROMPT },
    })
  );
  const extract = result?.extract as { businesses?: RawExtract[] } | undefined;
  return extract?.businesses ?? [];
}

export function buildJustDialUrl(businessType: string, locality: string): string {
  const slug = businessType.replace(/\s+/g, '-').toLowerCase();
  const loc = locality.replace(/\s+/g, '-').toLowerCase();
  return `https://www.justdial.com/Delhi/${slug}-in-${loc}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/firecrawl.ts
git commit -m "feat: Firecrawl client with search, scrape, retry"
```

---

### Task 7: Scraper Engine

**Files:**
- Create: `src/lib/scraper.ts`

**Interfaces:**
- Consumes: `generateQueries` from `@/lib/queries`
- Consumes: `searchAndScrape`, `scrapeDirectory`, `buildJustDialUrl` from `@/lib/firecrawl`
- Consumes: `parseLead` from `@/lib/extract`
- Consumes: `addLead`, `state`, `isTargetReached`, `saveCheckpoint` from `@/lib/store`
- Produces: `runScraper(): Promise<void>`

- [ ] **Step 1: Create src/lib/scraper.ts**

```typescript
import { generateQueries } from '@/lib/queries';
import { searchAndScrape, scrapeDirectory, buildJustDialUrl } from '@/lib/firecrawl';
import { parseLead } from '@/lib/extract';
import { addLead, state, isTargetReached, saveCheckpoint } from '@/lib/store';

const CONCURRENCY = 2;

async function processQuery(query: string): Promise<void> {
  state.currentSource = query;
  const localityMatch = query.match(/in (.+?) Delhi/);
  const locality = localityMatch?.[1] ?? '';
  const businessType = query.split(' in ')[0];
  const justDialUrl = buildJustDialUrl(businessType, locality);

  const [searchResults, directResults] = await Promise.allSettled([
    searchAndScrape(query),
    scrapeDirectory(justDialUrl),
  ]);

  const allRaw = [
    ...(searchResults.status === 'fulfilled' ? searchResults.value : []),
    ...(directResults.status === 'fulfilled' ? directResults.value : []),
  ];

  for (const raw of allRaw) {
    const lead = parseLead(raw, locality);
    if (lead) addLead(lead);
    if (isTargetReached()) return;
  }
}

export async function runScraper(): Promise<void> {
  if (state.status === 'running') return;
  state.status = 'running';
  state.currentSource = '';

  const queries = generateQueries();
  state.totalQueries = queries.length;
  const pending = queries.slice(state.queriesDone);

  try {
    const queue = [...pending];
    let idx = state.queriesDone;

    const worker = async (): Promise<void> => {
      while (queue.length > 0 && !isTargetReached()) {
        const query = queue.shift()!;
        await processQuery(query);
        state.queriesDone = ++idx;
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    state.status = 'complete';
    state.currentSource = '';
    saveCheckpoint();
  } catch (err) {
    state.status = 'error';
    state.error = err instanceof Error ? err.message : 'Unknown error';
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/scraper.ts
git commit -m "feat: scraper engine with concurrent query processing"
```

---

### Task 8: API Routes

**Files:**
- Create: `src/app/api/scrape/start/route.ts`
- Create: `src/app/api/scrape/status/route.ts`
- Create: `src/app/api/scrape/download/route.ts`

**Interfaces:**
- Consumes: `runScraper` from `@/lib/scraper`
- Consumes: `state`, `getCount`, `getLeads` from `@/lib/store`
- Consumes: `buildExcelBuffer` from `@/lib/excel`

- [ ] **Step 1: Create src/app/api/scrape/start/route.ts**

```typescript
import { NextResponse } from 'next/server';
import { runScraper } from '@/lib/scraper';
import { state } from '@/lib/store';

export async function POST(): Promise<NextResponse> {
  if (state.status === 'running') {
    return NextResponse.json({ ok: false, message: 'Already running' }, { status: 409 });
  }
  void runScraper();
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Create src/app/api/scrape/status/route.ts**

```typescript
import { NextResponse } from 'next/server';
import { state, getCount } from '@/lib/store';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: state.status,
    leadsFound: getCount(),
    duplicatesSkipped: state.duplicatesSkipped,
    queriesDone: state.queriesDone,
    totalQueries: state.totalQueries,
    currentSource: state.currentSource,
    error: state.error,
  });
}
```

- [ ] **Step 3: Create src/app/api/scrape/download/route.ts**

```typescript
import { getLeads } from '@/lib/store';
import { buildExcelBuffer } from '@/lib/excel';

export async function GET(): Promise<Response> {
  const leads = getLeads();
  if (leads.length === 0) {
    return new Response('No leads collected yet', { status: 404 });
  }
  const buffer = buildExcelBuffer(leads);
  const date = new Date().toISOString().split('T')[0];
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="masala-leads-${date}.xlsx"`,
      'Content-Length': buffer.length.toString(),
    },
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/
git commit -m "feat: API routes for start, status, download"
```

---

### Task 9: UI

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/components/scraper-dashboard.tsx`

- [ ] **Step 1: Create src/app/layout.tsx**

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Masala Lead Scraper',
  description: 'Scrape masala retailer contacts in Delhi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Create src/app/page.tsx**

```typescript
import { ScraperDashboard } from '@/components/scraper-dashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <ScraperDashboard />
    </main>
  );
}
```

- [ ] **Step 3: Create src/components/scraper-dashboard.tsx**

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface StatusResponse {
  status: 'idle' | 'running' | 'complete' | 'error';
  leadsFound: number;
  duplicatesSkipped: number;
  queriesDone: number;
  totalQueries: number;
  currentSource: string;
  error?: string;
}

const TARGET = 5000;

export function ScraperDashboard() {
  const [status, setStatus] = useState<StatusResponse>({
    status: 'idle',
    leadsFound: 0,
    duplicatesSkipped: 0,
    queriesDone: 0,
    totalQueries: 220,
    currentSource: '',
  });
  const [starting, setStarting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/scrape/status');
      if (res.ok) setStatus(await res.json() as StatusResponse);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    void fetchStatus();
    const id = setInterval(() => void fetchStatus(), 3000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  const handleStart = async () => {
    setStarting(true);
    try {
      await fetch('/api/scrape/start', { method: 'POST' });
      await fetchStatus();
    } finally {
      setStarting(false);
    }
  };

  const progress = Math.min((status.leadsFound / TARGET) * 100, 100);

  const badgeVariant: Record<StatusResponse['status'], 'default' | 'secondary' | 'destructive'> = {
    idle: 'secondary',
    running: 'default',
    complete: 'default',
    error: 'destructive',
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Masala Lead Scraper</h1>
        <Badge variant={badgeVariant[status.status]}>
          {{ idle: 'Idle', running: 'Running…', complete: 'Complete', error: 'Error' }[status.status]}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span className="font-medium">
            {status.leadsFound.toLocaleString()} / {TARGET.toLocaleString()}
          </span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Leads Found', value: status.leadsFound.toLocaleString() },
          { label: 'Duplicates Skipped', value: status.duplicatesSkipped.toLocaleString() },
          { label: 'Queries Done', value: `${status.queriesDone} / ${status.totalQueries}` },
          { label: 'Target', value: TARGET.toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-lg font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {status.currentSource && (
        <p className="text-xs text-gray-400 truncate">Source: {status.currentSource}</p>
      )}

      {status.error && (
        <p className="text-sm text-red-500 bg-red-50 rounded p-2">Error: {status.error}</p>
      )}

      <div className="flex gap-3">
        <Button
          onClick={() => void handleStart()}
          disabled={status.status === 'running' || starting}
          className="flex-1"
        >
          {status.status === 'running' ? 'Scraping…' : 'Start Scraping'}
        </Button>
        <Button
          onClick={() => { window.location.href = '/api/scrape/download'; }}
          disabled={status.leadsFound === 0}
          variant="outline"
          className="flex-1"
        >
          Download Excel
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/components/scraper-dashboard.tsx
git commit -m "feat: single-page UI with live progress dashboard"
```

---

### Task 10: Wire Up and Smoke Test

**Files:**
- Create: `README.md`

- [ ] **Step 1: Copy env and set API key**

```bash
cp .env.example .env.local
```
Edit `.env.local`, set `FIRECRAWL_API_KEY=<your key>`.

- [ ] **Step 2: Run all tests**

```bash
npm test
```
Expected: queries (4), extract (10), store (7), excel (3) — all pass.

- [ ] **Step 3: Start dev server**

```bash
npm run dev
```
Expected: `ready on http://localhost:3000`, no TypeScript errors.

- [ ] **Step 4: Verify UI renders**

Open http://localhost:3000. Confirm:
- Card renders with "Idle" badge
- Progress bar shows 0 / 5,000
- "Start Scraping" enabled, "Download Excel" disabled

- [ ] **Step 5: Click Start — verify scraper fires**

Click "Start Scraping". Within 6 seconds confirm:
- Badge changes to "Running…"
- Source label updates
- Lead counter starts incrementing

- [ ] **Step 6: Test download mid-run**

After ≥1 lead appears, click "Download Excel". Confirm:
- Browser downloads `masala-leads-YYYY-MM-DD.xlsx`
- Opens with columns: S.No, Business Name, Phone, WhatsApp, Address, Locality

- [ ] **Step 7: Create README.md**

```markdown
# Masala Lead Scraper

Scrapes masala retailer and distributor contacts in Delhi. One-time use.

## Setup

```bash
npm install
npx shadcn@latest init --defaults
npx shadcn@latest add button badge progress
cp .env.example .env.local
# Edit .env.local → set FIRECRAWL_API_KEY
npm run dev
```

Open http://localhost:3000, click **Start Scraping**.

When done (or enough leads), click **Download Excel**.

## Output

Excel file: S.No | Business Name | Phone | WhatsApp | Address | Locality

## Notes

- Target: 5,000 unique leads
- Dedup: normalized 10-digit phone
- Checkpoint: `checkpoint.json` — restart after crash and click Start to resume
- Concurrency: 2 parallel Firecrawl requests
```

- [ ] **Step 8: Final commit**

```bash
git add README.md
git commit -m "docs: README with setup instructions"
```
