import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-cedar-section">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <div className="mb-8 rounded-lg overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto"
          >
            <source src="/media/lindsey-sauna.mp4" type="video/mp4" />
          </video>
        </div>
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
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
