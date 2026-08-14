import ContactLeadForm from "@/components/lead/ContactLeadForm";
import howItWorksVideoAsset from "@/assets/0812.mp4.asset.json";
import { assetUrl } from "@/lib/assetUrl";

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-cedar-section">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <div className="mb-8 rounded-lg overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto"
          >
            <source src={assetUrl(howItWorksVideoAsset)} type="video/mp4" />
          </video>
        </div>
        <ContactLeadForm
          formSource="homepage_how_it_works"
          formName="Homepage How It Works Contact"
        />
      </div>
    </section>
  );
};

export default HowItWorks;