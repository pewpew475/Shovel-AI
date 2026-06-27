import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { JobRow, ResultRow } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const job = db
    .prepare('SELECT * FROM jobs WHERE id = ?')
    .get(id) as JobRow | undefined;

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const results = (
    db
      .prepare(
        'SELECT * FROM results WHERE job_id = ? ORDER BY created_at DESC LIMIT 100'
      )
      .all(id) as ResultRow[]
  ).map(r => ({
    ...r,
    record: JSON.parse(r.record) as Record<string, unknown>,
    missing_fields: JSON.parse(r.missing_fields) as string[],
  }));

  return NextResponse.json({
    ...job,
    parsed_intent: job.parsed_intent ? JSON.parse(job.parsed_intent) : null,
    log: JSON.parse(job.log) as string[],
    results,
  });
}
