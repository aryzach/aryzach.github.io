import { formatUSD, commitmentLabel } from "@/lib/contractConfig";

interface Summary {
  reservation_id: string;
  agreement_version: string;
  customer_legal_name: string;
  phone: string | null;
  email: string;
  installation_address: string;
  sauna_type: string;
  placement: "indoor" | "outdoor";
  commitment_months: number;
  monthly_price: number;
  delivery_fee: number;
  security_deposit: number;
  insurance_selected: boolean;
  insurance_monthly_price: number;
  second_heater_selected: boolean;
  second_heater_monthly_price: number;
  stair_elevator_charge: number | null;
  preferred_installation_date: string;
}

function fmtDate(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  if (!y) return d;
  return new Date(y, m - 1, day).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

export const RentalSummaryPreview = ({ summary }: { summary: Summary }) => {
  return (
    <div className="bg-white text-slate-900 rounded-lg border border-slate-200 shadow-sm p-6 md:p-10 space-y-8">
      <header className="pb-6 border-b border-slate-200">
        <p className="text-xs tracking-widest uppercase text-slate-500 mb-2">SF Sauna Rental</p>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Rental Summary</h2>
        <div className="mt-3 text-xs text-slate-500 flex flex-wrap gap-x-6 gap-y-1">
          <span>Reservation ID: <span className="font-mono">{summary.reservation_id.slice(0, 8)}</span></span>
          <span>Master Agreement: {summary.agreement_version}</span>
        </div>
      </header>

      <section>
        <h3 className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-3">Customer</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8 text-sm">
          <Row label="Legal name" value={summary.customer_legal_name} />
          <Row label="Email" value={summary.email} />
          {summary.phone && <Row label="Phone" value={summary.phone} />}
          <Row label="Installation address" value={summary.installation_address} span2 />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-3">Sauna & installation</h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8 text-sm">
          <Row label="Sauna type" value={summary.sauna_type} />
          <Row label="Placement" value={summary.placement === "indoor" ? "Indoor" : "Outdoor"} />
          <Row label="Initial commitment" value={commitmentLabel(summary.commitment_months)} />
          <Row label="Preferred installation date" value={fmtDate(summary.preferred_installation_date)} />
        </dl>
      </section>

      <section>
        <h3 className="text-xs font-semibold tracking-widest uppercase text-slate-500 mb-3">Pricing</h3>
        <div className="rounded-md border border-slate-200 divide-y divide-slate-200">
          <PriceRow label="Monthly rental" value={`${formatUSD(summary.monthly_price)} / month`} emphasize />
          <PriceRow label="Delivery fee" value={formatUSD(summary.delivery_fee)} />
          <PriceRow label="Security deposit" value={formatUSD(summary.security_deposit)} />
          <PriceRow
            label="Optional insurance"
            value={summary.insurance_selected ? `${formatUSD(summary.insurance_monthly_price)} / month` : "Not selected"}
          />
          <PriceRow
            label="Optional second heater"
            value={summary.second_heater_selected ? `${formatUSD(summary.second_heater_monthly_price)} / month` : "Not selected"}
          />
          <PriceRow
            label="Stair / elevator charge"
            value={
              summary.stair_elevator_charge == null
                ? "To be confirmed before delivery"
                : formatUSD(summary.stair_elevator_charge)
            }
          />
        </div>
      </section>

      <section className="space-y-4 text-xs text-slate-600 leading-relaxed pt-4 border-t border-slate-200">
        <p>
          This Rental Summary and the incorporated Master Agreement together constitute the Rental Agreement.
          If a conflict exists regarding a customer-specific commercial term, this Rental Summary controls
          for that term.
        </p>
        <p>
          Unless otherwise agreed in writing, the first and last month's rental fees, security deposit, and
          all applicable delivery, stair/elevator, site-preparation, equipment, and other charges are due
          upon delivery.
        </p>
      </section>
    </div>
  );
};

const Row = ({ label, value, span2 }: { label: string; value: string; span2?: boolean }) => (
  <div className={span2 ? "md:col-span-2" : ""}>
    <dt className="text-slate-500 text-xs">{label}</dt>
    <dd className="text-slate-900 font-medium">{value}</dd>
  </div>
);

const PriceRow = ({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) => (
  <div className="flex items-center justify-between px-4 py-3 text-sm">
    <span className="text-slate-600">{label}</span>
    <span className={emphasize ? "font-semibold text-slate-900" : "text-slate-900"}>{value}</span>
  </div>
);