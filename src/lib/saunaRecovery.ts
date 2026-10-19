import type { RentalWorkspace } from './rentalModel.ts';
export interface RecoveryLine {id:string;description:string;account:string;net:number;gross:number;saunaCodes:string[];}
export interface RecoveryCash {id:string;date:string;direction:'RECEIVE'|'SPEND';currency:string;lines:RecoveryLine[];sourceUrl?:string;}
export interface RecoverySources {snapshotAt:string|null;complete:boolean;transactions:RecoveryCash[];}
export interface RecoveryEntry {sourceId:string;date:string;description:string;kind:'cost'|'rent'|'sale';amount:number;sourceUrl?:string;}
export interface RecoveryRow {heaterShare:number;id:string;code:string;type:string;cost:number|null;rent:number;sale:number;recovered:number;remaining:number|null;percentage:number|null;status:'paid'|'unpaid'|'unknown';entries:RecoveryEntry[];}
const costAccounts=new Set(['540','SH']);
const rentAccounts=new Set(['102','542']);
const saleAccounts=new Set(['372','788']);
export function recoverySources(records:Record<string,unknown>[],snapshotAt:string|null,complete=true,bills:Record<string,unknown>[]=[]):RecoverySources {
 const transactions:RecoveryCash[]=[];
 // Supplier bills carry numbered-unit cost allocations; their payments are not
 // separate costs. Keep the source bill URL and import its current lines once.
 const supplierBills:Record<string,unknown>[]=bills.filter(b=>b.Type==='ACCPAY'&&['AUTHORISED','PAID'].includes(String(b.Status))).map(b=>({...b,BankTransactionID:b.InvoiceID,Type:'SPEND',Status:'AUTHORISED',sourceUrl:`https://go.xero.com/AccountsPayable/View.aspx?InvoiceID=${encodeURIComponent(String(b.InvoiceID))}`,LineItems:((b.LineItems||[]) as Record<string,unknown>[]).map(l=>({...l,AccountCode:String(l.AccountCode)==='1400'?'540':l.AccountCode}))}));
 for(const record of [...records,...supplierBills]){
  if(record.Status!=='AUTHORISED'||!['RECEIVE','SPEND'].includes(String(record.Type)))continue;
  const lines=(Array.isArray(record.LineItems)?record.LineItems:[]) as Record<string,unknown>[];
  const money=(v:unknown)=>{const n=Number(v??0);if(!Number.isFinite(n)||!Number.isSafeInteger(Math.round(n*100)))throw Error('Invalid Xero amount');return Math.round(n*100);};
  const rawDate=String(record.DateString||record.Date||'');const ms=/^\/Date\((-?\d+)/.exec(rawDate);const date=ms?new Date(Number(ms[1])).toISOString().slice(0,10):rawDate.slice(0,10);
  transactions.push({id:String(record.BankTransactionID),date,direction:record.Type as RecoveryCash['direction'],currency:String(record.CurrencyCode),...(record.sourceUrl?{sourceUrl:String(record.sourceUrl)}:{}),lines:lines.map((line,i)=>{
   const amount=money(line.LineAmount),tax=money(line.TaxAmount);const inclusive=record.LineAmountTypes==='Inclusive';
   const tracking=Array.isArray(line.Tracking)?line.Tracking as Record<string,unknown>[]:[];
   return {id:String(line.LineItemID||i),description:String(line.Description||''),account:String(line.AccountCode||''),net:inclusive?amount-tax:amount,gross:inclusive?amount:amount+tax,saunaCodes:[...new Set(tracking.filter(t=>t.Name==='Saunas').flatMap(t=>{const m=/^Sauna\s+(\d{1,3})(?:\D|$)/i.exec(String(t.Option||''));return m?[m[1].padStart(3,'0')]:[];}))]};
  })});
 }
 return {snapshotAt,complete,transactions};
}
export function saunaRecovery(state:RentalWorkspace,sources:RecoverySources,includeHeaters=false,includeSales=true) {
 const rows:RecoveryRow[]=state.assets.map(a=>({heaterShare:0,id:a.id,code:a.code.padStart(3,'0'),type:a.typeName||a.model||'Unknown type',cost:null,rent:0,sale:0,recovered:0,remaining:null,percentage:null,status:'unknown',entries:[]}));
 const byCode=new Map(rows.map(r=>[r.code,r]));const issues:{sourceId:string;date:string;kind:string;amount:number;reason:string;sourceUrl?:string}[]=[];
 const excluded=new Set((state.lifecycle?.paymentReviews||[]).map(r=>r.source_id));
 let heaterTotal=0;
 const seen=new Set<string>();
 for(const t of sources.transactions){
  if(seen.has(t.id))continue;seen.add(t.id);
  const add=(codes:string[],kind:RecoveryEntry['kind'],amount:number,description:string)=>{
   if(!amount)return;
   const row=codes.length===1?byCode.get(codes[0]):undefined;
   if(!row||t.currency!=='USD'){issues.push({sourceId:t.id,date:t.date,kind,amount,...(t.sourceUrl?{sourceUrl:t.sourceUrl}:{}),reason:t.currency!=='USD'?'Currency needs review':!codes.length?'No numbered sauna tag':codes.length>1?'Multiple sauna tags':'Sauna number not in inventory'});return;}
   row.entries.push({sourceId:t.id,date:t.date,kind,amount,description,...(t.sourceUrl?{sourceUrl:t.sourceUrl}:{})});
   if(kind==='cost')row.cost=(row.cost??0)+amount;else if(kind==='rent')row.rent+=amount;else row.sale+=amount;
  };
  heaterTotal+=t.currency==='USD'?t.lines.filter(l=>l.account==='SH').reduce((n,l)=>n+l.gross*(t.direction==='SPEND'?1:-1),0):0;
  for(const line of t.lines.filter(l=>costAccounts.has(l.account)&&!(includeHeaters&&l.account==='SH')))add(line.saunaCodes,'cost',line.gross*(t.direction==='SPEND'?1:-1),line.description||'Sauna / heater purchase');
  if(excluded.has(t.id))continue;
  const allocations=(state.lifecycle?.allocations||[]).filter(a=>a.source_id===t.id&&!a.voided_at&&a.currency==='USD');
  for(const [kind,accounts,category] of [['rent',rentAccounts,'rental'],['sale',saleAccounts,'sale']] as const){
   if(kind==='sale'&&!includeSales)continue;
   const lines=t.lines.filter(l=>accounts.has(l.account));
   const sourceTotal=lines.reduce((n,l)=>n+l.net,0);
   const amount=allocations.length?allocations.filter(a=>a.category===category).reduce((n,a)=>n+a.amount_cents,0):sourceTotal;
   const sign=t.direction==='SPEND'?-1:1;
   if(amount===sourceTotal){for(const line of lines)add(line.saunaCodes,kind,line.net*sign,line.description||`${kind==='rent'?'Rental':'Sauna sale'} cash`);}
   else if(amount){
    // A reviewed mixed receipt can follow one explicit Xero unit; never guess
    // from today's customer assignment or spread cash across several units.
    const codes=[...new Set(t.lines.flatMap(l=>l.saunaCodes))];
    add(codes,kind,amount*sign,'Reviewed payment classification');
   }
  }
 }
 const traditional=rows.filter(r=>/traditional/i.test(r.type)).sort((a,b)=>a.code.localeCompare(b.code));
 if(includeHeaters&&traditional.length){const share=Math.trunc(heaterTotal/traditional.length),remainder=heaterTotal-share*traditional.length;traditional.forEach((row,i)=>{row.heaterShare=share+(i<Math.abs(remainder)?Math.sign(remainder):0);if(row.cost!==null)row.cost+=row.heaterShare;});}
 for(const row of rows){row.recovered=row.rent+row.sale;if(row.cost!==null&&row.cost>0){row.remaining=Math.max(0,row.cost-row.recovered);row.percentage=row.recovered/row.cost*100;row.status=row.remaining===0?'paid':'unpaid';}}
 return {heaterTotal,traditionalCount:traditional.length,rows:rows.sort((a,b)=>a.code.localeCompare(b.code)),issues};
}
