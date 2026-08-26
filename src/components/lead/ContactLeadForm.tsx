import { useState } from "react";
import { z } from "zod";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { submitLeadToGHL } from "@/lib/submitLeadToGHL";
import LeadFormSuccessDialog from "@/components/lead/LeadFormSuccessDialog";
import { emailSchema, phoneSchema, formatPhoneInput } from "@/lib/validation";

const GOAL_OPTIONS = [
  "Sleep",
  "Stress & relaxation",
  "Pain & soreness",
  "Exercise recovery",
  "Longevity",
  "Convenience",
  "Spend time with others",
  "I just love sauna",
];

const schema = z.object({
  first_name: z.string().trim().min(1, "Required").max(80),
  last_name: z.string().trim().min(1, "Required").max(80),
  email: emailSchema,
  phone: phoneSchema,
  goals: z.array(z.string()).min(1, "Select at least one"),
  goals_detail: z.string().trim().min(1, "Required").max(1000),
  message: z.string().trim().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  /** Where on the site the form lives, e.g. "homepage_hero". */
  formSource: string;
  formName?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  /** Renders the form for a dark background with transparent, dark inputs. */
  overlay?: boolean;
}

const ContactLeadForm = ({
  formSource,
  formName = "Contact Request",
  title,
  subtitle,
  className = "",
  overlay = false,
}: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: { goals: [] },
  });
  const { handleSubmit, reset, formState } = methods;

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const res = await submitLeadToGHL({
        form_source: formSource,
        form_name: formName,
        fields: {
          first_name: values.first_name,
          last_name: values.last_name,
          name: `${values.first_name} ${values.last_name}`.trim(),
          email: values.email,
          phone: values.phone,
          goals: values.goals,
          sauna_goals: values.goals.join(", "),
          goals_detail: values.goals_detail,
          message: values.message,
        },
      });
      if (!res.ok) {
        toast.error("Something went wrong. Please try again.");
        return;
      }
      reset();
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={`w-full max-w-xl mx-auto text-left ${className}`}>

        {title && (
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        )}
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1 mb-4">{subtitle}</p>
        )}
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FloatingField
                name="first_name"
                label="First name"
                error={formState.errors.first_name?.message}
                overlay={overlay}
                autoComplete="given-name"
              />
              <FloatingField
                name="last_name"
                label="Last name"
                error={formState.errors.last_name?.message}
                overlay={overlay}
                autoComplete="family-name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FloatingField
                name="email"
                label="Email"
                type="email"
                error={formState.errors.email?.message}
                overlay={overlay}
                autoComplete="email"
              />
              <FloatingField
                name="phone"
                label="Phone"
                type="tel"
                error={formState.errors.phone?.message}
                overlay={overlay}
                autoComplete="tel"
              />
            </div>
            <GoalsField
              overlay={overlay}
              error={formState.errors.goals?.message}
            />
            <FloatingField
              name="goals_detail"
              label="Tell us a bit more about your answer above."
              error={formState.errors.goals_detail?.message}
              overlay={overlay}
            />
            <FloatingField
              name="message"
              label="Message (optional)"
              error={formState.errors.message?.message}
              overlay={overlay}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? "Sending…" : "Learn more"}
            </Button>
          </form>
        </FormProvider>
      </div>
      <LeadFormSuccessDialog open={success} onOpenChange={setSuccess} />
    </>
  );
};

const GoalsField = ({ overlay, error }: { overlay?: boolean; error?: string }) => {
  const { watch, setValue } = useFormContext<FormValues>();
  const selected = watch("goals") || [];

  const toggle = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter((o) => o !== option)
      : [...selected, option];
    setValue("goals", next, { shouldValidate: true });
  };

  return (
    <div className="pt-1">
      <p className={`text-sm font-medium mb-2 ${overlay ? "text-white/90" : "text-foreground"}`}>
        What are you hoping a home sauna will help with?{" "}
        <span className={`font-normal ${overlay ? "text-white/70" : "text-muted-foreground"}`}>
          Select all that apply.
        </span>
      </p>
      <div className="grid grid-cols-2 gap-2">
        {GOAL_OPTIONS.map((option) => {
          const checked = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={checked}
              onClick={() => toggle(option)}
              className={`rounded-full border px-3 py-2 text-sm leading-snug text-center transition-colors cursor-pointer select-none ${
                checked
                  ? "border-primary bg-primary text-primary-foreground font-medium"
                  : overlay
                    ? "border-white/30 bg-white/5 text-white/80 hover:border-white/60 hover:text-white"
                    : "border-border bg-background text-muted-foreground hover:border-primary/60 hover:text-foreground"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
};

const FloatingField = ({
  name,
  label,
  error,
  type = "text",
  overlay,
  autoComplete,
  rows,
  isTextarea = false,
}: {
  name: keyof FormValues;
  label: string;
  error?: string;
  type?: string;
  overlay?: boolean;
  autoComplete?: string;
  rows?: number;
  isTextarea?: boolean;
}) => {
  const { register, setValue } = useFormContext<FormValues>();
  const isPhone = name === "phone";

  const inputClass = [
    isTextarea ? "floating-label-textarea" : "floating-label-input",
    overlay ? "input-overlay" : "",
  ].join(" ");

  return (
    <div className="floating-label-field">
      {isTextarea ? (
        <textarea
          id={name}
          rows={rows}
          placeholder=" "
          autoComplete={autoComplete}
          className={inputClass}
          {...register(name)}
        />
      ) : (
        <input
          id={name}
          type={type}
          inputMode={isPhone ? "tel" : undefined}
          placeholder=" "
          autoComplete={autoComplete}
          className={inputClass}
          {...register(name)}
          onChange={
            isPhone
              ? (e) => setValue(name, formatPhoneInput(e.target.value), { shouldValidate: false })
              : register(name).onChange
          }
        />
      )}
      <label htmlFor={name} className="floating-label">
        {label}
      </label>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
};

export default ContactLeadForm;
