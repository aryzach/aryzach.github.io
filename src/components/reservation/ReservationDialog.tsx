import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { AvailabilityStatus } from "@/lib/availability";
import { formatDatePretty } from "@/lib/availability";

interface SaunaTypeLite {
  id: string;
  name: string;
  placement: "indoor" | "outdoor" | "either";
  reservation_fee_cents: number;
}

const schema = z.object({
  first_name: z.string().trim().min(1, "Required").max(80),
  last_name: z.string().trim().min(1, "Required").max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(5, "Required").max(40),
  install_address: z.string().trim().min(5, "Required").max(300),
  placement_choice: z.enum(["indoor", "outdoor"]),
  access_notes: z.string().trim().max(500).optional().default(""),
  min_commitment_months: z.enum(["1", "3", "6", "12"]),
  preferred_install_at: z.string().min(1, "Required"),
  ack_consult: z.boolean().refine((v) => v === true, { message: "Required" }),
  ack_fee_applied: z.boolean().refine((v) => v === true, { message: "Required" }),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  saunaType: SaunaTypeLite;
  availability: AvailabilityStatus;
  onClose: () => void;
}

const ReservationDialog = ({ saunaType, availability, onClose }: Props) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const defaultPlacement: "indoor" | "outdoor" =
    saunaType.placement === "outdoor" ? "outdoor" : "indoor";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      placement_choice: defaultPlacement,
      min_commitment_months: "6",
      access_notes: "",
    } as Partial<FormValues> as FormValues,
  });

  const minInstallDate = availability.status === "future" && availability.nextAvailableDate
    ? availability.nextAvailableDate
    : new Date().toISOString().slice(0, 10);

  const onSubmit = async (values: FormValues) => {
    // Extra validation: install date >= next available (when not available today)
    if (availability.status === "future" && availability.nextAvailableDate) {
      const installDate = values.preferred_install_at.slice(0, 10);
      if (installDate < availability.nextAvailableDate) {
        toast.error(
          `Preferred install date must be on or after ${formatDatePretty(availability.nextAvailableDate)}.`,
        );
        return;
      }
    }
    if (availability.status === "unavailable") {
      toast.error("This sauna type is currently unavailable.");
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.rpc("create_reservation_with_hold", {
      p_sauna_type_id: saunaType.id,
      p_first_name: values.first_name,
      p_last_name: values.last_name,
      p_email: values.email,
      p_phone: values.phone,
      p_install_address: values.install_address,
      p_placement_choice: values.placement_choice,
      p_access_notes: values.access_notes || "",
      p_min_commitment_months: parseInt(values.min_commitment_months, 10),
      p_preferred_install_at: new Date(values.preferred_install_at).toISOString(),
    } as never) as { data: string | null; error: { message: string } | null };

    setSubmitting(false);

    if (error || !data) {
      console.error(error);
      toast.error(error?.message || "Could not submit reservation. Please try again.");
      return;
    }

    navigate(`/reservation-confirmation?id=${data}&type=${saunaType.id}`);
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reserve: {saunaType.name}</DialogTitle>
          <DialogDescription>
            Reservation fee: ${(saunaType.reservation_fee_cents / 100).toFixed(0)}. Applied to monthly payments if you commit to 6+ months.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" {...register("first_name")} />
              {errors.first_name && <p className="text-xs text-destructive mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" {...register("last_name")} />
              {errors.last_name && <p className="text-xs text-destructive mt-1">{errors.last_name.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <Label htmlFor="install_address">Install address</Label>
            <Input id="install_address" {...register("install_address")} />
            {errors.install_address && <p className="text-xs text-destructive mt-1">{errors.install_address.message}</p>}
          </div>

          {saunaType.placement === "either" && (
            <div>
              <Label>Placement</Label>
              <RadioGroup
                value={watch("placement_choice")}
                onValueChange={(v) => setValue("placement_choice", v as "indoor" | "outdoor")}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="indoor" id="indoor" />
                  <Label htmlFor="indoor" className="font-normal">Indoor</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="outdoor" id="outdoor" />
                  <Label htmlFor="outdoor" className="font-normal">Outdoor</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <div>
            <Label htmlFor="access_notes">Stairs / elevator / access notes</Label>
            <Textarea id="access_notes" rows={2} {...register("access_notes")} />
          </div>

          <div>
            <Label>Minimum commitment length</Label>
            <Select
              value={watch("min_commitment_months")}
              onValueChange={(v) => setValue("min_commitment_months", v as FormValues["min_commitment_months"])}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 month</SelectItem>
                <SelectItem value="3">3 months</SelectItem>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">12 months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="preferred_install_at">Preferred installation date & time</Label>
            <Input
              id="preferred_install_at"
              type="datetime-local"
              min={`${minInstallDate}T00:00`}
              {...register("preferred_install_at")}
            />
            {availability.status === "future" && availability.nextAvailableDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Earliest available: {formatDatePretty(availability.nextAvailableDate)}
              </p>
            )}
            {errors.preferred_install_at && <p className="text-xs text-destructive mt-1">{errors.preferred_install_at.message}</p>}
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={watch("ack_consult") || false}
                onCheckedChange={(c) => setValue("ack_consult", c === true, { shouldValidate: true })}
              />
              <span>
                Final installation timing is subject to video consultation and manual confirmation. Please schedule your installation at least 2 days after your video consultation.
              </span>
            </label>
            {errors.ack_consult && <p className="text-xs text-destructive">{errors.ack_consult.message}</p>}

            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={watch("ack_fee_applied") || false}
                onCheckedChange={(c) => setValue("ack_fee_applied", c === true, { shouldValidate: true })}
              />
              <span>Reservation fee is applied to monthly payments if you commit to 6+ months.</span>
            </label>
            {errors.ack_fee_applied && <p className="text-xs text-destructive">{errors.ack_fee_applied.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Submitting…" : "Continue to payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationDialog;