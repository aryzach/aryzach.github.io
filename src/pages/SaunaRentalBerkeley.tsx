import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleReviews from "@/components/GoogleReviews";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import heroImage from "@/assets/sauna-rental-berkeley-backyard.jpeg";
import indoorInstall from "@/assets/indoor-sauna-install-oakland-apartment.jpg";
import northBerkeleyGarage from "@/assets/sauna-install-north-berkeley-garage.jpg";
import elmwoodBedroom from "@/assets/sauna-install-elmwood-bedroom.jpg";
import berkeleyHillsBackyard from "@/assets/sauna-install-berkeley-hills-backyard.webp";
import deliveryCrew from "@/assets/sauna-delivery-oakland-crew.webp";
import customerUsingSauna from "@/assets/customer-using-sauna-oakland.webp";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";

const neighborhoods = [
  "North Berkeley",
  "Central Berkeley",
  "South Berkeley",
  "Downtown Berkeley",
  "Elmwood",
  "Claremont",
  "Berkeley Hills",
  "Thousand Oaks",
  "Solano Avenue Area",
  "West Berkeley",
  "Ocean View",
  "Westbrae",
  "Poet's Corner",
  "Le Conte",
  "Gourmet Ghetto",
  "UC Berkeley Campus Area",
  "Cragmont",
  "Panoramic Hill",
  "Northbrae",
  "East Campus",
  "Bateman",
  "Southside",
  "South Campus",
  "King",
  "Lorin District",
  "Ashby Arts District",
];

const faqs = [
  {
    question: "Can you install in older craftsman houses with older wiring?",
    answer: "Yes. Our saunas run on standard 120V outlets (the same ones your microwave and hairdryer use). They work perfectly with Berkeley's older electrical panels. No special wiring, no electrician needed—just a standard 15-amp circuit."
  },
  {
    question: "Will a sauna overload my 120V circuit?",
    answer: "No. Our units are designed to run safely on standard household circuits. Infrared saunas draw about 1,500 watts, while Finnish dry saunas use around 1,800 watts—well within the capacity of a typical 15-amp circuit. Just avoid running other high-draw appliances on the same circuit during use."
  },
  {
    question: "Can you install in Berkeley ADUs, backyard studios, or in-law units?",
    answer: "Absolutely. ADUs, backyard studios, and in-law units are some of our favorite install locations. As long as there's a standard outlet and enough floor space (roughly 4' x 4' for most models), we can set it up. Our modular design makes it easy to bring the panels through side gates and narrow pathways."
  },
  {
    question: "What if I'm in a student apartment near campus?",
    answer: "We've done plenty of installs in apartments near UC Berkeley. Most apartments work great—just make sure you have landlord approval first. The sauna is fully portable and leaves no marks when removed, which landlords appreciate. Setup takes about 45 minutes, and we'll work around your schedule."
  },
  {
    question: "Do you install in hillside homes with lots of steps?",
    answer: "Yes. Berkeley's hillside homes are part of our regular service area. We bring dollies and handle the stairs—you don't need to worry about it. The modular panel system makes it manageable even with elevation changes, steep driveways, and narrow outdoor staircases."
  },
  {
    question: "Can the sauna go on a backyard deck in the Berkeley Hills?",
    answer: "Yes. As long as the deck is level and structurally sound, we can install there. Our outdoor models are designed to handle Berkeley's weather, from foggy mornings to sunny afternoons. We'll assess the deck during delivery to ensure it's a good fit."
  },
  {
    question: "Do I need landlord or HOA approval?",
    answer: "For apartments and condos, yes—we recommend getting written permission from your landlord or HOA before scheduling delivery. The good news: our saunas are plug-in, require zero construction, and leave no permanent changes when removed. Most landlords are comfortable with that."
  },
  {
    question: "Is the sauna quiet enough for shared-wall units?",
    answer: "Yes. Infrared saunas are virtually silent. Finnish dry saunas have a small heater fan, but it's quieter than a typical bathroom exhaust fan. Neighbors won't hear it through walls, making it ideal for Berkeley apartments, duplexes, and multiplexes."
  },
  {
    question: "How do you handle parking challenges in busy areas?",
    answer: "We navigate Berkeley's parking restrictions regularly. Our crew coordinates delivery times to work around street cleaning and permit zones. If your driveway or street access is tight, we'll use dollies and side gates to bring the sauna panels through. Just let us know ahead of time if there are any access challenges."
  },
  {
    question: "What's the setup time?",
    answer: "About 45 minutes from arrival to ready-to-use. We bring all tools, assemble the modular panels, plug it in, test the heat, and walk you through the controls. You'll be ready for your first session the same day."
  },
];

