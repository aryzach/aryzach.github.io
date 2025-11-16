import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("https://formspree.io/f/mzzyagpw", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        toast({
          title: "Message sent!",
          description: "We'll get back to you soon.",
        });
        form.reset();
      } else {
        throw new Error("Form submission failed");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-20">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Get in Touch
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Have questions about renting a sauna? Fill out the form below and we'll get back to you shortly.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  placeholder="(555) 555-5555"
                />
              </div>

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
                <Label htmlFor="questions">What questions do you have?</Label>
                <Textarea
                  id="questions"
                  name="questions"
                  placeholder="Tell us what you'd like to know..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">How did you hear about us?</Label>
                <Input
                  type="text"
                  id="source"
                  name="source"
                  placeholder="Google, friend, social media, etc."
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
