import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { submitLeadToGHL, splitFullName } from "@/lib/submitLeadToGHL";

const EmailMoreInfo = () => {
  useSEO(seoData.emailMoreInfo);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const { first_name, last_name } = splitFullName(name);
    const res = await submitLeadToGHL({
      form_source: "email_more_info",
      form_name: "Email More Info",
      fields: { name, first_name, last_name, email, message },
    });
    setSubmitting(false);
    if (res.ok) {
      navigate("/thank-you");
    } else {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-4 max-w-2xl">
            <h1 className="font-heading text-[32px] md:text-[42px] font-semibold text-heading mb-6 text-center">
              Thanks for sharing your email!
            </h1>
            <p className="font-sans text-[17px] md:text-[18px] text-text leading-relaxed mb-8 text-center">
              If you'd like us to get in touch with you about leasing a sauna, or have a question, please fill out the info below.
            </p>

            <div className="mb-12 text-center">
              <Button
                asChild
                size="lg"
                className="bg-[hsl(var(--color-accent))] hover:bg-[hsl(var(--color-accent-dark))] text-white font-sans font-medium"
              >
                <a
                  href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ2a4oLKVXzVRLEm5l1tFJnmJJKRW0EXphR7T1tB9cLXhEQxLhPvFVX1zP2yj7CLSUUGCCNyJTv5"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Schedule a Fit Check Here
                  <ExternalLink size={18} />
                </a>
              </Button>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border border-ui">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block font-sans text-[14px] font-medium text-text mb-2">
                    Name
                  </label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block font-sans text-[14px] font-medium text-text mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block font-sans text-[14px] font-medium text-text mb-2">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full min-h-[120px]"
                    placeholder="Tell us about your space, timeline, or any questions you have..."
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="w-full bg-[hsl(var(--color-accent))] hover:bg-[hsl(var(--color-accent-dark))] text-white font-sans font-medium"
                >
                  {submitting ? "Sending…" : "Submit Form"}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default EmailMoreInfo;