import { readFileSync } from "node:fs";
// Append-only IDs keep existing saved checkboxes attached to the same content.
export function extendCurriculum(data, guidance) {
  const sources = [
    "04-module-20-extension.md",
    "05-modules-23-24.md",
    "06-topic-24-7-capstone.md",
  ];
  const text = sources
    .map((file) => {
      const source = readFileSync(
        new URL("../docs/curriculum-source/" + file, import.meta.url),
        "utf8",
      );
      // The complete continuation replaces the truncated 24.7 paste.
      return file === "05-modules-23-24.md"
        ? source
            .slice(source.indexOf("# Module 23:"))
            .split("## Topic 24.7:")[0]
        : source;
    })
    .join("\n");
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
    if (/^Final Implementation Instruction to Codex/.test(line)) break;
    const capstone = line.match(
      /^Module (\d+)(?: Final)? [Cc]apstone(?:: (.+))?$/,
    );
    if (capstone) {
      section = data.find((s) => s.id === capstone[1]);
      topic = null;
      reading = null;
      mode = "capstone";
      section.capstone = capstone[2] ? "### " + capstone[2] + "\n" : "";
      continue;
    }
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
      if (topic) {
        topic.why = line.slice(10).trim();
        topic.objectives = [topic.why];
      } else if (!section.objective) section.objective = line.slice(10).trim();
      continue;
    }
    m = line.match(/^Topic (\d+\.\d+): (.+)$/);
    if (m) {
      topic = section.topics.find((t) => t.id === m[1]);
      if (!topic) {
        topic = {
          id: m[1],
          title: m[2],
          why: guidance[m[1]]?.[0] || "Study " + m[2].toLocaleLowerCase() + ".",
          objectives: guidance[m[1]]?.slice(1) || [
            "Explain " +
              m[2].toLocaleLowerCase() +
              " using the assigned evidence and mastery questions.",
          ],
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
    if (mode === "capstone") {
      if (line !== "---")
        section.capstone += (section.capstone ? "\n" : "") + raw.trimEnd();
      continue;
    }
    if (!topic) {
      if (line && line !== "---" && section.id === "24") section.context = line;
      continue;
    }
    if (/^Readings$/.test(line)) {
      mode = "readings";
      reading = null;
      continue;
    }
    if (
      /^(?:Final mastery|Mastery) questions$/.test(line) ||
      /^Complete the following checklist:/.test(line)
    ) {
      mode = "questions";
      reading = null;
      continue;
    }
    if (/^Applied (exercise|case)(?: \d+)?(?::.*)?$/.test(line)) {
      mode = "exercise";
      reading = null;
      topic.exercise =
        (topic.exercise ? topic.exercise + "\n\n" : "") +
        (/^Applied (?:exercise|case)(?: \d+|:)/.test(line)
          ? "### " + line + "\n"
          : "");
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
    if (url === "https://www.ul.com/services/follow-up-services")
      url = "https://www.ul.com/services/follow-services";
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
      ...(/components.omron.com\/.*support/.test(url) ||
      (Number(t.id.split(".")[0]) >= 23 && access)
        ? { searchDestination: true }
        : {}),
      accessNote: access
        ? "Catalog/access link: public scope and publication information may be available. Full requirements and clauses require authorized standards access; confirm the applicable edition."
        : /components.omron.com\/.*support/.test(url)
          ? "Search destination: locate the relevant manufacturer technical document; this library is not a direct document link."
          : "",
    });
  }
  return data;
}
