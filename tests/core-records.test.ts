import assert from 'node:assert/strict';
import test from 'node:test';
import { readCoreRecords } from '../supabase/functions/_shared/coreRecords.ts';
function client(fail = '') {
  const rows: Record<string, object[]> = {
    customer_profiles: [{ id:'c1', kind:'unknown', display_name:'Local', email:'local@example.invalid', phone:null, archived_at:null, version:2, secret:'excluded' }],
    reservation_customer_links: [{ reservation_id:'r1',customer_id:'c1' }],
    rentals: [{ id:'rental1',customer_id:'c1',originating_reservation_id:'r1',service_address:'Local',notes:null,origin:'legacy_inventory_link' }],
    sauna_inventory: [{ id:'asset1',unit_code:'001',model:'Original',status:'Maintenance',current_customer_id:'r1',future_customer_id:null,install_date:'2026-01-01',secret:'excluded' }],
  };
  return { from(name: string) {
    assert.ok(Object.hasOwn(rows,name));
    const result = { data:rows[name],error:name===fail ? new Error('query failed') : null };
    return { select() { return { ...result, order() { return Promise.resolve(result); } }; } };
  } };
}
test('admin model retains identities, independent records and unconfirmed inventory links',async()=>{
  const result=await readCoreRecords(client());
  assert.equal(result.customers[0].id,'c1');
  assert.equal(result.customers[0].version,2);
  assert.deepEqual(result.customers[0].legacyReservationIds,['r1']);
  assert.equal(result.rentals[0].id,'rental1');
  assert.equal(result.assets[0].sourceStatus,'Maintenance');
  assert.deepEqual(result.assignments,[]);
  assert.equal(result.legacyLinks[0].kind,'current');
  assert.equal(result.legacyLinks[0].recordedInstallDate,'2026-01-01');
  assert.equal(JSON.stringify(result).includes('excluded'),false);
});
test('partial backend reads fail instead of hiding missing customer data',async()=>{
  await assert.rejects(readCoreRecords(client('rentals')),/query failed/);
});
