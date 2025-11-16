import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

const caseStudies = [
  {
    name: "Sarah's Mission District Studio",
    image: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80",
    story: "Living in a small studio, I was worried about space. The team helped me find the perfect corner spot. Now I use it every morning before work. My energy levels have never been better!",
    location: "Mission District, 450 sq ft studio",
    usage: "Daily, 30 minutes",
    cost: "~$0.80 per session",
  },
  {
    name: "David's Noe Valley Backyard",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    story: "We placed ours on our covered patio. It's become the favorite spot for the whole family. The kids even ask to use it! Best home wellness investment we've made.",
    location: "Noe Valley, covered patio",
    usage: "Family of 4, multiple daily sessions",
    cost: "Less than $3/day for entire family",
  },
  {
    name: "Emma's Sunset Apartment",
    image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80",
    story: "As someone who works from home, this has been a game-changer for my midday breaks. Super quiet, doesn't bother neighbors, and my landlord was totally fine with it.",
    location: "Sunset District, 2BR apartment",
    usage: "Daily lunch break sessions",
    cost: "$0.75 per session, 2,400W heater",
  },
  {
    name: "Alex's SOMA Loft",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
    story: "The setup was incredibly smooth. They navigated the tight elevator and had it running in 45 minutes. I upgraded to 240V for faster heat-up time - totally worth it.",
    location: "SOMA, industrial loft",
    usage: "Evening sessions after gym",
    cost: "240V upgrade, heats in 15 mins",
  },
  {
    name: "Jennifer's Pacific Heights Home",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
    story: "We've tried many wellness trends, but this is the one that stuck. The health benefits are real, and the convenience of having it at home can't be beat.",
    location: "Pacific Heights, master bedroom suite",
    usage: "Evening couples' sessions",
    cost: "Minimal electricity, maximum benefit",
  },
];

const Reviews = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Customer Stories
            </h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="fill-warm-orange text-warm-orange" size={28} />
              ))}
              <span className="ml-2 text-2xl font-semibold text-foreground">4.9</span>
            </div>
            <p className="text-xl text-muted-foreground">
              Based on 200+ Google Reviews
            </p>
          </div>

          <div className="space-y-12">
            {caseStudies.map((study, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                } gap-8 items-center bg-card rounded-lg p-6 border border-border`}
              >
                <div className="w-full md:w-1/2">
                  <img
                    src={study.image}
                    alt={study.name}
                    className="w-full h-[300px] object-cover rounded-lg"
                    loading="lazy"
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <h3 className="text-2xl font-bold mb-3 text-card-foreground">{study.name}</h3>
                  <p className="text-muted-foreground mb-4 italic">"{study.story}"</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-card-foreground">
                      <strong>Location:</strong> {study.location}
                    </p>
                    <p className="text-card-foreground">
                      <strong>Usage:</strong> {study.usage}
                    </p>
                    <p className="text-card-foreground">
                      <strong>Cost:</strong> {study.cost}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-muted rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Ready to Write Your Own Success Story?</h2>
            <p className="text-muted-foreground mb-6">
              Join hundreds of satisfied customers enjoying daily sauna therapy at home
            </p>
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Get Started Today
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Reviews;
