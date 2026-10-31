import {
  CONTENT_VERSION,
  modules,
  questionById,
  type Question,
} from "./curriculum.ts";
export type Evaluation = {
  score: number;
  feedback: string;
  criteria: { criterion: string; met: boolean; evidence: string }[];
  sources: string[];
  model?: string;
  usage?: unknown;
};
export type Attempt = {
  id: string;
  questionId: string;
  response: string;
  confidence: number;
  createdAt: string;
  contentVersion: string;
  correct: boolean | null;
  evaluation?: Evaluation;
  feedback: string;
  method: "deterministic" | "ai" | "pending";
};
export type Entry = {
  id: string;
  kind:
    | "lesson"
    | "note"
    | "decision"
    | "question"
    | "milestone"
    | "external"
    | "settings"
    | "conversation";
  value: Record<string, unknown>;
  version: number;
  updatedAt: string;
};
export type Snapshot = { attempts: Attempt[]; entries: Entry[] };
export const blank: Snapshot = { attempts: [], entries: [] };
export function grade(q: Question, response: string): boolean | null {
  if (q.type === "multiple_choice") return response === q.answer;
  if (q.type === "numeric") {
    const n = Number(response.trim());
    return (
      response.trim() !== "" &&
      Number.isFinite(n) &&
      Math.abs(n - q.numeric!) <= q.tolerance!
    );
  }
  return null;
}
export function attempt(
  questionId: string,
  response: string,
  confidence: number,
  now = new Date(),
): Attempt {
  const q = questionById[questionId];
  if (!q || !response.trim() || response.length > 8000)
    throw Error(
      "Choose a question and enter an answer (up to 8,000 characters).",
    );
  const correct = grade(q, response);
  return {
    id: crypto.randomUUID(),
    questionId,
    response,
    confidence: Math.max(1, Math.min(5, confidence)),
    createdAt: now.toISOString(),
    contentVersion: CONTENT_VERSION,
    correct,
    method: correct === null ? "pending" : "deterministic",
    feedback:
      correct === null
        ? "Saved for rubric evaluation. This answer has not earned mastery evidence."
        : q.explanation,
  };
}
export function mastery(
  concept: string,
  attempts: Attempt[],
  now = new Date(),
) {
  const rows = attempts
    .filter((a) => questionById[a.questionId]?.concept === concept)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const graded = rows.filter((a) => a.correct !== null);
  const last = graded.at(-1);
  const failed = graded.filter((a) => a.correct === false);
  const lastWrong = failed.at(-1);
  const successes = graded.filter(
    (a) =>
      a.correct === true && (!lastWrong || a.createdAt > lastWrong.createdAt),
  );
  const distinct = new Set(successes.map((a) => a.questionId)).size;
  const transfer = successes.some((a) => questionById[a.questionId]?.transfer);
  const delayed = successes.some(
    (a) =>
      new Date(a.createdAt).getTime() -
        new Date(successes[0].createdAt).getTime() >=
      86400000,
  );
  // One successful review per UTC day prevents rapid repeats from inflating review intervals.
  const days = [...new Set(successes.map((a) => a.createdAt.slice(0, 10)))];
  const intervals = [1, 3, 7, 14, 30];
  const interval = intervals[Math.min(Math.max(days.length - 1, 0), 4)];
  const dueAt = last
    ? last.correct
      ? new Date(
          new Date(last.createdAt).getTime() + interval * 86400000,
        ).toISOString()
      : last.createdAt
    : null;
  const due = !!dueAt && new Date(dueAt) <= now;
  const unresolved = !!lastWrong && !(distinct >= 2 && transfer && delayed);
  const status = !last
    ? "unassessed"
    : last.correct === false
      ? "needs_review"
      : distinct >= 2 && transfer && delayed
        ? "mastered"
        : distinct >= 2 && transfer
          ? "provisional"
          : "practicing";
  return {
    status: status === "mastered" && due ? "needs_review" : status,
    score:
      status === "mastered"
        ? 100
        : distinct >= 2 && transfer
          ? 70
          : successes.length
            ? 35
            : 0,
    evidenceCount: graded.length,
    distinct,
    transfer,
    delayed,
    dueAt,
    due,
    interval,
    unresolved,
    highConfidenceErrors: failed.filter((a) => a.confidence >= 4).length,
  };
}
export function recommend(state: Snapshot, now = new Date()) {
  const due = modules.find((m) => mastery(m.id, state.attempts, now).due);
  if (due) return { module: due, reason: "A review is due" };
  const next =
    modules.find(
      (m) =>
        !["mastered", "provisional"].includes(
          mastery(m.id, state.attempts, now).status,
        ) &&
        m.prerequisites.every(
          (p) => mastery(p, state.attempts, now).evidenceCount > 0,
        ),
    ) || modules[0];
  return { module: next, reason: "Build the next safety skill" };
}
export function validateImport(input: unknown): Snapshot {
  if (!input || typeof input !== "object")
    throw Error("Invalid academy export.");
  const x = input as { format?: string; version?: number; state?: Snapshot };
  if (
    x.format !== "sf-academy" ||
    x.version !== 1 ||
    !x.state ||
    !Array.isArray(x.state.entries) ||
    !Array.isArray(x.state.attempts)
  )
    throw Error("Expected a version 1 SF Academy export.");
  if (x.state.entries.length > 10000 || x.state.attempts.length > 50000)
    throw Error("Export is too large.");
  for (const a of x.state.attempts)
    if (
      !a.id ||
      !questionById[a.questionId] ||
      typeof a.response !== "string" ||
      !Number.isFinite(Date.parse(a.createdAt))
    )
      throw Error("Invalid assessment record.");
  for (const e of x.state.entries)
    if (
      !/^[a-zA-Z0-9:._-]{1,150}$/.test(e.id) ||
      ![
        "lesson",
        "note",
        "decision",
        "question",
        "milestone",
        "external",
        "settings",
        "conversation",
      ].includes(e.kind) ||
      !e.value ||
      typeof e.value !== "object"
    )
      throw Error("Invalid notebook record.");
  // Imported grading is untrusted; server regrades deterministic items, AI results need independent retesting.
  return {
    entries: x.state.entries,
    attempts: x.state.attempts.map((a) => ({
      ...a,
      correct: grade(questionById[a.questionId], a.response),
      method:
        grade(questionById[a.questionId], a.response) === null
          ? "pending"
          : "deterministic",
      evaluation: undefined,
    })),
  };
}
export function heater(
  volts: number,
  watts: number,
  branch: number,
  otherWatts = 0,
) {
  if (
    [volts, watts, branch].some((v) => !Number.isFinite(v) || v <= 0) ||
    otherWatts < 0 ||
    !Number.isFinite(otherWatts)
  )
    throw Error(
      "Use positive voltage, power and branch rating; other load cannot be negative.",
    );
  const current = (watts + otherWatts) / volts;
  return {
    current,
    resistance: (volts * volts) / watts,
    continuousComparison: current * 1.25,
    branchPercent: (current / branch) * 100,
  };
}
export function battery(
  kwh: number,
  kw: number,
  volts: number,
  usable: number,
  efficiency: number,
  chargeKw: number,
) {
  if (
    [kwh, kw, volts, chargeKw].some((v) => !Number.isFinite(v) || v <= 0) ||
    usable <= 0 ||
    usable > 1 ||
    efficiency <= 0 ||
    efficiency > 1
  )
    throw Error(
      "Use positive ratings and usable fraction/efficiency between 0 and 1.",
    );
  return {
    minutes: ((kwh * usable * efficiency) / kw) * 60,
    current: (kw * 1000) / volts,
    cRate: kw / kwh,
    chargeHours: (kwh * usable) / (chargeKw * efficiency),
  };
}
export function thermal(
  massKg: number,
  specificHeat: number,
  riseC: number,
  lossKw: number,
  inputKw: number,
) {
  if (
    [massKg, specificHeat, riseC, inputKw].some(
      (v) => !Number.isFinite(v) || v <= 0,
    ) ||
    !Number.isFinite(lossKw) ||
    lossKw < 0
  )
    throw Error(
      "Enter positive mass, heat capacity, temperature rise and input. Loss cannot be negative.",
    );
  const energyKwh = (massKg * specificHeat * riseC) / 3600;
  return {
    energyKwh,
    minutes: inputKw > lossKw ? (energyKwh / (inputKw - lossKw)) * 60 : null,
  };
}
