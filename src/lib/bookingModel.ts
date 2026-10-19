export type BookingState = 'draft'|'requested'|'confirmed'|'fulfilled'|'cancelled';
export interface Booking {
 magicLink?:string|null;
 id:string;customerId:string|null;customerName:string;state:BookingState;version:number;installOn:string|null;saunaId:string|null;saunaCode:string|null;saunaTypeId:string|null;saunaType:string|null;source:string;legacyStatus:string|null;confirmationMode:'automatic'|'manual'|'legacy'|null;confirmationNote:string|null;
 readiness:{agreement:boolean;deposit:boolean;photoId:boolean;numberedUnit:boolean;date:boolean};rentalId:string|null;rentalState:string|null;purpose:'rental'|'purchase';createdAt:string;holdDeadline:string|null;installAddress:string|null;
}
export const bookingLabels:Record<BookingState,string>={draft:'Draft',requested:'Requested',confirmed:'Confirmed',fulfilled:'Fulfilled',cancelled:'Cancelled'};
export const requirementLabels={agreement:'Signed agreement',deposit:'Deposit received',photoId:'Photo ID uploaded',numberedUnit:'Matching numbered sauna allocation',date:'Unit available by agreed date'};
export function bookingGaps(booking:Booking):string[]{return Object.entries(requirementLabels).filter(([key])=>!booking.readiness[key as keyof Booking['readiness']]).map(([,label])=>label);}
export function saunaLifecycle(asset:{sourceStatus?:string;custody?:string;conditionState?:string;retired?:boolean}) {
 const status=asset.sourceStatus||'';
 const fleet=asset.retired?'Retired':status==='Sold'?'Sold':status==='Incoming'?'Incoming':'In fleet';
 const custody=asset.custody?.replace('Unassigned / location unknown','Warehouse')||(status==='Installed'||status==='Returning'?'With customer':status==='Incoming'?'Inbound':status==='Sold'?'Ownership transferred':'Warehouse');
 const condition=asset.conditionState||'unknown';
 return {fleet,custody,condition};
}

export const rentalStateLabels:Record<string,string>={unconfirmed:'History incomplete',planned:'Planned',active:'Active',ended:'Ended',canceled:'Cancelled'};
