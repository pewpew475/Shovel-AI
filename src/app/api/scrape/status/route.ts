import { NextResponse } from 'next/server';
import { state, getCount } from '@/lib/store';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: state.status,
    leadsFound: getCount(),
    duplicatesSkipped: state.duplicatesSkipped,
    queriesDone: state.queriesDone,
    totalQueries: state.totalQueries,
    currentSource: state.currentSource,
    error: state.error,
  });
}
