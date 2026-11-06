import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { Window } from "happy-dom";
import { installationFixture } from "./fixtures/installationSelection.ts";
test("confirm installation shows and submits the reserved sauna, while permitting an explicit different unit", async () => {
  const state = installationFixture();
  const compiled = await build({
    stdin: {
      contents: `import React from 'react';import{createRoot}from'react-dom/client';import RentalLifecycle from './src/components/admin/RentalLifecycle';const state=${JSON.stringify(state)};window.commands=[];createRoot(document.getElementById('root')).render(<RentalLifecycle state={state} onCommand={async(op,payload)=>{window.commands.push({op,payload});}}/>);`,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    format: "iife",
    jsx: "automatic",
    loader: { ".css": "empty" },
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [
      {
        name: "dialog-test-surface",
        setup(b) {
          b.onResolve({ filter: /^@\/components\/ui\/dialog$/ }, () => ({
            path: "dialog",
            namespace: "test-dialog",
          }));
          b.onLoad({ filter: /.*/, namespace: "test-dialog" }, () => ({
            resolveDir: process.cwd(),
            loader: "tsx",
            contents: `export const Dialog=({open,children})=>open?<div role="dialog">{children}</div>:null;export const DialogContent=({children})=><div>{children}</div>;export const DialogHeader=({children})=><div>{children}</div>;export const DialogTitle=({children})=><h2>{children}</h2>;`,
          }));
        },
      },
    ],
  });
  const w = new Window({
    url: "http://127.0.0.1:5174/admin",
    settings: { enableJavaScriptEvaluation: true },
  });
  w.crypto.randomUUID = crypto.randomUUID.bind(crypto);
  const d = w.document;
  d.body.innerHTML = '<div id="root"></div>';
  const tick = () => new Promise((r) => setTimeout(r, 100));
  const click = async (text: string) => {
    const b = [...d.querySelectorAll("button")].find(
      (b) => b.textContent === text,
    );
    assert.ok(b, text);
    b.click();
    await tick();
  };
  try {
    w.eval(compiled.outputFiles[0].text);
    await tick();
    await click("Manage");
    const dialog = d.querySelector("[role=dialog]")!;
    assert.match(dialog.textContent!, /Reserved for this booking/);
    assert.match(dialog.textContent!, /#056.*Outdoor Traditional.*Incoming/);
    let select = dialog.querySelector<HTMLSelectElement>(
      "select[name=assetId]",
    )!;
    assert.equal(select.value, "unit-56");
    assert.deepEqual(
      [...select.options].slice(1).map((o) => o.value),
      ["unit-2", "unit-49", "unit-56"],
    );
    assert.equal(
      (w as any).commands.length,
      0,
      "opening the form does not install anything",
    );
    (dialog.querySelector("input[name=date]") as HTMLInputElement).value =
      "2026-11-05";
    (dialog.querySelector("input[name=evidence]") as HTMLInputElement).value =
      "Owner confirmed actual installation";
    dialog
      .querySelector("form")!
      .dispatchEvent(
        new w.Event("submit", { bubbles: true, cancelable: true }),
      );
    await tick();
    assert.equal((w as any).commands[0].op, "install");
    assert.equal((w as any).commands[0].payload.assetId, "unit-56");
    assert.equal((w as any).commands[0].payload.date, "2026-11-05");
    await click("Manage");
    select = d.querySelector("select[name=assetId]")!;
    select.value = "unit-2";
    select.dispatchEvent(new w.Event("change", { bubbles: true }));
    await tick();
    assert.match(d.body.textContent!, /instead of the reserved sauna/);
    d.querySelector("form")!.dispatchEvent(
      new w.Event("submit", { bubbles: true, cancelable: true }),
    );
    await tick();
    assert.equal((w as any).commands[1].payload.assetId, "unit-2");
  } finally {
    await w.happyDOM.close();
  }
});
