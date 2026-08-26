import { useEffect, useRef } from "react";
import { Star, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContactLeadForm from "@/components/lead/ContactLeadForm";
import ReviewWall from "@/components/ReviewWall";
import FAQ from "@/components/FAQ";
import SocialProof from "@/components/SocialProof";
import VideoTestimonials from "@/components/VideoTestimonials";
import HowItWorksSection from "@/components/HowItWorksSection";
import { useReservationModal } from "@/contexts/ReservationModal";
import { useSEO } from "@/hooks/useSEO";
import video0802Asset from "@/assets/0802.mp4.asset.json";
import { assetUrl } from "@/lib/assetUrl";


const video0802 = assetUrl(video0802Asset);

const galleryItems = [
  { type: "video" as const, src: "/media/billwalkthrough.mp4", alt: "Walkthrough of a traditional sauna rental in San Francisco" },
  { type: "image" as const, src: "/media/upload-15.jpeg", alt: "Traditional sauna rental in a San Francisco backyard garden patio" },
  { type: "video" as const, src: video0802, alt: "Traditional sauna rental installation in San Francisco" },
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
        <div className="order-5">
          <ContactLeadForm
            formSource="traditional_landing_hero"
            formName="Traditional Landing Hero Contact"
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

      <div className="mt-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-background rounded-lg p-6 md:p-8 border-2 border-warm-orange">
            <h4 className="font-semibold text-xl mb-3 text-foreground">Fits almost anywhere.</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              ~4' x 4' footprint. Normal outlet.
              <br /><br />
              Assembled on-site. Fits through doorways and up stairs.
              <br /><br />
              Indoor or outdoor. Apartment, living room, balcony or backyard.
            </p>
          </div>
          <div className="bg-background rounded-lg p-6 md:p-8 border-2 border-warm-orange">
            <h4 className="font-semibold text-xl mb-3 text-foreground">Traditional sauna heat</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              200°F
              <br /><br />
              Real stone heater.
              <br /><br />
              Pour water, get steam.
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


const RentVsBuySection = () => {
  const { open } = useReservationModal();

  const buyItems = [
    "Heater not included",
    "Installation: $995",
    "Delivery: $495",
    "You handle maintenance",
    "You handle pickup/moving",
  ];

  const rentItems = [
    "Traditional sauna included",
    "Stone heater included",
    "Delivery included",
    "Installation included",
    "Maintenance included",
    "Pickup included",
    "We'll move it if you move",
    "Flexible rental options",
  ];

  return (
    <section className="py-16 md:py-24 bg-cedar-section">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="font-heading text-h2-mobile md:text-h2-desktop font-semibold text-foreground mb-4">
            A sauna at home, without buying one.
          </h2>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Try having a sauna at home before spending thousands to own one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Buy Your Own */}
          <div className="bg-background rounded-lg p-6 md:p-8 border-2 border-warm-orange flex flex-col">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-4 tracking-wide uppercase">
              Buy Your Own
            </h3>
            <div className="mb-5">
              <span className="font-heading text-4xl md:text-5xl font-semibold text-foreground">$8,995</span>
              <p className="text-muted-foreground text-sm mt-1">Sauna only</p>
            </div>
            <ul className="space-y-3 mb-6 flex-grow">
              {buyItems.map((text) => (
                <li key={text} className="flex items-start gap-2.5 text-muted-foreground text-sm">
                  <span className="text-muted-foreground/70 flex-shrink-0 w-4 text-center">•</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <div className="pt-5 border-t border-border">
              <p className="font-heading text-2xl md:text-3xl font-semibold text-foreground">$10,485+ upfront</p>
              <p className="text-muted-foreground text-xs mt-1">before heater</p>
            </div>
          </div>

          {/* Rent From SF Sauna */}
          <div className="bg-background rounded-lg p-6 md:p-8 border-[3px] border-warm-orange flex flex-col relative shadow-sm">
            <span className="inline-block self-start bg-[hsl(var(--color-accent))] text-white text-[11px] font-semibold px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
              Try It First
            </span>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-4 tracking-wide uppercase">
              Rent From SF Sauna
            </h3>
            <div className="mb-5">
              <span className="font-heading text-5xl md:text-6xl font-semibold text-foreground">From $300</span>
              <span className="text-muted-foreground text-lg md:text-xl">/month</span>
            </div>
            <ul className="space-y-3 mb-6 flex-grow">
              {rentItems.map((text) => (
                <li key={text} className="flex items-start gap-2.5 text-muted-foreground text-sm">
                  <Check className="text-[hsl(var(--color-accent))] flex-shrink-0 mt-0.5" size={16} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <div className="pt-5 border-t border-border">
              <p className="font-heading text-2xl md:text-3xl font-semibold text-foreground">$300/mo to get started</p>
            </div>
          </div>
        </div>

        <div className="mt-10 md:mt-14 text-center">
          <p className="text-foreground font-medium mb-5 text-lg">Try it before committing $10,000+ to ownership.</p>
          <Button
            size="lg"
            onClick={() => open({ source: "Landing Page", saunaTypeId: "traditional" })}
          >
            See if a sauna works for your home
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Delivery, installation, maintenance & pickup included with rental.
          </p>
        </div>
      </div>
    </section>
  );
};

const ReserveTraditionalLanding = () => {
  useSEO({
    title: "Traditional Sauna Rental in San Francisco | SF Sauna",
    description:
      "Rent a 2-person traditional sauna in San Francisco. 200°F löyly heat, indoor or outdoor, delivered and installed.",
    canonical: "https://www.sfsaunarental.com/reserve-traditional-landing",
  } as any);

  return (
    <main className="min-h-screen bg-background">
      <LandingHero />
      <ReviewWall className="bg-background" />
      <LandingGallery />
      <RentVsBuySection />

      <section className="container mx-auto px-4 py-16">
        <ContactLeadForm
          formSource="traditional_landing_mid"
          formName="Traditional Landing Contact"
        />
      </section>

      <HowItWorksSection />
      <FAQ showInstallationGuide={false} className="!pb-8 md:!pb-10" />

      <SocialProof className="!pt-0" />

      <section className="container mx-auto px-4 py-16">
        <ContactLeadForm
          formSource="traditional_landing_after_social"
          formName="Traditional Landing After Social Proof Contact"
          title="Ready to rent a sauna?"
          subtitle="Send us a note and we'll get back to you shortly."
        />
      </section>

      <VideoTestimonials />
    </main>
  );
};

export default ReserveTraditionalLanding;
