import { NextResponse } from 'next/server';
import { runScraper } from '@/lib/scraper';
import { state } from '@/lib/store';

export async function POST(): Promise<NextResponse> {
  if (state.status === 'running') {
    return NextResponse.json({ ok: false, message: 'Already running' }, { status: 409 });
  }
  void runScraper();
  return NextResponse.json({ ok: true });
}
