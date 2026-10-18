import assert from 'node:assert/strict';
import test from 'node:test';
import {fetchAdminJson,AdminRequestUncertain} from '../src/lib/adminRequest.ts';

test('admin requests distinguish rejections from uncertain writes and bound response-body waits',async()=>{
 const original=globalThis.fetch;
 try {
  globalThis.fetch=async()=>new Response(JSON.stringify({workspace:{id:'fresh'}}));
  assert.deepEqual(await fetchAdminJson('https://example.invalid',{}),{workspace:{id:'fresh'}});
  globalThis.fetch=async()=>new Response(JSON.stringify({error:'Rental changed. Refresh before saving.'}),{status:409});
  await assert.rejects(fetchAdminJson('https://example.invalid',{}),{message:'Rental changed. Refresh before saving.'});
  globalThis.fetch=async()=>new Response(JSON.stringify({error:'upstream request timeout'}),{status:400});
  await assert.rejects(fetchAdminJson('https://example.invalid',{}),AdminRequestUncertain);
  for(const status of [500,502,503,504]) {
   globalThis.fetch=async()=>new Response(JSON.stringify({error:'Server response unavailable'}),{status});
   await assert.rejects(fetchAdminJson('https://example.invalid',{}),AdminRequestUncertain);
  }
  globalThis.fetch=async()=>{throw new TypeError('Network unavailable');};
  await assert.rejects(fetchAdminJson('https://example.invalid',{}),AdminRequestUncertain);
  for(const bodyStarted of [false,true]) {
   globalThis.fetch=async(_input,init)=>{
    const stalled=new Promise<never>((_,reject)=>init!.signal!.addEventListener('abort',()=>reject(new DOMException('aborted','AbortError'))));
    return bodyStarted?{ok:true,text:()=>stalled} as Response:stalled;
   };
   await assert.rejects(fetchAdminJson('https://example.invalid',{},10),AdminRequestUncertain);
  }
 }finally{globalThis.fetch=original;}
});
