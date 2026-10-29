import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import puppeteer from 'puppeteer';
const origin='http://127.0.0.1:4176';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4176','--strictPort'],{stdio:'pipe'});
let output='';server.stdout.on('data',x=>output+=x);server.stderr.on('data',x=>output+=x);
let browser;
try{
 let ready=false;
 for(let n=0;n<100;n++){
  if(server.exitCode!==null)throw Error(output);
  try{if((await fetch(origin)).ok){ready=true;break;}}catch{/* starting */}
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 assert.ok(ready,output);
 browser=await puppeteer.launch({executablePath:process.env.PUPPETEER_EXECUTABLE_PATH,headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setRequestInterception(true);page.on('request',r=>{const u=new URL(r.url());if(u.origin===origin||u.protocol==='data:')void r.continue();else void r.abort();});
 const manage=()=>page.$$eval('button',bs=>bs.find(b=>b.textContent.startsWith('Manage sauna condition / fleet')).click());
 const target=()=>page.$eval('form[aria-label="Manage sauna condition and fleet"]',f=>f.textContent);
 await page.goto(origin+'/tests/browser/fleet-selection.html',{waitUntil:'networkidle0'});
 await page.click('[aria-label="Select test A"]');await manage();
 assert.match(await target(),/#Test A/);assert.equal(await page.$('select[name="unit"]'),null);
 await page.click('[aria-label="Select test B"]');assert.match(await target(),/2 saunas/);assert.match(await target(),/#Test A, #Test B/);
 await page.click('[aria-label="Select test A"]');assert.match(await target(),/#Test B/);assert.doesNotMatch(await target(),/#Test A/);
 await page.click('[aria-label="Select test B"]');await page.waitForSelector('select[name="unit"]');assert.equal(await page.$eval('select[name="unit"]',s=>s.value),'');
 await page.select('select[name="unit"]','A');await page.click('[aria-label="Select test B"]');assert.match(await target(),/#Test B/);
 await page.type('input[name="reason"]','Selection test');await page.click('button[type="submit"]');
 await page.waitForFunction(()=>document.querySelector('output').textContent==='condition:B:ready');
 assert.equal(await page.$eval('[aria-label="Select test B"]',x=>x.checked),false);
 assert.match(await target(),/#Test B/);assert.match(await target(),/1 saved/);
 await page.click('[aria-label="Select test A"]');assert.match(await target(),/#Test B/);assert.doesNotMatch(await target(),/#Test A/);
 console.log('PASS checked rows before/after opening; clearing and overriding manual selection; submitted targets stay fixed');
 // Reopen against current checks; hidden checked units remain explicit targets.
 await page.click('[aria-label="Select test B"]');await page.click('[aria-label="Hide test A"]');await page.click('[aria-label="Block test B"]');await manage();
 assert.match(await target(),/#Test A, #Test B/);assert.equal(await page.$('[aria-label="Select test A"]'),null);
 await page.click('button[type="submit"]');
 await page.waitForFunction(()=>document.querySelector('form').textContent.includes('1 saved · 1 blocked'));
 assert.equal(await page.$eval('[aria-label="Select test B"]',x=>x.checked),true);
 assert.match(await target(),/#Test A, #Test B/);
 assert.equal(await page.$('[aria-label="Clear"]'),null);
 assert.deepEqual(await page.$eval('output',o=>o.textContent.split(', ')),['condition:B:ready','condition:A:ready','condition:B:ready']);
 assert.deepEqual(errors,[]);
 console.log('PASS hidden selections retained; partial results retain their original targets; only failed units remain checked; no dead assignment Clear button');
}finally{await browser?.close();server.kill('SIGTERM');}
