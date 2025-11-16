import { useEffect } from "react";
import { Star } from "lucide-react";

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
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Loved by San Franciscans
          </h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="fill-warm-orange text-warm-orange" size={24} />
            ))}
            <span className="ml-2 text-lg text-muted-foreground">4.9 on Google Reviews</span>
          </div>
          <p className="text-sm text-muted-foreground">
            As seen in <span className="font-semibold text-foreground">The SF Standard</span>
          </p>
        </div>

        {/* Elfsight Google Reviews */}
        <div className="elfsight-app-7bdbfaeb-56f2-4804-9ef2-54bf4f091e1c" data-elfsight-app-lazy></div>
      </div>
    </section>
  );
};

export default SocialProof;
