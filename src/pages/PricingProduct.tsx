import { Link, useParams, Navigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { useAvailability } from "@/hooks/useAvailability";
import { getProduct, type Category } from "@/lib/pricingCatalog";
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

              <div className="mt-1">
                <Button size="lg" onClick={handleReserve} disabled={!canReserve} className="w-full md:w-auto">
                  {canReserve ? "Reserve Now" : "Currently unavailable"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                Flexible rental terms. After your initial term, continue month-to-month.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PricingProduct;