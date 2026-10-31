# Codex Prompt: Build My Electrical Safety & Certification Curriculum Explorer

## 1. What to build

Build a simple, mobile-friendly curriculum application at `/learn-certify` on my existing website.

This is a **personal, structured reading and learning checklist** covering electrical safety, sauna heater design, UL certification, residential LFP batteries, battery-integrated appliances, and real-world hardware certification case studies.

The curriculum content is provided explicitly below. **Implement all of it. Do not replace it with AI-generated summaries, generic lessons, placeholders, or a shorter curriculum.**

You may inspect the repository, ask clarifying questions about implementation, and make a plan before coding.

The app should be substantially simpler than a typical LMS.

### Navigation

Use three levels:

**Level 1: Sections**

Display the major sections, such as Regulatory Foundations, Electrical Safety Engineering, Sauna Standards, Battery Engineering, and Case Studies.

**Level 2: Topics**

Clicking a section displays all its topics, each with its title, progress, and reading count.

**Level 3: Topic detail**

Clicking a topic opens a page containing:

1. A brief description of why the topic matters.
2. Specific learning objectives.
3. Questions I should be able to answer.
4. A checklist for each question.
5. A list of specific readings with direct links.
6. A concise summary explaining what each reading covers and why I should read it.
7. A checkbox for each reading.
8. An optional notes field.

### Example topic page

**Topic: NEC Continuous Loads and Residential Sauna Heaters**

*Why it matters:* My 1.7–2.2 kW sauna heaters may operate near the limits of common residential circuits. I need to understand how branch-circuit requirements actually apply.

**Questions I should be able to answer**

- [ ] What does the NEC mean by a continuous load?
- [ ] Does operating for less than three hours automatically permit a load above 80% of the circuit rating?
- [ ] Can a 2,000W heater operate on a 20A circuit?
- [ ] How do appliance listing conditions affect branch-circuit requirements?
- [ ] What's the difference between a 5-15 and 5-20 plug?
- [ ] What information would an NRTL need to evaluate this configuration?

**Readings**

- [ ] **NEC Article 100, Continuous Load.** Read the definition. Understand how the classification is determined, rather than memorizing an 80% rule. [NFPA 70](https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70)
- [ ] **NEC Article 210, Branch Circuits.** Study the provisions governing branch-circuit sizing and equipment ratings. [NFPA 70](https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70)
- [ ] **NEC Article 422, Appliances.** Study appliance-specific requirements and how listing instructions interact with circuit selection. [NFPA 70](https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70)

### Interaction requirements

- All reading checkboxes persist.
- All question checkboxes persist.
- Each topic displays completed readings / total readings and answered questions / total questions.
- Each section displays aggregate progress.
- Global progress dashboard.
- Search across section names, topic names, questions, and reading descriptions.
- Expand/collapse sections.
- Mobile-friendly navigation.
- Dark and light modes if already supported by the website.
- Notes saved per topic.
- Export/import progress as JSON.
- Optional "Mark all readings complete" and "Reset topic" actions.

Do not require authentication.

Use the existing website's stack and styling.

For persistence, use the simplest reliable approach. Browser local storage is acceptable for v1, with JSON export/import for backup. Do not introduce a backend unless one already exists and materially simplifies the implementation.

### Content rules

Every topic defined below must exist.

Every question must be an individually checkable item.

Every reading must have:

- Title.
- Direct URL.
- Specific document, section, or clause to read.
- Two-to-four-sentence summary.
- Why the reading matters for my goals.

If a link leads to a standards catalog or landing page rather than the full text, explicitly label it as a **catalog/access link**.

Do not invent page numbers, clause numbers, test thresholds, or technical requirements.

Where a source is paywalled, explain what can be learned from the public material and what requires full standards access.

Do not automatically check off questions when readings are completed. Reading and understanding are separate.

---

# 2. My engineering goals

The curriculum must be organized around two real product-development goals.

