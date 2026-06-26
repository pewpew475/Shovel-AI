import { runEngine } from '@/lib/scrapers/engine';
import { ScraperAdapter, ScrapeParams, ScrapeResult } from '@/lib/scrapers/adapter';
import { ParsedIntent } from '@/lib/ai/intent-parser';

function makeAdapter(records: Record<string, unknown>[][]): ScraperAdapter {
  return {
    name: 'mock',
    async *scrape(_params: ScrapeParams): AsyncGenerator<ScrapeResult> {
      for (const batch of records) {
        yield { records: batch, source: 'mock://test' };
      }
    },
  };
}

const intent: ParsedIntent = {
  role: 'test', location: '', fields: ['name'], targetCount: 5,
  filters: {}, scrapeQueries: ['q1'],
  extractionPrompt: 'extract names', zodSchema: { name: { type: 'string', description: 'name' } },
};

describe('runEngine', () => {
  it('deduplicates records', async () => {
    const dup = { name: 'Alice', city: 'NY' };
    const adapter = makeAdapter([[dup, dup, { name: 'Bob', city: 'LA' }]]);
    const events = [];
    for await (const e of runEngine(adapter, intent)) events.push(e);
    const records = events.filter(e => e.type === 'record');
    const dupes = events.filter(e => e.type === 'duplicate');
    expect(records).toHaveLength(2);
    expect(dupes).toHaveLength(1);
  });

  it('stops at targetCount', async () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ name: `Person${i}` }));
    const adapter = makeAdapter([many]);
    const events = [];
    for await (const e of runEngine(adapter, { ...intent, targetCount: 3 })) events.push(e);
    expect(events.filter(e => e.type === 'record')).toHaveLength(3);
  });
});
