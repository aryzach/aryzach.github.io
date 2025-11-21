import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SaunaComparison from "@/components/SaunaComparison";
import InstallationRequirements from "@/components/InstallationRequirements";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import thermometerIcon from "@/assets/thermometer.svg";
import peopleIcon from "@/assets/2-people.svg";
import saunaIcon from "@/assets/sauna.svg";

const saunaData = [
  {
    type: "Finnish Dry Sauna",
    video: "/videos/pricing-finnish.mp4",
    variants: [
      {
        name: "Indoor Finnish Dry",
        availability: "Available within two weeks",
        pricing: [
          { duration: "1", price: "$599", priceDetail: "/mo" },
          { duration: "3", price: "$359", priceDetail: "/mo" },
          { duration: "6", price: "$319", priceDetail: "/mo" },
          { duration: "12", price: "$299", priceDetail: "/mo" },
        ],
      },
      {
        name: "Outdoor Finnish Dry",
        availability: "Available in 2 months",
        pricing: [
          { duration: "1", price: "$679", priceDetail: "/mo" },
          { duration: "3", price: "$399", priceDetail: "/mo" },
          { duration: "6", price: "$349", priceDetail: "/mo" },
          { duration: "12", price: "$319", priceDetail: "/mo" },
        ],
      },
    ],
  },
  {
    type: "Infrared Sauna",
    video: "/videos/pricing-infrared.mp4",
    variants: [
      {
        name: "Indoor Infrared",
        availability: "Available within a week",
        pricing: [
          { duration: "1", price: "$449", priceDetail: "/mo" },
          { duration: "3", price: "$259", priceDetail: "/mo" },
          { duration: "6", price: "$229", priceDetail: "/mo" },
          { duration: "12", price: "$199", priceDetail: "/mo" },
        ],
      },
      {
        name: "Outdoor Infrared",
        availability: "Available within a month",
        pricing: [
          { duration: "1", price: "$499", priceDetail: "/mo" },
          { duration: "3", price: "$359", priceDetail: "/mo" },
          { duration: "6", price: "$329", priceDetail: "/mo" },
          { duration: "12", price: "$299", priceDetail: "/mo" },
        ],
      },
    ],
  },
];

const commonFeatures = [
  "Standard 120V",
  "Pickup included",
  "24/7 support",
  "2 person capacity",
  "Equipment included",
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
          <p className="text-xl text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Choose the sauna type and rental period that works best for you.
          </p>

          {/* Sauna Comparison */}
          <SaunaComparison />

          {/* Common Features */}
          <div className="bg-card rounded-lg p-6 mb-12 max-w-2xl mx-auto border border-border">
            <h3 className="text-lg font-semibold mb-4 text-center text-card-foreground">All plans:</h3>
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
            {saunaData.map((sauna, saunaIndex) => (
              <div key={saunaIndex} className="bg-card rounded-lg overflow-hidden border border-border">
                {/* Video Header */}
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
                    <div className="p-6 w-full">
                      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
                        {sauna.type}
                      </h2>
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        <img src={thermometerIcon} alt="Temperature" className="w-5 h-5 brightness-0 invert" />
                        <span>
                          {sauna.type === "Finnish Dry Sauna" 
                            ? "170 - 194°F (77 - 90°C)" 
                            : "150°F (65°C)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Tables */}
                <div className="p-6 md:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {sauna.variants.map((variant, variantIndex) => (
                      <div key={variantIndex} className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold text-card-foreground mb-1">
                            {variant.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{variant.availability}</p>
                        </div>

                        {/* Pricing Table */}
                        <div className="mb-4 ml-8">
                          <div className="grid grid-cols-3 gap-12 mb-2 pb-2 border-b border-border">
                            <span className="text-sm font-semibold text-muted-foreground text-right">Months</span>
                            <span className="text-sm font-semibold text-muted-foreground col-span-2">Price</span>
                          </div>
                          <div className="space-y-2">
                            {variant.pricing.map((plan, idx) => (
                              <div
                                key={idx}
                                className="grid grid-cols-3 gap-12 items-center py-1"
                              >
                                <span className="font-semibold text-card-foreground text-right">
                                  {plan.duration}
                                </span>
                                <div className="col-span-2">
                                  <span className="text-xl font-semibold text-card-foreground">
                                    {plan.price}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {plan.priceDetail}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Link to="/reserve-your-sauna">
                          <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                            Check Availability
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery & Installation Info */}
          <div className="bg-card rounded-lg p-6 my-12 max-w-2xl mx-auto border border-border">
            <h3 className="text-lg font-semibold mb-4 text-center text-card-foreground">Delivery & Installation</h3>
            <div className="space-y-2 text-center">
              <p className="text-card-foreground">
                <span className="font-semibold">San Francisco:</span> $150 delivery & installation — waived with a 6+ month lease
              </p>
              <p className="text-card-foreground">
                <span className="font-semibold">Rest of the Bay Area:</span> $200 delivery & installation — waived with a 6+ month lease
              </p>
            </div>
          </div>

          {/* Installation Requirements */}
          <InstallationRequirements />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
