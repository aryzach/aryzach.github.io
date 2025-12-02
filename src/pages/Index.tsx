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

const Index = () => {
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
              "name": "What's the difference between an infrared sauna and a dry Finnish sauna?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Infrared saunas heat your body directly using infrared panels and offer a gentler, deeper warmth at lower air temperatures. Finnish saunas use a traditional heater and hot rocks, warming the air to higher temperatures for a classic dry-sauna experience."
              }
            },
            {
              "@type": "Question",
              "name": "What kind of power does it need?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our saunas run on standard 120V household power—just plug into any regular outlet. No special wiring required."
              }
            },
            {
              "@type": "Question",
              "name": "How much space do I need?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our indoor saunas are 48\" W × 42\" D × 76\" H, and our outdoor saunas are 58\" W × 46\" D × 85\" H."
              }
            },
            {
              "@type": "Question",
              "name": "How long does setup take?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our team completes the entire setup in about 1–2 hours. We'll position it, connect it, and show you how to use it."
              }
            },
            {
              "@type": "Question",
              "name": "Can I use it indoors and outdoors?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. We have indoor and outdoor saunas available."
              }
            },
            {
              "@type": "Question",
              "name": "Will a sauna overheat my apartment?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No. They're heavily insulated, so heat stays inside the cabin. There's no noticeable heat spillage into your space."
              }
            },
            {
              "@type": "Question",
              "name": "Do I need to leave it running all day?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No. People just turn it on 20–60 minutes before using it. Most run it once a day for about an hour, then switch it off."
              }
            },
            {
              "@type": "Question",
              "name": "How long does the sauna take to heat up?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our infrared saunas heat to about 150°F in 30 minutes. Our Finnish dry saunas reach roughly 170–194°F in 20–60 minutes, depending on which heaters you choose."
              }
            },
            {
              "@type": "Question",
              "name": "Is this landlord-friendly?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. The sauna is a free-standing unit that plugs into a normal household outlet and doesn't require any building or electrical changes. Nothing is mounted, drilled, vented, or hardwired. It sits on the floor like a large appliance, and most customers in SF live in apartments. The sauna leaves no marks when removed, and we handle the entire installation and pickup process."
              }
            },
            {
              "@type": "Question",
              "name": "Do I need to ask my landlord?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "In most cases, no. There's nothing permanent about the installation: no modifications, no wiring, no plumbing, no holes in walls, and nothing attached to the building. The sauna sits in the space just like furniture or a Peloton. That said, every lease is different, so you should follow whatever your lease says about appliances or heat-producing equipment."
              }
            },
            {
              "@type": "Question",
              "name": "Will this overload my electrical panel?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No. The sauna uses a standard 120V outlet on a normal household circuit and draws about the same load as a hair dryer or space heater. You don't need any upgrades or an electrician visit."
              }
            },
            {
              "@type": "Question",
              "name": "What if I move during my rental?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We simply move the sauna to your new place. Most customers are renters, so moving the sauna is common and it's part of the service."
              }
            },
            {
              "@type": "Question",
              "name": "What happens after the initial lease period?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "After your lease ends, your plan switches to simple month-to-month. You keep the sauna as long as you'd like. If you want to end your rental, just let us know and we'll schedule pickup and remove the sauna within 30 days."
              }
            },
            {
              "@type": "Question",
              "name": "How does this affect my electric bill?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Sauna sessions typically cost about $0.50–$1.50 in electricity. SF rates are around $0.30 per kWh, our units draw roughly 1.5–3 kW, and total running time for each sauna session is usually 40–90 minutes including heating time and use time."
              }
            },
            {
              "@type": "Question",
              "name": "Can I buy out the sauna at the end of my lease?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. Once your initial lease term is up, you can buy out the unit you've been using. We credit 30% of your lease payments toward the purchase. Infrared models are sold at the current retail prices listed on the manufacturer site at https://goldendesigninc.com/collections/maxxus-saunas. Finnish dry saunas built in-house are currently priced at Indoor $6,499 and Outdoor $8,499, with an additional $459 if your unit includes the extra heater."
              }
            },
            {
              "@type": "Question",
              "name": "Can a sauna damage my wood floor?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Not in normal use. Dry and infrared saunas shed moisture fast and are sealed tightly so humidity stays inside the cabin. The base stays cool relative to what wood can handle, so floors don't warp or discolor. As long as you're not spilling water outside the unit, your flooring is safe."
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
