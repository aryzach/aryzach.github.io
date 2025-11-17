import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ReserveCTA = () => {
  return (
    <section className="py-16 md:py-24 bg-primary">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-semibold mb-6 text-primary-foreground">
          Ready to start your sauna ritual?
        </h2>
        <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
          Join the many San Franciscans enjoying daily heat therapy at home
        </p>
        <div className="flex flex-col items-center gap-3">
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8">
            <Link to="/reserve-your-sauna">
              Check Availability
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </Button>
          <p className="text-primary-foreground/80 text-sm max-w-md">
            We confirm fit, electrical, and recommend the right model—no pressure.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ReserveCTA;
