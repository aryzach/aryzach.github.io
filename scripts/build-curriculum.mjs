import { extendCurriculum } from "./extend-curriculum.mjs";
// Rebuild from the owner's supplied text. Continuations supersede truncated versions.
import { readFileSync, writeFileSync } from "node:fs";
const files = [
  "01-foundations.md",
  "02-modules-12-20.md",
  "03-modules-17-20.md",
];
const clean = (s) => s.replace(/\*\*/g, "").trim();
const guidance = JSON.parse(
  readFileSync(
    new URL("../src/academy/topic-guidance.json", import.meta.url),
    "utf8",
  ),
);
const sections = new Map();
const aliases = new Map();
const defaults = {
  UL: "https://www.shopulstandards.com/",
  "NFPA 70":
    "https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70",
  "NFPA 855":
    "https://www.nfpa.org/codes-and-standards/nfpa-855-standard-development/855",
  Cornell: "https://www.law.cornell.edu/wex/products_liability",
  CBP: "https://www.cbp.gov/trade/basic-import-export",
  Intertek: "https://www.intertek.com/marks/etl/",
  SGS: "https://www.sgs.com/en/services/product-certification",
  "NFPA Research": "https://www.nfpa.org/education-and-research/research",
  "CPSC: Recall Guidance":
    "https://www.cpsc.gov/Business--Manufacturing/Recall-Guidance",
};
let section,
  topic,
  reading,
  mode,
  lastURL = "";
