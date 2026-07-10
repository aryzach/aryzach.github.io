import { Link, useParams, Navigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { useAvailability } from "@/hooks/useAvailability";
import { getProduct, type Category, type PricingTier } from "@/lib/pricingCatalog";
import AvailabilityLine from "@/components/pricing/AvailabilityLine";
import { useReservationModal } from "@/contexts/ReservationModal";

const PricingProduct = () => {
  const { category, product: productSlug } = useParams<{ category: string; product: string }>();
  const cat = category as Category;
  const product = getProduct(cat, productSlug || "");

  if (!product) return <Navigate to="/pricing" replace />;

  useSEO({
    title: `${product.name} — SF Sauna Rental`,
    description: product.shortDescription,
  });

  const { getStatus } = useAvailability();
  const status = getStatus(product.saunaTypeId);
  const { open: openReservation } = useReservationModal();

  const canReserve = !!product.saunaTypeId && status.status !== "unavailable";

  const handleReserve = () => {
    if (canReserve && product.saunaTypeId) {
      openReservation({ saunaTypeId: product.saunaTypeId, source: "Product Page" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow pt-24 md:pt-28 pb-24">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="mb-4">
            <Link
              to="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← All options
            </Link>
          </div>

          {/* Hero + pricing above the fold on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-start mb-16">
            <div className="md:col-span-5 rounded-2xl overflow-hidden bg-muted aspect-[4/5] md:aspect-[4/5]">
              <img
                src={product.image}
                alt={`${product.name} rental in San Francisco`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="md:col-span-7 flex flex-col">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-3">
                {product.name}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-4">
                {product.longDescription}
              </p>
              <div className="mb-5">
                <AvailabilityLine status={status} size="md" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                {product.tiers.map((tier) => (
                  <TierCard
                    key={tier.months}
                    tier={tier}
                  />
                ))}
              </div>
              <div className="mt-5">
                <Button size="lg" onClick={handleReserve} disabled={!canReserve} className="w-full md:w-auto">
                  {canReserve ? "Reserve Now" : "Currently unavailable"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                Longer commitments unlock lower monthly rates and free installation. After your initial term, continue month-to-month.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

interface TierProps {
  tier: PricingTier;
}

const TierCard = ({ tier }: TierProps) => {
  const highlighted = !!tier.badge;
  return (
    <div
      className={`relative rounded-2xl p-4 md:p-5 flex flex-row md:flex-col items-center md:items-start justify-between gap-3 md:gap-0 border transition-shadow ${
        highlighted
          ? "bg-card border-primary shadow-lg"
          : "bg-card border-border"
      }`}
    >
      {tier.badge && (
        <div className="absolute -top-2.5 left-4 md:left-1/2 md:-translate-x-1/2 bg-primary text-primary-foreground text-[10px] md:text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap">
          {tier.badge}
        </div>
      )}
      <div className="text-xs uppercase tracking-widest text-muted-foreground md:mb-1 shrink-0">
        {tier.months} {tier.months === 1 ? "Month" : "Months"}
      </div>
      <div className="flex items-baseline gap-1 md:mb-2">
        <span className="text-xl md:text-2xl font-semibold text-card-foreground leading-none">${tier.monthly}</span>
        <span className="text-xs text-muted-foreground leading-none">/ mo</span>
      </div>

      <div className="text-xs text-card-foreground text-right md:text-left">
        {tier.installFee === 0 ? "Free installation" : `$${tier.installFee} installation`}
      </div>
    </div>
  );
};

export default PricingProduct;