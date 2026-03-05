import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Wrench, Zap, ArrowDownToLine, BookOpen } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";

const heroImage = "/images/installation-IMG_9652.png";
const galleryImage1 = "/images/installation-IMG_7239.png";
const galleryImage2 = "/images/installation-IMG_9650.png";
const galleryImage3 = "/images/installation-IMG_9647.png";

const PrefabSaunaInstallation = () => {
  useSEO(seoData.prefabSaunaInstallation);

  useEffect(() => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["LocalBusiness", "HomeAndConstructionBusiness"],
          "@id": "https://www.sfsaunarental.com/#business",
          "name": "SF Sauna",
          "url": "https://www.sfsaunarental.com/",
          "image": "https://www.sfsaunarental.com/images/installation-IMG_9652.png",
          "telephone": "+1-415-489-0261",
          "priceRange": "$$",
          "description": "Professional sauna installation services in the San Francisco Bay Area. We assemble and wire prefab, barrel, infrared, and custom saunas.",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "1618 McAllister St",
            "addressLocality": "San Francisco",
            "addressRegion": "CA",
            "postalCode": "94115",
            "addressCountry": "US"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 37.7749,
            "longitude": -122.4389
          },
          "areaServed": [
            { "@type": "City", "name": "San Francisco" },
            { "@type": "City", "name": "Oakland" },
            { "@type": "City", "name": "Berkeley" },
            { "@type": "AdministrativeArea", "name": "Marin County" },
            { "@type": "City", "name": "Palo Alto" },
            { "@type": "City", "name": "Mountain View" },
            { "@type": "AdministrativeArea", "name": "San Mateo County" }
          ],
          "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "opens": "09:00",
            "closes": "18:00"
          },
          "sameAs": ["https://sfsaunarental.com/"]
        },
        {
          "@type": "Service",
          "@id": "https://www.sfsaunarental.com/pre-fab-sauna-installation/#service",
          "name": "Professional Sauna Installation",
          "serviceType": "Sauna Installation Service",
          "provider": { "@id": "https://www.sfsaunarental.com/#business" },
          "description": "Full-service sauna installation including assembly, electrical hookup, 240V wiring, placement, leveling, and post-install walkthrough for prefab, barrel, infrared, and custom saunas.",
          "areaServed": [
            { "@type": "City", "name": "San Francisco" },
            { "@type": "City", "name": "Oakland" },
            { "@type": "City", "name": "Berkeley" },
            { "@type": "AdministrativeArea", "name": "Marin County" },
            { "@type": "City", "name": "Palo Alto" },
            { "@type": "City", "name": "Mountain View" },
            { "@type": "AdministrativeArea", "name": "San Mateo County" }
          ],
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Sauna Installation Services",
            "itemListElement": [
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Prefab Indoor Sauna Installation" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Barrel Sauna Assembly" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Infrared Sauna Installation" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Custom Sauna Build-Out" } }
            ]
          }
        },
        {
          "@type": "WebPage",
          "@id": "https://www.sfsaunarental.com/pre-fab-sauna-installation/#webpage",
          "url": "https://www.sfsaunarental.com/pre-fab-sauna-installation",
          "name": "Prefab Sauna Installation Services | Bay Area | SF Sauna",
          "description": "SF Sauna offers professional sauna installation across San Francisco and the Bay Area. We assemble and wire prefab, barrel, infrared, and custom saunas.",
          "isPartOf": { "@id": "https://www.sfsaunarental.com/#website" },
          "about": { "@id": "https://www.sfsaunarental.com/pre-fab-sauna-installation/#service" },
          "primaryImageOfPage": {
            "@type": "ImageObject",
            "url": "https://www.sfsaunarental.com/images/installation-IMG_9652.png"
          }
        },
        {
          "@type": "BreadcrumbList",
          "@id": "https://www.sfsaunarental.com/pre-fab-sauna-installation/#breadcrumb",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.sfsaunarental.com/" },
            { "@type": "ListItem", "position": 2, "name": "Sauna Installation", "item": "https://www.sfsaunarental.com/pre-fab-sauna-installation" }
          ]
        },
        {
          "@type": "ImageGallery",
          "@id": "https://www.sfsaunarental.com/pre-fab-sauna-installation/#gallery",
          "name": "Recent Sauna Installations",
          "image": [
            {
              "@type": "ImageObject",
              "url": "https://www.sfsaunarental.com/images/installation-IMG_9652.png",
              "name": "Completed custom sauna installation in San Francisco home",
              "caption": "Completed installation"
            },
            {
              "@type": "ImageObject",
              "url": "https://www.sfsaunarental.com/images/installation-IMG_7239.png",
              "name": "Sauna roof installation in San Francisco backyard",
              "caption": "Roof assembly in progress"
            },
            {
              "@type": "ImageObject",
              "url": "https://www.sfsaunarental.com/images/installation-IMG_9650.png",
              "name": "Prefab sauna being assembled on Bay Area patio",
              "caption": "Outdoor sauna assembly"
            },
            {
              "@type": "ImageObject",
              "url": "https://www.sfsaunarental.com/images/installation-IMG_9647.png",
              "name": "Interior cedar wall detail of sauna installation",
              "caption": "Interior cedar finishing"
            }
          ]
        }
      ]
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(jsonLd);
    script.id = "installation-jsonld";

    const existing = document.getElementById("installation-jsonld");
    if (existing) existing.remove();

    document.head.appendChild(script);
    return () => {
      const el = document.getElementById("installation-jsonld");
      if (el) el.remove();
    };
  }, []);

  const services = [
    {
      title: "Prefab Indoor Saunas",
      description: "We assemble modular, pre-built sauna kits inside your home — bedrooms, garages, basements, or spare rooms."
    },
    {
      title: "Barrel Saunas",
      description: "Full assembly and placement of barrel saunas for backyards, patios, and decks across the Bay Area."
    },
    {
      title: "Infrared Saunas",
      description: "Professional setup and wiring for infrared sauna cabins, including 120V and 240V configurations."
    },
    {
      title: "Custom / Cut-and-Assemble Saunas",
      description: "Have a custom kit or cut-and-assemble sauna? We handle the build-out, wiring, and finishing."
    }
  ];

  const includedSteps = [
    { icon: Wrench, title: "Full unit assembly", description: "We build your sauna on-site from panels, kits, or custom components." },
    { icon: Zap, title: "Electrical hookup and 240V wiring", description: "We connect your sauna to the appropriate circuit and coordinate 240V wiring when needed." },
    { icon: ArrowDownToLine, title: "Placement and leveling", description: "We position your sauna precisely and ensure it's level and stable on any surface." },
    { icon: BookOpen, title: "Post-install walkthrough", description: "We walk you through operation, maintenance, and best practices before we leave." }
  ];

  const galleryImages = [
    { src: galleryImage1, alt: "Sauna roof installation in San Francisco backyard", caption: "Roof assembly in progress" },
    { src: galleryImage2, alt: "Prefab sauna being assembled on Bay Area patio", caption: "Outdoor sauna assembly" },
    { src: galleryImage3, alt: "Interior cedar wall detail of sauna installation", caption: "Interior cedar finishing" },
    { src: heroImage, alt: "Completed custom sauna installation in San Francisco home", caption: "Completed installation" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-semibold mb-6 text-heading tracking-tight leading-tight">
              Professional Sauna Installation in the Bay Area
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl">
              We handle the full installation — assembly, electrical hookup, and setup — so your sauna is ready to use from day one.
            </p>
            <Button asChild size="lg" className="text-lg px-8">
              <Link to="/pre-fab-sauna-installation-form">Request a Free Quote</Link>
            </Button>
          </div>

          <div className="max-w-5xl mx-auto mt-12">
            <img
              src={heroImage}
              alt="Professional sauna installation in San Francisco Bay Area home"
              className="w-full rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-24 bg-cedar-section">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-10 text-heading">
              What We Install
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service, index) => (
                <div key={index} className="bg-card rounded-lg border border-border p-6 md:p-8">
                  <h3 className="text-xl font-heading font-semibold mb-3 text-heading">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-10 text-heading">
              What's Included
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              {includedSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <step.icon className="text-accent" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading font-semibold mb-1 text-heading">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-10 text-muted-foreground text-center italic">
              Every project is different. Contact us for a free quote.
            </p>
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <section className="py-16 md:py-24 bg-cedar-section">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-semibold mb-10 text-heading">
              Recent Installations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.map((image, index) => (
                <div key={index}>
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-64 object-cover rounded-lg shadow-lg mb-3"
                  />
                  <p className="text-sm text-muted-foreground text-center">{image.caption}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA Strip */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-heading font-semibold mb-6 text-heading">
              Ready to get your sauna installed?
            </h2>
            <Button asChild size="lg" className="text-lg px-8">
              <Link to="/pre-fab-sauna-installation-form">Request a Free Quote</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrefabSaunaInstallation;
