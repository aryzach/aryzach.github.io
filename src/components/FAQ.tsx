import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const faqs = [
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
    answer: "Right now we only have indoor saunas. Sign up on our email list to hear about outdoor options, or get in touch to pre-order.",
  },
  {
    question: "Will a sauna overheat my apartment?",
    answer: "No. They're heavily insulated, so heat stays inside the cabin. No noticeable spillage into your space.",
  },
  {
    question: "Do I need to leave it running all day?",
    answer: "No. People just turn it on 20–60 minutes before using it. Most run it once a day for about an hour, then switch it off.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 text-foreground">
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
