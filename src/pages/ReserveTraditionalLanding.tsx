import { useState } from "react";
import { ChevronLeft, ChevronRight, Users, Thermometer, Home, Trees } from "lucide-react";
import ReservationForm from "@/components/reservation/ReservationForm";
import FAQ from "@/components/FAQ";
import SocialProof from "@/components/SocialProof";
import { useSEO } from "@/hooks/useSEO";
import { PRICING_TIERS, type CommitmentMonths } from "@/lib/generatedPricing";
import traditionalIndoorAsset from "@/assets/traditional-indoor.jpg.asset.json";

const LOVABLE_ASSET_ORIGIN = "https://cedar-home-sanctuary.lovable.app";
const traditionalIndoorImg = traditionalIndoorAsset.url.startsWith("http")
  ? traditionalIndoorAsset.url
  : `${LOVABLE_ASSET_ORIGIN}${traditionalIndoorAsset.url}`;

type MediaItem = { type: "video" | "image"; src: string; alt: string };

const media: MediaItem[] = [
  { type: "video", src: "/media/billwalkthrough.mp4", alt: "Walkthrough of a traditional sauna rental in San Francisco" },
  { type: "image", src: "/media/upload-3.jpeg", alt: "Outdoor traditional sauna rental in a San Francisco garden" },
  { type: "image", src: "/media/upload-4.jpeg", alt: "Outdoor traditional sauna with copper roof in an SF backyard" },
  { type: "image", src: "/media/upload-2.jpeg", alt: "Cedar interior of an outdoor traditional sauna in the Bay Area" },
  { type: "image", src: "/media/upload-16.jpeg", alt: "Traditional sauna with red roof on a Bay Area deck with treetop views" },
  { type: "image", src: "/media/upload-15.jpeg", alt: "Traditional sauna rental in a San Francisco backyard garden patio" },
  { type: "image", src: "/media/upload-5.jpeg", alt: "SF Sauna traditional sauna installed on a San Francisco patio" },
  { type: "image", src: traditionalIndoorImg, alt: "Indoor traditional 2-person sauna rental in a San Francisco home" },
];

const TERMS: CommitmentMonths[] = [1, 3, 6, 12];

const ReserveTraditionalLanding = () => {
  useSEO({
    title: "Traditional Sauna Rental in San Francisco | SF Sauna",
    description:
      "Rent a 2-person traditional sauna in San Francisco. 200°F löyly heat, indoor or outdoor, delivered and installed. See pricing and reserve online.",
    canonical: "https://cedar-home-sanctuary.lovable.app/reserve-traditional-landing",
  } as any);

  const [active, setActive] = useState(0);
  const current = media[active];
  const go = (dir: -1 | 1) => setActive((i) => (i + dir + media.length) % media.length);

  const tiers = PRICING_TIERS.indoor_traditional_standard;

  return (
    <main className="min-h-screen bg-background">
      <section className="container mx-auto px-4 pt-10 md:pt-16 pb-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
            Traditional Sauna Rental — Indoor or Outdoor
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A 2-person traditional sauna delivered, installed, and maintained in San Francisco.
            Real löyly heat from a stone heater — up to 200°F on a standard household outlet.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { icon: Users, text: "2-person sauna" },
              { icon: Thermometer, text: "200°F" },
              { icon: Home, text: "Works indoors" },
              { icon: Trees, text: "Works outdoors" },
            ].map(({ icon: Icon, text }) => (
              <span
                key={text}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground"
              >
                <Icon size={15} className="text-primary" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery + form */}
      <section className="container mx-auto px-4 pb-16 grid lg:grid-cols-2 gap-10 items-start">
        <div>
          <div className="relative overflow-hidden rounded-xl bg-muted aspect-[4/3]">
            {current.type === "video" ? (
              <video
                key={current.src}
                src={current.src}
                controls
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                key={current.src}
                src={current.src}
                alt={current.alt}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            )}
            <button
              type="button"
              aria-label="Previous media"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground hover:bg-background"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              aria-label="Next media"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground hover:bg-background"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-4 sm:grid-cols-8 gap-2">
            {media.map((m, i) => (
              <button
                key={m.src}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show media ${i + 1}`}
                className={`relative overflow-hidden rounded-md aspect-square border-2 transition-colors ${
                  i === active ? "border-primary" : "border-transparent hover:border-border"
                }`}
              >
                {m.type === "video" ? (
                  <video src={m.src} muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={m.src} alt={m.alt} loading="lazy" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>

          {/* Pricing */}
          <div className="mt-10">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">Traditional sauna pricing</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Same pricing whether you put it indoors or outdoors. Delivery, installation, and all
              maintenance included.
            </p>
            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              {TERMS.map((months) => {
                const t = tiers[months];
                return (
                  <div
                    key={months}
                    className="rounded-lg border border-border bg-card p-5 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {months} month{months > 1 ? "s" : ""}
                      </span>
                      {t.badge && (
                        <span className="text-[11px] uppercase tracking-wide rounded-full bg-primary/10 text-primary px-2 py-0.5">
                          {t.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-3xl font-semibold text-foreground">
                      ${t.monthly}
                      <span className="text-base font-normal text-muted-foreground">/mo</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t.installFee > 0 ? `+ $${t.installFee} installation` : "Free installation"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-8">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Reserve your sauna</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-5">
              A few quick details and we'll set aside your spot.
            </p>
            <ReservationForm
              source="Landing Page"
              initialSaunaTypeId="indoor_traditional_standard"
              saunaTypeIds={["indoor_traditional_standard", "outdoor_traditional_standard"]}
              className="space-y-4"
            />
          </div>
        </div>
      </section>

      <FAQ />
      <SocialProof />
    </main>
  );
};

export default ReserveTraditionalLanding;
