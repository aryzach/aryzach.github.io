import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { build } from "esbuild";
import { Window } from "happy-dom";
import {
  scatterFixture,
  scatterTerm,
  scatterFutureFixture,
} from "./fixtures/rateCommitment.ts";

test("scatter filters, commitment toggle, type colors, status shapes and customer hover details", async () => {
  const s = scatterFixture();
  const future = scatterFutureFixture();
  s.customers.push(...future.customers);
  s.lifecycle!.rentals.push(...future.lifecycle!.rentals);
  s.lifecycle!.agreements.push(...future.lifecycle!.agreements);
  s.lifecycle!.terms.push(...future.lifecycle!.terms);
  s.customers.push({
    ...s.customers[0],
    id: "past",
    name: "Example Historical",
  });
  s.lifecycle!.rentals.push({
    ...s.lifecycle!.rentals[0],
    id: "past-r",
    customer_id: "past",
    lifecycle_state: "ended",
    actual_end: "2026-05-01",
  });
  s.lifecycle!.agreements.push({
    ...s.lifecycle!.agreements[0],
    id: "past-a",
    rental_id: "past-r",
  });
  s.lifecycle!.terms.push(
    scatterTerm({
      id: "past-t",
      rental_id: "past-r",
      agreement_id: "past-a",
      sauna_type: "Indoor Infrared",
      base_monthly_cents: 30000,
    }),
  );
  s.lifecycle!.agreements.push({
    ...s.lifecycle!.agreements[0],
    id: "renewal",
    signed_on: "2026-08-01",
  });
  s.lifecycle!.terms.push(
    scatterTerm({
      id: "renewal-t",
      agreement_id: "renewal",
      effective_from: "2026-08-01",
      base_monthly_cents: 40000,
      minimum_months: 6,
    }),
  );
  const compiled = await build({
    stdin: {
      contents: `import React from 'react';import{createRoot}from'react-dom/client';import{RateCommitmentDashboard}from'./src/components/admin/RateCommitmentDashboard';createRoot(document.getElementById('root')).render(<RateCommitmentDashboard state={${JSON.stringify(s)}}/>);`,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    format: "iife",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [
      {
        name: "fixed-chart-size",
        setup(b) {
          b.onLoad({ filter: /RateCommitmentDashboard\.tsx$/ }, (a) => ({
            loader: "tsx",
            contents:
              readFileSync(a.path, "utf8").replace(
                "ResponsiveContainer,",
                "ResponsiveContainer as UnusedResponsiveContainer,",
              ) +
              `\nfunction ResponsiveContainer({children}){return cloneElement(children,{width:850,height:440});}\nimport{cloneElement}from'react';`,
          }));
        },
      },
    ],
  });
  const w = new Window({
      url: "http://127.0.0.1:5174",
      settings: { enableJavaScriptEvaluation: true },
    }),
    d = w.document;
  d.body.innerHTML = '<div id="root"></div>';
  const tick = () => new Promise((r) => setTimeout(r, 100));
  const click = async (text: string) => {
    const el = [...d.querySelectorAll("button")].find(
      (b) => b.textContent === text,
    );
    assert.ok(el, text);
    el.click();
    await tick();
  };
  try {
    w.eval(compiled.outputFiles[0].text);
    await tick();
    assert.match(
      d.body.textContent!,
      /3 customers shown · 1 current · 1 historical · 1 future/,
    );
    assert.equal(d.querySelectorAll("path.recharts-symbols").length, 3);
    const symbols = [...d.querySelectorAll("path.recharts-symbols")];
    assert.notEqual(symbols[0].getAttribute("d"), symbols[1].getAttribute("d"));
    assert.notEqual(
      symbols[0].getAttribute("fill"),
      symbols[1].getAttribute("fill"),
    );
    assert.match(
      d.querySelector("tbody")!.textContent!,
      /Example Current.*\$400\/mo.*\$2,520/,
    );
    await click("All agreements combined");
    assert.match(
      d.querySelector("tbody")!.textContent!,
      /Example Current.*\$400\/mo.*\$8,760/,
    );
    const point = d.querySelector("path.recharts-symbols")!;
    point.dispatchEvent(
      new w.MouseEvent("mouseover", {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      }),
    );
    await tick();
    assert.match(
      d.querySelector(".recharts-tooltip-wrapper")!.textContent!,
      /Example Historical|Example Current/,
    );
    await click("▲ Future · signed");
    assert.match(
      d.body.textContent!,
      /1 customers shown · 0 current · 0 historical · 1 future/,
    );
    const futurePoint = d.querySelector("path.recharts-symbols")!;
    assert.ok(futurePoint.getAttribute("d")!.includes("L"));
    futurePoint.dispatchEvent(
      new w.MouseEvent("mouseover", {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      }),
    );
    await tick();
    assert.match(
      d.querySelector(".recharts-tooltip-wrapper")!.textContent!,
      /Example Future/,
    );
    await click("◆ Historical");
    assert.match(
      d.body.textContent!,
      /1 customers shown · 0 current · 1 historical/,
    );
    assert.doesNotMatch(
      d.querySelector("tbody")!.textContent!,
      /Example Current/,
    );
    await click("Reset filters");
    const type = [...d.querySelectorAll("label")].find((l) =>
      l.textContent?.includes("Outdoor Traditional"),
    )!;
    type.querySelector<HTMLInputElement>("input")!.click();
    await tick();
    assert.match(
      d.body.textContent!,
      /1 customers shown · 0 current · 1 historical/,
    );
    const remaining = [...d.querySelectorAll("label")].find((l) =>
      l.textContent?.includes("Indoor Infrared"),
    )!;
    remaining.querySelector<HTMLInputElement>("input")!.click();
    await tick();
    assert.match(d.body.textContent!, /No customers with known rates/);
    await click("Reset filters");
    assert.match(d.body.textContent!, /3 customers shown/);
  } finally {
    await w.happyDOM.close();
  }
});
