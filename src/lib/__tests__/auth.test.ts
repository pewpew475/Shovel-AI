import { verifyPassword, createSessionToken, verifySessionToken } from '@/lib/auth';

process.env.SESSION_SECRET = 'a'.repeat(64);

describe('auth', () => {
  it('verifyPassword: matches correct password', async () => {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash('secret123', 10);
    expect(await verifyPassword('secret123', hash)).toBe(true);
  });

  it('verifyPassword: rejects wrong password', async () => {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.hash('secret123', 10);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('createSessionToken + verifySessionToken: round-trip', async () => {
    const token = await createSessionToken();
    expect(typeof token).toBe('string');
    expect(await verifySessionToken(token)).toBe(true);
  });

  it('verifySessionToken: rejects garbage', async () => {
    expect(await verifySessionToken('not-a-token')).toBe(false);
  });
});
