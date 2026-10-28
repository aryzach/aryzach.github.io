export interface AvailabilityInput {
 status:string;currentCustomer:boolean;reserved:boolean;condition:string;retired?:boolean;inboundOn?:string|null;availableOn?:string|null;plannedPickupOn?:string|null;today?:string;
}
export function inventoryAvailability(a:AvailabilityInput):{kind:'Available now'|'Unavailable'|'Available on';label:string;reason:string}{
 const unavailable=(reason:string)=>({kind:'Unavailable' as const,label:'Unavailable',reason});
 if(a.retired||a.status==='Sold')return unavailable('Sold or retired');
 if(a.reserved)return unavailable('Reserved for the assigned future customer');
 if(a.condition!=='ready')return unavailable('Not ready for installation');
 if(a.currentCustomer||['Installed','Returning'].includes(a.status)){
  const today=a.today||new Date().toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles'});
  if(!a.currentCustomer||!a.plannedPickupOn||!a.availableOn||a.availableOn<a.plannedPickupOn)return unavailable('With customer; schedule a pickup and next availability date');
  if(a.plannedPickupOn<today)return unavailable('Planned pickup is overdue; confirm the actual return or reschedule');
  return {kind:'Available on',label:`Available on ${a.availableOn}`,reason:`Expected after planned pickup on ${a.plannedPickupOn}; still with current customer`};
 }
 if(a.status==='Incoming'){
  if(!a.inboundOn)return unavailable('Set the inbound date');
  if(!a.availableOn||a.availableOn<=a.inboundOn)return unavailable('Set an availability date after the inbound date');
  return {kind:'Available on',label:`Available on ${a.availableOn}`,reason:'Incoming; availability is separate from arrival'};
 }
 return {kind:'Available now',label:'Available now',reason:'Ready and unreserved in warehouse'};
}
export function availabilityAfterInbound(inbound:string,available:string):boolean{return !!inbound&&(!available||available>inbound);}
