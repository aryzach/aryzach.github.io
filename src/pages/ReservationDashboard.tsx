import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, Calendar, Check, Circle, Copy, ExternalLink, Eye, FileText, Loader2, Pencil, RefreshCw, Upload, Video } from "lucide-react";
import { RentalAgreementSheet } from "@/components/contract/RentalAgreementSheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";
import {
  CALCOM_VIDEO_CONSULT_LINK,
  CALCOM_INSTALLATION_LINK,
  RESERVATION_DEPOSIT_USD,
  buildStripeCheckoutUrl,
  getStripeReservationConfig,
} from "@/lib/reservationConfig";
import { saunaTypeLabel, SAUNA_TYPE_OPTIONS } from "@/lib/reservationSaunaTypes";
import { formatDatePretty } from "@/lib/availability";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Reservation {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  sauna_type_id: string;
  preferred_install_at: string;
  city: string | null;
  reservation_status: string;
  payment_status: string;
  consult_status: string;
  contract_status: string;
  id_status: string;
  hold_created_at: string | null;
  hold_deadline: string | null;
}

const ReservationDashboard = () => {
  useSEO({
    title: "Continue Your Reservation — SF Sauna Rental",
    description: "Complete your sauna reservation.",
  });

  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState(false);
  const idInputRef = useRef<HTMLInputElement>(null);
  const [idPhoto, setIdPhoto] = useState<{ url: string; name: string } | null>(null);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [contractStatus, setContractStatus] = useState<string | null>(null);
  const [stripeBaseLink, setStripeBaseLink] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaunaType, setEditSaunaType] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id || !token) {
      setError("This link is invalid.");
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.functions.invoke("reservation-get", {
      body: { id, token },
    });
    if (error || !data?.reservation) {
      setError("This reservation could not be found. Please check your link.");
    } else {
      setReservation(data.reservation as Reservation);
      setIdPhoto((data.id_photo as { url: string; name: string } | null) ?? null);
      setError(null);
    }
    setLoading(false);
  }, [id, token]);

  useEffect(() => { load(); }, [load]);

  // Load the active Stripe payment link once.
  useEffect(() => {
    getStripeReservationConfig().then((c) => setStripeBaseLink(c.baseLink)).catch(() => {});
  }, []);

  // Load contract status from contract-api so the dashboard row reflects
  // the current contract regardless of the reservation.contract_status field.
  const loadContract = useCallback(async () => {
    if (!id || !token) return;
    try {
      const { data } = await supabase.functions.invoke("contract-api", {
        body: { action: "get", id, token },
      });
      setContractStatus(data?.contract?.status ?? "Not Started");
    } catch { /* non-fatal */ }
  }, [id, token]);

  useEffect(() => { loadContract(); }, [loadContract]);

  // Poll for payment completion every 8s (up to ~10 minutes) while unpaid.
  useEffect(() => {
    if (!reservation) return;
    if (reservation.payment_status === "Paid") return;
    const started = Date.now();
    const interval = window.setInterval(() => {
      if (Date.now() - started > 10 * 60 * 1000) {
        window.clearInterval(interval);
        return;
      }
      load();
    }, 8000);
    return () => window.clearInterval(interval);
  }, [reservation, load]);

  const manualRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
      await loadContract();
    } finally {
      setRefreshing(false);
    }
  }, [load, loadContract]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Reservation link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const openEdit = () => {
    if (!reservation) return;
    setEditSaunaType(reservation.sauna_type_id);
    setEditDate(reservation.preferred_install_at.slice(0, 10));
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!id || !token || !reservation) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("reservation-update", {
        body: {
          id,
          token,
          sauna_type_id: editSaunaType,
          preferred_install_date: editDate,
        },
      });
      const err = (error as any)?.message || (data as any)?.error;
      if (err) throw new Error(err);
      toast.success("Reservation updated");
      setEditOpen(false);
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleIdFile = async (file: File) => {
    if (!id || !token) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }
    setUploadingId(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      const { error } = await supabase.functions.invoke("reservation-upload-id", {
        body: {
          id,
          token,
          file_name: file.name,
          content_type: file.type || "application/octet-stream",
          file_base64: base64,
        },
      });
      if (error) throw error;
      toast.success("Photo ID uploaded");
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Upload failed");
    } finally {
      setUploadingId(false);
      if (idInputRef.current) idInputRef.current.value = "";
    }
  };

  const paid = reservation?.payment_status === "Paid";
  const installScheduled = reservation?.reservation_status === "Reservation Confirmed";
  const stripeHref = useMemo(() => {
    if (!reservation || !stripeBaseLink) return "#";
    return buildStripeCheckoutUrl(stripeBaseLink, reservation.id, reservation.email);
  }, [reservation, stripeBaseLink]);
  const holdDeadlinePretty = reservation?.hold_deadline
    ? new Date(reservation.hold_deadline).toLocaleString(undefined, {
        dateStyle: "long",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {loading ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="animate-spin" size={18} /> Loading your reservation…
            </div>
          ) : error ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-foreground mb-4">{error}</p>
                <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
                  ← Back to pricing
                </Link>
              </CardContent>
            </Card>
          ) : reservation ? (
            <>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-2">
                {paid ? "Your sauna is temporarily reserved" : "Continue your reservation"}
              </h1>
              <p className="text-muted-foreground mb-8">
                {paid
                  ? "We'll be in touch after your video consultation to confirm final installation timing."
                  : "Complete all steps on this page to complete your reservation."}
              </p>

              {!paid && (
                <p className="text-sm text-muted-foreground mb-4">
                  Complete your $200 reservation payment to activate your temporary sauna hold.
                </p>
              )}
              {paid && holdDeadlinePretty && (
                <p className="text-sm text-foreground mb-4">
                  Your sauna is temporarily held. Hold deadline:{" "}
                  <span className="font-medium">{holdDeadlinePretty}</span>.
                </p>
              )}
              {paid && reservation?.reservation_status === "Needs Manual Review" && (
                <p className="text-sm text-foreground mb-4">
                  We received your $200 reservation payment and are confirming availability for
                  your requested installation date.
                </p>
              )}

              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium text-muted-foreground">
                      Reservation details
                    </CardTitle>
                    {contractStatus !== "Signed" && (
                      <Button size="sm" variant="ghost" onClick={openEdit}>
                        <Pencil className="mr-1.5" size={14} /> Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="text-sm space-y-1.5">
                  <Detail label="Sauna type" value={saunaTypeLabel(reservation.sauna_type_id)} />
                  <Detail
                    label="Preferred installation date"
                    value={formatDatePretty(reservation.preferred_install_at.slice(0, 10))}
                  />
                </CardContent>
              </Card>

              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-base font-medium text-muted-foreground">
                    Your next steps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <StepRow
                    done={paid}
                    label={`Pay $${RESERVATION_DEPOSIT_USD} reservation deposit`}
                    sublabel={
                      !paid
                        ? "Deposit applied to lease payments. We will confirm receipt within 24 hours."
                        : undefined
                    }
                    action={
                      !paid ? (
                        <Button asChild size="sm" disabled={!stripeBaseLink}>
                          <a href={stripeHref} target="_blank" rel="noopener noreferrer">
                            Pay <ExternalLink className="ml-1.5" size={14} />
                          </a>
                        </Button>
                      ) : null
                    }
                  />
                  <StepRow
                    done={reservation.consult_status === "Scheduled" || reservation.consult_status === "Complete"}
                    label="Schedule Video Consultation"
                    action={
                      <Button asChild size="sm" variant="outline">
                        <a href={CALCOM_VIDEO_CONSULT_LINK} target="_blank" rel="noopener noreferrer">
                          <Video className="mr-1.5" size={14} />
                          {reservation.consult_status === "Scheduled" || reservation.consult_status === "Complete"
                            ? "View / Reschedule"
                            : "Schedule"}
                        </a>
                      </Button>
                    }
                  />
                  <StepRow
                    done={reservation.id_status === "Complete"}
                    label="Upload Photo ID"
                    action={
                      <div className="flex items-center gap-2">
                        <input
                          ref={idInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleIdFile(f);
                          }}
                        />
                        {idPhoto && (
                          <Button asChild size="sm" variant="ghost">
                            <a href={idPhoto.url} target="_blank" rel="noopener noreferrer">
                              <Eye className="mr-1.5" size={14} /> View
                            </a>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => idInputRef.current?.click()}
                          disabled={uploadingId}
                        >
                          {uploadingId ? (
                            <Loader2 className="mr-1.5 animate-spin" size={14} />
                          ) : idPhoto ? (
                            <RefreshCw className="mr-1.5" size={14} />
                          ) : (
                            <Upload className="mr-1.5" size={14} />
                          )}
                          {uploadingId ? "Uploading…" : idPhoto ? "Replace" : "Upload"}
                        </Button>
                      </div>
                    }
                  />
                  <StepRow
                    done={contractStatus === "Signed"}
                    label="Complete Rental Agreement"
                    action={
                      <div className="flex items-center gap-2">
                        {contractStatus && contractStatus !== "Not Started" && contractStatus !== "Signed" && (
                          <span className="text-xs text-muted-foreground">{contractStatus}</span>
                        )}
                        <Button
                          size="sm"
                          variant={contractStatus === "Signed" ? "ghost" : "outline"}
                          onClick={() => setAgreementOpen(true)}
                        >
                          <FileText className="mr-1.5" size={14} />
                          {contractStatus === "Signed" ? "View"
                            : contractStatus === "Draft Created" || contractStatus === "Ready to Sign"
                              ? "Review & Sign"
                              : "Start"}
                        </Button>
                      </div>
                    }
                  />
                  <StepRow
                    done={installScheduled}
                    label="Schedule Installation Date"
                    action={
                      <Button asChild size="sm" variant="outline">
                        <a href={CALCOM_INSTALLATION_LINK} target="_blank" rel="noopener noreferrer">
                          <Calendar className="mr-1.5" size={14} />
                          {installScheduled ? "View / Reschedule" : "Schedule"}
                        </a>
                      </Button>
                    }
                  />
                  <StepRow
                    done={false}
                    label="Connect to ACH"
                    sublabel="Save 3% and avoid credit card fees"
                    action={
                      <Button asChild size="sm" variant="outline">
                        <a
                          href="https://connect.plaid.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Banknote className="mr-1.5" size={14} />
                          Connect
                        </a>
                      </Button>
                    }
                  />
                </CardContent>
              </Card>

              <Button variant="outline" className="w-full" onClick={copyLink}>
                <Copy className="mr-2" size={16} /> Copy Reservation Link
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2"
                onClick={manualRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="mr-2 animate-spin" size={14} />
                ) : (
                  <RefreshCw className="mr-2" size={14} />
                )}
                Refresh Status
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Save this private reservation link.
              </p>
            </>
          ) : null}
        </div>
      </main>
      <Footer />
      {reservation && (
        <RentalAgreementSheet
          open={agreementOpen}
          onOpenChange={setAgreementOpen}
          reservationId={reservation.id}
          token={token}
          onSaved={loadContract}
        />
      )}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit reservation</DialogTitle>
            <DialogDescription>
              Update your sauna type or preferred installation date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Sauna type</Label>
              <Select
                value={editSaunaType}
                onValueChange={setEditSaunaType}
                disabled={reservation?.payment_status === "Paid"}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SAUNA_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reservation?.payment_status === "Paid" && (
                <p className="text-xs text-muted-foreground">
                  Sauna type can't be changed after your deposit is paid. Contact us for help.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-install-date">Preferred installation date</Label>
              <Input
                id="edit-install-date"
                type="date"
                value={editDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 animate-spin" size={14} />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-4">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-medium text-right">{value}</span>
  </div>
);

const StepRow = ({
  done,
  label,
  sublabel,
  action,
}: {
  done: boolean;
  label: string;
  sublabel?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 text-sm py-1">
    {done ? (
      <span
        aria-label="Complete"
        className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-500 text-white shrink-0"
      >
        <Check size={16} strokeWidth={3} />
      </span>
    ) : (
      <Circle className="text-muted-foreground shrink-0" size={22} strokeWidth={1.5} />
    )}
    <div className="flex-grow min-w-0">
      <div className={done ? "text-foreground font-medium" : "text-muted-foreground"}>
        {label}
      </div>
      {sublabel && (
        <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
          {sublabel}
        </div>
      )}
    </div>
    {action}
  </div>
);

export default ReservationDashboard;