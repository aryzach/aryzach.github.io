import { test } from "node:test";
import assert from "node:assert/strict";
import {
  modules,
  questions,
  questionById,
  CONTENT_VERSION,
} from "../src/academy/curriculum.ts";
import {
  attempt,
  grade,
  mastery,
  heater,
  battery,
  thermal,
  validateImport,
  type Attempt,
} from "../src/academy/engine.ts";
import { readFileSync } from "node:fs";
const evidence = (q: string, correct: boolean, time: string): Attempt => ({
  ...attempt(q, "Independent response", 4, new Date(time)),
  correct,
  method: "ai",
});
test("curriculum stable IDs, prerequisite graph and all required assessment formats", () => {
  assert.equal(modules.length, 15);
  assert.equal(new Set(questions.map((q) => q.id)).size, questions.length);
  assert.equal(modules.flatMap((m) => m.lessons).length, 30);
  assert.equal(new Set(questions.map((q) => q.type)).size, 8);
  for (const m of modules) {
    for (const p of m.prerequisites)
      assert.ok(modules.findIndex((x) => x.id === p) < modules.indexOf(m));
    assert.ok(m.lessons.every((l) => l.body.trim().length > 0));
    assert.ok(m.questions.length >= 3);
  }
});
test("numeric grading refuses empty, malformed and out-of-tolerance responses", () => {
  const q = questionById["diag-current"];
  assert.equal(grade(q, ""), false);
  assert.equal(grade(q, "16.67 A"), false);
  assert.equal(grade(q, "16.67"), true);
  assert.equal(grade(q, "20"), false);
});
test("reading and repeated MC guesses do not establish mastery", () => {
  assert.equal(mastery("branch", []).status, "unassessed");
  const a = evidence("branch-check", true, "2026-10-01T12:00:00Z");
  assert.equal(
    mastery("branch", [
      a,
      { ...a, id: "again", createdAt: "2026-10-02T12:00:00Z" },
    ]).status,
    "practicing",
  );
});
test("mastery requires distinct questions, application and delayed evidence", () => {
  const a = evidence("branch-check", true, "2026-10-01T12:00:00Z");
  const b = evidence("branch-transfer", true, "2026-10-01T13:00:00Z");
  assert.equal(
    mastery("branch", [a, b], new Date("2026-10-01T14:00:00Z")).status,
    "provisional",
  );
  const c = evidence("branch-retest", true, "2026-10-02T13:01:00Z");
  assert.equal(
    mastery("branch", [a, b, c], new Date("2026-10-02T14:00:00Z")).status,
    "mastered",
  );
  assert.equal(
    mastery("branch", [a, b, c], new Date("2026-10-10T14:00:00Z")).status,
    "needs_review",
  );
});
test("incorrect high-confidence answer requires independent remediation and later retrieval", () => {
  const a = evidence("branch-check", false, "2026-10-01T12:00:00Z");
  const b = evidence("branch-transfer", true, "2026-10-01T13:00:00Z");
  assert.equal(mastery("branch", [a, b]).unresolved, true);
  assert.equal(mastery("branch", [a, b]).highConfidenceErrors, 1);
  const c = evidence("branch-retest", true, "2026-10-02T13:01:00Z");
  assert.equal(
    mastery("branch", [a, b, c], new Date("2026-10-02T14:00:00Z")).unresolved,
    false,
  );
});
test("pending open response is not successful evidence", () => {
  const a = attempt("branch-transfer", "An ungraded explanation", 5);
  assert.equal(a.correct, null);
  assert.equal(mastery("branch", [a]).evidenceCount, 0);
});
test("calculators preserve units, losses and impossible equilibrium", () => {
  assert.ok(Math.abs(heater(120, 2200, 20).current - 18.3333) < 0.001);
  assert.ok(heater(120, 2000, 20, 1000).current > 20);
  assert.equal(battery(5, 8, 48, 0.8, 0.9, 1).minutes, 27);
  assert.equal(thermal(100, 1.5, 60, 8, 8).minutes, null);
  assert.throws(() => heater(0, 1000, 20));
  assert.throws(() => battery(5, 8, 48, 1.2, 0.9, 1));
});
test("untrusted import cannot grant AI mastery", () => {
  const a = evidence("branch-transfer", true, "2026-10-01T12:00:00Z");
  const s = validateImport({
    format: "sf-academy",
    version: 1,
    state: { entries: [], attempts: [a] },
  });
  assert.equal(s.attempts[0].correct, null);
  assert.throws(() => validateImport({ format: "other", version: 1 }));
});
test("Edge Function and browser share identical question bank and mastery policy", () => {
  for (const name of ["curriculum.ts", "engine.ts"])
    assert.equal(
      readFileSync(new URL("../src/academy/" + name, import.meta.url), "utf8"),
      readFileSync(
        new URL("../supabase/functions/academy-api/" + name, import.meta.url),
        "utf8",
      ),
    );
});
