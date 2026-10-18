import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { displayCashAmount, type HistorySelection, type XeroHistoryResult } from '@/lib/xeroCustomerHistory';
import type { RentalWorkspace } from '@/lib/rentalModel';
import {Tabs,TabsContent,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {historyDate} from './historyDisplay';
import PaymentAllocationReview from './PaymentAllocationReview';
import type {LifecycleCommand} from '@/lib/lifecycleModel';
import {customerDirectory,stripeCustomerUrl,xeroContactUrl} from '@/lib/customerDirectory';
import {displayMoney} from '@/lib/lifecycleModel';
import {RentalCustomerHistory,type OpenAgreement} from './RentalLifecycle';

export type ReadXeroHistory = (selection: HistorySelection) => Promise<XeroHistoryResult>;
function localHistory(state:RentalWorkspace,selection:HistorySelection):XeroHistoryResult {
 const history=state.xeroHistory;if(!history)return {contacts:[]};
 const ids=selection.contactId?[selection.contactId]:selection.customerId?(state.xeroLinks||[]).filter(l=>l.customerId===selection.customerId).map(l=>l.contactId):null;
 return {...history,contacts:history.contacts.filter(c=>!ids||ids.includes(c.contactId)),transactions:ids?(history.transactions||[]).filter(t=>ids.includes(t.contactId)):undefined};
}
export default function XeroCustomerHistory({state,customerId,initialContactId,initialView,onRead,onClose,onOpenAgreement,onLifecycle}:{state:RentalWorkspace;customerId:string|null;initialContactId?:string;initialView?:'overview'|'payments';onRead?:ReadXeroHistory;onClose:()=>void;onOpenAgreement?:OpenAgreement;onLifecycle?:LifecycleCommand}) {
 const [view,setView]=useState<string>(initialView||(customerId?'overview':'payments'));
 const [contactId,setContactId]=useState<string|undefined>(initialContactId);const [result,setResult]=useState<XeroHistoryResult|null>(null);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [search,setSearch]=useState('');const [showDeleted,setShowDeleted]=useState(false);
 useEffect(()=>{let active=true;setLoading(true);setError('');const selection=contactId?{contactId}:customerId?{customerId}:{};const request=onRead?onRead(selection):Promise.resolve(localHistory(state,selection));request.then(data=>{if(active)setResult(data);}).catch(()=>{if(active){setResult(null);setError('Could not load Xero history. Try again after checking the connection.');}}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[customerId,contactId,onRead,state]);
 const customer=state.customers.find(c=>c.id===customerId);const directory=!customerId&&!contactId;
 const customerRow=customerId?customerDirectory(state).find(row=>row.customer.id===customerId):undefined;
 const contactEmail=customer?.email&&!customer.email.toLowerCase().endsWith('.invalid')?customer.email:'';
 const contacts=(result?.contacts||[]).filter(c=>`${c.name} ${c.pendingMatches.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
 const records=(result?.transactions||[]).filter(r=>showDeleted||r.status==='AUTHORISED').sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
 return <Dialog open onOpenChange={open=>{if(!open)onClose();}}>
  <DialogContent className="customer-history-view flex max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0">
   <DialogHeader className="shrink-0 border-b bg-card px-5 py-4 pr-12 text-left sm:px-6">
    <DialogTitle className="text-xl leading-7">{directory?'Xero customers':customer?.name||result?.contacts[0]?.name||'Customer history'}</DialogTitle>
    <DialogDescription className="text-xs leading-5">{directory?'Imported contacts and their app customer links.':customerId?'Rental agreements, sauna history, and recorded payments.':'Recorded Xero payments.'}</DialogDescription>
    {customer&&(customer.primaryContact||customer.phone||contactEmail)&&<div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">{customer.primaryContact&&<span>Contact: {customer.primaryContact}</span>}{customer.phone&&<span>{customer.phone}</span>}{contactEmail&&<span className="break-all">{contactEmail}</span>}</div>}
   </DialogHeader>
   <Tabs value={view} onValueChange={setView} className="flex min-h-0 flex-1 flex-col">
    {customerId&&<TabsList aria-label="Customer history sections" className="mx-5 mt-4 w-fit shrink-0 bg-muted/40 sm:mx-6">
     <TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="payments">Payments{!loading&&` (${records.length})`}</TabsTrigger>
    </TabsList>}
    <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
     {customerId&&<TabsContent value="overview" className="m-0 space-y-6">
      {customerRow&&<>
       <section aria-label="Customer lifetime value" className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-4"><h3 className="text-xs font-medium text-muted-foreground">Committed LTV</h3><div className="mt-1 text-xl font-semibold tabular-nums">{displayMoney(customerRow.ltv.committed)}</div><p className="mt-2 text-xs text-muted-foreground">Original contract minimum months × monthly rent and rental add-ons. Later waivers, settlements and rate reductions do not reduce this original commitment. Excludes speculative renewals; this is not a balance due.</p>{customerRow.ltv.commitmentNotes.map(note=><p key={note} className="mt-2 text-xs text-amber-800 dark:text-amber-300">{note}</p>)}</div>
        <div className="rounded-lg border bg-card p-4"><h3 className="text-xs font-medium text-muted-foreground">Actual LTV</h3><div className="mt-1 text-xl font-semibold tabular-nums">{displayMoney(customerRow.ltv.actual)}</div><p className="mt-2 text-xs text-muted-foreground">{customerRow.ltv.actualNote}</p></div>
       </section>
       <section aria-label="Sauna and customer accounts" className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-3">
        <div><h3 className="mb-2 text-xs font-medium text-muted-foreground">Current sauna · number / type</h3>{customerRow.saunas.length?customerRow.saunas.map(a=><div key={a.id} className="text-sm">#{a.code||'Unnumbered'} · {a.typeName||a.model||'Type unknown'}</div>):<span className="text-sm text-muted-foreground">None currently assigned</span>}</div>
        <div><h3 className="mb-2 text-xs font-medium text-muted-foreground">Stripe customer</h3>{customerRow.stripeIds.length?customerRow.stripeIds.map(id=><a key={id} className="block break-all text-xs text-primary underline underline-offset-2" href={stripeCustomerUrl(id)!} target="_blank" rel="noopener noreferrer">{id}</a>):<span className="text-sm text-muted-foreground">Not linked</span>}</div>
        <div><h3 className="mb-2 text-xs font-medium text-muted-foreground">Xero customer</h3>{customerRow.xeroLinks.length?customerRow.xeroLinks.map(l=><a key={`${l.tenantId}:${l.contactId}`} className="block break-words text-xs text-primary underline underline-offset-2" href={xeroContactUrl(l.contactId,l.shortCode)!} target="_blank" rel="noopener noreferrer">{l.name}</a>):<span className="text-sm text-muted-foreground">Not linked</span>}</div>
       </section>
      </>}
      <RentalCustomerHistory state={state} customerId={customerId} onOpenAgreement={onOpenAgreement}/></TabsContent>}
     <TabsContent value="payments" className="m-0 space-y-4">
      {contactId&&!customerId&&<Button variant="outline" size="sm" onClick={()=>setContactId(undefined)}>Back to Xero contacts</Button>}
      {loading?<p role="status" className="py-6 text-muted-foreground">Loading payments…</p>:error?<p role="alert" className="text-destructive">{error}</p>:<>
       {directory?<>
        <Input aria-label="Search Xero history contacts" placeholder="Search contacts or proposed customer names…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <div className="overflow-x-auto rounded-lg border bg-card"><table className="w-full min-w-[520px] border-collapse text-left text-xs">
         <thead className="bg-muted/30 text-muted-foreground"><tr>{['Xero contact','App customer','Review'].map(h=><th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
         <tbody>{contacts.map(c=><tr key={c.contactId} className="border-t"><td className="px-4 py-3"><button className="font-medium text-primary hover:underline" onClick={()=>setContactId(c.contactId)}>{c.name}</button></td><td className="px-4 py-3">{c.customerId?state.customers.find(a=>a.id===c.customerId)?.name||'Linked customer':'Not linked'}</td><td className="px-4 py-3 text-muted-foreground">{c.customerId?'Linked':c.reviewState==='needs_classification'?'Confirm customer classification':c.pendingMatches.length?`Possible match: ${c.pendingMatches.join(', ')}`:'Match pending'}</td></tr>)}</tbody>
        </table></div>
       </>:<>
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Payment history</h3><label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={showDeleted} onChange={e=>setShowDeleted(e.target.checked)}/>Show deleted records</label></div>
        {result?.contacts.some(c=>!c.customerId)&&<p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">These payments have no app customer assigned. Review the identity before linking.</p>}
        {!result?.contacts.length?<p className="rounded-lg border border-dashed p-4 text-muted-foreground">No imported Xero history for this customer yet. This does not imply zero payments.</p>:<>
         <div className="overflow-x-auto rounded-lg border bg-card"><table aria-label="Xero payment records" className="w-full border-collapse text-left text-xs md:min-w-[650px]">
          <thead className="hidden bg-muted/30 text-muted-foreground md:table-header-group"><tr>{['Date','Direction','Amount','Classification / details','Status'].map(h=><th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{records.map(r=><tr key={r.id} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 border-t px-4 py-4 align-top hover:bg-muted/10 md:table-row md:p-0">
           <td className="col-start-1 row-start-1 whitespace-nowrap font-medium tabular-nums md:px-4 md:py-3.5 md:font-normal">{historyDate(r.date)}</td>
           <td className="col-start-1 row-start-2 md:px-4 md:py-3.5"><span className={r.type==='RECEIVE'?'text-emerald-800 dark:text-emerald-300':'text-muted-foreground'}>{r.type==='RECEIVE'?'Received':'Paid out'}</span></td>
           <td className="col-start-2 row-start-1 whitespace-nowrap text-right text-sm font-semibold tabular-nums md:px-4 md:py-3.5 md:text-left">{displayCashAmount(r.amount,r.currency)}</td>
           <td className="col-span-2 row-start-3 border-t pt-3 md:min-w-[220px] md:border-0 md:px-4 md:py-3.5">
            {r.reference&&<div className="mb-2 font-medium break-words">{r.reference}</div>}
            {customerId&&<PaymentAllocationReview state={state} customerId={customerId} payment={r} onCommand={onLifecycle}/>}
            <details className="history-disclosure mt-1"><summary>Original Xero details</summary><div className="space-y-2 text-xs text-muted-foreground"><p className="whitespace-pre-line">{r.description||'No description recorded'}</p><p>{r.accountNames.join(' · ')}</p>{r.lines?.map((l,i)=><p key={i}>{l.accountName||l.accountCode}: {displayCashAmount(l.amount,r.currency)}{l.description?` · ${l.description}`:''}</p>)}<code className="block break-all text-[10px]">{r.id}</code></div></details>
           </td>
           <td className="col-start-2 row-start-2 text-right md:px-4 md:py-3.5 md:text-left"><span className="inline-block rounded-full bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground" title={r.status}>{r.status.charAt(0)+r.status.slice(1).toLowerCase().replace(/_/g,' ')}</span></td>
          </tr>)}{!records.length&&<tr><td className="p-4 text-muted-foreground" colSpan={5}>No records match this filter.</td></tr>}</tbody>
         </table></div>
         <p className="text-xs text-muted-foreground">{records.length} source records. Deposits and unearned rent retain their original categories. Bank transfers and Stripe clearing payouts are excluded.</p>
        </>}
       </>}
       {result?.coverage&&<details className="history-disclosure border-t pt-3"><summary>Import information</summary><div className="space-y-1 text-xs text-muted-foreground"><p>Imported {new Date(result.coverage.snapshotAt||result.contacts[0]?.snapshotAt).toLocaleString()}.</p><p>{result.coverage.terminalPageReached?'All source pages were read.':'Source coverage incomplete.'} {result.coverage.note}</p></div></details>}
      </>}
     </TabsContent>
    </div>
   </Tabs>
  </DialogContent>
 </Dialog>;
}
