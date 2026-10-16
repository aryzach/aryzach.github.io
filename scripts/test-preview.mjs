import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer';

const origin = 'http://127.0.0.1:4175';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', ...(process.env.PREVIEW_DIST_DIR ? ['--outDir', process.env.PREVIEW_DIST_DIR] : []), '--host', '127.0.0.1', '--port', '4175', '--strictPort'], { stdio: 'pipe' });
let output = '';
server.stdout.on('data', chunk => { output += chunk; });
server.stderr.on('data', chunk => { output += chunk; });
let browser;
try {
  let ready = false;
  for (let n = 0; n < 100; n++) {
    if (server.exitCode !== null) throw new Error(`Preview server exited: ${output}`);
    try { if ((await fetch(origin)).ok) { ready = true; break; } } catch { /* starting */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, `Preview server did not start: ${output}`);
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  browser = await puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  const unsafeRequests = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin === origin || ['data:', 'blob:'].includes(url.protocol)) return void request.continue();
    // Abort before any external request reaches a service, even if safeguards regress.
    if (/supabase|preview\.invalid|leadconnector|stripe|cal\.com|posthog|googletagmanager|facebook|elfsight/.test(url.hostname)) unsafeRequests.push(request.url());
    void request.abort();
  });
  for (const route of ['/', '/pricing', '/how-it-works', '/careers/customer-operations-lead', '/admin', '/accounting']) {
    await page.goto(origin + route, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-preview-banner]');
    await page.waitForFunction(() => document.querySelector('#root')?.textContent.length > 150);
    if (route === '/pricing') await page.waitForFunction(() => document.body.textContent.includes('Waiting for data'));
    if (route === '/admin' || route === '/accounting') {
      await page.type('input[type="password"]', 'preview');
      await page.click('button[type="submit"]');
      await page.waitForFunction(() => !document.querySelector('input[type="password"]'));
      if (route === '/admin') {
        await page.setViewport({ width: 1440, height: 1050 });
        await page.$$eval('button', buttons => buttons.find(b => b.textContent === 'Customer insights').click());
        await page.waitForSelector('[aria-label="Customer insights"]');
        const section = '[aria-label="Customer insights"]';
        assert.ok(await page.$eval('[aria-label="Customer match review"]', el => el.textContent.includes('Waiting for data')));
        assert.equal(await page.$$eval('[aria-label="Customer match review"] button', buttons => buttons.length), 0);
        assert.equal(await page.$$eval('[aria-label="Xero connection"] button', buttons => buttons.every(button => button.disabled)), true);
        assert.ok(await page.$eval('[aria-label="Xero connection"]', el => el.textContent.includes('Backend setup required')));
        assert.ok(await page.$eval(section, el => el.textContent.includes('Waiting for data')));
        assert.equal(await page.$eval(section, el => /\$[\d,]+|Avery|Riley|Synthetic data/.test(el.textContent)), false);
        assert.equal(await page.$eval('input[aria-label="Search customer histories"]', el => el.disabled), true);
        if (process.env.DASHBOARD_SCREENSHOT_PATH) await (await page.$(section)).screenshot({ path: process.env.DASHBOARD_SCREENSHOT_PATH });
        await page.$$eval('button', buttons => buttons.find(b => b.textContent === 'Retention & payback').click());
        await page.waitForFunction(() => document.body.textContent.includes('Acquisition payback'));
        assert.equal(await page.$eval(section, el => el.querySelectorAll('.recharts-wrapper').length), 0);
        if (process.env.DASHBOARD_SCREENSHOT_PATH) await (await page.$(section)).screenshot({ path: process.env.DASHBOARD_SCREENSHOT_PATH.replace('.png', '-cohorts.png') });
        await page.$$eval('button', buttons => buttons.find(b => b.textContent === 'Metric definitions').click());
        await page.waitForFunction(() => document.body.textContent.includes('Missing costs will not be replaced by assumptions.'));
        console.log('PASS customer insights: waiting states, no sample values or charts, definitions');
      }
    }
    console.log(`PASS rendered ${route}`);
  }
  const result = await page.evaluate(async () => {
    const denied = async action => { try { const response = await action(); return response instanceof Response ? !response.ok : false; } catch { return true; } };
    return {
      productionWrite: await denied(() => fetch('https://vwpeuejdgyjcwcymzjxt.supabase.co/functions/v1/reservation-create', { method: 'POST', body: '{}' })),
      crmWrite: await denied(() => fetch('https://services.leadconnectorhq.com/blocked', { method: 'POST' })),
      xhr: await denied(() => { const x = new XMLHttpRequest(); x.open('POST', 'https://api.stripe.com/blocked'); x.send(); }),
      beacon: navigator.sendBeacon('https://us.i.posthog.com/blocked', 'demo'),
    };
  });
  assert.deepEqual(result, { productionWrite: true, crmWrite: true, xhr: true, beacon: false });
  await page.goto(origin + '/reservation-payment-or-schedule-call', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-preview-banner]');
  assert.equal(await page.$$eval('a[href]', links => links.some(a => /https:\/\/(cal\.com|buy\.stripe\.com)/.test(a.href))), false);
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[aria-label="Email address"]');
  await page.type('input[aria-label="Email address"]', 'demo@example.invalid');
  await page.$eval('input[aria-label="Email address"]', input => input.form.requestSubmit());
  await page.waitForFunction(() => [...document.querySelectorAll('[role="alert"]')].some(el => el.textContent.includes('Preview only:')));
  assert.equal(await page.evaluate(() => document.body.textContent.includes("Thanks — you're in.")), false);
  assert.deepEqual(errors, []);
  assert.deepEqual(unsafeRequests, []);
  console.log('PASS preview isolation: no backend, CRM, payment or analytics requests escaped');
  if (process.env.TEST_STATIC_RENDER === '1') {
    const staticPage = await browser.newPage();
    const staticErrors = [];
    staticPage.on('pageerror', error => staticErrors.push(error.message));
    await staticPage.evaluateOnNewDocument(() => { window.__SF_STATIC_RENDER = true; });
    let publicReads = 0;
    const staticWrites = [];
    await staticPage.setRequestInterception(true);
    staticPage.on('request', request => {
      const url = new URL(request.url());
      if (url.origin === origin) return void request.continue();
      if (url.hostname.endsWith('.supabase.co')) {
        if (!['GET', 'OPTIONS'].includes(request.method()) || !['/rest/v1/sauna_types', '/rest/v1/public_sauna_availability', '/rest/v1/app_config'].includes(url.pathname)) staticWrites.push(request.url());
        if (request.method() === 'GET') publicReads++;
        return void request.respond({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' }, contentType: 'application/json', body: '[]' });
      }
      if (/stripe|leadconnector|posthog|googletagmanager|facebook|elfsight/.test(url.hostname)) staticWrites.push(request.url());
      void request.abort();
    });
    await staticPage.goto(origin + '/pricing', { waitUntil: 'domcontentloaded' });
    await staticPage.waitForFunction(() => document.body.textContent.includes('Sauna Options'));
    await staticPage.waitForNetworkIdle({ idleTime: 200 });
    assert.equal(await staticPage.$('[data-preview-banner]'), null);
    assert.ok(publicReads > 0, 'Static generation should read public availability rather than synthetic stock');
    assert.deepEqual(staticWrites, []);
    assert.deepEqual(staticErrors, []);
    console.log('PASS production static render: public reads only, no demo banner or analytics');
    await staticPage.close();
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
