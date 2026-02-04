import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";
import { Link } from "react-router-dom";
import { Check, Thermometer, Users, Zap, Clock, Shield } from "lucide-react";
import lindseyLivingRoom from "@/assets/lindsey-sauna-living-room.png";
import indoorInfraredImg from "@/assets/indoorinfrared.png";
import GoogleReviews from "@/components/GoogleReviews";

const IndoorInfraredLanding = () => {
  useSEO(seoData.indoorInfraredLanding);

  const pricing = [
    { duration: "1 month", price: "$549", priceDetail: "/mo", installFee: "$150 install" },
    { duration: "3 months", price: "$349", priceDetail: "/mo", installFee: "$150 install" },
    { duration: "6 months", price: "$249", priceDetail: "/mo", installFee: "Free install", popular: true },
    { duration: "12 months", price: "$199", priceDetail: "/mo", installFee: "Free install" },
  ];

  const benefits = [
    "Lower temperature (150°F) — comfortable for longer sessions",
    "Faster warmup time — ready in 15-20 minutes",
    "Perfect for apartments and bedrooms",
    "Deep tissue heat for muscle recovery",
    "Lower electricity cost than Finnish saunas",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-foreground px-4 py-2 rounded-full text-sm font-medium">
                <Thermometer className="w-4 h-4" />
                150°F Infrared Heat
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-tight">
                Indoor Infrared Sauna Rental
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Experience deep, therapeutic heat in the comfort of your home. Our infrared saunas plug into any standard 120V outlet — no special wiring required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link to="/reserve-your-sauna">Reserve Your Sauna</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#pricing">View Pricing</a>
                </Button>
              </div>
            </div>
            <div className="relative">
              <img
                src={lindseyLivingRoom}
                alt="Indoor infrared sauna installed in a living room"
                className="rounded-2xl shadow-xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-center mb-12">
            Why Choose Infrared?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3 bg-background p-4 rounded-lg">
                <Check className="w-5 h-5 text-[hsl(var(--color-accent))] mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Second Image Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <img
                src={indoorInfraredImg}
                alt="Indoor infrared sauna installed in a home"
                className="rounded-2xl shadow-xl w-full"
              />
            </div>
            <div className="order-1 md:order-2 space-y-6">
              <h2 className="font-display text-3xl md:text-4xl font-semibold">
                Perfect for Any Space
              </h2>
              <p className="text-muted-foreground text-lg">
                Our 2-person infrared saunas fit comfortably in bedrooms, home offices, garages, or spare rooms. We handle delivery, setup, and ongoing maintenance — you just enjoy the heat.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Users className="w-5 h-5 text-[hsl(var(--color-accent))]" />
                  <span>2-person capacity</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Zap className="w-5 h-5 text-[hsl(var(--color-accent))]" />
                  <span>Standard 120V</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Clock className="w-5 h-5 text-[hsl(var(--color-accent))]" />
                  <span>45-min setup</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Shield className="w-5 h-5 text-[hsl(var(--color-accent))]" />
                  <span>Full maintenance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-center mb-4">
            Indoor Infrared Pricing
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Flexible monthly plans with no long-term commitment required. Installation is free on 6+ month leases.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricing.map((plan, index) => (
              <div
                key={index}
                className={`bg-background rounded-xl p-6 shadow-sm border ${
                  plan.popular ? "border-[hsl(var(--color-accent))] ring-2 ring-[hsl(var(--color-accent))]/20" : "border-border"
                }`}
              >
                {plan.popular && (
                  <div className="text-xs font-medium text-[hsl(var(--color-accent))] mb-2">
                    MOST POPULAR
                  </div>
                )}
                <div className="text-sm text-muted-foreground mb-1">{plan.duration}</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-display font-semibold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.priceDetail}</span>
                </div>
                <div className="text-sm text-muted-foreground">{plan.installFee}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-center mb-12">
            What's Included
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              "Full delivery & setup",
              "Standard 120V power",
              "Pickup when you're done",
              "24/7 support",
              "2-person capacity",
              "Equipment included",
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 bg-muted/30 p-4 rounded-lg">
                <Check className="w-5 h-5 text-[hsl(var(--color-accent))] flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <GoogleReviews />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="font-display text-3xl md:text-4xl font-semibold">
            Ready to Start Your Sauna Ritual?
          </h2>
          <p className="text-muted-foreground text-lg">
            Reserve your indoor infrared sauna today. We'll handle delivery, setup, and ongoing support.
          </p>
          <Button size="lg" asChild>
            <Link to="/reserve-your-sauna">Reserve Your Sauna Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default IndoorInfraredLanding;
