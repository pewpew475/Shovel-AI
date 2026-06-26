'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push('/dashboard');
    } else {
      setError('Invalid credentials');
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="neo-card w-full max-w-md p-10 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-dark tracking-tight">Shovel AI</h1>
          <p className="text-gray-text text-sm">AI-powered data scraping platform</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-text uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="neo-input w-full px-4 py-3 text-dark placeholder-gray-text/50 outline-none"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-text uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="neo-input w-full px-4 py-3 text-dark outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading} className="clay-btn-primary w-full py-3 font-bold text-white">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
