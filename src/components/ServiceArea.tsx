import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const serviceAreas = [
  {
    name: "San Francisco",
    description: "Free delivery and installation",
  },
  {
    name: "Rest of the Bay Area",
    description: "Delivery fee dependent on location, free installation",
  },
];

const ServiceArea = () => {
  return (
    <section id="service-area" className="py-16 md:py-24 bg-cedar-section">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            We Serve the Bay Area
          </h2>
          <p className="text-muted-foreground mb-6">
            Proudly delivering premium sauna experiences throughout San Francisco and the greater Bay Area
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
          {serviceAreas.map((area, index) => (
            <div 
              key={index} 
              className="bg-card rounded-lg p-6 border-2 border-border"
            >
              <div className="flex items-start gap-3">
                <MapPin className="text-primary flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="text-xl font-bold text-card-foreground mb-2">{area.name}</h3>
                  <p className="text-muted-foreground">{area.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">
            Not sure if you're in our service area? Get in touch
          </p>
          <Link to="/learn-more">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServiceArea;
