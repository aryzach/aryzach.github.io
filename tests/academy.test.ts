import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
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
  const actual = topics.flatMap((t) => t.questions);
  for (const question of expected)
    assert.ok(actual.includes(question), question);
  const extension = readFileSync(
    new URL("04-module-20-extension.md", dir),
    "utf8",
  );
  for (const [, question] of extension.matchAll(/^- \[ \] (.+)$/gm))
    assert.ok(actual.includes(question), question);
  assert.equal(sections.length, 15);
  assert.equal(topics.length, 71);
  assert.equal(expected.length, 267);
  assert.deepEqual(
    topics.filter((t) => t.incomplete).map((t) => t.id),
    ["2.6"],
  );
  for (const t of topics)
    for (const r of t.readings) {
      assert.match(r.url, /^https:\/\//);
      assert.ok(r.summary && r.scope && r.relevance);
      if (r.url.includes("shopulstandards")) assert.ok(r.access);
    }
  assert.equal(topics.flatMap((t) => t.readings).length, 182);
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

test("extension preserves all Modules 1–19 and every previous progress identity", () => {
  const baseline = JSON.parse(
    readFileSync(
      new URL("./fixtures/curriculum-extension-baseline.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(
    createHash("sha256")
      .update(JSON.stringify(sections.filter((s) => Number(s.id) < 20)))
      .digest("hex"),
    baseline.modules1To19Hash,
  );
  const current = sections.find((s) => s.id === "20")!;
  for (const before of baseline.module20.topics) {
    const after = current.topics.find((t) => t.id === before.id)!;
    assert.deepEqual(
      after.questions.slice(0, before.questions.length),
      before.questions,
    );
    for (const r of before.readings) {
      const kept = after.readings.find((x) => x.id === r.id)!;
      for (const [key, value] of Object.entries(r))
        assert.deepEqual(kept[key], value);
    }
    const v = emptyValue();
    for (let i = 0; i < before.questions.length; i++)
      v.questions[before.id + ":q" + (i + 1)] = true;
    for (const r of before.readings) v.readings[r.id] = true;
    assert.deepEqual(validateValue(before.id, v), v);
  }
  assert.equal(topics.flatMap((t) => t.questions).length, 484);
  assert.equal(topics.filter((t) => t.exercise).length, 13);
  const emc = topics.find((t) => t.id === "22.4")!;
  assert.equal(emc.readings.length, 2);
  assert.notEqual(emc.readings[0].title, emc.readings[1].title);
  assert.equal(topics.find((t) => t.id === "20.4")!.questions.length, 17);
  for (const t of topics.filter((t) => t.exercise))
    assert.ok(matches(t, t.exercise!.split("\n")[0]));
});

test("final continuation preserves every old topic and all supplied new assignments", () => {
  const baseline = JSON.parse(
    readFileSync(
      new URL(
        "./fixtures/curriculum-through-23-1-baseline.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assert.equal(
    createHash("sha256")
      .update(
        JSON.stringify(topics.filter((t) => baseline.topicIds.includes(t.id))),
      )
      .digest("hex"),
    baseline.topicHash,
  );
  for (const name of ["05-modules-23-24.md", "06-topic-24-7-capstone.md"]) {
    let source = readFileSync(
      new URL("../docs/curriculum-source/" + name, import.meta.url),
      "utf8",
    );
    if (name.startsWith("05")) source = source.split("## Topic 24.7:")[0];
    for (const [, q] of source.matchAll(/^- \[ \] (.+)$/gm))
      assert.ok(
        topics.some((t) => t.questions.includes(q)),
        q,
      );
  }
  const final = topics.find((t) => t.id === "24.7")!;
  assert.equal(final.questions.length, 28);
  assert.equal(final.readings.length, 5);
  for (let i = 1; i <= 3; i++)
    assert.ok(final.exercise?.includes("Applied exercise " + i + ":"));
  assert.ok(!final.exercise?.includes("Final mastery questions"));
  assert.ok(
    sections
      .find((s) => s.id === "23")!
      .capstone.includes("Corrective-action procedures."),
  );
  assert.ok(
    sections
      .find((s) => s.id === "24")!
      .capstone.includes("10. **Recommended next actions:**"),
  );
  assert.ok(
    !JSON.stringify(sections).includes(
      "Final Implementation Instruction to Codex",
    ),
  );
  assert.ok(
    topics
      .find((t) => t.id === "23.3")!
      .readings.find((r) => r.title.startsWith("Omron"))!.searchDestination,
  );
  const value = emptyValue();
  value.questions["24.7:q28"] = true;
  value.readings["24.7:r5"] = true;
  assert.deepEqual(validateValue("24.7", value), value);
});
