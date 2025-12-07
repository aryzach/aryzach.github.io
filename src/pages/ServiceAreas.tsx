import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";

const serviceAreas = [
  {
    title: "San Francisco",
    description: "Serving all 32 neighborhoods across the city",
    link: "/sauna-rental-san-francisco",
  },
  {
    title: "Oakland",
    description: "Serving 30+ neighborhoods from Rockridge to Montclair",
    link: "/sauna-rental-oakland",
  },
  {
    title: "Berkeley",
    description: "Serving 26 neighborhoods from North Berkeley to Ashby",
    link: "/sauna-rental-berkeley",
  },
  {
    title: "Marin County",
    description: "Serving Mill Valley, Sausalito, Tiburon, Larkspur, and more",
    link: "/sauna-rental-marin",
  },
  {
    title: "Palo Alto & Menlo Park",
    description: "Serving Crescent Park, Professorville, Allied Arts, Sharon Heights, and more",
    link: "/sauna-rental-palo-alto",
  },
  {
    title: "Mountain View & Los Altos",
    description: "Serving Cuesta Park, Waverly Park, Old Los Altos, and more",
    link: "/sauna-rental-mountain-view",
  },
];

const ServiceAreas = () => {
  useSEO(seoData.serviceAreas);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-semibold mb-6 text-heading tracking-tight leading-tight">
              Service Areas
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed">
              We deliver and install plug-in saunas throughout the San Francisco Bay Area. Browse our service areas below to learn more about sauna rentals in your neighborhood.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {serviceAreas.map((area, index) => (
                <div 
                  key={index}
                  className="bg-card rounded-lg p-8 border-2 border-border hover:border-accent transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <MapPin className="text-accent flex-shrink-0 mt-1" size={32} />
                    <div className="flex-1">
                      <h2 className="text-2xl font-heading font-semibold text-heading mb-3">
                        {area.title}
                      </h2>
                      <p className="text-muted-foreground mb-4">
                        {area.description}
                      </p>
                      {area.link ? (
                        <Link 
                          to={area.link}
                          className="text-accent hover:text-accent-dark font-medium inline-flex items-center gap-2"
                        >
                          Learn more →
                        </Link>
                      ) : (
                        <span className="text-muted-foreground/60 italic">
                          Details coming soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center bg-cedar-section rounded-lg p-8">
              <h3 className="text-2xl font-heading font-semibold mb-4 text-heading">
                Not sure if we serve your area?
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                We're expanding throughout the Bay Area. Get in touch to check availability.
              </p>
              <Link 
                to="/learn-more"
                className="inline-block bg-accent hover:bg-accent/90 text-white font-medium px-8 py-3 rounded-lg transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ServiceAreas;