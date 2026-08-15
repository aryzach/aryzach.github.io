import { useNavigate, useSearchParams } from "react-router-dom";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { submitLeadToGHL, splitFullName, uploadLeadPhotos } from "@/lib/submitLeadToGHL";
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
  const navigate = useNavigate();
  const isSuccess = searchParams.get("success") === "true";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [saunaBrand, setSaunaBrand] = useState("");
  const [timeline, setTimeline] = useState("");
  const [referral, setReferral] = useState("");
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const invalid = validateContact({ email, phone });
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setSubmitting(true);
    const { first_name, last_name } = splitFullName(name);
    const folder = (email || "anonymous").replace(/[^a-zA-Z0-9._-]/g, "_");
    const upload = photos.length > 0 ? await uploadLeadPhotos(photos, folder) : { urls: [], failed: 0 };
    const res = await submitLeadToGHL({
      form_source: "prefab_installation_quote",
      form_name: "Prefab Sauna Installation Quote",
      fields: {
        name, first_name, last_name, email, phone, city,
        sauna_brand: saunaBrand,
        timeline,
        referral_source: referral,
        questions: message,
        photo_urls: upload.urls,
      },
    });
    setSubmitting(false);
    if (res.ok) {
      if (upload.failed > 0) toast.warning(`Submitted, but ${upload.failed} photo(s) failed to upload.`);
      navigate("/pre-fab-sauna-installation-form?success=true");
    } else {
      toast.error("Something went wrong. Please try again.");
    }
  };

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

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input type="text" id="name" name="name" placeholder="Your full name" required
                    value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input type="email" id="email" name="email" placeholder="your@email.com" required
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input type="tel" id="phone" name="phone" placeholder="(555) 555-5555" required
                    value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Where are you located?</Label>
                  <Input type="text" id="city" name="city" placeholder="City or neighborhood"
                    value={city} onChange={(e) => setCity(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sauna_type">What type or brand of sauna do you have?</Label>
                  <Input type="text" id="sauna_type" name="sauna_type"
                    placeholder="e.g. Almost Heaven barrel sauna, Sunlighten infrared..."
                    value={saunaBrand} onChange={(e) => setSaunaBrand(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">When are you looking to install?</Label>
                  <Select value={timeline} onValueChange={setTimeline}>
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
                  <Input type="file" id="photos" name="photos" accept="image/*" multiple className="cursor-pointer"
                    onChange={(e) => setPhotos(Array.from(e.target.files ?? []))} />
                  {photos.length > 0 && (
                    <p className="text-xs text-muted-foreground">{photos.length} file(s) selected</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referral">How did you hear about us?</Label>
                  <Select value={referral} onValueChange={setReferral}>
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
                  <Textarea id="message" name="message" placeholder="Tell us about your project..." rows={5}
                    value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>

                <Button type="submit" size="lg" disabled={submitting} className="w-full text-lg">
                  {submitting ? "Sending…" : "Request My Free Quote"}
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
