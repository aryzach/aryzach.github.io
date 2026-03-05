import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";
import { CheckCircle } from "lucide-react";

const PrefabSaunaInstallationForm = () => {
  useSEO(seoData.prefabSaunaInstallationForm);
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get("success") === "true";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="container mx-auto px-4 max-w-2xl">
          {isSuccess ? (
            <div className="text-center py-16">
              <CheckCircle className="mx-auto text-accent mb-6" size={64} />
              <h1 className="text-4xl md:text-5xl font-heading font-semibold mb-4 text-heading">
                Thank You!
              </h1>
              <p className="text-lg text-muted-foreground">
                We've received your quote request and will be in touch within 1 business day.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-heading font-semibold mb-4 text-heading">
                Request a Free Sauna Installation Quote
              </h1>
              <p className="text-lg text-muted-foreground mb-10">
                Fill out the form below and we'll be in touch within 1 business day.
              </p>

              <form
                action="https://api.web3forms.com/submit"
                method="POST"
                encType="multipart/form-data"
                className="space-y-6"
              >
                <input type="hidden" name="access_key" value="a7a4686c-15a1-4fa1-807d-0f8a749786b7" />
                <input type="hidden" name="subject" value="New Sauna Installation Quote Request – sfsaunarental.com" />
                <input type="hidden" name="redirect" value="https://sfsaunarental.com/pre-fab-sauna-installation-form?success=true" />

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input type="text" id="name" name="name" placeholder="Your full name" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input type="email" id="email" name="email" placeholder="your@email.com" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input type="tel" id="phone" name="phone" placeholder="(555) 555-5555" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Where are you located?</Label>
                  <Input type="text" id="city" name="city" placeholder="City or neighborhood" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sauna_type">What type or brand of sauna do you have?</Label>
                  <Input type="text" id="sauna_type" name="sauna_type" placeholder="e.g. Almost Heaven barrel sauna, Sunlighten infrared..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">When are you looking to install?</Label>
                  <Select name="timeline">
                    <SelectTrigger id="timeline">
                      <SelectValue placeholder="Select a timeline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASAP">ASAP</SelectItem>
                      <SelectItem value="Within 1 month">Within 1 month</SelectItem>
                      <SelectItem value="1-3 months">1–3 months</SelectItem>
                      <SelectItem value="Just exploring">Just exploring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photos">Upload photos of your space (optional)</Label>
                  <Input type="file" id="photos" name="photos" accept="image/*" multiple className="cursor-pointer" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referral">How did you hear about us?</Label>
                  <Select name="referral">
                    <SelectTrigger id="referral">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Google">Google</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="Friend / referral">Friend / referral</SelectItem>
                      <SelectItem value="Nextdoor">Nextdoor</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Anything else we should know?</Label>
                  <Textarea id="message" name="message" placeholder="Tell us about your project..." rows={5} />
                </div>

                <Button type="submit" size="lg" className="w-full text-lg">
                  Request My Free Quote
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrefabSaunaInstallationForm;
