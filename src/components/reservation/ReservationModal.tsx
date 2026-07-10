import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SAUNA_TYPE_OPTIONS } from "@/lib/reservationSaunaTypes";
import { useAvailability } from "@/hooks/useAvailability";
import { formatDatePretty } from "@/lib/availability";
import { buildStripeCheckoutUrl, CALCOM_VIDEO_CONSULT_LINK } from "@/lib/reservationConfig";

export type ReservationSource =
  | "Pricing Page"
  | "Product Page"
  | "Direct Link"
  | "Admin"
  | "Unknown";

const schema = z.object({
  first_name: z.string().trim().min(1, "Required").max(80),
  last_name: z.string().trim().min(1, "Required").max(80),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(7, "Invalid phone").max(40),
  city: z.string().trim().min(1, "Required").max(120),
  sauna_type_id: z.string().min(1, "Required"),
  preferred_install_date: z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof schema>;

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Props {
  initialSaunaTypeId?: string;
  source: ReservationSource;
  onClose: () => void;
}

const ReservationModal = ({ initialSaunaTypeId, source, onClose }: Props) => {
  const navigate = useNavigate();
  const { getStatus } = useAvailability();
  const [submitting, setSubmitting] = useState<null | "reserve" | "consult">(null);
  const [consultSuccess, setConsultSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sauna_type_id: initialSaunaTypeId ?? "",
      preferred_install_date: "",
    } as Partial<FormValues> as FormValues,
  });

  const selectedSaunaTypeId = watch("sauna_type_id");
  const availability = getStatus(selectedSaunaTypeId || null);

  const minDate = useMemo(() => {
    const today = todayISO();
    if (availability.status === "future" && availability.nextAvailableDate) {
      return availability.nextAvailableDate > today ? availability.nextAvailableDate : today;
    }
    return today;
  }, [availability.status, availability.nextAvailableDate]);

  useEffect(() => {
    // Clear invalid date if it's before minDate after sauna change.
    const current = watch("preferred_install_date");
    if (current && current < minDate) setValue("preferred_install_date", "");
  }, [minDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (intent: "reserve" | "consult") => {
    if (intent === "consult") {
      window.open(CALCOM_VIDEO_CONSULT_LINK, "_blank", "noopener,noreferrer");
      setConsultSuccess(true);
      return;
    }
    const valid = await new Promise<FormValues | null>((resolve) => {
      handleSubmit(
        (v) => resolve(v),
        () => resolve(null),
      )();
    });
    if (!valid) return;

    if (valid.preferred_install_date < todayISO()) {
      toast.error("Installation date can't be before today.");
      return;
    }
    if (availability.status === "future" && availability.nextAvailableDate) {
      if (valid.preferred_install_date < availability.nextAvailableDate) {
        toast.error(
          `Installation date must be on or after ${formatDatePretty(availability.nextAvailableDate)}.`,
        );
        return;
      }
    }
    if (availability.status === "unavailable") {
      toast.error("That sauna type is currently unavailable.");
      return;
    }

    setSubmitting(intent);
    try {
      const { data, error } = await supabase.functions.invoke("reservation-create", {
        body: { ...valid, reservation_source: source, intent },
      });
      if (error || !data?.id || !data?.token) {
        console.error("reservation-create failed:", error);
        toast.error("Something went wrong. Please try again.");
        return;
      }
      // Open Stripe checkout in a new tab, then redirect the current tab
      // to the private reservation dashboard.
      window.open(buildStripeCheckoutUrl(data.id), "_blank", "noopener,noreferrer");
      navigate(`/reservation/${data.id}?token=${encodeURIComponent(data.token)}`);
      onClose();
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto p-0 gap-0">
        {consultSuccess ? (
          <div className="p-6 text-center">
            <CheckCircle2 className="mx-auto text-primary mb-3" size={44} />
            <h2 className="text-xl font-semibold text-foreground mb-2">You're all set</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Thanks! Your consultation has been scheduled. No sauna has been reserved yet.
            </p>
            <Button className="w-full" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <DialogHeader className="p-6 pb-3">
              <DialogTitle className="text-2xl font-semibold tracking-tight">
                Reserve your sauna
              </DialogTitle>
              <DialogDescription className="text-sm">
                A few quick details and we'll set aside your spot.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => { e.preventDefault(); submit("reserve"); }}
              className="px-6 pb-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name" error={errors.first_name?.message}>
                  <Input {...register("first_name")} autoComplete="given-name" />
                </Field>
                <Field label="Last name" error={errors.last_name?.message}>
                  <Input {...register("last_name")} autoComplete="family-name" />
                </Field>
              </div>
              <Field label="Email" error={errors.email?.message}>
                <Input type="email" {...register("email")} autoComplete="email" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone" error={errors.phone?.message}>
                  <Input type="tel" {...register("phone")} autoComplete="tel" />
                </Field>
                <Field label="City" error={errors.city?.message}>
                  <Input {...register("city")} autoComplete="address-level2" />
                </Field>
              </div>

              <Field label="Sauna type" error={errors.sauna_type_id?.message}>
                <div className="grid grid-cols-1 gap-2">
                  {SAUNA_TYPE_OPTIONS.map((o) => {
                    const active = selectedSaunaTypeId === o.id;
                    const optAvail = getStatus(o.id);
                    const isHighDemand =
                      o.id === "outdoor_traditional_latest" ||
                      o.id === "indoor_outdoor_traditional_latest";
                    const availText =
                      optAvail.status === "available"
                        ? "Available now"
                        : optAvail.status === "future" && optAvail.nextAvailableDate
                        ? `Next available ${formatDatePretty(optAvail.nextAvailableDate)}`
                        : "Currently unavailable";
                    return (
                      <div
                        key={o.id}
                        role="radio"
                        aria-checked={active}
                        tabIndex={0}
                        onClick={() => setValue("sauna_type_id", o.id, { shouldValidate: true })}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") {
                            e.preventDefault();
                            setValue("sauna_type_id", o.id, { shouldValidate: true });
                          }
                        }}
                        className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 cursor-pointer transition-colors ${
                          active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                              active ? "border-primary" : "border-muted-foreground/40"
                            }`}
                          >
                            {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="text-sm text-foreground truncate">{o.label}</div>
                              {isHighDemand && (
                                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                                  High demand
                                </span>
                              )}
                            </div>
                            <div
                              className={`text-xs truncate ${
                                optAvail.status === "available"
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {availText}
                            </div>
                          </div>
                        </div>
                        <a
                          href={o.productHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0"
                        >
                          Details <ExternalLink size={11} />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </Field>

              <Field label="Preferred installation date" error={errors.preferred_install_date?.message}>
                <Input
                  type="date"
                  min={minDate}
                  {...register("preferred_install_date")}
                />
                {availability.status === "future" && availability.nextAvailableDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Earliest availability: {formatDatePretty(availability.nextAvailableDate)}
                  </p>
                )}
              </Field>

              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={submitting !== null}
                >
                  {submitting === "reserve" ? "Working…" : "Pay $100 Reservation Deposit"}
                </Button>
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Reservation Deposit place a reservation on a sauna. This deposit is applied to lease payments.
                </p>
              </div>

              <div className="border-t border-border pt-4 text-center">
                <p className="text-sm text-muted-foreground">Have questions before reserving?</p>
                <button
                  type="button"
                  onClick={() => submit("consult")}
                  disabled={submitting !== null}
                  className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary disabled:opacity-60 mt-1"
                >
                  {submitting === "consult" ? "Working…" : "Book a free video consultation first"}
                </button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
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

export default ReservationModal;