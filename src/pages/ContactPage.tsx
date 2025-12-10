import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MapPin, Phone, Mail } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";
import { useRef } from "react";
import { TurnstileWidget, TurnstileWidgetRef } from "@/components/TurnstileWidget";

const ContactPage = () => {
  useSEO(seoData.contact);
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    turnstileRef.current?.execute();
  };

  const handleTurnstileSuccess = () => {
    formRef.current?.submit();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-20">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Form Section */}
              <div>
                <h1 className="font-heading text-4xl md:text-5xl font-semibold mb-4 text-heading">
                  Contact Us
                </h1>
                <p className="text-lg text-text mb-8">
                  Have questions? We're here to help. Fill out the form below and we'll get back to you soon.
                </p>

                <form
                  ref={formRef}
                  action="https://api.web3forms.com/submit"
                  method="POST"
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <input type="hidden" name="access_key" value="0fd02492-4a8f-4c11-b60e-a2485315ef72" />
                  <input type="hidden" name="redirect" value="https://sfsaunarental.com/thank-you" />

                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Your name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      type="tel"
                      id="phone"
                      name="phone"
                      placeholder="(555) 555-5555"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us what you're interested in..."
                      rows={5}
                    />
                  </div>

                  <TurnstileWidget ref={turnstileRef} onSuccess={handleTurnstileSuccess} />

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                  >
                    Send Message
                  </Button>
                </form>
              </div>

              {/* NAP & Map Section */}
              <div>
                <h2 className="font-heading text-2xl font-semibold mb-6 text-heading">
                  Get in Touch
                </h2>
                
                {/* NAP Info */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-accent mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-medium text-heading">Address</p>
                      <a 
                        href="https://share.google/veQFqIFODS6dBdPmM"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text hover:text-accent transition-colors"
                      >
                        1618 McAllister St<br />
                        San Francisco, CA 94115
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="text-accent mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-medium text-heading">Phone</p>
                      <a 
                        href="tel:+14154890261"
                        className="text-text hover:text-accent transition-colors"
                      >
                        (415) 489-0261
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="text-accent mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-medium text-heading">Email</p>
                      <a 
                        href="mailto:sfsaunarental@gmail.com"
                        className="text-text hover:text-accent transition-colors"
                      >
                        sfsaunarental@gmail.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Map */}
                <div className="rounded-lg overflow-hidden border border-ui">
                  <iframe 
                    src="https://maps.google.com/maps?q=SF%20Sauna%20Rental&output=embed&z=10" 
                    width="100%" 
                    height="350" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy"
                    title="SF Sauna Rental Location"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
