import { Check } from "lucide-react";

const WhySFSauna = () => {
  const benefits = [
    "Fast SF-local delivery (1–14 days depending on sauna type)",
    "Professional installation + removal included",
    "Standard 120V power (no electrician needed)",
    "Month-to-month after initial term",
    "Apartment-friendly setups",
  ];

  return (
    <section className="py-12 md:py-16 bg-background border-y border-border">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-foreground">
          Why SF Sauna?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <Check className="text-primary flex-shrink-0 mt-0.5" size={24} strokeWidth={2.5} />
              <span className="text-muted-foreground">{benefit}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhySFSauna;
