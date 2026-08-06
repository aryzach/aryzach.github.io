import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

const Field = ({ label, error, children }: FieldProps) => (
  <div>
    <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">
      {label}
    </Label>
    {children}
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

const A2PFormReview = () => {
  const [submitted, setSubmitted] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background py-20 px-4">
        <div className="max-w-2xl mx-auto text-center p-6">
          <CheckCircle2 className="mx-auto text-primary mb-3" size={44} />
          <h2 className="text-xl font-semibold text-foreground mb-2">Form Submitted</h2>
          <p className="text-sm text-muted-foreground">
            This is a demonstration page for A2P 10DLC compliance review. No data was sent to a backend.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            A2P SMS Opt-In Demonstration
          </h1>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Business Name:</span> Zachary Smith DBA SF Sauna
          </p>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            This page demonstrates the SMS opt-in flow used by SF Sauna. The form below mirrors the production reservation request form and includes the optional SMS consent checkbox reviewed during A2P 10DLC registration.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name">
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  autoComplete="given-name"
                  required
                />
              </Field>
              <Field label="Last Name">
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  autoComplete="family-name"
                  required
                />
              </Field>
            </div>

            <Field label="Email">
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                autoComplete="email"
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone Number">
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  autoComplete="tel"
                  required
                />
              </Field>
              <Field label="City">
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  autoComplete="address-level2"
                  required
                />
              </Field>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={smsConsent}
                  onChange={(e) => setSmsConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground leading-relaxed">
                  I agree to receive customer care SMS messages from Zachary Smith DBA SF Sauna regarding my reservation request, installation scheduling, delivery coordination, rental updates, and customer support. Message frequency varies. Message & data rates may apply. Reply STOP to opt out and HELP for help. Consent is not a condition of purchase. By checking this box, I agree to the{" "}
                  <a href="/policies" className="text-foreground underline underline-offset-4 hover:text-primary">
                    Privacy Policy
                  </a>{" "}
                  and{" "}
                  <a href="/terms" className="text-foreground underline underline-offset-4 hover:text-primary">
                    Terms & Conditions
                  </a>
                  .
                </span>
              </label>
              <div className="mt-4 flex flex-col sm:flex-row sm:gap-4 text-sm">
                <span className="font-medium text-foreground sm:w-40 shrink-0">Program Type:</span>
                <span className="text-muted-foreground">Customer Care SMS</span>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" size="lg" className="w-full">
                Submit Reservation Request
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2 leading-relaxed">
                SMS consent is optional.
              </p>
            </div>
          </form>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <h2 className="text-xl font-semibold text-foreground mb-5">SMS Program Information</h2>
          <div className="grid gap-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <span className="font-medium text-foreground sm:w-40 shrink-0">Business:</span>
              <span className="text-muted-foreground">Zachary Smith DBA SF Sauna</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <span className="font-medium text-foreground sm:w-40 shrink-0">Program Description:</span>
              <span className="text-muted-foreground">
                Customer care and transactional SMS for reservation requests, installation scheduling, delivery coordination, rental updates, and customer support.
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <span className="font-medium text-foreground sm:w-40 shrink-0">Message Frequency:</span>
              <span className="text-muted-foreground">Varies based on customer interaction.</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <span className="font-medium text-foreground sm:w-40 shrink-0">Opt-Out:</span>
              <span className="text-muted-foreground">Reply STOP to unsubscribe.</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <span className="font-medium text-foreground sm:w-40 shrink-0">Help:</span>
              <span className="text-muted-foreground">
                Reply HELP for assistance or email{" "}
                <a href="mailto:info@sfsaunarental.com" className="text-foreground underline underline-offset-4 hover:text-primary">
                  info@sfsaunarental.com
                </a>
                .
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <span className="font-medium text-foreground sm:w-40 shrink-0">Message & Data Rates:</span>
              <span className="text-muted-foreground">Message and data rates may apply.</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <span className="font-medium text-foreground sm:w-40 shrink-0">Age Requirement:</span>
              <span className="text-muted-foreground">Users must be 18 years of age or older.</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <span className="font-medium text-foreground sm:w-40 shrink-0">Privacy Policy:</span>
              <a href="/policies" className="text-muted-foreground underline underline-offset-4 hover:text-primary">
                /policies
              </a>
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-4">
              <span className="font-medium text-foreground sm:w-40 shrink-0">Terms & Conditions:</span>
              <a href="/terms" className="text-muted-foreground underline underline-offset-4 hover:text-primary">
                /terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default A2PFormReview;
