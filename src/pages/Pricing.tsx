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
  const startingAt = Math.min(...product.tiers.map((t) => t.monthly));
  const canReserve = status.status !== "unavailable";
  const ctaLabel = canReserve ? "View Pricing & Reserve" : "View Pricing & Inquire";

  return (
    <Link
      to={`/pricing/${product.category}/${product.slug}`}
      className="group flex flex-col rounded-2xl bg-card border border-border p-5 hover:shadow-lg transition-shadow duration-300"
    >
      <h3 className="text-lg font-semibold text-card-foreground mb-3">
        {product.placement}
      </h3>
      <div className="mb-3">
        <AvailabilityLine status={status} />
      </div>
      <div className="flex items-baseline gap-1 mb-4">
        <span className="text-sm text-muted-foreground">From</span>
        <span className="text-lg font-semibold text-card-foreground ml-1">
          ${startingAt}
        </span>
        <span className="text-sm text-muted-foreground">/ mo</span>
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

          <div className="space-y-20 md:space-y-28">
            {CATEGORIES.map(({ key, title, blurb, imageFrom }, idx) => {
              const items = productsIn(key);
              const indoor = items.find((p) => p.placement === "Indoor");
              const outdoor = items.find((p) => p.placement === "Outdoor");
              const cards = [indoor, outdoor].filter(Boolean) as Product[];
              if (cards.length === 0) return null;
              const imageProduct =
                items.find((p) => p.placement === imageFrom) || cards[0];
              const reverse = idx % 2 === 1;
              return (
                <section
                  key={key}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center"
                >
                  <div className={reverse ? "md:order-2" : ""}>
                    <div className="rounded-3xl overflow-hidden bg-muted aspect-[4/5]">
                      <img
                        src={imageProduct.image}
                        alt={`${title} rental in San Francisco`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <div className={reverse ? "md:order-1" : ""}>
                    <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
                      {title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-8">
                      {blurb}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
