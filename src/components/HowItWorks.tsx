import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

const HowItWorks = () => {
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
          onSubmit={(e) => {
            e.preventDefault();
            const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
            if (email) {
              window.location.href = '/learn-more';
            }
          }}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto w-full"
        >
          <Input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            className="flex-1 h-12 px-4 text-base"
          />
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
