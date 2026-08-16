import { useEffect, useRef } from "react";
import { Star, Check } from "lucide-react";
import ContactLeadForm from "@/components/lead/ContactLeadForm";
import ReviewWall from "@/components/ReviewWall";
import FAQ from "@/components/FAQ";
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
        <h3 className="text-2xl md:text-3xl font-semibold text-center mb-10 text-foreground">Why SF Sauna?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 md:p-8 border border-border shadow-sm">
            <h4 className="font-semibold text-lg mb-3 text-foreground">Fits almost anywhere.</h4>
            <p className="text-muted-foreground leading-relaxed">
              They take up ~4' x 4' of space. Indoor or outdoor. Apartment, living room, balcony or backyard.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 md:p-8 border border-border shadow-sm">
            <h4 className="font-semibold text-lg mb-3 text-foreground">We handle installation.</h4>
            <p className="text-muted-foreground leading-relaxed">
              We'll check your space and electrical setup first.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 md:p-8 border border-border shadow-sm">
            <h4 className="font-semibold text-lg mb-3 text-foreground">No ownership headache.</h4>
            <p className="text-muted-foreground leading-relaxed">
              Delivery, setup, maintenance and pickup included.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const HowItWorks = () => (
  <section className="py-16 md:py-24 bg-background">
    <div className="container mx-auto px-4 max-w-5xl">
      <h2 className="text-3xl md:text-5xl font-semibold text-center mb-12 text-foreground">How It Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-cedar-section rounded-lg p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">1</span>
            <h4 className="font-semibold text-lg text-foreground">Tell us about your space</h4>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Our saunas are ~4' x 4' and use a normal outlet. We'll help you figure out which sauna will fit and make sure your electrical setup will work.
          </p>
        </div>
        <div className="bg-cedar-section rounded-lg p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">2</span>
            <h4 className="font-semibold text-lg text-foreground">We deliver and install it</h4>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            We bring the sauna to your home and handle the setup. Indoor, outdoor, apartment, backyard, garage, balcony. We'll figure out the logistics.
          </p>
        </div>
        <div className="bg-cedar-section rounded-lg p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">3</span>
            <h4 className="font-semibold text-lg text-foreground">Sauna whenever you want</h4>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            It's yours for the length of your rental. Use it every day if you want. We handle maintenance while you have it.
          </p>
        </div>
        <div className="bg-cedar-section rounded-lg p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">4</span>
            <h4 className="font-semibold text-lg text-foreground">Keep it or we pick it up</h4>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            At the end of your rental, keep renting, buy your sauna, or have us come take it away.
          </p>
        </div>
      </div>
    </div>
  </section>
);

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

      <section className="container mx-auto px-4 py-16">
        <ContactLeadForm
          formSource="traditional_landing_mid"
          formName="Traditional Landing Contact"
        />
      </section>

      <FAQ showInstallationGuide={false} />

      <section className="container mx-auto px-4 py-16">
        <ContactLeadForm
          formSource="traditional_landing_bottom"
          formName="Traditional Landing Bottom Contact"
          title="Still have questions?"
          subtitle="Send us a note and we'll get back to you shortly."
        />
      </section>
    </main>
  );
};

export default ReserveTraditionalLanding;
