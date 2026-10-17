import assert from 'node:assert/strict';
import test from 'node:test';
import { importRentalSnapshot } from '../src/lib/importRentalSnapshot.ts';
import { addAssignment, rentalStatus } from '../src/lib/rentalModel.ts';
const snapshot = () => ({ exported_at: '2026-01-01T00:00:00Z', tables: { reservations: [
  { id: 'r1', first_name: 'One', email: 'shared@example.invalid', secure_token: 'exclude-token', stripe_customer_id: 'exclude-stripe' },
  { id: 'r2', first_name: 'Two', email: 'shared@example.invalid' },
  { id: 'r3', first_name: 'Three' },
], sauna_inventory: [
  { id: 'unit-id', unit_code: '001', model: 'Original model', status: 'Maintenance', current_customer_id: 'r1', future_customer_id: 'r2', install_date: '2026-01-01' },
  { id: 'unassigned-unit', unit_code: '002', status: 'Sold' },
] } });
test('local import preserves source and physical IDs, with one identity per reservation', () => {
  const original = snapshot(); const before = structuredClone(original);
  const state = importRentalSnapshot(original);
  assert.deepEqual(original, before);
  assert.equal(state.customers.length, 3);
  assert.equal(new Set(state.customers.map(c => c.id)).size, 3);
  assert.deepEqual(state.customers.map(c => c.legacyReservationIds), [['r1'], ['r2'], ['r3']]);
  assert.deepEqual(state.assets.map(a => a.id), ['unit-id', 'unassigned-unit']);
  assert.equal(state.assets[0].code, '001');
  assert.equal(state.assets[0].sourceStatus, 'Maintenance');
  assert.equal(JSON.stringify(state).includes('exclude-token'), false);
  assert.equal(JSON.stringify(state).includes('exclude-stripe'), false);
});
test('current/future links are shown without inventing confirmed rental intervals', () => {
  const state = importRentalSnapshot(snapshot());
  assert.equal(state.rentals.length, 2);
  assert.equal(state.legacyLinks?.length, 2);
  assert.equal(state.assignments.length, 0);
  assert.match(rentalStatus(state, 'local-rental:r1'), /history unconfirmed/);
  assert.match(rentalStatus(state, 'local-rental:r2'), /not an installation/);
  assert.equal(state.legacyLinks?.[0].recordedInstallDate, '2026-01-01');
  assert.equal(state.legacyLinks?.[1].recordedInstallDate, null);
  assert.throws(() => addAssignment(state, { id: 'new', rentalId: 'local-rental:r2', assetId: 'unit-id', installedOn: '2026-10-01', removedOn: null, address: '' }), /unconfirmed dates/);
});
test('unresolved links fail rather than dropping a relationship silently', () => {
  const original = snapshot(); original.tables.sauna_inventory[0].current_customer_id = 'missing';
  assert.throws(() => importRentalSnapshot(original), /unresolved/);
});
