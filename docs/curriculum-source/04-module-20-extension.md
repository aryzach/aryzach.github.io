# Curriculum Extension: Complete Module 20 and Add Modules 21–24

Add the following material to the existing Electrical Safety & Certification Academy curriculum.

Preserve the existing modules, topics, readings, and progress data. Do not replace or regenerate Modules 1–19.

For each topic below, implement the same interface as the existing curriculum:

- Topic title and learning objective.
- Specific reading resources with clickable links.
- A concise summary explaining what each reading teaches and why it matters.
- Checkable questions I should be able to answer after completing the readings.
- Persistent completion state for each reading and question.
- Applied engineering exercises where specified.

Do not automatically mark a question mastered merely because I checked it. Treat the checkbox as a self-assessment.

All standards links should point to the appropriate official catalog or publisher page. Verify exact editions and URLs when possible. If the full standard is not publicly accessible, say so and use public supporting materials rather than inventing requirements.

---

# Module 20: Final Capstone: Design and Certification Strategy for Two Sauna Heaters

**Objective:** Apply everything learned to two real products intended for residential installation, rental, and potentially sale in the United States.

## Topic 20.1: Product A, conventional 120V sauna heater

**Target product:** A traditional electric sauna heater operating at 120V AC, with approximately 1.7–2.2 kW heating power.

### Readings

