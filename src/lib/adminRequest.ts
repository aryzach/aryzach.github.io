/** Bound admin requests without implying that a timed-out write was rolled back. */
export class AdminRequestUncertain extends Error {
 constructor() { super('The server did not confirm the result. Refresh history to check the current record before trying again.'); this.name='AdminRequestUncertain'; }
}
export async function fetchAdminJson(url:string, init:RequestInit, timeoutMs=30000) {
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try {
  const response=await fetch(url,{...init,signal:controller.signal});
  const text=await response.text();
  let body;
  try { body=JSON.parse(text); } catch { body={}; }
  if(!response.ok) {
   if(response.status>=500||/upstream request timeout/i.test(text))throw new AdminRequestUncertain();
   throw new Error(typeof body.error==='string'?body.error:`Request failed (${response.status}). Please refresh and try again.`);
  }
  return body;
 } catch(error) {
  if(controller.signal.aborted||error instanceof TypeError)throw new AdminRequestUncertain();
  throw error;
 } finally { clearTimeout(timer); }
}
