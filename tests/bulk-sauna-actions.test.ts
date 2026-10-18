import assert from 'node:assert/strict';
import test from 'node:test';
import {runSaunaActions,type SaunaActionResult} from '../src/lib/bulkSaunaActions.ts';
import {AdminRequestUncertain} from '../src/lib/adminRequest.ts';
const targets=[1,2,3,4].map(n=>({id:`unit-${n}`,commandId:`request-${n}`}));
test('bulk sauna updates use one stable request per target and report each guarded rejection',async()=>{
 const called:string[]=[];const reported:SaunaActionResult[]=[];
 const results=await runSaunaActions(targets,async target=>{called.push(target.commandId);if(target.id==='unit-2')throw Error(JSON.stringify({error:'Resolve customer assignments first'}));},r=>reported.push(r));
 assert.deepEqual(called,targets.map(t=>t.commandId));assert.deepEqual(results.map(r=>r.status),['saved','failed','saved','saved']);assert.equal(results[1].message,'Resolve customer assignments first');assert.deepEqual(results,reported);
});
test('an unconfirmed bulk write stops further writes without retrying it or claiming a rollback',async()=>{
 const called:string[]=[];
 const results=await runSaunaActions(targets,async target=>{called.push(target.id);if(target.id==='unit-2')throw new AdminRequestUncertain();},()=>{});
 assert.deepEqual(called,['unit-1','unit-2']);assert.deepEqual(results.map(r=>r.status),['saved','unconfirmed','not_attempted','not_attempted']);assert.match(results[1].message!,/did not confirm/);assert.deepEqual(results.map(r=>r.commandId),targets.map(t=>t.commandId));
});
test('empty selections send no commands',async()=>{assert.deepEqual(await runSaunaActions([],async()=>{throw Error('Must not be called');},()=>{}),[]);});
