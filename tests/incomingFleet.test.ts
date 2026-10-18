import test from 'node:test';import assert from 'node:assert/strict';
import {incomingBookingConflicts,fleetEditable} from '../src/lib/incomingFleet.ts';
import type {Booking} from '../src/lib/bookingModel.ts';
test('arrival conflicts use current confirmed bookings, without changing their dates or assignments',()=>{
 const bookings=[{id:'late',state:'confirmed',saunaId:'a',installOn:'2026-10-31'},{id:'same',state:'confirmed',saunaId:'a',installOn:'2026-11-04'},{id:'other',state:'confirmed',saunaId:'b',installOn:'2026-10-31'},{id:'pending-date',state:'requested',saunaId:'a',installOn:'2026-10-31'},{id:'closed',state:'fulfilled',saunaId:'a',installOn:'2026-10-31'}] as Booking[];
 const before=structuredClone(bookings);
 assert.deepEqual(incomingBookingConflicts(bookings,['a'],'2026-11-04').map(b=>b.id),['late','pending-date']);
 assert.deepEqual(incomingBookingConflicts(bookings,['a'],'').map(b=>b.id),['late','same','pending-date']);
 assert.deepEqual(bookings,before);
});
test('fleet table cannot offer shipment edits for installed, returning, sold or retired saunas',()=>{
 for(const sourceStatus of ['Installed','Returning','Sold'])assert.equal(fleetEditable({sourceStatus},false),false);
 assert.equal(fleetEditable({sourceStatus:'Available'},true),false);
 assert.equal(fleetEditable({retired:true},false),false);
 assert.equal(fleetEditable({sourceStatus:'Reservation Confirmed'},false),true);
 assert.equal(fleetEditable({sourceStatus:'Incoming'},false),true);
});
