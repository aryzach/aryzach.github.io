import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { useAvailability } from "@/hooks/useAvailability";
import { productsIn, type Category, type Product } from "@/lib/pricingCatalog";
import AvailabilityLine from "@/components/pricing/AvailabilityLine";
import type { AvailabilityStatus } from "@/lib/availability";

const CATEGORIES: {
  key: Category;
  title: string;
  blurb: string;
  imageFrom: "Indoor" | "Outdoor";
}[] = [
  {
    key: "traditional",
    title: "Traditional Sauna",
    blurb:
      "Authentic löyly with real stones powered from a standard home outlet.",
    imageFrom: "Outdoor",
  },
  {
    key: "infrared",
    title: "Infrared Sauna",
    blurb: "Gentle, low-EMF radiant heat, delivered fully assembled.",
    imageFrom: "Outdoor",
  },
  {
    key: "original",
    title: "Traditional Sauna — Original Collection",
    blurb:
      "Earlier-generation traditional saunas converted from infrared models. Same authentic experience at a lower monthly price.",
    imageFrom: "Indoor",
  },
];

const PlacementCard = ({
  product,
  status,
}: {
  product: Product;
  status: AvailabilityStatus;
}) => {
  const canReserve = status.status !== "unavailable";
  const ctaLabel = canReserve ? "View Pricing & Reserve" : "View Pricing & Inquire";

  return (
    <Link
      to={`/pricing/${product.category}/${product.slug}`}
      className="group flex flex-col rounded-2xl bg-background border border-border p-5 hover:shadow-lg transition-shadow duration-300"
    >
      <h3 className="text-lg font-semibold text-card-foreground mb-3">
        {product.placement}
      </h3>
      <div className="mb-3">
        <AvailabilityLine status={status} />
      </div>
      <Button className="w-full mt-auto" size="sm">{ctaLabel}</Button>
    </Link>
  );
};

const Pricing = () => {
  useSEO({
    title: "Options & Pricing — SF Sauna Rental",
    description:
      "Choose the sauna type and placement that fits your home. Pricing, availability, and reservation details on every product.",
  });

  const { getStatus } = useAvailability();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow pt-24 md:pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground mb-5">
              Options & Pricing
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Choose the sauna type and placement that fits your home.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {CATEGORIES.map(({ key, title, blurb, imageFrom }, idx) => {
              const items = productsIn(key);
              const indoor = items.find((p) => p.placement === "Indoor");
              const outdoor = items.find((p) => p.placement === "Outdoor");
              const cards = [indoor, outdoor].filter(Boolean) as Product[];
              if (cards.length === 0) return null;
              const imageProduct =
                items.find((p) => p.placement === imageFrom) || cards[0];
              const startingAt = Math.min(
                ...cards.flatMap((p) => p.tiers.map((t) => t.monthly)),
              );
              return (
                <section
                  key={key}
                  className="rounded-3xl bg-card border border-border overflow-hidden flex flex-col"
                >
                  <div className="bg-muted aspect-[4/5]">
                    <img
                      src={imageProduct.image}
                      alt={`${title} rental in San Francisco`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6 md:p-8 flex flex-col flex-grow">
                    <h2 className="text-2xl md:text-3xl font-semibold text-card-foreground mb-4">
                      {title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      {blurb}
                    </p>
                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-sm text-muted-foreground">From</span>
                      <span className="text-2xl font-semibold text-card-foreground ml-1">
                        ${startingAt}
                      </span>
                      <span className="text-sm text-muted-foreground">/ month</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                      {cards.map((p) => (
                        <PlacementCard
                          key={`${p.category}-${p.slug}`}
                          product={p}
                          status={getStatus(p.saunaTypeId)}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
