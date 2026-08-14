import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitLeadToGHL } from "@/lib/submitLeadToGHL";
import LeadFormSuccessDialog from "@/components/lead/LeadFormSuccessDialog";

const schema = z.object({
  first_name: z.string().trim().min(1, "Required").max(80),
  last_name: z.string().trim().min(1, "Required").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(7, "Invalid phone").max(40),
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
  /** Renders the card with a light/blurred surface for dark backgrounds. */
  overlay?: boolean;
}

const ContactLeadForm = ({
  formSource,
  formName = "Contact Request",
  title = "Get in touch",
  subtitle = "Tell us about your space and we'll get back to you shortly.",
  className = "",
  overlay = false,
}: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

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
      <div
        className={`w-full max-w-xl mx-auto rounded-2xl border p-5 md:p-6 text-left ${
          overlay
            ? "border-white/20 bg-background/90 backdrop-blur-sm"
            : "border-border bg-card"
        } ${className}`}
      >
        {title && (
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        )}
        {subtitle && <p className="text-sm text-muted-foreground mt-1 mb-4">{subtitle}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="First name" error={errors.first_name?.message}>
              <Input {...register("first_name")} autoComplete="given-name" />
            </Field>
            <Field label="Last name" error={errors.last_name?.message}>
              <Input {...register("last_name")} autoComplete="family-name" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" {...register("email")} autoComplete="email" />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <Input type="tel" {...register("phone")} autoComplete="tel" />
            </Field>
          </div>
          <Field label="Message (optional)" error={errors.message?.message}>
            <Textarea rows={3} {...register("message")} />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Sending…" : "Send"}
          </Button>
        </form>
      </div>
      <LeadFormSuccessDialog open={success} onOpenChange={setSuccess} />
    </>
  );
};

const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div>
    <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">
      {label}
    </Label>
    {children}
    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
  </div>
);

export default ContactLeadForm;