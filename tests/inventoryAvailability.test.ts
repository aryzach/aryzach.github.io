import test from 'node:test';import assert from 'node:assert/strict';
import {inventoryAvailability,availabilityAfterInbound,type AvailabilityInput} from '../src/lib/inventoryAvailability.ts';
const warehouse:AvailabilityInput={status:'Available',currentCustomer:false,reserved:false,condition:'ready'};
test('warehouse readiness never overrides reservations, customers or retirement',()=>{
 assert.equal(inventoryAvailability(warehouse).kind,'Available now');
 for(const patch of [{reserved:true},{currentCustomer:true},{retired:true},{condition:'inspection'},{condition:'maintenance'},{condition:'unknown'}])assert.equal(inventoryAvailability({...warehouse,...patch}).kind,'Unavailable');
});
test('inbound and booking dates are independent and strictly ordered',()=>{
 const inbound={...warehouse,status:'Incoming',inboundOn:'2026-11-04'};
 for(const availableOn of [null,'2026-11-03','2026-11-04'])assert.equal(inventoryAvailability({...inbound,availableOn}).kind,'Unavailable');
 assert.deepEqual(inventoryAvailability({...inbound,availableOn:'2026-11-10'}).label,'Available on 2026-11-10');
 assert.equal(inventoryAvailability({...inbound,availableOn:'2026-11-10',reserved:true}).kind,'Unavailable');
 assert.equal(inventoryAvailability({...inbound,inboundOn:null,availableOn:'2026-11-10'}).kind,'Unavailable');
 assert.equal(availabilityAfterInbound('','2026-11-10'),false);
 assert.equal(availabilityAfterInbound('2026-11-04','2026-11-04'),false);
 assert.equal(availabilityAfterInbound('2026-11-04','2026-11-05'),true);
});
