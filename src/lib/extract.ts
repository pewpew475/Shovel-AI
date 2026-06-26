export interface Lead {
  businessName: string;
  phone: string;
  whatsapp: string;
  address: string;
  locality: string;
}

export interface RawExtract {
  businessName?: string;
  phones?: string[];
  whatsapp?: string;
  address?: string;
  locality?: string;
}

export function normalizePhone(raw: string): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  // Strip country code 91xxxxxxxxxx → xxxxxxxxxx
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  // Strip leading 0: 0xxxxxxxxxx → xxxxxxxxxx
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.length === 10 ? digits : '';
}

export function parseLead(raw: RawExtract, fallbackLocality: string): Lead | null {
  const name = raw.businessName?.trim() ?? '';
  const phones = (raw.phones ?? []).map(normalizePhone).filter(Boolean);
  const whatsapp = normalizePhone(raw.whatsapp ?? '') || phones[0] || '';
  const address = raw.address?.trim() ?? '';
  const locality = raw.locality?.trim() || fallbackLocality;

  if (!name && phones.length === 0) return null;

  return {
    businessName: name,
    phone: phones[0] ?? '',
    whatsapp,
    address,
    locality,
  };
}
