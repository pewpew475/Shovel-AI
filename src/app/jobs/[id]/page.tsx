'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { ProgressPanel } from '@/components/jobs/progress-panel';
import { LogFeed } from '@/components/jobs/log-feed';
import { ResultsTable } from '@/components/jobs/results-table';
import { ChartsPanel } from '@/components/jobs/charts-panel';
import { ExportPanel } from '@/components/jobs/export-panel';

type Tab = 'table' | 'charts' | 'export';

interface StatusData {
  status: string;
  recordsFound: number;
  recordsValid: number;
  duplicatesSkipped: number;
  error?: string;
  logTail: string[];
}

interface ResultRow {
  id: string;
  record: Record<string, unknown>;
  valid: number;
  missing_fields: string[];
  created_at: string;
}

interface ParsedIntent {
  fields: string[];
  targetCount: number;
}

interface JobData {
  command: string;
  parsed_intent: ParsedIntent;
  results: ResultRow[];
  log: string[];
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobData | null>(null);
  const [status, setStatus] = useState<StatusData>({
    status: 'pending',
    recordsFound: 0,
    recordsValid: 0,
    duplicatesSkipped: 0,
    logTail: [],
  });
  const [tab, setTab] = useState<Tab>('table');

  const fetchJob = useCallback(async () => {
    const r = await fetch(`/api/jobs/${id}`);
    if (r.ok) setJob(await r.json() as JobData);
  }, [id]);

  const fetchStatus = useCallback(async () => {
    const r = await fetch(`/api/jobs/${id}/status`);
    if (r.ok) setStatus(await r.json() as StatusData);
  }, [id]);

  useEffect(() => {
    void fetchJob();
    void fetchStatus();
    const interval = setInterval(() => {
      void fetchStatus();
      if (status.status === 'running') void fetchJob();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchJob, fetchStatus, status.status]);

  const fields = job?.parsed_intent?.fields ?? [];
  const results = job?.results ?? [];
  const targetCount = job?.parsed_intent?.targetCount ?? 500;

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="ml-60 flex-1 flex flex-col">
        <TopBar title={String(job?.command ?? 'Loading…').slice(0, 60)} />
        <div className="flex-1 p-6 grid grid-cols-5 gap-6">
          {/* Left: progress + log */}
          <div className="col-span-2 space-y-4">
            <ProgressPanel
              recordsFound={status.recordsFound}
              recordsValid={status.recordsValid}
              duplicatesSkipped={status.duplicatesSkipped}
              targetCount={targetCount}
              status={status.status}
            />
            <LogFeed logs={status.logTail} />
            {status.status === 'pending' && (
              <button
                onClick={async () => {
                  await fetch(`/api/jobs/${id}/run`, { method: 'POST' });
                  void fetchStatus();
                }}
                className="clay-btn-primary w-full py-3 font-bold text-white"
              >
                ▶ Start Scrape
              </button>
            )}
          </div>
          {/* Right: tabbed results */}
          <div className="col-span-3 space-y-4">
            <div className="flex gap-2">
              {(['table', 'charts', 'export'] as Tab[]).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`clay-bubble px-5 py-2 text-sm font-bold capitalize ${tab === t ? 'text-sky' : 'text-gray-text'}`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="neo-card p-6">
              {tab === 'table' && <ResultsTable results={results} fields={fields} />}
              {tab === 'charts' && <ChartsPanel results={results} fields={fields} />}
              {tab === 'export' && <ExportPanel jobId={id} hasData={results.length > 0} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
