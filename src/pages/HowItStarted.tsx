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
                  <span className="font-medium">Hey, I'm Zach, the guy behind SF Sauna.</span>
                </p>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  When I was 27, I was working on a farm and messed up my back.
                </p>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  This injury spiraled into three years of debilitating pain and muscle tension throughout my body.
                </p>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  After trying many other ways to fix my back and heal from pain, one day I tried sitting in my gym sauna before starting my physical therapy exercises.
                </p>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  I noticed two big things— I felt more "in my body" and attuned to physical sensations, and it was the first time in three years where my muscles felt loose.
                </p>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  I started to rely on this routine and felt so much better on days when I used the sauna. Now my pain and tension was getting better, but my life revolved around getting to gym to use a sauna seven days a week.
                </p>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  I wanted a sauna at home, but after looking into options, I realized the process was a mess— all traditional saunas required extensive home electrical modification, and the installation process was a hassle.
                </p>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  This was surprising and frustrating, and it seemed obvious to me that there could to be a better way. I became obsessed with making a sauna that avoided the complexity of every other sauna (removing the need for electrical infrastructure upgrades was the biggest one).
                </p>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  I spent months building and testing new sauna designs in my backyard until I made something I was happy with.
                </p>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  I realized other people might want something like this too, so I started SF Sauna to make it happen.
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
