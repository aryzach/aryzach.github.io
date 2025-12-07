import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Zap, Volume2, Droplet, Ruler } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";

const InstallPower = () => {
  useSEO(seoData.installPower);
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-semibold mb-6 text-foreground">
            Installation & Power Guide
          </h1>
          <p className="text-xl text-muted-foreground mb-12">
            Everything you need to know about setup, power requirements, and placement
          </p>

          <div className="space-y-12">
            {/* Power Section */}
            <section className="bg-card rounded-lg p-8 border border-border">
              <div className="flex items-start gap-4 mb-4">
                <Zap className="text-primary flex-shrink-0" size={32} />
                <div>
                  <h2 className="text-2xl font-semibold mb-3 text-card-foreground">Power Requirements</h2>
                  <div className="space-y-4 text-card-foreground">
                    <div>
                      <h3 className="font-semibold mb-2">Standard 120V</h3>
                      <p className="text-muted-foreground">
                        Plugs into any standard household outlet. No special wiring needed. Heats to full temperature in 30-40 minutes.
                        Uses approximately 1500W.
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg mt-4">
                      <p className="font-semibold text-foreground mb-2">💡 Cost per session</p>
                      <p className="text-muted-foreground">Based on average SF electricity rates ($0.30/kWh), a 1 hour session costs less than $1</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Space Section */}
            <section className="bg-card rounded-lg p-8 border border-border">
              <div className="flex items-start gap-4 mb-4">
                <Ruler className="text-primary flex-shrink-0" size={32} />
                <div>
                  <h2 className="text-2xl font-semibold mb-3 text-card-foreground">Space & Clearance</h2>
                  <div className="space-y-4 text-card-foreground">
                    <p className="text-muted-foreground">
                      <strong>Footprint:</strong> 48" × 42"
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Height:</strong> 6 feet 3 inches (75")
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Door clearance:</strong> Opens outward, needs 24" of swing space
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Noise Section */}
            <section className="bg-card rounded-lg p-8 border border-border">
              <div className="flex items-start gap-4 mb-4">
                <Volume2 className="text-primary flex-shrink-0" size={32} />
                <div>
                  <h2 className="text-2xl font-semibold mb-3 text-card-foreground">Noise Level</h2>
                  <p className="text-muted-foreground">
                    Our infrared saunas are whisper-quiet. Perfect for apartments and shared living spaces.
                  </p>
                </div>
              </div>
            </section>

            {/* Moisture Section */}
            <section className="bg-card rounded-lg p-8 border border-border">
              <div className="flex items-start gap-4 mb-4">
                <Droplet className="text-primary flex-shrink-0" size={32} />
                <div>
                  <h2 className="text-2xl font-semibold mb-3 text-card-foreground">Moisture & Safety</h2>
                  <div className="space-y-4 text-card-foreground">
                    <p className="text-muted-foreground">
                      Infrared saunas produce <strong>minimal moisture</strong> compared to traditional steam saunas. Safe for indoor use including:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      <li>Apartments and condos</li>
                      <li>Bedrooms and spare rooms</li>
                      <li>Garages and basements</li>
                      <li>Covered outdoor patios (must be protected from rain)</li>
                    </ul>
                    <p className="text-muted-foreground">
                      <strong>Landlord-friendly:</strong> No permanent modifications required. Simply plugs in and can be removed without a trace.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Setup Process */}
            <section className="bg-muted rounded-lg p-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Our Setup Process</h2>
              <ol className="space-y-3 text-foreground list-decimal list-inside">
                <li>We arrive at your scheduled time with all equipment</li>
                <li>Assess the placement location with you (usually takes 5 minutes)</li>
                <li>Assemble the sauna in approximately 45-60 minutes</li>
                <li>Test all systems and demonstrate operation</li>
                <li>Answer any questions and provide care instructions</li>
                <li>You're ready to enjoy your first session!</li>
              </ol>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InstallPower;
