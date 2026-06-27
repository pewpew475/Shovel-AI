'use client';

interface Props {
  value: 'firecrawl' | 'custom_url';
  url: string;
  onChange: (type: 'firecrawl' | 'custom_url', url: string) => void;
}

export function SourceSelector({ value, url, onChange }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-text uppercase tracking-wide">Scraper Source</p>
      <div className="flex gap-3">
        {(['firecrawl', 'custom_url'] as const).map(t => (
          <button key={t} onClick={() => onChange(t, url)}
            className={`clay-bubble px-5 py-2 text-sm font-bold flex-1 ${value === t ? 'text-sky border-sky/40' : 'text-gray-text'}`}>
            {t === 'firecrawl' ? '⚡ Firecrawl' : '🔗 Custom URL'}
          </button>
        ))}
      </div>
      {value === 'custom_url' && (
        <input value={url} onChange={e => onChange('custom_url', e.target.value)}
          className="neo-input w-full px-4 py-3 text-sm text-dark outline-none"
          placeholder="https://example.com/jobs" />
      )}
    </div>
  );
}
