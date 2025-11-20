import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";

const SaunaSanFrancisco = () => {
  const neighborhoods = {
    "San Francisco": [
      "Mission", "Mission Bay", "SOMA", "Hayes Valley", "NoPa", "Noe Valley", 
      "The Castro", "Lower Haight", "Upper Haight", "Cole Valley", "Inner Sunset", 
      "Outer Sunset", "Inner Richmond", "Outer Richmond", "Pacific Heights", 
      "Lower Pac Heights", "Presidio Heights", "Marina", "Cow Hollow", "North Beach", 
      "Russian Hill", "Nob Hill", "Tenderloin", "Bernal Heights", "Potrero Hill", 
      "Dogpatch", "Glen Park", "West Portal", "Forest Hill", "Twin Peaks", 
      "Diamond Heights", "Excelsior", "Ingleside"
    ],
    "Marin County": [
      "Mill Valley", "Sausalito", "Corte Madera", "Larkspur", "San Anselmo", 
      "Fairfax", "Tiburon", "Belvedere", "Greenbrae"
    ],
    "East Bay": [
      "Berkeley", "North Berkeley", "Elmwood", "Rockridge", "Piedmont", 
      "Oakland Hills", "Temescal", "Montclair", "Alameda"
    ],
    "Peninsula": [
      "Daly City", "South SF", "San Bruno", "Burlingame", "San Mateo", 
      "Redwood City", "Menlo Park", "Palo Alto"
    ]
  };

  const testimonials = [
    {
      name: "Page Finlay",
      title: "Page Finlay Design",
      text: "Zach and team came to install my sauna and it was a quick and seamless process, super kind guys! I am so happy with the sauna, it's in pristine condition and my first sweat was amazing. This is the life upgrade I have been wanting as a renter for a long time. Feels very luxurious having a sauna at home, and totally worth it for my heath and wellness! 10/10 recommend!"
    },
    {
      name: "Peter Wong",
      text: "Honestly amazing. The Finnish sauna / dry sauna got warm super quick and managed to fit two people in very comfortably."
    },
    {
      name: "Vicky Rusconi",
      text: "I can not recommend this company enough! What a great idea. Zach was so nice and super prompt. He delivered and set it up, made sure it worked and showed me how it works. I would give 10 stars if I could!!!!"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-20">
        <article className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <header className="mb-12">
              <h1 className="text-4xl md:text-5xl font-semibold mb-6 text-foreground leading-tight">
                Why Consistent Sauna Use Matters — And How SF Renters Can Actually Make It Happen
              </h1>
            </header>
            
            <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
              <p>
                Everyone loves a good sweat, but afaict the real long-term health upside from sauna use only shows up when you do it consistently. Not once a week when you remember. Not when Equinox isn't packed. Actual daily or near-daily heat exposure. That's where people see improvements in sleep, recovery, stress, and cardio markers.
              </p>
              
              <p>
                The problem: most people in SF rent. Apartments, flats, ADUs, whatever. And owning a sauna is a Big Serious Noun. You've got to choose the right model, decode electrical requirements, coordinate freight delivery, and then somehow install the thing without blowing a breaker.
              </p>
              
              <p>
                That's literally why we started SF Sauna. Even if you rent your place, you should still be able to have a proper home sauna. We handle everything. We do a space check, electrical review, delivery, install, and teardown, so you just walk in, hit ON, and sweat whenever you want. No ownership commitment. No landlord drama. No commute.
              </p>
            </div>

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-8 text-foreground">
                Neighborhoods We Serve
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
              
              <p className="text-center text-muted-foreground mt-6 italic">
                (If you're slightly outside the map, idk, ask, we flex more than we advertise.)
              </p>
            </section>

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-8 text-foreground">
                Testimonials
              </h2>
              
              <div className="space-y-6">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="bg-card rounded-lg p-6 border border-border">
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="fill-[hsl(var(--color-accent))] text-[hsl(var(--color-accent))]" size={16} />
                      ))}
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      "{testimonial.text}"
                    </p>
                    <p className="text-foreground font-medium">
                      — {testimonial.name}
                      {testimonial.title && ` of ${testimonial.title}`}
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
  "@type": "LocalBusiness",
  "name": "SF Sauna Rental",
  "image": "https://sfsaunarental.com/YOUR-HERO-IMAGE.jpg",
  "@id": "https://sfsaunarental.com/sauna-san-francisco/",
  "url": "https://sfsaunarental.com/sauna-san-francisco/",
  "telephone": "",
  "email": "sfsaunarental@gmail.com",
  "priceRange": "$$",
  "description": "In-home sauna rental in San Francisco. We deliver, install, and maintain infrared and Finnish saunas for apartments, homes, and backyard spaces.",
  "areaServed": [
    "San Francisco",
    "Marin County",
    "Berkeley",
    "Oakland",
    "San Mateo County",
    "Palo Alto",
    "Menlo Park",
    "Redwood City",
    "Daly City"
  ],
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "San Francisco",
    "addressRegion": "CA",
    "addressCountry": "US"
  },
  "sameAs": [
    "https://www.instagram.com/YOURHANDLE"
  ],
  "makesOffer": [
    {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": "In-Home Sauna Rental",
        "description": "Full-service infrared and Finnish sauna rental with delivery, installation, and maintenance."
      }
    }
  ]
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

export default SaunaSanFrancisco;
