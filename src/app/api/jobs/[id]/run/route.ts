import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { JobRow } from '@/lib/db';
import type { ParsedIntent } from '@/lib/ai/intent-parser';

const ALLOWED_COLUMNS = new Set([
  'status', 'records_found', 'records_valid', 'duplicates_skipped', 'log', 'error'
]);

async function executeJob(jobId: string, job: JobRow): Promise<void> {
  const db = getDb();
  const intent = JSON.parse(job.parsed_intent!) as ParsedIntent;

  function patch(data: Record<string, unknown>): void {
    const keys = Object.keys(data);
    const invalid = keys.filter(k => !ALLOWED_COLUMNS.has(k));
    if (invalid.length > 0) throw new Error(`patch: disallowed columns: ${invalid.join(', ')}`);
    db.prepare(
      'UPDATE jobs SET updated_at=?, ' + keys.map(k => `${k}=?`).join(', ') + ' WHERE id=?'
    ).run(new Date().toISOString(), ...Object.values(data), jobId);
  }

  function appendLog(msg: string): void {
    const row = db
      .prepare('SELECT log FROM jobs WHERE id=?')
      .get(jobId) as { log: string };
    const current = JSON.parse(row.log) as string[];
    current.push(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
    db.prepare('UPDATE jobs SET log=?, updated_at=? WHERE id=?').run(
      JSON.stringify(current),
      new Date().toISOString(),
      jobId
    );
  }

  try {
    patch({ status: 'running' });

    const { getAdapter } = await import('@/lib/scrapers/custom-url');
    const { runEngine } = await import('@/lib/scrapers/engine');
    const { validateInBatches } = await import('@/lib/ai/validator');

    const adapter = getAdapter(job.source_type as 'firecrawl' | 'custom_url');
    const rawRecords: { record: Record<string, unknown>; source: string }[] = [];

    for await (const event of runEngine(adapter, intent, job.source_url ?? undefined)) {
      if (event.type === 'log') {
        appendLog(event.message);
      } else if (event.type === 'record') {
        rawRecords.push({ record: event.record, source: event.source });
        patch({ records_found: rawRecords.length });
      } else if (event.type === 'duplicate') {
        const cur = db
          .prepare('SELECT duplicates_skipped FROM jobs WHERE id=?')
          .get(jobId) as { duplicates_skipped: number };
        patch({ duplicates_skipped: cur.duplicates_skipped + 1 });
      }
    }

    appendLog(`Validating ${rawRecords.length} records…`);

    let validCount = 0;
    const insertResult = db.prepare(
      'INSERT INTO results (id, job_id, record, valid, missing_fields, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );

    for await (const { index, result } of validateInBatches(
      rawRecords.map(r => r.record),
      intent.fields
    )) {
      const { record } = rawRecords[index];
      const merged = { ...record, ...result.cleanedRecord };
      insertResult.run(
        crypto.randomUUID(),
        jobId,
        JSON.stringify(merged),
        result.valid ? 1 : 0,
        JSON.stringify(result.missingFields),
        new Date().toISOString()
      );
      if (result.valid) validCount++;
      patch({ records_valid: validCount });
    }

    appendLog(`Done: ${validCount} valid records`);
    patch({ status: 'complete' });
  } catch (err) {
    patch({ status: 'error', error: String(err) });
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const job = db
    .prepare('SELECT * FROM jobs WHERE id = ?')
    .get(id) as JobRow | undefined;

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (job.status === 'running')
    return NextResponse.json({ error: 'Already running' }, { status: 409 });
  if (!job.parsed_intent)
    return NextResponse.json({ error: 'No intent' }, { status: 400 });

  void executeJob(id, job);
  return NextResponse.json({ started: true }, { status: 202 });
}
