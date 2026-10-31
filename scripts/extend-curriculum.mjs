import { readFileSync } from "node:fs";
// Append-only IDs keep existing saved checkboxes attached to the same content.
export function extendCurriculum(
  data,
  guidance,
  sources = [
    "04-module-20-extension.md",
    "05-modules-23-24.md",
    "06-topic-24-7-capstone.md",
  ],
) {
  const text = sources
    .map((file) => {
      const source = readFileSync(
        new URL("../docs/curriculum-source/" + file, import.meta.url),
        "utf8",
      );
      if (file === "09-modules-6-8.md")
        return source
          .slice(source.indexOf("# Module 6:"))
          .split("## Topic 8.4:")[0];
      if (file === "10-modules-8-10.md")
        return source
          .slice(source.indexOf("# Module 8:"))
          .split("## Topic 10.3:")[0];
      if (file === "11-module-10-continuation.md")
        return source.split("# Implementation Reminder")[0];
      if (file === "12-module-11.md")
        return source
          .slice(
            source.indexOf("# Module 11:", source.indexOf("# Module 11:") + 1),
          )
          .split("# Module 11 Capstone:")[0];
      if (file === "13-module-11-capstone.md")
        return source.split("# Final Instructions to Codex")[0];
      // The complete continuation replaces the truncated 24.7 paste.
      return file === "05-modules-23-24.md"
        ? source
            .slice(source.indexOf("# Module 23:"))
            .split("## Topic 24.7:")[0]
        : file === "08-modules-5-6.md"
          ? source.slice(source.indexOf("# Module 5:"))
          : source;
    })
    .join("\n");
  let section,
    topic,
    reading,
    mode = "",
    capstoneChecklist = "";
  const clean = (s) => s.replace(/\*\*/g, "").trim();
  const key = (r) =>
    sources.includes("11-module-10-continuation.md")
      ? r.url + "|" + r.title
      : r.url + "|" + (r.title.match(/(?:UL|IEC)\s+\d+(?:-\d+)*/)?.[0] || "");
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
      if (
        sources.includes("11-module-10-continuation.md") &&
        ["10", "11"].includes(capstone[1])
      ) {
        topic = {
          id: capstone[1] + "." + (section.topics.length + 1),
          title: "Capstone: " + capstone[2],
          why: section.objective,
          objectives: [section.objective],
          questions: [],
          readings: [],
          context: [],
          incomplete: false,
          exercise: "",
        };
        section.topics.push(topic);
        capstoneChecklist = "";
        mode = "capstone-topic";
        continue;
      }
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
    if (!section && /^Topic \d+\.\d+:/.test(line)) {
      const sectionId = line.match(/^Topic (\d+)/)[1];
      section = data.find((s) => s.id === sectionId);
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
      if (sources.includes("07-topic-2-6-modules-3-4.md") && topic.id === "2.6")
        topic.title = m[2];
      topic.incomplete = false;
      mode = "context";
      reading = null;
      continue;
    }
    if (mode === "capstone-topic") {
      if (/^Required deliverables$/.test(line)) {
        capstoneChecklist = "deliverables";
        topic.deliverableCount = 0;
        continue;
      }
      if (/^Final mastery (questions|checklist)$/.test(line)) {
        capstoneChecklist = "questions";
        continue;
      }
      if (line.startsWith("- [ ] ")) {
        topic.questions.push(line.slice(6));
        if (capstoneChecklist === "deliverables") topic.deliverableCount++;
      } else if (line !== "---")
        topic.exercise += (topic.exercise ? "\n" : "") + raw.trimEnd();
      continue;
    }
    if (mode === "capstone") {
      if (line !== "---")
        section.capstone += (section.capstone ? "\n" : "") + raw.trimEnd();
      continue;
    }
    if (!topic) {
      if (line && line !== "---" && section.id === "24") section.context = line;
      if (line && line !== "---" && section.id === "11")
        section.context =
          (section.context ? section.context + "\n\n" : "") + raw.trimEnd();
      continue;
    }
    if (/^Readings$/.test(line)) {
      mode = "readings";
      reading = null;
      continue;
    }
    if (
      /^(?:Final mastery|Remaining mastery|Mastery) questions$/.test(line) ||
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
      /codes\.iccsafe\.org|standards\.ieee\.org|shopulstandards|webstore\.iec|nfpa\.org\/codes-and-standards|nema\.org\/standards|iso\.org\/standards/.test(
        url,
      );
    const library =
      sources.includes("11-module-10-continuation.md") &&
      /productiq\.ulprospector|^https:\/\/(?:www\.)?harvia\.com\/?$|components\.omron\.com|^https:\/\/(?:www\.)?batteryuniversity\.com\/?$|nrel\.gov\/research\/publications|^https:\/\/(?:www\.)?victronenergy\.com\/?$|te\.com\/en\/products\/relays|workmanship\.nasa\.gov|victronenergy\.com\/(batteries|chargers)|ti\.com\/power-management\/battery-management|analog\.com\/en\/product-category\/battery-management/.test(
        url,
      );
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
      ...(library ||
      /components.omron.com\/.*support/.test(url) ||
      ((Number(t.id.split(".")[0]) >= 23 ||
        sources.includes("07-topic-2-6-modules-3-4.md") ||
        sources.includes("11-module-10-continuation.md")) &&
        access)
        ? { searchDestination: true }
        : {}),
      accessNote: access
        ? "Catalog/access link: public scope and publication information may be available. Full requirements and clauses require authorized standards access; confirm the applicable edition."
        : library
          ? "Search destination: locate the relevant technical document or certification record in this resource library. This is not a direct full-text document link."
          : /components.omron.com\/.*support/.test(url)
            ? "Search destination: locate the relevant manufacturer technical document; this library is not a direct document link."
            : "",
    });
  }
  return data;
}
