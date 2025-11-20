import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const SaunaRentalSF = () => {
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
      name: "satya kamdar",
      text: "Life with Sauna, is way better than life without. Thanks to Zach, I was able to rent a sauna which makes way more sense, since I'm renting my apartment. Setup, delivery, and customer service were impeccable. Thank you!"
    },
    {
      name: "Rahul Batra",
      text: "Zach's installation was seamless and he provided incredible service and good communication throughout. He has one very happy customer in me."
    }
  ];

  const rentalBenefits = [
    "Renting is flexible",
    "No upfront $3k–$10k",
    "Perfect for renters",
    "No freight delivery nightmare",
    "We handle all teardown",
    "You can switch models anytime",
    "If you move, we reinstall"
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
              <source src="/media/0804_12-2.mp4" type="video/mp4" />
            </video>
          </div>
        </section>

        <article className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <header className="mb-12">
              <h1 className="text-4xl md:text-5xl font-semibold mb-6 text-foreground leading-tight">
                Sauna Rental SF — At-Home Sauna Delivery & Setup
              </h1>
            </header>

            <section className="mb-16">
              <h2 className="text-3xl font-semibold mb-6 text-foreground">
                Full-Service Sauna Rental in SF
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We bring the sauna to your home, set it up, level it, wire it correctly, and show you how to use it. The goal: remove every friction point that stops people from using a sauna consistently.
              </p>
            </section>

            {/* Video */}
            <div className="my-12">
              <video autoPlay muted loop playsInline className="w-full rounded-lg">
                <source src="/media/IMG_5789_1-2.mp4" type="video/mp4" />
              </video>
            </div>

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-6 text-foreground">
                Why People Rent Instead of Buy
              </h2>
              
              <div className="bg-card rounded-lg p-6 border border-border">
                <ul className="space-y-3">
                  {rentalBenefits.map((benefit, index) => (
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
                Infrared or Finnish — Your Choice
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                You choose the heat flavor. Both run on standard 120V. Both fit into SF apartments shockingly well.
              </p>
            </section>

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-6 text-foreground">
                At-Home vs Spa
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">At-home</strong> = daily use
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Spa</strong> = occasional use
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  The difference in outcomes is night/day.
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
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default SaunaRentalSF;
