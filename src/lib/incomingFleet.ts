import type {Booking} from './bookingModel.ts';
/** Delivery facts can change after acceptance. Keep the promise visible for rescheduling. */
export function incomingBookingConflicts(bookings:Booking[],assetIds:string[],eta:string):Booking[]{
 return bookings.filter(b=>b.state==='confirmed'&&!!b.saunaId&&assetIds.includes(b.saunaId)&&(!eta||!b.installOn||eta>b.installOn));
}
export function fleetEditable(asset:{sourceStatus?:string;retired?:boolean},hasCurrentCustomer:boolean):boolean{
 return !hasCurrentCustomer&&!asset.retired&&!['Installed','Returning','Sold'].includes(asset.sourceStatus||'');
}
