import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const FinnishSaunaSF = () => {
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
      name: "Suraj Srivats",
      text: "Great quality saunas. Visited the shop and tried out a custom Finnish sauna made by the sauna man of sf (himself). High quality, short quantity, get your rental asap!"
    },
    {
      name: "Skye Vanderlinden",
      text: "Zach is incredibly kind and accommodating! 10/10 recommend!"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-20">
        {/* Hero Video */}
        <section className="w-full bg-background">
          <div className="container mx-auto px-4 max-w-5xl py-12">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full rounded-lg"
            >
              <source src="/media/0804_9-2.mp4" type="video/mp4" />
            </video>
          </div>
        </section>

        <article className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <header className="mb-12">
              <h1 className="text-4xl md:text-5xl font-semibold mb-6 text-foreground leading-tight">
                Finnish Sauna Rental in SF
              </h1>
            </header>
            
            <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
              <p>
                For people who want the Real Heat — the traditional dry sauna experience — Finnish units deliver. Higher temps, that crisp dry air, and the sensation you can't fake with anything IR-adjacent.
              </p>
            </div>

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-6 text-foreground">
                Real Heat, Real Sweat
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Finnish saunas hit 170–195°F depending on the model. It's the gold standard for para-sympathetic down-regulation and actual heat shock protein activation.
              </p>
            </section>

            {/* Video */}
            <div className="my-12">
              <video autoPlay muted loop playsInline className="w-full rounded-lg">
                <source src="/media/0804_10-2.mp4" type="video/mp4" />
              </video>
            </div>

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-6 text-foreground">
                Perfect for Homes & Apartments
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                People assume a Finnish sauna will nuke their drywall. Reality: no. With correct installation (we do it), zero issues. No moisture spillage, no steam, no landlord freakouts.
              </p>
            </section>

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-6 text-foreground">
                Installation & Power
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We use units that run on standard 120V or can be adapted depending on your space. No remodel needed.
              </p>
            </section>

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-6 text-foreground">
                Finnish vs Infrared
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Infrared</strong> = gentle, recovery-oriented
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Finnish</strong> = high heat, ritual energy, closer to Nordic tradition
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Both work. You just choose your vibe.
                </p>
              </div>
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
  "serviceType": "Finnish Sauna Rental",
  "provider": {
    "@type": "LocalBusiness",
    "name": "SF Sauna Rental",
    "url": "https://sfsaunarental.com/finnish-sauna-san-francisco/",
    "email": "sfsaunarental@gmail.com",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "San Francisco",
      "addressRegion": "CA",
      "addressCountry": "US"
    }
  },
  "description": "High-heat Finnish sauna rentals in San Francisco. Real Nordic-style heat delivered and installed in your home.",
  "areaServed": [
    "San Francisco",
    "Marin",
    "Oakland",
    "Berkeley",
    "Peninsula Cities"
  ],
  "offers": {
    "@type": "Offer",
    "priceCurrency": "USD",
    "price": "Varies",
    "description": "Monthly Finnish sauna rental with delivery, installation, and ongoing support."
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

export default FinnishSaunaSF;
