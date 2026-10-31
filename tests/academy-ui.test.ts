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
  const tick = () => new Promise((r) => setTimeout(r, 100));
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
    assert.match(d.body.textContent!, /1129/);
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
    await click("← Curriculum");
    await click("All sections");
    await click("Final engineering and certification deliverables");
    assert.equal(d.querySelectorAll("input[type=checkbox]").length, 17);
    d.querySelector<HTMLInputElement>("input[type=checkbox]")!.click();
    await tick();
    const capstone = JSON.parse(
      w.localStorage.getItem("sf-curriculum-explorer-preview-v1")!,
    ).entries.find((e: { id: string }) => e.id === "explorer:20.4");
    assert.equal(capstone.value.questions["20.4:q1"], true);
    await click("All sections");
    await click("Control-system verification and validation");
    assert.match(
      d.body.textContent!,
      /communication fault causes the supervisory controller/,
    );
    assert.match(d.body.textContent!, /self-assessment/);
    await click("All sections");
    const navigation = d.querySelector<HTMLSelectElement>(
      'select[aria-label="Go to module"]',
    )!;
    assert.equal(navigation.options.length, 25);
    assert.match(
      navigation.options[7].textContent!,
      /Module 7.*Component Standards/,
    );
    navigation.value = "7";
    navigation.dispatchEvent(new w.Event("change", { bubbles: true }));
    await tick();
    assert.match(d.body.textContent!, /Component Standards and Certification/);
    assert.ok(!d.body.textContent!.includes("No matching topics"));
    await click("All sections");
    assert.match(
      d.body.textContent!,
      /Certification Feasibility and Development Strategy Report/,
    );
    await click("Certification Economics and Product Development Strategy");
    assert.equal(d.querySelectorAll("input[type=checkbox]").length, 33);
    for (let i = 1; i <= 3; i++)
      assert.match(
        d.body.textContent!,
        new RegExp("Applied exercise " + i + ":"),
      );
    assert.match(d.body.textContent!, /Stage 7: Commercial deployment/);
    const checks = d.querySelectorAll<HTMLInputElement>("input[type=checkbox]");
    checks[27].click();
    await tick();
    const final = JSON.parse(
      w.localStorage.getItem("sf-curriculum-explorer-preview-v1")!,
    ).entries.find((e: { id: string }) => e.id === "explorer:24.7");
    assert.equal(final.value.questions["24.7:q28"], true);
    await click("All sections");
    await click(
      "Residential Circuit Loading, Plug Configurations, and Installation Constraints",
    );
    assert.equal(d.querySelectorAll("input[type=checkbox]").length, 20);
    assert.match(
      d.body.textContent!,
      /Prepare an electrical feasibility matrix/,
    );
    assert.ok(!d.body.textContent!.includes("supplied text ends early"));
    await click("All sections");
    await click("Fault-Tree Analysis");
    assert.match(d.body.textContent!, /Sauna heater continues generating heat/);
    d.querySelector<HTMLInputElement>("input[type=checkbox]")!.click();
    await tick();
    const faultTree = JSON.parse(
      w.localStorage.getItem("sf-curriculum-explorer-preview-v1")!,
    ).entries.find((e: { id: string }) => e.id === "explorer:5.3");
    assert.equal(faultTree.value.questions["5.3:q1"], true);
    await click("All sections");
    await click("Heater-Only Versus Complete Sauna Certification");
    assert.ok(!d.body.textContent!.includes("supplied text ends early"));
    assert.equal(d.querySelectorAll("input[type=checkbox]").length, 14);
    await click("All sections");
    await click("Capstone: Preliminary High-Current DC Engineering Assessment");
    assert.equal(d.querySelectorAll("input[type=checkbox]").length, 33);
    assert.match(d.body.textContent!, /Required deliverables/);
    assert.match(d.body.textContent!, /Final mastery questions/);
    assert.match(d.body.textContent!, /Recommended next steps/);
    const finalChecks = d.querySelectorAll<HTMLInputElement>(
      "input[type=checkbox]",
    );
    finalChecks[0].click();
    await tick();
    finalChecks[32].click();
    await tick();
    const notes = d.querySelector("textarea")!;
    Object.getOwnPropertyDescriptor(
      w.HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(notes, "My capstone calculations and uncertainty register");
    notes.dispatchEvent(new w.Event("input", { bubbles: true }));
    await tick();
    await click("Save notes");
    await click("All sections");
    await click("Capstone: Preliminary High-Current DC Engineering Assessment");
    assert.equal(
      d.querySelector("textarea")!.value,
      "My capstone calculations and uncertainty register",
    );
    const finalState = JSON.parse(
      w.localStorage.getItem("sf-curriculum-explorer-preview-v1")!,
    ).entries.find((e: { id: string }) => e.id === "explorer:11.11");
    assert.equal(finalState.value.questions["11.11:q1"], true);
    assert.equal(finalState.value.questions["11.11:q33"], true);
    assert.equal(Object.keys(finalState.value.questions).length, 2);
    assert.equal(network, 0);
  } finally {
    await w.happyDOM.close();
  }
});
