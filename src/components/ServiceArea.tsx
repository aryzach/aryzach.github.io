import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const serviceAreas = [
  {
    name: "San Francisco",
    description: "Free delivery and installation",
    highlight: true,
  },
  {
    name: "Rest of the Bay Area",
    description: "$150 delivery fee, free installation",
    highlight: false,
  },
];

const ServiceArea = () => {
  return (
    <section className="py-16 md:py-24 bg-muted">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            We Serve the Bay Area
          </h2>
          <p className="text-muted-foreground mb-6">
            Proudly delivering premium sauna experiences throughout San Francisco and the greater Bay Area
          </p>
        </div>

        <div className="mb-8 rounded-lg overflow-hidden shadow-lg h-[500px]">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d403161.0279932432!2d-122.68374135!3d37.757815!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808580f4cfcfe14d%3A0x5c5234bc20c3ff7e!2sSan%20Francisco%20Bay%20Area%2C%20CA!5e0!3m2!1sen!2sus!4v1234567890"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
          {serviceAreas.map((area, index) => (
            <div 
              key={index} 
              className={`bg-card rounded-lg p-6 border-2 ${
                area.highlight ? "border-primary shadow-lg" : "border-border"
              }`}
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
          <Link to="/contact">
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
