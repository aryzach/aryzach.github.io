export interface AvailabilityEvent {
  sauna_type_id: string;
  quantity: number;
  available_starting_date: string; // yyyy-mm-dd
}

export interface ConsumptionRow {
  sauna_type_id: string;
  preferred_install_date: string; // yyyy-mm-dd
}

export interface AvailabilityStatus {
  availableToday: number;
  nextAvailableDate: string | null; // ISO yyyy-mm-dd, only if not available today
  status: "available" | "future" | "unavailable";
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Compute availability per sauna type from events and paid-active reservations.
 * For a given date D, capacity =
 *   sum(events with available_starting_date <= D)
 *   - count(paid reservations with preferred_install_date <= D)
 * The earliest D where capacity > 0 is the next-available date.
 */
export function computeAvailability(
  saunaTypeId: string,
  events: AvailabilityEvent[],
  consumption: ConsumptionRow[],
): AvailabilityStatus {
  const typeEvents = events
    .filter((e) => e.sauna_type_id === saunaTypeId)
    .sort((a, b) => a.available_starting_date.localeCompare(b.available_starting_date));
  const typeConsumption = consumption
    .filter((c) => c.sauna_type_id === saunaTypeId)
    .sort((a, b) => a.preferred_install_date.localeCompare(b.preferred_install_date));

  const today = todayISO();

  const capacityOn = (date: string) => {
    const supply = typeEvents
      .filter((e) => e.available_starting_date <= date)
      .reduce((sum, e) => sum + e.quantity, 0);
    const demand = typeConsumption.filter((c) => c.preferred_install_date <= date).length;
    return supply - demand;
  };

  const todayCap = capacityOn(today);
  if (todayCap > 0) {
    return { availableToday: todayCap, nextAvailableDate: null, status: "available" };
  }

  const candidates = Array.from(
    new Set(
      typeEvents
        .map((e) => e.available_starting_date)
        .filter((d) => d > today),
    ),
  ).sort();

  for (const d of candidates) {
    if (capacityOn(d) > 0) {
      return { availableToday: 0, nextAvailableDate: d, status: "future" };
    }
  }

  return { availableToday: 0, nextAvailableDate: null, status: "unavailable" };
}

export function formatDatePretty(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export { todayISO };