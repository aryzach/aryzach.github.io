import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

          {/* Sauna Grid */}
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">Select Option</h2>
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {saunaTypes.map((sauna, index) => (
              <Collapsible key={index}>
                <div className="bg-card rounded-lg overflow-hidden border border-border">
                  <CollapsibleTrigger className="w-full text-left hover:bg-muted/50 transition-colors">
                    <div className="relative">
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-[300px] md:h-[400px] object-cover"
                      >
                        <source src={sauna.video} type="video/mp4" />
                      </video>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                        <div className="p-3 md:p-4 w-full flex items-center justify-between">
                          <div>
                            <h3 className="text-base md:text-xl font-bold text-white mb-1">
                              {sauna.type}
                            </h3>
                            <p className="text-xs md:text-sm text-white/90">{sauna.availability}</p>
                          </div>
                          <ChevronDown className="text-white h-5 w-5 md:h-6 md:w-6 transition-transform flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="p-4 md:p-6">
                      {/* Pricing Table */}
                      <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                        {sauna.pricing.map((plan, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between py-1 md:py-2"
                          >
                            <div className="flex items-center gap-2 md:gap-3">
                              <span className="font-semibold text-card-foreground text-sm md:text-base min-w-[80px] md:min-w-[100px]">
                                {plan.duration}
                              </span>
                              {plan.popular && (
                                <span className="bg-primary text-primary-foreground text-xs font-semibold px-1.5 md:px-2 py-0.5 rounded-full">
                                  POPULAR
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-xl md:text-2xl font-bold text-card-foreground">
                                {plan.price}
                              </span>
                              <span className="text-xs md:text-sm text-muted-foreground">
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
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
