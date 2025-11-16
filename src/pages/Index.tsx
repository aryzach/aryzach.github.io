import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Packages from "@/components/Packages";
import Gallery from "@/components/Gallery";
import SocialProof from "@/components/SocialProof";
import ServiceArea from "@/components/ServiceArea";
import FAQ from "@/components/FAQ";
import ReserveCTA from "@/components/ReserveCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Packages />
        <Gallery />
        <SocialProof />
        <ServiceArea />
        <FAQ />
        <ReserveCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
