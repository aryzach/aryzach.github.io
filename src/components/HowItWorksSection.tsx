import ContactLeadForm from "@/components/lead/ContactLeadForm";

const howItWorksSteps = [
  {
    number: "1",
    title: "Call",
    description: "We'll check your space and confirm your outlet will work for a sauna over a video call.",
  },
  {
    number: "2",
    title: "Installation",
    description: "We deliver anywhere in the SF Bay area and install the sauna in under 2 hours.",
  },
  {
    number: "3",
    title: "Enjoy your sauna",
    description: "Use your sauna whenever you want. We handle all maintenance.",
  },
  {
    number: "4",
    title: "Keep it or we pick it up",
    description: "At the end of your rental, keep renting, buy your sauna, or have us come take it away.",
  },
];

const HowItWorksSection = () => (
  <section className="py-16 md:py-24 bg-background">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl md:text-5xl font-semibold text-center mb-12 text-foreground">How It Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {howItWorksSteps.map((step) => (
          <div key={step.number} className="bg-cedar-section rounded-lg p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                {step.number}
              </span>
              <h4 className="font-semibold text-lg text-foreground">{step.title}</h4>
            </div>
            <p className="text-muted-foreground leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export { HowItWorksSection, ContactLeadForm };
export default HowItWorksSection;
