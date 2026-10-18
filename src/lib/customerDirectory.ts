import { customerLtv } from './customerLtv.ts';
import { customerName, type RentalWorkspace } from './rentalModel.ts';

export type DirectoryColumn = 'name' | 'phone' | 'reservations' | 'saunas' | 'stripe' | 'xero' | 'committed' | 'actual';
export type DirectoryFilters = Partial<Record<DirectoryColumn, string>>;
export function stripeCustomerUrl(id: string): string | null {
  return /^cus_[A-Za-z0-9]+$/.test(id) ? `https://dashboard.stripe.com/customers/${id}` : null;
}
export function xeroContactUrl(id: string, shortCode?: string): string | null {
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  if(shortCode && /^![A-Za-z0-9_-]+$/.test(shortCode)) { const url=new URL('https://go.xero.com/organisationlogin/default.aspx');url.searchParams.set('shortcode',shortCode);url.searchParams.set('redirecturl',`/Contacts/View/${id}`);return url.toString(); }
  return `https://go.xero.com/Contacts/View/${id}`;
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
    const xeroLinks = (state.xeroLinks || []).filter(l => l.customerId === customer.id);
    const ltv = customerLtv(state, customer.id);
    const amountText = (amount: number | null) => amount === null ? 'Unknown' : `${(amount / 100).toFixed(2)} ${new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'}).format(amount / 100)}`;
    return { customer, reservations, saunas, stripeIds, xeroLinks, ltv, text: {
      committed: amountText(ltv.committed), actual: amountText(ltv.actual),
      name: customerName(customer), phone: customer.phone,
      reservations: reservations.map(r => `${r.id} ${r.createdAt.slice(0, 10)} ${r.status}`).join(' '),
      saunas: saunas.map(a => `${a.code} ${a.typeName || a.model}`).join(' '), stripe: stripeIds.join(' '), xero: xeroLinks.map(l => `${l.name} ${l.contactId}`).join(' '),
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
    .sort((a, b) => {
      if (sort === 'committed' || sort === 'actual') {
        const left = a.ltv[sort], right = b.ltv[sort];
        if (left === null && right !== null) return 1;
        if (right === null && left !== null) return -1;
        return (descending ? -1 : 1) * ((left ?? 0) - (right ?? 0)) || compare.compare(a.text.name, b.text.name);
      }
      return (descending ? -1 : 1) * compare.compare(a.text[sort], b.text[sort]) || compare.compare(a.customer.id, b.customer.id);
    });
}
