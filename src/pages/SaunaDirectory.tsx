import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { seoData } from "@/lib/seoData";

const SaunaDirectory = () => {
  useSEO(seoData.saunaDirectory);
  const saunas = [
    {
      name: "South End Rowing Club",
      location: "500 Jefferson St, SF 94109",
      type: "Steam Sauna",
      temp: "~170°F",
      access: "$13 at the door (Tue/Thu/Sat)",
      slug: "/sauna-review/south-end-rowing-club",
      rating: "8.5/10",
      website: "https://serc.com/"
    },
    {
      name: "Fitness SF — Fillmore",
      location: "1455 Fillmore St, SF 94115",
      type: "Gym Sauna (Dry Electric)",
      temp: "175–180°F",
      access: "~$120/mo membership",
      slug: "/sauna-review/fitness-sf-fillmore",
      rating: "6.2/10",
      website: "https://www.fitnesssf.com/location/fillmore"
    },
    {
      name: "Kabuki Springs & Spa",
      location: "1750 Geary Blvd, SF 94115",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://kabukisprings.com"
    },
    {
      name: "Onsen",
      location: "466 Eddy St, SF 94109",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://onsensf.com"
    },
    {
      name: "Archimedes Banya (Banya SF)",
      location: "748 Innes Ave, SF 94124",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://banyasf.com"
    },
    {
      name: "Imperial Day Spa",
      location: "1875 Geary Blvd, SF 94115",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://imperialdayspa.com"
    },
    {
      name: "Pearl Spa & Sauna (women-only)",
      location: "1654 Post St, SF 94115",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://pearlsf.com"
    },
    {
      name: "Reboot Float & Cryo — Mission",
      location: "810 Valencia St, SF 94110",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://rebootfloatspa.com"
    },
    {
      name: "Reboot Float & Cryo — Marina",
      location: "1912 Lombard St, SF 94123",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://rebootfloatspa.com"
    },
    {
      name: "Equinox Sports Club SF",
      location: "747 Market St, SF 94103",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://www.equinox.com/clubs/san-francisco/sports-club-sf"
    },
    {
      name: "Fitness SF — Transbay",
      location: "425 Mission St, SF 94105",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://www.fitnesssf.com/gyms/transbay"
    },
    {
      name: "Bay Club — Financial District",
      location: "555 California St, SF 94104",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://bayclubs.com"
    },
    {
      name: "Bay Club — Gateway",
      location: "370 Drumm St, SF 94111",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://bayclubs.com"
    },
    {
      name: "JCCSF Fitness Center",
      location: "3200 California St, SF 94118",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://jccsf.org/fitness-wellness"
    },
    {
      name: "UCSF Millberry Fitness & Recreation (Parnassus)",
      location: "500 Parnassus Ave Level B1, SF 94143",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://campuslifeservices.ucsf.edu/fitnessrecreation"
    },
    {
      name: "Embarcadero YMCA",
      location: "169 Steuart St, SF 94105",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://ymcasf.org/locations/embarcadero-ymca"
    },
    {
      name: "Dolphin Club",
      location: "502 Jefferson St, SF 94109",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://dolphinclub.org"
    },
    {
      name: "Dogpatch Paddle — Crane Cove Sauna",
      location: "701 Illinois St #A (Crane Cove Park), SF 94107",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://dogpatchpaddle.com/sauna"
    },
    {
      name: "Mission Cliffs (Touchstone Climbing)",
      location: "2295 Harrison St, SF 94110",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://touchstoneclimbing.com/mission-cliffs"
    },
    {
      name: "Albany Sauna, Massage & Hot Tubs",
      location: "1002 Solano Ave, Albany, CA 94706",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://albanysauna.com"
    },
    {
      name: "Fjord (floating sauna)",
      location: "2310 Marinship Way, Sausalito, CA (Richardson Bay)",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://thisisfjord.com"
    },
    {
      name: "Good Hot",
      location: "1950 Stenmark Dr., Richmond, CA 94801",
      type: "Review coming soon",
      temp: "—",
      access: "—",
      website: "https://good-hot.com"
    },
    {
      name: "Wanna Sauna",
      location: "Tiburon, CA 94920 (mobile/pop-up throughout Bay Area)",
      type: "Mobile wood-fire sauna rentals + pop-ups + home sauna builds",
      temp: "—",
      access: "—",
      websites: ["https://mobilesaunatiburon.com", "https://wannasauna.rest"]
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
              {saunas.map((sauna, index) => {
                const content = (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h2 className="text-2xl font-semibold text-[hsl(var(--color-heading))] mb-1">
                          {sauna.name}
                        </h2>
                        <p className="text-sm text-[hsl(var(--color-text))]">{sauna.location}</p>
                        {sauna.website && (
                          <a
                            href={sauna.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[hsl(var(--color-accent))] hover:text-[hsl(var(--color-accent-dark))] mt-1 inline-block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Visit Website →
                          </a>
                        )}
                        {sauna.websites && (
                          <div className="flex gap-2 mt-1">
                            {sauna.websites.map((url: string, idx: number) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[hsl(var(--color-accent))] hover:text-[hsl(var(--color-accent-dark))] inline-block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {url.replace('https://', '').replace('www.', '')} →
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      {sauna.rating && (
                        <span className="text-sm font-medium text-[hsl(var(--color-accent))]">
                          {sauna.rating}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-[hsl(var(--color-text))]/60">Type</span>
                        <p className="text-[hsl(var(--color-text))] font-medium">{sauna.type}</p>
                      </div>
                      {sauna.temp && (
                        <div>
                          <span className="text-[hsl(var(--color-text))]/60">Temperature</span>
                          <p className="text-[hsl(var(--color-text))] font-medium">{sauna.temp}</p>
                        </div>
                      )}
                      {sauna.access && (
                        <div>
                          <span className="text-[hsl(var(--color-text))]/60">Access</span>
                          <p className="text-[hsl(var(--color-text))] font-medium">{sauna.access}</p>
                        </div>
                      )}
                    </div>
                  </>
                );

                return sauna.slug ? (
                  <Link
                    key={index}
                    to={sauna.slug}
                    className="block bg-[hsl(var(--color-white))] border border-[hsl(var(--color-ui))] rounded-lg p-6 hover:border-[hsl(var(--color-accent))] transition-colors"
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={index}
                    className="block bg-[hsl(var(--color-white))] border border-[hsl(var(--color-ui))] rounded-lg p-6"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SaunaDirectory;
