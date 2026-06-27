import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { JobRow } from '@/lib/db';

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

  const logs = JSON.parse(job.log) as string[];
  return NextResponse.json({
    status: job.status,
    recordsFound: job.records_found,
    recordsValid: job.records_valid,
    duplicatesSkipped: job.duplicates_skipped,
    error: job.error,
    logTail: logs.slice(-20),
  });
}
