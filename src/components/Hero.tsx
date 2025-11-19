import { Button } from "@/components/ui/button";
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
      <div className="relative z-10 container mx-auto px-4 text-center max-w-[1100px]">
        <div className="flex items-center justify-center gap-2 text-white/90 font-sans text-[13px] font-normal mb-8 -mt-12">
          <span>Loved by 42+ San Franciscans</span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="fill-[hsl(var(--color-accent))] text-[hsl(var(--color-accent))]" size={14} />
            ))}
          </div>
        </div>
        <p className="font-sans text-[16px] md:text-[18px] leading-[1.6] text-white/90 mb-3 font-normal">
          Make daily heat therapy effortless.
        </p>
        <h1 className="font-heading text-[40px] md:text-[56px] font-semibold text-white mb-6 leading-[1.1] tracking-[-0.01em]">
          A personal sauna — in your home this week.
        </h1>
        <div className="flex flex-col items-start text-left max-w-md mx-auto mb-8">
          <div className="flex items-center gap-2 text-white/90 font-sans text-[16px] md:text-[17px] leading-[1.6] mb-2">
            <Check className="text-[hsl(var(--color-accent))] flex-shrink-0" size={18} />
            <span>Zero-hassle delivery + installation</span>
          </div>
          <div className="flex items-center gap-2 text-white/90 font-sans text-[16px] md:text-[17px] leading-[1.6] mb-2">
            <Check className="text-[hsl(var(--color-accent))] flex-shrink-0" size={18} />
            <span>Enjoy daily sauna at home, no commute</span>
          </div>
          <div className="flex items-center gap-2 text-white/90 font-sans text-[16px] md:text-[17px] leading-[1.6]">
            <Check className="text-[hsl(var(--color-accent))] flex-shrink-0" size={18} />
            <span>Simple monthly plan, maintenance + pickup included</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Button 
            size="lg" 
            className="font-sans font-medium"
            asChild
          >
            <a href="https://calendar.app.google/15uxvc8nue1YjcYt9" target="_blank" rel="noopener noreferrer">
              Schedule Free Sauna Fit Check
              <ArrowRight className="ml-2" size={20} />
            </a>
          </Button>
          <p className="text-white/80 font-sans text-[14px] font-normal max-w-md">
            We confirm fit, electrical, and recommend the right model, no pressure.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
