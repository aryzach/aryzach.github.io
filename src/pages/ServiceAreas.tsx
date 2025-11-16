import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const serviceAreas = [
  {
    name: "San Francisco",
    description: "Free delivery and installation",
    highlight: true,
  },
  {
    name: "Oakland, Marin & Sonoma",
    description: "$150 delivery fee, free installation",
    highlight: false,
  },
  {
    name: "Rest of the Bay Area",
    description: "$150 delivery fee, free installation",
    highlight: false,
  },
];

const ServiceAreas = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-6 text-foreground">
            San Francisco Service Areas
          </h1>
          <p className="text-xl text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            We proudly deliver and install infrared saunas throughout San Francisco and the greater Bay Area
          </p>

          <div className="mb-16 rounded-lg overflow-hidden shadow-lg h-[500px]">
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

          <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
            {serviceAreas.map((area, index) => (
              <div 
                key={index} 
                className={`bg-card rounded-lg p-8 border-2 ${
                  area.highlight ? "border-primary shadow-lg" : "border-border"
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <MapPin className="text-primary flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h3 className="text-2xl font-bold text-card-foreground mb-2">{area.name}</h3>
                    <p className="text-muted-foreground text-lg">{area.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-muted rounded-lg p-8 text-center max-w-3xl mx-auto">
            <p className="text-muted-foreground mb-4 text-lg">
              Not sure if you're in our service area? Get in touch
            </p>
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Contact Us
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ServiceAreas;
