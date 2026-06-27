'use client';

export function ExportPanel({ jobId, hasData }: { jobId: string; hasData: boolean }) {
  const download = (format: string) => {
    window.location.href = `/api/jobs/${jobId}/export?format=${format}`;
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-text uppercase tracking-wide">Download Results</p>
      {!hasData && <p className="text-sm text-gray-text">No results yet.</p>}
      {(['xlsx', 'json', 'xml'] as const).map(fmt => (
        <button key={fmt} onClick={() => download(fmt)} disabled={!hasData}
          className="clay-btn-secondary w-full py-3 font-bold text-sm uppercase tracking-wider disabled:opacity-40">
          ⬇ {fmt.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
