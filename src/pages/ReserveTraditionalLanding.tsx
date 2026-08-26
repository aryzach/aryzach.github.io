import { useEffect, useRef } from "react";
import { Star, Check, X } from "lucide-react";
import ContactLeadForm from "@/components/lead/ContactLeadForm";
import ReviewWall from "@/components/ReviewWall";
import FAQ from "@/components/FAQ";
import SocialProof from "@/components/SocialProof";
import VideoTestimonials from "@/components/VideoTestimonials";
import HowItWorksSection from "@/components/HowItWorksSection";
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
  const rows = [
    { feature: "Price", buy: "$8,485", rent: "$300/mo" },
    { feature: "Heater", buy: "Extra", rent: true },
    { feature: "Delivery", buy: "$495", rent: true },
    { feature: "Installation", buy: "$1,495", rent: true },
    { feature: "Maintenance", buy: false, rent: true },
    { feature: "Pickup", buy: false, rent: true },
    { feature: "Moving service", buy: false, rent: true },
  ];

  const renderCell = (value: string | boolean, bold?: boolean) => {
    if (value === true) {
      return <Check className="mx-auto text-green-600" size={18} strokeWidth={2.5} />;
    }
    if (value === false) {
      return <X className="mx-auto text-destructive" size={18} strokeWidth={2.5} />;
    }
    return <span className={bold ? "font-bold" : undefined}>{value}</span>;
  };

  return (
    <section className="py-14 md:py-20 bg-cedar-section">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="font-heading text-h2-mobile md:text-h2-desktop font-semibold text-foreground mb-3">
            A sauna at home, without buying one.
          </h2>
        </div>

        <div className="bg-background rounded-lg border border-border overflow-hidden relative">
          {/* Subtle tint behind the Rent column (1fr out of 4fr = 25%) */}
          <div className="absolute top-0 right-0 bottom-0 w-1/4 bg-[hsl(var(--color-accent)/0.05)] pointer-events-none" />

          {/* Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr] border-b border-border text-xs font-sans font-semibold text-foreground">
            <div className="p-3 md:p-4" />
            <div className="p-3 md:p-4 text-center">Buy</div>
            <div className="p-3 md:p-4 text-center">Rent</div>
          </div>

          {/* Comparison rows */}
          {rows.map((row, index) => {
            const isPrice = row.feature === "Price";
            return (
              <div
                key={row.feature}
                className={`grid grid-cols-[2fr_1fr_1fr] font-sans text-sm text-foreground ${index !== rows.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="p-3 md:p-4 font-medium">{row.feature}</div>
                <div className="p-3 md:p-4 text-center">{renderCell(row.buy, isPrice)}</div>
                <div className="p-3 md:p-4 text-center">{renderCell(row.rent, isPrice)}</div>
              </div>
            );
          })}

          {/* To get started — emphasized */}
          <div className="grid grid-cols-[2fr_1fr_1fr] border-t-2 border-border bg-[hsl(var(--color-accent)/0.04)] font-sans">
            <div className="p-3 md:p-4 font-semibold text-sm md:text-base flex items-center">
              To get started
            </div>
            <div className="p-3 md:p-4 text-center text-base md:text-lg font-semibold flex items-center justify-center">
              $10,475
            </div>
            <div className="p-3 md:p-4 text-center text-base md:text-lg font-semibold flex items-center justify-center">
              $300/mo
            </div>
          </div>
        </div>

        <div className="mt-8 md:mt-10 text-center">
          <p className="font-sans text-xl md:text-2xl font-semibold text-foreground mb-2">
            Rent from $300/mo. Everything included.
          </p>
          <p className="text-sm text-muted-foreground font-sans">
            Sauna, heater, delivery, installation, maintenance & pickup included.
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

      <section className="container mx-auto px-4 pt-4 pb-16">
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
