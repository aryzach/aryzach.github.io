import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const neighborhoods = [
  "Mission District",
  "Sunset",
  "Noe Valley",
  "SOMA",
  "Pacific Heights",
  "Richmond",
  "Hayes Valley",
  "Castro",
];

const ServiceArea = () => {
  return (
    <section className="py-16 md:py-24 bg-muted">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              We Serve the Bay Area
            </h2>
            <p className="text-muted-foreground mb-6">
              Proudly delivering premium sauna experiences to neighborhoods across San Francisco
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {neighborhoods.map((neighborhood, index) => (
                <div key={index} className="flex items-center gap-2">
                  <MapPin className="text-primary" size={16} />
                  <span className="text-foreground">{neighborhood}</span>
                </div>
              ))}
            </div>

            <Link to="/service-areas">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                See All Neighborhoods
              </Button>
            </Link>
          </div>

          <div className="bg-card rounded-lg overflow-hidden shadow-lg h-[400px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d100940.17732527188!2d-122.51296584589844!3d37.75766994082031!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80859a6d00690021%3A0x4a501367f076adff!2sSan%20Francisco%2C%20CA!5e0!3m2!1sen!2sus!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceArea;
