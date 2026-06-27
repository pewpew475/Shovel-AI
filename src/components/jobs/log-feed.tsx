'use client';
import { useEffect, useRef } from 'react';

export function LogFeed({ logs }: { logs: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [logs]);

  return (
    <div className="neo-inset p-4">
      <p className="text-xs font-semibold text-gray-text uppercase tracking-wide mb-2">Scrape Log</p>
      <div ref={ref} className="h-40 overflow-y-auto space-y-1 font-mono">
        {logs.length === 0
          ? <p className="text-xs text-gray-text">Waiting to start…</p>
          : logs.map((line, i) => <p key={i} className="text-xs text-dark/80">{line}</p>)}
      </div>
    </div>
  );
}
