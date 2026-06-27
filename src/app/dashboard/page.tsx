import Link from 'next/link';
import { getDb } from '@/lib/db';
import type { JobRow } from '@/lib/db';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { StatBubble } from '@/components/dashboard/stat-bubble';
import { JobCard } from '@/components/dashboard/job-card';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const db = getDb();
  const jobs = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all() as JobRow[];
  const totalRecords = jobs.reduce((s, j) => s + j.records_valid, 0);
  const running = jobs.filter(j => j.status === 'running').length;
  const complete = jobs.filter(j => j.status === 'complete').length;

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="ml-60 flex-1 flex flex-col">
        <TopBar title="Dashboard" />
        <div className="flex-1 p-8 space-y-8">
          <div className="grid grid-cols-4 gap-4">
            <StatBubble label="Total Jobs" value={jobs.length} />
            <StatBubble label="Running" value={running} color="text-yellow-500" />
            <StatBubble label="Completed" value={complete} color="text-green-500" />
            <StatBubble label="Records Collected" value={totalRecords} color="text-sky" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-text uppercase tracking-wide">Scrape Jobs</h2>
              <Link href="/jobs/new" className="clay-btn-primary px-5 py-2 text-sm font-bold text-white">
                + New Scrape
              </Link>
            </div>
            {jobs.length === 0
              ? <div className="neo-card p-12 text-center text-gray-text">No jobs yet. Start your first scrape.</div>
              : <div className="grid grid-cols-2 gap-4">
                  {jobs.map(j => <JobCard key={j.id} job={j} />)}
                </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
