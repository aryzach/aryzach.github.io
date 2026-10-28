// Isolated component fixture. No application bootstrap, customer records or network writes.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import SaunaConditionPanel from '../../src/components/admin/SaunaConditionPanel';
import type {RentalWorkspace} from '../../src/lib/rentalModel';
import type {Booking} from '../../src/lib/bookingModel';
import '../../src/index.css';
const state:RentalWorkspace={customers:[],rentals:[],assignments:[],assets:[{id:'test-unit',code:'Test unit',sourceStatus:'Installed',conditionState:'ready'}],legacyInventory:[{id:'test-unit',status:'Installed',current_customer_id:'test-current',return_plan_version:2}]};
function TestForm(){
 const [conflict,setConflict]=useState(false);const [request,setRequest]=useState<Record<string,unknown>|null>(null);
 const booking={id:'test-future',state:'confirmed',saunaId:'test-unit',saunaCode:'Test unit',customerName:'Test booking',installOn:'2026-11-10'} as Booking;
 return <main className="mx-auto max-w-4xl space-y-6 p-6"><p className="rounded border bg-amber-50 p-3 text-sm">Isolated UI test. Uses a test unit; no customer data or live services.</p><h1 className="text-2xl font-bold">Schedule a return</h1><SaunaConditionPanel key={String(conflict)} inline initialTargets={['test-unit']} initialAction="schedule_return" state={{...state,bookings:conflict?[booking]:[]}} onCommand={async()=>{throw Error('Wrong command path');}} onAssetState={async(operation,payload)=>{if(operation!=='asset_status'||payload.planReturn!==true||payload.currentCustomerId!=='test-current'||payload.returnPlanVersion!==2)throw Error('Incorrect request');setRequest(payload);}} onRefresh={async()=>{}}/><button className="underline" onClick={()=>{setRequest(null);setConflict(!conflict);}}>Toggle conflicting test booking</button>{request&&<output className="block rounded border p-3" aria-label="Verified test request">Verified test request: {request.plannedPickupOn?`pickup ${request.plannedPickupOn}; next availability ${request.availableOn}`:'cancel planned return'}. No current rental, placement or commitment changes requested.</output>}</main>;
}
createRoot(document.getElementById('root')!).render(<TestForm/>);
