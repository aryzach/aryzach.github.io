export type CaseStudy = {
  id: string;
  title: string;
  category: string;
  summary: string;
  facts: string;
  lesson: string;
  unknown: string;
  question: string;
  url: string;
  publisher: string;
  status: string;
  module: string;
};
export const cases: CaseStudy[] = [
  {
    id: "huum",
    title: "HUUM · authenticate the certificate",
    category: "Sauna certification",
    summary:
      "A certificate number is a lead to verify, not a complete safety argument.",
    facts:
      "The supplied historical reference is SGSNA/20/SUW/00067X. At the October 31, 2026 check, its distributor URL returned a site page rather than readable certificate content.",
    lesson:
      "Separate document availability, authenticity, exact-model scope and current listing standing. Request the issuer record and compare the delivered product.",
    unknown:
      "Covered model list, ratings, conditions, dates and current status were not verified. No clause or scope is inferred.",
    question:
      "What would you ask SGS before using this document in a cabin certification package?",
    url: "https://www.bathingbrands.com/sites/default/files/2022-09/HUUM%20Certificate%20of%20Compliance.pdf",
    publisher: "Historical distributor link",
    status: "Incomplete evidence",
    module: "sauna",
  },
  {
    id: "harvia",
    title: "Harvia · declaration versus listing",
    category: "Sauna certification",
    summary:
      "Manufacturer declarations and independent records answer different questions.",
    facts:
      "A distributor-hosted Harvia declaration is available as a research reference. The academy has not established a current independent listing for the user’s exact configuration.",
    lesson:
      "Compare the document’s models and ratings with the directory, installation manual and physical nameplate. Do not generalize from one heater to every heater or cabin.",
    unknown:
      "Current directory standing and exact-model coverage remain unverified; internal test results and commercial history are not available.",
    question:
      "How would changing voltage, controls or enclosure alter the evidence you need?",
    url: "https://www.bathingbrands.com/sites/default/files/2023-03/Harvia-ETL-Declaration-of-Conformity.pdf",
    publisher: "Harvia / distributor copy",
    status: "Verification required",
    module: "sauna",
  },
  {
    id: "saunum",
    title: "Saunum · which product is covered?",
    category: "Sauna certification",
    summary:
      "A climate unit manual is not evidence for every heater sold under the brand.",
    facts:
      "The AirSolo manual references UL 875 edition 9 and CSA C22.2 No. 164. It describes a specific climate unit; current independent directory status is not established here.",
    lesson:
      "Product names, functions, model variants and historical editions must remain attached to each claim. Ask whether the heater, controls and complete cabin were evaluated together.",
    unknown:
      "Other Saunum model coverage, current status and full laboratory conditions are not established.",
    question:
      "Why is substituting a newer standard edition in this manual not merely a documentation cleanup?",
    url: "https://www.steamsaunabath.com/sites/default/files/2023-05/Saunum-AirSolo-Installation-Operation-Manual.pdf",
    publisher: "Saunum manual / distributor copy",
    status: "Manufacturer document",
    module: "sauna",
  },
  {
    id: "copper",
    title: "Copper Charlie · battery and finished range",
    category: "Battery appliance",
    summary: "One architecture, several evidence boundaries.",
    facts:
      "Copper reports a 5 kWh LFP battery recognized to UL 1973, UN 38.3 transport evidence, UL 9540A testing and newest Charlie range certification to UL 858 by TÜV.",
    lesson:
      "Battery recognition, fire testing, transport and finished-appliance evaluation are separate claims. Use the linked directory records to authenticate the exact model and conditions.",
    unknown:
      "Full lab reports, internal redesign history and a transferable sauna pathway are not public evidence here.",
    question:
      "Which parts of this evidence map would you reuse as questions for Product B, and which conclusions cannot transfer?",
    url: "https://copperhome.com/pages/faq",
    publisher: "Copper",
    status: "Manufacturer account; verify directory",
    module: "cooking",
  },
  {
    id: "impulse",
    title: "Impulse · multiple evaluation scopes",
    category: "Battery appliance",
    summary:
      "An appliance boundary can coexist with battery, conversion and control reviews.",
    facts:
      "In June 2025, Impulse described its 3 kWh cooktop and reported UL 1973 work with TÜV, UL 1741 and UL 60730 with UL, and UL 858 with MET.",
    lesson:
      "Map interfaces early and get the finished-product boundary in writing. A cooktop precedent motivates a lab conversation; it does not approve a sauna.",
    unknown:
      "Independent directory verification, exact report conditions and internal project details beyond the manufacturer account are not established.",
    question:
      "What additional sauna-specific hazards would you add to a battery cooktop’s scope map?",
    url: "https://www.impulselabs.com/blog/impulse-becomes-first-certified-battery-integrated-appliance",
    publisher: "Impulse Labs",
    status: "Manufacturer account",
    module: "architecture",
  },
  {
    id: "form",
    title: "Form Energy · chemistry-specific evidence",
    category: "Unusual startup certification",
    summary:
      "Iron-air storage illustrates why evaluation must match the technology.",
    facts:
      "Form Energy announced completion of UL 9540A testing in December 2024 and reported no flame or thermal event propagation in that test program.",
    lesson:
      "A non-lithium chemistry still needs a system safety argument. A fire-test claim and a system listing remain different evidence types.",
    unknown:
      "This announcement alone does not establish a current UL 9540 listing, complete test configuration or all installation conditions.",
    question:
      "How would you prevent a marketing description of a test from becoming an unsupported system-certification claim?",
    url: "https://formenergy.com/form-energys-breakthrough-iron-air-battery-technology-sets-a-new-benchmark-for-safety-in-energy-storage-systems/",
    publisher: "Form Energy",
    status: "Manufacturer announcement",
    module: "battery-cert",
  },
  {
    id: "span",
    title: "SPAN · load control as a safety function",
    category: "Unusual startup certification",
    summary: "Managed power is more than an app scheduling preference.",
    facts:
      "SPAN’s October 2025 announcement reports UL 3141 power-control-system certification for four newer panel models. Its earlier account separately discusses panelboard and energy-management evaluations.",
    lesson:
      "Do not assume ordinary remote switching establishes validated overload management. Identify the safety function, response to failures and exact certified model.",
    unknown:
      "Full evaluation report, implementation details and applicability to an internal sauna charger/heater controller are not established.",
    question:
      "How would you distinguish convenience scheduling from a safety-related AC input limit?",
    url: "https://www.span.io/blog/span-smart-electrical-panels-earn-first-in-class-ul-3141-power-control-systems-pcs-certification-for-safety",
    publisher: "SPAN",
    status: "Manufacturer announcement",
    module: "architecture",
  },
  {
    id: "lumin",
    title: "Lumin · measurement and load-control boundaries",
    category: "Unusual startup certification",
    summary: "A smart-panel product combines several functions and conditions.",
    facts:
      "The manufacturer’s indoor smart-panel documentation identifies MET listing E115439 and references UL 916 and UL/CSA 61010 families.",
    lesson:
      "Read environmental and load-rating conditions alongside the stated standards. A measurement/control product is not automatically a branch protective device.",
    unknown:
      "Current independent directory standing, complete report and authorization for a different enclosure or use remain to be verified.",
    question:
      "What separates evidence for monitoring, switching and protection in this product?",
    url: "https://www.luminsmart.com/storage/app/media/Panel%20Guard/LS-101523-REV1-Indoor%20Electrification%20LSP%20Documentation%20and%20Installation%20Manual.pdf",
    publisher: "Lumin installation manual",
    status: "Manufacturer documentation",
    module: "controls",
  },
  {
    id: "sunbeam",
    title: "Sunbeam · overheating without a published root cause",
    category: "Recall / failure case",
    summary: "Avoid filling gaps in a recall notice with a plausible story.",
    facts:
      "CPSC’s March 2023 notice describes overheating in model 32810027 heated blankets and reports 13 overheating incidents with no injuries reported.",
    lesson:
      "A documented hazard is enough to motivate thermal protection and field-response questions. It is not proof of a particular relay, sensor or software failure.",
    unknown:
      "The notice does not identify the detailed root cause or every protective device in the product.",
    question:
      "Write a hazard statement using only facts, then separately list three engineering hypotheses you would investigate.",
    url: "https://www.cpsc.gov/Recalls/2023/Sunbeam-Heated-Blankets-Recalled-Due-to-Burn-and-Fire-Hazards-Distributed-by-Star-Elite",
    publisher: "CPSC · recall 23-157",
    status: "Government recall",
    module: "thermal",
  },
  {
    id: "jkmax",
    title: "JKMAX · internal heating elements",
    category: "Recall / failure case",
    summary:
      "Reported field consequences make traceability and response concrete.",
    facts:
      "The September 2026 CPSC notice says internal heating elements can overheat. It reports 577 smoking, melting or burning incidents, including 53 burn injuries.",
    lesson:
      "Keep affected model/lot identity, hazard, event reports and remedy evidence connected. Do not equate absence of a branch trip with absence of a thermal hazard.",
    unknown:
      "The notice does not provide a full mechanism or justify assigning the cause to a particular controller.",
    question:
      "What information belongs in immediate containment, root-cause analysis and effectiveness verification?",
    url: "https://www.cpsc.gov/Recalls/2026/JKMAX-Recalls-Heated-Blankets-and-Heating-Pads-Due-to-Fire-and-Burn-Hazards",
    publisher: "CPSC · recall 26-778",
    status: "Government recall",
    module: "manufacturing",
  },
  {
    id: "steamfast",
    title: "Steamfast · cord damage at the enclosure",
    category: "Recall / failure case",
    summary:
      "Mechanical cord protection can become an electrical and thermal hazard.",
    facts:
      "CPSC’s April 2023 recall describes power-cord damage near the bushing, creating overheating and exposed-conductor hazards. It reports 50 incidents with no injuries reported.",
    lesson:
      "Strain relief, flexing and enclosure interfaces belong in the safety analysis alongside the heater and thermostat.",
    unknown:
      "The notice is not a full test report and does not establish the performance of a different cord design.",
    question:
      "Which mechanical, electrical and manufacturing evidence would you request for a cord-connected Product A?",
    url: "https://www.cpsc.gov/Recalls/2023/Vornado-Recalls-Steamfast-and-Brookstone-Travel-Steam-Irons-Due-to-Fire-Burn-and-Shock-Hazards",
    publisher: "CPSC · recall 23-189",
    status: "Government recall",
    module: "electrical",
  },
  {
    id: "govee",
    title: "Govee · wireless heater control",
    category: "Recall / failure case",
    summary: "Remote operation can change an appliance safety question.",
    facts:
      "The CPSC notice identifies overheating/fire hazards and noncompliance with a voluntary safety standard for the affected space heaters, including wireless-control concerns.",
    lesson:
      "Remote starting and unattended operation need explicit scope review. A requirement discussed for space heaters must not be silently imported into a sauna standard.",
    unknown:
      "Sauna-specific requirements, the full test report and internal implementation are not established by this notice.",
    question:
      "What would you ask the lab before adding remote starting to a listed sauna heater?",
    url: "https://www.cpsc.gov/Recalls/2025/GoveeLife-and-Govee-Smart-Electric-Space-Heaters-Recalled-Due-to-Fire-and-Burn-Hazards-Imported-by-Govee",
    publisher: "CPSC",
    status: "Government recall",
    module: "controls",
  },
  {
    id: "atomi",
    title: "Atomi · smart-heater field response",
    category: "Recall / failure case",
    summary: "A connected appliance remains a physical heating system.",
    facts:
      "Health Canada’s July 11, 2024 joint recall identifies a fire hazard in affected Atomi smart heaters and directs consumers to stop use and follow the recall remedy.",
    lesson:
      "Connected features do not replace independent protective design, production conformity or a field safety process.",
    unknown:
      "A detailed causal chain, exact internal protection architecture and any sauna-specific requirement are not established here.",
    question:
      "How would you investigate a field overheating report without prematurely attributing it to Wi-Fi or software?",
    url: "https://recalls-rappels.canada.ca/en/alert-recall/atomi-smart-heaters-recalled-due-fire-hazard",
    publisher: "Health Canada",
    status: "Government recall",
    module: "manufacturing",
  },
  {
    id: "lg",
    title: "LG RESU · residential battery recall",
    category: "Residential battery failure / recall",
    summary: "A battery’s service history matters after initial approval.",
    facts:
      "CPSC’s August 2021 notice identifies a fire hazard in affected residential energy-storage batteries and a replacement remedy.",
    lesson:
      "Model/serial traceability and post-market monitoring matter for a long-lived energy product. Pack-level evidence cannot remove every field risk.",
    unknown:
      "This source does not justify classifying the affected batteries as LFP or transferring their mechanism to every lithium-ion chemistry.",
    question:
      "Which battery identity and supplier records would let you bound a similar issue in Product B?",
    url: "https://www.cpsc.gov/Recalls/2021/LG-Energy-Solution-Michigan-Recalls-Home-Energy-Storage-Batteries-Due-to-Fire-Hazard-0",
    publisher: "CPSC",
    status: "Government recall; chemistry not inferred",
    module: "battery",
  },
];
