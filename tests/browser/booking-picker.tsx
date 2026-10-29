// Synthetic component fixture: never reads or changes real bookings.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import BookingsPanel from '../../src/components/admin/BookingsPanel';
import type { RentalWorkspace } from '../../src/lib/rentalModel';
import type { Booking } from '../../src/lib/bookingModel';
import '../../src/index.css';
const state:RentalWorkspace={customers:[],rentals:[],assignments:[],legacyTypes:[{id:'outdoor_traditional_standard',name:'Outdoor Traditional',sort_order:0}],assets:[
  {id:'ten',code:'010',typeName:'Outdoor Traditional',model:'v1 — Fir/Cedar',modelKey:'v1_fir_cedar',sourceStatus:'Installed',currentCustomerName:'Test Morgan Hill'},
  {id:'two',code:'002',typeName:'Outdoor Traditional',model:'v1 — Fir/Cedar',modelKey:'v1_fir_cedar',sourceStatus:'Available'},
  {id:'fifty-eight',code:'058',typeName:'Outdoor Traditional',model:'v2 — Cedar',modelKey:'v2_cedar',sourceStatus:'Incoming'},
  {id:'sold',code:'001',sourceStatus:'Sold'},
],bookings:[{id:'test-booking',customerId:null,customerName:'Test waiting customer',state:'requested',version:1,saunaId:'fifty-eight',saunaCode:'058',saunaTypeId:'outdoor_traditional_standard',saunaType:'Outdoor Traditional',source:'website',purpose:'rental',installOn:null,readiness:{agreement:false,deposit:true,photoId:false,numberedUnit:false,date:false}} as Booking]};
function Fixture(){const [request,setRequest]=useState('');return <main className="mx-auto max-w-5xl p-6"><p className="mb-5 rounded border bg-amber-50 p-3">Isolated UI test. Synthetic records; no live services.</p><BookingsPanel state={state} onRefresh={async()=>{}} onRentals={()=>{}} onCommand={async(operation,record)=>setRequest(JSON.stringify({operation,...record}))}/><output aria-label="Booking test request">{request}</output></main>;}
createRoot(document.getElementById('root')!).render(<Fixture/>);
