import { useCallback, useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ChevronLeft, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  SAUNA_TYPES,
  COMMITMENT_MONTHS,
  INSURANCE_MONTHLY,
  SECOND_HEATER_MONTHLY,
  getMonthlyPrice,
  getSaunaTypeInfo,
  getSecurityDeposit,
  getDeliveryFee,
  isSanFranciscoAddress,
  formatUSD,
  commitmentLabel,
} from "@/lib/contractConfig";
import { RentalSummaryPreview } from "./RentalSummaryPreview";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationId: string;
  token: string;
  onSaved?: () => void;
}

type Step = "configure" | "preview";

interface FormState {
  customer_legal_name: string;
  phone: string;
  email: string;
  installation_address: string;
  sauna_type: string;
  commitment_months: number;
  insurance_selected: boolean;
  second_heater_selected: boolean;
  preferred_installation_date: string; // YYYY-MM-DD
}

const empty: FormState = {
  customer_legal_name: "",
  phone: "",
  email: "",
  installation_address: "",
  sauna_type: "",
  commitment_months: 6,
  insurance_selected: false,
  second_heater_selected: false,
  preferred_installation_date: "",
};

export const RentalAgreementSheet = ({ open, onOpenChange, reservationId, token, onSaved }: Props) => {
  const [step, setStep] = useState<Step>("configure");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [activeVersion, setActiveVersion] = useState<string>("");
  const [contract, setContract] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("contract-api", {
        body: { action: "get", id: reservationId, token },
      });
      if (error) throw error;
      const r = data.reservation;
      const c = data.contract;
      setActiveVersion(data.active_agreement_version?.version_name ?? "");
      setContract(c ?? null);
      // Prefill from existing draft when present, otherwise from reservation.
      setForm({
        customer_legal_name: c?.customer_legal_name ?? `${r.first_name} ${r.last_name}`.trim(),
        phone: c?.phone ?? r.phone ?? "",
        email: c?.email ?? r.email ?? "",
        installation_address: c?.installation_address ?? r.install_address ?? "",
        sauna_type: c?.rental_summary_snapshot?.sauna_type_id ?? r.sauna_type_id ?? "",
        commitment_months: c?.commitment_months ?? r.min_commitment_months ?? 6,
        insurance_selected: !!c?.insurance_selected,
        second_heater_selected: !!c?.second_heater_selected,
        preferred_installation_date:
          c?.preferred_installation_date ??
          (r.preferred_install_at ? String(r.preferred_install_at).slice(0, 10) : ""),
      });
      setStep(c ? "preview" : "configure");
    } catch (e) {
      toast.error((e as Error).message || "Failed to load contract");
    } finally {
      setLoading(false);
    }
  }, [reservationId, token]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const saunaInfo = useMemo(() => getSaunaTypeInfo(form.sauna_type), [form.sauna_type]);
  const monthlyPrice = useMemo(
    () => (form.sauna_type ? getMonthlyPrice(form.sauna_type, form.commitment_months) : null),
    [form.sauna_type, form.commitment_months],
  );
  const deliveryFee = useMemo(() => getDeliveryFee(form.installation_address), [form.installation_address]);
  const securityDeposit = useMemo(
    () => (form.sauna_type ? getSecurityDeposit(form.sauna_type) : 0),
    [form.sauna_type],
  );
  const isSf = isSanFranciscoAddress(form.installation_address);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const validate = (): string | null => {
    if (form.customer_legal_name.trim().length < 2) return "Please enter your legal name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Please enter a valid email.";
    if (form.installation_address.trim().length < 5) return "Please enter your installation address.";
    if (!saunaInfo) return "Please choose a sauna type.";
    if (!form.preferred_installation_date) return "Please choose a preferred installation date.";
    return null;
  };

  const generate = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("contract-api", {
        body: {
          action: "save_draft",
          id: reservationId,
          token,
          customer_legal_name: form.customer_legal_name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          installation_address: form.installation_address.trim(),
          sauna_type: form.sauna_type,
          commitment_months: form.commitment_months,
          insurance_selected: form.insurance_selected,
          second_heater_selected: form.second_heater_selected && (saunaInfo?.allowsSecondHeater ?? false),
          preferred_installation_date: form.preferred_installation_date,
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setContract(data.contract);
      if (data.flags?.includes?.("sauna_type_changed_from_reservation")) {
        toast.warning(
          "Sauna type changed from your reservation. Our team will confirm inventory before your installation.",
        );
      } else {
        toast.success("Draft agreement generated");
      }
      setStep("preview");
      onSaved?.();
    } catch (e) {
      toast.error((e as Error).message || "Could not generate the draft");
    } finally {
      setSaving(false);
    }
  };

  const saunaTypeMismatch = form.sauna_type && contract?.rental_summary_snapshot?.flags?.includes?.("sauna_type_changed_from_reservation");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto p-0">
        <SheetHeader className="px-5 md:px-8 pt-6 pb-4 border-b border-border sticky top-0 bg-background z-10">
          <SheetTitle className="text-xl md:text-2xl">Configure Your Rental Agreement</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Review your details, then generate a draft to preview before signing.
          </p>
        </SheetHeader>

        <div className="px-5 md:px-8 py-6 pb-32">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="animate-spin" size={16} /> Loading…
            </div>
          ) : step === "configure" ? (
            <ConfigureStep
              form={form}
              set={set}
              saunaInfo={saunaInfo}
              monthlyPrice={monthlyPrice}
              deliveryFee={deliveryFee}
              securityDeposit={securityDeposit}
              isSf={isSf}
              activeVersion={activeVersion}
            />
          ) : contract ? (
            <PreviewStep
              contract={contract}
              onEdit={() => setStep("configure")}
              mismatchFlag={!!saunaTypeMismatch}
            />
          ) : null}
        </div>

        {!loading && (
          <div className="fixed bottom-0 left-0 right-0 sm:absolute bg-background/95 backdrop-blur border-t border-border px-5 md:px-8 py-4 flex items-center justify-between gap-3">
            {step === "configure" ? (
              <>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
                <Button onClick={generate} disabled={saving}>
                  {saving ? <><Loader2 className="mr-2 animate-spin" size={16} /> Generating…</> : (
                    <><Sparkles className="mr-2" size={16} /> Generate Agreement</>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setStep("configure")}>
                  <ChevronLeft className="mr-1" size={16} /> Edit Agreement
                </Button>
                <Button disabled title="Signing available soon">
                  Continue to Sign
                </Button>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

// ---------- Configure step ----------
const ConfigureStep = ({
  form, set, saunaInfo, monthlyPrice, deliveryFee, securityDeposit, isSf, activeVersion,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  saunaInfo: ReturnType<typeof getSaunaTypeInfo>;
  monthlyPrice: number | null;
  deliveryFee: number;
  securityDeposit: number;
  isSf: boolean;
  activeVersion: string;
}) => {
  const showSecondHeater = saunaInfo?.allowsSecondHeater ?? false;
  return (
    <div className="space-y-8">
      <Section title="Customer information">
        <Field label="Legal name">
          <Input value={form.customer_legal_name} onChange={(e) => set("customer_legal_name", e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
        </div>
        <Field label="Installation address">
          <Input value={form.installation_address} onChange={(e) => set("installation_address", e.target.value)} />
        </Field>
        <Field label="Preferred installation date">
          <Input type="date" value={form.preferred_installation_date} onChange={(e) => set("preferred_installation_date", e.target.value)} />
        </Field>
      </Section>

      <Section title="Sauna">
        <Field label="Sauna type">
          <Select value={form.sauna_type} onValueChange={(v) => {
            set("sauna_type", v);
            const info = getSaunaTypeInfo(v);
            if (info && !info.allowsSecondHeater) set("second_heater_selected", false);
          }}>
            <SelectTrigger><SelectValue placeholder="Choose a sauna type" /></SelectTrigger>
            <SelectContent>
              {SAUNA_TYPES.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section title="Term & pricing">
        <Field label="Initial commitment">
          <div className="grid grid-cols-4 gap-2">
            {COMMITMENT_MONTHS.map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => set("commitment_months", m)}
                className={`h-10 rounded-md border text-sm font-medium transition ${
                  form.commitment_months === m
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/60"
                }`}
              >
                {commitmentLabel(m)}
              </button>
            ))}
          </div>
        </Field>
        <div className="rounded-md border border-border divide-y divide-border bg-card">
          <PriceRow
            label="Monthly rental"
            value={monthlyPrice != null ? `${formatUSD(monthlyPrice)} / month` : "—"}
          />
          <PriceRow
            label="Delivery fee"
            value={formatUSD(deliveryFee)}
            hint={isSf ? "Free within San Francisco" : "Outside San Francisco"}
          />
          <PriceRow label="Security deposit" value={formatUSD(securityDeposit)} hint="Refundable" />
          <PriceRow label="Stair / elevator charge" value="To be confirmed before delivery" muted />
        </div>
      </Section>

      <Section title="Optional coverage">
        <ToggleRow
          selected={form.insurance_selected}
          onChange={(v) => set("insurance_selected", v)}
          title="Add optional insurance"
          price={`${formatUSD(INSURANCE_MONTHLY)} / month`}
          description="Coverage applies only to specified natural-event damage and does not cover negligence, misuse, unauthorized modifications, or failure to follow instructions."
        />
        {showSecondHeater && (
          <ToggleRow
            selected={form.second_heater_selected}
            onChange={(v) => set("second_heater_selected", v)}
            title="Add optional second heater"
            price={`${formatUSD(SECOND_HEATER_MONTHLY)} / month`}
            description="A second heater requires an additional suitable outlet or electrical circuit and remains subject to SF Sauna confirming electrical compatibility."
          />
        )}
      </Section>

      {activeVersion && (
        <p className="text-xs text-muted-foreground">
          Master Agreement: <span className="text-foreground font-medium">{activeVersion}</span>
        </p>
      )}
    </div>
  );
};

// ---------- Preview step ----------
const PreviewStep = ({
  contract, onEdit, mismatchFlag,
}: { contract: any; onEdit: () => void; mismatchFlag: boolean }) => {
  return (
    <div className="space-y-6">
      {mismatchFlag && (
        <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 text-amber-900 p-3 text-sm">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            You chose a different sauna type than your original reservation. Our team will confirm inventory
            before your installation.
          </span>
        </div>
      )}
      <RentalSummaryPreview summary={contract.rental_summary_snapshot} />

      <Card>
        <CardContent className="pt-5">
          <h3 className="text-sm font-semibold mb-1">Master Rental Agreement</h3>
          <p className="text-sm text-muted-foreground mb-3">
            The full Master Agreement will be attached behind this Rental Summary in the final signed PDF.
          </p>
          <p className="text-xs text-muted-foreground">
            Signing this agreement will be available in the next step.
          </p>
        </CardContent>
      </Card>

      <div>
        <button
          onClick={onEdit}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Need to change something? Edit the agreement
        </button>
      </div>
    </div>
  );
};

// ---------- Small helpers ----------
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    {children}
  </section>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);

const PriceRow = ({ label, value, hint, muted }: { label: string; value: string; hint?: string; muted?: boolean }) => (
  <div className="flex items-center justify-between px-3 py-2.5 text-sm">
    <div>
      <div className="text-foreground">{label}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
    <div className={muted ? "text-muted-foreground" : "text-foreground font-medium"}>{value}</div>
  </div>
);

const ToggleRow = ({
  selected, onChange, title, price, description,
}: {
  selected: boolean;
  onChange: (v: boolean) => void;
  title: string;
  price: string;
  description: string;
}) => (
  <div className={`rounded-md border p-3 ${selected ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4"
      />
      <div className="flex-grow">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">{title}</span>
          <span className="text-sm text-foreground">{price}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  </div>
);