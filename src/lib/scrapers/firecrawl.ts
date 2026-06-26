import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';
import type { ScraperAdapter, ScrapeParams, ScrapeResult } from './adapter';

export class FirecrawlAdapter implements ScraperAdapter {
  name = 'firecrawl';
  private app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });

  async *scrape(params: ScrapeParams): AsyncGenerator<ScrapeResult> {
    const schema = z.object({
      items: z
        .array(
          z.object(
            Object.fromEntries(
              Object.entries(params.zodSchemaFields).map(([k]) => [k, z.string().optional()])
            )
          )
        )
        .describe('All items found on this page'),
    });

    for (const query of params.queries) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const searchRes = (await this.app.search(query, { limit: 5 })) as any;
      const urls: string[] = (searchRes?.data ?? [])
        .map((r: { url?: string }) => r.url)
        .filter(Boolean);

      for (const url of urls) {
        try {
          const scrapeRes = await this.app.scrapeUrl(url, {
            formats: ['extract'],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            extract: { schema, prompt: params.extractionPrompt } as any,
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const items = ((scrapeRes as any)?.extract?.items ?? []) as Record<string, unknown>[];
          if (items.length > 0) yield { records: items, source: url };
        } catch {
          // skip failed URLs
        }
      }
    }
  }
}
