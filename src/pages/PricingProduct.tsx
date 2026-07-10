import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { useAvailability } from "@/hooks/useAvailability";
import { getProduct, type Category, type PricingTier } from "@/lib/pricingCatalog";
import AvailabilityLine from "@/components/pricing/AvailabilityLine";
import ReservationDialog from "@/components/reservation/ReservationDialog";
import { supabase } from "@/integrations/supabase/client";

interface SaunaTypeLite {
  id: string;
  name: string;
  placement: "indoor" | "outdoor" | "either";
  reservation_fee_cents: number;
}

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

  const [saunaType, setSaunaType] = useState<SaunaTypeLite | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!product.saunaTypeId) return;
    (async () => {
      const { data } = await supabase
        .from("sauna_types")
        .select("id,name,placement,reservation_fee_cents")
        .eq("id", product.saunaTypeId!)
        .maybeSingle();
      if (data) setSaunaType(data as SaunaTypeLite);
    })();
  }, [product.saunaTypeId]);

  const canReserve = !!saunaType && status.status !== "unavailable";

  const handleReserve = () => {
    if (canReserve) setDialogOpen(true);
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

      {dialogOpen && saunaType && (
        <ReservationDialog
          saunaType={saunaType}
          availability={status}
          onClose={() => setDialogOpen(false)}
        />
      )}
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
      className={`relative rounded-2xl p-4 md:p-5 flex flex-col border transition-shadow ${
        highlighted
          ? "bg-card border-primary shadow-lg"
          : "bg-card border-border"
      }`}
    >
      {tier.badge && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] md:text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap">
          {tier.badge}
        </div>
      )}
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
        {tier.months} {tier.months === 1 ? "Month" : "Months"}
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl md:text-3xl font-semibold text-card-foreground">${tier.monthly}</span>
        <span className="text-xs text-muted-foreground">/ mo</span>
      </div>

      <div className="text-xs text-card-foreground">
        {tier.installFee === 0 ? "Free installation" : `$${tier.installFee} installation`}
      </div>
    </div>
  );
};

export default PricingProduct;