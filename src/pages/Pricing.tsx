import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const pricingPlans = [
  {
    duration: "1 Month",
    price: "$499",
    features: ["Full setup included", "Standard 120V", "Pickup included", "24/7 support"],
  },
  {
    duration: "3 Months",
    price: "$249",
    priceDetail: "/month",
    popular: true,
    features: ["Full setup included", "Standard 120V", "Pickup included", "24/7 support"],
  },
  {
    duration: "6 Months",
    price: "$219",
    priceDetail: "/month",
    features: ["Full setup included", "Standard 120V", "Pickup included", "24/7 support"],
  },
  {
    duration: "12 Months",
    price: "$199",
    priceDetail: "/month",
    features: ["Full setup included", "Standard 120V", "Pickup included", "24/7 support", "Priority scheduling"],
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-6 text-foreground">
            Pricing & Options
          </h1>
          <p className="text-xl text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Choose the rental period that works best for you. All plans include delivery, professional setup, and pickup.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-card rounded-lg p-6 border-2 ${
                  plan.popular ? "border-primary shadow-lg" : "border-border"
                }`}
              >
                {plan.popular && (
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-2xl font-bold mt-4 mb-2 text-card-foreground">{plan.duration}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-card-foreground">{plan.price}</span>
                  {plan.priceDetail && <span className="text-muted-foreground">{plan.priceDetail}</span>}
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="text-primary flex-shrink-0 mt-1" size={16} />
                      <span className="text-sm text-card-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/contact">
                  <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    Reserve Now
                  </Button>
                </Link>
          </div>
          ))}
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
