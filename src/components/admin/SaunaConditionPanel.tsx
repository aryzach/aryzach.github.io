import {useEffect,useState,type FormEvent} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import type {RentalWorkspace} from '@/lib/rentalModel';
import type {LifecycleCommand} from '@/lib/lifecycleModel';
import {runSaunaActions,type SaunaActionResult} from '@/lib/bulkSaunaActions';
import {availabilityAfterInbound} from '@/lib/inventoryAvailability';
import {incomingBookingConflicts,fleetEditable} from '@/lib/incomingFleet';
import {validateReturnPlan,returnPlanEditable} from '@/lib/returnPlan';
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles'});
const labels={saved:'Saved',failed:'Not saved',unconfirmed:'Result unconfirmed',not_attempted:'Not attempted'};
export default function SaunaConditionPanel({state,onCommand,onAssetState,selectedIds=[],onBusyChange,onSelectionChange,onRefresh,initialTargets=null,initialAction='condition',inline=false,onClose}:{state:RentalWorkspace;onCommand?:LifecycleCommand;onAssetState?:LifecycleCommand;selectedIds?:string[];onBusyChange?:(busy:boolean)=>void;onSelectionChange?:(ids:string[])=>void;onRefresh?:()=>Promise<void>;initialTargets?:string[]|null;initialAction?:string;inline?:boolean;onClose?:()=>void}){
 const [open,setOpen]=useState(inline);const [targets,setTargets]=useState<string[]|null>(initialTargets);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [action,setAction]=useState(initialAction);const [results,setResults]=useState<SaunaActionResult[]>([]);const [needsRefresh,setNeedsRefresh]=useState(false);
 const defaultEta=String(state.legacyInventory?.find(a=>a.id===initialTargets?.[0])?.incoming_eta||'');
 const [eta,setEta]=useState(defaultEta);const [availableOn,setAvailableOn]=useState(String(state.legacyInventory?.find(a=>a.id===initialTargets?.[0])?.available_date||''));const [unit,setUnit]=useState('');
 const [pickupOn,setPickupOn]=useState(String(state.legacyInventory?.find(a=>a.id===initialTargets?.[0])?.planned_pickup_on||''));
 // Follow checked rows while editing; keep the submitted targets fixed for results.
 const selectionKey=selectedIds.join('|');
 const checkedRow=state.legacyInventory?.find(a=>a.id===selectedIds[0]);
 const checkedEta=String(checkedRow?.incoming_eta||'');
 const checkedAvailable=String(checkedRow?.available_date||'');
 const checkedPickup=String(checkedRow?.planned_pickup_on||'');
 useEffect(()=>{
  if(inline||!open||busy||results.length)return;
  setUnit('');setEta(checkedEta);setAvailableOn(checkedAvailable);setPickupOn(checkedPickup);setError('');
 },[selectionKey,open,inline,busy,results.length,checkedEta,checkedAvailable,checkedPickup]);
 const activeTargets=!inline&&!busy&&!results.length?(selectedIds.length?selectedIds:null):targets;
 const effectiveIds=activeTargets||[unit];
 const targetRows=effectiveIds.map(id=>state.legacyInventory?.find(a=>a.id===id));
 const returnEditable=targetRows.length>0&&targetRows.every(returnPlanEditable);
 const inboundEditable=effectiveIds.every(id=>{const asset=state.assets.find(a=>a.id===id);return !!asset&&fleetEditable(asset,!!state.legacyInventory?.find(a=>a.id===id)?.current_customer_id);});
 const planningReturn=action==='schedule_return'||action==='cancel_return';
 const conflicts=action==='incoming'||planningReturn?incomingBookingConflicts((state.bookings||[]).filter(b=>!planningReturn||!targetRows.some(r=>r?.current_customer_id===b.id)),effectiveIds,action==='cancel_return'?'':planningReturn?availableOn:availabilityAfterInbound(eta,availableOn)&&availableOn?availableOn:''):[];
 async function show(ids:string[]|null){setError('');if(needsRefresh){try{if(!onRefresh)throw Error();await onRefresh();setNeedsRefresh(false);}catch{setError('Refresh the inventory before starting another update.');return;}}setTargets(ids);setAvailableOn(String(state.legacyInventory?.find(a=>a.id===ids?.[0])?.available_date||''));setEta(String(state.legacyInventory?.find(a=>a.id===ids?.[0])?.incoming_eta||''));setPickupOn(String(state.legacyInventory?.find(a=>a.id===ids?.[0])?.planned_pickup_on||''));setResults([]);setOpen(true);}
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!onCommand||busy||results.length)return;if(['incoming','receive'].includes(action)&&!inboundEditable){setError('Choose unassigned saunas for inbound or receiving. For a sauna with a current customer, schedule its return instead.');return;}if(action==='incoming'&&!availabilityAfterInbound(eta,availableOn)){setError('An inbound date is required. Booking availability must be after the inbound date.');return;}if(planningReturn){try{if(!returnEditable)throw Error('Choose a sauna currently with a customer.');if(action==='schedule_return')validateReturnPlan(pickupOn,availableOn,today());}catch(e){setError(e instanceof Error?e.message:'Check the planned dates.');return;}}const f=new FormData(e.currentTarget);const ids=activeTargets?[...activeTargets]:[String(f.get('unit'))];
  setTargets([...ids]);
  setBusy(true);onBusyChange?.(true);setError('');setNeedsRefresh(true);
  try{
   const outcome=await runSaunaActions(ids.map(id=>({id,commandId:crypto.randomUUID()})),async({id,commandId})=>{
    if(action==='condition')await onCommand('condition',{commandId,assetId:id,condition:f.get('condition'),reason:f.get('reason')});
    else if(planningReturn){
     if(!onAssetState)throw Error('Return scheduling unavailable');
     const row=state.legacyInventory?.find(a=>a.id===id);
     await onAssetState('asset_status',{commandId,assetId:id,planReturn:true,currentCustomerId:row?.current_customer_id,returnPlanVersion:row?.return_plan_version??0,plannedPickupOn:action==='cancel_return'?null:pickupOn,availableOn:action==='cancel_return'?null:availableOn,reason:f.get('reason')});
    }
    else{if(!onAssetState)throw Error('Fleet operation unavailable');await onAssetState('asset_status',{commandId,assetId:id,status:action==='incoming'?'Incoming':action==='receive'?'Available':'Retired',date:f.get('date'),...(action==='incoming'?{incomingEta:f.get('incomingEta'),availableOn:f.get('availableOn')}:{}),reason:f.get('reason'),acknowledgeScheduleConflict:f.get('acknowledgeScheduleConflict')==='on'});}
   },result=>setResults(previous=>[...previous,result]));
   if(activeTargets)onSelectionChange?.(outcome.filter(r=>r.status!=='saved').map(r=>r.id));
   try{await onRefresh?.();if(!outcome.some(r=>r.status==='unconfirmed'))setNeedsRefresh(false);}catch{setError('Updates were processed, but inventory could not be refreshed. Refresh before making further changes.');}
  }finally{setBusy(false);onBusyChange?.(false);}
 }
 return <div className="mb-3 space-y-3">
  <p className="text-xs text-muted-foreground">Check sauna rows, then use Manage sauna condition / fleet. Checked rows also update an open form until you save. Location is derived from assignments and inventory status. To set a rented sauna’s next availability, choose Schedule return / future availability. Planning does not move a sauna or end a rental.</p>
  {!inline&&<div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={!onCommand||busy} onClick={()=>void show(selectedIds.length?[...selectedIds]:null)}>Manage sauna condition / fleet{selectedIds.length?` · ${selectedIds.length} selected`:""}</Button></div>}
  {open&&<form className="space-y-3 rounded-md border bg-card p-3" onSubmit={save} aria-label="Manage sauna condition and fleet">
   {!activeTargets&&!inline&&<p className="text-xs text-muted-foreground">Choose a sauna below or check its row in the inventory table. Check more rows to update several saunas together.</p>}
   {activeTargets&&<div><h3 className="text-sm font-semibold">{activeTargets.length===1?'Edit fleet':'Bulk update'} · {activeTargets.length} sauna{activeTargets.length===1?'':'s'}</h3><p className="mt-1 text-xs text-muted-foreground">{activeTargets.map(id=>'#'+(state.assets.find(a=>a.id===id)?.code||id)).join(', ')}</p>{activeTargets.length>1&&<p className="mt-1 text-xs text-muted-foreground">Applies to these selected saunas, including selections hidden by filters. Each sauna is checked separately; blocked updates are listed below.</p>}</div>}
   <fieldset disabled={busy||results.length>0} className="flex flex-wrap items-end gap-3">
    {!activeTargets&&<Label className="grid gap-1 text-xs">Sauna<select name="unit" value={unit} onChange={e=>{const id=e.target.value;setUnit(id);const row=state.legacyInventory?.find(a=>a.id===id);setPickupOn(String(row?.planned_pickup_on||''));setAvailableOn(String(row?.available_date||''));setEta(String(row?.incoming_eta||''));if(action==='incoming'&&returnPlanEditable(row))setAction('schedule_return');}} className="h-9 rounded-md border bg-background px-2" required><option value="">Choose unit</option>{state.assets.filter(a=>!a.retired&&a.sourceStatus!=='Sold').map(a=><option key={a.id} value={a.id}>#{a.code} · {a.typeName}</option>)}</select></Label>}
    <Label className="grid gap-1 text-xs">Action<select className="h-9 rounded-md border bg-background px-2" value={action} onChange={e=>setAction(e.target.value)}><option value="condition">Update condition</option><option value="schedule_return" disabled={!returnEditable}>Schedule return / future availability</option><option value="cancel_return" disabled={!returnEditable}>Cancel planned return</option><option value="incoming" disabled={!inboundEditable}>Mark as Incoming / Inbound</option><option value="receive" disabled={!inboundEditable}>Receive / make available in fleet</option><option value="retire">Retire from fleet</option></select></Label>
    {!planningReturn&&(action==='condition'?<Label className="grid gap-1 text-xs">Condition<select name="condition" className="h-9 rounded-md border bg-background px-2"><option value="ready">Ready</option><option value="inspection">Needs inspection</option><option value="maintenance">Maintenance</option></select></Label>:<Label className="grid gap-1 text-xs">{action==='incoming'?'Status effective date':'Actual event date'}<Input name="date" type="date" defaultValue={today()} required/></Label>)}
    {action==='schedule_return'&&<Label className="grid gap-1 text-xs">Planned pickup date<Input name="plannedPickupOn" type="date" required min={today()} value={pickupOn} onChange={e=>setPickupOn(e.target.value)}/></Label>}
    {action==='incoming'&&<Label className="grid gap-1 text-xs">Inbound date<Input name="incomingEta" type="date" required value={eta} onChange={e=>setEta(e.target.value)}/></Label>}
    {(action==='incoming'||action==='schedule_return')&&<Label className="grid gap-1 text-xs">Booking available on<Input name="availableOn" type="date" required={action==='schedule_return'} value={availableOn} onChange={e=>setAvailableOn(e.target.value)} min={planningReturn?pickupOn||undefined:eta?new Date(Date.parse(eta+'T12:00:00Z')+86400000).toISOString().slice(0,10):undefined}/><span className="max-w-64 text-muted-foreground">{planningReturn?'Can be the pickup date or later. Allow time for transport and inspection.':'Optional. Must be after inbound; blank means unavailable.'}</span></Label>}
    <Label className="grid gap-1 text-xs">Reason<Input name="reason" required/></Label>
    {conflicts.length>0&&<div className="basis-full rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="status"><p className="font-medium">Installation dates need review</p><ul className="mt-1 list-disc pl-5">{conflicts.map(b=><li key={b.id}>{b.customerName} · #{b.saunaCode} · {b.installOn||'Date missing'}</li>)}</ul><p className="mt-2">The availability dates conflict with these bookings. {planningReturn?'Resolve these bookings before saving a conflicting return plan. Their dates and assignments will be preserved.':'Updating fleet records the shipment fact; it does not reschedule or cancel a booking.'}</p>{!planningReturn&&<label className="mt-2 flex items-start gap-2"><input className="mt-1" type="checkbox" name="acknowledgeScheduleConflict" required/>Keep the assignments and flag these dates for rescheduling.</label>}</div>}
    <Button size="sm" type="submit" disabled={planningReturn&&conflicts.length>0}>{busy?`Processing ${results.length} of ${activeTargets?.length||1}…`:activeTargets&&activeTargets.length>1?`Apply to ${activeTargets.length} saunas`:'Save changes'}</Button>
   </fieldset>
   {action==='incoming'&&eta&&availableOn&&availableOn<=eta&&<p role="status" className="text-sm text-amber-800">The saved availability date is not after inbound. Choose a later date or clear it to keep the unit unavailable.</p>}
   {action==='incoming'&&<p className="text-xs text-muted-foreground">Keeps the future customer and condition. Inbound date is required. Booking availability is separate and must be later than inbound. Reserved units remain Unavailable. Existing booking conflicts must be acknowledged.</p>}
   {action==='schedule_return'&&<p className="text-xs text-muted-foreground">The sauna stays with its current customer until actual pickup is confirmed in Rentals. Current rental dates, commitments and future assignments are preserved. No payment or message is sent.</p>}
   {action==='cancel_return'&&<p className="text-xs text-muted-foreground">Clears the planned pickup and next availability dates. The current rental and any future booking remain unchanged. Resolve conflicting future bookings first.</p>}
   {action==='receive'&&<p className="text-xs text-muted-foreground">Records receipt and makes the sauna Ready. Incoming units keep their future customer. Sold or retired units remain protected.</p>}
   {action==='retire'&&<p className="text-xs text-muted-foreground">Resolve current and future customer assignments before retirement. Record sales through the sale workflow.</p>}
   {results.length>0&&<div className="space-y-2" aria-live="polite"><p className="text-sm font-medium">{results.filter(r=>r.status==='saved').length} saved · {results.filter(r=>r.status==='failed').length} blocked · {results.filter(r=>r.status==='unconfirmed').length} unconfirmed · {results.filter(r=>r.status==='not_attempted').length} not attempted</p><ul className="max-h-48 overflow-auto space-y-1 text-xs">{results.map(r=><li key={r.id} className={r.status==='saved'?'text-emerald-700':'text-destructive'}>#{state.assets.find(a=>a.id===r.id)?.code||r.id} · {labels[r.status]}{r.message?` — ${r.message}`:''}</li>)}</ul>{results.some(r=>r.status==='unconfirmed')&&<p className="text-sm text-destructive">An unconfirmed update may have saved. Remaining updates were stopped. Refresh and review inventory before trying again.</p>}</div>}
   {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
   <Button size="sm" type="button" variant="outline" disabled={busy} onClick={()=>{setOpen(false);onClose?.();}}>{results.length?'Close results':'Cancel'}</Button>
  </form>}
  {error&&!open&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 </div>;
}
