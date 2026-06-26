import type { ScraperAdapter, ScrapeParams } from './adapter';
import type { ParsedIntent } from '@/lib/ai/intent-parser';

export type EngineEvent =
  | { type: 'record'; record: Record<string, unknown>; source: string }
  | { type: 'duplicate'; hash: string }
  | { type: 'log'; message: string }
  | { type: 'done'; total: number };

function recordHash(r: Record<string, unknown>): string {
  return JSON.stringify(Object.fromEntries(Object.entries(r).sort().slice(0, 4)));
}

export async function* runEngine(
  adapter: ScraperAdapter,
  intent: ParsedIntent,
  sourceUrl?: string
): AsyncGenerator<EngineEvent> {
  const seen = new Set<string>();
  let total = 0;

  const params: ScrapeParams = {
    queries: intent.scrapeQueries,
    extractionPrompt: intent.extractionPrompt,
    zodSchemaFields: intent.zodSchema,
    targetCount: intent.targetCount,
    sourceUrl,
  };

  yield { type: 'log', message: `${adapter.name}: starting ${intent.scrapeQueries.length} queries` };

  for await (const result of adapter.scrape(params)) {
    yield { type: 'log', message: `${result.source}: ${result.records.length} raw records` };
    for (const record of result.records) {
      const h = recordHash(record);
      if (seen.has(h)) {
        yield { type: 'duplicate', hash: h };
        continue;
      }
      seen.add(h);
      total++;
      yield { type: 'record', record, source: result.source };
      if (total >= intent.targetCount) {
        yield { type: 'log', message: `Target ${intent.targetCount} reached` };
        yield { type: 'done', total };
        return;
      }
    }
  }
  yield { type: 'done', total };
}
