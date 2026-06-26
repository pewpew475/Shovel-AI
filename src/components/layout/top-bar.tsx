'use client';
import { useRouter } from 'next/navigation';

export function TopBar({ title }: { title: string }) {
  const router = useRouter();
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }
  return (
    <header className="h-16 flex items-center justify-between px-8 neo-card rounded-none rounded-b-2xl mb-6">
      <h1 className="text-lg font-bold text-dark">{title}</h1>
      <button onClick={logout} className="clay-btn-secondary px-5 py-2 text-sm font-semibold">
        Sign Out
      </button>
    </header>
  );
}
