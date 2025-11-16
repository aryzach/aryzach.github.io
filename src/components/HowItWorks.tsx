import { Truck, Sparkles, Package } from "lucide-react";

const steps = [
  {
    icon: Truck,
    title: "We deliver + set up",
    description: "Our team brings your sauna to your door and sets it up in about an hour. Just plug it into any standard outlet.",
  },
  {
    icon: Sparkles,
    title: "You relax daily",
    description: "Enjoy infrared heat therapy whenever you want. Each session costs less than $1 in electricity.",
  },
  {
    icon: Package,
    title: "We handle pickup",
    description: "When your rental period ends, we'll come pick it up. No hassle, no heavy lifting.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-muted">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 text-foreground">
          How It Works
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Getting started with your home sauna is simple
        </p>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="bg-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <step.icon className="text-primary-foreground" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                {step.title}
              </h3>
              <p className="text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
