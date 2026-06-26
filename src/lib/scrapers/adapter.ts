export interface ScrapeResult {
  records: Record<string, unknown>[];
  source: string;
}

export interface ScrapeParams {
  queries: string[];
  extractionPrompt: string;
  zodSchemaFields: Record<string, { type: string; description: string; optional?: boolean }>;
  targetCount: number;
  sourceUrl?: string;
}

export interface ScraperAdapter {
  name: string;
  scrape(params: ScrapeParams): AsyncGenerator<ScrapeResult>;
}
