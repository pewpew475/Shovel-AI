'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface StatusResponse {
  status: 'idle' | 'running' | 'complete' | 'error';
  leadsFound: number;
  duplicatesSkipped: number;
  queriesDone: number;
  totalQueries: number;
  currentSource: string;
  error?: string;
}

const TARGET = 5000;

const STATUS_LABELS: Record<StatusResponse['status'], string> = {
  idle: 'Idle',
  running: 'Running…',
  complete: 'Complete ✓',
  error: 'Error',
};

const BADGE_VARIANTS: Record<
  StatusResponse['status'],
  'default' | 'secondary' | 'destructive'
> = {
  idle: 'secondary',
  running: 'default',
  complete: 'default',
  error: 'destructive',
};

export function ScraperDashboard() {
  const [status, setStatus] = useState<StatusResponse>({
    status: 'idle',
    leadsFound: 0,
    duplicatesSkipped: 0,
    queriesDone: 0,
    totalQueries: 220,
    currentSource: '',
  });
  const [starting, setStarting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/scrape/status');
      if (res.ok) setStatus((await res.json()) as StatusResponse);
    } catch {
      // ignore network errors during poll
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
    const id = setInterval(() => void fetchStatus(), 3000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  const handleStart = async () => {
    setStarting(true);
    try {
      await fetch('/api/scrape/start', { method: 'POST' });
      await fetchStatus();
    } finally {
      setStarting(false);
    }
  };

  const progress = Math.min((status.leadsFound / TARGET) * 100, 100);
  const isRunning = status.status === 'running';
  const hasLeads = status.leadsFound > 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Masala Lead Scraper</h1>
          <p className="text-sm text-gray-500 mt-0.5">Delhi retailers &amp; distributors</p>
        </div>
        <Badge variant={BADGE_VARIANTS[status.status]}>
          {STATUS_LABELS[status.status]}
        </Badge>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Leads collected</span>
          <span className="font-semibold tabular-nums">
            {status.leadsFound.toLocaleString('en-IN')} / {TARGET.toLocaleString('en-IN')}
          </span>
        </div>
        <Progress value={progress} className="h-3" />
        <p className="text-xs text-gray-400 text-right">{progress.toFixed(1)}%</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Leads Found" value={status.leadsFound.toLocaleString('en-IN')} />
        <StatCard label="Duplicates Skipped" value={status.duplicatesSkipped.toLocaleString('en-IN')} />
        <StatCard
          label="Queries Done"
          value={`${status.queriesDone} / ${status.totalQueries}`}
        />
        <StatCard label="Target" value={TARGET.toLocaleString('en-IN')} />
      </div>

      {/* Current source */}
      {status.currentSource && (
        <div className="bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-400">Currently scraping</p>
          <p className="text-xs text-gray-600 truncate font-medium">{status.currentSource}</p>
        </div>
      )}

      {/* Error */}
      {status.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <p className="text-sm text-red-600">Error: {status.error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button
          onClick={() => void handleStart()}
          disabled={isRunning || starting}
          className="flex-1"
        >
          {isRunning ? 'Scraping…' : starting ? 'Starting…' : 'Start Scraping'}
        </Button>
        <Button
          onClick={() => {
            window.location.href = '/api/scrape/download';
          }}
          disabled={!hasLeads}
          variant="outline"
          className="flex-1"
        >
          Download Excel
        </Button>
      </div>

      {hasLeads && status.status !== 'running' && (
        <p className="text-xs text-center text-gray-400">
          {status.leadsFound.toLocaleString('en-IN')} leads ready to download
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900 tabular-nums">{value}</p>
    </div>
  );
}
