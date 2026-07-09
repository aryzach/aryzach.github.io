import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { useAvailability } from "@/hooks/useAvailability";
import { productsIn, type Category, type Product } from "@/lib/pricingCatalog";
import AvailabilityLine from "@/components/pricing/AvailabilityLine";
import type { AvailabilityStatus } from "@/lib/availability";

const CATEGORIES: { key: Category; title: string; blurb: string }[] = [
  {
    key: "traditional",
    title: "Traditional Sauna",
    blurb:
      "Authentic löyly with real stones powered from a standard home outlet.",
  },
  {
    key: "infrared",
    title: "Infrared Sauna",
    blurb: "Gentle, low-EMF radiant heat, delivered fully assembled.",
  },
  {
    key: "original",
    title: "Original Collection",
    blurb:
      "Earlier-generation traditional saunas converted from infrared models. Same authentic experience at a lower monthly price.",
  },
];

const ProductCard = ({
  product,
  status,
}: {
  product: Product;
  status: AvailabilityStatus;
}) => {
  const startingAt = Math.min(...product.tiers.map((t) => t.monthly));
  const canReserve = status.status !== "unavailable";
  const ctaLabel = canReserve ? "View Pricing & Reserve" : "View Pricing & Inquire";

  return (
    <Link
      to={`/pricing/${product.category}/${product.slug}`}
      className="group flex flex-col rounded-3xl overflow-hidden bg-card border border-border hover:shadow-xl transition-shadow duration-300"
    >
      <div className="aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={`${product.name} rental in San Francisco`}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          loading="lazy"
        />
      </div>
      <div className="p-6 md:p-7 flex flex-col flex-grow">
        <h3 className="text-xl md:text-2xl font-semibold text-card-foreground mb-2">
          {product.placement}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-grow">
          {product.shortDescription}
        </p>
        <div className="mb-3">
          <AvailabilityLine status={status} />
        </div>
        <div className="flex items-baseline gap-1 mb-5">
          <span className="text-sm text-muted-foreground">From</span>
          <span className="text-xl font-semibold text-card-foreground ml-1">
            ${startingAt}
          </span>
          <span className="text-sm text-muted-foreground">/ month</span>
        </div>
        <Button className="w-full mt-auto">{ctaLabel}</Button>
      </div>
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

          <div className="space-y-16 md:space-y-24">
            {CATEGORIES.map(({ key, title, blurb }) => {
              const items = productsIn(key);
              const indoor = items.find((p) => p.placement === "Indoor");
              const outdoor = items.find((p) => p.placement === "Outdoor");
              const cards = [indoor, outdoor].filter(Boolean) as Product[];
              if (cards.length === 0) return null;
              return (
                <section key={key}>
                  <div className="max-w-2xl mx-auto text-center mb-8 md:mb-12">
                    <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">
                      {title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">{blurb}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {cards.map((p) => (
                      <ProductCard
                        key={`${p.category}-${p.slug}`}
                        product={p}
                        status={getStatus(p.saunaTypeId)}
                      />
                    ))}
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
