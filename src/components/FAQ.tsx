import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const faqs = [
  {
    question: "What's the difference between an infrared and traditional sauna?",
    answer: "Traditional saunas heat the air with a traditional heater and rocks, running 200°F for a more classic feel. Infrared heats your body directly for a gentler sweat at 150°F.",
  },
  {
    question: "Why rent instead of buy?",
    answer: `Buying a traditional sauna is a bigger commitment than most people realize. Nearly all require modifications to your home's electrical system and a licensed electrician, which can add $3,000–$6,000 to the purchase price and turn installation into a weeks- or months-long project.

Our sauna is different. We've built the only traditional sauna that plugs into a normal outlet, making it landlord-friendly and possible to use without permanently modifying your home.

We handle delivery, installation, maintenance, and pickup, so you never have to coordinate contractors or deal with repairs. If you move, we can move the sauna with you.

And you can actually live with a traditional sauna before deciding whether you want to own one long term. There's no big upfront investment or long-term commitment. Try it, see how much you use it, and buy later if ownership makes sense.`,
  },
  {
    question: "What power is needed?",
    answer: "All units use standard 120V household outlets, same load class as a hair dryer. No special wiring, panel upgrades, or electrician.",
  },
  {
    question: "How much space do I need?",
    answer: `About 4' x 4'

Here are the exact dimensions:
Indoor: 48" W × 42" D × 76" H
Outdoor: 58" W × 46" D × 85" H`,
  },
  {
    question: "Can these go indoors or outdoors?",
    answer: "Yes. We have dedicated models for each.",
  },
  {
    question: "Will a sauna overheat my apartment?",
    answer: "No. They're heavily insulated, so heat stays inside the cabin with negligible spillover.",
  },
  {
    question: "How long does setup take?",
    answer: "Plan for 2 hours. We position it, plug it in, test it, and walk you through everything.",
  },
  {
    question: "How long does it take to heat up?",
    answer: "180°F in 40–60 minutes, and 200°F in 60-90 minutes.",
  },
  {
    question: "Do I need to leave it running?",
    answer: "No. Just turn it on 30–60 minutes before using. Most people heat it once a day for about an hour.",
  },
  {
    question: "Is this landlord-friendly?",
    answer: "Yes. Saunas are free-standing appliances that plug into a normal outlet. No drilling, venting, hardwiring, or modifications. Almost no one needs permission, but follow your lease rules.",
  },
  {
    question: "Will this damage my floors?",
    answer: "No. The base stays cool enough for wood, and humidity stays inside the cabin. Just avoid spilling water outside the unit.",
  },
  {
    question: "What if I move during my rental?",
    answer: "This is part of the service, we move the sauna to your new place.",
  },
  {
    question: "What happens after my initial lease term?",
    answer: "Your plan switches to month-to-month. Keep it as long as you want; when you're done, we pick it up within 30 days.",
  },
  {
    question: "How much does it add to my electric bill?",
    answer: "Usually $0.50–$1.50 per session. SF electricity is ~$0.30/kWh, and sessions run 40–90 minutes total.",
  },
  {
    question: "Can I buy out the sauna later?",
    answer: "Yes, at the end of your lease, 50% of rental payment can be applied toward the purchase of your sauna.",
  },
  {
    question: "Who handles maintenance?",
    answer: "We handle all normal maintenance, repairs, parts, and troubleshooting for the sauna, no charge. If something fails under normal use, we fix it or replace the unit.",
  },
  {
    question: "Is SF Sauna insured?",
    answer: "Yes. SF Sauna carries commercial liability insurance. A Certificate of Insurance (COI) is available upon request.",
  },
];

interface FAQProps {
  showInstallationGuide?: boolean;
}

const FAQ = ({ showInstallationGuide = true }: FAQProps) => {
  return (
    <section id="faq" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl md:text-5xl font-semibold text-center mb-4 text-foreground">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Everything you need to know about renting a sauna
        </p>

        <Accordion type="single" collapsible className="mb-8">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-foreground hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground whitespace-pre-line">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {showInstallationGuide && (
          <div className="text-center">
            <Link to="/install-power">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                View Full Installation Guide
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default FAQ;
