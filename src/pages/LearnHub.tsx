import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const blogPosts = [
  {
    title: "Infrared vs Finnish Sauna: Which Is Right for You?",
    excerpt: "Understanding the key differences between traditional Finnish saunas and modern infrared technology. Learn about heat types, health benefits, and which might be best for your home.",
    image: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80",
    date: "March 15, 2024",
    readTime: "5 min read",
  },
  {
    title: "The Real Cost of Running a Home Sauna",
    excerpt: "Break down the actual electricity costs of daily sauna use in San Francisco. Spoiler: it's less than you think! Plus tips for maximizing efficiency.",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    date: "March 10, 2024",
    readTime: "4 min read",
  },
  {
    title: "Landlord-Safe Home Wellness: Renter's Guide",
    excerpt: "How to set up a home sauna in your rental without violating your lease. Everything you need to know about permissions, placement, and portable wellness solutions.",
    image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80",
    date: "March 5, 2024",
    readTime: "6 min read",
  },
];

const LearnHub = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-semibold mb-6 text-foreground">
              Learn About Home Saunas
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Expert guides, tips, and insights for getting the most out of your sauna experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <article
                key={index}
                className="bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow"
              >
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                <div className="p-6">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h2 className="text-xl font-semibold mb-3 text-card-foreground">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {post.excerpt}
                  </p>
                  <Link
                    to="#"
                    className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
                  >
                    Read More
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-16 bg-muted rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Want More Sauna Tips?
            </h2>
            <p className="text-muted-foreground mb-6">
              Subscribe to our newsletter for weekly wellness insights and sauna guides
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground"
              />
              <button className="px-6 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 font-medium">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LearnHub;
