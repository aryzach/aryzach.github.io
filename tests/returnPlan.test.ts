import test from 'node:test';
import assert from 'node:assert/strict';
import {validateReturnPlan,returnPlanEditable} from '../src/lib/returnPlan.ts';
import {inventoryAvailability} from '../src/lib/inventoryAvailability.ts';

test('return plans require valid dates, future pickup and same-day redeployment',()=>{
 assert.doesNotThrow(()=>validateReturnPlan('2026-11-11','2026-11-12','2026-10-28'));
 assert.doesNotThrow(()=>validateReturnPlan('2026-11-11','2026-11-11','2026-10-28'));
 assert.doesNotThrow(()=>validateReturnPlan('2026-10-28','2026-10-28','2026-10-28'));
 for(const [pickup,available] of [['2026-10-27','2026-11-12'],['2026-11-11','2026-11-10'],['2026-02-30','2026-11-12'],['','2026-11-12']])assert.throws(()=>validateReturnPlan(pickup,available,'2026-10-28'));
});
test('only customer-held units can have a return planned',()=>{
 const row={current_customer_id:'reservation',status:'Installed'};
 assert.equal(returnPlanEditable(row),true);
 for(const r of [undefined,{...row,current_customer_id:null},{...row,retired_on:'2026-10-28'},{...row,status:'Sold'}])assert.equal(returnPlanEditable(r),false);
});
test('planned pickup advertises future availability without making the held unit available now',()=>{
 const held={status:'Installed',currentCustomer:true,reserved:false,condition:'ready',plannedPickupOn:'2026-11-11',availableOn:'2026-11-12',today:'2026-10-28'};
 assert.equal(inventoryAvailability(held).label,'Available on 2026-11-12');
 assert.match(inventoryAvailability(held).reason,/still with current customer/);
 assert.equal(inventoryAvailability({...held,availableOn:'2026-11-11'}).label,'Available on 2026-11-11');
 assert.equal(inventoryAvailability({...held,plannedPickupOn:held.today,availableOn:held.today}).kind,'Available on');
 for(const patch of [{plannedPickupOn:null},{reserved:true},{condition:'inspection'},{retired:true},{status:'Sold'},{availableOn:'2026-11-10'},{today:'2026-11-12'}])assert.equal(inventoryAvailability({...held,...patch}).kind,'Unavailable');
 assert.equal(inventoryAvailability({...held,plannedPickupOn:null,availableOn:'2026-11-12'}).kind,'Unavailable','Legacy dates alone must not imply a planned pickup');
});
