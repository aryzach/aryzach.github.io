import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { rowToStatus, formatDatePretty, type PublicAvailabilityRow } from "@/lib/availability";
import { useReservationModal } from "@/contexts/ReservationModal";
import { useSEO } from "@/hooks/useSEO";

interface SaunaType {
  id: string;
  name: string;
  description: string;
  placement: "indoor" | "outdoor" | "either";
  reservation_fee_cents: number;
  stripe_payment_link: string;
  sort_order: number;
}

const placementLabel = (p: SaunaType["placement"]) =>
  p === "indoor" ? "Indoor" : p === "outdoor" ? "Outdoor" : "Indoor or Outdoor";

const ReservationSystem = () => {
  useSEO({
    title: "Reserve a Sauna — SF Sauna Rental",
    description: "Browse available sauna types and reserve yours. Steam and infrared saunas for indoor or outdoor use, delivered and installed in the SF Bay Area.",
  });

  const [types, setTypes] = useState<SaunaType[]>([]);
  const [availability, setAvailability] = useState<PublicAvailabilityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { open: openReservation } = useReservationModal();

  useEffect(() => {
    (async () => {
      const [typesRes, availRes] = await Promise.all([
        supabase.from("sauna_types").select("*").order("sort_order"),
        supabase.from("public_sauna_availability").select("*"),
      ]);
      if (typesRes.data) setTypes(typesRes.data as SaunaType[]);
      if (availRes.data) setAvailability(availRes.data as PublicAvailabilityRow[]);
      setLoading(false);
    })();
  }, []);

  const availabilityFor = (id: string) =>
    rowToStatus(availability.find((a) => a.sauna_type_id === id));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-4">
              Reserve Your Sauna
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose a sauna type below. Pay the reservation fee to hold your spot, then schedule your video consultation and installation.
            </p>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground">Loading availability…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {types.map((t) => {
                const avail = availabilityFor(t.id);
                const fee = `$${(t.reservation_fee_cents / 100).toFixed(0)}`;
                return (
                  <Card key={t.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-xl">{t.name}</CardTitle>
                        <Badge variant="outline">{placementLabel(t.placement)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col gap-4">
                      <p className="text-sm text-muted-foreground">{t.description}</p>

                      <div className="text-sm">
                        {avail.status === "available" && (
                          <span className="inline-flex items-center gap-2 text-primary font-medium">
                            <span className="w-2 h-2 rounded-full bg-primary" /> Available immediately
                          </span>
                        )}
                        {avail.status === "future" && avail.nextAvailableDate && (
                          <span className="text-foreground">
                            Next available: <span className="font-medium">{formatDatePretty(avail.nextAvailableDate)}</span>
                          </span>
                        )}
                        {avail.status === "unavailable" && (
                          <span className="text-muted-foreground">Currently unavailable</span>
                        )}
                      </div>

                      <div className="border-t border-border pt-4 text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reservation fee</span>
                          <span className="font-medium text-foreground">{fee}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Reservation fee is applied to monthly payments if you commit to 6+ months.
                        </p>
                      </div>

                      <Button
                        className="mt-auto"
                        onClick={() => openReservation({ saunaTypeId: t.id, source: "Pricing Page" })}
                        disabled={avail.status === "unavailable"}
                      >
                        Reserve
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReservationSystem;