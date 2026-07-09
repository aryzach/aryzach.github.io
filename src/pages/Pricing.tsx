import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { useAvailability } from "@/hooks/useAvailability";
import { categoryHero, productsIn, startingPrice, type Category } from "@/lib/pricingCatalog";
import AvailabilityLine from "@/components/pricing/AvailabilityLine";

const CATEGORIES: { key: Category; title: string }[] = [
  { key: "traditional", title: "Traditional Sauna" },
  { key: "infrared", title: "Infrared Sauna" },
];

const Pricing = () => {
  useSEO({
    title: "Options & Pricing — SF Sauna Rental",
    description:
      "Choose which sauna type you'd like. Pricing, availability, and reservation details are available on each product page.",
  });

  const { getStatusForIds } = useAvailability();

  const placementStatus = (category: Category, placement: "Indoor" | "Outdoor") => {
    const ids = productsIn(category)
      .filter((p) => p.placement === placement)
      .map((p) => p.saunaTypeId);
    return getStatusForIds(ids);
  };

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
              Choose which sauna type you'd like. Pricing, availability, and reservation details are available on each product page.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {CATEGORIES.map(({ key, title }) => {
              const indoorStatus = placementStatus(key, "Indoor");
              const outdoorStatus = placementStatus(key, "Outdoor");
              const price = startingPrice(key);
              const hero = categoryHero[key];
              return (
                <Link
                  key={key}
                  to={`/pricing/${key}`}
                  className="group block rounded-3xl overflow-hidden bg-card border border-border hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-muted">
                    <img
                      src={hero.image}
                      alt={`${title} rental in San Francisco`}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6 md:p-8">
                    <h2 className="text-2xl md:text-3xl font-semibold text-card-foreground mb-2">
                      {title}
                    </h2>
                    <p className="text-muted-foreground text-base leading-relaxed mb-5">
                      {hero.blurb}
                    </p>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-sm text-muted-foreground">From</span>
                      <span className="text-2xl font-semibold text-card-foreground">${price}</span>
                      <span className="text-sm text-muted-foreground">/ month</span>
                    </div>
                    <div className="mb-6 space-y-1.5">
                      <AvailabilityLine status={indoorStatus} label="Indoor" />
                      <AvailabilityLine status={outdoorStatus} label="Outdoor" />
                    </div>
                    <Button className="w-full" size="lg">
                      View Pricing & Reserve
                    </Button>
                  </div>
                </Link>
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