import { Moon, RefreshCcw, Home } from "lucide-react";

const HealthBenefits = () => {
  const benefits = [
    { text: "Better sleep + stress reduction", icon: Moon },
    { text: "Consistent daily recovery", icon: RefreshCcw },
    { text: "Enjoy a warm ritual in cold SF homes", icon: Home },
  ];

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <h3 className="text-xl md:text-2xl font-medium mb-6 text-foreground">
          Why people rent a home sauna
        </h3>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          {benefits.map((benefit, idx) => {
            const IconComponent = benefit.icon;
            return (
              <div key={idx} className="flex flex-col items-center gap-2 text-muted-foreground">
                <IconComponent size={28} className="text-accent" strokeWidth={1.5} />
                <span>{benefit.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HealthBenefits;
