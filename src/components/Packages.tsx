import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const Packages = () => {
  return (
    <section id="packages" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Infrared sauna from $199/mo
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Flexible rental periods with everything included
          </p>
          <Link to="/pricing">
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              See Full Pricing
            </Button>
          </Link>
        </div>

        {/* Trust Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-12 border-t border-border">
          <div className="text-center">
            <Check className="mx-auto mb-2 text-primary" size={24} />
            <p className="font-medium text-foreground">SF-local</p>
          </div>
          <div className="text-center">
            <Check className="mx-auto mb-2 text-primary" size={24} />
            <p className="font-medium text-foreground">Setup included</p>
          </div>
          <div className="text-center">
            <Check className="mx-auto mb-2 text-primary" size={24} />
            <p className="font-medium text-foreground">Standard 120V plug</p>
          </div>
          <div className="text-center">
            <Check className="mx-auto mb-2 text-primary" size={24} />
            <p className="font-medium text-foreground">&lt;$1 electricity cost per use</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Packages;
