import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { submitApplicationToGHL } from "@/lib/submitApplicationToGHL";
import { isValidEmail, isValidPhone, formatPhoneInput } from "@/lib/validation";
import { assetUrl } from "@/lib/assetUrl";
import customerOperationsLeadVideo from "@/assets/customer-operations-lead-video.mov.asset.json";

const ROLE = "Customer Operations Lead";
const SOURCE = "Customer Operations Lead Application";

type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea" | "yesno";
  optional?: boolean;
  autoComplete?: string;
};

const FIELDS: FieldDef[] = [
  { name: "full_name", label: "Full name", autoComplete: "name" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "current_work", label: "What do you currently do for work?", type: "textarea" },
  {
    name: "vehicle",
    label: "What truck or van do you own?\nYear, make, model.",
    type: "textarea",
  },
  {
    name: "weekly_schedule",
    label: "What's your general weekday/weekend availability?",
    type: "textarea",
  },
  { name: "why_interested", label: "Why does this job sound like a good fit for you?", type: "textarea" },
  {
    name: "hands_on_experience",
    label: "Tell us about something you've built, moved, repaired, or installed that you're proud of.",
    type: "textarea",
  },
  { name: "city_neighborhood", label: "Where in the Bay Area do you live?" },
  {
    name: "can_move_panels",
    label: "Are you comfortable independently moving ~80 lb, 6' × 4' panels, including on stairs?",
    type: "yesno",
  },
  { name: "anything_else", label: "Anything else we should know? (optional)", type: "textarea", optional: true },
];

