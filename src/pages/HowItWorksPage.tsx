import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const HowItWorksPage = () => {
  const steps = [
    {
      number: "1",
      title: "Schedule Free Fit Check",
      description: "Book a quick call where we confirm your space, electrical setup, and recommend the perfect sauna model for your needs.",
    },
    {
      number: "2",
      title: "Choose Your Sauna",
      description: "Select from infrared or Finnish dry saunas, indoor or outdoor models, and pick a rental term that works for you.",
    },
    {
      number: "3",
      title: "Professional Installation",
      description: "Our team delivers and installs your sauna in about 1 hour. We handle everything—you just plug it in and enjoy.",
    },
    {
      number: "4",
      title: "Daily Heat Therapy",
      description: "Use your sauna whenever you want. No commute, no membership fees, no scheduling conflicts. Just pure relaxation at home.",
    },
  ];

  const features = [
    "Fast SF-local delivery (1–8 weeks depending on model)",
    "Professional installation + removal included",
    "Standard 120V power (no electrician needed)",
    "Month-to-month after initial term",
    "Maintenance and support included",
    "Apartment-friendly setups",
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-20 md:pt-24">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-cedar-section">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-semibold mb-6 text-foreground">
              How It Works
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Getting your personal sauna is simple. We handle everything from delivery to installation, so you can start enjoying daily heat therapy within weeks.
            </p>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {steps.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-semibold text-primary">{step.number}</span>
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-semibold mb-3 text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-cedar-section">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-semibold text-center mb-12 text-foreground">
              Everything Included
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="text-primary flex-shrink-0 mt-0.5" size={24} strokeWidth={2.5} />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-foreground">
              Ready to get started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Schedule your free fit check today. We'll confirm your space, answer all your questions, and help you choose the perfect sauna.
            </p>
            <Button 
              size="lg" 
              className="font-sans font-medium"
              asChild
            >
              <a 
                href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1L2ygxB574Er3ifWJWFVA6V6p1mzpW3p2UMhDFNsd6iq8F3gkELDTYcmGvBiRxn_8u-yOdTFLb" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Schedule Free Sauna Fit Check
                <ArrowRight className="ml-2" size={20} />
              </a>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorksPage;
