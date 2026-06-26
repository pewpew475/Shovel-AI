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

  // Both discovery strategies in parallel
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
  delete state.error;

  const queries = generateQueries();
  state.totalQueries = queries.length;

  // Resume from where checkpoint left off
  const pending = queries.slice(state.queriesDone);
  const queue = [...pending];
  let completedIdx = state.queriesDone;

  try {
    const worker = async (): Promise<void> => {
      while (queue.length > 0 && !isTargetReached()) {
        const query = queue.shift()!;
        await processQuery(query);
        state.queriesDone = ++completedIdx;
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    state.status = 'complete';
    state.currentSource = '';
    saveCheckpoint();
  } catch (err) {
    state.status = 'error';
    state.error = err instanceof Error ? err.message : 'Unknown error';
    saveCheckpoint();
  }
}
