# Curriculum Content: Modules 12–20

## Module 12: High-Current DC Power Engineering

**Objective:** Understand the engineering and safety challenges of supplying 6–10 kW of resistive heating from a nominal 48V LFP battery.

### Topic 12.1: High-current DC fundamentals

**Readings**

1. [All About Circuits: Direct Current](https://www.allaboutcircuits.com/textbook/direct-current/)
   **Summary:** Reviews current, resistance, power dissipation, circuit behavior, and the electrical principles underlying high-current DC systems. Focus on resistive losses and voltage drop.

2. [Victron Energy: Wiring Unlimited](https://www.victronenergy.com/upload/documents/Wiring-Unlimited-EN.pdf)
   **Summary:** Practical reference covering DC wiring, connections, conductor sizing, voltage drop, grounding, fuses, and battery electrical installations.

**Questions**

- [ ] How much current does a 6 kW heater draw at 48V nominal?
- [ ] How much current does a 10 kW heater draw?
- [ ] How do actual battery voltage and element resistance affect current and power?
- [ ] Why do conductor losses increase with the square of current?
- [ ] What are the advantages and disadvantages of increasing system voltage?

### Topic 12.2: Conductors, busbars, and electrical connections

**Readings**

1. [Victron Energy: Wiring Unlimited](https://www.victronenergy.com/upload/documents/Wiring-Unlimited-EN.pdf)
   **Summary:** Study the sections covering conductor sizing, cable routing, connections, temperature effects, and protective devices.

2. [UL Standards Catalog](https://www.shopulstandards.com/) — search UL 486A-486B.
   **Summary:** Standards governing wire connectors and their evaluation. Investigate terminal suitability, ratings, and installation conditions.

**Questions**

- [ ] Why is conductor cross-sectional area only one consideration in selecting wiring?
- [ ] How do connection resistance and terminal temperature affect reliability?
- [ ] What are the tradeoffs between busbars and flexible conductors?
- [ ] Why must connections be evaluated under thermal cycling?
- [ ] What information is required to select a suitable connector?

### Topic 12.3: DC protection and switching

**Readings**

1. [Victron Energy: Wiring Unlimited](https://www.victronenergy.com/upload/documents/Wiring-Unlimited-EN.pdf)
   **Summary:** Covers practical DC fuse placement, protective devices, isolation, and battery wiring principles.

2. [UL Standards Catalog](https://www.shopulstandards.com/) — search UL 248, UL 489, UL 1077, and UL 60947 series.
   **Summary:** Different standards apply to different categories of fuses, circuit breakers, supplementary protectors, and switching devices. The relevant standard depends on component type and intended application.

**Questions**

- [ ] Why can interrupting DC current be more difficult than interrupting AC?
- [ ] What is interrupting capacity?
- [ ] Why is a fuse's current rating insufficient to establish suitability?
- [ ] How do battery fault currents differ from normal operating currents?
- [ ] What happens if a DC contactor welds closed?
- [ ] What independent protection could prevent continued heating?

### Topic 12.4: DC system architecture and voltage selection

**Readings**

1. [Victron Energy: Technical Information](https://www.victronenergy.com/)
   **Summary:** Explore technical documentation for battery systems, DC distribution, chargers, and protection architectures.

2. [UL 1973 and UL 1741](https://www.shopulstandards.com/)
   **Summary:** Study the scope of battery and power-conversion equipment standards. Determine which parts of a proposed architecture might require separate evaluation.

**Questions**

- [ ] Why might 48V be attractive for a residential appliance?
- [ ] What problems arise at 200A?
- [ ] What changes if the system uses a higher DC voltage?
- [ ] How do shock hazards and arc hazards change with voltage?
- [ ] What determines whether a battery should be integrated into or separated from the heater?

---

## Module 13: Battery-Assisted Sauna Heater Architecture

**Objective:** Evaluate the technical and certification feasibility of Product B.

### Topic 13.1: System energy budget

**Readings**

1. [Engineering Toolbox: Specific Heat Capacity](https://www.engineeringtoolbox.com/specific-heat-capacity-d_391.html)
   **Summary:** Introduces energy required to raise material temperatures. Useful for estimating the heating of air, wood, stones, and other sauna materials.

2. [Engineering Toolbox: Heat Transfer](https://www.engineeringtoolbox.com/heat-transfer-d_431.html)
   **Summary:** Reviews heat transfer and heat-loss principles relevant to estimating heatup time and sustaining power.

**Questions**

- [ ] How much energy can a 5 kWh battery theoretically supply?
- [ ] How long could a 10 kWh battery supply 8 kW, ignoring losses?
- [ ] Why does heating sauna air require much less energy than heating the entire cabin?
- [ ] How do wood, stones, insulation, ventilation, and ambient temperature affect heatup?
- [ ] How would you estimate the required sustaining power?

### Topic 13.2: Coordinating AC heating, DC heating, and battery charging

**Readings**

1. [NEC: NFPA 70](https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70)
   **Summary:** Review branch-circuit loading, appliance requirements, and the treatment of connected electrical loads.

2. [Victron Energy: Battery Charger Documentation](https://www.victronenergy.com/chargers)
   **Summary:** Provides examples of charger ratings, charging control, current limitations, and battery-system integration.

**Questions**

- [ ] Can a 120V/20A circuit supply a 2 kW heater and a 1 kW charger simultaneously?
- [ ] What determines the maximum permitted combined input current?
- [ ] Should battery charging stop while AC heating is operating?
- [ ] What happens when the battery is depleted?
- [ ] How should the system respond to loss of AC input?
- [ ] How can control software avoid exceeding the input power limit?

### Topic 13.3: Protective controls and operating states

**Readings**

1. [UL 60730-1](https://www.shopulstandards.com/)
   **Summary:** General safety requirements for automatic electrical controls. Study protective-control suitability, fault behavior, and safety-related control functions.

2. [UL 60335-2-53](https://www.shopulstandards.com/)
   **Summary:** Sauna-specific requirements that may govern temperature regulation, protective devices, and abnormal operation.

**Questions**

- [ ] What should happen if the AC heater relay sticks closed?
- [ ] What should happen if the DC contactor sticks closed?
- [ ] Can a single thermal cutoff safely protect both heating subsystems?
- [ ] What common-cause failures could defeat multiple protective devices?
- [ ] How should the system behave when a temperature sensor becomes disconnected?
- [ ] Which protective functions should remain effective if the software crashes?

### Topic 13.4: Battery placement and thermal isolation

**Readings**

1. [UL 1973](https://www.shopulstandards.com/)
   **Summary:** Battery safety requirements, including construction and abnormal-condition evaluation within the standard's scope.

2. [NFPA 855](https://www.nfpa.org/codes-and-standards/nfpa-855-standard-development/855)
   **Summary:** Installation safety requirements for stationary energy storage systems. Study as a potential reference, while verifying whether it applies to the proposed integrated appliance.

3. [UL Solutions: UL 9540A](https://www.ul.com/services/ul-9540a-test-method)
   **Summary:** Explains the test method used to evaluate thermal runaway fire propagation characteristics.

**Questions**

- [ ] Why is battery placement especially important in a sauna appliance?
- [ ] What temperature limitations would the battery manufacturer impose?
- [ ] What are the tradeoffs between an integrated and remote battery enclosure?
- [ ] How could battery thermal runaway affect the heater and wooden cabin?
- [ ] What evidence would be necessary to evaluate safe separation?

### Topic 13.5: Certification feasibility

**Readings**

1. [UL 875](https://www.shopulstandards.com/)
   **Summary:** Investigate whether the scope and construction requirements accommodate the proposed heating architecture.

2. [UL 60335-2-53](https://www.shopulstandards.com/)
   **Summary:** Investigate the treatment of sauna heating appliances and any relevant provisions for unconventional power architectures.

3. [Impulse Labs Certification Case Study](https://www.impulselabs.com/blog/impulse-becomes-first-certified-battery-integrated-appliance)
   **Summary:** A real-world example of integrating battery, power electronics, control, and finished-appliance certification.

**Questions**

- [ ] What standards might apply to the battery subsystem?
- [ ] What standards might apply to the heater?
- [ ] What additional integrated-system testing might be necessary?
- [ ] Could the battery and heater be certified separately?
- [ ] What evidence would establish whether UL 9540 applies?
- [ ] What should be included in an initial NRTL technical inquiry?

**Capstone:** Write a preliminary architecture and certification feasibility report for Product B. Distinguish verified requirements from engineering assumptions and questions requiring laboratory confirmation.

---

## Module 14: Cooking Appliances and Battery-Integrated Products

**Objective:** Understand how other companies have integrated batteries into high-power residential heating appliances.

### Topic 14.1: Conventional electric cooking appliance certification

**Readings**

1. [UL 858](https://www.shopulstandards.com/)
   **Summary:** Household electric range safety, including electrical construction, heating, controls, and abnormal-operation considerations.

2. [UL 1026](https://www.shopulstandards.com/)
   **Summary:** Household cooking and food-serving appliances. Compare scope with UL 858.

3. [UL 197](https://www.shopulstandards.com/)
   **Summary:** Commercial electric cooking appliances. Useful for understanding product-classification boundaries.

**Questions**

- [ ] Why do household ranges have their own safety standard?
- [ ] What hazards differ between ovens and sauna heaters?
- [ ] What hazards are common to both?
- [ ] How does an induction cooktop differ electrically from a resistive heater?
- [ ] Why can adding a battery change the required evaluation?

### Topic 14.2: Copper Home

**Readings**

1. [Copper Home: FAQ](https://copperhome.com/pages/faq)
   **Summary:** Copper's public descriptions of its battery-integrated cooking appliance, installation requirements, safety testing, and certification approach.

2. [Copper Home](https://copperhome.com/)
   **Summary:** Review current product specifications, installation documentation, and published certification statements.

**Questions**

- [ ] Why did Copper integrate a battery into a cooking appliance?
- [ ] What electrical installation problem was it solving?
- [ ] Which battery standards has Copper publicly discussed?
- [ ] What is the distinction between component recognition, successful testing, and complete appliance certification?
- [ ] What certification obstacles has Copper publicly described?
- [ ] What aspects of Copper's approach might be relevant to Product B?

### Topic 14.3: Impulse Labs

**Readings**

1. [Impulse Labs: Battery-Integrated Appliance Certification](https://www.impulselabs.com/blog/impulse-becomes-first-certified-battery-integrated-appliance)
   **Summary:** Impulse's published account of certification work involving its battery-integrated induction cooktop and multiple safety standards.

2. [Impulse Labs](https://www.impulselabs.com/)
   **Summary:** Review the current product architecture, specifications, and installation information.

**Questions**

- [ ] Why did Impulse use multiple certification standards?
- [ ] Which subsystems were evaluated separately?
- [ ] What did final appliance certification add?
- [ ] Why might multiple laboratories participate in one product's certification?
- [ ] How does Impulse's strategy differ from Copper's?
- [ ] Which lessons apply directly to a battery-integrated sauna heater?

---

## Module 15: Sauna Manufacturer Certification Case Studies

**Objective:** Understand how existing sauna manufacturers certify their products and what their approaches imply for SF Sauna.

### Topic 15.1: HUUM and SGS

**Readings**

1. [HUUM SGS Certificate of Compliance](https://www.bathingbrands.com/sites/default/files/2022-09/HUUM%20Certificate%20of%20Compliance.pdf)
   **Summary:** A September 2022 certificate for specified HUUM heater models referencing UL 60335-1, IEC 60335-2-53, and Canadian standards. Study the exact models, conditions, and limitations.

2. [OSHA: SGS NRTL Recognition](https://www.osha.gov/nationally-recognized-testing-laboratory-program/sgs)
   **Summary:** Explains SGS's NRTL recognition and provides a basis for checking the standards within its recognized scope.

3. [HUUM](https://huumsauna.com/)
   **Summary:** Review heater specifications, installation instructions, control systems, and current certification claims.

**Questions**

- [ ] What exactly did HUUM's certificate cover?
- [ ] Which standards were referenced?
- [ ] Why was IEC 60335-2-53 referenced rather than UL 875?
- [ ] Does the certificate establish that all HUUM heaters are certified?
- [ ] What installation and controller conditions apply?
- [ ] What is the relationship between SGS's NRTL recognition and the certificate?
- [ ] Could a new 120V heater use a similar pathway today?
- [ ] What must be verified directly with SGS?

### Topic 15.2: Harvia

**Readings**

1. [Harvia](https://www.harvia.com/)
   **Summary:** Review North American heater models, manuals, electrical requirements, safety controls, and certification information.

2. [UL Product iQ](https://productiq.ulprospector.com/)
   **Summary:** Search for relevant product certification records and verify model coverage rather than relying exclusively on marketing claims.

**Questions**

- [ ] Which Harvia models have documented North American certification?
- [ ] Which standards apply to those models?
- [ ] How are their safety controls arranged?
- [ ] What installation conditions are imposed?
- [ ] What can be learned from their heater construction and documentation?

### Topic 15.3: Saunum

**Readings**

1. [Saunum](https://saunum.com/)
   **Summary:** Review North American product specifications, heater construction, installation manuals, and certification claims.

2. [UL Product iQ](https://productiq.ulprospector.com/)
   **Summary:** Investigate the existence and scope of relevant listings.

**Questions**

- [ ] What distinguishes Saunum's heater architecture?
- [ ] What certification standards are documented for its North American products?
- [ ] How are controls and protective systems implemented?
- [ ] What are the relevant installation limitations?
- [ ] How does Saunum compare with HUUM and Harvia?

---

## Module 16: Manufacturing and Quality Assurance

**Objective:** Understand how to manufacture consistently safe, certifiable heaters with overseas suppliers.

### Topic 16.1: Supplier qualification and documentation

**Readings**

1. [ISO 9001 Overview](https://www.iso.org/iso-9001-quality-management.html)
   **Summary:** Introduces quality-management systems, process control, documentation, and continuous improvement.

2. [UL Solutions: Certification Services](https://www.ul.com/services/certification)
   **Summary:** Explore certification programs and their implications for maintaining approved product construction.

**Questions**

- [ ] What documents should a heater supplier provide?
- [ ] What distinguishes a component certificate from a product certificate?
- [ ] How do you verify a certificate is genuine?
- [ ] What is a safety-critical bill of materials?
- [ ] What supplier changes could affect certification?

### Topic 16.2: Production quality and electrical connections

**Readings**

1. [UL 486 series](https://www.shopulstandards.com/)
   **Summary:** Study connector ratings and requirements relevant to reliable electrical terminations.

2. [NASA Workmanship Standards](https://workmanship.nasa.gov/)
   **Summary:** Examples of disciplined workmanship requirements, inspection, and process documentation. Not a substitute for appliance manufacturing standards.

**Questions**

- [ ] Why is terminal installation quality safety-critical?
- [ ] How should a manufacturer control component substitutions?
- [ ] What records should be retained for production batches?
- [ ] What failures might be discovered during production testing?
- [ ] How should field failures inform design and process changes?

### Topic 16.3: Factory surveillance and change control

**Readings**

1. [UL Solutions: Follow-Up Services](https://www.ul.com/services/follow-services)
   **Summary:** Investigate how ongoing factory oversight helps maintain consistency with certified construction.

2. [ISO 9001 Overview](https://www.iso.org/iso-9001-quality-management.html)
   **Summary:** Review nonconformance management, corrective action, traceability, and controlled changes.

**Questions**

- [ ] Why doesn't a passing prototype guarantee compliant production?
- [ ] What happens when a supplier changes a relay or timer?
- [ ] What happens when manufacturing moves to another factory?
- [ ] What is the difference between a design revision and an approved certified construction?
- [ ] How should a manufacturer document and investigate field failures?

---

## Module 17: Legal Installation, Product Liability, and Commercial Deployment

**Objective:** Understand the responsibilities and risks of installing, renting, and selling electrical appliances in US homes.

### Topic 17.1: Installation legality

**Readings**

1. [NFPA 70](https://www.nfpa.org/codes-and-standards/nfpa-70-standard-development/70)
   **Summary:** National model electrical code governing installation requirements.

2. [California Building Standards Commission](https://www.dgs.ca.gov/BSC/Codes)
   **Summary:** California's adopted building and electrical code framework.

3. [San Francisco DBI](https://www.sf.gov/departments/department-building-inspection)
   **Summary:** Local building department responsible for relevant permitting, inspections, and code interpretation.

**Questions**

- [ ] What is required for an appliance to be legally installable?
- [ ] Does using
