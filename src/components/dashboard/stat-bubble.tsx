export function StatBubble({ label, value, color = 'text-dark' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="clay-bubble p-5 text-center space-y-1">
      <div className={`text-3xl font-black ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="text-xs text-gray-text font-semibold uppercase tracking-wide">{label}</div>
    </div>
  );
}
