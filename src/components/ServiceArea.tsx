import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useReservationModal } from "@/contexts/ReservationModal";
import AskQuestionCTA from "@/components/AskQuestionCTA";

const ServiceArea = () => {
  const { open } = useReservationModal();
  return (
    <section id="service-area" className="py-4 md:py-6 bg-cedar-section">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">
          Ready for daily heat therapy at home?
        </h2>
        <Button
          size="lg"
          onClick={() => open({ source: "Landing Page" })}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          Reserve Your Sauna
          <ArrowRight className="ml-2" size={20} />
        </Button>
        <AskQuestionCTA className="mt-3" />
      </div>
    </section>
  );
};

export default ServiceArea;
