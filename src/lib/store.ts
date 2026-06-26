import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { type Lead, normalizePhone } from '@/lib/extract';

export interface ScraperState {
  status: 'idle' | 'running' | 'complete' | 'error';
  queriesDone: number;
  totalQueries: number;
  duplicatesSkipped: number;
  currentSource: string;
  error?: string;
}

const TARGET = 5000;
const CHECKPOINT_PATH = join(process.cwd(), 'checkpoint.json');

const leadsMap = new Map<string, Lead>();

export const state: ScraperState = {
  status: 'idle',
  queriesDone: 0,
  totalQueries: 220,
  duplicatesSkipped: 0,
  currentSource: '',
};

function makeKey(lead: Lead): string {
  const phone = normalizePhone(lead.phone);
  if (phone) return phone;
  return `${lead.businessName}-${lead.address}`.toLowerCase().trim();
}

// Load checkpoint on module init so the server can resume after restart
if (existsSync(CHECKPOINT_PATH)) {
  try {
    const data = JSON.parse(readFileSync(CHECKPOINT_PATH, 'utf-8')) as {
      leads?: Lead[];
      queriesDone?: number;
    };
    for (const lead of data.leads ?? []) {
      const key = makeKey(lead);
      if (key) leadsMap.set(key, lead);
    }
    state.queriesDone = data.queriesDone ?? 0;
  } catch {
    // corrupted checkpoint — start fresh
  }
}

export function addLead(lead: Lead): boolean {
  const key = makeKey(lead);
  if (!key || leadsMap.has(key)) {
    state.duplicatesSkipped++;
    return false;
  }
  leadsMap.set(key, lead);
  if (leadsMap.size % 50 === 0) saveCheckpoint();
  return true;
}

export function getLeads(): Lead[] {
  return Array.from(leadsMap.values());
}

export function getCount(): number {
  return leadsMap.size;
}

export function isTargetReached(): boolean {
  return leadsMap.size >= TARGET;
}

export function saveCheckpoint(): void {
  try {
    writeFileSync(
      CHECKPOINT_PATH,
      JSON.stringify({ leads: getLeads(), queriesDone: state.queriesDone })
    );
  } catch {
    // non-fatal
  }
}