const CustomerOperationsLead = () => {
  useSEO({
    title: "Customer Operations Lead — SF Sauna",
    description:
      "Part-time Customer Operations Lead for SF Sauna in the Bay Area. Own the install experience: schedule, transport, assemble, and delight customers. $1,500–$4,000+/month.",
    canonical: "https://www.sfsaunarental.com/careers/customer-operations-lead",
  });

  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const set = (name: string, value: string) =>
    setValues((v) => ({ ...v, [name]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    for (const f of FIELDS) {
      const v = (values[f.name] || "").trim();
      if (!f.optional && !v) next[f.name] = "Required";
    }
    const email = (values.email || "").trim();
    if (email && !isValidEmail(email)) next.email = "Enter a valid email address";
    const phone = (values.phone || "").trim();
    if (phone && !isValidPhone(phone)) next.phone = "Enter a valid 10-digit US phone number";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: Record<string, string> = {};
      for (const f of FIELDS) payload[f.name] = (values[f.name] || "").trim();
      payload.name = payload.full_name;
      const res = await submitApplicationToGHL(payload, { role: ROLE, source: SOURCE });
      if (!res.ok) {
        setFormError("Something went wrong. Please try again.");
        return;
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2.5 text-[16px] text-foreground outline-none transition-colors focus:border-primary";

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[640px] px-5 py-14 md:py-20">
        <p className="font-sans text-sm tracking-wide text-muted-foreground">SF Sauna</p>

        <h1 className="mt-3 font-heading text-[34px] leading-tight tracking-tight text-foreground md:text-[44px]">
          Customer Operations Lead
        </h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {["SF Bay Area", "Flexible part-time job", "$1,500–$4,000+/month"].map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-border bg-muted/40 px-3 py-1 font-sans text-[14px] font-medium text-foreground"
            >
              {pill}
            </span>
          ))}
        </div>

        <p className="mt-3 font-sans text-[15px] text-muted-foreground">
          Part-time · ~5–10 installs/month · Volume-dependent
        </p>

        <div className="mt-10 space-y-6 font-sans text-[17px] leading-relaxed text-foreground">
          {/* Quick facts */}
          <div className="rounded-lg border border-border bg-muted/30 p-5">
            <p className="font-heading text-[18px] tracking-tight text-foreground">
              At a glance
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[14px] font-medium uppercase tracking-wide text-muted-foreground">
                  Pay
                </p>
                <p className="mt-0.5 font-semibold text-foreground">$1,500–$4,000+/month</p>
              </div>
              <div>
                <p className="text-[14px] font-medium uppercase tracking-wide text-muted-foreground">
                  Schedule
                </p>
                <p className="mt-0.5 font-semibold text-foreground">~5–10 installs/month, part-time</p>
              </div>
              <div>
                <p className="text-[14px] font-medium uppercase tracking-wide text-muted-foreground">
                  Location
                </p>
                <p className="mt-0.5 font-semibold text-foreground">SF Bay Area</p>
              </div>
              <div>
                <p className="text-[14px] font-medium uppercase tracking-wide text-muted-foreground">
                  Type
                </p>
                <p className="mt-0.5 font-semibold text-foreground">Flexible part-time job</p>
              </div>
            </div>
          </div>

          {/* About the role */}
          <div className="rounded-lg border border-border p-5">
            <p className="text-[14px] font-medium uppercase tracking-wide text-muted-foreground">
              About the role
            </p>
            <p className="mt-3">
              SF Sauna rents and installs home saunas around the Bay Area.
            </p>
            <p className="mt-3">
              We're looking for someone to <strong>completely own the customer experience</strong>{" "}
              after a sale: schedule the install, pick up and transport the sauna, move it into
              the customer's home, assemble it, show them how it works, and make sure they're
              happy.
            </p>
            <p className="mt-3">
              Most months are <strong>~5–10 installs/removals</strong>. You set a consistent
              weekly availability and can work this around another job.
            </p>
          </div>

          {/* The four priorities */}
          <div className="rounded-lg border border-border p-5">
            <p className="text-[14px] font-medium uppercase tracking-wide text-muted-foreground">
              The job comes down to four things, in this order
            </p>
            <ol className="mt-4 space-y-3">
              {[
                "Make the customer happy.",
                "Don't damage their home.",
                "Don't damage the sauna.",
                "Get the sauna installed and working.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{item}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* What we're looking for */}
          <div className="rounded-lg border border-border p-5">
            <p className="text-[14px] font-medium uppercase tracking-wide text-muted-foreground">
              You should
            </p>
            <ul className="mt-4 space-y-3">
              {[
                "Be exceptionally reliable and good with customers",
                "Be handy, careful, strong, and good at figuring things out",
                "Own a truck or cargo van",
                "Be able to independently move ~80 lb, 6' × 4' sauna panels, including on stairs",
                "Have a consistent enough schedule that we can rely on you",
                "Want a great side job you could keep for years",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Closing */}
          <div className="rounded-lg border border-border p-5">
            <p>
              Occasionally you'll also help receive sauna shipments, prep equipment, and
              handle miscellaneous field operations.
            </p>
            <p className="mt-3">
              We're less interested in your résumé than whether we'd trust you to take a
              customer from us and know they'll be taken care of.
            </p>
          </div>
        </div>

        {!done && (
          <a
            href="#apply"
            className="mt-10 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 font-sans text-[16px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Apply
          </a>
        )}

        <hr className="my-14 border-border" />

        {done ? (
          <section id="apply" className="py-4">
            <h2 className="font-heading text-[28px] tracking-tight text-foreground">
              Application received.
            </h2>
            <p className="mt-3 font-sans text-[17px] leading-relaxed text-foreground">
              Thanks for applying. If it looks like there could be a fit, we'll reach out
              to set up a short conversation.
            </p>
          </section>
        ) : (
          <section id="apply">
            <h2 className="font-heading text-[28px] tracking-tight text-foreground">Apply</h2>
            <p className="mt-2 font-sans text-[16px] text-muted-foreground">
              No cover letter. Short, straightforward answers are better.
            </p>

            <form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
              {FIELDS.map((f) => (
                <div key={f.name}>
                  <label
                    htmlFor={f.name}
                    className="block font-sans text-[16px] leading-snug text-foreground"
                  >
                    {f.label}
                    {f.optional && (
                      <span className="text-muted-foreground"> (optional)</span>
                    )}
                  </label>

                  {f.type === "yesno" ? (
                    <div className="mt-2.5 flex gap-2">
                      {["Yes", "No"].map((opt) => {
                        const active = values[f.name] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            aria-pressed={active}
                            onClick={() => set(f.name, opt)}
                            className={`rounded-md border px-5 py-2 font-sans text-[16px] transition-colors ${
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-foreground/80 hover:border-primary/60"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : f.type === "textarea" ? (
                    <textarea
                      id={f.name}
                      rows={2}
                      className={`${inputClass} mt-2 resize-y`}
                      value={values[f.name] || ""}
                      onChange={(e) => set(f.name, e.target.value)}
                    />
                  ) : (
                    <input
                      id={f.name}
                      type={f.type || "text"}
                      inputMode={f.type === "tel" ? "tel" : undefined}
                      autoComplete={f.autoComplete}
                      className={`${inputClass} mt-2`}
                      value={values[f.name] || ""}
                      onChange={(e) =>
                        set(
                          f.name,
                          f.type === "tel" ? formatPhoneInput(e.target.value) : e.target.value,
                        )
                      }
                    />
                  )}

                  {errors[f.name] && (
                    <p className="mt-1.5 font-sans text-[14px] text-destructive">
                      {errors[f.name]}
                    </p>
                  )}
                </div>
              ))}

              {formError && (
                <p className="font-sans text-[15px] text-destructive">{formError}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-primary px-6 py-3.5 font-sans text-[16px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Submit application"}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
};

export default CustomerOperationsLead;
