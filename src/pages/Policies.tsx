import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Policies = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-semibold mb-6 text-foreground">
            Privacy Policy
          </h1>
          <p className="text-xl text-muted-foreground mb-12">
            Effective Date: November 19, 2025
          </p>

          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="mb-6">
              SF Sauna Rental ("we," "us," "our") provides in-home sauna rentals, installations, and related services. This Privacy Policy explains what information we collect, why we collect it, and how it's used when you visit our website, submit a form, or become a customer.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. What We Collect</h2>
            
            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">Information You Provide</h3>
            <p className="mb-4">We collect the information you choose to give us, including:</p>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Installation address</li>
              <li>Billing and payment details (processed securely by Stripe)</li>
              <li>Notes about your space, unit preferences, or service requests</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">Automatically Collected</h3>
            <p className="mb-4">When you use our site, certain data is collected automatically:</p>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li>IP address, browser type, device info</li>
              <li>Pages viewed, time on site, referring source</li>
              <li>Cookie-level data from analytics and advertising tools (Google Analytics, Meta Pixel, etc.)</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground mt-6 mb-3">From Third Parties</h3>
            <p className="mb-4">If you interact with external platforms we use, we may receive data from:</p>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li>Stripe (payment confirmations, billing status)</li>
              <li>Meta/Facebook/Instagram (ad performance and limited tracking signals)</li>
              <li>Google Analytics (site usage stats)</li>
            </ul>
            <p className="mb-6">We do not receive your full card number or banking credentials.</p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use your information to:</p>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li>Provide quotes, installations, and ongoing rental service</li>
              <li>Manage billing, payments, and subscription changes</li>
              <li>Communicate with you about delivery, maintenance, or support</li>
              <li>Improve our website and advertising performance</li>
              <li>Maintain accounting and legal compliance</li>
            </ul>
            <p className="mb-6 font-semibold text-foreground">We do not sell your data.</p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. Sharing Your Information</h2>
            <p className="mb-4">We only share information with service providers who help us operate the business, including:</p>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li>Stripe (payments)</li>
              <li>Email and form tools</li>
              <li>Analytics and advertising platforms (Google, Meta)</li>
            </ul>
            <p className="mb-6">These third parties may collect or process data according to their own privacy policies.</p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Data Retention</h2>
            <p className="mb-4">We keep information for as long as necessary to:</p>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li>Provide rentals or service</li>
              <li>Maintain records required by law</li>
              <li>Resolve disputes or verify transactions</li>
            </ul>
            <p className="mb-6">You may request deletion unless legal obligations require us to retain specific records.</p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Your Rights</h2>
            <p className="mb-4">If you live in California, you may:</p>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li>Request access to your personal data</li>
              <li>Ask us to correct or delete it</li>
              <li>Opt out of certain tracking (via browser or device settings)</li>
            </ul>
            <p className="mb-6">
              To make a request, email us at <a href="mailto:sfsaunarental@gmail.com" className="text-primary hover:underline">sfsaunarental@gmail.com</a>.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Security</h2>
            <p className="mb-6">
              We take reasonable steps to protect your information. Payments are handled by Stripe, which processes all sensitive card data. We do not store your full payment details.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Changes</h2>
            <p className="mb-6">
              We may update this Privacy Policy as our business or legal obligations change. The Effective Date above will always reflect the latest version.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">8. Contact</h2>
            <p className="mb-6">
              For questions about this Privacy Policy, contact us at: <a href="mailto:sfsaunarental@gmail.com" className="text-primary hover:underline">sfsaunarental@gmail.com</a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Policies;
