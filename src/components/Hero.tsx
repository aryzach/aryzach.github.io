import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Star, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const Hero = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [zipCode, setZipCode] = useState<string>("your area");

  useEffect(() => {
    // Force video to play on mobile devices
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log("Video autoplay failed:", error);
      });
    }

    // Fetch user's zip code
    fetch('https://ipapi.co/json/')
      .then(response => response.json())
      .then(data => {
        if (data.postal) {
          setZipCode(data.postal);
        }
      })
      .catch(error => {
        console.log("Failed to fetch zip code:", error);
      });
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/hero-fallback.avif"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/hero-video.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-charcoal/60" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center max-w-[1100px] flex flex-col">
        {/* H1 first in DOM for SEO, visually reordered with CSS */}
        <h1 className="font-heading text-[40px] md:text-[56px] font-semibold text-white mb-6 leading-[1.1] tracking-[-0.01em] order-3">
          A personal sauna — in your home this week.
        </h1>
        <div className="flex items-center justify-center gap-2 text-white/90 font-sans text-[14px] font-normal mb-8 -mt-16 order-1">
          <a href="https://share.google/bqGJ8MiXfwNgvigwm" target="_blank" rel="noopener noreferrer" className="hover:underline">Loved by 22+ San Franciscans</a>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="fill-[hsl(var(--color-accent))] text-[hsl(var(--color-accent))]" size={14} />
            ))}
          </div>
        </div>
        <p className="font-sans text-[16px] md:text-[18px] leading-[1.6] text-white/90 mb-3 font-normal order-2">
          Make daily heat therapy effortless.
        </p>
        <div className="flex flex-col items-start text-left max-w-md mx-auto mb-8 order-4">
          <div className="flex items-center gap-2 text-white/90 font-sans text-[16px] md:text-[17px] leading-[1.6] mb-2">
            <Check className="text-[hsl(var(--color-accent))] flex-shrink-0" size={18} />
            <span>Zero-hassle delivery + installation</span>
          </div>
          <div className="flex items-center gap-2 text-white/90 font-sans text-[16px] md:text-[17px] leading-[1.6] mb-2">
            <Check className="text-[hsl(var(--color-accent))] flex-shrink-0" size={18} />
            <span>Enjoy daily sauna at home, no commute</span>
          </div>
          <div className="flex items-start gap-2 text-white/90 font-sans text-[16px] md:text-[17px] leading-[1.6]">
            <Check className="text-[hsl(var(--color-accent))] flex-shrink-0 mt-0.5" size={18} />
            <span>Simple monthly plan, maintenance + pickup included</span>
          </div>
        </div>
        <form 
          action="https://api.web3forms.com/submit"
          method="POST"
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto w-full order-5"
        >
          <input type="hidden" name="access_key" value="3fb7e2ca-1dd3-49a9-8a81-e90cbcc240b3" />
          <input type="hidden" name="redirect" value="https://sfsaunarental.com/email-more-info" />
          <Input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            className="flex-1 bg-white/95 backdrop-blur-sm border-white/40 focus:border-[hsl(var(--color-accent))] h-12 px-4 text-base"
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

export default Hero;