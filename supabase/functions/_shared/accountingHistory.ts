import type { RentalCommercialTerms } from "./rentalTerms.ts";

// Private database records are normalized here; never imported by public booking handlers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AccountingRecord = Record<string, any>;
export interface AccountingHistoryData {
  saunaTypes?: AccountingRecord[];
  customers: AccountingRecord[];
  links: AccountingRecord[];
  reservations: AccountingRecord[];
  rentals: AccountingRecord[];
  agreements: AccountingRecord[];
  terms: AccountingRecord[];
  placements: AccountingRecord[];
  sales: AccountingRecord[];
  inventory: AccountingRecord[];
  contracts: AccountingRecord[];
  xeroLinks: AccountingRecord[];
  xeroHistory: AccountingRecord[];
}
export interface BillingRow {
  id: string;
  customer_id: string | null;
  reservation_id: string | null;
  rental_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  unit_code: string | null;
  sauna_type: string | null;
  is_sale: boolean;
  start_date: string | null;
  start_source: string | null;
  return_date: string | null;
  return_unknown: boolean;
  sold_on: string | null;
  sale_price: number | null;
  commitment_months: number | null;
  monthly_price: number | null;
  security_deposit: number | null;
  delivery_fee: number | null;
  install_fee: number | null;
  insurance_selected: boolean | null;
  insurance_monthly_price: number | null;
  second_heater_selected: boolean | null;
  second_heater_monthly_price: number | null;
  stair_elevator_charge: number | null;
  reservation_deposit: number | null;
  payment_method: string | null;
  payment_status: string | null;
  commercial_terms: RentalCommercialTerms | null;
  extras: { name: string; amountCents: number }[];
  source: string;
  issues: string[];
  related_bookings: { id: string; status: string; type: string | null }[];
  agreements: {
    id: string;
    label: string;
    signed_on: string | null;
    state: string;
    downloadable: boolean;
  }[];
  term_history: {
    id: string;
    state: string;
    from: string | null;
    until: string | null;
    monthly: number | null;
    months: number | null;
    source: string;
    note: string | null;
  }[];
  placements: {
    unit: string;
    installed: string | null;
    removed: string | null;
    address: string | null;
  }[];
  xero_contacts: { id: string; name: string; shortCode: string | null }[];
  last_receipt: string | null;
  receipt_count: number;
  notes: string | null;
}
const numeric = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const cents = (v: unknown) => (numeric(v) == null ? null : Number(v) / 100);
const nonempty = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;
const validAgreement = (a: AccountingRecord) =>
  !["voided", "superseded", "canceled"].includes(a.signing_state);
const validTerm = (t: AccountingRecord) =>
  !["voided", "superseded", "canceled"].includes(t.state);
const stamp = (r: AccountingRecord) =>
  String(
    r.effective_from ||
      r.signed_on ||
      r.agreement_date ||
      r.signed_at ||
      r.created_at ||
      "",
  );
const newest = (a: AccountingRecord, b: AccountingRecord) =>
  stamp(b).localeCompare(stamp(a)) || String(a.id).localeCompare(String(b.id));
const nameOf = (r: AccountingRecord) =>
  `${r.first_name || ""} ${r.last_name || ""}`.trim();
const unique = (values: string[]) => [...new Set(values.filter(Boolean))];

