import type { XeroHistoryResult } from './xeroCustomerHistory.ts';
import type { LifecycleWorkspace } from './lifecycleModel.ts';
/** Core records. Reservations, contracts and inventory retain their existing IDs. */
export interface CustomerProfile {
  id: string;
  kind: 'person' | 'business' | 'unknown';
  name: string;
  email: string;
  phone: string;
  primaryContact?: string;
  archived: boolean;
  legacyReservationIds: string[];
  version?: number;
}
export interface Rental {
  id: string;
  customerId: string;
  reservationId: string | null;
  address: string;
  notes: string;
  source?: 'inventory_link';
}
export interface SaunaAsset {
  id: string;
  code: string;
  model: string;
  sourceStatus?: string;
  typeName?: string;
}
export interface SaunaAssignment {
  id: string;
  rentalId: string;
  assetId: string;
  installedOn: string;
  removedOn: string | null;
  address: string;
}
export interface XeroCustomerLink { customerId: string; tenantId: string; contactId: string; name: string; shortCode?: string; origin?: string; }
export interface RentalWorkspace {
  lifecycle?: LifecycleWorkspace;
  xeroLinks?: XeroCustomerLink[];
  xeroHistory?: XeroHistoryResult;
  reservations?: { id: string; createdAt: string; status: string; address: string; saunaType: string; stripeCustomerId: string | null; bookingKind?:string; bookedOn?:string|null }[];
  customers: CustomerProfile[];
  rentals: Rental[];
  assets: SaunaAsset[];
  assignments: SaunaAssignment[];
  source?: { exportedAt: string };
  legacyInventory?: Record<string, unknown>[];
  legacyTypes?: { id: string; name: string; sort_order: number }[];
  legacyLinks?: { assetId: string; rentalId: string; kind: 'current' | 'future'; recordedInstallDate: string | null }[];
}
export const emptyRentalWorkspace = (): RentalWorkspace => ({ customers: [], rentals: [], assets: [], assignments: [] });
export function requireDate(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) {
    throw new Error('Enter a valid calendar date.');
  }
}
export function customerName(customer: CustomerProfile): string {
  return customer.name || customer.email || 'Unnamed customer';
}
export function possibleDuplicates(customers: CustomerProfile[], customer: CustomerProfile): CustomerProfile[] {
  const email = customer.email.trim().toLowerCase();
  return email ? customers.filter(other => other.id !== customer.id && other.email.trim().toLowerCase() === email) : [];
}
export function saveCustomer(state: RentalWorkspace, customer: CustomerProfile): RentalWorkspace {
  const previous = state.customers.find(row => row.id === customer.id);
  if (!customer.name.trim() && !customer.email.trim()) throw new Error('Enter a customer name or email.');
  if (customer.archived && state.assignments.some(a => !a.removedOn && state.rentals.some(r => r.id === a.rentalId && r.customerId === customer.id))) {
    throw new Error('Return installed saunas before archiving this customer.');
  }
  const next = { ...customer, name: customer.name.trim(), email: customer.email.trim(), phone: customer.phone.trim(), legacyReservationIds: previous?.legacyReservationIds ?? [] };
  return { ...state, customers: previous ? state.customers.map(row => row.id === next.id ? next : row) : [...state.customers, next] };
}
export function addRental(state: RentalWorkspace, rental: Rental): RentalWorkspace {
  const customer = state.customers.find(row => row.id === rental.customerId && !row.archived);
  if (!customer) throw new Error('Choose an active customer.');
  if (!rental.address.trim()) throw new Error('Enter the service address.');
  if (rental.reservationId && !customer.legacyReservationIds.includes(rental.reservationId)) throw new Error('Choose a reservation linked to this customer.');
  if (state.rentals.some(row => row.id === rental.id || (rental.reservationId && row.reservationId === rental.reservationId))) throw new Error('This reservation already has a rental.');
  return { ...state, rentals: [...state.rentals, { ...rental, address: rental.address.trim() }] };
}
export function addAsset(state: RentalWorkspace, asset: SaunaAsset): RentalWorkspace {
  if (!asset.code.trim()) throw new Error('Enter the sauna number.');
  if (state.assets.some(row => row.id === asset.id || row.code === asset.code.trim())) throw new Error('That sauna number already exists.');
  return { ...state, assets: [...state.assets, { ...asset, code: asset.code.trim(), model: asset.model.trim() }] };
}
export function addAssignment(state: RentalWorkspace, assignment: SaunaAssignment): RentalWorkspace {
  requireDate(assignment.installedOn);
  if (assignment.removedOn) { requireDate(assignment.removedOn); if (assignment.removedOn <= assignment.installedOn) throw new Error('Return date must be after installation.'); }
  const rental = state.rentals.find(row => row.id === assignment.rentalId);
  if (!rental || !state.assets.some(row => row.id === assignment.assetId)) throw new Error('Choose a rental and sauna.');
  if (!state.customers.some(row => row.id === rental.customerId && !row.archived)) throw new Error('Restore this customer before assigning a sauna.');
  if (state.legacyLinks?.some(link => link.assetId === assignment.assetId && link.kind === 'current')) throw new Error('This sauna has an imported current-customer link with unconfirmed dates. Review that history before creating an installation.');
  if (state.assignments.some(row => row.id === assignment.id)) throw new Error('This assignment already exists.');
  if (state.assignments.some(row => row.assetId === assignment.assetId && row.installedOn < (assignment.removedOn || '9999-12-31') && assignment.installedOn < (row.removedOn || '9999-12-31'))) {
    throw new Error('This sauna already has an installation during those dates. Record its return first.');
  }
  return { ...state, assignments: [...state.assignments, { ...assignment, address: rental.address }] };
}
export function recordReturn(state: RentalWorkspace, assignmentId: string, removedOn: string): RentalWorkspace {
  requireDate(removedOn);
  const row = state.assignments.find(a => a.id === assignmentId);
  if (!row || row.removedOn) throw new Error('Choose an installed sauna.');
  if (removedOn <= row.installedOn) throw new Error('Return date must be after installation.');
  return { ...state, assignments: state.assignments.map(a => a.id === assignmentId ? { ...a, removedOn } : a) };
}
export function rentalStatus(state: RentalWorkspace, rentalId: string): string {
  const assignments = state.assignments.filter(a => a.rentalId === rentalId);
  if (assignments.length) return assignments.some(a => !a.removedOn) ? 'Installed' : 'Returned';
  const links = state.legacyLinks?.filter(link => link.rentalId === rentalId) || [];
  if (!links.length && state.rentals.find(r => r.id === rentalId)?.source === 'inventory_link') return 'No current inventory link · history unconfirmed';
  return links.some(link => link.kind === 'current') ? 'Existing current link · history unconfirmed' : links.length ? 'Existing future link · not an installation' : 'Not installed';
}
