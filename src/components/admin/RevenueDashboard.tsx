import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface RevenueUnit {
  id: string;
  status: string;
  style: string;
  model_key: string;
  install_date: string | null;
  available_date: string | null;
  minimum_term_ends: string | null;
  monthly_price?: number | null;
  current_contract: { monthly_price: number; commitment_months: number; signed_at: string | null } | null;
  future_contract: { monthly_price: number; commitment_months: number; signed_at: string | null } | null;
}

const currency = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const parseDay = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
};
const addMonths = (date: Date, count: number) => {
  const target = new Date(date.getFullYear(), date.getMonth() + count, 1);
  target.setDate(Math.min(date.getDate(), new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()));
  return target;
};

export function RevenueDashboard({ inventory }: { inventory: RevenueUnit[] }) {
  const [range, setRange] = useState("12");
  const [type, setType] = useState("all");
  const months = Number(range);
  const series = useMemo(() => {
    const start = monthStart(new Date());
    return Array.from({ length: months }, (_, index) => {
      const first = addMonths(start, index);
      const next = addMonths(first, 1);
      let revenue = 0;
      for (const unit of inventory) {
        if (["Sold", "Pre-sold", "Cancelled", "Refunded"].includes(unit.status)) continue;
        const category = unit.model_key === "original" ? "original" : unit.style === "infrared" ? "infrared" : "traditional";
        if (type !== "all" && type !== category) continue;
        // Current renter: signed contract rate, else the inventory $/mo (CRM) when a "Committed until" date exists.
        const current = unit.current_contract?.signed_at ? unit.current_contract : null;
        const currentRate = current?.monthly_price ?? (unit.minimum_term_ends ? unit.monthly_price ?? null : null);
        const periods = [
          { rate: currentRate, months: current?.commitment_months ?? 0, begins: unit.install_date, committedUntil: unit.minimum_term_ends },
          { rate: unit.future_contract?.signed_at ? unit.future_contract.monthly_price : null, months: unit.future_contract?.commitment_months ?? 0, begins: unit.available_date, committedUntil: null },
        ];
        for (const { rate, months: term, begins, committedUntil } of periods) {
          if (rate == null || !Number.isFinite(rate) || !begins) continue;
          const beginning = parseDay(begins);
          if (!beginning) continue;
          const override = committedUntil ? parseDay(committedUntil) : null;
          const end = override ?? (term > 0 ? addMonths(beginning, term) : null);
          if (!end) continue;
          if (beginning < next && end > first) revenue += rate;
        }
      }
      return { month: first.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), revenue };
    });
  }, [inventory, months, type]);

  return (
    <section aria-label="Guaranteed monthly revenue" className="py-4">
      <div className="flex flex-wrap items-end justify-between gap-5 mb-8">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Guaranteed monthly revenue</h2>
          <p className="text-sm text-muted-foreground mt-1">Signed rental agreements during their committed terms only. Excludes add-ons, sales and uncontracted rates.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="revenue-range">Time range</Label>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger id="revenue-range" className="w-36 bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>{[3, 6, 12, 18, 24, 36].map((n) => <SelectItem key={n} value={String(n)}>{n} months</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="revenue-type">Sauna type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="revenue-type" className="w-44 bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="infrared">Infrared</SelectItem>
                <SelectItem value="traditional">Traditional</SelectItem>
                <SelectItem value="original">Original Collection</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="h-[360px] w-full min-w-0" role="img" aria-label={`Guaranteed monthly rental revenue over ${months} months for ${type === "all" ? "all sauna types" : type}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 14, right: 20, left: 14, bottom: 8 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} minTickGap={22} />
            <YAxis width={76} tickFormatter={(v: number) => currency(v)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} domain={[0, "auto"]} />
            <Tooltip formatter={(value: number) => [currency(value), "Guaranteed revenue"]} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", color: "hsl(var(--popover-foreground))" }} />
            <Line dataKey="revenue" type="linear" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 3, fill: "hsl(var(--primary))" }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Each month includes a signed contract if its rental period overlaps that month. The inventory "Committed until" date overrides the contract term when set. Future transfers require an available date.</p>
    </section>
  );
}