/** One row per rental/booking, plus profiles and Xero-only customers with missing history. */
export function buildBillingHistory(
  data: AccountingHistoryData,
  asOf: string,
): BillingRow[] {
  const {
    customers,
    links,
    reservations,
    rentals,
    agreements,
    terms,
    placements,
    sales,
    inventory,
    contracts,
    xeroLinks,
    xeroHistory,
  } = data;
  const rows: BillingRow[] = [];
  const reserved = new Set<string>();
  const represented = new Set<string>();
  const assets = new Map(inventory.map((a) => [a.id, a]));
  const signed = contracts.filter((c) => c.status === "Signed" && !c.voided_at);
  const makeRow = (
    customer: AccountingRecord | undefined,
    rental?: AccountingRecord,
    reservation?: AccountingRecord,
  ): BillingRow => {
    if (customer) represented.add(customer.id);
    if (reservation) reserved.add(reservation.id);
    const rid = rental?.id;
    const relatedBookings = reservations.filter(
      (candidate) =>
        candidate.id === rental?.originating_reservation_id ||
        (rental?.owner_review?.continuous === true &&
          candidate.booking_kind === "manual_historical" &&
          links.some(
            (link) =>
              link.customer_id === customer?.id &&
              link.reservation_id === candidate.id,
          ) &&
          !rentals.some(
            (other) =>
              other.id !== rid &&
              other.originating_reservation_id === candidate.id,
          )),
    );
    relatedBookings.forEach((booking) => reserved.add(booking.id));
    const reservationId =
      reservation?.id ?? rental?.originating_reservation_id ?? null;
    const allAgreements = agreements
      .filter((a) => rid && a.rental_id === rid)
      .sort(newest);
    const ags = allAgreements.filter(validAgreement);
    const allTerms = terms
      .filter((t) => rid && t.rental_id === rid)
      .sort(newest);
    const cutoff = rental?.actual_end || asOf;
    const eligible = allTerms.filter(
      (t) =>
        validTerm(t) &&
        (!t.agreement_id || ags.some((a) => a.id === t.agreement_id)),
    );
    // A future amendment is not today's bill. A planned rental may show its planned agreement.
    const currentTerms = eligible.filter(
      (t) =>
        (!t.effective_from || t.effective_from <= cutoff) &&
        (!t.effective_until || t.effective_until >= cutoff),
    );
    const applicable = currentTerms.length
      ? currentTerms
      : eligible.filter((t) => !t.effective_from || t.effective_from <= cutoff);
    const term = (
      rental?.lifecycle_state === "planned" ? eligible : applicable
    )[0];
    const agreement = ags.find((a) => a.id === term?.agreement_id) ?? ags[0];
    const linkedContracts = ags.map((a) => a.contract_id).filter(Boolean);
    const contract = signed
      .filter((c) =>
        linkedContracts.length
          ? c.id === agreement?.contract_id
          : !allAgreements.length && c.reservation_id === reservationId,
      )
      .sort(newest)[0];
    const sourceTerms = agreement?.source_terms || {};
    const corrected = agreement?.owner_corrections || {};
    const snapshot = contract?.rental_summary_snapshot || {};
    const commercial =
      snapshot.commercial_terms ?? sourceTerms.commercialTerms ?? null;
    const issues: string[] = [
      ...(Array.isArray(rental?.history_gaps) ? rental.history_gaps : []),
    ];
    const ps = placements
      .filter((p) => rid && p.rental_id === rid)
      .sort((a, b) =>
        String(a.installed_on).localeCompare(String(b.installed_on)),
      );
    const ss = sales.filter((s) =>
      rid
        ? s.rental_id === rid
        : customer && s.customer_id === customer.id && !s.rental_id,
    );
    const sale = rental?.purpose === "purchase" || ss.length > 0;
    const state = rental?.lifecycle_state;
    const returned = state === "ended" && !sale;
    const actualReturn = returned ? (rental?.actual_end ?? null) : null;
    const status = sale
      ? ss.length || state === "ended"
        ? "Sold"
        : "Purchase planned"
      : {
          active: "Current",
          ended: "Returned",
          planned: "Future",
          canceled: "Canceled",
          unconfirmed: "History incomplete",
        }[state as string] ||
        (reservation ? "Booking only" : "No rental recorded");
    const currentInventory = inventory.filter(
      (a) => reservationId && a.current_customer_id === reservationId,
    );
    const futureInventory = inventory.filter(
      (a) => reservationId && a.future_customer_id === reservationId,
    );
    const matchingInventory =
      state === "active"
        ? currentInventory
        : ["planned", "unconfirmed"].includes(state) || !rental
          ? [...currentInventory, ...futureInventory]
          : [];
    const ownerUnits = [
      rental?.owner_review?.priorUnit,
      rental?.owner_review?.currentUnit,
      /owner/i.test(rental?.actual_start_source || "")
        ? rental?.actual_start_evidence?.unit
        : null,
    ].filter(
      (unit): unit is string =>
        typeof unit === "string" && inventory.some((a) => a.unit_code === unit),
    );
    const units = unique([
      ...ownerUnits,
      ...ps.map((p) => assets.get(p.asset_id)?.unit_code || ""),
      ...ss.map((s) => assets.get(s.asset_id)?.unit_code || ""),
      ...matchingInventory.map((a) => a.unit_code || ""),
    ]);
    const monthly = term
      ? cents(term.base_monthly_cents)
      : numeric(corrected.amount) != null && corrected.billingUnit === "month"
        ? numeric(corrected.amount)
        : (numeric(contract?.monthly_price) ??
          numeric(sourceTerms.monthlyPrice));
    const minimumMonths = term
      ? numeric(term.minimum_months)
      : (numeric(corrected.commitmentMonths) ??
        numeric(contract?.commitment_months) ??
        numeric(sourceTerms.minimumMonths));
    const extra = Array.isArray(term?.extras) ? term.extras : [];
    const source =
      term?.source ||
      (Object.keys(corrected).length
        ? "Owner-confirmed agreement"
        : contract
          ? "Signed contract"
          : agreement
            ? "Imported agreement — check signing status"
            : "Customer / booking record");
    if (!rental)
      issues.push(
        reservation
          ? "Booking has no recorded rental history; customer service status needs review."
          : "Customer profile has no linked rental or booking.",
      );
    if (returned && !actualReturn)
      issues.push("Returned — exact pickup date unknown.");
    if (state === "active" && rental?.actual_end)
      issues.push(
        "Current rental also has an end date; lifecycle needs review.",
      );
    if (
      rental?.actual_start &&
      rental?.actual_end &&
      rental.actual_end < rental.actual_start
    )
      issues.push("Recorded end date precedes start date.");
    if (!sale && monthly == null) issues.push("Monthly rate is not recorded.");
    if (!sale && minimumMonths == null)
      issues.push("Commitment length is not recorded.");
    if (!units.length) issues.push("Numbered sauna is not recorded.");
    if (
      term?.state === "unconfirmed" ||
      (agreement && !["signed", "confirmed"].includes(agreement.signing_state))
    )
      issues.push(
        "Agreement or terms need confirmation; recorded values are shown, not inferred.",
      );
    if (!agreement && !contract) issues.push("No agreement is linked.");
    if (
      applicable.length > 1 &&
      stamp(applicable[0]) === stamp(applicable[1]) &&
      applicable[0].base_monthly_cents !== applicable[1].base_monthly_cents
    )
      issues.push(
        "Conflicting rates have the same effective date; confirm which applies.",
      );
    const customerXero = xeroLinks.filter(
      (l) => customer && l.customer_id === customer.id,
    );
    const receipts = xeroHistory
      .filter(
        (h) =>
          !h.sync_ignored &&
          customerXero.some(
            (l) => l.tenant_id === h.tenant_id && l.contact_id === h.contact_id,
          ),
      )
      .flatMap((h) => (Array.isArray(h.transactions) ? h.transactions : []))
      .filter((t) => t.type === "RECEIVE" && t.status === "AUTHORISED");
    const paymentMethod = nonempty(reservation?.default_payment_method_status);
    const start = rental?.actual_start ?? null;
    if (start && /xero|receipt/i.test(rental?.actual_start_source || ""))
      issues.push(
        "Rental start uses a historical payment proxy; physical installation date is not confirmed.",
      );
    const row: BillingRow = {
      id: rid
        ? `rental:${rid}`
        : reservation
          ? `booking:${reservation.id}`
          : `customer:${customer?.id}`,
      customer_id: customer?.id ?? null,
      reservation_id: reservationId,
      rental_id: rid ?? null,
      name:
        nonempty(customer?.display_name) ??
        nonempty(reservation && nameOf(reservation)) ??
        nonempty(contract?.customer_legal_name) ??
        "Unnamed customer",
      email:
        nonempty(customer?.email) ??
        nonempty(reservation?.email) ??
        nonempty(contract?.email),
      phone:
        nonempty(customer?.phone) ??
        nonempty(reservation?.phone) ??
        nonempty(contract?.phone),
      address:
        nonempty(rental?.service_address) ??
        nonempty(contract?.installation_address) ??
        nonempty(reservation?.install_address),
      status,
      unit_code: units.join(", ") || null,
      sauna_type:
        nonempty(term?.sauna_type) ??
        nonempty(corrected.saunaType) ??
        nonempty(contract?.sauna_type) ??
        nonempty(sourceTerms.saunaType) ??
        nonempty(sourceTerms.saunaTypeAsWritten) ??
        ((data.saunaTypes || []).find(
          (t) => t.id === reservation?.sauna_type_id,
        )?.name
          ? `${(data.saunaTypes || []).find((t) => t.id === reservation?.sauna_type_id)!.name} (requested)`
          : null),
      is_sale: sale,
      start_date: start,
      start_source: rental?.actual_start_source ?? null,
      return_date: actualReturn,
      return_unknown: returned && !actualReturn,
      sold_on:
        ss
          .map((s) => s.sold_on)
          .sort()
          .at(-1) ??
        (sale && state === "ended" ? (rental?.actual_end ?? null) : null),
      sale_price:
        ss.length && ss.every((s) => numeric(s.agreed_cents) != null)
          ? ss.reduce((sum, s) => sum + Number(s.agreed_cents), 0) / 100
          : null,
      commitment_months: minimumMonths,
      monthly_price: monthly,
      security_deposit: numeric(contract?.security_deposit),
      delivery_fee: numeric(contract?.delivery_fee),
      install_fee: numeric(snapshot.installation_fee),
      insurance_selected: contract?.insurance_selected ?? null,
      insurance_monthly_price: numeric(contract?.insurance_monthly_price),
      second_heater_selected: contract?.second_heater_selected ?? null,
      second_heater_monthly_price: numeric(
        contract?.second_heater_monthly_price,
      ),
      stair_elevator_charge: numeric(contract?.stair_elevator_charge),
      reservation_deposit: numeric(snapshot.reservation_deposit),
      payment_method:
        paymentMethod === "ACH" ? "Bank transfer / ACH" : paymentMethod,
      payment_status: nonempty(reservation?.payment_status),
      commercial_terms: commercial,
      extras: extra.filter(
        (e) => typeof e.name === "string" && numeric(e.amountCents) != null,
      ),
      source,
      issues: [],
      related_bookings: relatedBookings.map((booking) => ({
        id: booking.id,
        status: booking.reservation_status || "Unknown",
        type:
          (data.saunaTypes || []).find((t) => t.id === booking.sauna_type_id)
            ?.name || null,
      })),
      agreements: allAgreements.map((a) => ({
        id: a.id,
        label: a.label || "Agreement",
        signed_on: a.signed_on ?? null,
        state: a.signing_state,
        downloadable: !!(a.document_id || a.contract_id),
      })),
      term_history: allTerms.map((t) => ({
        id: t.id,
        state: t.state,
        from: t.effective_from ?? null,
        until: t.effective_until ?? null,
        monthly: cents(t.base_monthly_cents),
        months: numeric(t.minimum_months),
        source: t.source || "Unknown",
        note: t.note ?? null,
      })),
      placements: ps.map((p) => ({
        unit: assets.get(p.asset_id)?.unit_code || "Unknown sauna",
        installed: p.installed_on,
        removed: p.removed_on,
        address: p.address,
      })),
      xero_contacts: customerXero.map((l) => ({
        id: l.contact_id,
        name: l.contact_name || "Xero contact",
        shortCode: l.organisation_short_code ?? null,
      })),
      last_receipt:
        receipts
          .map((t) => t.date)
          .filter(Boolean)
          .sort()
          .at(-1) ?? null,
      receipt_count: new Set(receipts.map((t) => t.id)).size,
      notes:
        [nonempty(rental?.notes), nonempty(rental?.owner_review?.summary)]
          .filter(Boolean)
          .join("\n") || null,
    };
    if (!row.sauna_type) issues.push("Sauna type is not recorded.");
    if (
      matchingInventory.length &&
      futureInventory.length &&
      state !== "active"
    )
      issues.push(
        "Numbered sauna includes a future allocation, not a confirmed installation.",
      );
    if (!row.address) issues.push("Service address is missing.");
    if (!row.payment_method) issues.push("Payment method is not recorded.");
    if (
      !sale &&
      [row.security_deposit, row.install_fee, row.delivery_fee].some(
        (v) => v == null,
      )
    )
      issues.push(
        "Some agreed deposits or one-time fees are not recorded; check the original agreement.",
      );
    if (sale && !ss.length && state === "ended")
      issues.push(
        "Purchase is marked ended but a linked sale record is missing.",
      );
    row.issues = unique(issues);
    return row;
  };
  for (const rental of rentals) {
    const customer = customers.find((c) => c.id === rental.customer_id);
    const reservation = reservations.find(
      (r) => r.id === rental.originating_reservation_id,
    );
    rows.push(makeRow(customer, rental, reservation));
  }
  for (const reservation of reservations.filter((r) => !reserved.has(r.id))) {
    const link = links.find((l) => l.reservation_id === reservation.id);
    rows.push(
      makeRow(
        customers.find((c) => c.id === link?.customer_id),
        undefined,
        reservation,
      ),
    );
  }
  for (const sale of sales.filter((s) => !s.rental_id)) {
    const row = makeRow(customers.find((c) => c.id === sale.customer_id));
    row.id = `sale:${sale.id}`;
    row.status = "Sold";
    row.is_sale = true;
    row.unit_code = assets.get(sale.asset_id)?.unit_code || null;
    row.sold_on = sale.sold_on || null;
    row.sale_price = cents(sale.agreed_cents);
    row.issues = row.issues.filter(
      (i) => !i.includes("no linked rental or booking"),
    );
    row.issues.push("Sale has no linked rental / purchase record.");
    rows.push(row);
  }
  for (const customer of customers.filter(
    (c) => !represented.has(c.id) && !c.archived_at,
  ))
    rows.push(makeRow(customer));
  // Unlinked Xero contacts remain separate; never merge customers on a name guess.
  for (const history of xeroHistory.filter(
    (h) =>
      !h.sync_ignored &&
      !xeroLinks.some(
        (l) => l.tenant_id === h.tenant_id && l.contact_id === h.contact_id,
      ),
  )) {
    const receipts = (
      Array.isArray(history.transactions) ? history.transactions : []
    ).filter((t) => t.type === "RECEIVE" && t.status === "AUTHORISED");
    if (!receipts.length) continue;
    const row = makeRow({
      id: `xero:${history.tenant_id}:${history.contact_id}`,
      display_name: history.contact_name,
    });
    row.id = row.customer_id!;
    row.customer_id = null;
    row.status = "Xero only";
    row.source = "Unlinked Xero customer history";
    row.issues = [
      "Xero contact is not linked to a customer; identity and rental history need review.",
    ];
    row.xero_contacts = [
      { id: history.contact_id, name: history.contact_name, shortCode: null },
    ];
    row.receipt_count = new Set(receipts.map((t) => t.id)).size;
    row.last_receipt =
      receipts
        .map((t) => t.date)
        .filter(Boolean)
        .sort()
        .at(-1) ?? null;
    rows.push(row);
  }
  // Distinct identities sharing a name are visible for review, not silently combined.
  for (const row of rows)
    if (
      rows.some(
        (other) =>
          other.id !== row.id &&
          other.customer_id !== row.customer_id &&
          other.name.toLowerCase() === row.name.toLowerCase(),
      )
    )
      row.issues = unique([
        ...row.issues,
        "Another customer or unlinked contact shares this name; confirm identity.",
      ]);
  return rows.sort(
    (a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }) ||
      String(b.start_date || "").localeCompare(String(a.start_date || "")) ||
      a.id.localeCompare(b.id),
  );
}
