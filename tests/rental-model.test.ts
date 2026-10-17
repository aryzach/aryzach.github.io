import assert from 'node:assert/strict';
import test from 'node:test';
import { addAsset, addAssignment, addRental, emptyRentalWorkspace, possibleDuplicates, recordReturn, rentalStatus, requireDate, saveCustomer } from '../src/lib/rentalModel.ts';
const customer = (id = 'customer-1') => ({ id, kind: 'person' as const, name: 'Local test', email: 'local@example.invalid', phone: '', archived: false, legacyReservationIds: [] });
function workspace() {
  let state = saveCustomer(emptyRentalWorkspace(), customer());
  state = addAsset(state, { id: 'asset-1', code: '001', model: '' });
  return addRental(state, { id: 'rental-1', customerId: 'customer-1', reservationId: null, address: 'Local test address', notes: '' });
}
const assignment = (id = 'assignment-1', rentalId = 'rental-1', installedOn = '2026-10-01') => ({ id, rentalId, assetId: 'asset-1', installedOn, removedOn: null, address: 'ignored' });
test('shared emails remain separate profiles, with a review hint', () => {
  const state = saveCustomer(saveCustomer(emptyRentalWorkspace(), customer()), customer('customer-2'));
  assert.equal(state.customers.length, 2);
  assert.equal(possibleDuplicates(state.customers, state.customers[0])[0].id, 'customer-2');
});
test('rental and installation preserve the input, identity and address snapshot', () => {
  const before = workspace(); const snapshot = structuredClone(before);
  const next = addAssignment(before, assignment());
  assert.deepEqual(before, snapshot);
  assert.equal(next.assets[0].id, 'asset-1');
  assert.equal(next.assignments[0].address, before.rentals[0].address);
  assert.equal(rentalStatus(before, 'rental-1'), 'Not installed');
  assert.equal(rentalStatus(next, 'rental-1'), 'Installed');
});
test('overlap denied; return followed by boundary-day reassignment is valid', () => {
  let state = addAssignment(workspace(), assignment());
  state = addRental(state, { id: 'rental-2', customerId: 'customer-1', reservationId: null, address: 'Second address', notes: '' });
  assert.throws(() => addAssignment(state, assignment('assignment-2', 'rental-2')), /already has/);
  state = recordReturn(state, 'assignment-1', '2026-10-15');
  state = addAssignment(state, assignment('assignment-2', 'rental-2', '2026-10-15'));
  assert.equal(state.assignments.length, 2);
  assert.equal(rentalStatus(state, 'rental-1'), 'Returned');
  assert.equal(rentalStatus(state, 'rental-2'), 'Installed');
});
test('multiple units can belong to the same rental; invalid dates cannot enter history', () => {
  let state = addAssignment(workspace(), assignment());
  state = addAsset(state, { id: 'asset-2', code: '002', model: '' });
  state = addAssignment(state, { ...assignment('assignment-2'), assetId: 'asset-2' });
  assert.equal(state.assignments.length, 2);
  assert.throws(() => recordReturn(state, 'assignment-1', '2026-10-01'), /after installation/);
  for (const date of ['2026-02-30', '', 'tomorrow', '2026-13-01']) assert.throws(() => requireDate(date), /valid calendar/);
});
test('archival retains history and cannot hide an installed customer', () => {
  const state = addAssignment(workspace(), assignment());
  assert.throws(() => saveCustomer(state, { ...customer(), archived: true }), /Return installed/);
  const returned = recordReturn(state, 'assignment-1', '2026-10-15');
  const archived = saveCustomer(returned, { ...customer(), archived: true });
  assert.deepEqual(archived.assignments, returned.assignments);
  assert.throws(() => addRental(archived, { ...archived.rentals[0], id: 'new' }), /active customer/);
});
test('reservation link must belong to that customer; editing cannot replace legacy links', () => {
  const state = workspace(); state.customers[0].legacyReservationIds = ['legacy-id'];
  const edited = saveCustomer(state, { ...state.customers[0], legacyReservationIds: ['wrong-id'], name: 'Edited' });
  assert.deepEqual(edited.customers[0].legacyReservationIds, ['legacy-id']);
  assert.throws(() => addRental(state, { ...state.rentals[0], id: 'other', reservationId: 'wrong-id' }), /linked to this customer/);
});
