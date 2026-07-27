// Shared helper for the customers table.
//
// Every reservation should map to exactly one customer row. This helper looks
// one up by `reservation_id` and creates it on the fly if missing.

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

export async function getOrCreateCustomerForReservation(
  supabase: SupabaseClient,
  reservationId: string,
): Promise<{ id: string; name: string }> {
  const { data: existing, error: findErr } = await supabase
    .from("customers")
    .select("id, name")
    .eq("reservation_id", reservationId)
    .maybeSingle();
  if (findErr) throw findErr;
  if (existing) return existing;

  const { data: r, error: rErr } = await supabase
    .from("reservations")
    .select("first_name, last_name, email, phone, install_address, city")
    .eq("id", reservationId)
    .maybeSingle();
  if (rErr) throw rErr;
  if (!r) throw new Error("Reservation not found");

  const first = (r.first_name ?? "").trim();
  const last = (r.last_name ?? "").trim();
  const name = `${first} ${last}`.trim() || r.email || "Unknown";

  const { data: created, error: insErr } = await supabase
    .from("customers")
    .insert({
      name,
      first_name: first || null,
      last_name: last || null,
      email: r.email || null,
      phone: r.phone || null,
      install_address: r.install_address || null,
      city: r.city || null,
      reservation_id: reservationId,
    })
    .select("id, name")
    .single();
  if (insErr) throw insErr;
  return created;
}

export async function lookupCustomerName(
  supabase: SupabaseClient,
  customerId: string | null,
): Promise<string | null> {
  if (!customerId) return null;
  const { data } = await supabase
    .from("customers")
    .select("name")
    .eq("id", customerId)
    .maybeSingle();
  return data?.name ?? null;
}