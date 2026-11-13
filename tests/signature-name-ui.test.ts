import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { Window } from 'happy-dom';

test('signature field distinguishes empty input and accepts mobile spacing without changing the entered text', async () => {
  const compiled = await build({
    stdin: {contents: `import React from 'react';import{createRoot}from'react-dom/client';import{SignStep}from'./src/components/contract/RentalAgreementSheet';function App(){const[name,setName]=React.useState('');const[acks,setAcks]=React.useState({});return <SignStep contract={{customer_legal_name:'Test Customer'}} typedName={name} setTypedName={setName} acks={acks} setAcks={setAcks} masterAgreementUrl={null}/>;}createRoot(document.getElementById('root')).render(<App/>);`, resolveDir:process.cwd(),loader:'tsx'},
    bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},
    plugins:[{name:'signature-test-surface',setup(b){
      b.onLoad({filter:/RentalAgreementSheet\.tsx$/},args=>({contents:readFileSync(args.path,'utf8')+'\nexport { SignStep };',loader:'tsx'}));
      b.onResolve({filter:/^@\/integrations\/supabase\/client$/},()=>({path:'client',namespace:'test'}));
      b.onResolve({filter:/^@\/lib\/runtime$/},()=>({path:'runtime',namespace:'test'}));
      b.onLoad({filter:/.*/,namespace:'test'},args=>({contents:args.path==='client'?'export const supabase={};':'export const previewEnabled=true;',loader:'js'}));
    }}],
  });
  const w=new Window({url:'http://127.0.0.1:5174',settings:{enableJavaScriptEvaluation:true}});
  const d=w.document;d.body.innerHTML='<div id="root"></div>';
  const tick=()=>new Promise(r=>setTimeout(r,50));
  try {
    w.eval(compiled.outputFiles[0].text);await tick();
    const input=d.querySelector<HTMLInputElement>('input[aria-label="Electronic signature"]')!;
    assert.ok(input);assert.equal(input.value,'');assert.equal(input.placeholder,'Type your full legal name');
    assert.equal(input.getAttribute('autocomplete'),'name');assert.equal(input.getAttribute('autocorrect'),'off');
    const type=async(value:string)=>{
      Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value')!.set!.call(input,value);
      input.dispatchEvent(new w.Event('input',{bubbles:true}));await tick();
    };
    for(const value of ['Test  Customer','Test\u00a0Customer','Test\u200b Customer']) {
      await type(value);assert.ok(input.classList.contains('border-primary'));assert.equal(input.value,value);
    }
    await type('Test Other');assert.ok(!input.classList.contains('border-primary'));
    await type('');assert.ok(!input.classList.contains('border-primary'));
    const checks=[...d.querySelectorAll<HTMLInputElement>('input[type=checkbox]')];
    assert.equal(checks.length,5);assert.ok(checks.every(c=>!c.checked));
  } finally {await w.happyDOM.close();}
});
