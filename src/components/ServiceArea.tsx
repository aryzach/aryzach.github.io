import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ServiceArea = () => {
  return (
    <section id="service-area" className="py-4 md:py-6 bg-cedar-section">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-foreground">
          Not sure if you're in our service area? Get in touch
        </h2>
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
