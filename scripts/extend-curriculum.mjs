import { readFileSync } from "node:fs";
// Append-only IDs keep existing saved checkboxes attached to the same content.
export function extendCurriculum(data, guidance) {
  const text = readFileSync(
    new URL(
      "../docs/curriculum-source/04-module-20-extension.md",
      import.meta.url,
    ),
    "utf8",
  );
  let section,
    topic,
    reading,
    mode = "";
  const clean = (s) => s.replace(/\*\*/g, "").trim();
  const key = (r) =>
    r.url + "|" + (r.title.match(/(?:UL|IEC)\s+\d+(?:-\d+)*/)?.[0] || "");
  const incoming = [];
  for (const raw of text.split("\n")) {
    const line = clean(raw.replace(/^#+\s*/, ""));
    let m = line.match(/^Module (\d+): (.+)$/);
    if (m) {
      section = data.find((s) => s.id === m[1]);
      if (!section) {
        section = {
          id: m[1],
          title: m[2],
          objective: "",
          capstone: "",
          topics: [],
        };
        data.push(section);
      }
      topic = null;
      reading = null;
      mode = "";
      continue;
    }
    if (!section) continue;
    if (line.startsWith("Objective:")) {
      section.objective = line.slice(10).trim();
      continue;
    }
    m = line.match(/^Topic (\d+\.\d+): (.+)$/);
    if (m) {
      topic = section.topics.find((t) => t.id === m[1]);
      if (!topic) {
        topic = {
          id: m[1],
          title: m[2],
          why: guidance[m[1]]?.[0] || section.objective,
          objectives: guidance[m[1]]?.slice(1) || [],
          questions: [],
          readings: [],
          context: [],
          incomplete: false,
        };
        section.topics.push(topic);
      }
      topic.incomplete = false;
      mode = "context";
      reading = null;
      continue;
    }
    if (!topic) continue;
    if (/^Readings$/.test(line)) {
      mode = "readings";
      reading = null;
      continue;
    }
    if (
      /^Mastery questions$/.test(line) ||
      /^Complete the following checklist:/.test(line)
    ) {
      mode = "questions";
      reading = null;
      continue;
    }
    if (/^Applied (exercise|case)$/.test(line)) {
      mode = "exercise";
      reading = null;
      topic.exercise = "";
      continue;
    }
    // The supplied paste ends at an unfinished heading; do not invent another topic.
    if (/^Topic\s*$/.test(line)) continue;
    if (mode === "exercise") {
      if (line !== "---")
        topic.exercise += (topic.exercise ? "\n" : "") + raw.trimEnd();
      continue;
    }
    if (line.startsWith("- [ ] ")) {
      const q = line.slice(6);
      if (!topic.questions.includes(q)) topic.questions.push(q);
      continue;
    }
    if (mode === "readings") {
      m = line.match(/^\d+\. \[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
      if (m) {
        reading = { title: m[1], url: m[2], summary: "", topic };
        incoming.push(reading);
        continue;
      }
      if (reading && line && line !== "---")
        reading.summary +=
          (reading.summary ? " " : "") + line.replace(/^Summary:\s*/, "");
    } else if (mode === "context" && line && line !== "---")
      topic.context.push(line);
    else if (mode === "questions" && line && line !== "---")
      topic.closingNote =
        (topic.closingNote ? topic.closingNote + "\n" : "") + line;
  }
  for (const r of incoming) {
    const t = r.topic;
    const existing = t.readings.find((old) => key(old) === key(r));
    if (existing) {
      existing.extensionSummary = r.summary;
      continue;
    }
    let url = r.url;
    if (
      url ===
      "https://www.nasa.gov/reference/nasa-systems-engineering-handbook/"
    )
      url = "https://www.nasa.gov/reference/1-0-introduction/";
    if (r.title.includes("UL 60730-1"))
      url =
        "https://www.shopulstandards.com/ProductDetail.aspx?productId=UL60730-1_6_S_20241031";
    const access =
      /shopulstandards|webstore\.iec|nfpa\.org\/codes-and-standards/.test(url);
    const scope = r.summary.split(/(?<=[.!?])\s+/)[0];
    t.readings.push({
      id: t.id + ":r" + (t.readings.length + 1),
      title: r.title,
      url,
      scope,
      summary:
        r.summary.split(/(?<=[.!?])\s+/).length < 2
          ? r.summary + " " + t.why
          : r.summary,
      relevance: t.why,
      access,
      accessNote: access
        ? "Catalog/access link: public scope and publication information may be available. Full requirements and clauses require authorized standards access; confirm the applicable edition."
        : "",
    });
  }
  return data;
}
