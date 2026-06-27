'use client';

interface Props {
  recordsFound: number;
  recordsValid: number;
  duplicatesSkipped: number;
  targetCount: number;
  status: string;
}

export function ProgressPanel({ recordsFound, recordsValid, duplicatesSkipped, targetCount, status }: Props) {
  const pct = Math.min((recordsFound / (targetCount || 1)) * 100, 100);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  const statusColor: Record<string, string> = {
    running: 'text-yellow-400',
    complete: 'text-green-400',
    error: 'text-red-400',
    pending: 'text-gray-text',
  };

  return (
    <div className="neo-card p-6 space-y-6">
      <div className="flex flex-col items-center gap-4">
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle cx="70" cy="70" r={r} fill="none" stroke="#7EC8E3" strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease' }} />
        </svg>
        <div className="text-center -mt-20">
          <div className="text-3xl font-black text-dark">{pct.toFixed(0)}%</div>
          <div className={`text-sm font-semibold capitalize ${statusColor[status] ?? 'text-gray-text'}`}>{status}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Found', value: recordsFound },
          { label: 'Valid', value: recordsValid },
          { label: 'Dupes Skipped', value: duplicatesSkipped },
          { label: 'Target', value: targetCount },
        ].map(s => (
          <div key={s.label} className="clay-bubble p-3 text-center">
            <div className="text-2xl font-black text-dark">{s.value.toLocaleString()}</div>
            <div className="text-xs text-gray-text">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
