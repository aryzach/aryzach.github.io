import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const Packages = () => {
  return (
    <section id="packages" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl font-semibold mb-8 text-foreground">
            At-home sauna from $199/mo
          </h2>
          <Link to="/pricing">
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              See All Pricing
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Packages;
