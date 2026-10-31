export const CONTENT_VERSION = "2026-10-31.1";
export type ClaimType =
  | "verified_fact"
  | "engineering_interpretation"
  | "educational_simplification"
  | "normative_requirement"
  | "hypothesis"
  | "unknown";
export type Source = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  scope: string;
  checked: string;
  status: string;
  edition?: string;
};
export const sources: Source[] = [
  {
    id: "osha",
    title: "NRTL program",
    url: "https://www.osha.gov/nationally-recognized-testing-laboratory-program",
    publisher: "OSHA",
    scope:
      "Laboratory recognition and scopes. OSHA workplace requirements are not a universal consumer-product sales law.",
    checked: "2026-10-31",
    status: "Public program overview",
  },
  {
    id: "nec",
    title: "NFPA 70 · National Electrical Code",
    url: "https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70",
    publisher: "NFPA",
    scope:
      "Edition and local adoption must be checked for each installation. Full adopted text is needed before determining compliance.",
    checked: "2026-10-31",
    status: "Reference; clauses not independently verified",
  },
  {
    id: "ul875",
    title: "UL 875 · Electric Dry-Bath Heaters",
    url: "https://www.shopulstandards.com/ProductDetail.aspx?productId=UL875",
    publisher: "UL Standards & Engagement",
    edition: "10 · July 8, 2024",
    scope:
      "Public scope includes dry-bath heating equipment; configuration and certification conditions matter. Full requirements not reviewed.",
    checked: "2026-10-31",
    status: "Public scope only",
  },
  {
    id: "ul253",
    title: "UL 60335-2-53 · Sauna heating appliances",
    url: "https://www.shopulstandards.com/ProductDetail.aspx?productId=UL60335-2-53_1_S_20250627",
    publisher: "UL Standards & Engagement",
    edition: "1 · June 27, 2025",
    scope:
      "US adoption with national differences. Do not substitute the latest IEC edition for this US standard.",
    checked: "2026-10-31",
    status: "Public scope only",
  },
  {
    id: "iec253",
    title: "IEC 60335-2-53:2026",
    url: "https://webstore.iec.ch/en/publication/106068",
    publisher: "IEC",
    edition: "5 · October 15, 2026",
    scope:
      "Public catalog describes sauna and infrared cabin appliances. US acceptance and transition dates require lab confirmation.",
    checked: "2026-10-31",
    status: "Public scope only",
  },
  {
    id: "ess",
    title: "Energy storage system certification",
    url: "https://www.ul.com/services/energy-storage-system-testing-and-certification",
    publisher: "UL Solutions",
    scope:
      "UL 9540 system evaluation and relationships to battery, converter and installation standards; applicability to Product B unresolved.",
    checked: "2026-10-31",
    status: "Laboratory overview",
  },
  {
    id: "9540a",
    title: "UL 9540A fire propagation test method",
    url: "https://www.ul.com/services/ul-9540a-test-method",
    publisher: "UL Solutions",
    scope:
      "Test method, not a substitute for a product listing. Test level, configuration and report limitations matter.",
    checked: "2026-10-31",
    status: "Laboratory overview",
  },
  {
    id: "cpsc",
    title: "Business and manufacturing responsibilities",
    url: "https://www.cpsc.gov/Business--Manufacturing",
    publisher: "CPSC",
    scope:
      "Consumer product safety and reporting resources. Obtain advice for particular reporting obligations.",
    checked: "2026-10-31",
    status: "Government overview",
  },
  {
    id: "copper",
    title: "Charlie technical and safety FAQ",
    url: "https://copperhome.com/pages/faq",
    publisher: "Copper",
    scope:
      "Manufacturer reports 5 kWh LFP, UL 1973 recognized battery, UN 38.3, UL 9540A testing and newest Charlie UL 858 certification by TÜV. Verify specific model in directory.",
    checked: "2026-10-31",
    status: "Manufacturer statement",
  },
  {
    id: "impulse",
    title: "Battery-integrated appliance certification",
    url: "https://www.impulselabs.com/blog/impulse-becomes-first-certified-battery-integrated-appliance",
    publisher: "Impulse Labs",
    scope:
      "June 8, 2025 manufacturer account: 3 kWh cooktop, UL 1973/TÜV, UL 1741/UL, UL 60730/UL, UL 858/MET. Not independent directory verification.",
    checked: "2026-10-31",
    status: "Manufacturer statement",
  },
  {
    id: "huum",
    title: "HUUM certificate SGSNA/20/SUW/00067X",
    url: "https://www.bathingbrands.com/sites/default/files/2022-09/HUUM%20Certificate%20of%20Compliance.pdf",
    publisher: "Bathing Brands / purported SGS record",
    scope:
      "Historical certificate reference supplied for investigation. Link currently returns a site page; model list, scope, dates and current standing remain unverified.",
    checked: "2026-10-31",
    status: "Document unavailable; verification required",
  },
  {
    id: "harvia",
    title: "Harvia declaration of conformity",
    url: "https://www.bathingbrands.com/sites/default/files/2023-03/Harvia-ETL-Declaration-of-Conformity.pdf",
    publisher: "Harvia / distributor copy",
    scope:
      "A declaration is a starting point, not a verified current listing. Compare exact model, voltage, installation instructions and certification directory.",
    checked: "2026-10-31",
    status: "Verification required",
  },
  {
    id: "saunum",
    title: "Saunum AirSolo installation manual",
    url: "https://www.steamsaunabath.com/sites/default/files/2023-05/Saunum-AirSolo-Installation-Operation-Manual.pdf",
    publisher: "Saunum / distributor copy",
    scope:
      "Manufacturer manual references UL 875 edition 9 and CSA C22.2 No. 164. AirSolo climate unit must not be confused with every Saunum heater model.",
    checked: "2026-10-31",
    status: "Manufacturer manual; current listing unverified",
  },
  {
    id: "sunbeam",
    title: "Sunbeam heated blanket recall 23-157",
    url: "https://www.cpsc.gov/Recalls/2023/Sunbeam-Heated-Blankets-Recalled-Due-to-Burn-and-Fire-Hazards-Distributed-by-Star-Elite",
    publisher: "CPSC",
    scope:
      "March 16, 2023: overheating hazard, 13 reports, no reported injuries; detailed root cause not disclosed.",
    checked: "2026-10-31",
    status: "Government recall",
  },
  {
    id: "jkmax",
    title: "JKMAX heating products recall 26-778",
    url: "https://www.cpsc.gov/Recalls/2026/JKMAX-Recalls-Heated-Blankets-and-Heating-Pads-Due-to-Fire-and-Burn-Hazards",
    publisher: "CPSC",
    scope:
      "September 17, 2026: internal heating elements can overheat; 577 reports and 53 burn injuries. Do not infer an undisclosed controller defect.",
    checked: "2026-10-31",
    status: "Government recall",
  },
];
export type QuestionType =
  | "multiple_choice"
  | "numeric"
  | "short_answer"
  | "explain_reasoning"
  | "identify_error"
  | "case_analysis"
  | "source_interpretation"
  | "insufficient_information";
