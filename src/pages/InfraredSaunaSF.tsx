import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import indoorInfraredImg from "@/assets/indoorinfrared.png";
import infraredImg from "@/assets/infraredd1.png";

const InfraredSaunaSF = () => {
  const neighborhoods = {
    "San Francisco": [
      "Mission", "Noe Valley", "Castro", "SoMa", "Mission Bay", "Hayes Valley", 
      "Lower Haight", "Upper Haight", "Cole Valley", "Inner Sunset", "Outer Sunset", 
      "Inner Richmond", "Outer Richmond", "Pacific Heights", "Lower Pac Heights", 
      "Presidio Heights", "Marina", "Cow Hollow", "North Beach", "Russian Hill", 
      "Nob Hill", "Bernal Heights", "Potrero Hill", "Dogpatch", "Glen Park", 
      "West Portal", "Forest Hill", "Twin Peaks", "Diamond Heights", "Excelsior", "Ingleside"
    ],
    "Marin": [
      "Mill Valley", "Sausalito", "Larkspur", "Corte Madera", "Tiburon", 
      "Belvedere", "San Anselmo", "Fairfax"
    ],
    "East Bay": [
      "Berkeley", "North Berkeley", "Rockridge", "Piedmont", "Oakland Hills", 
      "Temescal", "Montclair", "Alameda"
    ],
    "Peninsula": [
      "Daly City", "South SF", "San Bruno", "Burlingame", "San Mateo", 
      "Redwood City", "Menlo Park", "Palo Alto"
    ]
  };

  const testimonials = [
    {
      name: "Jerry Cheung",
      text: "The sauna was super clean, great quality, and just felt amazing to use. It was so easy to have it at home and chill"
    },
    {
      name: "Liam Bailey",
      text: "this shit is hot. the guy was solid as well."
    }
  ];

  const benefits = [
    "Fast warmup",
    "Great for daily recovery",
    "Lower perceived heat",
    "Quiet operation",
    "Perfect for multi-session days",
    "Uses ~1.5–2.5 kW",
    "Compatible with almost every SF apartment outlet"
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-20">
        {/* Hero Image */}
        <section className="w-full bg-background">
          <div className="container mx-auto px-4 max-w-5xl py-12">
            <img
              src={indoorInfraredImg}
              alt="Indoor infrared sauna"
              className="w-full rounded-lg"
            />
          </div>
        </section>

        <article className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <header className="mb-12">
              <h1 className="text-4xl md:text-5xl font-semibold mb-6 text-foreground leading-tight">
                Infrared Sauna Rental in San Francisco
              </h1>
            </header>
            
            <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
              <p>
                Infrared saunas are the go-to for people who want daily recovery without the blast-furnace vibe of a Finnish heater. Lower temps, deeper heat penetration, faster warm-up, and they run on any 120V outlet in SF.
              </p>
            </div>

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-6 text-foreground">
                Why Infrared Works for SF Renters
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Small footprint, minimal heat spill, and no structural requirements. They slot into bedrooms, offices, garages, even living rooms. Consistent use is the whole point — and having it at home makes that happen.
              </p>
            </section>

            {/* Image */}
            <div className="my-12">
              <img
                src={infraredImg}
                alt="Infrared sauna experience"
                className="w-full rounded-lg"
              />
            </div>

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-6 text-foreground">
                What You Get With Our Rental
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Delivery, installation, fit check, safety briefing, ongoing support, and teardown whenever you're done. You don't lift anything heavier than a tea mug.
              </p>
            </section>

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-6 text-foreground">
                Benefits of Infrared Saunas
              </h2>
              
              <div className="bg-card rounded-lg p-6 border border-border">
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                      <Check className="text-[hsl(var(--color-accent))] mt-0.5 flex-shrink-0" size={18} />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-6 text-foreground">
                At-Home Infrared vs Spa
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Spa visits are fine. But commuting 3–4x a week to sit in someone else's heat chamber is clown mode compared to flipping a switch at home.
              </p>
            </section>

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-8 text-foreground">
                Testimonials
              </h2>
              
              <div className="space-y-6">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="bg-card rounded-lg p-6 border border-border">
                    <p className="text-muted-foreground leading-relaxed italic">
                      "{testimonial.text}"
                    </p>
                    <p className="text-foreground font-medium mt-4">— {testimonial.name}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-8 text-foreground">
                Service Areas
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                {Object.entries(neighborhoods).map(([area, locations]) => (
                  <div key={area} className="bg-card rounded-lg p-6 border border-border">
                    <h3 className="text-xl font-semibold mb-4 text-card-foreground">
                      {area}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {locations.join(" • ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="mt-12 text-center">
              <Link to="/learn-more">
                <Button 
                  size="lg"
                  className="bg-[hsl(var(--color-accent))] hover:bg-[hsl(var(--color-accent-dark))] text-[hsl(var(--color-white))]"
                >
                  Get in Touch
                </Button>
              </Link>
            </div>

            {/* Schema Markup */}
            <div dangerouslySetInnerHTML={{
              __html: `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "serviceType": "Infrared Sauna Rental",
  "provider": {
    "@type": "LocalBusiness",
    "name": "SF Sauna Rental",
    "url": "https://sfsaunarental.com/infrared-sauna-san-francisco/",
    "email": "sfsaunarental@gmail.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "San Francisco",
      "addressRegion": "CA",
      "addressCountry": "US"
    }
  },
  "description": "Infrared sauna rentals in San Francisco with free fit check, delivery, installation, and support.",
  "areaServed": [
    "San Francisco",
    "Marin County",
    "Berkeley",
    "Oakland",
    "San Mateo County"
  ],
  "offers": {
    "@type": "Offer",
    "priceCurrency": "USD",
    "price": "Varies",
    "description": "Monthly infrared sauna rental including delivery, installation, and teardown."
  }
}
</script>
              `
            }} />
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default InfraredSaunaSF;
