import Link from 'next/link';

interface Job { id: string; command: string; status: string; records_valid: number; created_at: string }

const STATUS_COLOR: Record<string, string> = {
  pending: 'text-gray-text', running: 'text-yellow-500',
  complete: 'text-green-500', error: 'text-red-400',
};

export function JobCard({ job }: { job: Job }) {
  return (
    <div className="neo-card p-5 space-y-4 hover:scale-[1.01] transition-transform">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-dark line-clamp-2 flex-1">{job.command}</p>
        <span className={`clay-bubble px-3 py-1 text-xs font-bold capitalize shrink-0 ${STATUS_COLOR[job.status] ?? 'text-gray-text'}`}>
          {job.status}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-text">
        <span>{job.records_valid.toLocaleString()} valid records</span>
        <span>{new Date(job.created_at).toLocaleDateString()}</span>
      </div>
      <Link href={`/jobs/${job.id}`} className="clay-btn-primary block text-center py-2 text-sm font-bold text-white">
        Open →
      </Link>
    </div>
  );
}
