import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { rowToStatus, type AvailabilityStatus, type PublicAvailabilityRow } from "@/lib/availability";

export function useAvailability() {
  const [rows, setRows] = useState<PublicAvailabilityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("public_sauna_availability").select("*");
      if (data) setRows(data as PublicAvailabilityRow[]);
      setLoading(false);
    })();
  }, []);

  const getStatus = (saunaTypeId: string | null): AvailabilityStatus =>
    rowToStatus(saunaTypeId ? rows.find((r) => r.sauna_type_id === saunaTypeId) : undefined);

  const getStatusForIds = (ids: (string | null)[]): AvailabilityStatus => {
    const relevant = rows.filter((r) => ids.includes(r.sauna_type_id));
    const totalNow = relevant.reduce((sum, r) => sum + (r.available_now || 0), 0);
    if (totalNow > 0) {
      return { availableToday: totalNow, nextAvailableDate: null, status: "available" };
    }
    const futureDates = relevant
      .map((r) => r.next_available_date)
      .filter((d): d is string => !!d)
      .sort();
    if (futureDates.length) {
      return { availableToday: 0, nextAvailableDate: futureDates[0], status: "future" };
    }
    return { availableToday: 0, nextAvailableDate: null, status: "unavailable" };
  };

  return { getStatus, getStatusForIds, loading };
}