const SaunaRentalBerkeley = () => {
  useSEO(seoData.saunaRentalBerkeley);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-semibold mb-6 text-heading tracking-tight leading-tight">
              Sauna Rental in Berkeley — Delivery, Setup, and Monthly Plans
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              We deliver plug-in saunas to homes and apartments across Berkeley neighborhoods including North Berkeley, Elmwood, Claremont, Central Berkeley, Westbrae, and more.
            </p>
            <Link to="/reserve-your-sauna">
              <Button size="lg" className="mb-12">
                Check Availability in Berkeley
              </Button>
            </Link>
            <div className="relative rounded-lg overflow-hidden">
              <img 
                src={heroImage} 
                alt="Sauna rental delivery in Berkeley backyard" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Value Props */}
      <section className="py-16 bg-cedar-section">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-accent text-xl">✓</div>
                <p className="text-foreground">120V plug-in saunas that install in ~45 minutes</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-accent text-xl">✓</div>
                <p className="text-foreground">No permits, no contractors, no remodeling</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-accent text-xl">✓</div>
                <p className="text-foreground">Fits perfectly in Berkeley apartments, bungalows, ADUs, and backyard studios</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-accent text-xl">✓</div>
                <p className="text-foreground">We handle delivery, installation, and maintenance</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-accent text-xl">✓</div>
                <p className="text-foreground">Flexible monthly plans</p>
              </div>
            </div>
            <Link to="/pricing" className="text-accent hover:text-accent-dark font-medium inline-flex items-center gap-2">
              See pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* About Sauna Rentals in Berkeley */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-8 text-heading">
              About Sauna Rentals in Berkeley
            </h2>
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Berkeley's housing is wonderfully diverse—century-old Craftsman homes with original wiring, student apartments near campus, hillside houses with stunning views, and backyard ADUs tucked behind duplexes. Our plug-in 120V saunas work beautifully in all of them.
                </p>
                <p>
                  No special electrical work needed. No permits. No construction crews tearing into walls. Just a standard household outlet (the same one your microwave uses) and about 4x4 feet of floor space. We bring the modular panels, assemble everything in roughly 45 minutes, plug it in, and you're ready to go.
                </p>
                <p>
                  Berkeley has always been a hub for wellness and recovery culture—runners training for marathons, cyclists heading to the hills, academics managing desk-bound stress, tech workers looking for better sleep, and biohack-curious folks optimizing their routines. A home sauna fits naturally into that lifestyle. Daily heat exposure, consistent recovery, better sleep, and a warm ritual to anchor your evening—especially valuable on those foggy North Berkeley mornings or cool Elmwood nights.
                </p>
                <p>
                  Many Berkeley residents prefer renting over buying because there's no long-term commitment, no big upfront purchase, and no worry if you move next year. Rent month-to-month after your initial term. When you're ready to move, we pick it up. Simple.
                </p>
                <p>
                  Berkeley's microclimates—foggier mornings on the northside, sunnier flats in Elmwood, cooler evenings in the hills—make year-round sauna use especially appealing. Whether you're warming up after a chilly morning run or winding down after a long day, the sauna is there.
                </p>
              </div>
              <div className="relative rounded-lg overflow-hidden">
                <img 
                  src={indoorInstall} 
                  alt="Indoor sauna installation in Berkeley apartment" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Berkeley Neighborhoods We Serve */}
      <section className="py-16 bg-cedar-section">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-6 text-heading">
              Berkeley Neighborhoods We Serve
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              We deliver and install plug-in saunas anywhere in Berkeley, covering every major neighborhood, including:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {neighborhoods.map((neighborhood, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-accent">•</span>
                  <span className="text-foreground">{neighborhood}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recent Installations in Berkeley */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-8 text-heading">
              Recent Installations in Berkeley
            </h2>
            <div className="space-y-6 mb-12 text-muted-foreground leading-relaxed">
              <p>
                We've installed saunas all over Berkeley—from Elmwood spare rooms to North Berkeley garage conversions to Berkeley Hills backyard decks with steep elevation changes. Every install is different, but the process stays simple and fast.
              </p>
              <p>
                Berkeley homes present unique challenges: narrow staircases in old Craftsmans, uneven floors, tight hallways, small apartments, ADUs with side-gate-only access, and hillside properties with limited driveway space. Our modular panel system handles all of it. Each panel is lightweight and easy to maneuver—we can navigate century-old interior layouts, bring saunas up outdoor staircases, and fit them through doorways that wouldn't accommodate a traditional prefab unit.
              </p>
              <p>
                Setup typically takes 30–50 minutes. We arrive with all the tools, assemble the panels on-site, plug the sauna into a standard 120V outlet (same outlet your microwave or hairdryer uses—no electrician required), test the heat, and walk you through the controls. That's it. No construction, no mess, no waiting weeks for permits or contractor schedules.
              </p>
              <p>
                Most customers just need one thing ready: a standard 120V outlet on a dedicated or lightly-used 15-amp circuit. Infrared saunas draw about 1,500 watts; Finnish dry saunas use around 1,800 watts—both well within the capacity of a typical household circuit. We'll confirm your electrical setup during scheduling, and if anything needs adjustment, it's usually minor.
              </p>
              <p>
                Berkeley-specific delivery considerations? We handle them daily. Hills, one-way streets, limited street parking, tight driveways, steep outdoor steps, narrow side gates, basement entries—it's all part of the routine. Our crew brings dollies, plans the route ahead of time, and works efficiently to get the sauna exactly where you want it.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="relative rounded-lg overflow-hidden">
                <img 
                  src={northBerkeleyGarage} 
                  alt="Sauna installation in North Berkeley garage" 
                  className="w-full h-auto"
                />
                <p className="text-sm text-muted-foreground mt-2">North Berkeley garage conversion</p>
              </div>
              <div className="relative rounded-lg overflow-hidden">
                <img 
                  src={elmwoodBedroom} 
                  alt="Sauna installation in Elmwood bedroom" 
                  className="w-full h-auto"
                />
                <p className="text-sm text-muted-foreground mt-2">Elmwood spare room</p>
              </div>
              <div className="relative rounded-lg overflow-hidden">
                <img 
                  src={berkeleyHillsBackyard} 
                  alt="Sauna installation in Berkeley Hills backyard" 
                  className="w-full h-auto"
                />
                <p className="text-sm text-muted-foreground mt-2">Berkeley Hills backyard deck</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Delivery & Setup Works in Berkeley */}
      <section className="py-16 bg-cedar-section">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-8 text-heading">
              How Delivery & Setup Works in Berkeley
            </h2>
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Berkeley's layout—one-way streets near campus, hillside driveways in the upper neighborhoods, narrow Victorian entries downtown—requires local knowledge and flexibility. We navigate it daily.
                </p>
                <p>
                  Our modular panel system is the key. Instead of wrestling a massive prefab unit through a Craftsman doorway, we carry in lightweight panels one at a time. This works perfectly for Berkeley's older homes with tight hallways, steep indoor staircases, and doorways that weren't designed for modern oversized furniture.
                </p>
                <p>
                  Typical load-in routes: through garages, into ADUs via side gates, down basement stairs, up outdoor decks with railings, and through narrow entries in duplexes and multiplexes. If there's a way in, we'll find it.
                </p>
                <p>
                  What you need to prepare: clear the floor space where the sauna will go (about 4x4 feet), make sure we have access to a standard 120V outlet, and if parking is tricky on your block, give us a heads-up so we can plan the timing.
                </p>
                <p>
                  Setup time is about 45 minutes. We assemble the panels, install the heater and controls, plug it in, test the unit, and show you how to use it. Zero tools required from you. When your rental term ends, we reverse the process—disassemble, remove, and leave the space exactly as we found it.
                </p>
                <p>
                  Free maintenance and support included throughout your rental. If anything needs attention, we handle it—no service charges, no run-around.
                </p>
              </div>
              <div className="relative rounded-lg overflow-hidden">
                <img 
                  src={deliveryCrew} 
                  alt="Sauna delivery crew in Berkeley" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-8 text-heading">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
                  <AccordionTrigger className="text-left text-lg font-medium text-heading hover:text-accent">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-16 bg-cedar-section">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-8 text-heading text-center">
              What Berkeley Customers Say
            </h2>
            <div className="mb-8">
              <GoogleReviews />
            </div>
            <div className="relative rounded-lg overflow-hidden">
              <img 
                src={customerUsingSauna} 
                alt="Customer using sauna in Berkeley" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-6 text-heading">
              Ready for your sauna?
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/reserve-your-sauna">
                <Button size="lg">
                  Check Availability in Berkeley
                </Button>
              </Link>
              <Link to="/pricing" className="text-accent hover:text-accent-dark font-medium inline-flex items-center gap-2">
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

export default SaunaRentalBerkeley;
