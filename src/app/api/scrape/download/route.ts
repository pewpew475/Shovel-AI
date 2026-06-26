import { getLeads } from '@/lib/store';
import { buildExcelBuffer } from '@/lib/excel';

export async function GET(): Promise<Response> {
  const leads = getLeads();
  if (leads.length === 0) {
    return new Response('No leads collected yet', { status: 404 });
  }
  const buffer = buildExcelBuffer(leads);
  const date = new Date().toISOString().split('T')[0];
  return new Response(buffer, {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="masala-leads-${date}.xlsx"`,
      'Content-Length': buffer.length.toString(),
    },
  });
}
