import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import fitnessSFImage from "@/assets/fitness-sf-fillmore.png";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";

const FitnessSFFillmore = () => {
  useSEO(seoData.fitnessSFFillmore);
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
                  href="https://www.fitnesssf.com/location/fillmore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[hsl(var(--color-accent))] hover:text-[hsl(var(--color-accent-dark))] text-sm"
                >
                  Visit Website →
                </a>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-semibold mb-2 text-[hsl(var(--color-heading))]">
              Fitness SF — Fillmore
            </h1>
            <p className="text-sm text-[hsl(var(--color-text))]/60 mb-2">1455 Fillmore St, SF 94115</p>
            <p className="text-xl text-[hsl(var(--color-text))] mb-2">Sauna Review</p>
            <p className="text-sm text-[hsl(var(--color-text))]/60 mb-12">Category: Gym Sauna (Dry Electric)</p>

            {/* Stats Grid */}
            <div className="bg-[hsl(var(--color-bg))] border border-[hsl(var(--color-ui))] rounded-lg p-6 mb-12">
              <h2 className="text-xl font-semibold text-[hsl(var(--color-heading))] mb-6">Stats</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[hsl(var(--color-text))]/60">Type</span>
                  <p className="text-[hsl(var(--color-text))] font-medium">Dry electric</p>
                </div>
                <div>
                  <span className="text-[hsl(var(--color-text))]/60">Temp</span>
                  <p className="text-[hsl(var(--color-text))] font-medium">175–180°F (fairly reliable)</p>
                </div>
                <div>
                  <span className="text-[hsl(var(--color-text))]/60">Humidity</span>
                  <p className="text-[hsl(var(--color-text))] font-medium">Body-humidity only; gets swampy during peak hours</p>
                </div>
                <div>
                  <span className="text-[hsl(var(--color-text))]/60">Capacity</span>
                  <p className="text-[hsl(var(--color-text))] font-medium">~6 seated, +5 standing when it's popping</p>
                </div>
                <div>
                  <span className="text-[hsl(var(--color-text))]/60">Bench layout</span>
                  <p className="text-[hsl(var(--color-text))] font-medium">Mixed; part two-tier, part single-tier</p>
                </div>
                <div>
                  <span className="text-[hsl(var(--color-text))]/60">Lighting</span>
                  <p className="text-[hsl(var(--color-text))] font-medium">Dim, surprisingly chill</p>
                </div>
                <div>
                  <span className="text-[hsl(var(--color-text))]/60">Windows</span>
                  <p className="text-[hsl(var(--color-text))] font-medium">Just the door window to the locker room</p>
                </div>
                <div>
                  <span className="text-[hsl(var(--color-text))]/60">Amenities</span>
                  <p className="text-[hsl(var(--color-text))] font-medium">Towels, showers, cold showers, cold plunge, pool, full gym</p>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="mb-12">
              <img
                src={fitnessSFImage}
                alt="Fitness SF Fillmore gym sauna facility in San Francisco"
                className="w-full rounded-lg"
              />
            </div>

            {/* Review Sections */}
            <div className="space-y-8 text-[hsl(var(--color-text))]">
              <div>
                <h2 className="text-2xl font-semibold text-[hsl(var(--color-heading))] mb-4">The Room</h2>
                <p className="mb-3">
                  A medium-sized electric dry sauna that tries its best under sheer human throughput. The heat is legit—175–180°F with a fast "hit" once you're on the upper bench in the back. The space is chopped into a two-tier zone and a one-tier zone, which makes the geometry weird but usable. Drafts are frequent because people are constantly entering/exiting; regulars wedge a towel under the door to stop the under-door breeze.
                </p>
                <p className="mb-3">
                  Ventilation is basically "collective sweat atmosphere." Not crisp. Not dangerous. Just gym-sweaty.
                </p>
                <p>
                  Lighting is dim enough to be tolerable, and honestly one of the more pleasant aspects of the room.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-[hsl(var(--color-heading))] mb-4">Cleanliness</h2>
                <p className="mb-3">
                  Floor: perpetually wet.<br />
                  Benches: usable but not "Spa Nordics of the world" clean.<br />
                  Smell: fine, because heat kills everything, but you're aware of the day's traffic.
                </p>
                <p className="mb-3">
                  They seem to clean it once per day. Problem: it's used all day. Entropy wins.
                </p>
                <p>
                  No mold jump-scare moments. No weird broken hacks.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-[hsl(var(--color-heading))] mb-4">Heat Character</h2>
                <p className="mb-3">This is a classic gym electric sauna done reasonably well:</p>
                <ul className="list-disc pl-6 space-y-2 mb-3">
                  <li>Heat "arrives" quickly once you sit up high.</li>
                  <li>You'll sweat in 5–10 minutes.</li>
                  <li>By 15–20 min you're cooked enough that you start thinking in short declarative sentences.</li>
                  <li>Heater seems correctly sized for volume.</li>
                  <li>Back upper bench is the throne; everything else is transitional space.</li>
                </ul>
                <p>
                  Nothing mystical, nothing Finnish-ancestral. Just competent heat.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-[hsl(var(--color-heading))] mb-4">Crowd + Vibe</h2>
                <p className="mb-3">Extremely time-dependent.</p>
                <p className="mb-3">
                  <span className="font-medium">Peak chaos:</span><br />
                  7–9:30 am and 5–10 pm — constant churn, people standing, door opening like CVS on Black Friday.
                </p>
                <p className="mb-3">
                  <span className="font-medium">Midday:</span><br />
                  3–5 people, quiet, actually usable.
                </p>
                <p className="mb-3">
                  The clientele is mostly gym-going tech workers with normal 9–5s. No sauna culture, no community, no talkers, no ritual. Just bodies doing recovery. A few old guys go nude. Most are in towels or swimsuits. Some phones appear.
                </p>
                <p>
                  It's not hostile. It's just… functional. No one forms a bond here.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-[hsl(var(--color-heading))] mb-4">Adjacent Facilities</h2>
                <p className="mb-3">This is where Fillmore wins:</p>
                <ul className="list-disc pl-6 space-y-2 mb-3">
                  <li>Cold plunge</li>
                  <li>Cold showers</li>
                  <li>Towels</li>
                  <li>Decent showers</li>
                  <li>Pool</li>
                  <li>Full gym</li>
                </ul>
                <p className="mb-3">
                  You can do a respectable hot–cold cycle without leaving the men's locker room. Post-sauna cool-down is basically "stand in the locker room like a lizard until your temperature drops."
                </p>
                <p>
                  Locker room is shockingly clean for how many humans pass through it but definitely crowded at peak times.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-[hsl(var(--color-heading))] mb-4">Access + Reliability</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Membership: ~$120/mo</li>
                  <li>Guests allowed</li>
                  <li>Sauna occasionally offline because someone fiddles with the thermostat and it dies for a few days</li>
                  <li>Gendered locker rooms</li>
                  <li>No weird closure rules</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-[hsl(var(--color-heading))] mb-4">Intangibles</h2>
                <p className="mb-3">
                  <span className="font-medium">Best thing:</span><br />
                  The upper-back-corner bench in off-peak hours—quiet, steady heat, no one bothers you.
                </p>
                <p className="mb-3">
                  <span className="font-medium">Worst thing:</span><br />
                  Crowd churn + dirtiness + drafts. At peak times it's like trying to meditate inside a revolving door.
                </p>
                <p className="mb-3">
                  <span className="font-medium">Unexpected charm:</span><br />
                  None. This is a gym sauna with no mythopoetic layer.
                </p>
                <p className="mb-3">
                  <span className="font-medium">Would I recommend it for the sauna alone?</span><br />
                  Only if you live nearby and convenience is the whole point.
                </p>
                <p>
                  <span className="font-medium">Culture delta vs. South End Rowing Club:</span><br />
                  SERC is an old-world communal micro-civilization. Fitness SF is a throughput machine for people checking one more box on their wellness stack. Heat is similar; humanity is not.
                </p>
              </div>

              {/* Verdict */}
              <div className="bg-[hsl(var(--color-bg))] border border-[hsl(var(--color-ui))] rounded-lg p-6 mt-12">
                <h2 className="text-2xl font-semibold text-[hsl(var(--color-heading))] mb-4">Verdict</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-semibold text-[hsl(var(--color-accent))]">6.2 / 10</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[hsl(var(--color-text))]/60">Best for</p>
                    <p className="font-medium">Convenience over culture; gym-goers who want heat added to their routine</p>
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

export default FitnessSFFillmore;
