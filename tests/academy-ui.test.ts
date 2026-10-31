import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { Window } from "happy-dom";
test("academy renders every view, saves practice locally without contacting a backend", async () => {
  const compiled = await build({
    stdin: {
      contents:
        'import React from "react";import{createRoot}from"react-dom/client";import{BrowserRouter}from"react-router-dom";import Academy from"./src/academy/Academy";createRoot(document.getElementById("root")).render(<BrowserRouter><Academy/></BrowserRouter>);',
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
      "import.meta.env.VITE_SUPABASE_URL": '"https://preview.invalid"',
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": '"preview"',
      "import.meta.env.VITE_GHL_INBOUND_WEBHOOK_URL": '""',
      "process.env.NODE_ENV": '"production"',
    },
  });
  const window = new Window({
    url: "http://127.0.0.1:5173/learn-certify",
    settings: { enableJavaScriptEvaluation: true },
  });
  const doc = window.document;
  window.structuredClone = structuredClone;
  let network = 0;
  window.fetch = async () => {
    network++;
    throw Error("No network in test");
  };
  doc.body.innerHTML = '<div id="root"></div>';
  const tick = () => new Promise((r) => setTimeout(r, 30));
  const click = async (text: string) => {
    const b = Array.from(doc.querySelectorAll("button")).find((b) =>
      b.textContent?.includes(text),
    );
    assert.ok(b, "Missing button: " + text);
    b.click();
    await tick();
  };
  try {
    window.eval(compiled.outputFiles[0].text);
    await tick();
    assert.match(doc.body.textContent!, /From good ideas/);
    for (const [button, text] of [
      ["Learning path", "The US safety system"],
      ["Review", "No reviews due yet"],
      ["Your tutor", "technical tutor"],
      ["Case studies", "HUUM"],
      ["Calculators", "Heater & branch comparison"],
      ["Sources", "source library"],
      ["Product notebook", "product notebook"],
      ["Settings & backup", "Export & restore"],
    ]) {
      await click(button);
      assert.match(doc.body.textContent!, new RegExp(text));
    }
    await click("Today");
    await click("Start diagnostic");
    const field = doc.querySelector("textarea")!;
    field.value = "16.67";
    field.dispatchEvent(new window.Event("input", { bubbles: true }));
    field.dispatchEvent(new window.Event("change", { bubbles: true }));
    await tick();
    // Use React's native setter to exercise its controlled input path.
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )!.set!;
    setter.call(field, "16.68");
    field.dispatchEvent(new window.Event("input", { bubbles: true }));
    await tick();
    doc
      .querySelector("form")!
      .dispatchEvent(
        new window.Event("submit", { bubbles: true, cancelable: true }),
      );
    await tick();
    assert.match(doc.body.textContent!, /Correct evidence/);
    const saved = JSON.parse(
      window.localStorage.getItem("sf-academy-preview-v1")!,
    );
    assert.equal(saved.attempts.length, 1);
    assert.equal(saved.attempts[0].correct, true);
    assert.equal(network, 0);
  } finally {
    await window.happyDOM.close();
  }
});
