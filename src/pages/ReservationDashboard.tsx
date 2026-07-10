import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Check, Circle, Copy, ExternalLink, Eye, FileText, Loader2, RefreshCw, Upload, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";
import {
  buildStripeCheckoutUrl,
  CALCOM_VIDEO_CONSULT_LINK,
  CALCOM_INSTALLATION_LINK,
} from "@/lib/reservationConfig";
import { saunaTypeLabel } from "@/lib/reservationSaunaTypes";
import { formatDatePretty } from "@/lib/availability";

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

  // Auto-refresh once when returning (in case payment just completed).
  useEffect(() => {
    const t = setTimeout(() => { load(); }, 4000);
    return () => clearTimeout(t);
  }, [load]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Reservation link copied");
    } catch {
      toast.error("Could not copy link");
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
                  : "Complete your $100 reservation payment to activate your temporary reservation hold."}
              </p>

              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium text-muted-foreground">
                    Reservation details
                  </CardTitle>
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
                    label="Pay $100 reservation deposit"
                    action={
                      !paid ? (
                        <Button asChild size="sm">
                          <a href={buildStripeCheckoutUrl(reservation.id)} target="_blank" rel="noopener noreferrer">
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
                    done={reservation.contract_status === "Complete"}
                    label="Complete Lease Agreement"
                    action={
                      reservation.contract_status !== "Complete" ? (
                        <span className="text-xs text-muted-foreground">
                          <FileText className="inline mr-1" size={12} />
                          We'll email you
                        </span>
                      ) : null
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
                </CardContent>
              </Card>

              <Button variant="outline" className="w-full" onClick={copyLink}>
                <Copy className="mr-2" size={16} /> Copy Reservation Link
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Save this private reservation link.
              </p>
            </>
          ) : null}
        </div>
      </main>
      <Footer />
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
  action,
}: {
  done: boolean;
  label: string;
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
    <span className={`flex-grow ${done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
      {label}
    </span>
    {action}
  </div>
);

export default ReservationDashboard;