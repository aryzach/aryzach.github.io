/** Current-source projections only; this module cannot write operational records or call Xero. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type XeroRecord = Record<string, any>;
export const SYNC_TENANT = '8ea25f91-2a7f-4ba4-9eb1-7abe8582cfd4';
export const SYNC_RESOURCES = ['Contacts','BankTransactions','Invoices','Payments','CreditNotes'] as const;
const ids = {Contacts:'ContactID',BankTransactions:'BankTransactionID',Invoices:'InvoiceID',Payments:'PaymentID',CreditNotes:'CreditNoteID'};
export function mergeSource(resource: typeof SYNC_RESOURCES[number], current: XeroRecord[], incoming: XeroRecord[], full: boolean) {
  const merged = new Map<string,XeroRecord>();
  for (const row of full ? [] : current) merged.set(row[ids[resource]],row);
  const seen = new Set<string>();
  for (const row of incoming) {
    const id = row[ids[resource]];
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) || seen.has(id)) throw new Error(`Invalid or repeated ${resource} identifier`);
    seen.add(id); merged.set(id,row);
  }
  return [...merged.values()];
}
export const cents = (value: unknown) => {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number) || Math.abs(number*100-Math.round(number*100))>0.001 || !Number.isSafeInteger(Math.round(number*100))) throw new Error('Unsupported money precision');
  return Math.round(number*100);
};
export function sourceDate(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Missing payment date');
  const match = /^\/Date\((-?\d+)/.exec(value);
  const day = match ? new Date(Number(match[1])).toISOString().slice(0,10) : value.slice(0,10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || new Date(day).toISOString().slice(0,10)!==day) throw new Error('Invalid payment date');
  return day;
}
const knownAccounts=new Set(["100","102","1200","1300","1320","1350","1400","150","1521","1530","1531","200","2000","2060","2080","2100","2160","2170","2180","2190","2200","2400","2500","2550","2600","2650","3000","3110","3120","3130","323","372","3900","423","4300","483","5000","5010","5025","5030","5080","5100","5120","5130","5140","5150","5160","5180","5300","540","542","565","6000","6110","6155","6200","6320","6400","6680","6720","6722","69","6900","7000","7050","7150","788","789","8204","8489","849","876","SH"]);
const accountNames: Record<string,string> = {'100':'General Customer Charges','102':'Subscription Revenue','200':'Security Deposits','2080':'Reservation Deposit','2200':'Sales Tax','372':'Revenue from Sauna Sales','542':'Unearned Rental Revenue','788':'Unearned Sales Revenue','483':'Forfeited Deposits','4300':'Other Services Revenue'};
export function normalizeBank(row: XeroRecord): XeroRecord {
  if (!Array.isArray(row.LineItems)) throw new Error('Payment line detail missing');
  const lines = row.LineItems.map((line: XeroRecord) => ({description:line.Description||'',accountCode:String(line.AccountCode||''),accountName:accountNames[String(line.AccountCode)]||String(line.AccountCode||''),amount:String(line.LineAmount||0),taxAmount:String(line.TaxAmount||0)}));
  return {id:row.BankTransactionID,contactId:row.Contact?.ContactID,date:sourceDate(row.DateString||row.Date),type:row.Type,status:row.Status,currency:row.CurrencyCode||'',lineAmountType:row.LineAmountTypes||null,amount:String(row.Total),reference:row.Reference||'',description:lines.map((l:XeroRecord)=>l.description).filter(Boolean).join('\n'),accountNames:[...new Set(lines.map((l:XeroRecord)=>l.accountName))],lines};
}
export const financialSignature = (t: XeroRecord) => JSON.stringify([t.contactId,t.type,t.status,t.currency,cents(t.amount),t.lines?.map((l:XeroRecord)=>[l.accountCode,cents(l.amount),cents(l.taxAmount),l.description])]);
const validCash = (t:XeroRecord) => t.status==='AUTHORISED' && ['RECEIVE','SPEND'].includes(t.type) && cents(t.amount)>0;
function categories(t:XeroRecord) {
  const totals:Record<string,number>={}; let unsupported=false;
  const lineTotal=(t.lines||[]).reduce((sum:number,l:XeroRecord)=>sum+cents(l.amount),0);
  const taxTotal=(t.lines||[]).reduce((sum:number,l:XeroRecord)=>sum+cents(l.taxAmount),0);
  const inclusive=t.lineAmountType==='Inclusive'||!t.lineAmountType&&lineTotal===cents(t.amount);
  if(t.lineAmountType!=='Inclusive'&&t.lineAmountType!=='Exclusive'&&t.lineAmountType!=='NoTax'&&lineTotal!==cents(t.amount)&&lineTotal+taxTotal!==cents(t.amount))unsupported=true;
  for(const line of t.lines||[]) {
    // Inclusive Xero line amounts already contain tax; never count that tax as rent.
    const tax=cents(line.taxAmount), amount=cents(line.amount)-(inclusive?tax:0);
    const category = ['102','542'].includes(line.accountCode) ? 'rental' : ['200','2080'].includes(line.accountCode) ? 'deposit' : line.accountCode==='372' ? 'sale' : line.accountCode==='2200'?'tax':'other';
    if(amount<0||tax<0)unsupported=true;
    totals[category]=(totals[category]||0)+amount; totals.tax=(totals.tax||0)+tax;
    if(!knownAccounts.has(line.accountCode) && amount!==0)unsupported=true;
  }
  if(Object.values(totals).reduce((a,b)=>a+b,0)!==cents(t.amount))unsupported=true;
  return {totals,unsupported};
}
export interface SyncInput {
  cache:Record<string,XeroRecord[]>; oldHistory:XeroRecord[]; links:XeroRecord[]; allocations:XeroRecord[];
  paymentReviews:XeroRecord[]; previousReviews:XeroRecord[]; cursor:string; full:boolean; initial:boolean;
}
export async function makeSyncProjection(input:SyncInput) {
  const {cache,oldHistory,links,allocations,cursor,full}=input;
  const hash=async(value:unknown)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value))))].map(b=>b.toString(16).padStart(2,'0')).join('');
  const contactMap=new Map(cache.Contacts.map(c=>[c.ContactID,c]));
  const ignored=new Set(oldHistory.filter(h=>h.sync_ignored).map(h=>h.contact_id));
  const linked=new Map(links.map(l=>[l.contact_id,l.customer_id]));
  const old = new Map<string,XeroRecord>(oldHistory.flatMap(h=>(h.transactions||[]).map((t:XeroRecord)=>[t.id,t])));
  const eligible=new Set([...oldHistory.map(h=>h.contact_id),...linked.keys(),...cache.Contacts.filter(c=>c.IsCustomer).map(c=>c.ContactID)]);
  const cash = cache.BankTransactions.filter(r=>['RECEIVE','SPEND'].includes(r.Type)&&r.Contact?.ContactID).map(normalizeBank);
  // Customer revenue/deposit evidence can identify a new customer even when IsCustomer lags in Xero.
  for(const t of cash)if(t.type==='RECEIVE'&&t.lines.some((l:XeroRecord)=>['100','102','200','2080','372','542','788'].includes(l.accountCode)))eligible.add(t.contactId);
  const invoices=new Map(cache.Invoices.map(i=>[i.InvoiceID,i]));
  const credits=new Map(cache.CreditNotes.map(i=>[i.CreditNoteID,i]));
  for(const p of cache.Payments) {
    const refund=!!p.CreditNote?.CreditNoteID;
    const invoice=refund?credits.get(p.CreditNote.CreditNoteID):invoices.get(p.Invoice?.InvoiceID);
    if(!invoice&&(p.Invoice?.Type==='ACCREC'||p.CreditNote?.Type==='ACCRECCREDIT'))throw Error('Customer payment document is missing');
    if(invoice?.Type!==(refund?'ACCRECCREDIT':'ACCREC'))continue;
    const contactId=invoice.Contact?.ContactID; if(!contactId)throw new Error('Invoice payment has no contact');
    eligible.add(contactId);
    const total=cents(invoice.Total), amount=cents(p.Amount);
    const lines=(invoice.LineItems||[]).map((l:XeroRecord)=>({description:l.Description||'',accountCode:String(l.AccountCode||''),accountName:accountNames[String(l.AccountCode)]||String(l.AccountCode||''),amount:String(total>0?Math.round(cents(l.LineAmount)*amount/total)/100:0),taxAmount:String(total>0?Math.round(cents(l.TaxAmount||0)*amount/total)/100:0)}));
    cash.push({id:p.PaymentID,contactId,date:sourceDate(p.Date),type:refund?'SPEND':'RECEIVE',providerKind:refund?'credit_refund':'invoice_payment',lineAmountType:invoice.LineAmountTypes||null,status:p.Status,currency:invoice.CurrencyCode||'',amount:String(p.Amount),reference:p.Reference||'',description:(refund?'Credit note refund ':'Invoice payment ')+(invoice.InvoiceNumber||invoice.CreditNoteNumber||''),accountNames:[...new Set(lines.map((l:XeroRecord)=>l.accountName))],lines});
  }
  const current=new Map(cash.filter(t=>eligible.has(t.contactId)).map(t=>[t.id,t]));
  const reviews:XeroRecord[]=[]; const replacements:XeroRecord[]=[];
  const review=async(kind:string,key:string,contactId:string,sourceId:string|null,message:string,facts:unknown)=>reviews.push({kind,key,contactId,sourceId,customerId:linked.get(contactId)||null,name:contactMap.get(contactId)?.Name||oldHistory.find(h=>h.contact_id===contactId)?.contact_name||'Xero customer',message,fingerprint:await hash(facts)});
  // Keep acknowledgements in SQL; a review remains until acknowledged or its underlying fact disappears.
  for(const r of input.previousReviews)if((r.kind==='classification'||r.kind==='conflict'&&r.review_key.startsWith('date:')&&current.has(r.source_id)))reviews.push({key:r.review_key,kind:r.kind,contactId:r.contact_id,customerId:r.customer_id,sourceId:r.source_id,name:r.name,message:r.message,fingerprint:r.fingerprint});
  for(const [id,t] of current) {
    const prior=old.get(id); const changed=prior&&financialSignature(prior)!==financialSignature(t);
    const forceVicky=input.initial&&linked.get(t.contactId)==='130072af-c8b1-4093-b9b1-50c1ea10f084';
    const existing=allocations.filter(a=>a.source_id===id&&!a.voided_at);
    const customerId=linked.get(t.contactId);
    if(!customerId&&!ignored.has(t.contactId))await review('unmatched',`contact:${t.contactId}`,t.contactId,null,'No app customer is linked. Review the contact before importing a customer or linking it.',contactMap.get(t.contactId));
    if(prior?.date!==undefined&&prior.date!==t.date)await review('conflict',`date:${id}`,t.contactId,id,'Xero payment date changed. Installation, pickup and agreed-rate dates were preserved; review any dates previously inferred from this receipt.',[id,t.date]);
    if(!validCash(t)) {
      if(existing.length||changed)replacements.push({sourceId:id,allocations:[]});
      if(changed&&existing.length)await review('classification',`payment:${id}`,t.contactId,id,'Xero deleted or voided this payment. It has been removed from actual LTV.',t);
      continue;
    }
    const {totals,unsupported}=categories(t);
    const mappingChanged=existing.some(a=>a.customer_id!==customerId);
    const needsReplacement=changed||forceVicky||mappingChanged||!existing.length;
    if(needsReplacement) {
      const rows=customerId&&!unsupported&&t.currency==='USD'?Object.entries(totals).filter(([,n])=>n>0).map(([category,n])=>({customer_id:customerId,rental_id:null,sale_id:null,category,amount_cents:n,source_amount_cents:cents(t.amount),source_kind:t.type==='RECEIVE'?'receipt':'payment_out',currency:t.currency})):[];
      replacements.push({sourceId:id,allocations:rows});
      if(changed||forceVicky)await review('classification',`payment:${id}`,t.contactId,id,'Updated to the current Xero amount, contact and account categories. Review the classification; operational records were preserved.',t);
      if(customerId&&(unsupported||t.currency!=='USD'))await review('conflict',`classification:${id}`,t.contactId,id,'Account split, currency or general charge needs classification. This payment is excluded from actual LTV until resolved.',t);
    }
    if(!prior&&t.lines.some((l:XeroRecord)=>l.accountCode==='100'))await review('classification',`general:${id}`,t.contactId,id,'Xero records a general customer charge. It is classified as other; review whether any part is a rental add-on before including it in rental LTV.',t);
    const duplicate=input.paymentReviews.find(r=>r.source_id===id);
    if(duplicate)await review('conflict',`duplicate:${id}`,t.contactId,id,'This receipt is still authorised in Xero but excluded as an owner-reviewed duplicate in the app. Correct the duplicate in Xero; the exclusion remains until then.',t);
  }
  // Full scans remove absent source facts. Incremental scans carry unchanged records in the current cache.
  for(const [id,t] of old)if(!current.has(id)&&allocations.some(a=>a.source_id===id)) {
    replacements.push({sourceId:id,allocations:[]});
    await review('classification',`missing:${id}`,t.contactId,id,'This payment is no longer in Xero’s current cash records. It has been removed from actual LTV.',[id,'missing']);
  }
  // Keep customer cash plus sauna capital-cost/revenue evidence for the private recovery dashboard.
  // Contacts stay cached so an existing contact can become a customer between nightly reads.
  const customerInvoices=cache.Invoices.filter(r=>r.Type==='ACCREC');
  const customerCredits=cache.CreditNotes.filter(r=>r.Type==='ACCRECCREDIT');
  const invoiceIds=new Set(customerInvoices.map(r=>r.InvoiceID)), creditIds=new Set(customerCredits.map(r=>r.CreditNoteID));
  const currentCache:Record<string,XeroRecord[]>={...cache,BankTransactions:cache.BankTransactions.filter(r=>(eligible.has(r.Contact?.ContactID)||(r.LineItems||[]).some((l:XeroRecord)=>['540','SH','102','542','372','788'].includes(String(l.AccountCode))))&&['RECEIVE','SPEND'].includes(r.Type)),Invoices:customerInvoices,CreditNotes:customerCredits,Payments:cache.Payments.filter(r=>invoiceIds.has(r.Invoice?.InvoiceID)||creditIds.has(r.CreditNote?.CreditNoteID))};
  const histories=[];
  for(const id of eligible) {
    const contact=contactMap.get(id)||oldHistory.find(h=>h.contact_id===id)?.contact_source;
    if(!contact)throw new Error('Customer contact unavailable; source read is incomplete');
    histories.push({contactId:id,name:contact.Name,contact,transactions:[...current.values()].filter(t=>t.contactId===id),linked:linked.has(id),hash:await hash(contact)});
    if(!linked.has(id)&&!ignored.has(id))await review('unmatched',`contact:${id}`,id,null,'No app customer is linked. Review the contact before importing a customer or linking it.',contact);
  }
  for(const r of replacements)r.expectedActiveIds=allocations.filter(a=>a.source_id===r.sourceId&&!a.voided_at).map(a=>a.id).filter(Boolean).sort();
  const uniqueReviews=[...new Map(reviews.map(r=>[r.key,r])).values()];
  return {complete:true,full,cursor,sourceResources:[...SYNC_RESOURCES],links:[...links].sort((a,b)=>a.contact_id.localeCompare(b.contact_id)).map(l=>({contact_id:l.contact_id,customer_id:l.customer_id})),cache:SYNC_RESOURCES.map(resource=>({resource,records:currentCache[resource]})),histories,replacements,reviews:uniqueReviews,counts:{contacts:histories.length,payments:current.size,updatedPayments:replacements.length,needsReview:uniqueReviews.length},coverage:{terminalPageReached:true,note:'Current Xero cash and contacts. Nightly full reconciliation; incremental manual refresh. Invoice payments needing a split are excluded from LTV until reviewed. No prior source versions are stored.'}};
}
