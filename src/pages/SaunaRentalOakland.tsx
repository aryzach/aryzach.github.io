import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleReviews from "@/components/GoogleReviews";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import saunaRentalOaklandHero from "@/assets/sauna-rental-oakland-backyard.png";
import indoorSaunaOakland from "@/assets/indoor-sauna-install-oakland-apartment.jpg";
import saunaInstallRockridge from "@/assets/sauna-install-rockridge-garage.avif";
import saunaInstallTemescal from "@/assets/sauna-install-temescal-bedroom.webp";
import saunaInstallMontclair from "@/assets/sauna-install-montclair-backyard.jpg";
import saunaDeliveryOakland from "@/assets/sauna-delivery-oakland-crew.webp";
import customerUsingOakland from "@/assets/customer-using-sauna-oakland.webp";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";

const neighborhoods = [
  "Rockridge", "Temescal", "Piedmont Avenue", "Grand Lake", "Lakeshore", "Montclair",
  "Crocker Highlands", "Adams Point", "Jack London Square", "Uptown", "Downtown Oakland",
  "Glenview", "Trestle Glen", "Dimond District", "Laurel", "Redwood Heights", "Maxwell Park",
  "Allendale", "Oakmore", "Cleveland Heights", "Fruitvale", "Highland Park", "Bushrod",
  "North Oakland", "Golden Gate", "Claremont (Oakland side)", "Jingletown", "East Lake",
  "Hoover-Foster", "West Oakland"
];

const faqs = [
  {
    question: "Can you install in older Craftsman homes with dated electrical panels?",
    answer: "Yes. Our saunas run on standard 120V household power and draw about the same load as a hair dryer. They work with older panels without requiring any electrical upgrades."
  },
  {
    question: "Will a sauna overload my 120V circuit?",
    answer: "No. The sauna draws 1.5–3 kW on a standard 15A circuit, similar to a space heater or hair dryer. No circuit upgrades needed."
  },
  {
    question: "Can you install in Oakland duplexes, ADUs, or backyard studios?",
    answer: "Absolutely. We install in all types of Oakland housing—duplexes, Craftsman homes, ADUs, backyard studios, apartments, and garages. As long as there's a standard outlet and enough floor space (48\" × 42\"), we can set it up."
  },
  {
    question: "What if I'm in an upper-floor unit with tight stairs?",
    answer: "Our modular panel system is designed for exactly this. We've installed saunas in upper-floor Oakland apartments with narrow Craftsman staircases many times. The panels break down small enough to navigate tight turns and steep stairs."
  },
  {
    question: "Do you install in small apartments in Temescal or Downtown?",
    answer: "Yes. The sauna footprint is 48\" × 42\"—about the size of a large armchair. If you have a spare corner in a bedroom, office, or even a walk-in closet, it can work."
  },
  {
    question: "Can the sauna go on a backyard deck in Montclair?",
    answer: "Yes. Our outdoor saunas are built for deck installation. They're weatherproof and designed to handle Oakland's fog, rain, and temperature swings."
  },
  {
    question: "Do I need to ask my landlord or HOA for approval?",
    answer: "In most cases, no. The sauna is a plug-in appliance—nothing is hardwired, drilled, vented, or permanently installed. It sits on the floor like furniture. Most Oakland renters don't need permission, but check your lease if it mentions heat-producing appliances."
  },
  {
    question: "Is the sauna quiet enough for shared walls in multiplexes?",
    answer: "Yes. The sauna runs quietly—about as loud as a small fan. The insulated walls keep both heat and sound contained. Neighbors won't hear it."
  },
  {
    question: "Can you deliver via side gate if my driveway is narrow?",
    answer: "Yes. We handle narrow driveways, side gates, and backyard access regularly in Oakland. Our team uses dollies and modular panels to navigate tight spaces."
  },
  {
    question: "What's the setup time?",
    answer: "About 30–50 minutes. We handle the full assembly, plug it in, test it, and show you how to use it. You don't need to do anything."
  }
];

