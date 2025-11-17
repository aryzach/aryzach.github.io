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
      { duration: "1", price: "$449", priceDetail: "/mo" },
      { duration: "3", price: "$259", priceDetail: "/mo", popular: true },
      { duration: "6", price: "$229", priceDetail: "/mo" },
      { duration: "12", price: "$199", priceDetail: "/mo" },
    ],
  },
  {
    type: "Indoor Finnish Dry",
    availability: "Available within two weeks",
    video: "/videos/indoor-finnish.mp4",
    pricing: [
      { duration: "1", price: "$599", priceDetail: "/mo" },
      { duration: "3", price: "$359", priceDetail: "/mo", popular: true },
      { duration: "6", price: "$319", priceDetail: "/mo" },
      { duration: "12", price: "$299", priceDetail: "/mo" },
    ],
  },
  {
    type: "Outdoor Infrared",
    availability: "Available within a month",
    video: "/videos/outdoor-infrared.mp4",
    pricing: [
      { duration: "1", price: "$499", priceDetail: "/mo" },
      { duration: "3", price: "$359", priceDetail: "/mo", popular: true },
      { duration: "6", price: "$329", priceDetail: "/mo" },
      { duration: "12", price: "$299", priceDetail: "/mo" },
    ],
  },
  {
    type: "Outdoor Finnish Dry",
    availability: "Available in 2 months",
    video: "/videos/outdoor-finnish.mp4",
    pricing: [
      { duration: "1", price: "$679", priceDetail: "/mo" },
      { duration: "3", price: "$399", priceDetail: "/mo", popular: true },
      { duration: "6", price: "$349", priceDetail: "/mo" },
      { duration: "12", price: "$319", priceDetail: "/mo" },
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
          <h1 className="text-4xl md:text-6xl font-semibold text-center mb-6 text-foreground">
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

          {/* Sauna Grid */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {saunaTypes.map((sauna, index) => (
              <div key={index} className="bg-card rounded-lg overflow-hidden border border-border">
                <div className="relative">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-[300px] md:h-[600px] object-cover"
                  >
                    <source src={sauna.video} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="p-3 md:p-4 w-full">
                      <h3 className="text-base md:text-xl font-semibold text-white mb-1">
                        {sauna.type}
                      </h3>
                      <p className="text-xs md:text-sm text-white/90">{sauna.availability}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 md:p-6">
                  {/* Pricing Table */}
                  <div className="mb-3 md:mb-4">
                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-border">
                      <span className="text-xs md:text-sm font-semibold text-muted-foreground">Months</span>
                      <span className="text-xs md:text-sm font-semibold text-muted-foreground">Price</span>
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      {sauna.pricing.map((plan, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-1"
                        >
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <span className="font-semibold text-card-foreground text-sm md:text-base w-6 md:w-8">
                              {plan.duration}
                            </span>
                            {plan.popular && (
                              <span className="bg-primary text-primary-foreground text-[10px] md:text-xs font-semibold px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap">
                                POPULAR
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-base md:text-xl font-semibold text-card-foreground">
                              {plan.price}
                            </span>
                            <span className="text-[10px] md:text-xs text-muted-foreground">
                              {plan.priceDetail}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link to="/reserve-your-sauna">
                    <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                      Reserve Now
                    </Button>
                  </Link>
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
