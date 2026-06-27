import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { JobRow } from '@/lib/db';
import { parseIntent } from '@/lib/ai/intent-parser';

export async function GET() {
  const db = getDb();
  const jobs = db
    .prepare('SELECT * FROM jobs ORDER BY created_at DESC')
    .all() as JobRow[];
  return NextResponse.json(
    jobs.map(j => ({
      ...j,
      parsed_intent: j.parsed_intent ? JSON.parse(j.parsed_intent) : null,
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    command: string;
    sourceType: 'firecrawl' | 'custom_url';
    sourceUrl?: string;
    parseOnly?: boolean;
  };

  const { command, sourceType, sourceUrl, parseOnly } = body;
  const intent = await parseIntent(command);

  if (parseOnly === true) {
    return NextResponse.json({ intent });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO jobs (id, command, parsed_intent, status, source_type, source_url, created_at, updated_at)
    VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)
  `).run(id, command, JSON.stringify(intent), sourceType, sourceUrl ?? null, now, now);

  return NextResponse.json({ id, intent }, { status: 201 });
}
