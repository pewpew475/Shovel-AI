'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { SourceSelector } from '@/components/jobs/source-selector';
import { IntentPreview } from '@/components/jobs/intent-preview';
import type { ParsedIntent } from '@/lib/ai/intent-parser';

export default function NewJobPage() {
  const router = useRouter();
  const [command, setCommand] = useState('');
  const [sourceType, setSourceType] = useState<'firecrawl' | 'custom_url'>('firecrawl');
  const [sourceUrl, setSourceUrl] = useState('');
  const [intent, setIntent] = useState<ParsedIntent | null>(null);
  const [parsing, setParsing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleParse = useCallback(async () => {
    if (!command.trim()) return;
    setParsing(true);
    setError('');
    setIntent(null);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, sourceType, sourceUrl: sourceUrl || undefined, parseOnly: true }),
      });
      if (res.ok) {
        const data = await res.json() as { id?: string; intent: ParsedIntent };
        setIntent(data.intent);
      } else {
        setError('Failed to parse intent. Check your NVIDIA API key.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setParsing(false);
    }
  }, [command, sourceType, sourceUrl]);

  const handleCreate = useCallback(async () => {
    if (!command.trim()) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, sourceType, sourceUrl: sourceUrl || undefined }),
      });
      if (res.ok) {
        const data = await res.json() as { id: string };
        router.push(`/jobs/${data.id}`);
      } else {
        setError('Failed to create job.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  }, [command, sourceType, sourceUrl, router]);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="ml-60 flex-1 flex flex-col">
        <TopBar title="New Scrape" />
        <div className="flex-1 p-8 max-w-2xl mx-auto w-full space-y-6">
          <div className="neo-card p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-text uppercase tracking-wide">What do you want to scrape?</label>
              <textarea
                value={command}
                onChange={e => { setCommand(e.target.value); setIntent(null); }}
                rows={4}
                className="neo-input w-full px-4 py-3 text-dark text-sm outline-none resize-none leading-relaxed"
                placeholder="e.g. Get me job postings for senior React developers in San Francisco with salary info"
              />
            </div>
            <SourceSelector value={sourceType} url={sourceUrl}
              onChange={(t, u) => { setSourceType(t); setSourceUrl(u); }} />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button onClick={handleParse} disabled={!command.trim() || parsing}
                className="clay-btn-secondary flex-1 py-3 font-bold text-sm">
                {parsing ? 'Parsing…' : '🔍 Preview Intent'}
              </button>
              <button onClick={handleCreate} disabled={!command.trim() || creating}
                className="clay-btn-primary flex-1 py-3 font-bold text-white text-sm">
                {creating ? 'Creating…' : '✦ Create & Run'}
              </button>
            </div>
          </div>
          {intent && <IntentPreview intent={intent} />}
        </div>
      </div>
    </div>
  );
}
