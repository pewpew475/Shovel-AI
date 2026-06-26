import { sanitizeCell, buildJson, buildXml } from '@/lib/export/xlsx';

describe('sanitizeCell', () => {
  it('prefixes formula starters with apostrophe', () => {
    expect(sanitizeCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(sanitizeCell('+chain')).toBe("'+chain");
    expect(sanitizeCell('-1')).toBe("'-1");
    expect(sanitizeCell('@user')).toBe("'@user");
  });

  it('leaves safe values alone', () => {
    expect(sanitizeCell('hello')).toBe('hello');
    expect(sanitizeCell(42)).toBe(42);
    expect(sanitizeCell(null)).toBe('');
  });
});

describe('buildJson', () => {
  it('produces valid JSON array', () => {
    const rows = [{ name: 'Alice', age: '30' }];
    const out = buildJson(rows);
    expect(JSON.parse(out)).toEqual(rows);
  });
});

describe('buildXml', () => {
  it('escapes XML entities', () => {
    const rows = [{ name: 'A&B', title: '<Engineer>' }];
    const out = buildXml(rows, ['name', 'title']);
    expect(out).toContain('A&amp;B');
    expect(out).toContain('&lt;Engineer&gt;');
  });
});
