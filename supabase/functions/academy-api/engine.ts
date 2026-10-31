import { byTopic, type Topic } from "./curriculum.ts";
export type Value = {
  readings: Record<string, boolean>;
  questions: Record<string, boolean>;
  notes: string;
};
export type Entry = {
  id: string;
  kind: "note";
  value: Value;
  version: number;
  updatedAt: string;
};
export type Snapshot = { entries: Entry[] };
export const emptyValue = (): Value => ({
  readings: {},
  questions: {},
  notes: "",
});
export const entryId = (topic: string) => "explorer:" + topic;
export function valueFor(entries: Entry[], topic: string): Value {
  return entries.find((e) => e.id === entryId(topic))?.value || emptyValue();
}
export function counts(topics: Topic[], entries: Entry[]) {
  return topics.reduce(
    (out, t) => {
      const v = valueFor(entries, t.id);
      out.readings += t.readings.filter((r) => v.readings[r.id]).length;
      out.readingTotal += t.readings.length;
      out.questions += t.questions.filter(
        (_, i) => v.questions[t.id + ":q" + (i + 1)],
      ).length;
      out.questionTotal += t.questions.length;
      return out;
    },
    { readings: 0, readingTotal: 0, questions: 0, questionTotal: 0 },
  );
}
export function validateValue(topicId: string, input: unknown): Value {
  const t = byTopic[topicId];
  if (!t || !input || typeof input !== "object")
    throw Error("Unknown topic or invalid progress.");
  const v = input as Value;
  if (
    typeof v.notes !== "string" ||
    v.notes.length > 30000 ||
    !v.questions ||
    !v.readings ||
    Array.isArray(v.readings) ||
    Array.isArray(v.questions)
  )
    throw Error("Invalid notes or checklist.");
  const check = (data: Record<string, boolean>, allowed: string[]) => {
    if (typeof data !== "object") throw Error("Invalid checklist.");
    for (const [key, value] of Object.entries(data))
      if (!allowed.includes(key) || typeof value !== "boolean")
        throw Error("Unknown checklist item.");
  };
  check(
    v.readings,
    t.readings.map((r) => r.id),
  );
  check(
    v.questions,
    t.questions.map((_, i) => t.id + ":q" + (i + 1)),
  );
  return structuredClone(v);
}
export function parseBackup(text: string): { topic: string; value: Value }[] {
  if (text.length > 3000000) throw Error("Backup too large.");
  const data = JSON.parse(text);
  if (
    data.format !== "sf-curriculum-explorer" ||
    data.version !== 1 ||
    !Array.isArray(data.topics)
  )
    throw Error("Choose a Curriculum Explorer backup (version 1).");
  const seen = new Set();
  return data.topics.map((row: { topic: string; value: unknown }) => {
    if (seen.has(row.topic)) throw Error("Duplicate topic in backup.");
    seen.add(row.topic);
    return { topic: row.topic, value: validateValue(row.topic, row.value) };
  });
}
