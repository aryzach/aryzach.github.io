export type { BillingRow } from "../../supabase/functions/_shared/accountingHistory";
import type { BillingRow } from "../../supabase/functions/_shared/accountingHistory";

export type BillingSortValue = string | number | null | undefined;
export function filterBillingRows(
  rows: BillingRow[],
  search: string,
  status = "all",
  reviewOnly = false,
) {
  const query = search.trim().toLocaleLowerCase();
  return rows.filter(
    (row) =>
      (status === "all" || row.status === status) &&
      (!reviewOnly || row.issues.length > 0) &&
      (!query ||
        [
          row.name,
          row.email,
          row.phone,
          row.address,
          row.unit_code,
          row.sauna_type,
          ...row.xero_contacts.map((c) => c.name),
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase()
          .includes(query)),
  );
}
const collator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});
/** Unknown values stay at the bottom in both directions; identity breaks ties deterministically. */
export function sortBillingRows(
  rows: BillingRow[],
  value: (row: BillingRow) => BillingSortValue,
  direction: "asc" | "desc",
) {
  return [...rows].sort((a, b) => {
    const av = value(a),
      bv = value(b);
    if (av == null || av === "")
      return bv == null || bv === "" ? collator.compare(a.id, b.id) : 1;
    if (bv == null || bv === "") return -1;
    const compared =
      typeof av === "number" && typeof bv === "number"
        ? av - bv
        : collator.compare(String(av), String(bv));
    return compared
      ? compared * (direction === "asc" ? 1 : -1)
      : collator.compare(a.name, b.name) || collator.compare(a.id, b.id);
  });
}
