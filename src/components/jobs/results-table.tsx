'use client';
import { useState } from 'react';

interface ResultRow {
  id: string;
  record: Record<string, unknown>;
  valid: number;
  missing_fields: string[];
}

const PAGE_SIZE = 25;

export function ResultsTable({ results, fields }: { results: ResultRow[]; fields: string[] }) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const filtered = results.filter(r =>
    !search || Object.values(r.record).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );
  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const slice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <input
        value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
        className="neo-input w-full px-4 py-2 text-sm text-dark outline-none"
        placeholder="Search results…"
      />
      <div className="overflow-x-auto neo-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sky-light/40">
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-text uppercase">Valid</th>
              {fields.map(f => (
                <th key={f} className="px-4 py-3 text-left text-xs font-bold text-gray-text uppercase">{f}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map(r => (
              <tr key={r.id} className="border-b border-sky-light/20 hover:bg-surface/50">
                <td className="px-4 py-2">
                  <span className={`clay-bubble px-2 py-0.5 text-xs font-bold ${r.valid ? 'text-green-500' : 'text-red-400'}`}>
                    {r.valid ? '✓' : '✗'}
                  </span>
                </td>
                {fields.map(f => (
                  <td key={f} className="px-4 py-2 text-dark/80 max-w-xs truncate">
                    {String(r.record[f] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex gap-2 justify-center">
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`clay-bubble w-8 h-8 text-sm font-bold ${i === page ? 'text-sky' : 'text-gray-text'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
