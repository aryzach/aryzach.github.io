import {requireDate} from './rentalModel.ts';

export function validateReturnPlan(pickupOn:string,availableOn:string,today:string):void {
 requireDate(pickupOn);requireDate(availableOn);
 if(pickupOn<today)throw Error('Choose today or a future planned pickup date. Record completed pickups through rental history.');
 if(availableOn<pickupOn)throw Error('Booking availability must be on or after the planned pickup date.');
}

export function returnPlanEditable(row:Record<string,unknown>|undefined):boolean {
 return !!row?.current_customer_id&&!row.retired_on&&row.status!=='Sold';
}
