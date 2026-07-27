import { useEffect } from "react";
import {
  Flame,
  Droplets,
  Wind,
  GlassWater,
  Plug,
  HeartPulse,
  Ban,
  Sparkles,
  SprayCan,
  DoorOpen,
  Printer,
  Phone,
  Mail,
  ArrowDown,
  Timer,
  Snowflake,
  RotateCw,
} from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1610312278520-bcc893a3ff1d?auto=format&fit=crop&w=2400&q=80";

const CARE_STYLES = `
  @page { size: Letter portrait; margin: 0; }
  @media print {
    html, body { background: #F9F8F5 !important; margin: 0 !important; padding: 0 !important; }
    body * { visibility: hidden !important; }
    #care-sheet, #care-sheet * { visibility: visible !important; }
    #care-sheet {
      position: absolute !important;
      inset: 0 !important;
      width: 8.5in !important;
      height: 11in !important;
      margin: 0 !important;
      padding: 0.45in 0.5in !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      overflow: hidden !important;
    }
    .no-print { display: none !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  }
`;

const CEDAR = "#A9743F";
const CEDAR_SOFT = "#EFE6DA";
const BG = "#F9F8F5";
const INK = "#1B1B1B";
const MUTED = "#6B6357";
const RULE = "#E4DED3";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span
        className="text-[9pt] font-semibold tracking-[0.22em] uppercase"
        style={{ color: CEDAR }}
      >
        {children}
      </span>
      <span className="flex-1 h-px" style={{ background: RULE }} />
    </div>
  );
}

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: CEDAR_SOFT, color: CEDAR }}
    >
      {children}
    </div>
  );
}

function StartCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <IconBox>{icon}</IconBox>
      <div className="text-[10pt] font-semibold" style={{ color: INK }}>
        {title}
      </div>
      <div className="text-[8.5pt] leading-snug" style={{ color: MUTED }}>
        {body}
      </div>
    </div>
  );
}

function SafetyCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-2"
      style={{ border: `1px solid ${RULE}` }}
    >
      <div className="flex items-center gap-2">
        <IconBox>{icon}</IconBox>
        <div className="text-[10pt] font-semibold" style={{ color: INK }}>
          {title}
        </div>
      </div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li
            key={it}
            className="text-[8pt] leading-snug pl-3 relative"
            style={{ color: MUTED }}
          >
            <span
              className="absolute left-0 top-[7px] w-1 h-1 rounded-full"
              style={{ background: CEDAR }}
            />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TimelineStep({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <IconBox>{icon}</IconBox>
      <div>
        <div className="text-[10pt] font-semibold leading-none" style={{ color: INK }}>
          {title}
        </div>
        {subtitle && (
          <div className="text-[8.5pt] mt-1" style={{ color: MUTED }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineArrow() {
  return (
    <div className="pl-4">
      <ArrowDown size={12} style={{ color: CEDAR }} />
    </div>
  );
}

export default function Care() {
  useEffect(() => {
    document.title = "Care & Usage Guide — SF Sauna Rental";
  }, []);

  return (
    <div style={{ background: BG, minHeight: "100vh" }}>
      <style>{CARE_STYLES}</style>

      {/* Floating print button */}
      <button
        onClick={() => window.print()}
        className="no-print fixed bottom-6 right-6 z-50 rounded-full shadow-lg px-5 py-3 flex items-center gap-2 text-sm font-medium transition hover:opacity-90"
        style={{ background: INK, color: BG }}
      >
        <Printer size={16} /> Print Guide
      </button>

      <div className="mx-auto py-8 px-4 print:p-0 print:py-0" style={{ maxWidth: "8.5in" }}>
        <div
          id="care-sheet"
          className="mx-auto shadow-sm print:shadow-none"
          style={{
            width: "8.5in",
            minHeight: "11in",
            padding: "0.45in 0.5in",
            background: BG,
            color: INK,
            fontFamily: "'Inter', sans-serif",
            borderRadius: 8,
          }}
        >
          {/* HERO */}
          <div
            className="rounded-xl overflow-hidden mb-4"
            style={{ height: "1.9in", background: CEDAR_SOFT }}
          >
            <img
              src={HERO_IMAGE}
              alt="Cedar sauna interior"
              className="w-full h-full object-cover"
              style={{ display: "block" }}
            />
          </div>

          <div className="flex items-end justify-between mb-1">
            <div>
              <div
                className="text-[9pt] font-semibold tracking-[0.24em] uppercase"
                style={{ color: CEDAR }}
              >
                SF Sauna
              </div>
              <h1
                className="text-[22pt] leading-tight font-semibold mt-0.5"
                style={{ fontFamily: "'Clash Grotesk', sans-serif", color: INK }}
              >
                Care &amp; Usage Guide
              </h1>
            </div>
          </div>
          <p
            className="text-[9.5pt] max-w-[5in] leading-snug mb-4"
            style={{ color: MUTED }}
          >
            A few simple guidelines to keep your sauna safe, clean, and performing its best.
          </p>

          {/* GETTING STARTED */}
          <section className="mb-4">
            <SectionLabel>Getting Started</SectionLabel>
            <div className="grid grid-cols-4 gap-4">
              <StartCard
                icon={<Flame size={16} />}
                title="Preheat"
                body="40–90 minutes depending on your desired temperature and starting conditions."
              />
              <StartCard
                icon={<Droplets size={16} />}
                title="Steam (Löyly)"
                body="Pour small amounts of clean water onto the stones as desired. Avoid pouring large amounts at once."
              />
              <StartCard
                icon={<Wind size={16} />}
                title="Towel"
                body="Sit on a towel to protect the wood."
              />
              <StartCard
                icon={<GlassWater size={16} />}
                title="Hydrate"
                body="Drink water before and after your session."
              />
            </div>
          </section>

          {/* YOUR SESSION + CLEANING side by side to save vertical space */}
          <div className="grid grid-cols-2 gap-6 mb-4">
            <section>
              <SectionLabel>Your Session</SectionLabel>
              <div className="flex flex-col gap-1.5">
                <TimelineStep icon={<Flame size={16} />} title="Preheat" />
                <TimelineArrow />
                <TimelineStep
                  icon={<Timer size={16} />}
                  title="Sauna"
                  subtitle="15–30 min"
                />
                <TimelineArrow />
                <TimelineStep icon={<Snowflake size={16} />} title="Cool Down" />
                <TimelineArrow />
                <TimelineStep icon={<RotateCw size={16} />} title="Repeat if desired" />
              </div>
            </section>

            <section>
              <SectionLabel>Cleaning</SectionLabel>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-3">
                  <IconBox><SprayCan size={16} /></IconBox>
                  <div className="text-[9pt] leading-snug pt-1" style={{ color: INK }}>
                    Wipe benches and floor with a 1:1 vinegar and water solution.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconBox><Sparkles size={16} /></IconBox>
                  <div className="text-[9pt] leading-snug pt-1" style={{ color: INK }}>
                    Clean windows with standard glass cleaner.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IconBox><DoorOpen size={16} /></IconBox>
                  <div className="text-[9pt] leading-snug pt-1" style={{ color: INK }}>
                    Leave the door open after use to allow the sauna to dry.
                  </div>
                </div>
                <p className="text-[8pt] italic mt-1" style={{ color: MUTED }}>
                  We professionally clean and resurface every sauna between rentals.
                </p>
              </div>
            </section>
          </div>

          {/* SAFETY */}
          <section className="mb-4">
            <SectionLabel>Safety</SectionLabel>
            <div className="grid grid-cols-4 gap-3">
              <SafetyCard
                icon={<Flame size={16} />}
                title="Heater"
                items={[
                  "Maximum 2 hours continuous operation",
                  "Allow 30 minutes before restarting",
                  "Never cover the heater",
                  "Never touch or lean on the heater while operating",
                ]}
              />
              <SafetyCard
                icon={<Plug size={16} />}
                title="Power"
                items={[
                  "Plug directly into a wall outlet",
                  "Never use extension cords",
                  "Do not move to another outlet without contacting SF Sauna",
                ]}
              />
              <SafetyCard
                icon={<HeartPulse size={16} />}
                title="Health"
                items={[
                  "Exit immediately if dizzy, faint, nauseous, or unwell",
                  "Avoid sauna use while intoxicated",
                  "Consult your physician before use if pregnant or if you have medical conditions",
                ]}
              />
              <SafetyCard
                icon={<Ban size={16} />}
                title="Keep Out"
                items={[
                  "No glass bottles",
                  "No food",
                  "No pets",
                  "Never place towels or objects on the heater",
                  "Only pour clean water onto the stones",
                ]}
              />
            </div>
          </section>

          {/* NEED HELP */}
          <section className="mb-3">
            <SectionLabel>Need Help?</SectionLabel>
            <div
              className="rounded-xl p-3 flex items-center justify-between gap-4"
              style={{ background: CEDAR_SOFT }}
            >
              <div className="max-w-[4.2in]">
                <div className="text-[9.5pt] font-semibold mb-0.5" style={{ color: INK }}>
                  If anything seems wrong
                </div>
                <p className="text-[8.5pt] leading-snug" style={{ color: MUTED }}>
                  Turn off the heater, unplug the sauna, and contact us. Please don't
                  attempt repairs yourself.
                </p>
              </div>
              <div className="text-right">
                <div
                  className="text-[8pt] font-semibold tracking-[0.2em] uppercase"
                  style={{ color: CEDAR }}
                >
                  Call or text Zach
                </div>
                <div
                  className="text-[13pt] font-semibold mt-0.5 flex items-center gap-2 justify-end"
                  style={{ color: INK }}
                >
                  <Phone size={14} /> (248) 917-1520
                </div>
                <div
                  className="text-[9pt] mt-0.5 flex items-center gap-1.5 justify-end"
                  style={{ color: MUTED }}
                >
                  <Mail size={12} /> sfsaunarental@gmail.com
                </div>
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <div
            className="pt-3 mt-2 flex items-center justify-between text-[8pt]"
            style={{ borderTop: `1px solid ${RULE}`, color: MUTED }}
          >
            <div>
              Refer a friend and receive one free month when they become a customer.
            </div>
            <div>
              Enjoying your sauna? Leave us a Google Review.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}