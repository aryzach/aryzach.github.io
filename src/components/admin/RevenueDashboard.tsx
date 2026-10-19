import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { revenueProjection, type RevenueUnit } from '@/lib/revenueProjection';
import type { RentalWorkspace } from '@/lib/rentalModel';
import { pacificToday } from '@/lib/ltvTimeline';
export type { RevenueUnit } from '@/lib/revenueProjection';
const currency = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function RevenueDashboard({ inventory, state }: { inventory: RevenueUnit[]; state: RentalWorkspace | null }) {
  const [range, setRange] = useState("12");
  const [type, setType] = useState("all");
  const [includeFuture, setIncludeFuture] = useState(false);
  const months = Number(range);
  const {series,futureIncluded,futureMissingDate,futureDateReview} = useMemo(() => revenueProjection(inventory, {months,type,today:pacificToday(),includeFuture,state:state||undefined}), [inventory,months,type,includeFuture,state]);

  return (
    <section aria-label="Guaranteed monthly revenue" className="py-4">
      <div className="flex flex-wrap items-end justify-between gap-5 mb-8">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Guaranteed monthly revenue</h2>
          <p className="text-sm text-muted-foreground mt-1">Current signed rental commitments and recorded CRM rent through its committed-until date. Excludes add-ons, sales and speculative renewals.</p>
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
      <div className="mb-6 space-y-2 rounded-md border bg-muted/30 p-4">
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={includeFuture} onChange={e=>setIncludeFuture(e.target.checked)}/>Include future signed contracts from their installation date</label>
        <p className="text-xs text-muted-foreground">{includeFuture ? `${futureIncluded} future rental contracts included. Uses each booking’s scheduled installation date and signed minimum term; availability and inbound dates are not installation dates.` : 'Showing current rental commitments only.'}</p>
        {includeFuture&&futureDateReview>0&&<p role="status" className="text-xs text-amber-800">{futureDateReview} included bookings have installation dates that need rescheduling / review. Their revenue is projected using the recorded dates; bookings are not confirmed by this chart.</p>}
        {includeFuture&&futureMissingDate>0&&<p role="status" className="text-xs text-amber-800">{futureMissingDate} signed future contracts excluded because an installation date is missing. Set it in Bookings.</p>}
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
      <p className="mt-3 text-xs text-muted-foreground">Each month includes a signed contract if its rental period overlaps that month. The inventory "Committed until" date overrides the contract term when set. Future contracts require a scheduled installation date in Bookings. Dates flagged for review are used for projections only.</p>
    </section>
  );
}