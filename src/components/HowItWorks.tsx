import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-cedar-section">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-foreground">
          Do you have any questions?
        </h2>
        <div className="flex flex-col items-center gap-4">
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
          <p className="text-muted-foreground font-sans text-[14px] font-normal max-w-md">
            We confirm fit, electrical, and recommend the right model, no pressure.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
