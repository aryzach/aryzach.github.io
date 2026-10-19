import {recoverySources} from '../../../src/lib/saunaRecovery.ts';
import {SYNC_TENANT} from './xeroSyncModel.ts';
// Existing password-verified admin API only. No provider calls or writes.
export async function readSaunaRecoverySources(db:any){
 const [cache,state]=await Promise.all([
  db.from('xero_sync_cache').select('records').eq('tenant_id',SYNC_TENANT).eq('resource','BankTransactions').single(),
  db.from('xero_sync_state').select('last_success_at').eq('tenant_id',SYNC_TENANT).single()
 ]);
 if(cache.error||state.error)throw Error('Could not load imported sauna costs and payments');
 return recoverySources(cache.data.records,state.data.last_success_at,true);
}
