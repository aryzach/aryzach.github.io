import content from "./content.json" with { type: "json" };
export type Reading = {
  id: string;
  title: string;
  url: string;
  scope: string;
  summary: string;
  relevance: string;
  access: boolean;
  accessNote: string;
};
export type Topic = {
  id: string;
  title: string;
  why: string;
  questions: string[];
  readings: Reading[];
  context: string[];
  objectives: string[];
  incomplete: boolean;
};
export type Section = {
  id: string;
  title: string;
  objective: string;
  capstone: string;
  topics: Topic[];
};
export const sections = content as Section[];
export const topics = sections.flatMap((s) => s.topics);
export const byTopic = Object.fromEntries(topics.map((t) => [t.id, t]));
export function matches(topic: Topic, query: string, section?: Section) {
  return [
    section?.title,
    topic.title,
    topic.why,
    ...topic.questions,
    ...topic.readings.flatMap((r) => [
      r.title,
      r.scope,
      r.summary,
      r.relevance,
    ]),
  ]
    .join(" ")
    .toLocaleLowerCase()
    .includes(query.trim().toLocaleLowerCase());
}
