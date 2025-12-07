import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroImage from "@/assets/sauna-rental-palo-alto-backyard.jpeg";
import indoorImage from "@/assets/indoor-sauna-install-palo-alto-home.avif";
import installImage1 from "@/assets/sauna-install-old-palo-alto-garage.jpg";
import installImage2 from "@/assets/sauna-install-professorville-bedroom.jpg";
import installImage3 from "@/assets/sauna-install-sharon-heights-backyard.webp";
import deliveryImage from "@/assets/sauna-delivery-palo-alto-crew.webp";
import customerImage from "@/assets/customer-using-sauna-palo-alto.webp";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";

const SaunaRentalPaloAlto = () => {
  useSEO(seoData.saunaRentalPaloAlto);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-clash text-4xl md:text-5xl font-semibold text-heading mb-6 leading-tight">
                Sauna Rental in Palo Alto & Menlo Park — Delivery, Setup, and Monthly Plans
              </h1>
              <p className="text-lg text-text mb-8 leading-relaxed">
                We deliver plug-in saunas to homes and apartments across Palo Alto, Menlo Park, and nearby neighborhoods including Crescent Park, Professorville, Allied Arts, Willows, and more.
              </p>
              <Link to="/reserve-your-sauna">
                <Button size="lg" className="text-base">
                  Check Availability in Palo Alto & Menlo Park
                </Button>
              </Link>
            </div>
            <div className="rounded-lg overflow-hidden">
              <img
                src={heroImage}
                alt="Sauna rental installation in Palo Alto backyard"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Value Props */}
      <section className="py-16 px-4 bg-ui/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent mt-2" />
              <p className="text-text">120V plug-in saunas that install in ~45 minutes</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent mt-2" />
              <p className="text-text">No permits or contractors required</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent mt-2" />
              <p className="text-text">Ideal for Palo Alto & Menlo Park homes, ADUs, cottages, and garage studios</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent mt-2" />
              <p className="text-text">We handle delivery, installation, and maintenance</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent mt-2" />
              <p className="text-text">Flexible monthly plans</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link to="/pricing" className="text-accent hover:text-accent-dark font-medium">
              See pricing →
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-clash text-3xl md:text-4xl font-semibold text-heading mb-6">
                About Sauna Rentals in Palo Alto & Menlo Park
              </h2>
              <div className="space-y-4 text-text leading-relaxed">
                <p>
                  Palo Alto and Menlo Park represent the heart of Silicon Valley's residential landscape—a distinctive mix of mid-century Eichlers, modern remodels, newly built ADUs, and classic single-family homes that house tech workers, academics, and wellness-conscious families.
                </p>
                <p>
                  Our 120V plug-in saunas are perfectly suited for these environments. They work seamlessly in tight garages, office nooks, cottage units, and updated electrical systems that still operate within standard residential capacity. No need for 240V upgrades, no permits, no contractors—just a simple installation that respects the architectural integrity of these thoughtfully designed spaces.
                </p>
                <p>
                  The wellness culture here runs deep. From runners logging miles on the Stanford Dish to cyclists tackling Old La Honda, from frequent gym-goers to Huberman-adjacent biohackers optimizing sleep and recovery—the demand for consistent sauna access is high. Yet many residents prefer renting over buying: no construction noise, no long-term commitment, no big upfront costs, and the flexibility to move between homes as careers and families evolve.
                </p>
                <p>
                  The microclimates matter too. Palo Alto's warmer, sunnier days contrast with Menlo Park's breezier evenings, making year-round sauna use both practical and restorative. Whether you're winding down after a long workday or preparing your body for the next training block, a personal sauna in your home becomes a daily ritual rather than an occasional luxury.
                </p>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden">
              <img
                src={indoorImage}
                alt="Indoor sauna installation in Palo Alto home"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Neighborhoods Section */}
      <section className="py-20 px-4 bg-ui/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-clash text-3xl md:text-4xl font-semibold text-heading mb-8 text-center">
            Neighborhoods We Serve in Palo Alto & Menlo Park
          </h2>
          <p className="text-center text-text mb-12">
            We deliver and install plug-in saunas throughout Palo Alto and Menlo Park, including:
          </p>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="font-clash text-xl font-semibold text-heading mb-4">Palo Alto Neighborhoods</h3>
              <ul className="space-y-2 text-text">
                <li>• Crescent Park</li>
                <li>• Professorville</li>
                <li>• Old Palo Alto</li>
                <li>• Midtown</li>
                <li>• Ventura</li>
                <li>• Green Acres</li>
                <li>• Barron Park</li>
                <li>• Palo Alto Hills</li>
                <li>• Southgate</li>
                <li>• The Willows (Palo Alto side)</li>
                <li>• Downtown Palo Alto</li>
                <li>• College Terrace</li>
                <li>• Charleston Meadows</li>
                <li>• Triple El</li>
                <li>• Duveneck / St. Francis</li>
              </ul>
            </div>
            <div>
              <h3 className="font-clash text-xl font-semibold text-heading mb-4">Menlo Park Neighborhoods</h3>
              <ul className="space-y-2 text-text">
                <li>• Allied Arts</li>
                <li>• Felton Gables</li>
                <li>• Linfield Oaks</li>
                <li>• The Willows</li>
                <li>• Sharon Heights</li>
                <li>• Menlo Oaks</li>
                <li>• Downtown Menlo Park</li>
                <li>• Stanford Research Park area</li>
                <li>• Suburban Park / Lorelei Manor</li>
                <li>• Flood Park Triangle</li>
                <li>• Vintage Oaks</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Installations */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-clash text-3xl md:text-4xl font-semibold text-heading mb-12 text-center">
            Recent Installations in Palo Alto & Menlo Park
          </h2>
          
          <div className="space-y-12 mb-12">
            <p className="text-text leading-relaxed">
              Our installation experience across Palo Alto and Menlo Park spans a wide range of architectural styles and spatial challenges. We've delivered saunas to Old Palo Alto garages with narrow overhead clearances, Professorville spare rooms with original hardwood floors, and Sharon Heights backyard ADUs with elevated deck access.
            </p>
            <p className="text-text leading-relaxed">
              Eichler homes present their own unique considerations—expansive glass walls, open floor plans, and electrical systems designed decades ago. Our modular sauna panels navigate these layouts gracefully, fitting through garage entries and hallway turns without requiring structural modifications. The typical setup time ranges from 30 to 50 minutes, start to finish.
            </p>
            <p className="text-text leading-relaxed">
              All you need is one standard 120V outlet on a 15-amp circuit—no special wiring, no electrician, no permits. We've installed in century-old craftsman homes, modern remodels, and newly constructed ADUs with equal ease. The modular panel system allows us to work around tight garage doors, narrow hallways, and unusual entryways that would otherwise make large equipment delivery impossible.
            </p>
            <p className="text-text leading-relaxed">
              Navigating Palo Alto's tree-lined streets and Menlo Park's Stanford campus adjacencies is part of the routine. Constrained driveways, limited street parking, and HOA considerations are all factored into our delivery planning. Many of our customers are busy tech professionals who use their saunas nightly—part of a disciplined recovery and sleep optimization routine that fits seamlessly into their demanding schedules.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <img
                src={installImage1}
                alt="Sauna installation in Old Palo Alto garage"
                className="w-full h-64 object-cover rounded-lg"
              />
              <p className="text-sm text-text text-center">Old Palo Alto garage installation</p>
            </div>
            <div className="space-y-4">
              <img
                src={installImage2}
                alt="Sauna installation in Professorville bedroom"
                className="w-full h-64 object-cover rounded-lg"
              />
              <p className="text-sm text-text text-center">Professorville spare room installation</p>
            </div>
            <div className="space-y-4">
              <img
                src={installImage3}
                alt="Sauna installation in Sharon Heights backyard"
                className="w-full h-64 object-cover rounded-lg"
              />
              <p className="text-sm text-text text-center">Sharon Heights backyard ADU installation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery & Setup */}
      <section className="py-20 px-4 bg-ui/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="rounded-lg overflow-hidden">
              <img
                src={deliveryImage}
                alt="Sauna delivery crew in Palo Alto"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="font-clash text-3xl md:text-4xl font-semibold text-heading mb-6">
                How Delivery & Setup Works
              </h2>
              <div className="space-y-4 text-text leading-relaxed">
                <p>
                  Parking and driveway constraints in older Palo Alto neighborhoods are common, but our team has mastered the logistics. We use dollies and modular panels to navigate tight ADU access points, side gates, and backyard pathways with minimal disruption to your property.
                </p>
                <p>
                  The installation flow is straightforward: load-in through your garage, front door, or side entry; panel assembly in your designated space; electrical connection test; and a brief walkthrough of sauna operation and maintenance. The entire process takes about 45 minutes from arrival to completion.
                </p>
                <p>
                  Your only preparation task is to clear the installation space and ensure access to one standard 120V outlet. No tools are required from you. Our team brings everything needed for assembly and testing.
                </p>
                <p>
                  Free maintenance and support are included with your monthly rental. If anything needs attention—a loose panel, a thermostat question, or routine upkeep—we handle it at no additional cost.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-clash text-3xl md:text-4xl font-semibold text-heading mb-12 text-center">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Can you install in an Eichler with limited electrical capacity?</AccordionTrigger>
              <AccordionContent>
                Yes. Our saunas run on standard 120V outlets and draw 15 amps max—well within the capacity of most Eichler electrical systems. No rewiring or panel upgrades required.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Do saunas work in garage offices or backyard ADUs?</AccordionTrigger>
              <AccordionContent>
                Absolutely. Many of our Palo Alto and Menlo Park installations are in converted garages, backyard cottages, and ADUs. As long as you have a standard outlet and adequate space, we can install.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Will a sauna overload my 120V circuit?</AccordionTrigger>
              <AccordionContent>
                No. Our saunas are designed to operate safely on a standard 15-amp household circuit. As long as the outlet isn't shared with other high-draw appliances during sauna use, you'll have no issues.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Do I need HOA or landlord approval?</AccordionTrigger>
              <AccordionContent>
                It depends on your HOA rules or lease agreement. Since our saunas are plug-in and leave no permanent modifications, many landlords and HOAs approve them. We recommend checking first.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>Can you carry the sauna down narrow side yards?</AccordionTrigger>
              <AccordionContent>
                Yes. The modular panel design allows us to navigate narrow pathways, side gates, and tight corners that would be impossible with a pre-assembled unit.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger>How quiet is it for shared-wall units?</AccordionTrigger>
              <AccordionContent>
                Very quiet. There's no loud ventilation system—just a gentle heating element hum that's barely audible. Ideal for apartments and townhomes with shared walls.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7">
              <AccordionTrigger>What's the setup time?</AccordionTrigger>
              <AccordionContent>
                Typically 30–50 minutes from arrival to completion, including assembly, electrical testing, and a brief usage walkthrough.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-20 px-4 bg-ui/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-clash text-3xl md:text-4xl font-semibold text-heading mb-12 text-center">
            What Our Customers Say
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            <div className="rounded-lg overflow-hidden">
              <img
                src={customerImage}
                alt="Customer using sauna in Palo Alto"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="elfsight-app-8e4c426b-67fd-4565-8145-975c8d5acc74" data-elfsight-app-lazy />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-clash text-3xl md:text-4xl font-semibold text-heading mb-8">
            Ready for your sauna?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/reserve-your-sauna">
              <Button size="lg" className="text-base">
                Check Availability in Palo Alto & Menlo Park
              </Button>
            </Link>
            <Link to="/pricing" className="text-accent hover:text-accent-dark font-medium">
              View pricing →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SaunaRentalPaloAlto;
