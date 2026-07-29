import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { submitLeadToGHL, splitFullName } from "@/lib/submitLeadToGHL";

const HowItWorks = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg(null);
    setSubmitting(true);
    const { first_name, last_name } = splitFullName(name);
    const res = await submitLeadToGHL({
      form_source: "homepage_how_it_works",
      form_name: "Homepage How It Works",
      fields: { name, first_name, last_name, email, message },
    });
    setSubmitting(false);
    if (res.ok) {
      setSuccess(true);
      setName(""); setEmail(""); setMessage("");
    } else {
      setErrorMsg("We couldn't submit your message. Please try again.");
    }
  };

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-cedar-section">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <div className="mb-8 rounded-lg overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto"
          >
            <source src="/media/lindsey-sauna.mp4" type="video/mp4" />
          </video>
        </div>
        {success ? (
          <div className="max-w-md mx-auto text-center py-6" role="status">
            <CheckCircle2 className="mx-auto text-[hsl(var(--color-accent))] mb-3" size={40} />
            <p className="text-base">Thanks! We'll be in touch soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto w-full">
            <Input type="text" name="name" placeholder="Your name" required
              value={name} onChange={(e) => setName(e.target.value)}
              aria-label="Your name" className="h-12 px-4 text-base" />
            <Input type="email" name="email" placeholder="your@email.com" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address" className="h-12 px-4 text-base" />
            <Input type="text" name="message" placeholder="Do you have any questions?" required
              value={message} onChange={(e) => setMessage(e.target.value)}
              aria-label="Your question" className="h-12 px-4 text-base" />
            <Button type="submit" size="lg" disabled={submitting}
              className="bg-[hsl(var(--color-accent))] hover:bg-[hsl(var(--color-accent-dark))] text-[hsl(var(--color-white))] font-sans font-medium whitespace-nowrap">
              {submitting ? "Sending…" : "Learn More"}
              <ArrowRight className="ml-2" size={20} />
            </Button>
            {errorMsg && <p className="text-sm text-destructive" role="alert">{errorMsg}</p>}
          </form>
        )}
      </div>
    </section>
  );
};

export default HowItWorks;