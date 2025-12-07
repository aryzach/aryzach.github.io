import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroImage from "@/assets/sauna-rental-mountain-view-backyard.webp";
import indoorImage from "@/assets/indoor-sauna-install-mountain-view-apartment.jpg";
import installImage1 from "@/assets/sauna-install-waverly-park-garage.avif";
import installImage2 from "@/assets/sauna-install-old-los-altos-bedroom.webp";
import installImage3 from "@/assets/sauna-install-monta-loma-office.jpg";
import deliveryImage from "@/assets/sauna-delivery-mountain-view-crew.jpeg";
import customerImage from "@/assets/customer-using-sauna-mountain-view.webp";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";

const SaunaRentalMountainView = () => {
  useSEO(seoData.saunaRentalMountainView);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-clash text-4xl md:text-5xl font-semibold text-heading mb-6 leading-tight">
                Sauna Rental in Mountain View & Los Altos — Delivery, Setup, and Monthly Plans
              </h1>
              <p className="text-lg text-text mb-8 leading-relaxed">
                We deliver plug-in saunas to homes and apartments across Mountain View, Los Altos, and nearby neighborhoods including Cuesta Park, Waverly Park, Old Los Altos, and more.
              </p>
              <Link to="/reserve-your-sauna">
                <Button size="lg" className="text-base">
                  Check Availability in Mountain View & Los Altos
                </Button>
              </Link>
            </div>
            <div className="rounded-lg overflow-hidden">
              <img
                src={heroImage}
                alt="Sauna rental installation in Mountain View backyard"
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
              <p className="text-text">No permits, no contractors, no construction</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent mt-2" />
              <p className="text-text">Great for Mountain View apartments, bungalows, Eichlers, and ADUs</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-accent mt-2" />
              <p className="text-text">Delivery, installation, and maintenance included</p>
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
                About Sauna Rentals in Mountain View & Los Altos
              </h2>
              <div className="space-y-4 text-text leading-relaxed">
                <p>
                  Mountain View and Los Altos anchor the southern stretch of the Peninsula with a distinct residential character—ranch homes, Eichler clusters, newly remodeled ADUs, and tech-family houses that balance suburban comfort with modern wellness priorities.
                </p>
                <p>
                  Our 120V plug-in saunas fit seamlessly into bonus rooms, converted offices, garages, and backyard studios. They work perfectly with standard electrical infrastructure—no need for 240V upgrades, no permits, no contractor coordination. Just a simple installation that respects your home's existing layout and capacity.
                </p>
                <p>
                  The local wellness culture here is strong and diverse: cyclists tackling Alpine Road, CrossFitters logging evening WODs, tech workers optimizing for longevity, and cold-plunge-curious households building out home recovery protocols. The demand for consistent sauna access is high, yet many residents prefer renting over buying: flexibility to move between homes, no installation hassle, and easy adaptability as family needs evolve.
                </p>
                <p>
                  Microclimates matter too. Warm Mountain View summers contrast with cooler Los Altos foothills evenings, making year-round sauna use both practical and restorative. Whether you're recovering from a long training block or winding down after a demanding workday, a personal sauna in your home becomes a daily ritual rather than an occasional luxury.
                </p>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden">
              <img
                src={indoorImage}
                alt="Indoor sauna installation in Mountain View apartment"
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
            Neighborhoods We Serve in Mountain View & Los Altos
          </h2>
          <p className="text-center text-text mb-12">
            We deliver and install plug-in saunas throughout Mountain View and Los Altos, including:
          </p>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="font-clash text-xl font-semibold text-heading mb-4">Mountain View Neighborhoods</h3>
              <ul className="space-y-2 text-text">
                <li>• Cuesta Park</li>
                <li>• Waverly Park</li>
                <li>• Shoreline West</li>
                <li>• Monta Loma</li>
                <li>• Rex Manor</li>
                <li>• Old Mountain View</li>
                <li>• Whisman Station</li>
                <li>• Blossom Valley</li>
                <li>• Sylvan Park</li>
                <li>• The Crossings</li>
                <li>• Jackson Park</li>
              </ul>
            </div>
            <div>
              <h3 className="font-clash text-xl font-semibold text-heading mb-4">Los Altos Neighborhoods</h3>
              <ul className="space-y-2 text-text">
                <li>• Old Los Altos</li>
                <li>• North Los Altos</li>
                <li>• South Los Altos</li>
                <li>• Loyola Corners</li>
                <li>• Woodland Acres</li>
                <li>• Los Altos Hills</li>
                <li>• Rancho Area</li>
                <li>• Country Club</li>
                <li>• Mora Drive Corridor</li>
                <li>• Toyon Farm Area</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Installations */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-clash text-3xl md:text-4xl font-semibold text-heading mb-12 text-center">
            Recent Installations in Mountain View & Los Altos
          </h2>
          
          <div className="space-y-12 mb-12">
            <p className="text-text leading-relaxed">
              Our installation experience across Mountain View and Los Altos covers a diverse architectural landscape. We've delivered saunas to Waverly Park garages with limited ceiling height, Old Los Altos bonus rooms with original hardwood floors, and Monta Loma office nooks converted from spare bedrooms.
            </p>
            <p className="text-text leading-relaxed">
              Working around Los Altos ranch layouts, Mountain View apartment complexes, and multi-use room conversions requires attention to detail and spatial awareness. Our modular panel system allows us to navigate these challenges without structural modifications or invasive installation procedures. The typical install time ranges from 30 to 50 minutes, start to finish.
            </p>
            <p className="text-text leading-relaxed">
              All you need is one standard 120V outlet on a 15-amp circuit—no special wiring, no electrician, no permits. The modular panel design allows us to work around tight garage doors, narrow hallways, and interior doorways that would otherwise make large equipment delivery impossible. We've installed in everything from older ranch homes to modern tech-family remodels with equal ease.
            </p>
            <p className="text-text leading-relaxed">
              Navigating suburban driveways, tech-corridor traffic, and apartments with gated access is all part of our delivery planning. Many of our customers are busy professionals who use their saunas nightly—part of a disciplined recovery routine that fits seamlessly into demanding schedules.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <img
                src={installImage1}
                alt="Sauna installation in Waverly Park garage"
                className="w-full h-64 object-cover rounded-lg"
              />
              <p className="text-sm text-text text-center">Waverly Park ADU installation</p>
            </div>
            <div className="space-y-4">
              <img
                src={installImage2}
                alt="Sauna installation in Old Los Altos bedroom"
                className="w-full h-64 object-cover rounded-lg"
              />
              <p className="text-sm text-text text-center">Old Los Altos bonus room installation</p>
            </div>
            <div className="space-y-4">
              <img
                src={installImage3}
                alt="Sauna installation in Monta Loma office"
                className="w-full h-64 object-cover rounded-lg"
              />
              <p className="text-sm text-text text-center">Monta Loma hallway installation</p>
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
                alt="Sauna delivery crew in Mountain View"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="font-clash text-3xl md:text-4xl font-semibold text-heading mb-6">
                How Delivery & Setup Works
              </h2>
              <div className="space-y-4 text-text leading-relaxed">
                <p>
                  Straightforward suburban access is the norm in Mountain View and Los Altos, though we occasionally encounter tight garages or gated apartment complexes. Our team uses dollies and modular panels to navigate ADUs, side gates, and office conversions with minimal disruption.
                </p>
                <p>
                  The typical load-in flow: entry through your garage, front door, or side gate; panel assembly in your designated space; electrical connection test; and a brief walkthrough of sauna operation and care. The entire process takes about 45 minutes from arrival to completion.
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
              <AccordionTrigger>Can you install in an Eichler or ranch-style home?</AccordionTrigger>
              <AccordionContent>
                Yes. Our saunas run on standard 120V outlets and fit perfectly in Eichler floor plans and ranch-style layouts. No electrical upgrades or structural modifications required.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Will a sauna overload my 120V circuit?</AccordionTrigger>
              <AccordionContent>
                No. Our saunas are designed to operate safely on a standard 15-amp household circuit. As long as the outlet isn't shared with other high-draw appliances during sauna use, you'll have no issues.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Can you install in ADUs or backyard offices?</AccordionTrigger>
              <AccordionContent>
                Absolutely. Many of our Mountain View and Los Altos installations are in backyard studios, converted offices, and ADUs. As long as you have a standard outlet and adequate space, we can install.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>How does installation work in Mountain View apartments?</AccordionTrigger>
              <AccordionContent>
                We've installed in numerous Mountain View apartment complexes. The modular panel system allows us to navigate hallways, elevators, and tight interior spaces without damage or disruption.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>Is the sauna quiet enough for shared-wall units?</AccordionTrigger>
              <AccordionContent>
                Very quiet. There's no loud ventilation system—just a gentle heating element hum that's barely audible. Ideal for apartments and townhomes with shared walls.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger>What's the setup time?</AccordionTrigger>
              <AccordionContent>
                Typically 30–50 minutes from arrival to completion, including assembly, electrical testing, and a brief usage walkthrough.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7">
              <AccordionTrigger>Do I need landlord or HOA approval?</AccordionTrigger>
              <AccordionContent>
                It depends on your HOA rules or lease agreement. Since our saunas are plug-in and leave no permanent modifications, many landlords and HOAs approve them. We recommend checking first.
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
                alt="Customer using sauna in Mountain View"
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
                Check Availability in Mountain View & Los Altos
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

export default SaunaRentalMountainView;
