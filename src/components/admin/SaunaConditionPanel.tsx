import {useState,type FormEvent} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import type {RentalWorkspace} from '@/lib/rentalModel';
import type {LifecycleCommand} from '@/lib/lifecycleModel';
import {runSaunaActions,type SaunaActionResult} from '@/lib/bulkSaunaActions';
const labels={saved:'Saved',failed:'Not saved',unconfirmed:'Result unconfirmed',not_attempted:'Not attempted'};
export default function SaunaConditionPanel({state,onCommand,onAssetState,selectedIds=[],onBusyChange,onSelectionChange,onRefresh}:{state:RentalWorkspace;onCommand?:LifecycleCommand;onAssetState?:LifecycleCommand;selectedIds?:string[];onBusyChange?:(busy:boolean)=>void;onSelectionChange?:(ids:string[])=>void;onRefresh?:()=>Promise<void>}){
 const [open,setOpen]=useState(false);const [targets,setTargets]=useState<string[]|null>(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [action,setAction]=useState('condition');const [results,setResults]=useState<SaunaActionResult[]>([]);const [needsRefresh,setNeedsRefresh]=useState(false);
 async function show(ids:string[]|null){setError('');if(needsRefresh){try{if(!onRefresh)throw Error();await onRefresh();setNeedsRefresh(false);}catch{setError('Refresh the inventory before starting another update.');return;}}setTargets(ids);setResults([]);setOpen(true);}
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!onCommand||busy||results.length)return;const f=new FormData(e.currentTarget);const ids=targets||[String(f.get('unit'))];
  setBusy(true);onBusyChange?.(true);setError('');setNeedsRefresh(true);
  try{
   const outcome=await runSaunaActions(ids.map(id=>({id,commandId:crypto.randomUUID()})),async({id,commandId})=>{
    if(action==='condition')await onCommand('condition',{commandId,assetId:id,condition:f.get('condition'),reason:f.get('reason')});
    else{if(!onAssetState)throw Error('Fleet operation unavailable');await onAssetState('asset_status',{commandId,assetId:id,status:action==='receive'?'Available':'Retired',date:f.get('date'),reason:f.get('reason')});}
   },result=>setResults(previous=>[...previous,result]));
   if(targets)onSelectionChange?.(outcome.filter(r=>r.status!=='saved').map(r=>r.id));
   try{await onRefresh?.();if(!outcome.some(r=>r.status==='unconfirmed'))setNeedsRefresh(false);}catch{setError('Updates were processed, but inventory could not be refreshed. Refresh before making further changes.');}
  }finally{setBusy(false);onBusyChange?.(false);}
 }
 return <div className="mb-3 space-y-3">
  <p className="text-xs text-muted-foreground">Location is derived from assignments and inventory status. Condition changes do not move a sauna or end a rental.</p>
  <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={!onCommand||busy} onClick={()=>void show(null)}>Manage sauna condition / fleet</Button>{selectedIds.length>0&&<Button size="sm" disabled={!onCommand||busy} onClick={()=>void show([...selectedIds])}>Manage {selectedIds.length} selected saunas</Button>}</div>
  {open&&<form className="space-y-3 rounded-md border bg-card p-3" onSubmit={save} aria-label="Manage sauna condition and fleet">
   {targets&&<div><h3 className="text-sm font-semibold">Bulk update · {targets.length} saunas</h3><p className="mt-1 text-xs text-muted-foreground">{targets.map(id=>'#'+(state.assets.find(a=>a.id===id)?.code||id)).join(', ')}</p><p className="mt-1 text-xs text-muted-foreground">Applies to these selected saunas, including selections hidden by filters. Each sauna is checked separately; blocked updates are listed below.</p></div>}
   <fieldset disabled={busy||results.length>0} className="flex flex-wrap items-end gap-3">
    {!targets&&<Label className="grid gap-1 text-xs">Sauna<select name="unit" className="h-9 rounded-md border bg-background px-2" required><option value="">Choose unit</option>{state.assets.filter(a=>!a.retired&&a.sourceStatus!=='Sold').map(a=><option key={a.id} value={a.id}>#{a.code} · {a.typeName}</option>)}</select></Label>}
    <Label className="grid gap-1 text-xs">Action<select className="h-9 rounded-md border bg-background px-2" value={action} onChange={e=>setAction(e.target.value)}><option value="condition">Update condition</option><option value="receive">Receive into fleet</option><option value="retire">Retire from fleet</option></select></Label>
    {action==='condition'?<Label className="grid gap-1 text-xs">Condition<select name="condition" className="h-9 rounded-md border bg-background px-2"><option value="ready">Ready</option><option value="inspection">Needs inspection</option><option value="maintenance">Maintenance</option></select></Label>:<Label className="grid gap-1 text-xs">Actual event date<Input name="date" type="date" required/></Label>}
    <Label className="grid gap-1 text-xs">Reason<Input name="reason" required/></Label>
    <Button size="sm" type="submit">{busy?`Processing ${results.length} of ${targets?.length||1}…`:targets?`Apply to ${targets.length} saunas`:'Save'}</Button>
   </fieldset>
   {action!=='condition'&&<p className="text-xs text-muted-foreground">Fleet changes require an unassigned sauna. Sold or retired saunas are protected; record sales through the sale workflow. Receiving a sauna does not confirm its condition.</p>}
   {results.length>0&&<div className="space-y-2" aria-live="polite"><p className="text-sm font-medium">{results.filter(r=>r.status==='saved').length} saved · {results.filter(r=>r.status==='failed').length} blocked · {results.filter(r=>r.status==='unconfirmed').length} unconfirmed · {results.filter(r=>r.status==='not_attempted').length} not attempted</p><ul className="max-h-48 overflow-auto space-y-1 text-xs">{results.map(r=><li key={r.id} className={r.status==='saved'?'text-emerald-700':'text-destructive'}>#{state.assets.find(a=>a.id===r.id)?.code||r.id} · {labels[r.status]}{r.message?` — ${r.message}`:''}</li>)}</ul>{results.some(r=>r.status==='unconfirmed')&&<p className="text-sm text-destructive">An unconfirmed update may have saved. Remaining updates were stopped. Refresh and review inventory before trying again.</p>}</div>}
   {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
   <Button size="sm" type="button" variant="outline" disabled={busy} onClick={()=>setOpen(false)}>{results.length?'Close results':'Cancel'}</Button>
  </form>}
  {error&&!open&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 </div>;
}
