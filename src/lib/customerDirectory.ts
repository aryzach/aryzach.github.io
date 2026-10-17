import { customerName, type RentalWorkspace } from './rentalModel.ts';

export type DirectoryColumn = 'name' | 'phone' | 'reservations' | 'saunas' | 'stripe';
export type DirectoryFilters = Partial<Record<DirectoryColumn, string>>;
export function stripeCustomerUrl(id: string): string | null {
  return /^cus_[A-Za-z0-9]+$/.test(id) ? `https://dashboard.stripe.com/customers/${id}` : null;
}
export function customerDirectory(state: RentalWorkspace) {
  return state.customers.map(customer => {
    const reservations = customer.legacyReservationIds.map(id => state.reservations?.find(r => r.id === id) || { id, createdAt: '', status: '', address: '', saunaType: '', stripeCustomerId: null });
    const rentalIds = new Set(state.rentals.filter(r => r.customerId === customer.id).map(r => r.id));
    const currentIds = new Set([
      ...(state.legacyLinks || []).filter(l => l.kind === 'current' && rentalIds.has(l.rentalId)).map(l => l.assetId),
      ...state.assignments.filter(a => !a.removedOn && rentalIds.has(a.rentalId)).map(a => a.assetId),
    ]);
    const saunas = state.assets.filter(a => currentIds.has(a.id));
    const stripeIds = [...new Set(reservations.flatMap(r => r.stripeCustomerId && stripeCustomerUrl(r.stripeCustomerId) ? [r.stripeCustomerId] : []))];
    return { customer, reservations, saunas, stripeIds, text: {
      name: customerName(customer), phone: customer.phone,
      reservations: reservations.map(r => `${r.id} ${r.createdAt.slice(0, 10)} ${r.status}`).join(' '),
      saunas: saunas.map(a => `${a.code} ${a.typeName || a.model}`).join(' '), stripe: stripeIds.join(' '),
    } };
  });
}
export type DirectoryRow = ReturnType<typeof customerDirectory>[number];
const compare = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const matches = (value: string, query: string, phone = false) => {
  if (value.toLowerCase().includes(query.trim().toLowerCase())) return true;
  const digits = query.replace(/\D/g, '');
  return phone && digits.length > 0 && /^[-\d\s()+.]+$/.test(query) && value.replace(/\D/g, '').includes(digits);
};
export function filterDirectory(rows: DirectoryRow[], search: string, filters: DirectoryFilters, showArchived: boolean, sort: DirectoryColumn, descending: boolean) {
  return rows.filter(row => (showArchived || !row.customer.archived)
    && (!search.trim() || Object.entries(row.text).some(([key, value]) => matches(value, search, key === 'phone')))
    && Object.entries(filters).every(([key, value]) => !value?.trim() || matches(row.text[key as DirectoryColumn], value, key === 'phone')))
    .sort((a, b) => (descending ? -1 : 1) * compare.compare(a.text[sort], b.text[sort]) || compare.compare(a.customer.id, b.customer.id));
}
