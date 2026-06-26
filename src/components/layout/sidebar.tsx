'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⬛' },
  { href: '/jobs/new', label: 'New Scrape', icon: '✦' },
];

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-60 min-h-screen neo-card rounded-none rounded-r-3xl p-6 flex flex-col gap-2 fixed left-0 top-0">
      <div className="mb-8 px-2">
        <span className="text-2xl font-black text-dark tracking-tight">Shovel</span>
        <span className="text-2xl font-black text-sky"> AI</span>
      </div>
      {NAV.map(n => (
        <Link key={n.href} href={n.href}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all
            ${path.startsWith(n.href)
              ? 'clay-bubble text-sky'
              : 'text-gray-text hover:text-dark hover:bg-white/50'}`}>
          <span>{n.icon}</span>{n.label}
        </Link>
      ))}
    </aside>
  );
}
