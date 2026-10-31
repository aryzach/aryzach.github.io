import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sections, topics, matches } from "../src/academy/curriculum.ts";
import {
  counts,
  emptyValue,
  entryId,
  parseBackup,
  validateValue,
  type Entry,
} from "../src/academy/engine.ts";
test("all complete supplied questions survive verbatim and partial topics stay explicit", () => {
  const dir = new URL("../docs/curriculum-source/", import.meta.url);
  const first = readFileSync(new URL("01-foundations.md", dir), "utf8").split(
    "## SECTION I:",
  )[1];
  const second = readFileSync(
    new URL("02-modules-12-20.md", dir),
    "utf8",
  ).split("## Module 17:")[0];
  const third = readFileSync(new URL("03-modules-17-20.md", dir), "utf8");
  const expected = [
    ...(first + "\n" + second + "\n" + third).matchAll(/^- \[ \] (.+)$/gm),
  ].map((m) => m[1]);
  assert.deepEqual(
    topics.flatMap((t) => t.questions),
    expected,
  );
  assert.equal(sections.length, 11);
  assert.equal(topics.length, 47);
  assert.equal(expected.length, 267);
  assert.deepEqual(
    topics.filter((t) => t.incomplete).map((t) => t.id),
    ["2.6", "20.2"],
  );
  for (const t of topics)
    for (const r of t.readings) {
      assert.match(r.url, /^https:\/\//);
      assert.ok(r.summary && r.scope && r.relevance);
      if (r.url.includes("shopulstandards")) assert.ok(r.access);
    }
  assert.equal(topics.flatMap((t) => t.readings).length, 114);
});
test("reading completion does not imply understanding; backups validate before writes", () => {
  const t = topics[0],
    v = emptyValue();
  v.readings[t.readings[0].id] = true;
  v.notes = "Personal evidence";
  const entries: Entry[] = [
    { id: entryId(t.id), kind: "note", value: v, version: 1, updatedAt: "" },
  ];
  assert.equal(counts([t], entries).readings, 1);
  assert.equal(counts([t], entries).questions, 0);
  const backup = JSON.stringify({
    format: "sf-curriculum-explorer",
    version: 1,
    topics: [{ topic: t.id, value: v }],
  });
  assert.deepEqual(parseBackup(backup), [{ topic: t.id, value: v }]);
  assert.throws(() => validateValue(t.id, { ...v, questions: { fake: true } }));
  assert.throws(() =>
    parseBackup(backup.replace("Personal evidence", "x".repeat(30001))),
  );
  assert.throws(() =>
    parseBackup(
      JSON.stringify({
        format: "sf-curriculum-explorer",
        version: 1,
        topics: [
          { topic: t.id, value: v },
          { topic: t.id, value: v },
        ],
      }),
    ),
  );
  assert.ok(matches(t, "recognition requirements"));
  assert.ok(matches(t, "REGULATORY", sections[0]));
});
