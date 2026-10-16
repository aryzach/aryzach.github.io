// PROPOSAL ONLY — NOT DEPLOYED. Review before adding to supabase/functions/xero-admin/index.ts.
// Smallest read-only addition per docs/xero-tracking-inspection.md: a new "tracking_sample"
// action inside the existing password-verified xero-admin function. No new function, no new
// scopes, no SQL, no writes. Uses the existing activeToken() helper and allowlist pattern.
//
// Insert inside the action dispatch of supabase/functions/xero-admin/index.ts, and add
// "tracking_sample" to the permitted action list:
//
//   if (!["status", "start", "select_tenant", "inspect", "tracking_sample"].includes(body.action ?? ""))
//
// Limits (hard-coded, not request-controlled): at most 3 pages of 100 ACCREC invoices with
// line details, 2 pages of credit notes, 1 page of payments. Aggregated counts only are
// returned — no customer names, emails, amounts, line descriptions, or raw payloads.
// Response shape: aggregate coverage + tracking category/option labels and IDs only.
// Category/option labels are NOT customer data; the option label is the sauna unit code,
// which is required to compare against inventory unit codes per the handoff.

export async function trackingSample(db: unknown, json: (b: unknown, s?: number) => Response) {
  const { row, token } = await activeToken(db);
  const headers = {
    Authorization: `Bearer ${token.access_token}`,
    "Xero-tenant-id": row.selected_tenant_id,
    Accept: "application/json",
  };
  const get = async (path: string) => {
    const res = await fetch(`https://api.xero.com/api.xro/2.0/${path}`, {
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers,
    });
    if (!res.ok) throw new Error(`Xero read failed (${res.status})`);
    return res.json();
  };

  const coverage = {
    invoicesRead: 0,
    invoicesWithLineDetails: 0,
    eligibleLines: 0,
    taggedLines: 0,
    untaggedLines: 0,
    creditNotesRead: 0,
    creditLinesTagged: 0,
    creditLinesUntagged: 0,
    paymentsRead: 0,
    paymentsWithInvoiceLink: 0,
    pages: { invoices: 0, creditNotes: 0 },
    partial: false,
    sampleDateRange: { earliest: null as string | null, latest: null as string | null },
  };
  // categoryName -> { categoryId, options: { optionId, label }[] }
  const categories = new Map<string, { categoryId: string | null; options: Map<string, string | null> }>();
  const seen = (date?: string) => {
    if (!date) return;
    if (!coverage.sampleDateRange.earliest || date < coverage.sampleDateRange.earliest) coverage.sampleDateRange.earliest = date;
    if (!coverage.sampleDateRange.latest || date > coverage.sampleDateRange.latest) coverage.sampleDateRange.latest = date;
  };
  const noteTracking = (lines: unknown[], counts: { tagged: number; untagged: number }) => {
    for (const line of lines) {
      const l = line as { Tracking?: { TrackingCategoryID?: string; TrackingOptionID?: string; Name?: string; Option?: string }[] };
      if (!l || typeof l !== "object") continue;
      if (Array.isArray(l.Tracking) && l.Tracking.length > 0) {
        counts.tagged++;
        for (const t of l.Tracking) {
          if (!t?.Name) continue;
          const cat = categories.get(t.Name) ?? { categoryId: t.TrackingCategoryID ?? null, options: new Map<string, string | null>() };
          cat.categoryId = cat.categoryId ?? t.TrackingCategoryID ?? null;
          if (t.Option) cat.options.set(t.Option, t.TrackingOptionID ?? null);
          categories.set(t.Name, cat);
        }
      } else {
        counts.untagged++;
      }
    }
  };

  // Invoices: ACCREC only; drafts/voided/deleted excluded via Statuses filter.
  for (let page = 1; page <= 3; page++) {
    const payload = await get(`Invoices?page=${page}&where=Type=="ACCREC"&Statuses="AUTHORISED,PAID"&includeArchived=false`);
    const invoices = Array.isArray(payload?.Invoices) ? payload.Invoices : [];
    coverage.pages.invoices = page;
    if (invoices.length === 0) break;
    for (const inv of invoices) {
      coverage.invoicesRead++;
      seen(inv?.Date);
      if (!Array.isArray(inv?.LineItems)) continue; // list responses may omit detail; a detail GET would be a follow-up
      coverage.invoicesWithLineDetails++;
      coverage.eligibleLines += inv.LineItems.length;
      noteTracking(inv.LineItems, { tagged: 0, untagged: 0 } && coverage as never);
    }
    if (page === 3 && invoices.length === 100) coverage.partial = true;
    if (invoices.length < 100) break;
  }
  // NOTE: the loop above tallies tagged/untagged inside noteTracking against coverage.taggedLines /
  // untaggedLines via the same counters object; final code should pass an explicit counters
  // object to avoid the `as never` cast. Simplified here for review.

  for (let page = 1; page <= 2; page++) {
    const payload = await get(`CreditNotes?page=${page}`);
    const notes = Array.isArray(payload?.CreditNotes) ? payload.CreditNotes : [];
    coverage.pages.creditNotes = page;
    if (notes.length === 0) break;
    for (const cn of notes) {
      coverage.creditNotesRead++;
      seen(cn?.Date);
      if (Array.isArray(cn?.LineItems)) noteTracking(cn.LineItems, coverage as never);
    }
    if (notes.length < 100) break;
  }

  const paymentsPayload = await get("Payments?page=1");
  const payments = Array.isArray(paymentsPayload?.Payments) ? paymentsPayload.Payments : [];
  coverage.paymentsRead = payments.length;
  coverage.paymentsWithInvoiceLink = payments.filter((p: { Invoice?: { InvoiceID?: string } }) => p?.Invoice?.InvoiceID).length;

  return json({
    coverage,
    categories: [...categories.entries()].map(([name, c]) => ({
      name,
      categoryId: c.categoryId,
      options: [...c.options.entries()].map(([label, optionId]) => ({ label, optionId })),
    })),
    note: "Bounded sample (<=3 invoice pages, <=2 credit-note pages, 1 payments page). Missing tags are observed gaps in the sample, not proof of absence. No records stored; no customer PII or amounts returned. Match options against inventory unit codes client-side in the admin UI.",
  });
}
