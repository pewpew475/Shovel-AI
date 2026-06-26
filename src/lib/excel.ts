import * as XLSX from 'xlsx';
import type { Lead } from '@/lib/extract';

export function buildExcelBuffer(leads: Lead[]): Buffer {
  const rows = leads.map((l, i) => ({
    'S.No': i + 1,
    'Business Name': l.businessName,
    'Phone': l.phone,
    'WhatsApp': l.whatsapp,
    'Address': l.address,
    'Locality': l.locality,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 40 }, // Business Name
    { wch: 15 }, // Phone
    { wch: 15 }, // WhatsApp
    { wch: 60 }, // Address
    { wch: 20 }, // Locality
  ];

  // Bold header row
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    if (ws[cellRef]) {
      ws[cellRef].s = { font: { bold: true } };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Masala Leads');

  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}
