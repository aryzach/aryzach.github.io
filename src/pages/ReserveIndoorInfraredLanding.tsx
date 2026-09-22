import { useEffect, useRef } from "react";
import { Star, Check } from "lucide-react";
import ContactLeadForm from "@/components/lead/ContactLeadForm";
import ReviewWall from "@/components/ReviewWall";
import FAQ from "@/components/FAQ";
import SocialProof from "@/components/SocialProof";
import HowItWorksSection from "@/components/HowItWorksSection";
import { useSEO } from "@/hooks/useSEO";
import { assetUrl } from "@/lib/assetUrl";
import galleryIndoorInfraredAsset from "@/assets/gallery-indoor-infrared-room.jpeg.asset.json";


const video0804 = "https://id-preview--c82befae-ecc0-44e6-8bc1-a4554e5e12f4.lovable.app/media/0804.mp4";
const galleryIndoorInfrared = assetUrl(galleryIndoorInfraredAsset);

const galleryItems = [
  { type: "video" as const, src: video0804, alt: "Indoor infrared sauna rental installation in San Francisco" },
  { type: "image" as const, src: galleryIndoorInfrared, alt: "Indoor infrared sauna rental in a San Francisco apartment living room" },
];

const LandingHero = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-28 md:py-32">
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
            <span>Gentle ~150°F infrared heat</span>
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
        <div className="order-5">
          <ContactLeadForm
            formSource="infrared_landing_hero"
            formName="Infrared Landing Hero Contact"
            overlay
          />
        </div>
      </div>
    </section>
  );
};

const LandingGallery = () => (
  <section className="py-16 md:py-24 bg-cedar-section">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl md:text-5xl font-semibold text-center mb-8 text-foreground">Indoor Infrared Saunas</h2>

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

      <div className="mt-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-background rounded-lg p-6 md:p-8 border-2 border-warm-orange">
            <h4 className="font-semibold text-xl mb-3 text-foreground">Fits almost anywhere.</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              ~4' x 4' footprint. Normal outlet.
              <br /><br />
              Assembled on-site. Fits through doorways and up stairs.
              <br /><br />
              Living room, apartment, garage or office.
            </p>
          </div>
          <div className="bg-background rounded-lg p-6 md:p-8 border-2 border-warm-orange">
            <h4 className="font-semibold text-xl mb-3 text-foreground">Gentle infrared heat</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              ~150°F soothing warmth.
              <br /><br />
              Heats your body directly, not the air.
              <br /><br />
              Warm up in minutes.
            </p>
          </div>
          <div className="bg-background rounded-lg p-6 md:p-8 border-2 border-warm-orange">
            <h4 className="font-semibold text-xl mb-3 text-foreground">No ownership headache.</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Delivery, setup, maintenance and pickup included.
              <br /><br />
              Never worry, we provide service 7-days per week.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);


const RatesSection = () => (
  <section className="py-14 md:py-20 bg-cedar-section">
    <div className="container mx-auto px-4 max-w-2xl">
      <div className="text-center">
        <p className="font-sans text-xl md:text-2xl font-semibold text-foreground mb-2">
          Rates starting at $200/mo. Everything included.
        </p>
        <p className="text-sm text-muted-foreground font-sans">
          Sauna, delivery, installation, maintenance &amp; pickup included.
        </p>
      </div>
    </div>
  </section>
);

const ReserveIndoorInfraredLanding = () => {
  useSEO({
    title: "Indoor Infrared Sauna Rental in San Francisco | SF Sauna",
    description:
      "Rent a 2-person indoor infrared sauna in San Francisco. Gentle infrared heat, delivered and installed, maintenance and pickup included.",
    canonical: "https://www.sfsaunarental.com/reserve-indoor-infrared-landing",
  } as any);

  return (
    <main className="min-h-screen bg-background">
      <LandingHero />
      <ReviewWall className="bg-background" />
      <LandingGallery />
      <RatesSection />

      <section className="container mx-auto px-4 pt-4 pb-16">
        <ContactLeadForm
          formSource="infrared_landing_mid"
          formName="Infrared Landing Contact"
        />
      </section>

      <HowItWorksSection />
      <FAQ showInstallationGuide={false} className="!pb-8 md:!pb-10" />

      <SocialProof className="!pt-0" />

      <section className="container mx-auto px-4 py-16">
        <ContactLeadForm
          formSource="infrared_landing_after_social"
          formName="Infrared Landing After Social Proof Contact"
          title="Ready to rent a sauna?"
          subtitle="Send us a note and we'll get back to you shortly."
        />
      </section>
    </main>
  );
};

export default ReserveIndoorInfraredLanding;
