import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
const origin=process.env.AGREEMENT_PREVIEW_ORIGIN || 'http://127.0.0.1:8080';
const browser=await puppeteer.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
const page=await browser.newPage();await page.setViewport({width:1440,height:1000});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(origin+'/agreement-preview',{waitUntil:'networkidle0'});await page.waitForSelector('[role="group"][aria-label="SF Sauna Premium"]');
const generate=()=>page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Generate Agreement')).disabled);
assert.equal(await generate(),true);
for(const name of ['Damage Protection','Second Heater','Pay Upfront & Save 10%'])await page.$eval('[role="group"][aria-label="'+name+'"]',el=>[...el.querySelectorAll('button')].find(b=>b.textContent==='No').click());
assert.equal(await generate(),true);await page.$eval('[role="group"][aria-label="SF Sauna Premium"]',el=>[...el.querySelectorAll('button')].find(b=>b.textContent==='No').click());assert.equal(await generate(),false);
for(const [term,price,install] of [[1,'$1,200','$500'],[3,'$800','$500'],[6,'$600','$500'],[12,'$500','Free installation'],[24,'$300','Free installation']]){
 const text=await page.evaluate(term=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith(term+' '+(term===1?'month':'months')));b.click();return b.textContent},term);assert.ok(text.includes(price),text);assert.ok(text.includes(install),text);
}
await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith('12 months')).click());
for(const name of ['Damage Protection','Second Heater','Pay Upfront & Save 10%','SF Sauna Premium'])await page.$eval('[role="group"][aria-label="'+name+'"]',el=>[...el.querySelectorAll('button')].find(b=>b.textContent==='Yes').click());
let text=await page.$eval('[role="dialog"]',el=>el.textContent);for(const expected of ['$5,400','$600','$320','$820','$9,240'])assert.ok(text.includes(expected),expected);

await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Generate Agreement')).click());await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.disabled && b.textContent==='Preview only'));text=await page.$eval('[role="dialog"]',el=>el.textContent);assert.ok(text.includes('$5,400'));assert.ok(text.includes('3 business days'));assert.ok(text.includes('Wooden bucket and ladle'));
await page.setViewport({width:390,height:844});
await page.goto(origin+'/agreement-preview?legacy=1',{waitUntil:'networkidle0'});await page.waitForFunction(()=>document.body.textContent.includes('Optional coverage'));assert.equal(await page.$('[role="group"][aria-label="SF Sauna Premium"]'),null);
text=await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith('12 months')).textContent);assert.ok(text.includes('$400'));text=await page.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith('6 months')).textContent);assert.ok(text.includes('Free installation'));
assert.deepEqual(errors,[]);console.log('PASS: required Yes/No choices, all term rates, live totals, generated summary, mobile view and existing unsigned booking preservation.');
}finally{await browser.close()}
