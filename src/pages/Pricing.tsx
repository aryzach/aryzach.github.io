import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const saunaTypes = [
  {
    type: "Indoor Infrared",
    availability: "Available within a week",
    pricing: [
      { duration: "1 Month", price: "$449", priceDetail: "/month" },
      { duration: "3 Months", price: "$259", priceDetail: "/month", popular: true },
      { duration: "6 Months", price: "$229", priceDetail: "/month" },
      { duration: "12 Months", price: "$199", priceDetail: "/month" },
    ],
    features: ["Full setup included", "Standard 120V", "Pickup included", "24/7 support"],
  },
  {
    type: "Indoor Finnish Dry",
    availability: "Available within two weeks",
    pricing: [
      { duration: "1 Month", price: "$599", priceDetail: "/month" },
      { duration: "3 Months", price: "$359", priceDetail: "/month", popular: true },
      { duration: "6 Months", price: "$319", priceDetail: "/month" },
      { duration: "12 Months", price: "$299", priceDetail: "/month" },
    ],
    features: ["Full setup included", "Traditional heater & rocks", "Pickup included", "24/7 support"],
  },
  {
    type: "Outdoor Infrared",
    availability: "Available within a month",
    pricing: [
      { duration: "1 Month", price: "$499", priceDetail: "/month" },
      { duration: "3 Months", price: "$359", priceDetail: "/month", popular: true },
      { duration: "6 Months", price: "$329", priceDetail: "/month" },
      { duration: "12 Months", price: "$299", priceDetail: "/month" },
    ],
    features: ["Full setup included", "Weather-resistant", "Pickup included", "24/7 support"],
  },
  {
    type: "Outdoor Finnish Dry",
    availability: "Available in 2 months",
    pricing: [
      { duration: "1 Month", price: "$679", priceDetail: "/month" },
      { duration: "3 Months", price: "$399", priceDetail: "/month", popular: true },
      { duration: "6 Months", price: "$349", priceDetail: "/month" },
      { duration: "12 Months", price: "$319", priceDetail: "/month" },
    ],
    features: ["Full setup included", "Traditional heater & rocks", "Weather-resistant", "Pickup included", "24/7 support"],
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
            Choose the sauna type and rental period that works best for you. All plans include delivery, professional setup, and pickup.
          </p>

          {saunaTypes.map((sauna, saunaIndex) => (
            <div key={saunaIndex} className="mb-16">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {sauna.type}
                </h2>
                <p className="text-lg text-muted-foreground">{sauna.availability}</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                {sauna.pricing.map((plan, index) => (
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
                      {sauna.features.map((feature, idx) => (
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
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;