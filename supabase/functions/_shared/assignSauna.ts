// Shared sauna auto-assignment logic.
//
// Rules:
// - A reservation is always assigned to the sauna of its type that becomes
//   available the soonest.
// - The reservation always lands in the FUTURE customer columns.
// - The CURRENT customer columns are never written by automation; they are
//   admin-managed only.

// deno-lint-ignore no-explicit-any
type Client = any;

export interface AssignResult {
  sauna: any | null;
  reason?: string;
}

const FAR_FUTURE = "9999-12-31";

function effectiveDate(row: any): string {
  if (row.status === "Available") return "0000-01-01";
  return row.available_date ?? FAR_FUTURE;
}

/**
 * Finds the sauna of the reservation's type that frees up soonest and has no
 * future customer yet, then books the reservation into the future-customer
 * columns. Never touches current_customer / current_customer_id.
 */
export async function assignSoonestSauna(
  supabase: Client,
  reservation: { id: string; sauna_type_id: string; first_name?: string | null; last_name?: string | null; email?: string | null },
  opts: { holdStatus?: string } = {},
): Promise<AssignResult> {
  const holdStatus = opts.holdStatus ?? "Reservation Hold";

  const { data: type } = await supabase
    .from("sauna_types")
    .select("style, model_key, location")
    .eq("id", reservation.sauna_type_id)
    .maybeSingle();
  if (!type) return { sauna: null, reason: "unknown_type" };

  const { data: candidates } = await supabase
    .from("sauna_inventory")
    .select("*")
    .eq("style", type.style)
    .eq("model_key", type.model_key)
    .contains("locations", [type.location])
    .is("future_customer_id", null);

  const eligible = (candidates ?? [])
    // Sold / cancelled-out units can never be handed to a new customer.
    .filter((c: any) => !["Sold", "Cancelled", "Refunded"].includes(c.status))
    // Must either be available now or have a known availability date.
    .filter((c: any) => c.status === "Available" || c.available_date)
    // Don't double-book the same reservation onto two units.
    .filter((c: any) => c.current_customer_id !== reservation.id)
    .sort((a: any, b: any) => {
      const ad = effectiveDate(a);
      const bd = effectiveDate(b);
      if (ad !== bd) return ad < bd ? -1 : 1;
      return String(a.created_at).localeCompare(String(b.created_at));
    });

  const pick = eligible[0];
  if (!pick) return { sauna: null, reason: "no_eligible_sauna" };

  const customerName =
    `${(reservation.first_name ?? "").trim()} ${(reservation.last_name ?? "").trim()}`.trim() ||
    reservation.email ||
    null;

  // If the unit still has a current customer, this is a planned transfer.
  const nextStatus = pick.current_customer_id ? "Transfer Planned" : holdStatus;

  const { data: updated, error } = await supabase
    .from("sauna_inventory")
    .update({
      status: nextStatus,
      future_customer_id: reservation.id,
      future_customer: customerName,
    })
    .eq("id", pick.id)
    .is("future_customer_id", null)
    .select()
    .maybeSingle();

  if (error || !updated) return { sauna: null, reason: "assignment_failed" };
  return { sauna: updated };
}

/**
 * Adds a qualifying reservation (deposit paid or contract signed) to the
 * waitlist. Idempotent per reservation.
 */
export async function addReservationToWaitlist(
  supabase: Client,
  reservation: any,
  reason: string,
) {
  const city = reservation.city ?? null;
  const pref = reservation.preferred_install_at
    ? String(reservation.preferred_install_at).slice(0, 10)
    : null;
  const { error } = await supabase.from("waitlist_entries").upsert(
    {
      reservation_id: reservation.id,
      first_name: reservation.first_name ?? "",
      last_name: reservation.last_name ?? "",
      email: reservation.email ?? "",
      phone: reservation.phone ?? null,
      city,
      sauna_type_id: reservation.sauna_type_id,
      preferred_install_date: pref,
      reservation_source: reservation.reservation_source ?? "Unknown",
      status: "Open",
      reason,
    },
    { onConflict: "reservation_id" },
  );
  if (error) console.error("waitlist upsert failed:", error);
}

/** Marks a reservation's waitlist entry as converted once it gets a sauna. */
export async function convertWaitlistEntry(supabase: Client, reservationId: string) {
  await supabase
    .from("waitlist_entries")
    .update({ status: "Converted" })
    .eq("reservation_id", reservationId)
    .eq("status", "Open");
}

/**
 * After a contract is signed: sync the reservation's sauna type to the signed
 * contract, release any future assignment of a different type, then assign a
 * matching sauna or add them to the waitlist.
 */
export async function syncSaunaAfterContract(
  supabase: Client,
  reservationId: string,
  contractSaunaTypeId: string | null,
) {
  const { data: reservation } = await supabase
    .from("reservations").select("*").eq("id", reservationId).maybeSingle();
  if (!reservation) return;

  if (contractSaunaTypeId && contractSaunaTypeId !== reservation.sauna_type_id) {
    await supabase.from("reservations")
      .update({ sauna_type_id: contractSaunaTypeId }).eq("id", reservationId);
    reservation.sauna_type_id = contractSaunaTypeId;
  }

  // Current customers are admin-managed; leave them alone.
  const { data: currentUnit } = await supabase.from("sauna_inventory")
    .select("id").eq("current_customer_id", reservationId).maybeSingle();
  if (currentUnit) return;

  const { data: futureUnit } = await supabase.from("sauna_inventory")
    .select("*").eq("future_customer_id", reservationId).maybeSingle();

  if (futureUnit) {
    if (futureUnit.sauna_type_id === reservation.sauna_type_id) {
      await convertWaitlistEntry(supabase, reservationId);
      return;
    }
    // Wrong type — release it.
    await supabase.from("sauna_inventory").update({
      future_customer_id: null,
      future_customer: null,
      status: futureUnit.current_customer_id ? "Installed" : "Available",
    }).eq("id", futureUnit.id);
    await supabase.from("reservations")
      .update({ sauna_inventory_id: null }).eq("id", reservationId);
  }

  const { sauna } = await assignSoonestSauna(supabase, reservation, {
    holdStatus: "Reservation Confirmed",
  });
  if (sauna) {
    await supabase.from("reservations")
      .update({ sauna_inventory_id: sauna.id }).eq("id", reservationId);
    await supabase.from("reservation_events").insert({
      reservation_id: reservationId,
      event_type: "Sauna Assigned",
      message: "Sauna assigned to match signed contract",
      metadata: { sauna_inventory_id: sauna.id },
    });
    await convertWaitlistEntry(supabase, reservationId);
  } else {
    await addReservationToWaitlist(supabase, reservation, "Contract signed, no matching sauna");
    await supabase.from("reservation_events").insert({
      reservation_id: reservationId,
      event_type: "Added to Waitlist",
      message: "Contract signed but no matching sauna available",
    });
  }
}
