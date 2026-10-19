export interface AvailabilityInput {
 status:string;currentCustomer:boolean;reserved:boolean;condition:string;retired?:boolean;inboundOn?:string|null;availableOn?:string|null;
}
export function inventoryAvailability(a:AvailabilityInput):{kind:'Available now'|'Unavailable'|'Available on';label:string;reason:string}{
 const unavailable=(reason:string)=>({kind:'Unavailable' as const,label:'Unavailable',reason});
 if(a.retired||a.status==='Sold')return unavailable('Sold or retired');
 if(a.currentCustomer||['Installed','Returning'].includes(a.status))return unavailable('With customer');
 if(a.reserved)return unavailable('Reserved for the assigned future customer');
 if(a.condition!=='ready')return unavailable('Not ready for installation');
 if(a.status==='Incoming'){
  if(!a.inboundOn)return unavailable('Set the inbound date');
  if(!a.availableOn||a.availableOn<=a.inboundOn)return unavailable('Set an availability date after the inbound date');
  return {kind:'Available on',label:`Available on ${a.availableOn}`,reason:'Incoming; availability is separate from arrival'};
 }
 return {kind:'Available now',label:'Available now',reason:'Ready and unreserved in warehouse'};
}
export function availabilityAfterInbound(inbound:string,available:string):boolean{return !!inbound&&(!available||available>inbound);}
