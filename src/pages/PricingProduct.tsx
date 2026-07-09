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
      <main className="flex-grow pt-24 md:pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="mb-8">
            <Link
              to={`/pricing/${cat}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← {product.categoryLabel}
            </Link>
          </div>

          {/* Hero */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center mb-20 md:mb-28">
            <div className="rounded-3xl overflow-hidden bg-muted aspect-[4/5] order-1 md:order-none">
              <img
                src={product.image}
                alt={`${product.name} rental in San Francisco`}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm uppercase tracking-widest text-muted-foreground mb-3">
                {product.categoryLabel} · {product.placement}
              </p>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-6">
                {product.name}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                {product.longDescription}
              </p>
              <div className="space-y-3 mb-8">
                <AvailabilityLine status={status} size="md" />
              </div>
              <Button size="lg" onClick={handleReserve} disabled={!canReserve}>
                {canReserve ? "Reserve" : "Currently unavailable"}
              </Button>
            </div>
          </div>

          {/* Pricing cards */}
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Choose your commitment
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Longer commitments unlock lower monthly rates and free installation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {product.tiers.map((tier) => (
              <TierCard
                key={tier.months}
                tier={tier}
                reservationFee={product.reservationFee}
                onReserve={handleReserve}
                disabled={!canReserve}
              />
            ))}
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
  reservationFee: number;
  onReserve: () => void;
  disabled: boolean;
}

const TierCard = ({ tier, reservationFee, onReserve, disabled }: TierProps) => {
  const highlighted = !!tier.badge;
  return (
    <div
      className={`relative rounded-3xl p-6 md:p-7 flex flex-col border transition-shadow ${
        highlighted
          ? "bg-card border-primary shadow-lg"
          : "bg-card border-border"
      }`}
    >
      {tier.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
          {tier.badge}
        </div>
      )}
      <div className="text-sm uppercase tracking-widest text-muted-foreground mb-2">
        {tier.months} {tier.months === 1 ? "Month" : "Months"}
      </div>
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-4xl font-semibold text-card-foreground">${tier.monthly}</span>
        <span className="text-sm text-muted-foreground">/ month</span>
      </div>

      <div className="space-y-2 text-sm mb-6 flex-grow">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Installation</span>
          <span className="font-medium text-card-foreground">
            {tier.installFee === 0 ? "Free" : `$${tier.installFee}`}
          </span>
        </div>
        {tier.months >= 6 ? (
          <p className="text-xs text-muted-foreground pt-2 leading-relaxed">
            Installation fee is applied toward your monthly payments.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground pt-2 leading-relaxed">
            Installation fee is applied toward payments when committing to 6+ months.
          </p>
        )}
      </div>

      <Button
        onClick={onReserve}
        disabled={disabled}
        variant={highlighted ? "default" : "outline"}
        className="w-full"
      >
        Reserve
      </Button>
    </div>
  );
};

export default PricingProduct;