export interface AvailabilityStatus {
  availableToday: number;
  nextAvailableDate: string | null;
  status: "available" | "future" | "unavailable";
}

export interface PublicAvailabilityRow {
  sauna_type_id: string;
  available_now: number;
  next_available_date: string | null;
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function rowToStatus(row: PublicAvailabilityRow | undefined | null): AvailabilityStatus {
  if (!row) return { availableToday: 0, nextAvailableDate: null, status: "unavailable" };
  if (row.available_now > 0) {
    return { availableToday: row.available_now, nextAvailableDate: null, status: "available" };
  }
  if (row.next_available_date) {
    return { availableToday: 0, nextAvailableDate: row.next_available_date, status: "future" };
  }
  return { availableToday: 0, nextAvailableDate: null, status: "unavailable" };
}

export function formatDatePretty(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export { todayISO };