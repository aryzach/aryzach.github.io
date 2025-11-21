import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const SaunaDirectory = () => {
  const saunas = [
    {
      name: "South End Rowing Club",
      location: "San Francisco",
      type: "Finnish Dry Sauna",
      temp: "~170°F",
      access: "$13 at the door (Tue/Thu/Sat)",
      slug: "/sauna-review/south-end-rowing-club",
      rating: "8.5/10"
    },
    {
      name: "Fitness SF — Fillmore",
      location: "Fillmore District, SF",
      type: "Gym Sauna (Dry Electric)",
      temp: "175–180°F",
      access: "~$120/mo membership",
      slug: "/sauna-review/fitness-sf-fillmore",
      rating: "6.2/10"
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-[hsl(var(--color-heading))]">
              The Bay Area Sauna Directory
            </h1>
            <p className="text-lg text-[hsl(var(--color-text))] mb-8">
              A curated guide to public and semi-public saunas across the Bay Area.
            </p>
            <a
              href="https://www.sfsaunarental.com/sfsaunamap/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-[hsl(var(--color-accent))] hover:text-[hsl(var(--color-accent-dark))] mb-12 font-medium"
            >
              View Bay Area Sauna Directory Map →
            </a>

            <div className="space-y-6">
              {saunas.map((sauna, index) => (
                <Link
                  key={index}
                  to={sauna.slug}
                  className="block bg-[hsl(var(--color-white))] border border-[hsl(var(--color-ui))] rounded-lg p-6 hover:border-[hsl(var(--color-accent))] transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="text-2xl font-semibold text-[hsl(var(--color-heading))] mb-1">
                        {sauna.name}
                      </h2>
                      <p className="text-sm text-[hsl(var(--color-text))]">{sauna.location}</p>
                    </div>
                    <span className="text-sm font-medium text-[hsl(var(--color-accent))]">
                      {sauna.rating}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-[hsl(var(--color-text))]/60">Type</span>
                      <p className="text-[hsl(var(--color-text))] font-medium">{sauna.type}</p>
                    </div>
                    <div>
                      <span className="text-[hsl(var(--color-text))]/60">Temperature</span>
                      <p className="text-[hsl(var(--color-text))] font-medium">{sauna.temp}</p>
                    </div>
                    <div>
                      <span className="text-[hsl(var(--color-text))]/60">Access</span>
                      <p className="text-[hsl(var(--color-text))] font-medium">{sauna.access}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SaunaDirectory;
