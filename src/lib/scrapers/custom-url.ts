import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from 'zod';
import type { ScraperAdapter, ScrapeParams, ScrapeResult } from './adapter';
import { FirecrawlAdapter } from './firecrawl';

export class CustomUrlAdapter implements ScraperAdapter {
  name = 'custom-url';
  private app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });

  async *scrape(params: ScrapeParams): AsyncGenerator<ScrapeResult> {
    if (!params.sourceUrl) return;

    const schema = z.object({
      items: z.array(
        z.object(
          Object.fromEntries(
            Object.entries(params.zodSchemaFields).map(([k]) => [k, z.string().optional()])
          )
        )
      ),
    });

    try {
      const res = await this.app.scrapeUrl(params.sourceUrl, {
        formats: ['extract'],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        extract: { schema, prompt: params.extractionPrompt } as any,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = ((res as any)?.extract?.items ?? []) as Record<string, unknown>[];
      if (items.length > 0) yield { records: items, source: params.sourceUrl };
    } catch {
      // silent
    }
  }
}

export function getAdapter(sourceType: 'firecrawl' | 'custom_url'): ScraperAdapter {
  if (sourceType === 'custom_url') return new CustomUrlAdapter();
  return new FirecrawlAdapter();
}
