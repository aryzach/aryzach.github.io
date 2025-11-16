import { Star } from "lucide-react";

const reviews = [
  {
    name: "Sarah M.",
    location: "Mission District",
    text: "Best investment in my wellness routine. Setup was quick, and it fits perfectly in my apartment.",
    rating: 5,
  },
  {
    name: "David L.",
    location: "Noe Valley",
    text: "The team was professional and the sauna quality is amazing. Using it every morning!",
    rating: 5,
  },
  {
    name: "Emma K.",
    location: "Sunset",
    text: "Couldn't be happier! The rental process was seamless and customer service is top-notch.",
    rating: 5,
  },
];

const SocialProof = () => {
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

        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <div key={index} className="bg-card p-6 rounded-lg shadow-md border border-border">
              <div className="flex gap-1 mb-3">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="fill-warm-orange text-warm-orange" size={16} />
                ))}
              </div>
              <p className="text-card-foreground mb-4">"{review.text}"</p>
              <div className="text-sm">
                <p className="font-semibold text-card-foreground">{review.name}</p>
                <p className="text-muted-foreground">{review.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