for (const file of files) {
  const text = readFileSync(
    new URL("../docs/curriculum-source/" + file, import.meta.url),
    "utf8",
  );
  for (const raw of text.split("\n")) {
    const line = clean(raw.replace(/^#+\s*/, ""));
    let m = line.match(/^(?:SECTION (I|II)|Module (\d+)): (.+)$/);
    if (m) {
      const id = m[2] || { I: "1", II: "2" }[m[1]];
      section = { id, title: m[3], objective: "", capstone: "", topics: [] };
      sections.set(id, section);
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
      topic = {
        id: m[1],
        title: m[2],
        why: "",
        questions: [],
        readings: [],
        context: [],
      };
      section.topics.push(topic);
      reading = null;
      mode = "";
      continue;
    }
    if (/^(Module capstone|Capstone):/.test(line)) {
      section.capstone = line.replace(/^(Module capstone|Capstone):\s*/, "");
      mode = "";
      continue;
    }
    if (!topic) continue;
    if (/^Why:/.test(line)) {
      topic.why = line.slice(4).trim();
      continue;
    }
    if (/^Questions:?$/.test(line)) {
      mode = "questions";
      reading = null;
      continue;
    }
    if (/^Readings:?$/.test(line)) {
      mode = "readings";
      reading = null;
      continue;
    }
    if (line.startsWith("- [ ] ")) {
      if (!line.endsWith("Does using")) topic.questions.push(line.slice(6));
      continue;
    }
    m = line.match(/^\d+\. (.+)$/);
    if (m && mode === "readings") {
      const link = m[1].match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)(.*)$/);
      const boldless = m[1].match(
        /^(.+?)\.\s+(https?:\/\/\S+|Same link\.|Same catalog\.)(.*)$/,
      );
      let title,
        url,
        scope = "";
      if (link) {
        [, title, url, scope] = link;
      } else if (boldless) {
        title = boldless[1];
        url = boldless[2].startsWith("http") ? boldless[2] : lastURL;
        scope = boldless[3];
      } else {
        title = m[1];
        url = "";
      }
      if (title.includes("[UL 1973]")) {
        topic.incomplete = true;
        continue;
      }
      if (url) {
        lastURL = url;
        aliases.set(title.toLowerCase(), url);
      }
      reading = {
        id: topic.id + ":r" + (topic.readings.length + 1),
        title: title.replace(/\.$/, ""),
        url,
        scope: scope.replace(/^\s*—\s*/, ""),
        summary: "",
      };
      topic.readings.push(reading);
      continue;
    }
    if (reading && mode === "readings" && line && line !== "---") {
      reading.summary +=
        (reading.summary ? " " : "") + line.replace(/^Summary:\s*/, "");
    } else if (
      !mode &&
      line &&
      line !== "---" &&
      !line.startsWith("Continuation")
    )
      topic.context.push(line);
  }
}
const findURL = (title) => {
  const key = title.toLowerCase();
  if (aliases.has(key)) return aliases.get(key);
  if (/nfpa 70|^nec/i.test(title)) return defaults["NFPA 70"];
  if (/nfpa 855/.test(key)) return defaults["NFPA 855"];
  if (/ul 9540a/.test(key))
    return "https://www.ul.com/services/ul-9540a-test-method";
  if (/huum.*certificate/.test(key))
    return [...aliases].find(
      ([k]) => k.includes("huum") && k.includes("certificate"),
    )?.[1];
  if (/sgs.*recognition|osha.*sgs/.test(key))
    return "https://www.osha.gov/nationally-recognized-testing-laboratory-program/sgs";
  if (/osha.*(nrtl|laborator)/.test(key))
    return "https://www.osha.gov/nationally-recognized-testing-laboratory-program";
  if (/cpsc.*report/.test(key))
    return "https://www.cpsc.gov/Business--Manufacturing/Recall-Guidance/Duty-to-Report-to-the-CPSC-Your-Rights-and-Responsibilities";
  if (/cpsc.*recall.*guidance/.test(key))
    return defaults["CPSC: Recall Guidance"];
  if (/cpsc.*recall/.test(key)) return "https://www.cpsc.gov/Recalls";
  if (/cpsc/.test(key)) return "https://www.cpsc.gov/Business--Manufacturing";
  if (/california/.test(key)) return "https://www.dgs.ca.gov/BSC/Codes";
  if (/san francisco/.test(key))
    return "https://www.sf.gov/departments/department-building-inspection";
  if (/follow-up/.test(key))
    return "https://www.ul.com/services/follow-services";
  if (/field eval/.test(key))
    return "https://www.ul.com/services/field-evaluations";
  if (/ul solutions.*certification/.test(key))
    return "https://www.ul.com/services/certification";
  if (/product iq/.test(key)) return "https://productiq.ulprospector.com/";
  if (/iso 9001/.test(key))
    return "https://www.iso.org/iso-9001-quality-management.html";
  if (/^ul\b/.test(key)) return defaults.UL;
  if (/iec webstore/.test(key)) return "https://webstore.iec.ch/";
  if (/iecee/.test(key)) return "https://www.iecee.org/";
  if (/impulse/.test(key))
    return "https://www.impulselabs.com/blog/impulse-becomes-first-certified-battery-integrated-appliance";
  if (/copper/.test(key)) return "https://copperhome.com/pages/faq";
  for (const [prefix, url] of Object.entries(defaults))
    if (key.includes(prefix.toLowerCase())) return url;
  throw Error("No URL: " + title);
};
const data = [...sections.values()];
for (const s of data) {
  for (const t of s.topics) {
    t.incomplete = t.incomplete || ["2.6", "20.2"].includes(t.id);
    t.why = t.why || guidance[t.id]?.[0] || s.objective;
    t.objectives = guidance[t.id]?.slice(1) || [];
    for (const r of t.readings) {
      r.url = r.url || findURL(r.title);
      r.access =
        /shopulstandards|webstore\.iec|nfpa\.org\/codes-and-standards|nema\.org\/standards/.test(
          r.url,
        );
      r.scope =
        r.scope ||
        (/Study |Read |Focus |Review |Locate |Investigate |Select |Search |Find |Examine |Explore /.test(
          r.summary,
        )
          ? r.summary.split(/(?<=[.!?])\s+/)[0]
          : r.title);
      r.relevance = t.why;
      if (r.summary.split(/(?<=[.!?])\s+/).length < 2)
        r.summary += " " + r.relevance;
      r.accessNote = r.access
        ? "Catalog/access link: public scope and publication information may be available. Full requirements and clauses require authorized standards access; confirm the applicable edition."
        : "";
    }
  }
}
extendCurriculum(data, guidance);
extendCurriculum(data, guidance, [
  "07-topic-2-6-modules-3-4.md",
  "08-modules-5-6.md",
]);
extendCurriculum(data, guidance, [
  "09-modules-6-8.md",
  "10-modules-8-10.md",
  "11-module-10-continuation.md",
  "12-module-11.md",
  "13-module-11-capstone.md",
]);
data.sort((a, b) => Number(a.id) - Number(b.id));
writeFileSync(
  new URL("../src/academy/content.json", import.meta.url),
  JSON.stringify(data, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    sections: data.length,
    topics: data.flatMap((s) => s.topics).length,
    questions: data.flatMap((s) => s.topics).flatMap((t) => t.questions).length,
    readings: data.flatMap((s) => s.topics).flatMap((t) => t.readings).length,
  }),
);
