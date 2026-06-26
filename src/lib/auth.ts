import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

export const COOKIE_NAME = 'shovel_session';
const EXPIRY = '24h';

function secret(): Uint8Array {
  return new TextEncoder().encode(process.env.SESSION_SECRET!);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret());
    return true;
  } catch {
    return false;
  }
}
