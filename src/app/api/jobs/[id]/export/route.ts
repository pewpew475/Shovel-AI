import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { JobRow, ResultRow } from '@/lib/db';
import { buildXlsx, buildJson, buildXml } from '@/lib/export/xlsx';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const format = req.nextUrl.searchParams.get('format') ?? 'xlsx';
  const db = getDb();
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(params.id) as JobRow | undefined;
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rows = (
    db.prepare('SELECT * FROM results WHERE job_id = ? AND valid = 1').all(params.id) as ResultRow[]
  ).map(r => JSON.parse(r.record) as Record<string, unknown>);

  const intent = job.parsed_intent ? JSON.parse(job.parsed_intent) : null;
  const fields: string[] = intent?.fields ?? (rows[0] ? Object.keys(rows[0]) : []);

  if (format === 'json') {
    return new NextResponse(buildJson(rows), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="shovel-${params.id}.json"`,
      },
    });
  }

  if (format === 'xml') {
    return new NextResponse(buildXml(rows, fields), {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="shovel-${params.id}.xml"`,
      },
    });
  }

  const buf = buildXlsx(rows, fields);
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="shovel-${params.id}.xlsx"`,
    },
  });
}
