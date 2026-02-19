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
          "@type": "WebSite",
          "@id": "https://www.sfsaunarental.com/#website",
          "url": "https://www.sfsaunarental.com/",
          "name": "SF Sauna",
          "publisher": {
            "@id": "https://www.sfsaunarental.com/#business"
          }
        },
        {
          "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
          "@id": "https://www.sfsaunarental.com/#business",
          "name": "SF Sauna Rental",
          "url": "https://www.sfsaunarental.com/",
          "image": "https://www.sfsaunarental.com/assets/gallery-3-Cj0B_JUQ.jpg",
          "telephone": "+1-415-489-0261",
          "priceRange": "$$",
          "description": "Monthly sauna rentals for SF Bay Area homes and backyards. Dry and infrared saunas on 120V power with fast delivery, setup, and ongoing support.",
          "foundingDate": "2025-12-12",
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
          ],
          "sameAs": [
            "https://sfsaunarental.com/"
          ]
        },
        {
          "@type": "Service",
          "@id": "https://www.sfsaunarental.com/#indoor-infrared-rental",
          "serviceType": "Indoor infrared sauna rental",
          "provider": { "@id": "https://www.sfsaunarental.com/#business" },
          "areaServed": [
            { "@type": "City", "name": "San Francisco" },
            { "@type": "City", "name": "Oakland" }
          ],
          "offers": {
            "@type": "Offer",
            "priceCurrency": "USD",
            "description": "Indoor infrared sauna rental plans",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "priceCurrency": "USD",
              "minPrice": 199,
              "maxPrice": 679,
              "unitCode": "MON"
            }
          }
        },
        {
          "@type": "Service",
          "@id": "https://www.sfsaunarental.com/#outdoor-infrared-rental",
          "serviceType": "Outdoor infrared sauna rental",
          "provider": { "@id": "https://www.sfsaunarental.com/#business" },
          "areaServed": [
            { "@type": "City", "name": "San Francisco" },
            { "@type": "City", "name": "Oakland" }
          ],
          "offers": {
            "@type": "Offer",
            "priceCurrency": "USD",
            "description": "Outdoor infrared sauna rental plans",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "priceCurrency": "USD",
              "minPrice": 259,
              "maxPrice": 679,
              "unitCode": "MON"
            }
          }
        },
        {
          "@type": "Service",
           "@id": "https://www.sfsaunarental.com/#indoor-steam-rental",
           "serviceType": "Indoor steam sauna rental",
          "provider": { "@id": "https://www.sfsaunarental.com/#business" },
          "areaServed": [
            { "@type": "City", "name": "San Francisco" },
            { "@type": "City", "name": "Oakland" }
          ],
          "offers": {
            "@type": "Offer",
            "priceCurrency": "USD",
            "description": "Indoor steam sauna rental plans",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "priceCurrency": "USD",
              "minPrice": 299,
              "maxPrice": 679,
              "unitCode": "MON"
            }
          }
        },
        {
          "@type": "Service",
           "@id": "https://www.sfsaunarental.com/#outdoor-steam-rental",
           "serviceType": "Outdoor steam sauna rental",
          "provider": { "@id": "https://www.sfsaunarental.com/#business" },
          "areaServed": [
            { "@type": "City", "name": "San Francisco" },
            { "@type": "City", "name": "Oakland" }
          ],
          "offers": {
            "@type": "Offer",
            "priceCurrency": "USD",
            "description": "Outdoor steam sauna rental plans",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "priceCurrency": "USD",
              "minPrice": 299,
              "maxPrice": 679,
              "unitCode": "MON"
            }
          }
        },
        {
          "@type": "FAQPage",
          "@id": "https://www.sfsaunarental.com/#homepage-faq",
          "mainEntity": [
            {
              "@type": "Question",
               "name": "What's the difference between infrared and steam saunas?",
               "acceptedAnswer": {
                 "@type": "Answer",
                 "text": "Infrared heats your body directly for a gentler sweat at 150°F. Steam saunas heat the air with a traditional heater and rocks, running 160–194°F for a more classic feel."
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
                "text": "Infrared reaches ~150°F in ~30-40 minutes. Steam saunas hit 160–194°F in 20–60 minutes depending on the heaters you choose."
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
                "text": "Usually $0.50–$1.50 per session. SF electricity is about $0.30/kWh, and sessions run 40–90 minutes total."
              }
            },
            {
              "@type": "Question",
              "name": "Can I buy out the sauna later?",
              "acceptedAnswer": {
                "@type": "Answer",
                 "text": "Yes. After your lease term, you can purchase the unit with 30% of your rental payments credited. Infrared pricing follows retail listings; steam saunas are Indoor $6,499 and Outdoor $8,499 (+$459 if you have the extra heater)."
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
