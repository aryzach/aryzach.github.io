import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle2, Circle, Copy, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";
import { buildStripeCheckoutUrl, CALCOM_VIDEO_CONSULT_LINK } from "@/lib/reservationConfig";
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
                  <Detail label="$100 reservation deposit" value={paid ? "Complete" : "Pending"} />
                  {paid && reservation.hold_deadline && (
                    <Detail
                      label="Reservation hold deadline"
                      value={new Date(reservation.hold_deadline).toLocaleString("en-US", {
                        month: "long", day: "numeric", year: "numeric",
                        hour: "numeric", minute: "2-digit",
                      })}
                    />
                  )}
                </CardContent>
              </Card>

              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-base font-medium text-muted-foreground">
                    Your next steps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  <ChecklistItem done={paid} label="$100 reservation deposit" />
                  <ChecklistItem
                    done={reservation.consult_status === "Scheduled" || reservation.consult_status === "Complete"}
                    label="Video Consultation Scheduled"
                  />
                  <ChecklistItem done={reservation.id_status === "Complete"} label="Photo ID uploaded" />
                  <ChecklistItem done={reservation.contract_status === "Complete"} label="Contract Complete" />
                  <ChecklistItem done={installScheduled} label="Installation Date Scheduled" />
                </CardContent>
              </Card>

              {!paid ? (
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <Button asChild size="lg" className="w-full">
                      <a
                        href={buildStripeCheckoutUrl(reservation.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Complete Payment <ExternalLink className="ml-2" size={16} />
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full" onClick={copyLink}>
                      <Copy className="mr-2" size={16} /> Copy Reservation Link
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Save this private reservation link.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                    <Button asChild size="lg" className="w-full">
                      <a href={CALCOM_VIDEO_CONSULT_LINK} target="_blank" rel="noopener noreferrer">
                        <Calendar className="mr-2" size={16} />
                        Schedule Video Consultation
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full" onClick={copyLink}>
                      <Copy className="mr-2" size={16} /> Copy Reservation Link
                    </Button>
                </div>
              )}
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

const ChecklistItem = ({ done, label }: { done: boolean; label: string }) => (
  <div className="flex items-center gap-2.5 text-sm">
    {done ? (
      <CheckCircle2 className="text-primary shrink-0" size={18} />
    ) : (
      <Circle className="text-muted-foreground shrink-0" size={18} />
    )}
    <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
  </div>
);

export default ReservationDashboard;