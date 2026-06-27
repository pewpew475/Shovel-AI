import { getDb } from '@/lib/db';

describe('db migrations', () => {
  it('creates all tables', () => {
    const db = getDb();
    const tables = (db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table'`)
      .all() as Array<{ name: string }>)
      .map((r) => r.name);
    expect(tables).toContain('jobs');
    expect(tables).toContain('results');
    expect(tables).toContain('sessions');
  });
});
