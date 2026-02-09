import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import indoorInfraredImg from "@/assets/indoorinfrared.png";
import outdoorInfraredImg from "@/assets/outdoorinfrared.png";
import outdoorInfrared2Img from "@/assets/outdoorinfrared2.png";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";

const InHomeSaunaSF = () => {
  useSEO(seoData.inHomeSaunaSF);
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
      name: "Mackenzie Croxdale",
      text: "I love having a sauna at home! I rent and might move in a year or two, so this was much easier and more accessible for me"
    },
    {
      name: "Jackson Harris",
      text: "Was honestly impressed with how seamless the installation was. Zach seems like a great guy."
    },
    {
      name: "Elliot Verduzco",
      text: "Been renting a sauna from SF Sauna Rental for 3 months. Zach set it up in my apartment and I use it after workouts."
    }
  ];

  const benefits = [
    "Always available",
    "No booking, no commute",
    "Private (no sweaty randos)",
    "You control heat, humidity, lighting",
    "Use it daily without extra cost",
    "Perfect for morning heat shock or pre-sleep sessions",
    "Cheaper than going to a spa 8–12 times a month",
    "Works with your actual life rhythm"
  ];

  const spaVisitIssues = [
    "$50–$100 per session",
    "Time-sink",
    "Crowded during peak hours",
    "Stressful commute",
    "Zero consistency",
    "The opposite of meditative"
  ];

  const faqs = [
    {
      q: "How long does installation take?",
      a: "About 2–3 hours. We handle everything."
    },
    {
      q: "Do I need special electrical?",
      a: "No. All units run on standard 120V household outlets."
    },
    {
      q: "Can I put a sauna indoors in an apartment?",
      a: "Yes — we do it all the time. Zero heat damage when set up correctly."
    },
    {
      q: "How fast do they heat?",
      a: "Infrared: ~20–30 min. Steam: ~30–60 min depending on model."
    },
    {
      q: "Can I turn it on in the morning and leave it running?",
      a: "Most people heat it, use it, turn it off. You only run it when you want to use it."
    }
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
              alt="Indoor infrared sauna rental installed in San Francisco apartment"
              className="w-full rounded-lg"
            />
          </div>
        </section>

        <article className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <header className="mb-12">
              <h1 className="text-4xl md:text-5xl font-semibold mb-6 text-foreground leading-tight">
                In-Home Sauna Rental in San Francisco
              </h1>
            </header>
            
            <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
              <p>
                Using a sauna once in a while is fine. Using a sauna consistently is where the physiological improvements actually show up — cardiovascular resilience, stress reduction, sleep depth, the whole longevity-bait package. The problem is that in San Francisco, most people rent. That means: no remodeling, no 240V upgrades, no owning a 500-lb wooden box you have to drag between leases. And trekking to a crowded spa after work feels like a punishment ritual, not wellness.
              </p>
              
              <p>
                This is why SF Sauna exists: to make daily sauna use realistic for normal SF living, especially if you rent your place, move often, or don't want to play electrician on your day off. We handle literally everything — the space check, electrical read, delivery, installation, teardown, the whole ordeal. You just press ON and sweat.
              </p>
            </div>

            {/* Image Grid */}
            <div className="grid md:grid-cols-2 gap-6 my-12">
              <img
                src={outdoorInfraredImg}
                alt="Outdoor infrared sauna installed in Bay Area backyard"
                className="w-full rounded-lg"
              />
              <img
                src={outdoorInfrared2Img}
                alt="Outdoor home sauna rental on San Francisco deck"
                className="w-full rounded-lg"
              />
            </div>

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-6 text-foreground">
                Daily Heat Therapy Without Leaving Home
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Consistency is the whole ballgame. A 20–30 minute session you can do before bed or right after coffee is 10x more sustainable than scheduling spa trips or commuting to a gym. Having the unit in your home means the friction is basically zero. Flip it on, let it heat while you make tea, step in, step out, done.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We rent both infrared and steam saunas, each with indoor and outdoor options depending on your space. No noisy fans, no sketchy Amazon saunas. Legit units. Legit heat.
              </p>
            </section>

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-6 text-foreground">
                Designed for Renters
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                SF is a city of transience — job changes, roommate swaps, housing musical chairs. Buying a sauna is a capital-B Commitment. Renting one is lightweight. When you move, we move it. When you're done, we pick it up. No sunk cost, no weird Craigslist buyer energy.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Electrical? All our units run on standard 120V. If you've got a regular outlet, you're fine. If not, we'll tell you.
              </p>
            </section>

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-6 text-foreground">
                What Installation Looks Like
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We schedule a free fit check, confirm your electrical, choose the model with you, and install in ~2–3 hours. Our team handles all carpentry, leveling, panel locks, wiring, and safety checks. You don't touch tools. You don't drag anything up stairs. You don't deal with freight shipping.
              </p>
            </section>

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-6 text-foreground">
                Why At-Home Sauna &gt; Spa Visit
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-card rounded-lg p-6 border border-border">
                  <h3 className="text-xl font-semibold mb-4 text-card-foreground">
                    At-home sauna:
                  </h3>
                  <ul className="space-y-3">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2 text-muted-foreground">
                        <Check className="text-[hsl(var(--color-accent))] mt-0.5 flex-shrink-0" size={18} />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-card rounded-lg p-6 border border-border">
                  <h3 className="text-xl font-semibold mb-4 text-card-foreground">
                    Spa visit:
                  </h3>
                  <ul className="space-y-3">
                    {spaVisitIssues.map((issue, index) => (
                      <li key={index} className="text-muted-foreground">
                        • {issue}
                      </li>
                    ))}
                  </ul>
                </div>
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

            <section className="mt-16">
              <h2 className="text-3xl font-semibold mb-8 text-foreground">
                FAQ
              </h2>
              
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-card rounded-lg p-6 border border-border">
                    <h3 className="text-lg font-semibold mb-3 text-card-foreground">
                      {faq.q}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.a}
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

export default InHomeSaunaSF;