### Product A: Conventional AC sauna heater

- Traditional electric sauna heater.
- 120V AC.
- Approximately 1.7–2.2 kW.
- Intended for residential use.
- Ideally plug-in.
- Intended for small wooden sauna cabins.
- Must be designed for certification and legal installation.
- May be manufactured in China, imported, rented, installed, and sold in the US.

### Product B: Battery-assisted sauna heater

- Approximately 5–10 kWh LFP battery.
- Approximately 48V nominal DC architecture, subject to engineering evaluation.
- Approximately 6–10 kW of battery-powered DC resistive heating for rapid heatup.
- Approximately 1.2–2.2 kW of 120V AC heating for simultaneous and subsequent heating, subject to input limits.
- Intended to maintain sauna temperature for 40 minutes to three hours or longer.
- Charging from a residential 120V connection.
- Coordinated battery, charger, and heater controls.
- Independent safety protections.
- Certification pathway currently unknown.

I need to understand whether these designs are technically feasible, certifiable, and legally installable.

Do not assume that a proposed power level is permissible on a given circuit or that a particular battery standard automatically applies.

---

# 3. Complete curriculum content

Implement every section and topic below.

Each topic includes questions and specific reading assignments. Use the supplied reading summaries, improving clarity and accuracy where necessary without removing substantive content.

## SECTION I: Regulatory and Certification Foundations

### Topic 1.1: How US Electrical Product Regulation Works

**Why:** I need to distinguish legal requirements from voluntary standards, certification programs, and laboratory interpretations.

Questions:

- [ ] What's the difference between a law, regulation, code, standard, and certification?
- [ ] Who writes UL standards, and who certifies products?
- [ ] What is an NRTL?
- [ ] Why can multiple laboratories certify to the same standard?
- [ ] Does the US require all consumer electrical appliances to be UL Listed?
- [ ] How does product certification differ from legal installation approval?

Readings:

1. **OSHA, Nationally Recognized Testing Laboratory Program.** https://www.osha.gov/nationally-recognized-testing-laboratory-program
   Read the program overview and recognition requirements. Explains how laboratories are recognized, why recognition has a defined scope, and what NRTL certification signifies. Distinguish workplace equipment requirements from residential consumer-product requirements.

2. **UL Solutions, Certification Services.** https://www.ul.com/services/certification
   Read the overview of product certification. Understand that certification evaluates defined products against specified requirements and can involve ongoing production surveillance.

3. **CPSC, Business and Manufacturing.** https://www.cpsc.gov/Business--Manufacturing
   Read the overview of manufacturer responsibilities. Understand the separate federal consumer-product safety framework, including reporting and recall obligations.

### Topic 1.2: UL Listed, Recognized, Classified, and Field Evaluated

Questions:

- [ ] What does UL Listed mean?
- [ ] What does UL Recognized mean?
- [ ] What are Conditions of Acceptability?
- [ ] Why don't individually certified components certify a finished heater?
- [ ] What is a field evaluation?
- [ ] Can a field evaluation substitute for product listing in every installation?

Readings:

1. **UL Solutions, Certification Services.** https://www.ul.com/services/certification
   Focus on the scope of finished-product certification and component evaluation. A certification applies to a defined construction, not an unlimited family of similar products.

2. **UL Solutions, Field Evaluations.** https://www.ul.com/services/field-evaluations
   Read how individual equipment is evaluated outside conventional mass-production certification. Understand why field evaluation and product listing are not interchangeable.

3. **OSHA, NRTL Program.** https://www.osha.gov/nationally-recognized-testing-laboratory-program
   Review how certification marks and recognized laboratories relate to regulatory acceptance.

### Topic 1.3: Certification Laboratories and Recognition Scope

Questions:

