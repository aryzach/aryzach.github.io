import {useState,type FormEvent} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import type {RentalWorkspace} from '@/lib/rentalModel';
import type {LifecycleCommand} from '@/lib/lifecycleModel';
import {runSaunaActions,type SaunaActionResult} from '@/lib/bulkSaunaActions';
import {incomingBookingConflicts} from '@/lib/incomingFleet';
const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Los_Angeles'});
const labels={saved:'Saved',failed:'Not saved',unconfirmed:'Result unconfirmed',not_attempted:'Not attempted'};
export default function SaunaConditionPanel({state,onCommand,onAssetState,selectedIds=[],onBusyChange,onSelectionChange,onRefresh,initialTargets=null,initialAction='condition',inline=false,onClose}:{state:RentalWorkspace;onCommand?:LifecycleCommand;onAssetState?:LifecycleCommand;selectedIds?:string[];onBusyChange?:(busy:boolean)=>void;onSelectionChange?:(ids:string[])=>void;onRefresh?:()=>Promise<void>;initialTargets?:string[]|null;initialAction?:string;inline?:boolean;onClose?:()=>void}){
 const [open,setOpen]=useState(inline);const [targets,setTargets]=useState<string[]|null>(initialTargets);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [action,setAction]=useState(initialAction);const [results,setResults]=useState<SaunaActionResult[]>([]);const [needsRefresh,setNeedsRefresh]=useState(false);
 const defaultEta=String(state.legacyInventory?.find(a=>a.id===initialTargets?.[0])?.incoming_eta||'');
 const [eta,setEta]=useState(defaultEta);const [unit,setUnit]=useState('');
 const effectiveIds=targets||[unit];
 const conflicts=action==='incoming'?incomingBookingConflicts(state.bookings||[],effectiveIds,eta):[];
 async function show(ids:string[]|null){setError('');if(needsRefresh){try{if(!onRefresh)throw Error();await onRefresh();setNeedsRefresh(false);}catch{setError('Refresh the inventory before starting another update.');return;}}setTargets(ids);setEta(String(state.legacyInventory?.find(a=>a.id===ids?.[0])?.incoming_eta||''));setResults([]);setOpen(true);}
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!onCommand||busy||results.length)return;const f=new FormData(e.currentTarget);const ids=targets||[String(f.get('unit'))];
  setBusy(true);onBusyChange?.(true);setError('');setNeedsRefresh(true);
  try{
   const outcome=await runSaunaActions(ids.map(id=>({id,commandId:crypto.randomUUID()})),async({id,commandId})=>{
    if(action==='condition')await onCommand('condition',{commandId,assetId:id,condition:f.get('condition'),reason:f.get('reason')});
    else{if(!onAssetState)throw Error('Fleet operation unavailable');await onAssetState('asset_status',{commandId,assetId:id,status:action==='incoming'?'Incoming':action==='receive'?'Available':'Retired',date:f.get('date'),...(action==='incoming'&&f.get('incomingEta')?{incomingEta:f.get('incomingEta')}:{}),reason:f.get('reason'),acknowledgeScheduleConflict:f.get('acknowledgeScheduleConflict')==='on'});}
   },result=>setResults(previous=>[...previous,result]));
   if(targets)onSelectionChange?.(outcome.filter(r=>r.status!=='saved').map(r=>r.id));
   try{await onRefresh?.();if(!outcome.some(r=>r.status==='unconfirmed'))setNeedsRefresh(false);}catch{setError('Updates were processed, but inventory could not be refreshed. Refresh before making further changes.');}
  }finally{setBusy(false);onBusyChange?.(false);}
 }
 return <div className="mb-3 space-y-3">
  <p className="text-xs text-muted-foreground">Click a Fleet label to edit that sauna. Location is derived from assignments and inventory status. Condition changes do not move a sauna or end a rental.</p>
  {!inline&&<div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={!onCommand||busy} onClick={()=>void show(null)}>Manage sauna condition / fleet</Button>{selectedIds.length>0&&<Button size="sm" disabled={!onCommand||busy} onClick={()=>void show([...selectedIds])}>Manage {selectedIds.length} selected sauna{selectedIds.length===1?'':'s'}</Button>}</div>}
  {open&&<form className="space-y-3 rounded-md border bg-card p-3" onSubmit={save} aria-label="Manage sauna condition and fleet">
   {targets&&<div><h3 className="text-sm font-semibold">{targets.length===1?'Edit fleet':'Bulk update'} · {targets.length} sauna{targets.length===1?'':'s'}</h3><p className="mt-1 text-xs text-muted-foreground">{targets.map(id=>'#'+(state.assets.find(a=>a.id===id)?.code||id)).join(', ')}</p>{targets.length>1&&<p className="mt-1 text-xs text-muted-foreground">Applies to these selected saunas, including selections hidden by filters. Each sauna is checked separately; blocked updates are listed below.</p>}</div>}
   <fieldset disabled={busy||results.length>0} className="flex flex-wrap items-end gap-3">
    {!targets&&<Label className="grid gap-1 text-xs">Sauna<select name="unit" value={unit} onChange={e=>setUnit(e.target.value)} className="h-9 rounded-md border bg-background px-2" required><option value="">Choose unit</option>{state.assets.filter(a=>!a.retired&&a.sourceStatus!=='Sold').map(a=><option key={a.id} value={a.id}>#{a.code} · {a.typeName}</option>)}</select></Label>}
    <Label className="grid gap-1 text-xs">Action<select className="h-9 rounded-md border bg-background px-2" value={action} onChange={e=>setAction(e.target.value)}><option value="condition">Update condition</option><option value="incoming">Mark as Incoming / Inbound</option><option value="receive">Receive / make available in fleet</option><option value="retire">Retire from fleet</option></select></Label>
    {action==='condition'?<Label className="grid gap-1 text-xs">Condition<select name="condition" className="h-9 rounded-md border bg-background px-2"><option value="ready">Ready</option><option value="inspection">Needs inspection</option><option value="maintenance">Maintenance</option></select></Label>:<Label className="grid gap-1 text-xs">{action==='incoming'?'Status effective date':'Actual event date'}<Input name="date" type="date" defaultValue={today()} required/></Label>}
    {action==='incoming'&&<Label className="grid gap-1 text-xs">Expected arrival date<Input name="incomingEta" type="date" value={eta} onChange={e=>setEta(e.target.value)}/></Label>}
    <Label className="grid gap-1 text-xs">Reason<Input name="reason" required/></Label>
    {conflicts.length>0&&<div className="basis-full rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="status"><p className="font-medium">Installation dates need review</p><ul className="mt-1 list-disc pl-5">{conflicts.map(b=><li key={b.id}>{b.customerName} · #{b.saunaCode} · {b.installOn||'Date missing'}</li>)}</ul><p className="mt-2">The arrival estimate conflicts with these bookings. Updating fleet records the shipment fact; it does not reschedule or cancel a booking.</p><label className="mt-2 flex items-start gap-2"><input className="mt-1" type="checkbox" name="acknowledgeScheduleConflict" required/>Keep the assignments and flag these dates for rescheduling.</label></div>}
    <Button size="sm" type="submit">{busy?`Processing ${results.length} of ${targets?.length||1}…`:targets&&targets.length>1?`Apply to ${targets.length} saunas`:'Save changes'}</Button>
   </fieldset>
   {action==='incoming'&&<p className="text-xs text-muted-foreground">Keeps the future customer and current condition. A conflicting or unknown arrival date is flagged for rescheduling. Confirming a booking still requires a compatible date and numbered unit. Leave arrival blank to keep an existing estimate.</p>}
   {action==='receive'&&<p className="text-xs text-muted-foreground">Records receipt and makes the sauna Ready. Incoming units keep their future customer. Sold or retired units remain protected.</p>}
   {action==='retire'&&<p className="text-xs text-muted-foreground">Resolve current and future customer assignments before retirement. Record sales through the sale workflow.</p>}
   {results.length>0&&<div className="space-y-2" aria-live="polite"><p className="text-sm font-medium">{results.filter(r=>r.status==='saved').length} saved · {results.filter(r=>r.status==='failed').length} blocked · {results.filter(r=>r.status==='unconfirmed').length} unconfirmed · {results.filter(r=>r.status==='not_attempted').length} not attempted</p><ul className="max-h-48 overflow-auto space-y-1 text-xs">{results.map(r=><li key={r.id} className={r.status==='saved'?'text-emerald-700':'text-destructive'}>#{state.assets.find(a=>a.id===r.id)?.code||r.id} · {labels[r.status]}{r.message?` — ${r.message}`:''}</li>)}</ul>{results.some(r=>r.status==='unconfirmed')&&<p className="text-sm text-destructive">An unconfirmed update may have saved. Remaining updates were stopped. Refresh and review inventory before trying again.</p>}</div>}
   {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
   <Button size="sm" type="button" variant="outline" disabled={busy} onClick={()=>{setOpen(false);onClose?.();}}>{results.length?'Close results':'Cancel'}</Button>
  </form>}
  {error&&!open&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 </div>;
}
