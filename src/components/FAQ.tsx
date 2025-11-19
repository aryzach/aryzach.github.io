import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const faqs = [
  {
    question: "What's the difference between an infrared sauna and a dry Finnish sauna?",
    answer: "Infrared saunas heat your body directly using infrared panels and offer a gentler, deeper warmth at lower air temperatures. Finnish saunas use a traditional heater and hot rocks, warming the air to higher temperatures for a classic dry-sauna experience.",
  },
  {
    question: "What kind of power does it need?",
    answer: "Our saunas run on standard 120V household power—just plug into any regular outlet. No special wiring required.",
  },
  {
    question: "How much space do I need?",
    answer: "The sauna footprint is 48\" × 42\".",
  },
  {
    question: "How long does setup take?",
    answer: "Our team completes the entire setup in about 1 hour. We'll position it, connect it, and show you how to use it.",
  },
  {
    question: "Can I use it indoors and outdoors?",
    answer: "Yes. We have indoor and outdoor saunas available.",
  },
  {
    question: "Will a sauna overheat my apartment?",
    answer: "No. They're heavily insulated, so heat stays inside the cabin. No noticeable spillage into your space.",
  },
  {
    question: "Do I need to leave it running all day?",
    answer: "No. People just turn it on 20–60 minutes before using it. Most run it once a day for about an hour, then switch it off.",
  },
  {
    question: "How long does the sauna take to heat up?",
    answer: "Our infrared saunas heat to 150°F in 30 minutes. Our Finnish dry saunas reach 175-194°F in 20-60 minutes, depending on what heaters you choose.",
  },
  {
    question: "Is this landlord-friendly?",
    answer: "Yes. The sauna is a free-standing unit that plugs into a normal household outlet and doesn't require any building or electrical changes. Nothing is mounted, drilled, vented, or hardwired. It sits on the floor like a large appliance (think: a high-end space heater inside a wooden enclosure). Most customers in SF live in apartments, and the sauna leaves zero marks when removed. It's fully reversible and we handle the entire installation and pickup process.",
  },
  {
    question: "Do I need to ask my landlord?",
    answer: "In most cases, no. There's nothing permanent about the installation. There are no modifications, no wiring, no plumbing, no holes in walls, and nothing is attached to the building. The sauna sits in the space just like furniture or a Peloton. That said, every lease is different, so you should follow whatever your lease says about appliances or heat-producing equipment. Our customers almost never need permission.",
  },
  {
    question: "Will this overload my electrical panel?",
    answer: "No, the sauna uses a standard 120V outlet on a normal household circuit. It draws about the same load as a hair dryer or space heater. You don't need any upgrades or electrician visit.",
  },
  {
    question: "What if I move during my rental?",
    answer: "We simply move the sauna to your new place. Most customers are renters, so this is common and it's part of the service.",
  },
  {
    question: "What happens after the initial lease period?",
    answer: "After your lease ends, your plan switches to simple month-to-month. You keep the sauna as long as you'd like. If you want to end your rental, just let us know and we'll schedule pickup and remove the sauna within 30 days.",
  },
];

const FAQ = () => {
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
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center">
          <Link to="/install-power">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              View Full Installation Guide
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FAQ;