import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Policies = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            Policies & Terms
          </h1>
          <p className="text-xl text-muted-foreground mb-12">
            Everything you need to know about our rental terms, cancellation policy, and service agreements
          </p>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="terms">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                Terms of Service
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>
                  By renting a sauna from SF Sauna Rental, you agree to the following terms:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>You must be 18 years or older to enter into a rental agreement</li>
                  <li>The sauna remains the property of SF Sauna Rental at all times</li>
                  <li>You are responsible for the sauna's care during the rental period</li>
                  <li>Normal wear and tear is expected and covered</li>
                  <li>Any damage beyond normal use may result in repair fees</li>
                  <li>The sauna must be kept in a dry, protected location</li>
                  <li>You agree to allow access for maintenance if needed</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cancellation">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                Cancellation Policy
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p><strong>Before Delivery:</strong></p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Cancel up to 48 hours before scheduled delivery for full refund</li>
                  <li>Cancellations within 48 hours: $50 restocking fee</li>
                  <li>Same-day cancellations: $100 fee</li>
                </ul>
                <p><strong>During Rental Period:</strong></p>
                <ul className="list-disc list-inside space-y-2 mb-4">
                  <li>Monthly rentals: 7 days notice required</li>
                  <li>3+ month rentals: 14 days notice required</li>
                  <li>No refunds for partial months</li>
                  <li>Early pickup can be scheduled within 3-5 business days</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pickup">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                Rushed Pickup Fees
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>
                  Standard pickup is included at the end of your rental period with 7-14 days notice. Rush pickup options:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Same-day pickup: $150</li>
                  <li>Next-day pickup: $100</li>
                  <li>2-3 day pickup: $50</li>
                  <li>Standard (7+ days notice): Included</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="buyout">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                Buyout Option
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>
                  Love your sauna? You can purchase it at any time during your rental:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Retail price: $3,500</li>
                  <li>Previous rental payments are credited toward purchase</li>
                  <li>Buyout price = $3,500 - (months rented × rental rate)</li>
                  <li>Example: After 6 months at $249/mo, buyout = $3,500 - $1,494 = $2,006</li>
                  <li>Unit becomes yours with no pickup needed</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="damage">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                Damage & Liability
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>
                  We understand accidents happen. Here's our approach:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Normal wear and tear: Covered at no charge</li>
                  <li>Minor damage (scratches, small marks): Usually covered</li>
                  <li>Broken glass or panels: Repair/replacement costs apply</li>
                  <li>Water damage from outdoor exposure: May incur charges</li>
                  <li>We'll always communicate costs before repairs</li>
                  <li>Optional damage protection: $25/month covers up to $500 in repairs</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="privacy">
              <AccordionTrigger className="text-xl font-semibold text-foreground hover:text-primary">
                Privacy Policy
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4">
                <p>
                  Your privacy is important to us:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>We collect only necessary information for service delivery</li>
                  <li>Contact info, delivery address, and payment details</li>
                  <li>We never share your information with third parties</li>
                  <li>Email communications are opt-in (sauna tips & updates)</li>
                  <li>You can request data deletion at any time</li>
                  <li>We use secure payment processing (Stripe)</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-12 bg-muted rounded-lg p-6 text-center">
            <p className="text-foreground mb-2">
              Have questions about our policies?
            </p>
            <p className="text-muted-foreground">
              Contact us at <a href="mailto:hello@sfsaunarental.com" className="text-primary hover:underline">hello@sfsaunarental.com</a> or call (415) 555-SAUNA
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Policies;
