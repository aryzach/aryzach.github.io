import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ServiceArea = () => {
  return (
    <section id="service-area" className="py-16 md:py-24 bg-cedar-section">
      <div className="container mx-auto px-4 text-center">
        <p className="text-lg text-muted-foreground mb-4">
          Not sure if you're in our service area? Get in touch
        </p>
        <Link to="/learn-more">
          <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Contact Us
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default ServiceArea;
