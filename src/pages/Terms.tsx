import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";

const Terms = () => {
  useSEO(seoData.terms);
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-semibold mb-6 text-foreground">
            Terms &amp; Conditions
          </h1>
          <p className="text-xl text-muted-foreground mb-12">
            Effective Date: November 19, 2025
          </p>

          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="mb-6">
              These Terms &amp; Conditions govern the use of the SF Sauna Rental website and our rental services.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Website Use</h2>
            <p className="mb-6">
              Users agree to use this website lawfully and not attempt to interfere with its operation.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Rental Services</h2>
            <p className="mb-6">
              Rental agreements, pricing, installation, payment terms, and customer responsibilities are governed by the applicable rental agreement provided to the customer.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Payments</h2>
            <p className="mb-6">
              Payments are securely processed through Stripe. We do not store complete payment card information.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Intellectual Property</h2>
            <p className="mb-6">
              All website content, branding, text, graphics, and photographs are the property of SF Sauna Rental unless otherwise stated.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Limitation of Liability</h2>
            <p className="mb-6">
              To the maximum extent permitted by law, SF Sauna Rental is not liable for indirect, incidental, or consequential damages arising from use of the website or services.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">SMS Terms</h2>
            <p className="mb-4">
              By opting in to receive SMS messages from Zachary Smith DBA SF Sauna, you agree to receive customer care SMS messages regarding reservation requests, installation scheduling, delivery coordination, rental updates, and customer support.
            </p>
            <p className="mb-4">Message frequency varies.</p>
            <p className="mb-4">Message and data rates may apply.</p>
            <p className="mb-4">Reply STOP to unsubscribe at any time.</p>
            <p className="mb-4">Reply HELP for assistance.</p>
            <p className="mb-4">Wireless carriers are not liable for delayed or undelivered messages.</p>
            <p className="mb-4">You must be at least 18 years old or have permission from a parent or legal guardian to opt in.</p>
            <p className="mb-4">Your consent is not a condition of purchasing any goods or services.</p>
            <p className="mb-6">
              For information about how we collect and use personal information, please review our{" "}
              <a href="/policies" className="text-primary hover:underline">Privacy Policy</a>.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Changes</h2>
            <p className="mb-6">
              We may update these Terms &amp; Conditions from time to time. Continued use of the website constitutes acceptance of any updates.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Contact</h2>
            <p className="mb-6">
              Questions regarding these Terms &amp; Conditions may be sent to:{" "}
              <a href="mailto:info@sfsaunarental.com" className="text-primary hover:underline">info@sfsaunarental.com</a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;