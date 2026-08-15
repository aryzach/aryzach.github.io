import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useReservationModal } from "@/contexts/ReservationModal";
import ContactLeadForm from "@/components/lead/ContactLeadForm";
import { assetUrl } from "@/lib/assetUrl";
import traditionalHeroAsset from "@/assets/traditional-hero.png.asset.json";

const traditionalHero = assetUrl(traditionalHeroAsset);

type Spec = {
  label: string;
  value: string;
};

type SpecGroup = {
  title: string;
  specs: Spec[];
};

const overviewGroup: SpecGroup = {
  title: "Overview",
  specs: [
    { label: "Capacity", value: "2 person" },
    { label: "Max Temperature", value: "~200°F" },
    { label: "Heat Type", value: "Traditional sauna with electric heater and stones" },
    { label: "Power Requirement", value: "Standard 110/120V outlet with 20A breaker" },
  ],
};

const dimensionsGroup: SpecGroup = {
  title: "Dimensions & Weight",
  specs: [
    { label: "Exterior Dimensions (outdoor)", value: '63" W × 49" D × 92" H' },
    { label: "Exterior Dimensions (indoor)", value: '51" W × 46" D × 87" H' },
    { label: "Weight", value: "~320 lbs" },
    { label: "Heat-Up Time", value: "~40–90 minutes depending on ambient temperature" },
    { label: "Wood Type", value: "Red Cedar" },
    { label: "Insulation", value: "High-temp PIR insulation" },
    { label: "Door Type", value: "Glass" },
  ],
};

const placementGroup: SpecGroup = {
  title: "Placement & Use",
  specs: [
    { label: "Indoor Use", value: "Yes" },
    { label: "Outdoor Use", value: "Yes" },
    { label: "Surface Requirements", value: "Any level surface" },
    { label: "Floor Requirements", value: "No special foundation required" },
  ],
};

const permitsGroup: SpecGroup = {
  title: "Permits & Compliance",
  specs: [
    { label: "Permits Required", value: "No" },
    { label: "Landlord Approval", value: "Typically not required" },
  ],
};

const advancedGroup: SpecGroup = {
  title: "Advanced Specs",
  specs: [
    { label: "Estimated Energy Cost", value: "$0.50 – $2 per use" },
  ],
};

const groups: SpecGroup[] = [
  overviewGroup,
  dimensionsGroup,
  placementGroup,
  permitsGroup,
  advancedGroup,
];

const SpecRow = ({ spec, alt }: { spec: Spec; alt: boolean }) => (
  <div
    className={`grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-1 md:gap-6 px-5 md:px-7 py-4 md:py-[18px] border-b border-border last:border-b-0 ${
      alt ? "bg-muted/50" : "bg-white"
    }`}
  >
    <div className="text-sm font-semibold tracking-wide text-foreground">
      {spec.label}
    </div>
    <div className="text-sm leading-relaxed text-foreground/80">
      {spec.value}
    </div>
  </div>
);

const GroupBlock = ({ group }: { group: SpecGroup }) => (
  <div className="border border-border rounded-lg overflow-hidden bg-white">
    <h3 className="px-5 md:px-7 py-3 text-xs font-bold tracking-[0.18em] uppercase text-foreground border-b border-border bg-muted/30">
      {group.title}
    </h3>
    <div>
      {group.specs.map((spec, i) => (
        <SpecRow key={spec.label} spec={spec} alt={i % 2 === 1} />
      ))}
    </div>
  </div>
);

const TraditionalSaunaSpecs = () => {
  const { open: openReservation } = useReservationModal();

  useSEO({
    title: "Traditional Sauna Specs | SF Sauna Rental",
    description:
      "Full specifications for SF Sauna's traditional sauna rental: 2-person capacity, ~200°F heat, 110/120V power, red cedar build, indoor/outdoor use, and more.",
    canonical: "https://www.sfsaunarental.com/traditional-sauna-specs",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 md:pt-24">
        {/* Hero */}
        <section className="container mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="order-1 lg:order-1">
              <div className="aspect-[4/5] w-full overflow-hidden rounded-lg bg-muted">
                <img
                  src={traditionalHero}
                  alt="Traditional sauna rental installed on a San Francisco patio"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            </div>
            <div className="order-2 lg:order-2">
              <p className="uppercase text-xs font-bold tracking-[0.18em] text-foreground/70 mb-3">
                SF Sauna Rental
              </p>
              <h1 className="font-heading text-3xl md:text-5xl font-semibold text-foreground mb-5">
                Traditional Sauna Specs
              </h1>
              <p className="text-body text-foreground/80 mb-6 max-w-[52ch]">
                A real stone-heater sauna that runs on a standard outlet and fits
                indoors or out. Built with red cedar, insulated to hold heat, and
                delivered ready to use in the San Francisco Bay Area.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => openReservation({ source: "Traditional Specs Page" })}
                  className="bg-accent hover:bg-accent/90 text-white"
                >
                  Reserve Your Sauna
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-foreground/20 hover:bg-foreground/5"
                >
                  <Link to="/learn-more">Ask a Question</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Specs Table */}
        <section className="bg-white border-y border-border">
          <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
            <p className="uppercase text-xs font-bold tracking-[0.18em] text-foreground/70 mb-3 text-center">
              Specifications
            </p>
            <h2 className="font-heading text-2xl md:text-4xl font-semibold text-foreground mb-10 text-center">
              About the Traditional Sauna
            </h2>
            <div className="space-y-6">
              {groups.map((group) => (
                <GroupBlock key={group.title} group={group} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-cedar-section">
          <div className="container mx-auto px-4 py-14 md:py-20 max-w-2xl text-center">
            <h2 className="font-heading text-2xl md:text-3xl font-semibold text-foreground mb-4">
              Ready to bring a traditional sauna home?
            </h2>
            <p className="text-foreground/70 mb-8 max-w-[52ch] mx-auto">
              Send us your details and we'll help you reserve a sauna, check
              availability, and schedule installation in the Bay Area.
            </p>
            <ContactLeadForm
              formSource="traditional_specs_page"
              formName="Traditional Sauna Specs Lead"
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TraditionalSaunaSpecs;
