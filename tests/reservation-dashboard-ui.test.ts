import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { Window } from "happy-dom";

test("reservation without a preferred date renders and opens an empty date editor", async () => {
  const mocks: Record<string, string> = {
    "@/components/Header": "export default ()=>null;",
    "@/components/Footer": "export default ()=>null;",
    "@/components/contract/RentalAgreementSheet": "export const RentalAgreementSheet=()=>null;",
    "@/hooks/useSEO": "export const useSEO=()=>{};",
    "@/hooks/useAvailability": "export const useAvailability=()=>({getStatus:()=>null});",
    "@/lib/reservationConversion": "export const flushReservationSubmittedEvent=()=>{};",
    "@/integrations/supabase/client": `export const supabase={functions:{invoke:async(name)=>({data:name==='reservation-get'?{reservation:{id:'test-reservation',first_name:'Example',last_name:'Customer',email:'example@example.test',sauna_type_id:'outdoor_traditional',preferred_install_at:null,payment_status:'Unknown',contract_status:'Not Sent',consult_status:'Not Scheduled',id_status:'Not Uploaded'}}:{},error:null})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null})})})})};`,
    "@/components/ui/dialog": `export const Dialog=({open,children})=>open?<div role="dialog">{children}</div>:null;export const DialogContent=({children})=><div>{children}</div>;export const DialogHeader=DialogContent;export const DialogFooter=DialogContent;export const DialogTitle=DialogContent;export const DialogDescription=DialogContent;`,
  };
  const compiled = await build({
    stdin: { contents: `import React from 'react';import{createRoot}from'react-dom/client';import{MemoryRouter,Routes,Route}from'react-router-dom';import Dashboard from'./src/pages/ReservationDashboard';createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/reservation/test-reservation?token=test-token']}><Routes><Route path="/reservation/:id" element={<Dashboard/>}/></Routes></MemoryRouter>);`, resolveDir: process.cwd(), loader: "tsx" },
    bundle: true, write: false, format: "iife", jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"', "import.meta.env": '{}' },
    plugins: [{ name: "reservation-test-dependencies", setup(b) {
      b.onResolve({filter:/^@\//},args=>mocks[args.path] ? {path:args.path,namespace:"reservation-mock"} : undefined);
      b.onLoad({filter:/.*/,namespace:"reservation-mock"},args=>({contents:mocks[args.path],loader:"tsx",resolveDir:process.cwd()}));
    }}],
  });
  const w = new Window({url:"http://localhost/reservation/test-reservation?token=test-token",settings:{enableJavaScriptEvaluation:true}});
  const errors: unknown[]=[];w.addEventListener("error",e=>errors.push(e.error));
  w.fetch=(()=>Promise.reject(new Error("Network disabled in reservation test"))) as typeof w.fetch;
  w.document.body.innerHTML='<div id="root"></div>';
  try {
    w.eval(compiled.outputFiles[0].text);
    await new Promise(resolve=>setTimeout(resolve,150));
    assert.match(w.document.body.textContent!,/Example Customer/);
    assert.match(w.document.body.textContent!,/Not yet selected/);
    const edit=[...w.document.querySelectorAll('button')].find(b=>b.textContent?.trim()==='Edit');
    assert.ok(edit);edit.click();
    await new Promise(resolve=>setTimeout(resolve,100));
    const input=w.document.querySelector<HTMLInputElement>('[role="dialog"] input[type="date"]');
    assert.ok(input);assert.equal(input.value,"");assert.deepEqual(errors,[]);
  } finally {await w.happyDOM.close();}
});