1. [UL Standards Catalog: UL 875](https://www.shopulstandards.com/)
   **Summary:** Study the scope and requirements of the traditional electric dry-bath heater standard. Focus on product construction, normal and abnormal operation, protective controls, installation instructions, and certification scope.

2. [UL Standards Catalog: UL 60335-2-53](https://www.shopulstandards.com/)
   **Summary:** Review the sauna-specific household appliance safety framework and how it relates to the general requirements of UL 60335-1. Investigate whether this is an appropriate certification route for a new US-market heater.

3. [NFPA 70: National Electrical Code](https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70)
   **Summary:** Focus on branch circuits, continuous loads, equipment approval, grounding, cord-connected appliances, and installation instructions.

4. [OSHA: NRTL Program](https://www.osha.gov/nationally-recognized-testing-laboratory-program)
   **Summary:** Understand how to verify that a certification laboratory is recognized for the relevant product standard.

### Mastery questions

- [ ] What current does each heater variant draw at 120V?
- [ ] Which variants might be suitable for 15A versus 20A circuits, and what additional information is needed?
- [ ] How do continuous-load rules affect the design?
- [ ] What plug configurations may be appropriate?
- [ ] What independent overtemperature protection should be evaluated?
- [ ] Which components are safety-critical?
- [ ] What are the likely worst-case thermal conditions?
- [ ] What is the difference between certifying the heater and certifying the complete sauna?
- [ ] Could multiple power variants be evaluated as one product family?
- [ ] What must be confirmed by an NRTL before selecting the final architecture?

### Applied exercise

Create a preliminary product requirements document containing:

- Intended use.
- Electrical ratings.
- Installation assumptions.
- Functional requirements.
- Safety requirements.
- Component requirements.
- Relevant standards.
- Unresolved regulatory questions.
- Preliminary verification plan.

---

## Topic 20.2: Product B, battery-assisted high-power sauna heater

**Target product:** A traditional sauna heater combining a 5–10 kWh LFP battery, approximately 6–10 kW of DC heating, and approximately 1.2–2.2 kW of AC heating.

The proposed nominal battery voltage is approximately 48V, but this is not a fixed design decision.

### Readings

1. [UL 1973, UL Standards Catalog](https://www.shopulstandards.com/)
   **Summary:** Investigate safety requirements for stationary and other covered battery applications. Determine what battery subsystem evidence might be relevant to the proposed product.

2. [UL 9540, UL Standards Catalog](https://www.shopulstandards.com/)
   **Summary:** Study the scope of complete energy storage system certification and investigate whether it applies to an integrated battery-powered heating appliance.

3. [UL Solutions: UL 9540A](https://www.ul.com/services/ul-9540a-test-method)
   **Summary:** Learn what thermal runaway fire propagation testing measures and how it differs from complete system certification.

4. [Victron Energy: Wiring Unlimited](https://www.victronenergy.com/upload/documents/Wiring-Unlimited-EN.pdf)
   **Summary:** Practical reference for DC wiring, protection, grounding, connections, and battery electrical installations.

5. [Impulse Labs: Battery-Integrated Appliance Certification](https://www.impulselabs.com/blog/impulse-becomes-first-certified-battery-integrated-appliance)
   **Summary:** Study a real-world example of integrating battery, power electronics, automatic controls, and appliance-level certification.

### Mastery questions

- [ ] What current does a 6 kW load draw at nominal 48V?
- [ ] What current does a 10 kW load draw?
- [ ] How do actual battery voltage and resistive-element behavior affect current and heating power?
- [ ] What are the approximate C-rates for the proposed battery and power combinations?
- [ ] What determines whether the cells can safely support the intended discharge?
- [ ] How do conductor losses and connection resistance affect the architecture?
- [ ] What independent protection is required for AC and DC heating?
- [ ] What happens if the DC switching device fails closed?
- [ ] How should the system respond to a BMS fault?
- [ ] What are the thermal risks of integrating an LFP battery near a sauna?
- [ ] Should the battery be physically separate from the heater?
- [ ] Which certification standards may apply to the battery subsystem?
- [ ] Which standards may apply to the finished appliance?
- [ ] What evidence is needed to determine whether ESS requirements apply?
- [ ] What should be discussed with an NRTL before detailed design?

### Applied exercise

Produce a preliminary architecture comparison for at least three configurations:

1. Battery and heating elements integrated into one assembly.
2. Battery in a separate enclosure with a high-power DC connection to the heater.
3. An alternative electrical architecture selected for comparison.

Compare:

- Safety.
- Electrical losses.
- Thermal isolation.
- Installation complexity.
- Serviceability.
- Weight.
- Component availability.
- Certification uncertainty.
- Cost.

Do not select a final architecture solely from theoretical calculations.

---

## Topic 20.3: Certification feasibility and laboratory engagement

### Readings

1. [UL Solutions: Certification](https://www.ul.com/services/certification)
   **Summary:** Review the general process of product evaluation, certification, and maintaining approved construction.

2. [OSHA: Current NRTLs](https://www.osha.gov/nationally-recognized-testing-laboratory-program/current-list-of-nrtls)
   **Summary:** Identify recognized laboratories and learn how to verify the standards within their recognition scope.

3. [UL Solutions: Field Evaluations](https://www.ul.com/services/field-evaluations)
   **Summary:** Understand how equipment may be evaluated outside a conventional product-listing program and the limitations of such evaluations.

### Mastery questions

- [ ] What information should be included in a preliminary certification inquiry?
- [ ] How would you describe Product B without assuming its classification?
- [ ] What is the difference between a feasibility review and formal certification testing?
- [ ] What would make two laboratory proposals comparable?
- [ ] How should unresolved standards-applicability questions be documented?
- [ ] What are the risks of committing to a product architecture before resolving certification scope?

### Applied exercise

Prepare two laboratory inquiry packages, one for each product, including:

- Product description.
- Intended installation.
- Electrical architecture.
- Safety-critical subsystems.
- Preliminary hazard analysis.
- Candidate standards.
- Requested scope determination.
- Questions about model families.
- Questions about certification of integrated versus separate subsystems.

---

## Topic 20.4: Final engineering and certification deliverables

Complete the following checklist:

- [ ] Product A requirements document.
- [ ] Product A preliminary electrical architecture.
- [ ] Product A safety-critical component register.
- [ ] Product A hazard analysis.
- [ ] Product A certification applicability matrix.
- [ ] Product A preliminary test plan.
- [ ] Product B requirements document.
- [ ] Product B energy and power budget.
- [ ] Product B architecture alternatives.
- [ ] Product B preliminary hazard analysis.
- [ ] Product B battery safety considerations.
- [ ] Product B certification applicability matrix.
- [ ] Product B preliminary test plan.
- [ ] Laboratory inquiry packages for both products.
- [ ] List of unresolved engineering questions.
- [ ] List of unresolved regulatory questions.
- [ ] Initial manufacturing and quality-control plan.

The capstone is complete when I can explain the engineering and regulatory reasoning behind these documents and identify which conclusions require independent verification.

---

# Module 21: Safety-Critical Software and Control Systems

**Objective:** Understand how firmware, electronics, and control architectures affect appliance safety, especially in a heater with both AC and battery-powered DC heating.

## Topic 21.1: Functional safety fundamentals

### Readings

1. [IEC: Functional Safety](https://www.iec.ch/functional-safety)
   **Summary:** Introduces the concept of safety-related control systems and the importance of preventing unacceptable risk when components or control functions fail.

2. [UL 60730-1, UL Standards Catalog](https://www.shopulstandards.com/)
   **Summary:** General requirements for automatic electrical controls, including the evaluation of safety-related control functions within the standard's scope.

3. [IEC 61508, IEC Webstore](https://webstore.iec.ch/)
   **Summary:** General functional safety framework. Study its concepts of systematic failures, hardware failures, safety functions, and safety lifecycle. Do not assume IEC 61508 certification is required for the sauna heater.

### Mastery questions

- [ ] What distinguishes a functional control from a safety-related control?
- [ ] What is a safety function?
- [ ] Why does ordinary software reliability differ from functional safety?
- [ ] What is a systematic failure?
- [ ] What is a random hardware failure?
- [ ] Why can two redundant systems still fail from a common cause?
- [ ] What evidence is needed to evaluate a safety-related control function?

---

## Topic 21.2: Firmware failures and safe states

### Readings

1. [UL 60730-1](https://www.shopulstandards.com/)
   **Summary:** Investigate requirements relevant to electronic controls, software-dependent safety functions, and abnormal behavior.

2. [NASA Software Engineering Handbook](https://swehb.nasa.gov/)
   **Summary:** General reference for software requirements, verification, validation, fault management, and disciplined software engineering. This is not an appliance certification standard.

### Mastery questions

- [ ] What happens if a heater controller freezes while heating is enabled?
- [ ] What happens if a temperature sensor returns an invalid value?
- [ ] What happens if a communication link between controllers is lost?
- [ ] What is a watchdog timer?
- [ ] What are the limitations of watchdogs?
- [ ] What does it mean for a system to enter a safe state?
- [ ] Which protective functions should not depend solely on application firmware?

---

## Topic 21.3: Hardware interlocks and independent protection

### Readings

1. [UL 60730-2-9](https://www.shopulstandards.com/)
   **Summary:** Temperature-sensing control requirements and the evaluation of control functions.

2. [UL 60335-2-53](https://www.shopulstandards.com/)
   **Summary:** Sauna-specific safety requirements, including relevant temperature-control and abnormal-operation considerations.

### Mastery questions

- [ ] Why might an independent high-limit control be necessary?
- [ ] What happens if the primary relay welds closed?
- [ ] Can a software command alone guarantee that a heater turns off?
- [ ] How can protective devices share a common failure mechanism?
- [ ] What are the tradeoffs between automatic-reset and manual-reset protection?
- [ ] How should the AC and DC heating subsystems be considered during hazard analysis?

---

## Topic 21.4: Control-system verification and validation

### Readings

1. [NASA Systems Engineering Handbook](https://www.nasa.gov/reference/nasa-systems-engineering-handbook/)
   **Summary:** Introduces requirements traceability, verification, validation, and systematic engineering reviews.

2. [UL 60730-1](https://www.shopulstandards.com/)
   **Summary:** Review applicable control evaluation and testing concepts, using the actual standard where accessible.

### Mastery questions

- [ ] What is the difference between verification and validation?
- [ ] How do you demonstrate that a safety requirement is satisfied?
- [ ] What is requirements traceability?
- [ ] How should software changes be evaluated?
- [ ] What evidence should be retained from control-system testing?
- [ ] Why is successful normal operation insufficient evidence of safety?

### Applied case

A battery-assisted sauna heater has separate AC and DC heating controls. A communication fault causes the supervisory controller to stop responding while one power-switching device remains closed.

Explain the hazards, identify which assumptions need verification, and propose a high-level safety architecture that does not depend on one software command to remove all heating power.

---

# Module 22: EMC, FCC, and Electrical Interference

**Objective:** Understand electromagnetic interference, regulatory emissions requirements, and the possibility that electrical noise can affect appliance controls.

## Topic 22.1: Electromagnetic compatibility fundamentals

### Readings

1. [IEC: Electromagnetic Compatibility](https://www.iec.ch/emc)
   **Summary:** Introduces electromagnetic compatibility, emissions, immunity, and the importance of electrical equipment functioning correctly in its intended electromagnetic environment.

2. [FCC: Equipment Authorization](https://www.fcc.gov/oet/ea/rfdevice)
   **Summary:** Explains the FCC equipment authorization framework and how it applies to relevant electronic and radio-frequency devices.

### Mastery questions

- [ ] What is electromagnetic interference?
- [ ] What is the difference between emissions and immunity?
- [ ] What is conducted interference?
- [ ] What is radiated interference?
- [ ] Why can switching electronics generate electrical noise?
- [ ] How could interference affect temperature sensors or controllers?
- [ ] Does every purely resistive heating appliance have the same EMC requirements?

---

## Topic 22.2: Switching electronics and interference sources

### Readings

1. [Texas Instruments: Technical Resources](https://www.ti.com/design-development/technical-resources.html)
   **Summary:** Find introductory material on switching power supplies, grounding, PCB layout, and electromagnetic interference.

2. [Analog Devices: Technical Articles](https://www.analog.com/en/resources/technical-articles.html)
   **Summary:** Study relevant material on switching transients, noise coupling, power electronics, and measurement techniques.

### Mastery questions

- [ ] Why can rapid switching generate electromagnetic interference?
- [ ] How do switching frequency and edge speed affect interference?
- [ ] How can electrical noise enter a sensor signal?
- [ ] Why do grounding and PCB layout matter?
- [ ] What is the difference between a noise problem and a genuine temperature change?
- [ ] How might high-current DC switching affect nearby electronics?

---

## Topic 22.3: Regulatory emissions and immunity requirements

### Readings

1. [FCC Part 15, eCFR](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-A/part-15)
   **Summary:** US rules concerning radio-frequency devices and relevant emissions requirements. Determine applicability based on the product's actual electronics.

2. [IEC 61000 Series, IEC Webstore](https://webstore.iec.ch/)
   **Summary:** Standards covering aspects of electromagnetic compatibility, including emissions and immunity testing.

### Mastery questions

- [ ] What is FCC Part 15?
- [ ] How do intentional and unintentional radiators differ?
- [ ] When might a heater controller require emissions evaluation?
- [ ] Why is passing an emissions test different from demonstrating immunity?
- [ ] Which EMC requirements are regulatory versus product-standard requirements?
- [ ] What information should be included in an EMC laboratory inquiry?

---

## Topic 22.4: EMC as a functional safety concern

### Readings

1. [IEC 60730 Series](https://webstore.iec.ch/)
   **Summary:** Study the relationship between electronic control performance and abnormal electrical conditions.

2. [IEC 61000 Series](https://webstore.iec.ch/)
   **Summary:** Investigate relevant immunity concepts such as electrostatic discharge, electrical fast transients, and conducted disturbances.

### Mastery questions

- [ ] What could happen if electromagnetic interference causes a false temperature reading?
- [ ] What could happen if a relay-control signal is corrupted?
- [ ] Why should an appliance not depend on perfect communication to remain safe?
- [ ] How can EMC testing reveal weaknesses in control-system design?
- [ ] Why might battery-integrated appliances present different EMC challenges from conventional resistive heaters?

### Applied case

A heater operates correctly during normal use, but its controller intermittently resets when the battery-powered heating subsystem switches.

Identify possible categories of causes, the safety consequences, and the types of engineering evidence needed to investigate the issue.

---

# Module 23: Product Verification and Reliability Engineering

**Objective:** Understand how to establish that a product remains safe and reliable after months or years of real-world use, not merely during an initial certification test.

## Topic 23.1: Reliability fundamentals

### Readings

1. [NASA Systems Engineering Handbook](https://www.nasa.gov/reference/nasa-systems-engineering-handbook/)
   **Summary:** Introduces engineering verification, validation, lifecycle considerations, and risk management.

2. [NIST Engineering Statistics Handbook](https://www.itl.nist.gov/div898/handbook/)
   **Summary:** Statistical methods relevant to reliability, experimental design, measurement, and engineering data analysis.

### Mastery questions

- [ ] What is the difference between safety and reliability?
- [ ] Can a reliable product still be unsafe?
- [ ] Can a certified product develop reliability problems?
- [ ] What is a failure rate?
- [ ] What is mean time between failures, and when is it misleading?
- [ ] Why is field failure data valuable?
- [ ] How does sample size affect confidence in reliability claims?

---

## Topic
