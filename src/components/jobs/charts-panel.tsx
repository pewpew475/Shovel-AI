'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ResultRow { record: Record<string, unknown>; valid: number; created_at: string }

const COLORS = ['#7EC8E3', '#B8E4F2', '#5ab5d4', '#3a9fc0', '#2a8aab'];

export function ChartsPanel({ results, fields }: { results: ResultRow[]; fields: string[] }) {
  const timeData = Object.entries(
    results.reduce<Record<string, number>>((acc, r) => {
      const t = r.created_at.slice(11, 16);
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([time, count]) => ({ time, count })).slice(-20);

  const fieldData = fields.map(f => ({
    field: f,
    pct: Math.round((results.filter(r => r.record[f] != null && r.record[f] !== '').length / (results.length || 1)) * 100),
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold text-gray-text uppercase tracking-wide mb-4">Records Over Time</p>
        <div className="neo-inset p-4">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={timeData}>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8899aa' }} />
              <YAxis tick={{ fontSize: 10, fill: '#8899aa' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(126,200,227,0.2)' }} />
              <Bar dataKey="count" fill="#7EC8E3" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-text uppercase tracking-wide mb-4">Field Completeness</p>
        <div className="neo-inset p-4 flex items-center gap-8">
          <ResponsiveContainer width="50%" height={160}>
            <PieChart>
              <Pie data={fieldData} dataKey="pct" nameKey="field" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                {fieldData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`]}
                contentStyle={{ borderRadius: 12, border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {fieldData.map((d, i) => (
              <div key={d.field} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-gray-text">{d.field}</span>
                <span className="font-bold text-dark ml-auto">{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
