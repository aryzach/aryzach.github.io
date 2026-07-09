import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ExternalLink, Calendar, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resolveStripeLink, CALCOM_VIDEO_CONSULT_LINK, CALCOM_INSTALLATION_LINK } from "@/lib/reservationConfig";
import { useSEO } from "@/hooks/useSEO";

const ReservationConfirmation = () => {
  useSEO({
    title: "Reservation Received — SF Sauna Rental",
    description: "Complete your reservation by paying the reservation fee and scheduling your video consultation and installation.",
  });

  const [params] = useSearchParams();
  const reservationId = params.get("id");
  const typeId = params.get("type");
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!typeId) return;
      const { data } = await supabase
        .from("sauna_types")
        .select("stripe_payment_link")
        .eq("id", typeId)
        .single();
      if (data) setPaymentLink(resolveStripeLink(data.stripe_payment_link));
    })();
  }, [typeId]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="text-primary" size={32} />
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground">
              Reservation received
            </h1>
          </div>
          <p className="text-muted-foreground mb-8">
            Thanks! Your reservation has been submitted. Payment must be completed to hold your sauna. After completing payment, schedule your video consultation and installation below.
          </p>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1. Pay reservation fee</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" disabled={!paymentLink}>
                  <a
                    href={paymentLink ? `${paymentLink}?client_reference_id=${reservationId ?? ""}` : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pay Reservation Fee
                    <ExternalLink className="ml-2" size={16} />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">2. Schedule video consultation</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <a href={CALCOM_VIDEO_CONSULT_LINK} target="_blank" rel="noopener noreferrer">
                    <Calendar className="mr-2" size={16} />
                    Schedule Video Consultation
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">3. Schedule installation</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <a href={CALCOM_INSTALLATION_LINK} target="_blank" rel="noopener noreferrer">
                    <Wrench className="mr-2" size={16} />
                    Schedule Installation
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Please schedule your installation at least 2 days after your video consultation.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Link to="/reservation-system" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to reservation options
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReservationConfirmation;