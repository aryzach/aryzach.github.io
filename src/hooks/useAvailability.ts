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

  return { getStatus, loading };
}