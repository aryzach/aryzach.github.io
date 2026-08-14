import { useEffect, useRef, useState } from "react";
import { Star, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReviewWall from "@/components/ReviewWall";
import FAQ from "@/components/FAQ";
import { useSEO } from "@/hooks/useSEO";
import { getStripeReservationConfig, CALCOM_VIDEO_CONSULT_LINK } from "@/lib/reservationConfig";
import video0802Asset from "@/assets/0802.mp4.asset.json";
import { assetUrl } from "@/lib/assetUrl";

const video0802 = assetUrl(video0802Asset);


const galleryItems = [
  { type: "video" as const, src: "/media/billwalkthrough.mp4", alt: "Walkthrough of a traditional sauna rental in San Francisco" },
  { type: "image" as const, src: "/media/upload-15.jpeg", alt: "Traditional sauna rental in a San Francisco backyard garden patio" },
  { type: "video" as const, src: video0802, alt: "Traditional sauna rental installation in San Francisco" },
];

const usePayLink = () => {
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    getStripeReservationConfig()
      .then((c) => setHref(c.baseLink))
      .catch(() => {});
  }, []);
  return href;
};

const PayButton = ({ className }: { className?: string }) => {
  const href = usePayLink();
  return (
    <Button
      asChild
      size="lg"
      className={`bg-[hsl(var(--color-accent))] hover:bg-[hsl(var(--color-accent-dark))] text-[hsl(var(--color-white))] font-sans font-medium whitespace-nowrap ${className ?? ""}`}
    >
      <a href={href ?? "#"} target="_blank" rel="noopener noreferrer">
        Pay Reservation Deposit
        <ArrowRight className="ml-2" size={20} />
      </a>
    </Button>
  );
};

const LandingHero = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-24">
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

      <div className="absolute inset-0 bg-charcoal/60" />

      <div className="relative z-10 container mx-auto px-4 text-center max-w-[1100px] flex flex-col">
        <h1 className="font-heading text-[40px] md:text-[56px] font-semibold text-white mb-6 leading-[1.1] tracking-[-0.01em] order-3">
          Rent a sauna for your home
        </h1>
        <div className="flex items-center justify-center gap-2 text-white/90 font-sans text-[14px] font-normal mb-8 -mt-16 order-1">
          <a href="https://share.google/bqGJ8MiXfwNgvigwm" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Serving 50+ Sweaty San Franciscans
          </a>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="fill-[hsl(var(--color-accent))] text-[hsl(var(--color-accent))]" size={14} />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-start text-left max-w-md mx-auto mb-8 order-4">
          <div className="flex items-center gap-2 text-white/90 font-sans text-[16px] md:text-[17px] leading-[1.6] mb-2">
            <Check className="text-[hsl(var(--color-accent))] flex-shrink-0" size={18} />
            <span>200°F sauna with a real stone heater</span>
          </div>
          <div className="flex items-center gap-2 text-white/90 font-sans text-[16px] md:text-[17px] leading-[1.6] mb-2">
            <Check className="text-[hsl(var(--color-accent))] flex-shrink-0" size={18} />
            <span>Zero-hassle delivery + installation</span>
          </div>
          <div className="flex items-start gap-2 text-white/90 font-sans text-[16px] md:text-[17px] leading-[1.6]">
            <Check className="text-[hsl(var(--color-accent))] flex-shrink-0 mt-0.5" size={18} />
            <span>Simple monthly plan, maintenance + pickup included</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 order-5">
          <PayButton />
          <p className="font-sans text-[14px] md:text-[15px] leading-[1.6] text-white/85 max-w-md">
            $200 reservation deposit locks-in your sauna reservation. We'll be in-touch within 24 hours to coordinate an installation date.
          </p>
        </div>
      </div>
    </section>
  );
};

const LandingGallery = () => (
  <section className="py-16 md:py-24 bg-cedar-section">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl md:text-5xl font-semibold text-center mb-8 text-foreground">Indoor &amp; Outdoor Saunas</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {galleryItems.map((item, index) => (
          <div key={index} className="overflow-hidden aspect-[9/16] relative">
            {item.type === "image" ? (
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <video autoPlay muted loop playsInline preload="metadata" className="w-full h-full object-cover">
                <source src={item.src} type="video/mp4" />
              </video>
            )}
            <div className="absolute inset-0 bg-accent/10 pointer-events-none" />
          </div>
        ))}
      </div>

      <div className="mt-16 max-w-4xl mx-auto">
        <h3 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-foreground">Why SF Sauna?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {[
            "Fast service throughout the SF Bay Area",
            "Professional installation + removal included",
            "Standard 120V power (no electrician needed)",
            "Month-to-month after initial term",
            "Apartment-friendly setups",
          ].map((text) => (
            <div key={text} className="flex items-start gap-3">
              <Check className="text-primary flex-shrink-0 mt-0.5" size={24} strokeWidth={2.5} />
              <span className="text-muted-foreground">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const ReserveTraditionalLandingPay = () => {
  useSEO({
    title: "Reserve a Traditional Sauna in San Francisco | SF Sauna",
    description:
      "Lock in your 2-person traditional sauna rental in San Francisco with a $200 reservation deposit. Delivery, installation, and maintenance included.",
    canonical: "https://cedar-home-sanctuary.lovable.app/reserve-traditional-landing-pay",
  } as any);

  return (
    <main className="min-h-screen bg-background">
      <LandingHero />
      <ReviewWall className="bg-background" />
      <LandingGallery />

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-xl mx-auto rounded-xl border border-border bg-card p-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Reserve your sauna</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            $200 reservation deposit locks-in your sauna reservation. We'll be in-touch within 24 hours to coordinate an installation date.
          </p>
          <PayButton />

          <div className="mt-8 text-left">
            <div className="border-t border-border pt-4 pb-6 text-center">
              <p className="text-sm text-muted-foreground">Have questions before reserving?</p>
              <a
                href={CALCOM_VIDEO_CONSULT_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary mt-1"
              >
                Book a free video consultation first
              </a>
            </div>
          </div>
        </div>
      </section>

      <FAQ showInstallationGuide={false} />
    </main>
  );
};

export default ReserveTraditionalLandingPay;
