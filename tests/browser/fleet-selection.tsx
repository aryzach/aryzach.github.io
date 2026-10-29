// Isolated component integration fixture. No customer records or live service calls.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import SaunaConditionPanel from '../../src/components/admin/SaunaConditionPanel';
import {CustomerPickerCell} from '../../src/components/admin/CustomerPickerCell';
import type {RentalWorkspace} from '../../src/lib/rentalModel';
import '../../src/index.css';
const units=['A','B'];
const state:RentalWorkspace={customers:[],rentals:[],assignments:[],assets:units.map(code=>({id:code,code:`Test ${code}`,sourceStatus:'Available',conditionState:'ready'})),legacyInventory:units.map(id=>({id,status:'Available',condition_state:'ready'}))};
function Fixture(){
 const [selected,setSelected]=useState<string[]>([]);const [busy,setBusy]=useState(false);const [hideA,setHideA]=useState(false);const [failB,setFailB]=useState(false);const [calls,setCalls]=useState<string[]>([]);
 return <main className="mx-auto max-w-4xl space-y-5 p-6"><p className="rounded border bg-amber-50 p-3 text-sm">Isolated UI test. Test units only; no customer data or live services.</p><h1 className="text-2xl font-bold">Fleet selection</h1><SaunaConditionPanel state={state} selectedIds={selected} onBusyChange={setBusy} onSelectionChange={setSelected} onRefresh={async()=>{}} onCommand={async(operation,payload)=>{setCalls(previous=>[...previous,`${operation}:${payload.assetId}:${payload.condition}`]);if(failB&&payload.assetId==='B')throw Error('Test B blocked');}}/><div className="flex gap-5"><label><input type="checkbox" aria-label="Hide test A" checked={hideA} onChange={e=>setHideA(e.target.checked)}/> Hide Test A</label><label><input type="checkbox" aria-label="Block test B" checked={failB} onChange={e=>setFailB(e.target.checked)}/> Block Test B on save</label></div><table className="w-full text-sm"><thead><tr><th>Select</th><th>Sauna</th></tr></thead><tbody>{units.filter(id=>!hideA||id!=='A').map(id=><tr key={id}><td><input type="checkbox" aria-label={`Select test ${id}`} disabled={busy} checked={selected.includes(id)} onChange={e=>setSelected(previous=>e.target.checked?[...previous,id]:previous.filter(x=>x!==id))}/></td><td>Test {id}</td></tr>)}</tbody></table><output aria-label="Test command requests" className="block">{calls.join(', ')}</output><p className="text-xs">Read-only assignment rendering:</p><CustomerPickerCell readOnly value="test-booking" customers={[{id:'test-booking',name:'Test future booking',email:null}]} onChange={async()=>{throw Error('Read-only assignment changed');}}/></main>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
