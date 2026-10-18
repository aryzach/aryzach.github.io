import { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { latestInstalledType, ltvTimeline, pacificToday, sourcesFromLocalWorkspace, type LtvPoint, type LtvSources } from '@/lib/ltvTimeline';
import type { RentalWorkspace } from '@/lib/rentalModel';

const dollars = (value: number | null) => value === null ? 'Unknown' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const dateLabel = (value: string) => new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
function PointTooltip({ active, payload }: { active?: boolean; payload?: { payload: LtvPoint }[] }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return <div className="max-w-xs rounded-lg border bg-background p-4 text-sm shadow-lg">
    <p className="font-semibold">{dateLabel(point.date)}{point.partial ? ' · partial month' : ''}</p>
    <dl className="mt-3 space-y-1"><div className="flex justify-between gap-6"><dt>Avg. committed</dt><dd>{dollars(point.committed)}</dd></div><div className="flex justify-between gap-6"><dt>Avg. actual</dt><dd>{dollars(point.actual)}</dd></div></dl>
    <p className="mt-3 text-muted-foreground">{point.customers} of {point.eligible} installed customers included. {point.excluded ? `${point.excluded} excluded for missing information.` : ''}</p>
    {!!point.estimatedDates && <p className="mt-2 text-xs text-muted-foreground">{point.estimatedDates} use installation as an undated agreement’s starting point.</p>}
    {!!point.unverifiedTerms && <p className="mt-2 text-xs text-muted-foreground">{point.unverifiedTerms} have recorded terms with unverified signatures.</p>}
  </div>;
}
export function LtvTimelineChart({ state, onReadSources }: { state: RentalWorkspace; onReadSources?: () => Promise<LtvSources> }) {
  const today = pacificToday();
  const first = (state.lifecycle?.rentals || []).filter(r => r.purpose !== 'purchase' && r.lifecycle_state !== 'canceled' && r.actual_start && !r.owner_review?.neverInstalled).map(r => r.actual_start!).sort()[0] || today;
  const [from, setFrom] = useState(first);
  const [to, setTo] = useState(today);
  const [chosen, setChosen] = useState<string[] | undefined>();
  const [sources, setSources] = useState<LtvSources | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let canceled = false; setError(''); setSources(null);
    const load = onReadSources ? onReadSources() : Promise.resolve(sourcesFromLocalWorkspace(state));
    load.then(result => { if (!canceled) setSources(result); }).catch(() => { if (!canceled) setError('Could not load the imported payment history. Try again.'); });
    return () => { canceled = true; };
  }, [onReadSources, state, attempt]);
  const types = useMemo(() => [...new Set((state.lifecycle?.rentals || []).filter(r => r.purpose !== 'purchase' && r.lifecycle_state !== 'canceled' && r.actual_start && !r.owner_review?.neverInstalled).map(r => latestInstalledType(state, r.customer_id)))].sort(), [state]);
  const result = useMemo(() => {
    if (!sources) return { chart: null, invalid: '' };
    try { return { chart: ltvTimeline(state, sources, { from, to, today, types: chosen }), invalid: '' }; }
    catch (e) { return { chart: null, invalid: e instanceof Error ? e.message : 'Choose a valid date range.' }; }
  }, [state, sources, from, to, today, chosen]);
  const latest = result.chart?.points.at(-1);
  return <section aria-label="Rental LTV over time" className="rounded-xl border bg-card p-5 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="text-xl font-semibold">Rental LTV over time</h3><p className="mt-1 text-sm text-muted-foreground">Average per installed customer · includes past renters · rental revenue only</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs">Calendar month-end</span></div>
    <div className="mt-6 flex flex-wrap items-end gap-3"><label className="space-y-1 text-sm"><span className="block text-muted-foreground">From</span><Input className="w-44" type="date" aria-label="LTV from date" value={from} max={to} onChange={e => setFrom(e.target.value)} /></label><label className="space-y-1 text-sm"><span className="block text-muted-foreground">Through</span><Input className="w-44" type="date" aria-label="LTV through date" value={to} min={from} max={today} onChange={e => setTo(e.target.value)} /></label><Button variant="outline" onClick={() => { setFrom(first); setTo(today); setChosen(undefined); }}>All history & types</Button></div>
    <fieldset className="mt-5"><legend className="mb-2 text-sm font-medium">Latest installed sauna type</legend><div className="flex flex-wrap gap-x-5 gap-y-2">{types.map(type => <label key={type} className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={chosen === undefined || chosen.includes(type)} onChange={e => setChosen(e.target.checked ? [...(chosen || types), type] : (chosen || types).filter(t => t !== type))} />{type}</label>)}</div><p className="mt-2 text-xs text-muted-foreground">Each customer is counted once. Their full rental history follows their latest installed type, including earlier swaps.</p></fieldset>
    {error && <div role="alert" className="mt-6 flex items-center gap-3 text-sm">{error}<Button variant="outline" onClick={() => setAttempt(a => a + 1)}>Try again</Button></div>}
    {!sources && !error && <p role="status" className="py-20 text-center text-muted-foreground">Loading imported payment history…</p>}
    {result.invalid && <p role="alert" className="mt-6 text-sm text-destructive">{result.invalid}</p>}
    {result.chart && <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3"><div className="rounded-lg bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Average committed LTV</p><p className="mt-1 text-2xl font-semibold tabular-nums">{dollars(latest?.committed ?? null)}</p></div><div className="rounded-lg bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Average actual LTV</p><p className="mt-1 text-2xl font-semibold tabular-nums">{dollars(latest?.actual ?? null)}</p></div><div className="rounded-lg bg-muted/50 p-4"><p className="text-xs text-muted-foreground">Same customers in both averages</p><p className="mt-1 text-2xl font-semibold tabular-nums">{latest?.customers || 0}<span className="text-base font-normal text-muted-foreground"> / {latest?.eligible || 0}</span></p></div></div>
      <p className="mt-3 text-xs text-muted-foreground">As of {dateLabel(to)}{latest?.partial ? ' · current endpoint is a partial month' : ''}. Unknown terms or incomplete payment history exclude a customer from both lines. {latest && latest.customers < latest.eligible / 2 ? "Coverage is limited; these averages do not represent the full customer base yet." : ""}</p>
      <div className="mt-6 flex flex-wrap gap-5 text-sm"><span className="flex items-center gap-2"><span className="w-7 border-t-[3px] border-dashed border-[#a96b32]" />Average committed LTV</span><span className="flex items-center gap-2"><span className="w-7 border-t-[3px] border-[#256b78]" />Average actual LTV</span></div>
      {result.chart.points.some(p => p.customers) && <div className="mt-4 h-[350px] w-full" aria-label="Monthly average committed and actual rental LTV in dollars">
        <ResponsiveContainer width="100%" height="100%"><LineChart data={result.chart.points} margin={{ top: 16, right: 16, bottom: 10, left: 8 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="date" tickFormatter={d => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })} minTickGap={32} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} /><YAxis width={66} tickFormatter={dollars} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} domain={[(minimum: number) => Math.min(0, minimum), 'auto']} /><Tooltip content={<PointTooltip />} />
          <Line type="linear" dataKey="committed" name="Average committed LTV" stroke="#a96b32" strokeWidth={2.5} strokeDasharray="7 4" dot={{ r: 2 }} activeDot={{ r: 4 }} connectNulls={false} isAnimationActive={false} /><Line type="linear" dataKey="actual" name="Average actual LTV" stroke="#256b78" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 4 }} connectNulls={false} isAnimationActive={false} />
        </LineChart></ResponsiveContainer>
      </div>}
      {!result.chart.points.some(p => p.customers) && <p role="status" className="text-center text-sm text-muted-foreground">No customers with sufficient data in this selection.</p>}
      {latest && (latest.excluded > 0 || latest.estimatedDates > 0 || latest.unverifiedTerms > 0) && <div className="mt-4 rounded-lg border p-4 text-sm"><p>{latest.excluded} customers excluded at the selected endpoint. {latest.estimatedDates} included customers use installation dates for undated agreements; {latest.unverifiedTerms} have unverified signatures.</p>{result.chart.gaps.length > 0 && <details className="mt-2"><summary className="cursor-pointer text-primary">See missing information</summary><ul className="mt-3 space-y-2">{result.chart.gaps.map(g => <li key={g.customerId}><span className="font-medium">{g.name}</span> — {g.reasons.join(' ') || 'Rental commitment needs review.'}</li>)}</ul></details>}</div>}
      <details className="mt-5 text-sm"><summary className="cursor-pointer text-primary">How to read this chart</summary><div className="mt-3 max-w-3xl space-y-3 text-muted-foreground"><p>Committed LTV is the recorded minimum rent plus monthly rental add-ons for agreements known by each date. Undated agreements start at installation for this chart; they are flagged above. Unknown early-exit settlements stay unknown.</p><p>Actual LTV is cumulative rental cash received, including prepaid rent and rental add-ons, minus rental refunds. It excludes deposits, tax, sales, delivery and reviewed duplicates. It is cash collected, not earned accounting revenue or a forecast.</p><p>Every point uses the same complete-data customers for both lines, counted once after their first installation. Past renters remain included. New customers can lower the average even while existing customers keep paying. This compares your customer base over calendar time, rather than customers at equal rental ages.</p><p>Date filters change which points are shown; earlier lifetime payments still count. Historical points are recalculated from current corrected records, without storing old versions. Sauna-type groups use the latest recorded installed type, not the unit’s type after a conversion.</p>{result.chart.snapshotAt && <p>Imported Xero data through {new Date(result.chart.snapshotAt).toLocaleString()}. Refresh Xero from Customers → Sync now.</p>}</div></details>
      <details className="mt-4 text-sm"><summary className="cursor-pointer text-primary">Monthly values</summary><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-2">As of</th><th className="p-2">Avg. committed</th><th className="p-2">Avg. actual</th><th className="p-2">Customers included</th></tr></thead><tbody>{result.chart.points.map(p => <tr className="border-b" key={p.date}><td className="p-2">{dateLabel(p.date)}{p.partial ? ' *' : ''}</td><td className="p-2 tabular-nums">{dollars(p.committed)}</td><td className="p-2 tabular-nums">{dollars(p.actual)}</td><td className="p-2">{p.customers} / {p.eligible}</td></tr>)}</tbody></table></div></details>
    </>}
  </section>;
}
