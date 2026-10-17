import assert from 'node:assert/strict';
import test from 'node:test';
import { customerDirectory, filterDirectory, stripeCustomerUrl } from '../src/lib/customerDirectory.ts';
import { emptyRentalWorkspace } from '../src/lib/rentalModel.ts';
const workspace = () => ({ ...emptyRentalWorkspace(), customers: [
  { id: 'c1', kind: 'person' as const, name: 'Customer 10', phone: '(415) 555-0123', email: '', archived: false, legacyReservationIds: ['r1', 'r2'] },
  { id: 'c2', kind: 'person' as const, name: 'Customer 2', phone: '', email: '', archived: false, legacyReservationIds: [] },
  { id: 'c3', kind: 'person' as const, name: 'Archived', phone: '', email: '', archived: true, legacyReservationIds: [] },
], reservations: ['r1', 'r2'].map(id => ({ id, createdAt: '2026-01-01', status: 'Installed', address: '', saunaType: 'Infrared', stripeCustomerId: 'cus_existing' })),
  rentals: [{ id: 'rental', customerId: 'c1', reservationId: 'r1', address: '', notes: '' }],
  assets: [{ id: 'a1', code: '10', model: '', typeName: 'Infrared' }, { id: 'a2', code: '20', model: '', typeName: 'Traditional' }],
  legacyLinks: [{ assetId: 'a1', rentalId: 'rental', kind: 'current' as const, recordedInstallDate: null }, { assetId: 'a2', rentalId: 'rental', kind: 'future' as const, recordedInstallDate: null }],
});
test('directory keeps each reservation, deduplicates existing Stripe customers and excludes future saunas', () => {
  const [row] = customerDirectory(workspace());
  assert.deepEqual(row.reservations.map(r => r.id), ['r1', 'r2']);
  assert.deepEqual(row.stripeIds, ['cus_existing']);
  assert.deepEqual(row.saunas.map(a => a.code), ['10']);
  assert.equal(row.text.saunas, '10 Infrared');
});
test('search, column filters and numeric sorting combine without losing source rows', () => {
  const rows = customerDirectory(workspace());
  assert.deepEqual(filterDirectory(rows, '', {}, false, 'name', false).map(r => r.customer.id), ['c2', 'c1']);
  assert.deepEqual(filterDirectory(rows, '4155550123', { saunas: 'infrared', reservations: 'r2' }, false, 'name', true).map(r => r.customer.id), ['c1']);
  assert.equal(filterDirectory(rows, '', { saunas: 'Traditional' }, true, 'name', false).length, 0);
  assert.equal(filterDirectory(rows, 'cus_existing', {}, false, 'name', false).length, 1);
  assert.equal(filterDirectory(rows, '', {}, true, 'name', false).length, 3);
  assert.equal(rows.length, 3);
});
test('Stripe links accept only existing customer identifier syntax', () => {
  assert.equal(stripeCustomerUrl('cus_123Abc'), 'https://dashboard.stripe.com/customers/cus_123Abc');
  for (const id of ['', 'javascript:alert(1)', 'cus_../other', 'https://example.invalid']) assert.equal(stripeCustomerUrl(id), null);
});