- [ ] How do UL, Intertek, SGS, TÜV, MET, and CSA differ?
- [ ] How can I verify a certification?
- [ ] How do I verify whether a laboratory is recognized for a standard?
- [ ] Can a laboratory test to a standard outside its NRTL recognition scope?
- [ ] What documents should I request from a manufacturer claiming certification?

Readings:

1. **OSHA, Recognized Standards.** https://www.osha.gov/nationally-recognized-testing-laboratory-program/list-standards
   Learn that recognition is tied to specific standards and laboratory scopes.

2. **OSHA, SGS Recognition.** https://www.osha.gov/nationally-recognized-testing-laboratory-program/sgs
   Examine SGS as a real example. Use this when investigating HUUM's certificate.

3. **UL Product iQ.** https://productiq.ulprospector.com/
   Explore the certification-directory interface and how product categories, model numbers, and file numbers are used.

### Topic 1.4: IEC, UL, CSA, and the CB Scheme

Questions:

- [ ] What is an IEC standard?
- [ ] What does US national adoption mean?
- [ ] What are national differences?
- [ ] What is the IECEE CB Scheme?
- [ ] Can IEC test results support US certification?
- [ ] Why might a product certified in Europe still need additional evaluation in the US?

Readings:

1. **IECEE CB Scheme.** https://www.iecee.org/
   Read the scheme overview. Understand how test certificates and reports support national certification without guaranteeing automatic acceptance everywhere.

2. **IEC Webstore.** https://webstore.iec.ch/
   Locate IEC 60335-1 and IEC 60335-2-53. Read their official scopes and publication information.

3. **UL Standards Catalog.** https://www.shopulstandards.com/
   Locate UL 60335-1 and UL 60335-2-53. Compare their designations, editions, and US-specific context.

### Topic 1.5: AHJs, Permits, and Legal Installation

Questions:

- [ ] What is an Authority Having Jurisdiction?
- [ ] What does NEC equipment approval mean?
- [ ] Can an AHJ approve unlisted equipment?
- [ ] Does plugging into an existing receptacle eliminate all regulatory obligations?
- [ ] When is an electrical permit required?
- [ ] What requirements apply specifically in San Francisco?

Readings:

1. **NEC Articles 100 and 110.** https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70
   Study definitions of approval and listing and the general requirements for electrical equipment.

2. **California Building Standards Commission.** https://www.dgs.ca.gov/BSC/Codes
   Identify the currently applicable California Electrical, Building, and Fire Codes and their effective dates.

3. **San Francisco Department of Building Inspection.** https://www.sf.gov/departments/department-building-inspection
   Find the locally adopted electrical code, amendments, permit rules, and relevant approval procedures.

4. **UL Field Evaluations.** https://www.ul.com/services/field-evaluations
   Understand how field evaluation might support AHJ acceptance of equipment without conventional listing.

### Topic 1.6: Manufacturer, Importer, Installer, and Product Liability

Questions:

- [ ] What legal responsibilities does an appliance manufacturer have?
- [ ] What responsibilities does an importer have?
- [ ] What changes when a business rents rather than sells equipment?
- [ ] What is strict products liability?
- [ ] What is failure to warn?
- [ ] When must a manufacturer report a dangerous defect to the CPSC?
- [ ] How do recalls and product insurance interact with certification?

Readings:

1. **CPSC Business Guidance.** https://www.cpsc.gov/Business--Manufacturing
   Read about manufacturer and importer responsibilities.

2. **CPSC Reporting.** https://www.cpsc.gov/Business--Manufacturing/Recall-Guidance/Duty-to-Report-to-the-CPSC-Your-Rights-and-Responsibilities
   Study the duty to report potentially hazardous products and the difference between reporting obligations and voluntary recalls.

3. **CPSC Recalls.** https://www.cpsc.gov/Recalls
   Examine several electrical heating-appliance recalls to understand how product defects create real commercial and legal consequences.

---

## SECTION II: Residential Electrical Engineering and Codes

### Topic 2.1: NEC Structure and Interpretation

Questions:

