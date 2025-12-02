import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import southEndImage from "@/assets/south-end-rowing-club.png";

const SouthEndRowingClub = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="mb-8 space-y-2">
              <Link
                to="/sauna-directory"
                className="inline-flex items-center text-[hsl(var(--color-accent))] hover:text-[hsl(var(--color-accent-dark))]"
              >
                ← Back to Directory
              </Link>
              <div>
                <a
                  href="https://serc.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[hsl(var(--color-accent))] hover:text-[hsl(var(--color-accent-dark))] text-sm"
                >
                  Visit Website →
                </a>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-semibold mb-2 text-[hsl(var(--color-heading))]">
              South End Rowing Club
            </h1>
            <p className="text-sm text-[hsl(var(--color-text))]/60 mb-2">500 Jefferson St, SF 94109</p>
            <p className="text-xl text-[hsl(var(--color-text))] mb-12">Sauna Review</p>

            {/* Stats Grid */}
            <div className="bg-[hsl(var(--color-bg))] border border-[hsl(var(--color-ui))] rounded-lg p-6 mb-12">
              <h2 className="text-xl font-semibold text-[hsl(var(--color-heading))] mb-6">Stats</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[hsl(var(--color-text))]/60">Temp</span>
                  <p className="text-[hsl(var(--color-text))] font-medium">~170°F</p>
                </div>
                <div>
                  <span className="text-[hsl(var(--color-text))]/60">Humidity</span>
                  <p className="text-[hsl(var(--color-text))] font-medium">~45% (surprisingly high for SF)</p>
                </div>
                <div>
                  <span className="text-[hsl(var(--color-text))]/60">Capacity</span>
                  <p className="text-[hsl(var(--color-text))] font-medium">~12 seated, another ~5 standing</p>
                </div>
                <div>
                  <span className="text-[hsl(var(--color-text))]/60">Access</span>
                  <p className="text-[hsl(var(--color-text))] font-medium">$13 at the door (Tue/Thu/Sat for visitors)</p>
                </div>
                <div>
                  <span className="text-[hsl(var(--color-text))]/60">Type</span>
                  <p className="text-[hsl(var(--color-text))] font-medium">Classic Finnish dry sauna</p>
                </div>
                <div>
                  <span className="text-[hsl(var(--color-text))]/60">Amenities</span>
                  <p className="text-[hsl(var(--color-text))] font-medium">Showers, day-use lockers, bay access, handball court</p>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="mb-12">
              <img
                src={southEndImage}
                alt="South End Rowing Club Finnish dry sauna interior in San Francisco"
                className="w-full rounded-lg"
              />
            </div>

            {/* Review Sections */}
            <div className="space-y-8 text-[hsl(var(--color-text))]">
              <div>
                <h2 className="text-2xl font-semibold text-[hsl(var(--color-heading))] mb-4">The Room</h2>
                <p className="mb-3">
                  Big old raised wooden benches and seasoned by decades of saltwater. Tile floor. Window with a sliver-view of Alcatraz. Some light door leakage but the room's so voluminous it diffuses. Ventilation felt solid.
                </p>
                <p>
                  Kinda terrible lighting. Nice daylight from the window, but with interior overhead fluorescent lights.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-[hsl(var(--color-heading))] mb-4">Heat Character</h2>
                <p>
                  170°F sounds hot on paper, but the space is large enough that it doesn't smack you the moment you walk in. It's a slow build.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-[hsl(var(--color-heading))] mb-4">Cleanliness</h2>
                <p>
                  Decent. Not spa-sterile, not gym-gross. Felt like a long-running communal facility run by people who use it regularly.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-[hsl(var(--color-heading))] mb-4">Crowd</h2>
                <p className="mb-3 font-medium">Loved it.</p>
                <p>
                  Old-school SF working-class men, old timers, swimmers, handball dudes, people who have clearly been coming here since before I was born. Tons of nudity, very social, people know each other, talk, come and go. Zero staff presence because it's volunteer-run.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-[hsl(var(--color-heading))] mb-4">The Extras</h2>
                <p>
                  Access to the Bay, and handball is weirdly big here. Old boat-house energy everywhere with raw wood, painted lockers.
                </p>
              </div>

              {/* Verdict */}
              <div className="bg-[hsl(var(--color-bg))] border border-[hsl(var(--color-ui))] rounded-lg p-6 mt-12">
                <h2 className="text-2xl font-semibold text-[hsl(var(--color-heading))] mb-4">Verdict</h2>
                <p className="mb-4">
                  A culturally maximalist, slightly chaotic, extremely San Francisco sauna. Not the hottest. Culturally fantastic.
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-semibold text-[hsl(var(--color-accent))]">8.5 / 10</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[hsl(var(--color-text))]/60">Best for</p>
                    <p className="font-medium">Social heat, people who prefer community over amenities</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SouthEndRowingClub;
