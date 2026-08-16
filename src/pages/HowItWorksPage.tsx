import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HowItWorksSection from "@/components/HowItWorksSection";
import ContactLeadForm from "@/components/lead/ContactLeadForm";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";

const HowItWorksPage = () => {
  useSEO(seoData.howItWorks);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-20 md:pt-24">
        <HowItWorksSection />

        <section className="container mx-auto px-4 py-16">
          <ContactLeadForm
            formSource="how_it_works_page"
            formName="How It Works Page Contact"
          />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorksPage;
