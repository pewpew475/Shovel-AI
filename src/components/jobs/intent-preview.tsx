'use client';
import type { ParsedIntent } from '@/lib/ai/intent-parser';

export function IntentPreview({ intent }: { intent: ParsedIntent }) {
  return (
    <div className="clay-bubble p-5 space-y-4">
      <p className="text-xs font-bold text-sky uppercase tracking-widest">AI Parsed Intent</p>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Target', value: intent.role },
          { label: 'Location', value: intent.location || 'Any' },
          { label: 'Target Count', value: String(intent.targetCount) },
          { label: 'Queries', value: `${intent.scrapeQueries.length} generated` },
        ].map(row => (
          <div key={row.label}>
            <p className="text-xs text-gray-text">{row.label}</p>
            <p className="font-bold text-dark text-sm">{row.value}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-xs text-gray-text mb-1">Fields to collect</p>
        <div className="flex flex-wrap gap-2">
          {intent.fields.map(f => (
            <span key={f} className="clay-bubble px-3 py-1 text-xs font-semibold text-sky">{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
