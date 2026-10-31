import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { Window } from "happy-dom";
test("curriculum navigation persists independent checks and notes locally without any network", async () => {
  const compiled = await build({
    stdin: {
      contents:
        'import React from "react";import{createRoot}from"react-dom/client";import Academy from"./src/academy/Academy";createRoot(document.getElementById("root")).render(<Academy/>);',
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    format: "iife",
    jsx: "automatic",
    loader: { ".css": "empty" },
    define: {
      "import.meta.env": "{}",
      "import.meta.env.MODE": '"development"',
      "process.env.NODE_ENV": '"production"',
    },
  });
  const w = new Window({
    url: "http://127.0.0.1:5173/learn-certify",
    settings: { enableJavaScriptEvaluation: true },
  });
  w.structuredClone = structuredClone;
  w.scrollTo = () => {};
  let network = 0;
  w.fetch = async () => {
    network++;
    throw Error("No network");
  };
  const d = w.document;
  d.body.innerHTML = '<div id="root"></div>';
  const tick = () => new Promise((r) => setTimeout(r, 40));
  const click = async (text: string) => {
    const b = [...d.querySelectorAll("button")].find((b) =>
      b.textContent?.includes(text),
    );
    assert.ok(b, "missing " + text);
    b.click();
    await tick();
  };
  try {
    w.eval(compiled.outputFiles[0].text);
    await tick();
    await tick();
    assert.match(d.body.textContent!, /267/);
    await click("How US Electrical Product Regulation Works");
    assert.equal(d.querySelectorAll("input[type=checkbox]").length, 9);
    d.querySelector<HTMLInputElement>("input[type=checkbox]")!.click();
    await tick();
    let state = JSON.parse(
      w.localStorage.getItem("sf-curriculum-explorer-preview-v1")!,
    );
    assert.equal(
      Object.values(state.entries[0].value.questions).filter(Boolean).length,
      1,
    );
    assert.equal(Object.keys(state.entries[0].value.readings).length, 0);
    await click("Mark all readings complete");
    state = JSON.parse(
      w.localStorage.getItem("sf-curriculum-explorer-preview-v1")!,
    );
    assert.equal(
      Object.values(state.entries[0].value.readings).filter(Boolean).length,
      3,
    );
    assert.equal(
      Object.values(state.entries[0].value.questions).filter(Boolean).length,
      1,
    );
    const input = d.querySelector("textarea")!;
    Object.getOwnPropertyDescriptor(
      w.HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(input, "My evidence and open questions");
    input.dispatchEvent(new w.Event("input", { bubbles: true }));
    await tick();
    await click("Save notes");
    await click("All sections");
    await click("How US Electrical Product Regulation Works");
    assert.equal(
      d.querySelector("textarea")!.value,
      "My evidence and open questions",
    );
    await click("Settings & backup");
    assert.match(d.body.textContent!, /Change access password/);
    assert.equal(network, 0);
  } finally {
    await w.happyDOM.close();
  }
});
