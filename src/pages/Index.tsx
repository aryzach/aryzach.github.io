import { useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import HealthBenefits from "@/components/HealthBenefits";
import Packages from "@/components/Packages";
import Gallery from "@/components/Gallery";
import SocialProof from "@/components/SocialProof";
import ServiceArea from "@/components/ServiceArea";
import FAQ from "@/components/FAQ";
import ReserveCTA from "@/components/ReserveCTA";
import GoogleReviews from "@/components/GoogleReviews";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";

const Index = () => {
  useSEO(seoData.home);
  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["LocalBusiness", "HealthAndBeautyBusiness"],
          "@id": "https://www.sfsaunarental.com/#business",
          "name": "SF Sauna",
          "url": "https://www.sfsaunarental.com/",
          "image": "https://www.sfsaunarental.com/assets/gallery-3-Cj0B_JUQ.jpg",
          "telephone": "+1-415-489-0261",
          "priceRange": "$$",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "1618 McAllister St",
            "addressLocality": "San Francisco",
            "addressRegion": "CA",
            "postalCode": "94115",
            "addressCountry": "US"
          },
          "areaServed": [
            { "@type": "City", "name": "San Francisco" },
            { "@type": "City", "name": "Oakland" },
            { "@type": "AdministrativeArea", "name": "Marin County" },
            { "@type": "AdministrativeArea", "name": "San Mateo County" }
          ]
        },
        {
          "@type": "WebSite",
          "@id": "https://www.sfsaunarental.com/#website",
          "url": "https://www.sfsaunarental.com/",
          "name": "SF Sauna",
          "publisher": {
            "@id": "https://www.sfsaunarental.com/#business"
          }
        },
        {
          "@type": "FAQPage",
          "@id": "https://www.sfsaunarental.com/#homepage-faq",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What's the difference between infrared and Finnish dry saunas?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Infrared heats your body directly for a gentler sweat at 150°F. Finnish dry saunas heat the air with a traditional heater and rocks, running 170–200°F for a more classic feel."
              }
            },
            {
              "@type": "Question",
              "name": "What power do they need? Will this overload my apartment?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "All units use standard 120V household outlets, same load class as a hair dryer. No special wiring, panel upgrades, or electrician."
              }
            },
            {
              "@type": "Question",
              "name": "How much space do I need?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Indoor: 48\" W × 42\" D × 76\" H. Outdoor: 58\" W × 46\" D × 85\" H."
              }
            },
            {
              "@type": "Question",
              "name": "Can these go indoors or outdoors?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. We have dedicated models for each."
              }
            },
            {
              "@type": "Question",
              "name": "Will a sauna overheat my apartment?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No. They're heavily insulated, so heat stays inside the cabin with negligible spillover."
              }
            },
            {
              "@type": "Question",
              "name": "How long does setup take?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "About 1–2 hours. We position it, plug it in, test it, and walk you through everything."
              }
            },
            {
              "@type": "Question",
              "name": "How long does it take to heat up?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Infrared reaches ~150°F in ~30 minutes. Finnish dry saunas hit 170–194°F in 20–60 minutes depending on the heaters you choose."
              }
            },
            {
              "@type": "Question",
              "name": "Do I need to leave it running?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No. Just turn it on 20–60 minutes before using. Most people heat it once a day for about an hour."
              }
            },
            {
              "@type": "Question",
              "name": "Is this landlord-friendly?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. Saunas are free-standing appliances that plug into a normal outlet. No drilling, venting, hardwiring, or modifications. Almost no one needs permission, but follow your lease rules."
              }
            },
            {
              "@type": "Question",
              "name": "Will this damage my floors?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No. The base stays cool enough for wood, and humidity stays inside the cabin. Just avoid spilling water outside the unit."
              }
            },
            {
              "@type": "Question",
              "name": "What if I move during my rental?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "This is part of the service, we move the sauna to your new place."
              }
            },
            {
              "@type": "Question",
              "name": "What happens after my initial lease term?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Your plan switches to month-to-month. Keep it as long as you want; when you're done, we pick it up within 30 days."
              }
            },
            {
              "@type": "Question",
              "name": "How much does it add to my electric bill?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Usually $0.50–$1.50 per session. SF electricity is ~$0.30/kWh, and sessions run 40–90 minutes total."
              }
            },
            {
              "@type": "Question",
              "name": "Can I buy out the sauna later?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. After your lease term, you can purchase the unit with 30% of your rental payments credited. Infrared pricing follows retail (https://goldendesigninc.com/collections/maxxus-saunas). Finnish saunas: Indoor $6,499, Outdoor $8,499 (+$459 if you have the extra heater)."
              }
            },
            {
              "@type": "Question",
              "name": "Who handles maintenance?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We handle all normal maintenance, repairs, parts, and troubleshooting for the sauna, no charge. If something fails under normal use, we fix it or replace the unit."
              }
            }
          ]
        }
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(jsonLd);
    script.id = 'homepage-jsonld';
    
    // Remove existing if present
    const existing = document.getElementById('homepage-jsonld');
    if (existing) existing.remove();
    
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('homepage-jsonld');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Gallery />
        <GoogleReviews />
        <HowItWorks />
        <HealthBenefits />
        <Packages />
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
