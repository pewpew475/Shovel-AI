import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';
import type { RawExtract } from '@/lib/extract';

const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });

const MultiLeadSchema = z.object({
  businesses: z
    .array(
      z.object({
        businessName: z.string().optional().describe('Name of the business or shop'),
        phones: z
          .array(z.string())
          .optional()
          .describe('All phone numbers listed on the page'),
        whatsapp: z
          .string()
          .optional()
          .describe('WhatsApp number if explicitly mentioned'),
        address: z.string().optional().describe('Full street address'),
        locality: z
          .string()
          .optional()
          .describe('Area or neighbourhood within Delhi'),
      })
    )
    .describe('All businesses listed on this page'),
});

const EXTRACT_PROMPT =
  'Extract all business listings from this page. For each business collect: name, all phone numbers, WhatsApp number, full address, and locality or area within Delhi.';

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch {
      if (attempt === retries - 1) return null;
      await new Promise(res => setTimeout(res, 1000 * 2 ** attempt));
    }
  }
  return null;
}

export async function searchAndScrape(query: string): Promise<RawExtract[]> {
  // Step 1: discover URLs via Google search
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchResult = (await withRetry(() => app.search(query, { limit: 5 }))) as any;
  if (!searchResult?.data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const urls: string[] = (searchResult.data as any[])
    .map((r: { url?: string }) => r.url)
    .filter((u): u is string => Boolean(u));

  // Step 2: scrape each URL for structured contact data
  const results: RawExtract[] = [];
  for (const url of urls) {
    const scrapeResult = await withRetry(() =>
      app.scrapeUrl(url, {
        formats: ['extract'],
        extract: { schema: MultiLeadSchema, prompt: EXTRACT_PROMPT },
      })
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const businesses = (scrapeResult as any)?.extract?.businesses as
      | RawExtract[]
      | undefined;
    if (businesses) results.push(...businesses);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const businesses = (result as any)?.extract?.businesses as RawExtract[] | undefined;
  return businesses ?? [];
}

export function buildJustDialUrl(businessType: string, locality: string): string {
  const slug = businessType.replace(/\s+/g, '-').toLowerCase();
  const loc = locality.replace(/\s+/g, '-').toLowerCase();
  return `https://www.justdial.com/Delhi/${slug}-in-${loc}`;
}
