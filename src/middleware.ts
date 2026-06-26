import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];
const rawSecret = process.env.SESSION_SECRET;
if (!rawSecret) throw new Error('SESSION_SECRET env var is not set');
const secret = new TextEncoder().encode(rawSecret);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next();

  const token = request.cookies.get('shovel_session')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', request.url));

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
