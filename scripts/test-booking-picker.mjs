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
 await page.goto(origin+'/tests/browser/booking-picker.html',{waitUntil:'networkidle0'});
 const button=async text=>page.$$eval('button',(buttons,text)=>buttons.find(b=>b.textContent===text).click(),text);
 await button('View / manage');
 await page.click('button[aria-label="Numbered sauna"]');
 await page.waitForSelector('[cmdk-item]');
 let options=await page.$$eval('[cmdk-item]',nodes=>nodes.map(n=>n.textContent));
 assert.deepEqual(options.map(s=>s.match(/#(\d+)/)[1]),['002','010','058']);
 assert.match(options[1],/Current customer: Test Morgan Hill/);
 await page.type('[aria-label="Search numbered saunas"]','morgan hi');
 options=await page.$$eval('[cmdk-item]',nodes=>nodes.map(n=>n.textContent));
 assert.equal(options.length,1);assert.match(options[0],/#010/);
 await page.$eval('[aria-label="Search numbered saunas"]',input=>input.select());await page.keyboard.press('Backspace');await page.keyboard.type('morgnh');
 assert.equal(await page.$$eval('[cmdk-item]',nodes=>nodes.length),0);
 await page.$eval('[aria-label="Search numbered saunas"]',input=>input.select());await page.keyboard.press('Backspace');await page.keyboard.type('v2');
 await page.waitForFunction(()=>document.querySelectorAll('[cmdk-item]').length===1);
 await page.click('[cmdk-item]');
 assert.equal(await page.$eval('input[name="assetId"]',input=>input.value),'fifty-eight');
 await page.select('[role=dialog] select','waitlist');
 await page.select('select[name="modelKey"]','v1_fir_cedar');
 assert.equal(await page.$('button[aria-label="Numbered sauna"]'),null);
 assert.equal(await page.$('input[name="installOn"]'),null);
 await page.type('input[name="reason"]','Wait for any traditional v1');
 await button('Move to waitlist');
 await page.waitForFunction(()=>document.querySelector('output').textContent.includes('"operation":"waitlist"'));
 const request=JSON.parse(await page.$eval('output',el=>el.textContent));
 assert.equal(request.modelKey,'v1_fir_cedar');assert.equal(request.saunaTypeId,'outdoor_traditional_standard');assert.equal(request.assetId,'');
 assert.deepEqual(errors,[]);
 console.log('PASS numbered sorting; customer/model exact substring filtering without fuzzy matches; selected unit submission; waitlist preference form');
}finally{await browser?.close();server.kill('SIGTERM');}
