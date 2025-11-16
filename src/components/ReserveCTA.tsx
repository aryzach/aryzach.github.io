import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ReserveCTA = () => {
  return (
    <section className="py-16 md:py-24 bg-primary">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-primary-foreground">
          Ready to start your sauna ritual?
        </h2>
        <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
          Join the many San Franciscans enjoying daily infrared therapy at home
        </p>
        <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8">
          <Link to="/reserve-your-sauna">
            Reserve Now
            <ArrowRight className="ml-2" size={20} />
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default ReserveCTA;
