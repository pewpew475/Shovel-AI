import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const origin = req.headers.get('origin') ?? '';
  try {
    const originHost = new URL(origin).hostname;
    const requestHost = host.split(':')[0];
    if (originHost !== requestHost) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { email, password } = (await req.json()) as { email: string; password: string };
  const adminEmail = process.env.ADMIN_EMAIL ?? '';
  const adminHash = process.env.ADMIN_PASSWORD_HASH ?? '';

  if (email !== adminEmail || !(await verifyPassword(password, adminHash))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
  return res;
}
