import { Link, useParams, Navigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { useAvailability } from "@/hooks/useAvailability";
import { productsIn, type Category, type Product } from "@/lib/pricingCatalog";
import AvailabilityLine from "@/components/pricing/AvailabilityLine";

const CATEGORY_META: Record<Category, { title: string; subtitle: string }> = {
  traditional: {
    title: "Traditional Sauna",
    subtitle: "Authentic löyly with real stones powered from a standard home outlet. Choose the placement that fits your home.",
  },
  infrared: {
    title: "Infrared Sauna",
    subtitle: "Gentle, low-EMF radiant heat. Choose indoor or outdoor.",
  },
};

const ProductCard = ({ product, statusEl }: { product: Product; statusEl: React.ReactNode }) => {
  const startingAt = Math.min(...product.tiers.map((t) => t.monthly));
  return (
    <Link
      to={`/pricing/${product.category}/${product.slug}`}
      className="group block rounded-3xl overflow-hidden bg-card border border-border hover:shadow-xl transition-shadow duration-300"
    >
      <div className="aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={`${product.name} rental`}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          loading="lazy"
        />
      </div>
      <div className="p-6 md:p-7">
        <h3 className="text-xl md:text-2xl font-semibold text-card-foreground mb-2">
          {product.placement}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {product.shortDescription}
        </p>
        <div className="mb-3">{statusEl}</div>
        <div className="flex items-baseline gap-1 mb-5">
          <span className="text-sm text-muted-foreground">Starting at</span>
          <span className="text-xl font-semibold text-card-foreground ml-1">${startingAt}</span>
          <span className="text-sm text-muted-foreground">/ month</span>
        </div>
        <Button className="w-full">View Pricing & Reserve</Button>
      </div>
    </Link>
  );
};

const PricingCategory = () => {
  const { category } = useParams<{ category: string }>();
  const cat = category as Category;

  if (cat !== "traditional" && cat !== "infrared") {
    return <Navigate to="/pricing" replace />;
  }

  const meta = CATEGORY_META[cat];
  useSEO({
    title: `${meta.title} Rental — SF Sauna Rental`,
    description: meta.subtitle,
  });

  const { getStatus } = useAvailability();
  const all = productsIn(cat);

  const latest = all.filter((p) => !p.slug.startsWith("original"));
  const original = all.filter((p) => p.slug.startsWith("original"));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow pt-24 md:pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="mb-10">
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
              ← All options
            </Link>
          </div>

          <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground mb-5">
              {meta.title}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              {meta.subtitle}
            </p>
          </div>

          <section className="mb-16 md:mb-24">
            <div className={`grid grid-cols-1 ${latest.length > 1 ? "md:grid-cols-2" : "md:grid-cols-1 max-w-xl mx-auto"} gap-6 md:gap-8`}>
              {latest.map((p) => (
                <ProductCard
                  key={p.slug}
                  product={p}
                  statusEl={<AvailabilityLine status={getStatus(p.saunaTypeId)} />}
                />
              ))}
            </div>
          </section>

          {original.length > 0 && (
            <section>
              <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
                <h2 className="text-2xl md:text-4xl font-semibold text-foreground mb-4">
                  Original Collection
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Earlier-generation traditional saunas converted from infrared models. They provide the same authentic traditional sauna experience at a lower monthly price.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {original.map((p) => (
                  <ProductCard
                    key={p.slug}
                    product={p}
                    statusEl={<AvailabilityLine status={getStatus(p.saunaTypeId)} />}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PricingCategory;