- [ ] How is the NEC organized?
- [ ] Which articles apply to a plug-in sauna heater?
- [ ] How do definitions affect requirements?
- [ ] How do general and product-specific provisions interact?
- [ ] How do I determine which edition applies in a jurisdiction?

Readings:

1. **NEC Articles 90 and 100.** https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70
   Read the code's scope and definitions. These establish the framework for interpreting later requirements.

2. **NEC Article 110.** Same link.
   Study general equipment requirements, including approval, installation, use, and electrical connections.

3. **California Codes.** https://www.dgs.ca.gov/BSC/Codes
   Identify how California adopts and amends the national model code.

### Topic 2.2: Continuous Loads and Branch-Circuit Sizing

Questions:

- [ ] What is the NEC definition of a continuous load?
- [ ] How are continuous and noncontinuous loads treated?
- [ ] What is the origin of the common 80% rule?
- [ ] Does a two-hour operating duration automatically allow higher current?
- [ ] Can a 2,000W heater operate on a 20A circuit?
- [ ] Can a 2,200W heater operate on a 20A circuit?
- [ ] What changes if the heater is specifically evaluated and listed for a configuration?

Readings:

1. **NEC Article 100, Continuous Load.** https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70
   Read the definition carefully. Do not interpret it as a universal timer-based permission to exceed circuit design limits.

2. **NEC Article 210, Branch Circuits.** Same link.
   Study the rules governing circuit sizing, equipment ratings, and continuous loads.

3. **NEC Article 422, Appliances.** Same link.
   Study appliance-specific installation and rating requirements.

### Topic 2.3: 120V Plugs, Receptacles, and Circuits

Questions:

- [ ] What's the difference between NEMA 5-15 and 5-20?
- [ ] What receptacles can be used on a 20A branch circuit?
- [ ] When is a dedicated circuit required?
- [ ] What does a circuit breaker actually protect?
- [ ] Why might a heater need its own internal protective devices?
- [ ] How do receptacle and conductor ratings affect the installation?

Readings:

1. **NEC Article 210.** https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70
   Focus on receptacle and branch-circuit requirements.

2. **NEC Articles 240 and 250.** Same link.
   Read overcurrent protection and grounding/bonding provisions.

3. **NEMA Standards.** https://www.nema.org/standards
   Find the relevant wiring-device and plug/receptacle standards and reference material.

### Topic 2.4: GFCI, AFCI, Grounding, and Shock Protection

Questions:

- [ ] What is a ground fault?
- [ ] How does GFCI protection work?
- [ ] How does AFCI protection differ?
- [ ] What is protective grounding?
- [ ] What happens if the protective earth connection fails?
- [ ] How do these protections interact with an appliance's internal safety systems?

Readings:

1. **NEC Articles 210 and 250.** https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70
   Read relevant GFCI/AFCI and grounding requirements.

2. **OSHA Electrical Safety Resources.** https://www.osha.gov/electrical
   Read the general electrical shock and grounding safety explanations.

### Topic 2.5: Wiring, Terminals, and Overcurrent Protection

Questions:

- [ ] What determines conductor ampacity?
- [ ] Why does insulation temperature rating matter?
- [ ] Why can a loose terminal overheat without tripping a breaker?
- [ ] What causes contact resistance to increase?
- [ ] What are terminal torque requirements?
- [ ] How does thermal cycling affect electrical connections?

Readings:

1. **NEC Articles 110 and 240.** https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70
   Study electrical connections, conductor suitability, and overcurrent protection.

2. **UL 486 series.** https://www.shopulstandards.com/
   Catalog/access link. Study the scope of wire connector and terminal standards.

3. **UL 758.** Same catalog.
   Study appliance wiring material classifications and ratings.

### Topic 2.6: Cord-Connected Versus Hardwired Appliances

Questions:

- [ ] What distinguishes a cord-connected appliance from permanently installed equipment?
