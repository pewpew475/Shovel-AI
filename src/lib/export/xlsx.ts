import * as XLSX from 'xlsx';

export function sanitizeCell(value: unknown): unknown {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' && /^[=+\-@]/.test(value)) return `'${value}`;
  return value;
}

export function buildXlsx(rows: Record<string, unknown>[], fields: string[]): Buffer {
  const data = [
    fields,
    ...rows.map(r => fields.map(f => sanitizeCell(r[f]))),
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Results');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

export function buildJson(rows: Record<string, unknown>[]): string {
  return JSON.stringify(rows, null, 2);
}

export function buildXml(rows: Record<string, unknown>[], fields: string[]): string {
  function esc(v: unknown): string {
    return String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
  const items = rows.map(r =>
    `  <record>\n${fields.map(f => `    <${f}>${esc(r[f])}</${f}>`).join('\n')}\n  </record>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<dataset>\n${items.join('\n')}\n</dataset>`;
}
