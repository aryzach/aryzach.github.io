// PROPOSAL ONLY — NOT DEPLOYED. Review before adding to supabase/functions/xero-admin/index.ts.
// Smallest read-only addition per docs/xero-tracking-inspection.md: a new "tracking_sample"
// action inside the existing password-verified xero-admin function. No new function, no new
// scopes (Contacts/Invoices/CreditNotes/Payments reads are already consented), no SQL, no writes.
// Uses the existing activeToken() helper.
//
// To install after review:
//   1. Add "tracking_sample" to the action allowlist in xero-admin/index.ts:
//        if (!["status", "start", "select_tenant", "inspect", "tracking_sample"].includes(body.action ?? ""))
//   2. Paste the handler below as `if (body.action === "tracking_sample") { ... }`.
//   3. Deploy xero-admin. Nothing else changes.
//
// Limits (hard-coded, not request-controlled): at most 3 pages of 100 ACCREC invoices with
// line details, 2 pages of credit notes, 1 page of payments. Aggregate counts only are
// returned — no customer names, emails, amounts, line descriptions, or raw payloads.
// Tracking category/option labels are NOT customer data; the option label is the sauna unit
// code, which the admin UI compares against inventory unit codes to produce the mapping.

// inside the try block of Deno.serve, after the existing actions:
if (body.action === "tracking_sample") {
  const { row, token } = await activeToken(db);
  const xeroHeaders = {
    Authorization: `Bearer ${token.access_token}`,
    "Xero-tenant-id": row.selected_tenant_id,
    Accept: "application/json",
  };
  const get = async (path: string) => {
    const res = await fetch(`https://api.xero.com/api.xro/2.0/${path}`, {
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: xeroHeaders,
    });
    if (!res.ok) throw new Error(`Xero read failed (${res.status})`);
    return res.json();
  };

  interface TrackingEntry { TrackingCategoryID?: string; TrackingOptionID?: string; Name?: string; Option?: string }
  interface Line { Tracking?: TrackingEntry[] }

  const coverage = {
    invoicesRead: 0, invoicesWithLineDetails: 0, eligibleLines: 0,
    taggedLines: 0, untaggedLines: 0,
    creditNotesRead: 0, creditLinesTagged: 0, creditLinesUntagged: 0,
    paymentsRead: 0, paymentsWithInvoiceLink: 0,
    pages: { invoices: 0, creditNotes: 0 }, partial: false,
    sampleDateRange: { earliest: null as string | null, latest: null as string | null },
  };
  // category name -> { categoryId, options: option label -> optionId }
  const categories = new Map<string, { categoryId: string | null; options: Map<string, string | null> }>();

  const noteDate = (date?: string) => {
    if (typeof date !== "string") return;
    const day = date.slice(0, 10);
    if (!coverage.sampleDateRange.earliest || day < coverage.sampleDateRange.earliest) coverage.sampleDateRange.earliest = day;
    if (!coverage.sampleDateRange.latest || day > coverage.sampleDateRange.latest) coverage.sampleDateRange.latest = day;
  };
  const noteTracking = (lines: Line[], onTagged: () => void, onUntagged: () => void) => {
    for (const line of lines) {
      if (Array.isArray(line?.Tracking) && line.Tracking.length > 0) {
        onTagged();
        for (const t of line.Tracking) {
          if (!t?.Name) continue;
          const cat = categories.get(t.Name) ?? { categoryId: t.TrackingCategoryID ?? null, options: new Map<string, string | null>() };
          cat.categoryId = cat.categoryId ?? t.TrackingCategoryID ?? null;
          if (t.Option) cat.options.set(t.Option, t.TrackingOptionID ?? null);
          categories.set(t.Name, cat);
        }
      } else {
        onUntagged();
      }
    }
  };

  // Invoices: sales (ACCREC) only; drafts/voided/deleted excluded via Statuses filter.
  for (let page = 1; page <= 3; page++) {
    const payload = await get(`Invoices?page=${page}&where=Type=="ACCREC"&Statuses="AUTHORISED,PAID"`);
    const invoices = Array.isArray(payload?.Invoices) ? payload.Invoices : [];
    coverage.pages.invoices = page;
    if (invoices.length === 0) break;
    for (const inv of invoices) {
      coverage.invoicesRead++;
      noteDate(inv?.Date);
      if (!Array.isArray(inv?.LineItems)) continue; // paged list omits detail; flagged as unavailable, not zero
      coverage.invoicesWithLineDetails++;
      coverage.eligibleLines += inv.LineItems.length;
      noteTracking(inv.LineItems, () => coverage.taggedLines++, () => coverage.untaggedLines++);
    }
    if (page === 3 && invoices.length === 100) coverage.partial = true;
    if (invoices.length < 100) break;
  }

  for (let page = 1; page <= 2; page++) {
    const payload = await get(`CreditNotes?page=${page}`);
    const notes = Array.isArray(payload?.CreditNotes) ? payload.CreditNotes : [];
    coverage.pages.creditNotes = page;
    if (notes.length === 0) break;
    for (const cn of notes) {
      coverage.creditNotesRead++;
      noteDate(cn?.Date);
      if (Array.isArray(cn?.LineItems))
        noteTracking(cn.LineItems, () => coverage.creditLinesTagged++, () => coverage.creditLinesUntagged++);
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
    note: "Bounded sample (<=3 invoice pages, <=2 credit-note pages, 1 payments page). Missing tags are observed gaps in the sample, not proof of absence. Nothing stored; no customer PII or amounts returned. Match option labels against inventory unit codes in the admin UI.",
  });
}
