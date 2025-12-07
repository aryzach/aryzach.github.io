import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import heroImage from "@/assets/sauna-rental-san-francisco-backyard.jpg";
import apartmentImage from "@/assets/indoor-sauna-install-san-francisco-apartment.jpg";
import noeValleyImage from "@/assets/sauna-install-noe-valley-garage.webp";
import innerSunsetImage from "@/assets/sauna-install-inner-sunset-bedroom.jpg";
import deliveryCrewImage from "@/assets/sauna-delivery-san-francisco-crew.jpeg";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";

const neighborhoods = [
  "Noe Valley", "Castro", "Mission District", "Bernal Heights", "Glen Park",
  "Hayes Valley", "Lower Haight", "Cole Valley", "Haight-Ashbury",
  "Inner Sunset", "Outer Sunset", "Inner Richmond", "Outer Richmond",
  "Laurel Heights", "Pacific Heights", "Cow Hollow", "Marina", "Russian Hill",
  "Nob Hill", "North Beach", "SoMa", "Potrero Hill", "Dogpatch", "Bayview",
  "Excelsior", "West Portal", "Twin Peaks", "St. Francis Wood", "Sea Cliff",
  "Presidio Heights", "Financial District", "Telegraph Hill"
];

const SaunaRentalSanFrancisco = () => {
  useSEO(seoData.saunaRentalSanFrancisco);
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://elfsightcdn.com/platform.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-semibold mb-6 text-heading tracking-tight leading-tight">
              Sauna Rental in San Francisco — Delivery, Setup, and Monthly Plans
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              We deliver plug-in saunas to homes and apartments across San Francisco neighborhoods including Noe Valley, Inner Sunset, Richmond, Hayes Valley, Bernal Heights, Russian Hill, and more.
            </p>
            <Button asChild size="lg" className="text-lg px-8">
              <Link to="/reserve-your-sauna">Check Availability in San Francisco</Link>
            </Button>
          </div>
          
          <div className="max-w-5xl mx-auto mt-12">
            <img 
              src={heroImage} 
              alt="Outdoor sauna rental installed in San Francisco backyard" 
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Quick Value Props */}
      <section className="py-12 md:py-16 bg-cedar-section">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Check className="text-accent flex-shrink-0 mt-1" size={24} />
                <div>
                  <p className="text-foreground font-medium">120V plug-in saunas that install in ~45 minutes</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="text-accent flex-shrink-0 mt-1" size={24} />
                <div>
                  <p className="text-foreground font-medium">No permits, no contractors, no remodeling</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="text-accent flex-shrink-0 mt-1" size={24} />
                <div>
                  <p className="text-foreground font-medium">Perfect for SF apartments, garages, and backyard decks</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="text-accent flex-shrink-0 mt-1" size={24} />
                <div>
                  <p className="text-foreground font-medium">We handle delivery, installation, and maintenance</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="text-accent flex-shrink-0 mt-1" size={24} />
                <div>
                  <p className="text-foreground font-medium">Flexible monthly plans</p>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <Link to="/pricing" className="text-accent hover:text-accent-dark font-medium">
                See pricing →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-6 text-heading">
              About Sauna Rentals in San Francisco
            </h2>
            <div className="prose prose-lg max-w-none text-muted-foreground space-y-4">
              <p>
                San Francisco's unique housing landscape—ranging from Victorian apartments and split-level flats to garage ADUs and Sunset District backyards—presents its own set of challenges when it comes to home wellness upgrades. But that's exactly where plug-in 120V saunas shine.
              </p>
              <p>
                Unlike traditional sauna installations that demand expensive electrical work, permits, and contractor coordination, our rental saunas plug directly into standard outlets. They're designed to work seamlessly with older electrical panels common in SF's historic buildings, making them ideal for renters and homeowners alike who want the benefits of daily heat therapy without the hassle or commitment of a permanent installation.
              </p>
              <p>
                As San Francisco's wellness and recovery culture continues to grow—fueled by everyone from tech workers seeking stress relief to athletes optimizing performance—more residents are discovering the transformative power of consistent sauna use. But buying a sauna outright isn't always practical: you might be renting, planning to move, or simply want to try before committing thousands of dollars.
              </p>
              <p>
                That's where sauna rentals make sense. Our flexible monthly plans let you enjoy all the benefits of at-home heat therapy—improved sleep, faster recovery, deeper relaxation—without the upfront cost, installation complexity, or long-term commitment. And if you live in the fog belt neighborhoods like the Sunset or Richmond, where the marine layer can make even summer feel like sweater weather, having a personal sauna becomes even more appealing.
              </p>
            </div>
            
            <div className="mt-12">
              <img 
                src={apartmentImage} 
                alt="Indoor sauna installed in San Francisco apartment" 
                className="w-full rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhoods Section */}
      <section className="py-16 md:py-24 bg-cedar-section">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-6 text-heading">
              San Francisco Neighborhoods We Serve
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              We deliver and install plug-in saunas anywhere in San Francisco, covering every major neighborhood, including:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {neighborhoods.map((neighborhood, index) => (
                <div key={index} className="bg-card rounded-lg p-3 border border-border">
                  <p className="text-foreground text-sm font-medium">{neighborhood}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recent Installations */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-6 text-heading">
              Recent Installations in San Francisco
            </h2>
            <div className="prose prose-lg max-w-none text-muted-foreground space-y-4 mb-12">
              <p>
                Every San Francisco installation tells its own story. Take our recent Noe Valley setup: a converted garage space that became a private wellness retreat. The narrow driveway and tight side gate presented a challenge, but our modular panel system made it possible. Within 45 minutes, the homeowner had a fully functional infrared sauna tucked into what was previously just storage space.
              </p>
              <p>
                In the Inner Sunset, we transformed a small spare bedroom on the second floor of a classic SF row house. The narrow stairwell and vintage hardwood floors required extra care during transport, but our team used protective padding and carried each panel up carefully. The homeowner simply needed to ensure they had a standard 120V outlet on a dedicated 15A circuit—which they did. The entire setup took about 40 minutes, and now they have a personal sauna sanctuary just steps from their bedroom.
              </p>
              <p>
                Out in the Richmond District, we installed an outdoor Finnish sauna on a backyard deck overlooking the fog rolling in from Ocean Beach. The customer already had the electrical outlet in place from their old patio heater, making it a straightforward install. We navigated the side gate with our dolly system, assembled the modular panels on-site, and they were enjoying their first session that same afternoon.
              </p>
              <p>
                San Francisco's architecture presents unique challenges—older buildings, steep staircases, limited access points, and uneven backyards—but our modular design and experienced installation team handle them routinely. Whether you're in a fourth-floor walk-up in Russian Hill, a basement ADU in Glen Park, or a Marina flat with a shared entryway, we've likely done similar installs. Most setups take 30 to 50 minutes, and the only thing you need to prepare is ensuring you have a standard 120V outlet nearby.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <img 
                  src={noeValleyImage} 
                  alt="Sauna installation in Noe Valley garage conversion" 
                  className="w-full h-64 object-cover rounded-lg shadow-lg mb-3"
                />
                <p className="text-sm text-muted-foreground text-center">Noe Valley garage conversion</p>
              </div>
              <div>
                <img 
                  src={innerSunsetImage} 
                  alt="Sauna installation in Inner Sunset bedroom" 
                  className="w-full h-64 object-cover rounded-lg shadow-lg mb-3"
                />
                <p className="text-sm text-muted-foreground text-center">Inner Sunset spare room</p>
              </div>
              <div>
                <img 
                  src={heroImage} 
                  alt="Outdoor sauna installation in Richmond District backyard" 
                  className="w-full h-64 object-cover rounded-lg shadow-lg mb-3"
                />
                <p className="text-sm text-muted-foreground text-center">Richmond District backyard deck</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Delivery Works */}
      <section className="py-16 md:py-24 bg-cedar-section">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-6 text-heading">
              How Delivery & Setup Works in San Francisco
            </h2>
            <div className="prose prose-lg max-w-none text-muted-foreground space-y-4 mb-8">
              <p>
                Delivering and installing saunas in San Francisco requires experience with the city's unique topography and architecture. Our team comes equipped with heavy-duty dollies designed for SF's infamous hills, and we've learned how to navigate everything from Nob Hill's steep inclines to the Marina's narrow side gates.
              </p>
              <p>
                The key advantage of our modular panel system is that it breaks down into manageable pieces that fit through tight entryways. We've successfully installed saunas in Victorian apartments with 32-inch doorways, walked units up four flights of stairs in North Beach walk-ups, and maneuvered through shared hallways in SoMa lofts. The panels are designed to be carried by hand, so even if your building has challenging access, we can usually make it work.
              </p>
              <p>
                For outdoor installations in backyards, we typically bring the panels through side gates or, when necessary, over fences with your permission. We've handled uneven deck surfaces, sloped yards, and tight clearances between neighboring properties. The installation itself takes 30 to 50 minutes once we're on-site—no tools needed from you, just access to a standard 120V outlet.
              </p>
              <p>
                Before delivery day, we'll coordinate timing that works around SF street parking and your schedule. You'll want to make sure the installation area is clear and that we have a dedicated electrical circuit available. From there, our team handles everything: panel assembly, electrical connection, temperature testing, and a walkthrough on how to use your new sauna. Maintenance is included in your monthly rental, so if anything needs attention down the line, we've got you covered.
              </p>
            </div>

            <div className="mt-8">
              <img 
                src={deliveryCrewImage} 
                alt="SF Sauna delivery crew with sauna unit" 
                className="w-full max-w-md mx-auto rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-8 text-heading">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-accent">
                  Can you install in apartments with old electrical panels?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes. Our 120V plug-in saunas are designed to work with standard household circuits, including older electrical panels common in San Francisco buildings. As long as you have a dedicated 15A circuit with a standard outlet, you're good to go. Most apartments and older homes already meet this requirement.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-accent">
                  Will a sauna overload my 120V circuit?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No, when used on a dedicated 15A circuit. Our saunas draw between 1.5-3 kW, well within standard household limits. We recommend not running other high-draw appliances (like space heaters or hair dryers) on the same circuit during sauna use, but otherwise, you're fine.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-accent">
                  Can you install in garage ADUs or basements?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Absolutely. Garage conversions and basements are among our most common installations in SF. As long as the space has ventilation (even a small window or vent works) and a standard electrical outlet, we can set it up. Garage ADUs in particular are ideal because they offer privacy and dedicated space.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-accent">
                  What if I live on the 3rd or 4th floor with no elevator?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  We handle it. Our modular panels are designed to be carried by hand up staircases, even narrow Victorian-era stairwells. We've done four-story walk-ups in Russian Hill and Telegraph Hill. It takes a bit longer, but it's part of what we do.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-accent">
                  Do you install in small studios?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes, though it depends on the available space. Our smallest units require about 3.5 x 3.5 feet of floor space. If you have a corner, closet area, or even a large bathroom, it might work. We're happy to do a free fit check via video call to confirm.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-accent">
                  Can the sauna go on an outdoor deck in foggy neighborhoods?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes. Our outdoor models are weather-resistant and built to handle SF's marine climate, including the persistent fog in the Sunset and Richmond. In fact, using a sauna in the fog is one of SF's great pleasures—step out into the cool mist after a hot session.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-accent">
                  Does the building need to approve anything?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  In most cases, no. Since our saunas are plug-in and non-permanent (no installation work, no modifications to the property), they're generally treated like furniture. However, if you're in a condo or rental with strict HOA rules, it's worth checking your lease or association guidelines. We're happy to provide documentation if needed.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-accent">
                  How quiet is the sauna (for shared walls)?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Very quiet. Infrared saunas have no moving parts and produce virtually no noise. Finnish dry saunas have a small fan inside the heater, which creates a low hum similar to a refrigerator—barely noticeable and unlikely to disturb neighbors through shared walls.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-accent">
                  Do you install on uneven backyard surfaces?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  We can work with slight unevenness using shims to level the base. If your deck or patio has significant slope or structural concerns, we'll assess during the fit check and recommend solutions (like adding a small leveling platform).
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10" className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-accent">
                  What's the setup time?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Typically 30 to 50 minutes from the moment we arrive to when the sauna is fully assembled, plugged in, and tested. If there are stairs or tight access points, it may take a bit longer, but we aim to be in and out within an hour.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-16 md:py-24 bg-cedar-section">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-8 text-heading text-center">
              What San Francisco Customers Say
            </h2>
            <div className="min-h-[400px]">
              <div className="elfsight-app-8e4c426b-67fd-4565-8145-975c8d5acc74" data-elfsight-app-lazy></div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-6 text-heading">
              Ready for your sauna?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/reserve-your-sauna">Check Availability in San Francisco</Link>
              </Button>
              <Link to="/pricing" className="text-accent hover:text-accent-dark font-medium text-lg">
                View pricing →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Schema Markup */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "serviceType": "Sauna Rental",
          "provider": {
            "@type": "LocalBusiness",
            "name": "SF Sauna Rental",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "San Francisco",
              "addressRegion": "CA",
              "addressCountry": "US"
            }
          },
          "areaServed": neighborhoods.map(name => ({
            "@type": "City",
            "name": name + ", San Francisco, CA"
          }))
        })}
      </script>
    </div>
  );
};

export default SaunaRentalSanFrancisco;