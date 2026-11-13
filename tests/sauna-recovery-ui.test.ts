import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { Window } from "happy-dom";
import { emptyRentalWorkspace } from "../src/lib/rentalModel.ts";
import { recoverySources } from "../src/lib/saunaRecovery.ts";

test("recovery headers sort and source entries open in an accessible popup with payer and date order", async () => {
  const state = {
    ...emptyRentalWorkspace(),
    assets: [
      { id: "one", code: "001", model: "Traditional" },
      { id: "two", code: "002", model: "Infrared" },
    ],
    saunaRecoverySources: recoverySources(
      [
        {
          BankTransactionID: "old",
          Type: "RECEIVE",
          Status: "AUTHORISED",
          CurrencyCode: "USD",
          DateString: "2025-01-01",
          Contact: { Name: "Earlier Payer" },
          LineItems: [
            {
              AccountCode: "102",
              LineAmount: 100,
              Tracking: [{ Name: "Saunas", Option: "Sauna 001" }],
            },
          ],
        },
        {
          BankTransactionID: "new",
          Type: "RECEIVE",
          Status: "AUTHORISED",
          CurrencyCode: "USD",
          DateString: "2026-11-13",
          Contact: { Name: "Latest Payer" },
          LineItems: [
            {
              AccountCode: "102",
              LineAmount: 200,
              Tracking: [{ Name: "Saunas", Option: "Sauna 001" }],
            },
          ],
        },
      ],
      null,
    ),
  };
  const compiled = await build({
    stdin: {
      contents: `import React from 'react';import{createRoot}from'react-dom/client';import{SaunaRecoveryDashboard}from'./src/components/admin/SaunaRecoveryDashboard';createRoot(document.getElementById('root')).render(<SaunaRecoveryDashboard state={${JSON.stringify(state)}}/>);`,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    format: "iife",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
  });
  const w = new Window({
    url: "http://127.0.0.1:5174/admin",
    settings: { enableJavaScriptEvaluation: true },
  });
  const d = w.document;
  d.body.innerHTML = '<div id="root"></div>';
  const wait = async (check: () => unknown) => {
    for (let i = 0; i < 40; i++) {
      if (check()) return;
      await new Promise((r) => setTimeout(r, 25));
    }
    assert.ok(check());
  };
  try {
    w.eval(compiled.outputFiles[0].text);
    await wait(() => d.querySelectorAll("tbody tr").length === 2);
    const search=d.querySelector<HTMLInputElement>('input[aria-label="Search sauna cost recovery"]')!;
    const searchFor=async(value:string)=>{
      Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value')!.set!.call(search,value);
      search.dispatchEvent(new w.Event('input',{bubbles:true}));
      await new Promise(r=>setTimeout(r,50));
    };
    await searchFor('  EARLIER  ');
    assert.equal(d.querySelectorAll('tbody tr').length,1);
    assert.equal(d.querySelector('tbody tr td')?.textContent,'#001');
    await searchFor('not a customer');assert.equal(d.querySelectorAll('tbody tr').length,0);
    await searchFor('');await wait(()=>d.querySelectorAll('tbody tr').length===2);
    assert.equal(d.querySelectorAll("thead th button").length, 9);
    const header = [...d.querySelectorAll("th")].find((h) =>
      h.textContent?.startsWith("Rental cash"),
    )!;
    header.querySelector("button")!.click();
    await wait(() => d.querySelector("tbody tr td")?.textContent === "#002");
    assert.equal(header.getAttribute("aria-sort"), "ascending");
    header.querySelector("button")!.click();
    await wait(() => d.querySelector("tbody tr td")?.textContent === "#001");
    assert.equal(header.getAttribute("aria-sort"), "descending");
    assert.equal(d.querySelector("[role=dialog]"), null);
    d.querySelector<HTMLButtonElement>(
      'button[aria-label="View 2 source entries for sauna #001"]',
    )!.click();
    await wait(() => d.querySelector("[role=dialog]"));
    const dialog = d.querySelector("[role=dialog]")!;
    const entries = dialog.querySelectorAll("li");
    assert.equal(entries.length, 2);
    assert.match(entries[0].textContent!, /2026-11-13.*Paid by: Latest Payer/);
    assert.match(entries[1].textContent!, /Earlier Payer/);
    assert.equal(dialog.querySelectorAll('a[target="_blank"]').length, 2);
    [...dialog.querySelectorAll("button")]
      .find((b) => b.textContent === "Close")!
      .click();
    await wait(() => !d.querySelector("[role=dialog]"));
  } finally {
    await w.happyDOM.close();
  }
});
