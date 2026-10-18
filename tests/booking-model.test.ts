import assert from 'node:assert/strict';
import test from 'node:test';
import {bookingGaps,saunaLifecycle,type Booking} from '../src/lib/bookingModel.ts';
const booking:Booking={id:'b',customerId:'c',customerName:'Customer',state:'confirmed',version:1,installOn:'2026-10-20',saunaId:'a',saunaCode:'001',saunaTypeId:'infrared',saunaType:'Indoor Infrared',source:'manual',legacyStatus:null,confirmationMode:'manual',confirmationNote:'ID verified in person',readiness:{agreement:true,deposit:true,photoId:false,numberedUnit:true,date:true},rentalId:'r',rentalState:'planned',purpose:'rental',createdAt:'2026-10-17',holdDeadline:null,installAddress:null};
test('a manual exception keeps the missing ID visible without changing booking confirmation',()=>{
 assert.deepEqual(bookingGaps(booking),['Photo ID uploaded']);assert.equal(booking.state,'confirmed');assert.equal(booking.readiness.photoId,false);
});
test('an occupied sauna can be under maintenance without ending the rental or leaving the fleet',()=>{
 assert.deepEqual(saunaLifecycle({sourceStatus:'Installed',conditionState:'maintenance',custody:'With customer'}),{fleet:'In fleet',custody:'With customer',condition:'maintenance'});
 assert.equal(saunaLifecycle({sourceStatus:'Maintenance',retired:true}).fleet,'Retired');
 assert.equal(saunaLifecycle({sourceStatus:'Sold'}).fleet,'Sold');
});
