import Header from "@/components/Header";
import Footer from "@/components/Footer";
import zachPortrait from "@/assets/zach-portrait.png";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";

const HowItStarted = () => {
  useSEO(seoData.howItStarted);
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-20">
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-semibold mb-12 text-foreground text-center">
              How It Started
            </h1>
            
            <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
              <div className="w-full md:w-1/2">
                <img 
                  src={zachPortrait} 
                  alt="Zach, founder of SF Sauna" 
                  className="w-full rounded-lg"
                />
              </div>
              
              <div className="w-full md:w-1/2 space-y-6">
                <p className="text-lg text-foreground leading-relaxed">
                  <span className="font-medium">Hey, I'm Zach, behind SF Sauna.</span>
                </p>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  When I was 27, I injured my back, which spiraled into three years of chronic pain and muscle tension. Using the gym sauna everyday was helpful, but as I got better, my life still revolved around getting to gym to use a sauna seven days a week.
                </p>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  I wanted an easier option and thought others might too, so I put up a neighborhood flyer with the idea and 200+ people replied!
                </p>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  People in SF seemed to want more convenient sauna access but didn't have it, so I started SF Sauna to make it happen.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HowItStarted;
