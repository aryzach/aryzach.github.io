import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { submitApplicationToGHL } from "@/lib/submitApplicationToGHL";
import { isValidEmail, isValidPhone, formatPhoneInput } from "@/lib/validation";

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
  { name: "city_neighborhood", label: "City / neighborhood" },
  { name: "current_work", label: "What do you currently do for work?", type: "textarea" },
  { name: "why_interested", label: "Why does this job sound interesting to you?", type: "textarea" },
  {
    name: "vehicle",
    label: "What vehicle do you own? Include year, make, model, and cargo/bed setup.",
    type: "textarea",
  },
  { name: "weekly_schedule", label: "What does your typical weekly schedule look like?", type: "textarea" },
  {
    name: "hands_on_experience",
    label: "Tell us about something you've built, installed, repaired, or moved.",
    type: "textarea",
  },
  {
    name: "long_term_fit",
    label: "What would make a side job like this worth keeping for 2–3+ years?",
    type: "textarea",
  },
  {
    name: "job_gone_wrong",
    label: "Tell us about a time a physical job/project went wrong. What did you do?",
    type: "textarea",
  },
  {
    name: "can_move_panels",
    label: "Are you comfortable independently moving ~80 lb, 6' × 4' panels, including on stairs?",
    type: "yesno",
  },
  { name: "owns_truck_or_van", label: "Do you own a suitable truck or cargo van?", type: "yesno" },
  { name: "anything_else", label: "Anything else we should know?", type: "textarea", optional: true },
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

        <p className="mt-4 font-sans text-[17px] leading-relaxed text-foreground">
          SF Bay Area · Flexible side job
          <br />
          $1,500–$4,000+/month part-time depending on volume
        </p>

        <div className="mt-10 space-y-5 font-sans text-[17px] leading-relaxed text-foreground">
          <p>SF Sauna rents and installs home saunas around the Bay Area.</p>
          <p>
            We're looking for someone to completely own the customer experience after a
            sale: schedule the install, pick up and transport the sauna, move it into the
            customer's home, assemble it, show them how it works, and make sure they're
            happy.
          </p>
          <p>
            Most months are ~5–10 installs/removals. You set a consistent weekly
            availability and can work this around another job.
          </p>

          <div>
            <p>The job comes down to four things, in this order:</p>
            <ol className="mt-3 space-y-1.5 pl-5 list-decimal marker:text-muted-foreground">
              <li>Make the customer happy.</li>
              <li>Don't damage their home.</li>
              <li>Don't damage the sauna.</li>
              <li>Get the sauna installed and working.</li>
            </ol>
          </div>

          <div>
            <p>You should:</p>
            <ul className="mt-3 space-y-1.5 pl-5 list-disc marker:text-muted-foreground">
              <li>Be exceptionally reliable and good with customers</li>
              <li>Be handy, careful, strong, and good at figuring things out</li>
              <li>Own a truck or cargo van</li>
              <li>
                Be able to independently move ~80 lb, 6' × 4' sauna panels, including on
                stairs
              </li>
              <li>Have a consistent enough schedule that we can rely on you</li>
              <li>Want a great side job you could keep for years</li>
            </ul>
          </div>

          <p>
            Occasionally you'll also help receive sauna shipments, prep equipment, and
            handle miscellaneous field operations.
          </p>
          <p>
            We're less interested in your résumé than whether we'd trust you to take a
            customer from us and know they'll be taken care of.
          </p>
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
