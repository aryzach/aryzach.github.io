import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { TurnstileWidget, TurnstileWidgetRef } from "./TurnstileWidget";

const HowItWorks = () => {
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
        <form 
          ref={formRef}
          action="https://api.web3forms.com/submit" 
          method="POST"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 max-w-md mx-auto w-full"
        >
          <input type="hidden" name="access_key" value="3fb7e2ca-1dd3-49a9-8a81-e90cbcc240b3" />
          <input type="hidden" name="redirect" value="https://sfsaunarental.com/thank-you" />
          
          <Input
            type="text"
            name="name"
            placeholder="Your name"
            required
            className="h-12 px-4 text-base"
          />
          
          <Input
            type="email"
            name="email"
            placeholder="your@email.com"
            required
            className="h-12 px-4 text-base"
          />
          
          <Input
            type="text"
            name="message"
            placeholder="Do you have any questions?"
            required
            className="h-12 px-4 text-base"
          />
          
          <TurnstileWidget ref={turnstileRef} onSuccess={handleTurnstileSuccess} />
          <Button 
            type="submit"
            size="lg" 
            className="bg-[hsl(var(--color-accent))] hover:bg-[hsl(var(--color-accent-dark))] text-[hsl(var(--color-white))] font-sans font-medium whitespace-nowrap"
          >
            Learn More
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </form>
      </div>
    </section>
  );
};

export default HowItWorks;