const SaunaRentalOakland = () => {
  useSEO(seoData.saunaRentalOakland);
  return (
    <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="pt-32 pb-16 md:pt-40 md:pb-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-semibold mb-6 text-heading tracking-tight leading-tight">
                Sauna Rental in Oakland — Delivery, Setup, and Monthly Plans
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                We deliver plug-in saunas to homes and apartments across Oakland neighborhoods including Rockridge, Temescal, Piedmont Ave, Grand Lake, Montclair, and more.
              </p>
              <div className="mb-12">
                <Link to="/reserve-your-sauna">
                  <Button size="lg" className="w-full md:w-auto">
                    Check Availability in Oakland
                  </Button>
                </Link>
              </div>
              <div className="rounded-lg overflow-hidden mb-8">
                <img 
                  src={saunaRentalOaklandHero} 
                  alt="Sauna rental delivered to Oakland backyard" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Value Props */}
        <section className="py-12 bg-cedar-section">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-accent flex-shrink-0 mt-1" size={24} />
                  <p className="text-foreground">120V plug-in saunas that install in ~45 minutes</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-accent flex-shrink-0 mt-1" size={24} />
                  <p className="text-foreground">No permits, no contractors, no remodeling</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-accent flex-shrink-0 mt-1" size={24} />
                  <p className="text-foreground">Perfect for Oakland apartments, bungalows, and backyard decks</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-accent flex-shrink-0 mt-1" size={24} />
                  <p className="text-foreground">We handle delivery, installation, and maintenance</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="text-accent flex-shrink-0 mt-1" size={24} />
                  <p className="text-foreground">Flexible monthly plans</p>
                </div>
              </div>
              <div className="text-center">
                <Link to="/pricing" className="text-accent hover:text-accent-dark font-medium">
                  See pricing →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* About Sauna Rentals in Oakland */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-6 text-heading">
                About Sauna Rentals in Oakland
              </h2>
              <div className="grid md:grid-cols-2 gap-8 items-start mb-8">
                <div>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    Oakland's housing mix—Craftsman bungalows, renovated Victorians, duplexes, ADUs, and backyard studios—creates unique opportunities for at-home sauna use. Our plug-in 120V saunas work extremely well with older electrical panels and fit perfectly in small rooms, garages, or outdoor decks.
                  </p>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    Oakland's growing recovery and wellness culture—from runners hitting Lake Merritt trails to cyclists climbing the hills to desk-bound tech workers recovering from long hours—has created real demand for consistent sauna access. But buying a sauna means construction, electrical work, and a big upfront purchase. For renters (which many Oaklanders are), that doesn't work.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    That's where SF Sauna comes in. We deliver and install plug-in saunas with no contractors, no permits, and no permanent changes to your home. Whether you're in a fog pocket in Montclair, the warmer flats near Lake Merritt, or a duplex in Temescal, sauna use fits seamlessly into Oakland's microclimates and lifestyle.
                  </p>
                </div>
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={indoorSaunaOakland} 
                    alt="Indoor sauna installation in Oakland apartment" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Oakland Neighborhoods We Serve */}
        <section className="py-16 md:py-24 bg-cedar-section">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-6 text-heading">
                Oakland Neighborhoods We Serve
              </h2>
              <p className="text-muted-foreground mb-8">
                We deliver and install plug-in saunas anywhere in Oakland, covering every major neighborhood, including:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {neighborhoods.map((neighborhood, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="text-accent flex-shrink-0" size={20} />
                    <span className="text-foreground">{neighborhood}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Recent Installations in Oakland */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-6 text-heading">
                Recent Installations in Oakland
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                We've installed saunas across Oakland in a wide range of settings. A recent Rockridge install went into a converted garage—the customer wanted a wellness space separate from the main house. The modular panels fit through a 30-inch door and setup took 45 minutes. In Temescal, we set up an infrared sauna in a small spare bedroom in a 1920s duplex. The narrow stairwell and tight hallway corners were no issue thanks to the modular design. Up in Montclair, we installed an outdoor steam sauna on a backyard deck with a steep approach—our team used dollies to navigate the hill and had it running in under an hour.
              </p>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Oakland's older Craftsman homes, narrow driveways, and steep hillsides require some planning, but our modular panel system handles it all. Most installs take 30–50 minutes. All you need is one standard 120V outlet on a 15A circuit (the same outlet you'd use for a space heater or hair dryer). We handle Oakland-specific delivery quirks—limited street parking, side gate access, stepped entries, tight indoor turns—on a regular basis. If your space has power and fits a 48\" × 42\" footprint, we can make it work.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={saunaInstallRockridge} 
                    alt="Sauna installation in Rockridge garage conversion" 
                    className="w-full h-auto"
                  />
                  <p className="text-sm text-muted-foreground mt-2 text-center">Rockridge garage conversion</p>
                </div>
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={saunaInstallTemescal} 
                    alt="Sauna installation in Temescal bedroom" 
                    className="w-full h-auto"
                  />
                  <p className="text-sm text-muted-foreground mt-2 text-center">Temescal spare bedroom</p>
                </div>
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={saunaInstallMontclair} 
                    alt="Sauna installation in Montclair backyard" 
                    className="w-full h-auto"
                  />
                  <p className="text-sm text-muted-foreground mt-2 text-center">Montclair backyard deck</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How Delivery & Setup Works in Oakland */}
        <section className="py-16 md:py-24 bg-cedar-section">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-6 text-heading">
                    How Delivery & Setup Works in Oakland
                  </h2>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    We navigate Oakland's hills (especially Montclair and upper Rockridge) with dollies and modular panels designed for tight spaces. The sauna arrives in panels small enough to fit through narrow Craftsman hallways, steep staircases, side gates, basement entries, and duplex stairwells.
                  </p>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    Once we're inside, setup takes about 45 minutes. All you need to prepare is one standard 120V outlet and enough floor space (48\" × 42\"). We assemble the panels, plug it in, test it, and show you how to use it. You don't need any tools or electrical knowledge.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Free maintenance and support are included with your rental. If anything needs attention, we handle it. When you're ready to end your rental or move, we pick it up and remove it—no hassle, no damage, no trace left behind.
                  </p>
                </div>
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={saunaDeliveryOakland} 
                    alt="SF Sauna delivery crew installing sauna in Oakland" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Oakland-Specific FAQs */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-6 text-heading text-center">
                Frequently Asked Questions
              </h2>
              <p className="text-center text-muted-foreground mb-12">
                Oakland-specific questions about sauna rentals
              </p>
              
              <Accordion type="single" collapsible>
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left text-foreground hover:text-primary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Customer Reviews */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-8 text-heading text-center">
                What Oakland Customers Say
              </h2>
              <div className="mb-12 rounded-lg overflow-hidden">
                <img 
                  src={customerUsingOakland} 
                  alt="Oakland customer using their rental sauna" 
                  className="w-full h-auto"
                />
              </div>
              <GoogleReviews />
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 md:py-24 bg-cedar-section">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-6 text-heading">
                Ready for your sauna?
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/reserve-your-sauna">
                  <Button size="lg">
                    Check Availability in Oakland
                  </Button>
                </Link>
                <Link to="/pricing" className="text-accent hover:text-accent-dark font-medium">
                  View pricing →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
  );
};

export default SaunaRentalOakland;
