import {acquisitionSources} from '../../../src/lib/acquisitionMetrics.ts';
import {readLtvSources} from './ltvSources.ts';
import {SYNC_TENANT} from './xeroSyncModel.ts';
/** Called only after the existing admin-password check; no provider calls or writes. */
export async function readAcquisitionSources(db:any){
 const [cache,state,payments]=await Promise.all([
  db.from('xero_sync_cache').select('records').eq('tenant_id',SYNC_TENANT).eq('resource','BankTransactions').single(),
  db.from('xero_sync_state').select('last_success_at').eq('tenant_id',SYNC_TENANT).single(),readLtvSources(db)
 ]);
 if(cache.error||state.error)throw Error('Could not load imported acquisition expenses');
 return acquisitionSources(cache.data.records,state.data.last_success_at,payments);
}
