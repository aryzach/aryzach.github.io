import { useEffect } from "react";
import sfStandardLogo from "@/assets/sf-standard-logo.png";

const SocialProof = () => {
  useEffect(() => {
    // Load Elfsight script
    const script = document.createElement("script");
    script.src = "https://elfsightcdn.com/platform.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-semibold mb-4 text-foreground">
            Loved by San Franciscans
          </h2>
          <a 
            href="https://sfstandard.com/2025/06/21/welcome-to-san-franciscos-summer-of-saunas/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block mb-4 hover:opacity-80 transition-opacity"
          >
            <p className="text-sm text-muted-foreground mb-2">As seen in</p>
            <img 
              src={sfStandardLogo} 
              alt="The San Francisco Standard" 
              className="h-12 md:h-16 mx-auto"
            />
          </a>
        </div>

        {/* Elfsight Google Reviews */}
        <div className="elfsight-app-7bdbfaeb-56f2-4804-9ef2-54bf4f091e1c" data-elfsight-app-lazy></div>
      </div>
    </section>
  );
};

export default SocialProof;
