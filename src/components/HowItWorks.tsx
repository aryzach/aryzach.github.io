import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useReservationModal } from "@/contexts/ReservationModal";
import AskQuestionCTA from "@/components/AskQuestionCTA";
import howItWorksVideoAsset from "@/assets/0812.mp4.asset.json";

const HowItWorks = () => {
  const { open } = useReservationModal();

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
            <source src={howItWorksVideoAsset.url} type="video/mp4" />
          </video>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            onClick={() => open({ source: "Landing Page" })}
            className="bg-[hsl(var(--color-accent))] hover:bg-[hsl(var(--color-accent-dark))] text-[hsl(var(--color-white))] font-sans font-medium whitespace-nowrap text-lg px-8"
          >
            Reserve Your Sauna
            <ArrowRight className="ml-2" size={20} />
          </Button>
          <AskQuestionCTA />
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;