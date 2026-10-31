# Electrical Safety & Certification Academy
## Modules 5–6: Complete Curriculum Content

### Instructions to Codex

Add or replace Modules 5 and 6 in the existing curriculum at `/learn-certify`.

Preserve all other modules, existing navigation, and saved progress.

For each topic, display:

- A learning objective.
- Specific readings with clickable links and summaries.
- A completion checkbox for each reading.
- Individual checkboxes for every mastery question.
- An applied exercise where specified.

Do not substitute generic AI-generated lessons for this material.

Standards catalog links should be labeled as catalog links, not direct access to full documents. Do not invent clause numbers or test limits.

---

# Module 5: Safety Engineering and Failure Analysis

**Objective:** Learn systematic methods for identifying hazards, analyzing failures, evaluating risk, and designing independent safety protections for electrical appliances.

## Topic 5.1: Hazard Identification and Risk Assessment

### Readings

**1. [NASA Systems Engineering Handbook](https://www.nasa.gov/reference/nasa-systems-engineering-handbook/)**

Summary: Introduces structured engineering methods for identifying risks, defining requirements, and verifying that systems meet their objectives. Focus on the relationship between hazards, design decisions, verification, and lifecycle risk management.

**2. [ISO 12100, ISO Standards Catalog](https://www.iso.org/standards.html)**

Summary: General machinery safety standard covering hazard identification, risk estimation, risk evaluation, and risk reduction. Useful as a conceptual framework, although it is not automatically the governing standard for household sauna heaters.

**3. [ASQ: Risk Management](https://asq.org/quality-resources/risk-management)**

Summary: Introduces risk identification, assessment, prioritization, mitigation, and monitoring.

### Mastery questions

- [ ] What is the difference between a hazard and a risk?
- [ ] How do severity and likelihood affect risk?
- [ ] What is residual risk?
- [ ] What is the hierarchy of risk reduction?
- [ ] Why is eliminating a hazard generally preferable to adding a warning label?
- [ ] What is the difference between preventing a hazardous event and reducing its consequences?
- [ ] How should uncertainty be documented in a risk assessment?
- [ ] Why can a low-probability event still justify substantial protective measures?
- [ ] How do product safety standards relate to a manufacturer's own risk assessment?

### Applied exercise

Identify at least ten hazards associated with a 120V traditional sauna heater installed inside a small wooden cabin.

Classify them as electrical, thermal, mechanical, control-related, installation-related, or manufacturing-related.

For each hazard, describe the potential consequence and a possible risk-reduction strategy.

---

## Topic 5.2: Failure Mode and Effects Analysis (FMEA)

### Readings

**1. [ASQ: Failure Mode and Effects Analysis](https://asq.org/quality-resources/fmea)**

Summary: Introduces FMEA, including failure modes, causes, effects, severity, occurrence, detection, and corrective actions.

**2. [NASA Systems Engineering Handbook](https://www.nasa.gov/reference/nasa-systems-engineering-handbook/)**

Summary: Provides a systems-engineering context for identifying failure modes and connecting them to requirements, risks, and verification activities.

### Mastery questions

- [ ] What is an FMEA?
- [ ] What is the difference between a failure mode, failure cause, and failure effect?
- [ ] How does FMEA differ from a general hazard list?
- [ ] What is the purpose of severity, occurrence, and detection ratings?
- [ ] What are the limitations of multiplying these ratings into a risk priority number?
- [ ] Why should a low-probability but catastrophic failure not be dismissed automatically?
- [ ] How do you identify existing preventive and detective controls?
- [ ] How does FMEA influence design changes?
- [ ] When should an FMEA be updated?

### Applied exercise

Perform a preliminary FMEA for a sauna heater containing:

- Resistive heating elements.
- Thermostat.
- Relay.
- Mechanical timer.
- Independent high-limit cutoff.
- Temperature sensor.
- Supply cord.
- Heating-element terminals.

Include at least one failure mode for each component.

---

## Topic 5.3: Fault-Tree Analysis

### Readings

**1. [NASA Fault Tree Handbook with Aerospace Applications](https://ntrs.nasa.gov/citations/20020021862)**

Summary: Detailed introduction to fault-tree analysis, including top events, contributing failures, logical relationships, and common-cause considerations.

**2. [NASA Systems Engineering Handbook](https://www.nasa.gov/reference/nasa-systems-engineering-handbook/)**

Summary: Explains how fault analysis contributes to system safety and risk management.

### Mastery questions

- [ ] What is a fault tree?
- [ ] How does fault-tree analysis differ from FMEA?
- [ ] What is a top event?
- [ ] What is the difference between AND and OR gates in a fault tree?
- [ ] What is a minimal cut set?
- [ ] What is a common-cause failure?
- [ ] Why can apparently redundant protections fail together?
- [ ] How can a fault tree reveal weaknesses in protective architecture?
- [ ] What are the limitations of assigning numerical probabilities without adequate data?

### Applied exercise

Construct a fault tree for the top event:

**"Sauna heater continues generating heat after a dangerous overtemperature condition develops."**

Consider primary control failure, independent protective-control failure, sensing failures, and common-cause failures.

Do not assume that every possible failure combination has the same probability.

---

## Topic 5.4: Single-Fault Conditions and Independent Protection

### Readings

**1. [UL 60335-1, UL Standards Catalog](https://www.shopulstandards.com/)**

Summary: General household appliance safety framework, including abnormal-operation and protective-construction concepts. Study the relevant requirements using the applicable edition.

**2. [UL 60730-1, UL Standards Catalog](https://www.shopulstandards.com/)**

Summary: Safety requirements for automatic electrical controls. Investigate the distinction between normal regulation and protective functions.

**3. [IEC 61508, IEC Webstore](https://webstore.iec.ch/)**

Summary: General functional safety framework for safety-related systems. Useful for understanding independence, systematic failures, and safety functions, without assuming this standard applies directly to sauna certification.

### Mastery questions

- [ ] What is a single-fault condition?
- [ ] What is the difference between normal temperature regulation and safety protection?
- [ ] Why might a thermostat alone be insufficient?
- [ ] What does independent protection mean?
- [ ] Can two protective devices share a common failure mechanism?
- [ ] What happens if a relay welds closed?
- [ ] What happens if a temperature sensor fails?
- [ ] Why might a manual-reset high-limit control be preferable in some applications?
- [ ] How does protective-control placement affect effectiveness?
- [ ] What evidence demonstrates that a protective function is sufficiently independent?

### Applied exercise

Analyze a heater whose primary thermostat controls a relay and whose independent thermal cutoff interrupts heating during excessive temperatures.

Identify potential single faults and common-cause failures. Explain what must be verified to determine whether the protective arrangement is adequate.

---

## Topic 5.5: Fail-Safe Design and Safety Architecture

### Readings

**1. [NASA Systems Engineering Handbook](https://www.nasa.gov/reference/nasa-systems-engineering-handbook/)**

Summary: Systems engineering principles for requirements, risk reduction, verification, and lifecycle safety.

**2. [IEC: Functional Safety](https://www.iec.ch/functional-safety)**

Summary: Introduces safety functions, safety-related systems, and the importance of systematic design and verification.

**3. [UL 60730-1, UL Standards Catalog](https://www.shopulstandards.com/)**

Summary: Investigate control-system construction, fault behavior, and protective-function evaluation.

### Mastery questions

- [ ] What does fail-safe mean?
- [ ] Why is fail-safe behavior dependent on the hazard and operating context?
- [ ] What is a safe state for a sauna heater?
- [ ] What is the difference between fault detection and fault prevention?
- [ ] What is the difference between redundancy and diversity?
- [ ] Why is software-only shutdown not always sufficient?
- [ ] What happens if the controller loses power?
- [ ] What happens if the controller freezes?
- [ ] What happens if the temperature sensor becomes disconnected?
- [ ] How should protective systems behave after a fault is detected?

### Applied exercise

Propose a high-level protective-control architecture for Product A.

Identify the normal temperature-control function, independent protective functions, expected behavior after faults, and evidence needed to validate the architecture.

---

## Topic 5.6: Safety-Related Software and Control Failures

### Readings

**1. [UL 60730-1, UL Standards Catalog](https://www.shopulstandards.com/)**

Summary: Study requirements relevant to electronic controls and software-dependent safety functions.

**2. [NASA Software Engineering Handbook](https://swehb.nasa.gov/)**

Summary: Introduces requirements traceability, software verification, fault management, and disciplined development of software-dependent systems.

### Mastery questions

- [ ] What is the difference between a software bug and a hardware failure?
- [ ] What is a watchdog timer?
- [ ] What are the limitations of watchdogs?
- [ ] Why can communication failures create unsafe operating states?
- [ ] What is a safety-related control function?
- [ ] Why should critical protective functions not depend solely on an internet connection?
- [ ] What happens if a controller's temperature reading is incorrect?
- [ ] What is requirements traceability?
- [ ] How should firmware changes be evaluated for safety impact?

### Applied case

A sauna controller uses a microcontroller to regulate temperature. A software fault leaves the heating command enabled indefinitely.

Explain the hazards, the protective mechanisms that should be considered, and the evidence required to evaluate whether the system remains safe.

---

## Topic 5.7: Risk Reduction and Verification

### Readings

**1. [ISO 12100, ISO Standards Catalog](https://www.iso.org/standards.html)**

Summary: General risk-reduction framework emphasizing inherently safer design, safeguarding, and information for use.

**2. [NASA Systems Engineering Handbook](https://www.nasa.gov/reference/nasa-systems-engineering-handbook/)**

Summary: Connects risk reduction to requirements, verification, validation, and engineering evidence.

**3. [UL Solutions: Product Certification](https://www.ul.com/services/certification)**

Summary: Introduces third-party product evaluation and the role of certification in demonstrating compliance with defined safety requirements.

### Mastery questions

- [ ] How do you decide which hazards require additional controls?
- [ ] What is the difference between eliminating a hazard and mitigating it?
- [ ] What is residual risk?
- [ ] How can testing demonstrate that a protective measure works?
- [ ] Why must risk analysis be updated after design changes?
- [ ] Why does certification not eliminate all product risk?
- [ ] How should safety requirements be traced to verification evidence?

### Module 5 capstone

Create a preliminary safety engineering report for Product A containing:

1. Hazard register.
2. FMEA.
3. Fault tree for uncontrolled heating.
4. Identification of safety-critical components.
5. Protective-control architecture.
6. Verification requirements.
7. Unresolved questions requiring laboratory review.

---

# Module 6: Sauna Safety Standards and Certification

**Objective:** Understand the standards governing traditional electric sauna heaters, how those standards are interpreted, and how they affect the design and certification of a 120V residential sauna heater.

## Topic 6.1: UL 875, Electric Dry-Bath Heaters

### Readings

**1. [UL 875, UL Standards Catalog](https://www.shopulstandards.com/)**

Summary: The traditional North American standard for electric dry-bath heaters and relevant associated equipment. Study the scope, definitions, construction requirements, normal operation, abnormal operation, protective controls, markings, and installation requirements.

**2. [UL Solutions: Product Certification](https://www.ul.com/services/certification)**

Summary: Provides context for how a product is evaluated and certified against an applicable standard.

### Mastery questions

- [ ] What products fall within the scope of UL 875?
- [ ] Does UL 875 cover heaters, prefabricated sauna rooms, or both under specified conditions?
- [ ] What construction requirements are relevant to a traditional heater?
- [ ] What normal-operation tests are relevant?
- [ ] What abnormal-operation tests are relevant?
- [ ] What protective-control requirements need to be investigated?
- [ ] How are combustible-material clearances addressed?
- [ ] What markings and installation instructions are required?
- [ ] How does UL 875 influence heater design decisions?
- [ ] What must be confirmed using the actual standard rather than a public summary?

---

## Topic 6.2: UL 60335-1, General Household Appliance Safety

### Readings

**1. [UL 60335-1, UL Standards Catalog](https://www.shopulstandards.com/)**

Summary: General safety requirements for household and similar electrical appliances. Study electric shock protection, electrical construction, heating, abnormal operation, insulation, protective controls, and component suitability.

**2. [IEC 60335-1, IEC Webstore](https://webstore.iec.ch/)**

Summary: International general appliance safety standard. Compare the IEC framework with its US adoption and national differences.

### Mastery questions

- [ ] What is the purpose of a general appliance safety standard?
- [ ] How does UL 60335-1 interact with product-specific Part 2 standards?
- [ ] What types of electrical hazards does it address?
- [ ] How does it treat abnormal operation?
- [ ] What is the relationship between component suitability and appliance certification?
- [ ] Why are national differences important?
- [ ] Can UL 60335-1 alone establish that a sauna heater meets all applicable safety requirements?

---

## Topic 6.3: UL 60335-2-53, Sauna Heating Appliances

### Readings

**1. [UL 60335-2-53, UL Standards Catalog](https://www.shopulstandards.com/)**

Summary: US sauna-specific safety standard. Study its scope, requirements for sauna heating appliances and infrared cabins, protective controls, thermal behavior, and construction requirements.

**2. [UL 60335-1, UL Standards Catalog](https://www.shopulstandards.com/)**

Summary: General requirements used together with the applicable Part 2 standard.

### Mastery questions

- [ ] What products are covered by UL 60335-2-53?
- [ ] How does it relate to UL 60335-1?
- [ ] How does its scope compare with UL 875?
- [ ] What requirements are specific to sauna heating?
- [ ] How does it address temperature regulation and protective controls?
- [ ] What abnormal operating conditions need evaluation?
- [ ] What national differences are relevant to US certification?
- [ ] Can a manufacturer choose between UL 875 and UL 60335-2-53 without laboratory agreement?
- [ ] What would determine which standard applies to Product A?

---

## Topic 6.4: IEC 60335-2-53 and International Certification

### Readings

**1. [IEC 60335-2-53, IEC Webstore](https://webstore.iec.ch/)**

Summary: International safety requirements for sauna heating appliances and infrared cabins. Study the scope and compare relevant editions with the US standard.

**2. [IECEE CB Scheme](https://www.iecee.org/)**

Summary: Explains international testing and certification mechanisms that can support national approvals.

**3. [OSHA: NRTL Program](https://www.osha.gov/nationally-recognized-testing-laboratory-program)**

Summary: Explains the US recognition framework for product safety certification.

### Mastery questions

- [ ] What is the relationship between IEC and UL standards?
- [ ] What are national differences?
- [ ] What is a CB Test Certificate?
- [ ] What is a CB Test Report?
- [ ] Does IEC compliance automatically establish US certification?
- [ ] Why might a manufacturer use IEC-based testing?
- [ ] How could international test evidence support a US certification project?
- [ ] What additional verification might be required?

---

## Topic 6.5: UL 499, UL 1278, and UL 2021

### Readings

**1. [UL 499, UL Standards Catalog](https://www.shopulstandards.com/)**

Summary: General electric heating appliance standard. Study its scope and exclusions to understand whether a particular heater falls within this category.

**2. [UL 1278, UL Standards Catalog](https://www.shopulstandards.com/)**

Summary: Standard for movable and wall- or ceiling-hung electric room heaters. Compare its intended product category with sauna heating appliances.

**3. [UL 2021, UL Standards Catalog](https://www.shopulstandards.com/)**

Summary: Standard for fixed and location-dedicated electric room heaters. Study its scope and differences from sauna-specific requirements.

### Mastery questions

- [ ] What products does UL 499 cover?
- [ ] What products does UL 1278 cover?
- [ ] What products does UL 2021 cover?
- [ ] How do general room heaters differ from traditional sauna heaters?
- [ ] Why do sauna heaters have dedicated safety standards?
- [ ] Can a manufacturer classify a sauna heater as a room heater simply because it uses resistive heating?
- [ ] What role do scope exclusions play?
- [ ] What questions should be asked before pursuing an alternative classification?

---

## Topic 6.6: Heater-Only Versus Complete Sauna Certification

### Readings

**1. [UL 875, UL Standards Catalog](https://www.shopulstandards.com/)**

Summary: Investigate the standard's treatment of heaters and associated sauna equipment, including the scope of certification and installation conditions.

**2. [UL 60335-2-53, UL Standards Catalog](https://www.shopulstandards.com/)**

Summary: Investigate the scope of sauna heating appliances and infrared cabins, and the distinction between heater evaluation and complete appliance evaluation.

**3. [UL Solutions: Field Evaluations](https://www.ul.com/services/field-evaluations)**

Summary: Provides context for evaluating installed equipment and assemblies that may not be covered by a conventional product listing.

### Mastery questions

- [ ] What does it mean to certify a heater alone?
- [ ] What does it mean to certify a complete sauna assembly?
- [ ] What installation conditions might accompany heater-only certification?
- [ ] Can a certified heater be installed in any wooden enclosure?
