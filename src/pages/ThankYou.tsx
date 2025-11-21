import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const ThankYou = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <div className="mb-6 flex justify-center">
              <CheckCircle2 
                size={64} 
                className="text-[hsl(var(--color-accent))]"
              />
            </div>
            
            <h1 className="font-heading text-[32px] md:text-[42px] font-semibold text-heading mb-6">
              Thank you for sharing your information
            </h1>
            
            <p className="font-sans text-[17px] md:text-[18px] text-text leading-relaxed mb-8">
              We'll be in touch shortly.
            </p>

            <div className="bg-white rounded-lg p-8 shadow-sm border border-ui">
              <p className="font-sans text-[16px] text-text mb-6">
                In the meantime, check out our directory of saunas in the Bay Area:
              </p>
              <Button
                asChild
                size="lg"
                className="bg-[hsl(var(--color-accent))] hover:bg-[hsl(var(--color-accent-dark))] text-white font-sans font-medium"
              >
                <Link to="/sauna-directory">
                  Browse Bay Area Sauna Directory
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ThankYou;