export type Question = {
  id: string;
  concept: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  answer?: string;
  numeric?: number;
  tolerance?: number;
  units?: string;
  explanation: string;
  rubric: string[];
  transfer?: boolean;
  sources: string[];
};
export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  body: string;
  claim: ClaimType;
};
export type Module = {
  id: string;
  title: string;
  summary: string;
  prerequisites: string[];
  objectives: string[];
  sources: string[];
  lessons: Lesson[];
  questions: Question[];
};
function module(
  id: string,
  title: string,
  summary: string,
  prerequisites: string[],
  sourceIds: string[],
  objective: string,
  teach: string,
  example: string,
  choice: string,
  options: string[],
  answer: string,
  explanation: string,
  transfer: string,
  rubric: string[],
): Module {
  return {
    id,
    title,
    summary,
    prerequisites,
    sources: sourceIds,
    objectives: [objective],
    lessons: [
      {
        id: id + "-principles",
        title: "Understand the safety argument",
        minutes: 12,
        body: teach,
        claim: "engineering_interpretation",
      },
      {
        id: id + "-application",
        title: "Apply it to your heater",
        minutes: 10,
        body: example,
        claim: "educational_simplification",
      },
    ],
    questions: [
      {
        id: id + "-check",
        concept: id,
        type: "multiple_choice",
        prompt: choice,
        options,
        answer,
        explanation,
        rubric: [explanation],
        sources: sourceIds,
      },
      {
        id: id + "-transfer",
        concept: id,
        type: "case_analysis",
        prompt: transfer,
        explanation,
        rubric,
        transfer: true,
        sources: sourceIds,
      },
      {
        id: id + "-retest",
        concept: id,
        type: "explain_reasoning",
        prompt:
          "A colleague says: “" +
          options.find((o) => o !== answer) +
          ".” Explain the error, give a contrasting example and say what evidence would change your conclusion.",
        explanation,
        rubric,
        transfer: true,
        sources: sourceIds,
      },
    ],
  };
}
export const modules: Module[] = [
  module(
    "regulation",
    "The US safety system",
    "Standards, laboratories and local authorities play different roles.",
    [],
    ["osha", "cpsc", "ul875"],
    "Distinguish a standard, a certification mark, a recognized component and installation approval.",
    `## Build a chain of evidence\nA standard describes an evaluation framework. A laboratory evaluates a defined product against a defined standard and can authorize its mark under a certification program. The authority having jurisdiction (AHJ) evaluates the installation under the locally adopted rules. These are connected decisions with different owners. A mark does not authorize every installation.\n\nOSHA recognizes NRTLs for specific standards and sites; recognition is not a claim that OSHA has approved every product the laboratory encounters. UL is both a familiar mark and part of names used by different organizations: UL Standards & Engagement develops standards; UL Solutions provides testing and certification. ETL is Intertek’s mark. Another eligible NRTL may evaluate a product to a UL standard within its scope.\n\nA recognized component has conditions of acceptability for integration. A relay’s recognition does not make the appliance Listed. A CB report can help international evaluation but does not automatically establish US certification. CE marking alone does not prove US NRTL certification. CPSC consumer-product obligations and OSHA workplace requirements must not be collapsed into one universal sales rule.`,
    `## Supplier claim exercise\nA supplier sends a photograph of a UL-marked thermostat and calls the cabin “UL approved.” Ask for the finished-product certification file, exact model family, electrical ratings, current directory record, authorized manufacturing sites and installation instructions. Then compare the product actually delivered with the listed construction.\n\nFor Product A, define whether the submitted product is the heater alone, controls plus heater, or an assembled cabin. For Product B, draw the charger, battery, DC heater, AC heater and protection boundaries before asking the lab for a scope decision. The lab must see the interfaces, not merely a pile of certificates.\n\n**Deliverable:** a one-page evidence map with columns for claim, issuer, model, standard/edition, covered configuration, missing evidence and responsible party. Mark missing evidence as unknown.`,
    "A supplier provides a recognized relay certificate. What follows?",
    [
      "The cabin is Listed",
      "Only the relay has demonstrated the stated component scope",
      "Any NRTL mark can be copied onto the heater",
    ],
    "Only the relay has demonstrated the stated component scope",
    "Component evidence has conditions and scope; finished-product evaluation and marking authorization are separate.",
    "The same certified heater is installed in a new wooden cabin with remote controls. Which conclusions transfer, and which require new evidence?",
    [
      "Identify component versus finished system",
      "Identify cabin and control interfaces",
      "Request exact-model scope and lab review",
    ],
  ),
  module(
    "branch",
    "120V circuits and installation feasibility",
    "Calculate the load, then investigate the rules; runtime alone gives no permission.",
    ["regulation"],
    ["nec", "ul875"],
    "Evaluate the missing evidence for a proposed 1.7–2.2 kW, 120V heater on a 15A or 20A branch.",
    `## Three hours is a classification question\nAt nominal voltage, I = P/V. A 2,000 W resistive load at 120 V draws about 16.7 A; a 2,200 W load about 18.3 A. These are electrical calculations, not compliance determinations. The NEC continuous-load concept concerns the maximum current expected to continue for three hours or more. “Under three hours” is not blanket permission for a particular heater, receptacle or branch circuit.\n\nIdentify the adopted NEC edition and local amendments. Investigate Articles 90 and 100 for applicability and definitions; 110 for equipment installation; 210 for branch circuits; 240 for overcurrent protection; 250 for grounding; 400 for cords; and 422 for appliances. Article references are a study map, not verified clause-level instructions. Fixed heating classification may raise additional questions.\n\nCheck appliance nameplate, maximum input including controls or charging, listing instructions, dedicated versus shared circuit, conductor and terminal ratings, plug/receptacle configuration and environment. GFCI/AFCI requirements depend on adopted rules and location. Never defeat required protection to make a heater operate.`,
    `## Compare three candidates\nAt 120 V, 1.7/2.0/2.2 kW correspond to approximately 14.2/16.7/18.3 A. A simplified 125% continuous-load comparison gives 17.7/20.8/22.9 A. It does not select a breaker or prove that another classification applies. The 80% shorthand also cannot resolve appliance-specific rules or exceptions.\n\nFor Product A, record the branch configuration and ask the lab to confirm the intended connection and rating before optimizing marketing wattage. For Product B, a 1.8 kW heater and a 1.0 kW charger already total 2.8 kW before auxiliaries. “The battery supplies the boost” says nothing about simultaneous AC demand. Use maximum coincident input and a validated allocation strategy.\n\n**Deliverable:** a feasibility table for 15A and 20A configurations with assumptions, nameplate evidence, applicable rule questions and unresolved installation constraints.`,
    "A 2 kW heater runs for 90 minutes. Is it automatically acceptable on 20A?",
    [
      "Yes, because under three hours",
      "No determination yet; classification, equipment and installation evidence are still needed",
      "Yes, because a breaker guarantees safety",
    ],
    "No determination yet; classification, equipment and installation evidence are still needed",
    "Runtime alone does not resolve load classification, applicable sizing, listing instructions or branch configuration.",
    "Assess a nominal 2.2 kW heater on an existing shared 20A circuit. What can you calculate and what must you verify?",
    [
      "18.3 A nominal calculation",
      "No automatic permission from short runtime",
      "Adopted code, coincident loads and listing instructions",
    ],
  ),
  module(
    "electrical",
    "Electrical failure mechanisms",
    "Shock protection, local heating and independent layers.",
    ["branch"],
    ["nec", "ul875"],
    "Explain why an overcurrent device does not cover every shock or overheating fault.",
    `## Follow the fault energy\nShock risk depends on the accessible voltage, body path, exposure and protective measures. Protective earthing provides a defined fault path for exposed conductive parts in appropriate equipment. A branch breaker responds to certain overcurrent conditions; it is not a general leakage-current detector and may not respond to a dangerous local hot joint.\n\nContact heating scales as I²R. At 16 A, a hypothetical 0.05 Ω connection dissipates 12.8 W locally. The branch current need not increase. Oxidation, loosening, loss of contact force and thermal cycling can worsen a connection. The calculation explains a mechanism; actual terminal acceptance requires construction, torque, thermal and endurance evidence.\n\nInsulation, creepage, clearance, material temperature limits, moisture and pollution conditions address different failure paths. Dielectric withstand (hipot), insulation resistance, leakage/touch current and protective-earth continuity are different measurements; passing one does not substitute for the others. Testing energized equipment is a qualified laboratory activity, not a home exercise.`,
    `## A welded switch\nA controller requests heat OFF, but its relay has welded closed. A second sensor connected to the same software and the same relay does not independently interrupt energy. Draw both the normal control path and the protective path. Identify shared power, sensors, wiring, processing and actuators. A shared failure may defeat apparently redundant features.\n\nFor the battery heater, consider both AC and DC energy sources. Disconnecting the AC input may leave battery heating available; a BMS command is not proof that every relevant fault will be interrupted. Evaluate each path and the conditions under which a protective element is expected to act.\n\n**Deliverable:** a fault table: initiating fault → hazardous energy path → independent mitigation → verification method → residual uncertainty. Do not invent component ratings or laboratory pass limits.`,
    "Why can a loose terminal overheat without tripping the branch breaker?",
    [
      "Local resistance can dissipate I²R at normal load current",
      "The breaker always detects terminal temperature",
      "Resistance always reduces heat",
    ],
    "Local resistance can dissipate I²R at normal load current",
    "Local dissipation may rise while total current remains below the breaker trip characteristic.",
    "Both temperature sensors share one microcontroller and one power relay. Analyze a relay weld and a processor freeze.",
    [
      "Separate sensing from interruption",
      "Identify shared failures",
      "Propose independent protection concept and verification",
    ],
  ),
  module(
    "thermal",
    "Thermal safety and abnormal operation",
    "A comfortable room temperature can hide a dangerous component hot spot.",
    ["electrical"],
    ["ul875", "ul253"],
    "Develop a thermal evidence plan that separates room performance from component and wood safety.",
    `## Temperature is a field\nHeat reaches surrounding materials by radiation, convection and conduction. A room air sensor measures one location; it does not bound the temperature of wood behind a heater, a terminal, a battery cell or a nearby control board. Material temperature limits, insulation aging and long-duration exposure matter alongside room comfort.\n\nThermal equilibrium means stored energy is no longer changing appreciably under the test conditions. A curve that appears flat over a few minutes may conceal slower warming in a wall or enclosure. Select measurement locations from expected heat paths and failure modes; record ambient conditions, power, configuration, uncertainty and time history. Sensor attachment can affect the measurement.\n\nNormal temperature regulation and independent overtemperature protection serve different purposes. A normal thermostat may cycle successfully while a blocked-airflow or failed-switch condition defeats its assumptions. Protective devices must be evaluated in the actual installation and under the abnormal conditions agreed with the lab. Exact clearances and test limits must come from the applicable evaluated configuration.`,
    `## Battery placement tradeoff\nMoving an LFP pack away from a heater may improve thermal exposure but introduces cables, connections, enclosure and installation questions. Keeping it inside may reduce external wiring while worsening heat exposure and service access. Neither is accepted solely from this tradeoff list. Record options and request a lab scope review.\n\nA simplified energy balance is input energy = stored heat + losses. Air contributes only part of storage; wood, stones and structure can dominate. A 10 kW boost does not imply a particular heat-up time without thermal mass and loss data. A sustaining heater must replace heat loss at the target temperature; a large battery cannot compensate indefinitely for insufficient sustaining power.\n\n**Deliverable:** measurement map plus normal/abnormal test matrix. Treat blocked ventilation and failed controls as analysis scenarios for a qualified test plan, not instructions to create hazardous conditions.`,
    "Room air reaches its setpoint. What does that prove?",
    [
      "Every material is below its limit",
      "Only the measured location reached that temperature",
      "The battery is safe to charge",
    ],
    "Only the measured location reached that temperature",
    "Local component, surface and structural temperatures need their own evidence under defined conditions.",
    "A cabin reaches 85°C in 20 minutes. What evidence is missing before claiming safe three-hour operation?",
    [
      "Thermal equilibrium and slow heat paths",
      "Critical material/component measurements",
      "Abnormal control and ventilation review",
    ],
  ),
  module(
    "sauna",
    "Sauna standards and scope",
    "Heater, controls and cabin are not interchangeable certification boundaries.",
    ["regulation", "thermal"],
    ["ul875", "ul253", "iec253", "huum", "harvia", "saunum"],
    "Compare sauna certification records without mixing standards editions or model boundaries.",
    `## Name the product before naming the standard\nUL 875 and UL 60335-2-53 are relevant starting points for a laboratory inquiry about electric sauna equipment. UL 60335-1 is the general appliance framework used with applicable particular requirements. IEC and US adoptions have different editions, national differences and transition arrangements; newest is not automatically the accepted edition for a US project.\n\nThe public UL 875 catalog identifies edition 10 (July 2024); the UL 60335-2-53 catalog identifies its first US edition (June 2025). IEC published a fifth edition in October 2026. These catalog facts do not establish which path an NRTL will accept for your exact construction. The academy does not possess verified full-text clauses for these standards.\n\nCanadian evaluation, indoor/outdoor use, cord versus hardwire connection, remote starting and cabin integration must be explicit in scope. A heater certificate does not silently cover changed ventilation, combustible clearances, control location or assembled cabin construction.`,
    `## Read a certificate critically\nHUUM certificate SGSNA/20/SUW/00067X is a useful historical investigation target, but the supplied URL currently does not yield a readable certificate. Do not fill in model coverage or current standing from memory. Harvia declarations and Saunum manuals likewise need comparison with the current certification directory for the exact delivered model. AirSolo is a climate unit, not a synonym for all Saunum heaters.\n\nRecord issuer, certificate/file number, exact models, ratings, standards and editions, issue/revision dates, conditions and current directory status. Ask the lab whether the cabin is included. Treat distributor-hosted documents as copies requiring authentication.\n\n**Deliverable:** a side-by-side evidence comparison for HUUM, Harvia and Saunum. Unknown fields stay visibly unknown.`,
    "Can IEC 60335-2-53:2026 automatically replace the US edition in your certification plan?",
    [
      "Yes, newer always wins",
      "No; US adoption and laboratory transition/scope must be confirmed",
      "Yes, all IEC certificates are US listings",
    ],
    "No; US adoption and laboratory transition/scope must be confirmed",
    "Publication, national adoption, certification scope and transition dates are distinct facts.",
    "A supplier changes from a hardwired heater to a cord-connected complete cabin. What questions go back to the lab?",
    [
      "Connection and cabin boundary",
      "Exact model, ratings and instructions",
      "Applicable editions and changed construction",
    ],
  ),
  module(
    "controls",
    "Components and protective controls",
    "Ratings are conditional; substitution can change the safety argument.",
    ["electrical", "sauna"],
    ["ul875", "ul253"],
    "Build a critical-component list and distinguish operating controls from safety controls.",
    `## Read beyond the ampere number\nA relay or SSR rating is conditioned by load type, voltage, AC/DC operation, ambient, cooling, endurance and mounting. A nominal current number is not a universal switching capacity. SSRs can fail conductive and require thermal design; electromechanical relays can weld. Protective controls need an appropriate failure response and independence from normal regulation.\n\nStandards families to investigate include UL 60730 and -2-9 for automatic and temperature-sensing controls; UL 1054/61058 for switches; UL 508 where applicable; UL 94 and 746 for material properties; UL 62/817/758 for cords, cord sets and wiring; UL 486 for connections; UL 1446 for insulation systems; and UL 1434 for thermistor devices. This is a component research map, not a declaration that every family applies. Edition and component conditions require verification.\n\nSoftware safety depends on the function and protection architecture. A watchdog in the same controller is not automatically independent protection. Trace sensor faults, output faults and startup/restart behavior, including loss and restoration of power.`,
    `## The “equivalent relay” substitution\nPurchasing finds a cheaper part with the same printed amperes. Compare the exact recognition file and conditions, load/endurance category, terminal and wire compatibility, ambient rating, enclosure and mounting, insulation separation and failure behavior. A cosmetic match is insufficient.\n\nMaintain a critical BOM with manufacturer, exact part, revision, certification evidence, conditions, authorized alternatives and change approval. Explain to the factory which substitutions require lab review. Control firmware is also a versioned configuration item.\n\n**Deliverable:** a critical-BOM row for each protective control and switching element, plus a change request template explaining effects on test evidence.`,
    "A replacement switch has the same current label. Is it equivalent?",
    [
      "Yes",
      "Not without its actual conditions, ratings and construction review",
      "Only color matters",
    ],
    "Not without its actual conditions, ratings and construction review",
    "Component suitability depends on evaluated conditions and the integrated safety function, not one label value.",
    "An SSR is added in place of a relay to reduce noise. Analyze the certification and failure-mode impact.",
    [
      "Fail-conductive and cooling considerations",
      "Applicable load and ambient ratings",
      "Independent interruption and change review",
    ],
  ),
  module(
    "testing",
    "From pre-compliance to formal evaluation",
    "Use tests to answer a question, with traceable conditions and uncertainty.",
    ["thermal", "controls"],
    ["osha", "ul875"],
    "Write a pre-compliance plan that supports but does not impersonate certification.",
    `## A passing number needs context\nA useful test record identifies the specimen revision, configuration, input, operating mode, environment, instrument, calibration status, procedure, measurements and uncertainty. Without configuration control, a passing prototype may not represent production. Pre-compliance reduces uncertainty before a formal submission; it does not grant a certification mark.\n\nSeparate construction review, normal operation, abnormal operation, electrical protection, mechanical integrity and instructions/markings. Work with the lab to identify applicable tests, sample counts, destructive tests and acceptance limits. Do not borrow numeric limits from a different appliance standard. A home multimeter is not evidence for a formal dielectric or leakage evaluation.\n\nUncertainty matters near limits. Thermocouple placement, response time, loading, ambient correction and instrument calibration can change conclusions. A result just below a limit with unknown uncertainty should prompt investigation rather than celebration.`,
    `## Prepare the sample package\nInclude drawings, schematics, critical BOM, control state description, hazard analysis, manuals, labels, supplier records and the precise model variants. Ask which representative worst cases cover the family. Record all lab findings, responsible owners and retest evidence.\n\nAfter initial evaluation, factory follow-up and authorized construction maintenance remain part of certification. A laboratory report on one engineering sample does not prove all units remain compliant after substitutions.\n\n**Deliverable:** a test-plan table with hazard/question, method reference, sample revision, operating mode, measurement locations, acceptance source, uncertainty and result. Keep hazardous tests with qualified facilities.`,
    "A prototype passes your internal thermal test. Can you apply an NRTL mark?",
    [
      "Yes",
      "No; formal authorization and covered construction are separate",
      "Only if photographed",
    ],
    "No; formal authorization and covered construction are separate",
    "Pre-compliance evidence reduces risk but is not certification or marking authorization.",
    "Your measured terminal temperature is just below an assumed limit. What must be resolved?",
    [
      "Applicable source for limit",
      "Measurement uncertainty and configuration",
      "Worst-case operation and formal lab review",
    ],
  ),
  module(
    "battery",
    "LFP fundamentals and limits",
    "Energy, power, aging and protection are separate dimensions.",
    ["electrical", "thermal"],
    ["ess", "copper"],
    "Estimate battery energy and current while identifying missing thermal and protection evidence.",
    `## kWh is not kW\nEnergy is the integral of power over time. A nominal 5 kWh pack feeding 10 kW has an ideal half-hour duration before accounting for usable state-of-charge range, losses, voltage variation and power limitations. Current is P/V at the actual operating point; nominal 48 V is not a fixed discharge voltage.\n\nSeries connection raises voltage; parallel connection raises capacity and changes current-sharing and fault behavior. C-rate relates current to ampere-hour capacity, or approximately power to nominal energy for a consistent pack basis. A 10 kW discharge from 5 kWh is roughly 2C on that simplified basis. Manufacturer limits depend on temperature, state of charge, duration, aging and construction.\n\nLFP chemistry does not eliminate thermal runaway, vented gases, short-circuit energy or enclosure hazards. The BMS measures and commands protective actions, but its sensors, logic and actuators also have failure modes. Charging and discharge limits can differ, especially at low and high temperatures. Never infer a pack rating from chemistry alone.`,
    `## A more honest runtime estimate\nWith 5 kWh nominal, 80% usable energy and 90% delivery efficiency, delivered energy is 3.6 kWh; at 8 kW, duration is about 27 minutes. This is an educational estimate, not a product specification. Include auxiliary consumption and limits at end-of-discharge voltage in engineering work.\n\nCharging 4 kWh from a 1 kW input at 90% efficiency takes at least 4.4 hours in a constant-power simplification. Tapering and thermal management can lengthen it. Simultaneous sustaining heat reduces available charging power.\n\n**Deliverable:** a pack requirements sheet with voltage window, usable energy, peak/continuous current, environment, charge limits, cycle-life assumptions, transport evidence and unresolved supplier questions.`,
    "Does LFP chemistry make a hot heater enclosure acceptable for a pack?",
    [
      "Yes",
      "No; actual cell/pack limits and thermal evidence remain necessary",
      "Yes if a BMS exists",
    ],
    "No; actual cell/pack limits and thermal evidence remain necessary",
    "Chemistry and a BMS do not establish safe integrated operating conditions.",
    "Compare two packs both labeled 5 kWh for an 8 kW heater. What could make one unsuitable?",
    [
      "Voltage/current and duration limits",
      "Thermal, aging and usable-energy limits",
      "Protection and integration evidence",
    ],
  ),
  module(
    "battery-cert",
    "Battery and energy-system certification",
    "Transport, cells, packs, systems and installations each have a scope.",
    ["battery", "regulation"],
    ["ess", "9540a", "copper", "impulse"],
    "Distinguish UL 1973, UL 9540, UL 9540A and transport evidence without assigning an unsupported pathway.",
    `## Assemble the scope map\nUL 1973 addresses defined battery applications. UL 9540 addresses energy storage systems and equipment. UL 9540A is a fire-propagation test method whose report must be read at its actual test level and configuration. It is not a product-listing substitute. UN 38.3 transport evidence concerns transport testing; it does not establish appliance certification.\n\nOther research families include UL 1642 for cells, UL 2054 for household/commercial batteries, UL 2580 for electric-vehicle batteries, UL 1741 for relevant power-conversion equipment, NFPA 855 for ESS installation, NEC Articles 706/480 and IEEE 1547 for relevant grid interconnection. These are scope questions, not a checklist automatically applicable to a sauna. Verify current editions and actual applicability with the lab and AHJ.\n\nA battery integrated into an appliance is not automatically classified as a standalone residential ESS, nor automatically exempt from all storage requirements. Function, energy, interfaces, installation and intended use affect the review.`,
    `## Compare Copper and Impulse\nCopper describes a recognized UL 1973 battery, UL 9540A testing and finished-range certification to UL 858. Impulse describes separate battery, conversion and control evaluations plus UL 858 appliance certification. These manufacturer accounts illustrate multiple evaluation boundaries; neither proves a ready-made sauna route.\n\nFor Product B, ask an NRTL to document the proposed top-level standard and supplemental evaluations. Request the basis for including or excluding an ESS pathway. Preserve uncertainty until the response addresses the actual architecture.\n\n**Deliverable:** a scope matrix with rows for cell, pack, charger, DC path, AC path, control, finished appliance, transport and installation. Each row needs evidence and an open-question owner.`,
    "What does UL 9540A testing alone establish?",
    [
      "UL 9540 product listing",
      "Evidence from a defined fire-propagation test configuration",
      "Permission for every residential location",
    ],
    "Evidence from a defined fire-propagation test configuration",
    "A test method report, system certification and installation acceptance are distinct.",
    "Your supplier offers a UL 1973 pack and UN 38.3 summary. What is still unresolved for an integrated sauna?",
    [
      "Finished-appliance and interface scope",
      "Thermal/abnormal operation and installation",
      "Actual model records and lab determination",
    ],
  ),
  module(
    "dc",
    "High-current DC systems",
    "Low nominal voltage can still carry severe fault and thermal energy.",
    ["battery", "controls"],
    ["ess"],
    "Explain the implications of 125–208 A nominal current without selecting unverified hardware.",
    `## The 48V tradeoff\nAt 48 V, 6 kW requires 125 A and 10 kW about 208 A before losses. Current rises when voltage falls for a constant-power load. At these currents, small resistance can create substantial heat and voltage drop. A hypothetical 1 mΩ path at 200 A dissipates 40 W; actual joints and conductors require measured, rated designs.\n\nDC interruption differs from AC interruption because there is no periodic current zero. AC-only ratings do not establish DC breaking capability. Consider working voltage, prospective fault current, interrupt rating, time-current behavior, polarity conditions, enclosure and coordination. Do not select a fuse, contactor or conductor solely from normal operating current.\n\nBusbars, terminals, conductor routing, touch protection, mechanical restraint, service isolation and stored energy need system review. Precharge may be relevant where capacitive inputs cause inrush; it introduces its own control and failure modes. Higher voltage can reduce current but increases insulation and shock-protection questions.`,
    `## Compare architectures before optimizing parts\nPrepare 48 V and higher-voltage concepts using the same delivered power and energy assumptions. Compare current, loss, fault protection, insulation, accessible energy, serviceability, supply chain and certification scope. Do not treat the lower current option as automatically safer.\n\nA battery disconnect command is only one part of a safety function. What if its contactor welds, a sensor fails or communications stop? Identify the remaining energy path and independently justified protective layers. Avoid live fault experiments; an engineering lab must define safe methods and acceptance criteria.\n\n**Deliverable:** an architecture comparison with assumptions and a protection coordination question list for a qualified battery/power engineer.`,
    "Can an AC switch with a sufficient ampere label automatically interrupt the battery path?",
    [
      "Yes",
      "No; its DC application and breaking capability need verification",
      "Yes below 60V",
    ],
    "No; its DC application and breaking capability need verification",
    "Normal current, DC switching capability and prospective fault interruption are different ratings.",
    "A nominal 48V pack supplies 10kW. Explain the current and why it is not enough to choose a fuse.",
    [
      "208 A nominal before losses",
      "Actual voltage and prospective fault current",
      "DC interrupt rating and coordination evidence",
    ],
  ),
  module(
    "architecture",
    "Integrated heater architecture",
    "Define safe states and failure responses before trusting software coordination.",
    ["dc", "battery-cert", "thermal"],
    ["ess", "ul875", "impulse"],
    "Draft an integrated safety argument and a lab inquiry without presuming feasibility.",
    `## Separate operating states from protective states\nUseful operating states include standby, charging, rapid heat, sustaining heat, cooldown and service isolation. Fault or overtemperature states must specify what energy paths become unavailable and what recovery requires. “Software turns it off” is not a complete failure response.\n\nAC input allocation must cover heater, charger, auxiliaries and credible failure conditions. A control strategy that normally alternates loads still needs evidence for a stuck output or lost communication. If the battery depletes, the product should transition predictably rather than silently exceed AC demand or defeat a protective limit.\n\nUse FMEA to connect each fault to a hazard, detection, mitigation, independence, verification and residual uncertainty. Analyze common-cause faults: shared supply, processor, sensor location, harness or thermal environment. More rows do not improve an FMEA if every mitigation depends on the failed device.`,
    `## Certification feasibility matrix\nCompare an integrated hot-zone battery, a separated battery module and a conventional AC heater. For each option record performance, mass, cost, serviceability, thermal exposure, interconnection hazards and unanswered scope questions. No option is “certified” because its parts have marks.\n\nSend the NRTL a block diagram and state table with all AC/DC interfaces, intended residential environment, energy/power limits and protective functions. Ask whether UL 875 or the applicable UL 60335 path can cover the assembly, and which supplemental evaluations are necessary. Ask for written scope assumptions and change triggers.\n\n**Deliverable:** an unresolved-question register, not a fictional certification decision.`,
    "A charger and AC heater normally alternate. What remains to be analyzed?",
    [
      "Nothing",
      "Stuck outputs, loss of control and maximum coincident AC input",
      "Only average daily energy",
    ],
    "Stuck outputs, loss of control and maximum coincident AC input",
    "Normal scheduling does not establish safe demand or protection under credible failures.",
    "Battery energy is depleted midway through a session while the AC heater cannot sustain temperature. Define user-visible behavior and safety constraints.",
    [
      "Predictable degraded operation",
      "No branch overloading or bypassed limits",
      "Fault/restart states and evidence requirements",
    ],
  ),
  module(
    "cooking",
    "Adjacent appliances as evidence",
    "Learn from battery cooking without copying its certification path.",
    ["architecture"],
    ["copper", "impulse"],
    "Extract transferable engineering lessons while preserving product-category boundaries.",
    `## Similar architecture, different hazards\nA battery cooking appliance can decouple short peak output from branch input. That makes input allocation, storage state, conversion losses and degraded operation useful comparison topics for Product B. It does not make UL 858, the household electric range standard, the top-level sauna standard.\n\nResearch families for adjacent products include UL 858 for household ranges, UL 1026 for relevant household cooking appliances, UL 197 for commercial cooking, UL 60730 for controls, UL 1973 for relevant batteries and UL 1741 for relevant conversion equipment. Radio/EMC obligations may also need separate review. Intended use determines scope; standards names are not interchangeable.\n\nManufacturer case histories can reveal evaluation boundaries and product constraints. They generally do not publish full lab reports, all failures, cost or every approval condition. Do not invent those details.`,
    `## Make the comparison useful\nBuild a table comparing the Charlie range, Impulse cooktop and Product B: appliance category, battery location/energy, AC input, peak output, protective controls, battery evidence, finished-product evidence and unresolved installation questions. Label each datum as verified fact, manufacturer statement, interpretation or unknown.\n\nA useful inference is “early lab involvement can clarify interface scope.” An unsupported inference is “their lab accepted a battery cooktop, so my battery sauna is approved.” Likewise a manufacturer’s UL 9540A test claim is not proof of an independent UL 9540 listing.\n\n**Deliverable:** three transferable questions and three conclusions that cannot transfer.`,
    "Does a battery cooktop’s UL 858 certification establish a sauna pathway?",
    [
      "Yes",
      "No; only architecture questions and evidence methods may transfer",
      "Yes if both are resistive heaters",
    ],
    "No; only architecture questions and evidence methods may transfer",
    "Appliance category, environment and evaluated construction prevent direct transfer of a listing.",
    "Copper describes component recognition and a finished-range certification. How would you verify both claims and use them cautiously?",
    [
      "Exact model and independent directory",
      "Separate component conditions from finished scope",
      "No automatic sauna or ESS conclusion",
    ],
  ),
  module(
    "manufacturing",
    "Manufacturing and critical quality",
    "Certification evidence must survive purchasing and production.",
    ["testing", "controls"],
    ["cpsc", "osha"],
    "Create a proportional supplier-quality and traceability plan for a safety-critical appliance.",
    `## Control the construction\nA critical BOM, controlled drawings and firmware versions define what was evaluated. Incoming inspections verify identity and relevant characteristics; they cannot be replaced by a supplier’s generic certificate. Track model, lot or serial, supplier, production date and deviations so a field defect can be bounded.\n\nTermination quality depends on compatible parts, preparation, specified assembly methods and verified process control. Torque values and production test limits must come from approved design and laboratory requirements; this course does not invent them. Record calibrated tools and results where required by the manufacturing plan.\n\nProduction safety tests, functional checks and sampled audits serve different purposes. A functional heater that gets hot can still have an open protective-earth path or an incorrect critical part. Ask the certification body about required production tests and follow-up inspections for the actual program.`,
    `## A supplier changes insulation\nThe factory substitutes a visually similar wire with a different insulation system. Trace affected lots, stop unreviewed release and compare the approved construction, temperature/environment ratings and certification conditions. Determine whether lab review or retesting is required.\n\nA corrective action should identify containment, root cause, correction, prevention and effectiveness evidence. A customer complaint is not simply a support ticket if it indicates a possible safety defect. Keep field evidence and involve the responsible safety/regulatory professional promptly.\n\n**Deliverable:** supplier audit checklist, deviation log and critical change request linked to the product track.`,
    "Is a functional “gets hot” check enough for production release?",
    [
      "Yes",
      "No; approved construction and required safety/process evidence are separate",
      "Yes if the first sample was certified",
    ],
    "No; approved construction and required safety/process evidence are separate",
    "Production conformity requires controlled parts, processes and relevant safety evidence beyond function.",
    "A batch uses an unapproved terminal. What containment and evidence would you request?",
    [
      "Traceability and affected-unit containment",
      "Compare approved conditions and review change",
      "Corrective action and effectiveness verification",
    ],
  ),
  module(
    "installation",
    "Legal installation and field responsibility",
    "Product certification is one input to a lawful installation and business process.",
    ["branch", "manufacturing"],
    ["nec", "cpsc", "osha"],
    "Map manufacturer, importer, installer and AHJ responsibilities without assuming one approval covers all.",
    `## Identify the decision makers\nProduct evaluation, electrical permitting, building/fire requirements, installation qualifications, consumer-product reporting and insurance are different responsibilities. A certification mark does not replace a permit or compliance with installation instructions. An AHJ decision at one address is not universal approval of all future units.\n\nFor California and San Francisco, check the effective state code edition, local amendments, permit type and project-specific requirements with the responsible authority. The academy does not assert a current local amendment or permit exemption without an authoritative source. Residential rental use may introduce additional practical obligations; get qualified advice rather than inferring them from a sales page.\n\nAn importer/manufacturer remains responsible for the actual product and represented claims. Private-label branding, modifications and assembly can affect who must maintain evidence, handle incidents and coordinate corrective action. Contracts and insurance do not physically eliminate a hazard.`,
    `## Installation evidence packet\nPrepare exact model and ratings, certification record, installation manual, electrical requirements, environmental limits, clearances from the evaluated configuration, site details and permit questions. Record the AHJ response and its project scope. Keep installer and owner handover records.\n\nFor field failures, preserve the product identity and evidence, prevent further exposure as appropriate and assess reporting/recall obligations with qualified help. Do not change labels or silently substitute parts to make the paperwork appear to match.\n\n**Deliverable:** a responsibility matrix and installation checklist with explicit unresolved items.`,
    "A heater has an NRTL mark. Are all local installation questions resolved?",
    [
      "Yes",
      "No; adopted rules, instructions, site and AHJ requirements remain",
      "Only the insurance company decides",
    ],
    "No; adopted rules, instructions, site and AHJ requirements remain",
    "Product scope and site approval address different questions.",
    "You import a certified heater and modify its controls before renting it. What must be investigated?",
    [
      "Changed construction and marking authorization",
      "Manufacturer/importer and field responsibilities",
      "Site approval and installation evidence",
    ],
  ),
  module(
    "project",
    "Run a certification project",
    "A good inquiry narrows uncertainty before costly hardware commitments.",
    ["sauna", "testing", "architecture", "installation"],
    ["osha", "ess", "cpsc"],
    "Prepare an NRTL inquiry, compare proposals and maintain a live evidence register.",
    `## Ask for a bounded scope\nStart with intended use, markets, product boundary, ratings, model variants, environment, connection, architecture and protective functions. Include drawings and a preliminary hazard analysis. Ask for proposed standards/editions, supplemental evaluations, representative samples, abnormal tests, documentation, factory follow-up and change policy.\n\nCompare laboratories on relevant recognition scope and technical fit as well as price and schedule. Ask what assumptions the quotation excludes, which findings can trigger redesign and which work products you will receive. A quote is not a certification decision; a preliminary opinion can change when construction is reviewed.\n\nMaintain requirements, engineering decisions and certification questions separately. A proposed requirement is not verified merely because you decide to pursue it. Tie verified status to evidence and preserve rejected options with rationale so the same unsupported assumptions do not return.`,
    `## Your capstone package\nFor Product A, present the 120 V power/connection feasibility matrix, thermal and electrical hazard analysis, critical BOM, protection concept and proposed test plan. For Product B, add battery/converter evidence, power allocation, state/fault analysis, placement alternatives and the unresolved top-level certification pathway.\n\nThe package should be understandable to a lab that has never spoken to you. List assumptions, evidence limits, open decisions and the response you need for each. Update the package after each lab exchange, retaining dates and model revisions.\n\n**Deliverable:** a concise RFQ and comparison scorecard. Mark milestones complete when the required evidence exists, not when the calendar date passes.`,
    "A lab quotation names a standard. Has the product been certified?",
    [
      "Yes",
      "No; scope agreement and successful evaluation are still needed",
      "Yes if a deposit is paid",
    ],
    "No; scope agreement and successful evaluation are still needed",
    "A proposal, preliminary scope opinion, test result and marking authorization are different project states.",
    "Two labs quote different standard sets for Product B. How do you compare their proposals?",
    [
      "Ask for scope assumptions and written rationale",
      "Check relevant recognition and interface coverage",
      "Compare exclusions, samples, follow-up and change policy",
    ],
  ),
];
export const fundamentals: Question[] = [
  {
    id: "diag-current",
    concept: "branch",
    type: "numeric",
    prompt:
      "At nominal 120 V, what current does a 2,000 W resistive heater draw? Enter amperes.",
    numeric: 2000 / 120,
    tolerance: 0.15,
    units: "A",
    explanation:
      "I = P/V = 16.67 A. This calculation alone does not approve a branch circuit.",
    rubric: [],
    sources: ["nec"],
  },
  {
    id: "diag-contact",
    concept: "electrical",
    type: "numeric",
    prompt:
      "A hypothetical 0.05 Ω connection carries 16 A. How much heat is dissipated at that connection? Enter watts.",
    numeric: 12.8,
    tolerance: 0.15,
    units: "W",
    explanation:
      "P = I²R = 256 × 0.05 = 12.8 W locally, even without branch overcurrent.",
    rubric: [],
    sources: [],
  },
  {
    id: "diag-energy",
    concept: "battery",
    type: "numeric",
    prompt: "Ignoring all losses, how many minutes can 5 kWh deliver 10 kW?",
    numeric: 30,
    tolerance: 0.1,
    units: "min",
    explanation:
      "5/10 hours = 0.5 hours = 30 minutes. Real usable duration is lower.",
    rubric: [],
    sources: [],
  },
];
export const questions = [
  ...fundamentals,
  ...modules.flatMap((m) => m.questions),
];
export const questionById = Object.fromEntries(questions.map((q) => [q.id, q]));
// Additional formats use the same explicit rubric and evidence policy as module practice.
const supplemental: Question[] = [
  {
    id: "regulation-source",
    concept: "regulation",
    type: "source_interpretation",
    prompt:
      "An OSHA NRTL program page identifies recognized laboratories and their scopes. Does that page prove a particular sauna model is certified? Explain what record you would need next.",
    explanation:
      "Program recognition concerns laboratories and scopes, not every individual model.",
    rubric: [
      "Distinguish laboratory recognition from product certification",
      "Request exact-model certification record and authorized scope",
    ],
    transfer: true,
    sources: ["osha"],
  },
  {
    id: "branch-unknown",
    concept: "branch",
    type: "insufficient_information",
    prompt:
      "A customer has a 20A receptacle and wants a 2kW heater. You have no nameplate, listing instructions, circuit details or adopted-code information. State what is known, what is unknown and whether you can approve the installation.",
    explanation:
      "16.7A nominal can be calculated; installation acceptability cannot be inferred.",
    rubric: [
      "Calculate approximately 16.7 A at 120V",
      "Decline an unsupported approval",
      "Identify circuit, nameplate, instructions and adopted rules as missing evidence",
    ],
    transfer: true,
    sources: ["nec", "ul875"],
  },
  {
    id: "electrical-error",
    concept: "electrical",
    type: "identify_error",
    prompt:
      "Find the error: “Our independent high-limit sensor runs through the normal controller and its same welded output relay, so it will shut off a relay-weld fault.”",
    explanation: "An additional sensor cannot open a welded shared actuator.",
    rubric: [
      "Identify the shared welded actuator as defeating interruption",
      "Distinguish sensing from independent energy interruption",
      "Identify common-cause or shared-controller dependencies",
    ],
    transfer: true,
    sources: ["ul875"],
  },
  {
    id: "battery-short",
    concept: "battery-cert",
    type: "short_answer",
    prompt:
      "In your own words, distinguish UL 9540 certification from a UL 9540A test report. Give one concrete scope detail you would check in the report.",
    explanation:
      "One is a system certification framework; the other is evidence from a defined fire-propagation test method.",
    rubric: [
      "Distinguish product/system certification from fire-test method",
      "Identify configuration, test level or report conditions",
      "Do not infer a listing from testing alone",
    ],
    transfer: true,
    sources: ["ess", "9540a"],
  },
];
for (const q of supplemental) {
  questions.push(q);
  questionById[q.id] = q;
  modules.find((m) => m.id === q.concept)!.questions.push(q);
}
