import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const saunaTypes = [
  {
    type: "Indoor Infrared",
    availability: "Available within a week",
    video: "/videos/indoor-infrared.mp4",
    pricing: [
      { duration: "1 Month", price: "$449", priceDetail: "/month" },
      { duration: "3 Months", price: "$259", priceDetail: "/month", popular: true },
      { duration: "6 Months", price: "$229", priceDetail: "/month" },
      { duration: "12 Months", price: "$199", priceDetail: "/month" },
    ],
  },
  {
    type: "Indoor Finnish Dry",
    availability: "Available within two weeks",
    video: "/videos/indoor-finnish.mp4",
    pricing: [
      { duration: "1 Month", price: "$599", priceDetail: "/month" },
      { duration: "3 Months", price: "$359", priceDetail: "/month", popular: true },
      { duration: "6 Months", price: "$319", priceDetail: "/month" },
      { duration: "12 Months", price: "$299", priceDetail: "/month" },
    ],
  },
  {
    type: "Outdoor Infrared",
    availability: "Available within a month",
    video: "/videos/outdoor-infrared.mp4",
    pricing: [
      { duration: "1 Month", price: "$499", priceDetail: "/month" },
      { duration: "3 Months", price: "$359", priceDetail: "/month", popular: true },
      { duration: "6 Months", price: "$329", priceDetail: "/month" },
      { duration: "12 Months", price: "$299", priceDetail: "/month" },
    ],
  },
  {
    type: "Outdoor Finnish Dry",
    availability: "Available in 2 months",
    video: "/videos/outdoor-finnish.mp4",
    pricing: [
      { duration: "1 Month", price: "$679", priceDetail: "/month" },
      { duration: "3 Months", price: "$399", priceDetail: "/month", popular: true },
      { duration: "6 Months", price: "$349", priceDetail: "/month" },
      { duration: "12 Months", price: "$319", priceDetail: "/month" },
    ],
  },
];

const commonFeatures = [
  "Full setup included",
  "Standard 120V",
  "Pickup included",
  "24/7 support",
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
          <p className="text-xl text-center text-muted-foreground mb-8 max-w-3xl mx-auto">
            Choose the sauna type and rental period that works best for you.
          </p>

          {/* Common Features */}
          <div className="bg-card rounded-lg p-6 mb-12 max-w-2xl mx-auto border border-border">
            <h3 className="text-lg font-semibold mb-4 text-center text-card-foreground">All plans include:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {commonFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="text-primary flex-shrink-0" size={20} />
                  <span className="text-card-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sauna Sections */}
          <div className="space-y-16">
            {saunaTypes.map((sauna, index) => (
              <div
                key={index}
                className="bg-card rounded-lg overflow-hidden border border-border"
              >
                {/* Mobile Layout */}
                <div className="block lg:hidden">
                  <div className="p-6 pb-4">
                    <h2 className="text-3xl font-bold text-card-foreground mb-2">
                      {sauna.type}
                    </h2>
                    <p className="text-muted-foreground mb-4">{sauna.availability}</p>
                  </div>
                  
                  {/* Full Bleed Video on Mobile */}
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full"
                  >
                    <source src={sauna.video} type="video/mp4" />
                  </video>

                  <div className="p-6">
                    {/* Pricing Table */}
                    <div className="space-y-3 mb-6">
                      {sauna.pricing.map((plan, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-card-foreground min-w-[100px]">
                              {plan.duration}
                            </span>
                            {plan.popular && (
                              <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                                POPULAR
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-2xl font-bold text-card-foreground">
                              {plan.price}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {plan.priceDetail}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Link to="/reserve-your-sauna">
                      <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                        Reserve Now
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:grid lg:grid-cols-2">
                  {/* Left: Video */}
                  <div className="relative">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    >
                      <source src={sauna.video} type="video/mp4" />
                    </video>
                  </div>

                  {/* Right: Content */}
                  <div className="p-8 flex flex-col">
                    <h2 className="text-4xl font-bold text-card-foreground mb-2">
                      {sauna.type}
                    </h2>
                    <p className="text-lg text-muted-foreground mb-6">
                      {sauna.availability}
                    </p>

                    {/* Pricing Table */}
                    <div className="space-y-3 mb-6">
                      {sauna.pricing.map((plan, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-card-foreground min-w-[100px]">
                              {plan.duration}
                            </span>
                            {plan.popular && (
                              <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                                POPULAR
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-2xl font-bold text-card-foreground">
                              {plan.price}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {plan.priceDetail}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Link to="/reserve-your-sauna">
                      <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                        Reserve Now
                      </Button>
                    </Link>
                  </div>
                </div>
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
