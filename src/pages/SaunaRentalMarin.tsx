import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleReviews from "@/components/GoogleReviews";
import heroImage from "@/assets/sauna-rental-marin-backyard.webp";
import indoorInstall from "@/assets/indoor-sauna-install-marin-home.avif";
import millValleyDeck from "@/assets/sauna-install-mill-valley-deck.jpeg";
import sausalitoBedroom from "@/assets/sauna-install-sausalito-bedroom.avif";
import tiburonGarage from "@/assets/sauna-install-tiburon-garage.webp";
import crewImage from "@/assets/sauna-delivery-san-francisco-crew.jpeg";
import customerImage from "@/assets/customer-using-sauna-oakland.webp";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";

const SaunaRentalMarin = () => {
  useSEO(seoData.saunaRentalMarin);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-semibold mb-6 text-heading tracking-tight leading-tight">
              Sauna Rental in Marin — South & Central — Delivery, Setup, and Monthly Plans
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl">
              We deliver plug-in saunas to homes and apartments across Mill Valley, Sausalito, Tiburon, Belvedere, Larkspur, Corte Madera, San Anselmo, and Fairfax.
            </p>
            <Link 
              to="/reserve-your-sauna"
              className="inline-block bg-accent hover:bg-accent/90 text-white font-medium px-8 py-3 rounded-lg transition-colors mb-12"
            >
              Check Availability in Marin
            </Link>
            
            <div className="relative mb-12">
              <img 
                src={heroImage} 
                alt="Sauna rental installation in Marin County backyard" 
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Value Props */}
      <section className="py-12 bg-cedar-section">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <ul className="space-y-3 text-lg text-foreground">
              <li className="flex items-start">
                <span className="text-accent mr-3">•</span>
                <span>120V plug-in saunas that install in ~45 minutes</span>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-3">•</span>
                <span>No permits, no contractors, no carpenters</span>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-3">•</span>
                <span>Fits perfectly in Marin homes, decks, garages, and backyard studios</span>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-3">•</span>
                <span>Delivery, installation, and maintenance included</span>
              </li>
              <li className="flex items-start">
                <span className="text-accent mr-3">•</span>
                <span>Flexible monthly plans</span>
              </li>
            </ul>
            <div className="mt-6">
              <Link to="/pricing" className="text-accent hover:text-accent-dark font-medium">
                See pricing →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Sauna Rentals in Marin */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-8 text-heading">
              About Sauna Rentals in Marin (South & Central)
            </h2>
            
            <div className="mb-12">
              <img 
                src={indoorInstall} 
                alt="Indoor sauna installation in Marin County home" 
                className="w-full h-auto rounded-lg mb-8"
              />
            </div>

            <div className="prose prose-lg max-w-none text-foreground space-y-4">
              <p>
                Marin County is home to a distinctive mix of housing: hillside retreats in Mill Valley with sweeping bay views, waterfront condos in Sausalito where fog rolls in each morning, spacious family homes in Larkspur and Corte Madera, and historic bungalows tucked into the valleys of San Anselmo and Fairfax. Each neighborhood has its own character, but they all share a challenge when it comes to adding a sauna: complex topography, older electrical systems, and tight access through staircases and narrow hallways.
              </p>

              <p>
                That's exactly why our 120V plug-in saunas work so well here. They don't require rewiring your home's electrical panel, pulling permits, or hiring a contractor. They plug into a standard outlet, install in about 45 minutes, and work beautifully on decks, in garages, spare bedrooms, or even lower-level bonus rooms. Whether you're in a sloped-lot home on the Mill Valley ridgeline or a condo with limited indoor space in downtown Sausalito, our modular design adapts to Marin's unique housing landscape.
              </p>

              <p>
                Marin residents are wellness-conscious by nature—runners hitting the Tennessee Valley trails, cyclists climbing Paradise Loop, mountain bikers tackling Tam, academics and tech folks balancing intense work with intentional recovery, and biohackers optimizing every corner of their routines. Daily sauna sessions fit naturally into this culture, offering a consistent recovery ritual that works year-round, whether you're warming up after a foggy Sausalito morning or cooling down after a sunny afternoon in Corte Madera.
              </p>

              <p>
                Renting makes sense for many Marin households. There's no construction noise, no permitting process, no large upfront purchase, and no commitment if you decide to move or remodel. It's practical, flexible, and perfectly suited to renters, first-time sauna users, and homeowners who value simplicity over complexity. Plus, with Marin's famous microclimates—fog pockets in Mill Valley, breezy waterfront air in Sausalito, and the sunnier, flatter terrain around Corte Madera—a warm sauna session becomes a grounding daily ritual regardless of the weather just outside your door.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Marin Neighborhoods We Serve */}
      <section className="py-16 md:py-24 bg-cedar-section">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-6 text-heading">
              Marin Neighborhoods & Towns We Serve
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              We deliver and install plug-in saunas throughout South & Central Marin, including:
            </p>

            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <h3 className="text-xl font-heading font-medium mb-3 text-heading">Mill Valley</h3>
                <ul className="space-y-2 text-foreground">
                  <li>• Tam Junction</li>
                  <li>• Homestead Valley</li>
                  <li>• Alto</li>
                  <li>• Sycamore Park</li>
                  <li>• Scott Valley</li>
                  <li>• Boyle Park</li>
                  <li>• Almonte</li>
                  <li>• Cascade Canyon</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-heading font-medium mb-3 text-heading">Sausalito</h3>
                <ul className="space-y-2 text-foreground">
                  <li>• Old Town</li>
                  <li>• New Town</li>
                  <li>• The Hill</li>
                  <li>• Marinship</li>
                  <li>• Wolfback Ridge</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-heading font-medium mb-3 text-heading">Tiburon / Belvedere</h3>
                <ul className="space-y-2 text-foreground">
                  <li>• Lyford Cove</li>
                  <li>• Reedlands</li>
                  <li>• Belveron</li>
                  <li>• Old Tiburon</li>
                  <li>• Corinthian Island</li>
                  <li>• Belvedere Lagoon</li>
                  <li>• Belvedere Island</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-heading font-medium mb-3 text-heading">Larkspur</h3>
                <ul className="space-y-2 text-foreground">
                  <li>• Baltimore Canyon</li>
                  <li>• Larkspur Marina</li>
                  <li>• Creekside</li>
                  <li>• Madrone</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-heading font-medium mb-3 text-heading">Corte Madera</h3>
                <ul className="space-y-2 text-foreground">
                  <li>• Mariner Cove</li>
                  <li>• Christmas Tree Hill</li>
                  <li>• Madera Gardens</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-heading font-medium mb-3 text-heading">San Anselmo</h3>
                <ul className="space-y-2 text-foreground">
                  <li>• Hawthorne Hills</li>
                  <li>• Barber Tract</li>
                  <li>• Yolanda Station</li>
                  <li>• Sleepy Hollow</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-heading font-medium mb-3 text-heading">Fairfax</h3>
                <ul className="space-y-2 text-foreground">
                  <li>• Deer Park</li>
                  <li>• Cascade</li>
                  <li>• Oak Manor</li>
                  <li>• Fairfax Flats</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Installations in Marin */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-8 text-heading">
              Recent Installations in Marin
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div>
                <img 
                  src={millValleyDeck} 
                  alt="Sauna installation on Mill Valley deck" 
                  className="w-full h-64 object-cover rounded-lg mb-3"
                />
                <p className="text-sm text-muted-foreground text-center">Mill Valley workout room installation</p>
              </div>
              <div>
                <img 
                  src={sausalitoBedroom} 
                  alt="Sauna installation in Sausalito bedroom" 
                  className="w-full h-64 object-cover rounded-lg mb-3"
                />
                <p className="text-sm text-muted-foreground text-center">Sausalito spare room</p>
              </div>
              <div>
                <img 
                  src={tiburonGarage} 
                  alt="Sauna installation in Tiburon garage" 
                  className="w-full h-64 object-cover rounded-lg mb-3"
                />
                <p className="text-sm text-muted-foreground text-center">Tiburon garage conversion</p>
              </div>
            </div>

            <div className="prose prose-lg max-w-none text-foreground space-y-4">
              <p>
                Every Marin installation comes with its own unique story. We've set up saunas on elevated Mill Valley decks accessed by outdoor staircases, navigating 20+ steps with modular panels and careful coordination. We've installed in Sausalito condos where parking requires a loading zone permit and interior hallways measure just 32 inches wide. And we've worked in Tiburon and Belvedere homes where the sauna goes into a lower-level bonus room or converted garage, often with low ceiling clearances and tight turns through the entryway.
              </p>

              <p>
                Marin's classic challenges—steep driveways, hillside stairs, narrow hallways, older home layouts, and waterfront condos with limited parking—are challenges we navigate routinely. Our modular sauna panels break down into components small enough to fit through standard doorways, and our team uses professional dollies, protective floor coverings, and careful planning to ensure a smooth installation from curb to final placement. Whether it's a mid-century modern home with original hardwood floors or a newly remodeled craftsman with tight interior dimensions, we adapt to the space.
              </p>

              <p>
                Typical setup time runs between 30 and 50 minutes, depending on access complexity and whether we're installing indoors or outdoors. All you need is a cleared space roughly 4 feet by 5 feet and access to one standard 120V outlet on a dedicated 15-amp circuit. No special wiring, no electrician, no permits. Our team brings all necessary tools, assembles the sauna on-site, tests the heater and controls, and walks you through how to use it before we leave.
              </p>

              <p>
                We've worked in older Mill Valley homes with narrow staircases, uneven floors, and low basement ceilings. We've installed in tiny student apartments near downtown San Anselmo. We've set up saunas in Larkspur ADUs, Corte Madera side yards accessed through narrow gates, and Fairfax bungalows where every square foot counts. The modular panel design makes it all possible—no matter how quirky the layout, how steep the approach, or how tight the interior dimensions.
              </p>

              <p>
                Parking can be tricky in places like Sausalito's Old Town or Belvedere's waterfront streets, but our crew plans ahead. We coordinate with you in advance, scout the access route, and work efficiently to minimize street time. If there are long outdoor staircases (common on Mill Valley hillsides), we factor that into the scheduling and make sure we have the right team size to handle the carry. Every installation is treated with the same care, whether it's a straightforward garage setup in Corte Madera or a complex multi-level access challenge in Tiburon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Delivery & Setup Works */}
      <section className="py-16 md:py-24 bg-cedar-section">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-8 text-heading">
              How Delivery & Setup Works in Marin
            </h2>

            <div className="mb-8">
              <img 
                src={crewImage} 
                alt="SF Sauna delivery crew in Marin" 
                className="w-full h-auto rounded-lg"
              />
            </div>

            <div className="prose prose-lg max-w-none text-foreground space-y-4">
              <p>
                Delivering and installing saunas in Marin requires local knowledge and careful planning. We regularly navigate Mill Valley's winding hillside roads, Sausalito's narrow one-way streets, and Tiburon's steep driveways. We know where parking can be tight, where loading zones exist, and how to coordinate with building management if you're in a condo complex. Before installation day, we confirm the access route with you and make sure we understand any site-specific challenges—steps, gates, tight hallways, or unusual entry points.
              </p>

              <p>
                The sauna arrives in modular panels, which allows us to carry it through standard doorways, up outdoor staircases, around tight corners, and into spaces that would never accommodate a pre-built unit. We use professional moving dollies, protective coverings for your floors, and careful teamwork to navigate whatever Marin throws at us—whether that's a steep Mill Valley driveway with switchbacks, a Sausalito condo with 15 interior steps, or a Larkspur side yard accessed through a 36-inch gate.
              </p>

              <p>
                Once we're inside, setup takes about 45 minutes. We assemble the panels, install the heater (infrared or steam depending on your model), connect the electrical components, and test everything to make sure it's running correctly. You don't need to provide any tools or help with assembly—we handle it all. All you need is a cleared space and access to one standard 120V outlet on a 15-amp circuit. If you're not sure whether your outlet meets that requirement, we can help you check during the scheduling call.
              </p>

              <p>
                We also account for Marin-specific considerations: tight parking in downtown Sausalito, long outdoor staircases in Mill Valley, narrow hallways in older San Anselmo bungalows, and elevated decks in Tiburon. Our team is experienced with all of these scenarios and plans accordingly. If there's a tricky access situation, we'll discuss it with you in advance and make sure we bring the right crew size and equipment to handle it smoothly.
              </p>

              <p>
                After setup, we walk you through how to operate the sauna, explain the controls, and answer any questions. Then we clean up, remove all packing materials, and leave you with a fully functional sauna ready for your first session. Free maintenance and support are included with your rental, so if anything ever needs attention, we're just a phone call away.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-12 text-heading">
              Frequently Asked Questions
            </h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-heading font-medium mb-3 text-heading">
                  Can you install on raised decks or hillside platforms?
                </h3>
                <p className="text-foreground leading-relaxed">
                  Yes. We regularly install saunas on elevated decks in Mill Valley, Tiburon, and other hillside areas. As long as the deck structure can support the weight (about 400–500 lbs) and we can run a weatherproof extension cord to a nearby outlet, outdoor deck installations work great. We can discuss your specific deck setup during the scheduling call.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-heading font-medium mb-3 text-heading">
                  Will a sauna overload my 120V circuit?
                </h3>
                <p className="text-foreground leading-relaxed">
                  No, as long as you have a standard 15-amp circuit. Our saunas draw between 12 and 15 amps, which is within the range of a typical household outlet. We recommend using a dedicated circuit (meaning no other high-draw appliances on the same breaker), but that's standard in most Marin homes. If you're unsure, we can help you verify during the scheduling process.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-heading font-medium mb-3 text-heading">
                  Do you install in Sausalito condos with limited parking?
                </h3>
                <p className="text-foreground leading-relaxed">
                  Yes. We've done many installations in Sausalito condos, including buildings with tight parking and narrow access. We coordinate with building management in advance if needed, and we work efficiently to minimize the time we're parked on the street. If your building has specific loading zone requirements, just let us know and we'll plan accordingly.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-heading font-medium mb-3 text-heading">
                  Can the sauna go in a Mill Valley ADU?
                </h3>
                <p className="text-foreground leading-relaxed">
                  Absolutely. ADUs, in-law units, and backyard studios are popular sauna locations. They often have dedicated electrical circuits, private access, and plenty of space. We just need to confirm that the ADU has a standard 120V outlet available and that we can access it through the yard or side gate.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-heading font-medium mb-3 text-heading">
                  Is the sauna quiet enough for shared-wall condos?
                </h3>
                <p className="text-foreground leading-relaxed">
                  Yes. Our saunas operate very quietly. The infrared models are virtually silent, and the steam saunas produce only a low hum from the heater fan—similar to a household fan. We've installed in many shared-wall buildings in Sausalito, Larkspur, and Corte Madera without any noise complaints.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-heading font-medium mb-3 text-heading">
                  Can you carry the sauna up long outdoor staircases?
                </h3>
                <p className="text-foreground leading-relaxed">
                  Yes. We've handled Mill Valley hillside installs with 20+ outdoor steps, and we plan for these situations in advance. The modular panels are designed to be carried by a two-person team, and we bring professional equipment (dollies, straps, protective coverings) to make the process smooth. Long staircases add a bit of time to the install, but they're not a dealbreaker.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-heading font-medium mb-3 text-heading">
                  Will fog or coastal wind affect an outdoor installation?
                </h3>
                <p className="text-foreground leading-relaxed">
                  No. Our outdoor saunas are built to handle Marin's coastal weather, including fog, wind, and moisture. The cedar exterior is naturally weather-resistant, and all electrical components are protected. Many customers specifically enjoy using their outdoor sauna during foggy Sausalito mornings or breezy afternoons in Tiburon—it adds to the experience.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-heading font-medium mb-3 text-heading">
                  Do I need HOA or landlord approval?
                </h3>
                <p className="text-foreground leading-relaxed">
                  It depends on your building or rental agreement. Because the sauna is plug-in (no construction, no permanent installation), many landlords and HOAs approve it without issue. We recommend checking with your landlord or HOA before scheduling, and we're happy to provide documentation if needed. Most Marin landlords are flexible, especially when they understand that the sauna leaves no permanent modifications.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-heading font-medium mb-3 text-heading">
                  What's the setup time?
                </h3>
                <p className="text-foreground leading-relaxed">
                  About 45 minutes for a straightforward install. If we're navigating stairs, tight hallways, or complex access routes, it might take a bit longer—but we budget for that in the scheduling. You don't need to do anything except clear the space and have an outlet ready.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-heading font-medium mb-3 text-heading">
                  How durable are these saunas in Marin's moisture?
                </h3>
                <p className="text-foreground leading-relaxed">
                  Very durable. Both our infrared and steam models are built with moisture-resistant materials, and the outdoor versions feature weatherproof cedar exteriors designed specifically for coastal climates. Marin's fog and humidity are well within normal operating conditions, and many of our long-term customers are in foggy Mill Valley, Sausalito, and Tiburon locations without any issues.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-16 md:py-24 bg-cedar-section">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-8 text-heading text-center">
              What Marin Customers Say
            </h2>
            
            <div className="mb-12">
              <img 
                src={customerImage} 
                alt="Customer using sauna in Marin home" 
                className="w-full h-auto rounded-lg"
              />
            </div>

            <GoogleReviews />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-8 text-heading">
              Ready for your sauna?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/reserve-your-sauna"
                className="inline-block bg-accent hover:bg-accent/90 text-white font-medium px-8 py-3 rounded-lg transition-colors"
              >
                Check Availability in Marin
              </Link>
              <Link 
                to="/pricing"
                className="text-accent hover:text-accent-dark font-medium"
              >
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

export default SaunaRentalMarin;
