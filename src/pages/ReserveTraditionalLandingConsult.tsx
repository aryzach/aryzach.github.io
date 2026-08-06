import { useEffect, useRef, useState } from "react";
import { Star, Check, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReviewWall from "@/components/ReviewWall";
import FAQ from "@/components/FAQ";
import { useSEO } from "@/hooks/useSEO";
import { PRICING_TIERS, type CommitmentMonths } from "@/lib/generatedPricing";
import { CALCOM_VIDEO_CONSULT_LINK } from "@/lib/reservationConfig";
import { submitLeadToGHL } from "@/lib/submitLeadToGHL";
import video0802Asset from "@/assets/0802.mp4.asset.json";

const LOVABLE_ASSET_ORIGIN = "https://cedar-home-sanctuary.lovable.app";
const video0802 = video0802Asset.url.startsWith("http")
  ? video0802Asset.url
  : `${LOVABLE_ASSET_ORIGIN}${video0802Asset.url}`;

const TERMS: CommitmentMonths[] = [1, 3, 6, 12];

const galleryItems = [
  { type: "video" as const, src: "/media/billwalkthrough.mp4", alt: "Walkthrough of a traditional sauna rental in San Francisco" },
  { type: "image" as const, src: "/media/upload-15.jpeg", alt: "Traditional sauna rental in a San Francisco backyard garden patio" },
  { type: "video" as const, src: video0802, alt: "Traditional sauna rental installation in San Francisco" },
];

const BookButton = ({ className }: { className?: string }) => (
  <Button
    asChild
    size="lg"
    className={`bg-[hsl(var(--color-accent))] hover:bg-[hsl(var(--color-accent-dark))] text-[hsl(var(--color-white))] font-sans font-medium whitespace-nowrap ${className ?? ""}`}
  >
    <a href={CALCOM_VIDEO_CONSULT_LINK} target="_blank" rel="noopener noreferrer">
      Book a Free 30-Minute Home Sauna Planning Session
      <ArrowRight className="ml-2" size={20} />
    </a>
  </Button>
);

const EmailCapture = ({ variant = "hero" }: { variant?: "hero" | "card" }) => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg(null);
    setSubmitting(true);
    const res = await submitLeadToGHL({
      form_source: "reserve_traditional_landing_consult_email",
      form_name: "Reserve Traditional Landing (Consult) Email Capture",
      fields: { email },
    });
    setSubmitting(false);
    if (res.ok) {
      navigate("/email-more-info");
    } else {
      setErrorMsg("Something went wrong. Please try again.");
      toast.error("We couldn't submit your email. Please try again.");
    }
  };

  const isHero = variant === "hero";

  return (
    <div className="w-full max-w-md mx-auto">
      <p className={`text-sm mb-2 ${isHero ? "text-white/85" : "text-muted-foreground"}`}>
        Not ready to book? Get the details by email.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
        <Input
          type="email"
          name="email"
          placeholder="Enter your email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
          className={`flex-1 h-12 px-4 text-base ${
            isHero ? "bg-white/95 backdrop-blur-sm border-white/40 focus:border-[hsl(var(--color-accent))]" : ""
          }`}
        />
        <Button type="submit" size="lg" variant={isHero ? "outline" : "secondary"} disabled={submitting} className="whitespace-nowrap">
          {submitting ? "Sending…" : "Learn More"}
          <ArrowRight className="ml-2" size={20} />
        </Button>
      </form>
      {errorMsg && (
        <p className={`text-sm mt-2 ${isHero ? "text-white/90" : "text-destructive"}`} role="alert">
          {errorMsg}
        </p>
      )}
    </div>
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
          <BookButton />
          <p className="font-sans text-[14px] md:text-[15px] leading-[1.6] text-white/85 max-w-md">
            We'll walk your space over video, answer your questions, and map out the right sauna setup for your home — free, no obligation.
          </p>
          <div className="pt-4 w-full">
            <EmailCapture />
          </div>
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

const ReserveTraditionalLandingConsult = () => {
  useSEO({
    title: "Free Home Sauna Planning Session | SF Sauna",
    description:
      "Book a free 30-minute home sauna planning session in San Francisco. We'll review your space and map out the right traditional sauna rental setup.",
    canonical: "https://cedar-home-sanctuary.lovable.app/reserve-traditional-landing-consult",
  } as any);

  const [showPricing, setShowPricing] = useState(false);
  const tiers = PRICING_TIERS.indoor_traditional_standard;

  return (
    <main className="min-h-screen bg-background">
      <LandingHero />
      <ReviewWall className="bg-background" />
      <LandingGallery />

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-xl mx-auto rounded-xl border border-border bg-card p-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Free 30-minute planning session</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            We'll walk your space over video, answer your questions, and map out the right sauna setup for your home — free, no obligation.
          </p>
          <BookButton />

          <div className="mt-6">
            <EmailCapture variant="card" />
          </div>

          <div className="mt-8 text-left">
            <button
              type="button"
              onClick={() => setShowPricing((s) => !s)}
              className="w-full flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left hover:bg-accent/50 transition-colors"
              aria-expanded={showPricing}
            >
              <span className="font-semibold text-foreground">{showPricing ? "Hide pricing" : "See pricing"}</span>
              {showPricing ? (
                <ChevronUp size={18} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={18} className="text-muted-foreground" />
              )}
            </button>
            {showPricing && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                {TERMS.map((months) => {
                  const t = tiers[months];
                  const highlighted = !!t.badge;
                  return (
                    <div
                      key={months}
                      className={`relative rounded-2xl p-4 md:p-5 flex flex-row md:flex-col items-center md:items-start justify-between gap-3 md:gap-0 border transition-shadow ${
                        highlighted ? "bg-card border-primary shadow-lg" : "bg-card border-border"
                      }`}
                    >
                      {t.badge && (
                        <div className="absolute -top-2.5 left-4 md:left-1/2 md:-translate-x-1/2 bg-primary text-primary-foreground text-[10px] md:text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap">
                          {t.badge}
                        </div>
                      )}
                      <div className="text-xs uppercase tracking-widest text-muted-foreground md:mb-1 shrink-0">
                        {months} {months === 1 ? "Month" : "Months"}
                      </div>
                      <div className="flex items-baseline gap-1 md:mb-2">
                        <span className="text-xl md:text-2xl font-semibold text-card-foreground leading-none">${t.monthly}</span>
                        <span className="text-xs text-muted-foreground leading-none">/ mo</span>
                      </div>
                      <div className="text-xs text-card-foreground text-right md:text-left">
                        {t.installFee === 0 ? "Free installation" : `$${t.installFee} installation`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <FAQ showInstallationGuide={false} />
    </main>
  );
};

export default ReserveTraditionalLandingConsult;
