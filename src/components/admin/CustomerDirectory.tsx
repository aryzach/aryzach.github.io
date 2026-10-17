import { useState, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { customerName, type CustomerProfile, type RentalWorkspace } from '@/lib/rentalModel';
import { customerDirectory, filterDirectory, stripeCustomerUrl, type DirectoryColumn, type DirectoryFilters } from '@/lib/customerDirectory';
import { ColResizeHandle, useResizableColumns } from '@/hooks/useResizableColumns';
const columns = ['name', 'phone', 'reservations', 'saunas', 'stripe'] as const;
const labels = { name: 'Name', phone: 'Phone', reservations: 'Reservations', saunas: 'Current sauna · number / type', stripe: 'Stripe customer' };
const cell = 'px-2 py-1 border-r border-border align-top break-words';
const link = 'text-primary underline underline-offset-2 hover:text-primary/80';
export default function CustomerDirectory({ state, actions }: { state: RentalWorkspace; actions?: (customer: CustomerProfile) => ReactNode }) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<DirectoryFilters>({});
  const [showArchived, setShowArchived] = useState(false);
  const [sort, setSort] = useState<DirectoryColumn>('name');
  const [descending, setDescending] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(() => new URLSearchParams(location.search).get('customerReservation'));
  const { widths, startResize, totalWidth } = useResizableColumns('sf-customer-directory-columns-v1', columns, 200);
  const rows = filterDirectory(customerDirectory(state), search, filters, showArchived, sort, descending);
  const reservation = state.reservations?.find(r => r.id === reservationId);
  const owner = state.customers.find(c => c.legacyReservationIds.includes(reservationId || ''));
  return <>
    <div className="flex flex-wrap items-center gap-4"><Input className="max-w-sm" aria-label="Search customers" placeholder="Search customers, reservations or saunas…" value={search} onChange={e => setSearch(e.target.value)} /><Label className="flex items-center gap-2"><input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />Show archived</Label><span role="status" className="text-xs text-muted-foreground">{rows.length} of {state.customers.length} customers</span></div>
    <div className="max-h-[calc(100vh-16rem)] overflow-auto rounded-md border border-border bg-card"><table aria-label="Customers" className="table-fixed border-collapse text-left text-xs" style={{ width: totalWidth + (actions ? 240 : 0), minWidth: '100%' }}>
      <colgroup>{columns.map(c => <col key={c} style={{ width: widths[c] }} />)}{actions && <col style={{ width: 240 }} />}</colgroup>
      <thead className="sticky top-0 z-10 bg-muted text-[10px] uppercase tracking-wide text-muted-foreground shadow-[0_1px_0_0_hsl(var(--border))]">
        <tr>{columns.map(c => <th key={c} className="relative border-r border-border px-2 py-1.5 font-medium" aria-sort={sort === c ? descending ? 'descending' : 'ascending' : 'none'}><button className="w-full text-left uppercase" onClick={() => { if (sort === c) setDescending(!descending); else { setSort(c); setDescending(false); } }}>{labels[c]} {sort === c ? descending ? '↓' : '↑' : '↕'}</button><ColResizeHandle onMouseDown={e => startResize(c, e)} /></th>)}{actions && <th className={cell}>Actions</th>}</tr>
        <tr>{columns.map(c => <th key={c} className="border-r border-border p-1"><input className="h-7 w-full rounded-sm border border-input bg-background px-2 text-xs font-normal normal-case tracking-normal" aria-label={`Filter ${labels[c]}`} placeholder="Filter…" value={filters[c] || ''} onChange={e => setFilters({ ...filters, [c]: e.target.value })} /></th>)}{actions && <th />}</tr>
      </thead><tbody>{rows.map(row => <tr key={row.customer.id} className="border-t border-border">
        <td className={cell}><strong>{customerName(row.customer)}</strong>{row.customer.archived && <span className="block text-muted-foreground">Archived</span>}</td>
        <td className={cell}>{row.customer.phone || '—'}</td>
        <td className={cell}>{row.reservations.length ? row.reservations.map(r => <a key={r.id} className={`${link} block`} href={`?customerReservation=${encodeURIComponent(r.id)}`} onClick={e => { e.preventDefault(); setReservationId(r.id); }} title={r.id}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Reservation'} · {r.id.slice(0, 8)}</a>) : '—'}</td>
        <td className={cell}>{row.saunas.length ? row.saunas.map(a => <div key={a.id}>{a.code || 'Unnumbered'} · {a.typeName || a.model || 'Type unknown'}</div>) : '—'}</td>
        <td className={cell}>{row.stripeIds.length ? row.stripeIds.map(id => <a key={id} className={`${link} block`} href={stripeCustomerUrl(id)!} target="_blank" rel="noopener noreferrer">{id}</a>) : '—'}</td>
        {actions && <td className={cell}>{actions(row.customer)}</td>}
      </tr>)}{!rows.length && <tr><td colSpan={actions ? 6 : 5} className="p-3 text-muted-foreground">No matching customers.</td></tr>}</tbody>
    </table></div>
    <Dialog open={!!reservationId} onOpenChange={open => { if (!open) setReservationId(null); }}><DialogContent><DialogHeader><DialogTitle>Reservation</DialogTitle></DialogHeader>{reservation ? <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm"><dt>Customer</dt><dd>{owner ? customerName(owner) : '—'}</dd><dt>Reservation ID</dt><dd className="break-all">{reservation.id}</dd><dt>Created</dt><dd>{reservation.createdAt ? new Date(reservation.createdAt).toLocaleString() : '—'}</dd><dt>Status</dt><dd>{reservation.status || '—'}</dd><dt>Sauna type</dt><dd>{reservation.saunaType || '—'}</dd><dt>Service address</dt><dd>{reservation.address || '—'}</dd></dl> : <p className="text-sm">Reservation details are unavailable. Refresh the customer records to try again.</p>}</DialogContent></Dialog>
  </>;
}
