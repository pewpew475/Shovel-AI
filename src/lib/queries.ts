const BUSINESS_TYPES = [
  'masala retailer',
  'spice distributor',
  'kirana wholesaler',
  'masala wholesaler',
  'spice shop',
  'grocery distributor',
  'FMCG distributor',
  'provision store',
  'dry fruit shop',
  'spice supplier',
  'masala dealer',
];

export const LOCALITIES = [
  'Khari Baoli',
  'Chandni Chowk',
  'Naya Bazar',
  'Sadar Bazar',
  'Karol Bagh',
  'Rohini',
  'Pitampura',
  'Punjabi Bagh',
  'Janakpuri',
  'Dwarka',
  'Laxmi Nagar',
  'Shahdara',
  'Uttam Nagar',
  'Mayur Vihar',
  'Preet Vihar',
  'Okhla',
  'Nehru Place',
  'South Delhi',
  'North Delhi',
  'East Delhi',
];

export function generateQueries(): string[] {
  return BUSINESS_TYPES.flatMap(type =>
    LOCALITIES.map(loc => `${type} in ${loc} Delhi`)
  );
}
