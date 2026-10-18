import { XeroConnection } from './XeroConnection';
import { LtvTimelineChart } from './LtvTimelineChart';
import type { RentalWorkspace } from '@/lib/rentalModel';
import type { LtvSources } from '@/lib/ltvTimeline';

export function CustomerInsights({ password, state, onReadSources }: { password: string; state: RentalWorkspace | null; onReadSources?: () => Promise<LtvSources> }) {
  return <section className="space-y-6 py-4" aria-label="Customer insights">
    <div><h2 className="text-2xl font-semibold">Customer insights</h2><p className="mt-2 text-sm text-muted-foreground">Rental commitments and payments across your installed customer base.</p></div>
    {state ? <LtvTimelineChart state={state} onReadSources={onReadSources} /> : <p role="status">Loading customer records…</p>}
    <details className="rounded-lg border p-4"><summary className="cursor-pointer text-sm font-medium">Xero connection settings</summary><div className="mt-4"><XeroConnection password={password} /></div></details>
  </section>;
}
