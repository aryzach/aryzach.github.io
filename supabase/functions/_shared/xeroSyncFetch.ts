import { SYNC_TENANT, type SYNC_RESOURCES, type XeroRecord } from './xeroSyncModel.ts';
export async function readXeroPages(resource:typeof SYNC_RESOURCES[number],token:string,since:string|null,deadline:number,fetcher:typeof fetch=fetch,pause=(ms:number)=>new Promise(r=>setTimeout(r,ms))) {
 const all:XeroRecord[]=[];
 const order={Contacts:'ContactID',BankTransactions:'BankTransactionID',Invoices:'InvoiceID',Payments:'PaymentID',CreditNotes:'CreditNoteID'}[resource];
 for(let page=1;page<=100;page++) {
  let response:Response|undefined;
  for(let attempt=0;attempt<3;attempt++) {
   if(Date.now()>deadline-15000)throw Error('Xero is taking too long. Retry Sync now.');
   const url=new URL(`https://api.xero.com/api.xro/2.0/${resource}`);if(resource==='Contacts')url.searchParams.set('includeArchived','true');url.searchParams.set('page',String(page));url.searchParams.set('pageSize','1000');url.searchParams.set('order',order+' ASC');
   response=await fetcher(url,{method:'GET',redirect:'error',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${token}`,'Xero-tenant-id':SYNC_TENANT,Accept:'application/json',...(since?{'If-Modified-Since':since}:{})}});
   if(response.status!==429&&response.status<500)break;
   const retry=Number(response.headers.get('Retry-After')||'2');
   const delay=Number.isFinite(retry)?Math.max(1,retry)*1000:3000;
   if(attempt===2||delay>30000||Date.now()+delay+15000>deadline)throw Error('Xero rate limit or temporary outage. Retry later; the previous import is unchanged.');
   await pause(delay);
  }
  if(!response?.ok)throw Error(response?.status===401?'Xero connection expired. Reconnect Xero.':`Xero ${resource} could not be read. Previous import is unchanged.`);
  const payload=await response.json();const rows=payload[resource];if(!Array.isArray(rows))throw Error('Xero returned incomplete data. Previous import is unchanged.');
  if(!rows.length)return all;
  all.push(...rows);
  const pagination=payload.pagination||payload.Pagination;
  if(pagination) {
    const pages=Number(pagination.pageCount), currentPage=Number(pagination.page), count=Number(pagination.itemCount);
    if(!Number.isInteger(pages)||!Number.isInteger(currentPage)||!Number.isInteger(count)||currentPage!==page||pages<page||count<all.length)throw Error('Xero returned inconsistent pagination. Previous import is unchanged.');
    if(page===pages){if(all.length!==count)throw Error('Xero changed during pagination. Retry Sync now.');return all;}
  }
  await pause(1100); // Below the per-minute tenant limit, including other app requests.
 }
 throw Error('Xero paging limit reached. Previous import is unchanged.');
}
