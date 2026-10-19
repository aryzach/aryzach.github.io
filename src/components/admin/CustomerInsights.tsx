import {SaunaRecoveryDashboard} from './SaunaRecoveryDashboard';
import type {RecoverySources} from '@/lib/saunaRecovery';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RevenueDashboard, type RevenueUnit } from './RevenueDashboard';
import { XeroConnection } from './XeroConnection';
import { LtvTimelineChart } from './LtvTimelineChart';
import type { RentalWorkspace } from '@/lib/rentalModel';
import type { LtvSources } from '@/lib/ltvTimeline';

export function CustomerInsights({ password, state, onReadSources, onReadRecovery, inventory }: { inventory: RevenueUnit[]; password: string; state: RentalWorkspace | null; onReadRecovery?: () => Promise<RecoverySources>; onReadSources?: () => Promise<LtvSources> }) {
  const [chart,setChart]=useState("ltv");
  return <section className="space-y-6 py-4" aria-label="Dashboard">
    <div><h2 className="text-2xl font-semibold">Dashboard</h2><p className="mt-2 text-sm text-muted-foreground">Rental commitments, payments and monthly revenue.</p></div>
    <Tabs value={chart} onValueChange={setChart}>
      <TabsList aria-label="Dashboard charts" className="h-auto flex-wrap justify-start"><TabsTrigger value="ltv">LTV</TabsTrigger><TabsTrigger value="revenue">Guaranteed monthly revenue</TabsTrigger><TabsTrigger value="recovery">Sauna cost recovery</TabsTrigger></TabsList>
      <TabsContent value="ltv">{state ? <LtvTimelineChart state={state} onReadSources={onReadSources} /> : <p role="status">Loading customer records…</p>}</TabsContent>
      <TabsContent value="revenue"><RevenueDashboard inventory={inventory} state={state}/></TabsContent>
      <TabsContent value="recovery">{state ? <SaunaRecoveryDashboard state={state} onRead={onReadRecovery}/> : <p role="status">Loading sauna records…</p>}</TabsContent>
    </Tabs>
    <details className="rounded-lg border p-4"><summary className="cursor-pointer text-sm font-medium">Xero connection settings</summary><div className="mt-4"><XeroConnection password={password} /></div></details>
  </section>;
}
