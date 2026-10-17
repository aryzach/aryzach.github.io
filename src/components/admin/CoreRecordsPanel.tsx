import { useState, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { addAsset, addAssignment, addRental, customerName, possibleDuplicates, recordReturn, rentalStatus, saveCustomer, type CustomerProfile, type RentalWorkspace } from '@/lib/rentalModel';

export type CoreTab = 'customers' | 'rentals' | 'inventory';
type Editor = { kind: 'customer'; customer?: CustomerProfile } | { kind: 'rental'; customerId?: string } | { kind: 'asset' } | { kind: 'install'; rentalId: string } | { kind: 'return'; assignmentId: string };
import { storageKey } from '@/dev/coreWorkspace';

const fieldClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';
function Field({ label, children }: { label: string; children: ReactNode }) { return <Label className="grid gap-2 font-normal">{label}{children}</Label>; }
function Empty({ title, text, action, onClick }: { title: string; text: string; action: string; onClick: () => void }) {
  return <div className="rounded-lg border border-dashed bg-card px-6 py-12 text-center"><h3 className="text-lg font-semibold">{title}</h3><p className="mx-auto my-3 max-w-lg text-sm text-muted-foreground">{text}</p><Button onClick={onClick}>{action}</Button></div>;
}
function RecordsTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="max-h-[calc(100vh-12rem)] overflow-auto rounded-md border border-border bg-card"><table className="w-full min-w-[720px] border-collapse text-left text-xs"><thead className="sticky top-0 z-10 bg-muted text-[10px] uppercase tracking-wide text-muted-foreground shadow-[0_1px_0_0_hsl(var(--border))]"><tr>{headers.map(h => <th key={h} className="px-2 py-1.5 border-r border-border font-medium">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
const cell = 'px-2 py-1 border-r border-border align-top';
export default function CoreRecordsPanel({ tab, state, onChange, onTab, onCommand }: { tab: CoreTab; state: RentalWorkspace; onChange: (state: RentalWorkspace) => void; onTab: (tab: CoreTab) => void; onCommand?: (command: string, record: Record<string, unknown>) => Promise<void> }) {
  const live = Boolean(onCommand);
  const [saving, setSaving] = useState(false);
  const [draftId, setDraftId] = useState('');
  const readOnly = Boolean(state.source);
  const [loadingCopy, setLoadingCopy] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const close = () => { setEditor(null); setError(''); };
  const open = (next: Editor) => { setError(''); setDraftId(crypto.randomUUID()); setEditor(next); };
  const commit = (next: RentalWorkspace) => {
    if (readOnly) throw new Error('This business snapshot is read only.');
    // Store before updating so a failed storage write never silently discards edits.
    sessionStorage.setItem(storageKey, JSON.stringify(next));
    onChange(next);
  };
  const loadCopy = async () => {
    setLoadingCopy(true); setError('');
    try {
      if (state.customers.length || state.assets.length || state.rentals.length) throw new Error('Open a fresh preview tab to load the copy without replacing your local drafts.');
      const response = await fetch('/__local-records', { headers: { 'x-sf-local-records': '1' }, cache: 'no-store' });
      if (!response.ok) throw new Error('The private local copy is not available in this preview server.');
      const copy: RentalWorkspace = await response.json();
      if (!copy.source?.exportedAt || !Array.isArray(copy.customers) || !Array.isArray(copy.assets) || !Array.isArray(copy.rentals) || !Array.isArray(copy.assignments)) throw new Error('Invalid local copy.');
      commit(copy);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load the local copy.'); }
    finally { setLoadingCopy(false); }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) || '').trim();
    setSaving(true);
    try {
      if (onCommand) {
        if (editor?.kind === 'customer') await onCommand('save_customer', { id: editor.customer?.id || draftId, version: editor.customer?.version, kind: value('kind'), name: value('name'), email: value('email'), phone: value('phone') });
        else if (editor?.kind === 'rental') await onCommand('add_rental', { id: draftId, customerId: value('customerId'), reservationId: null, address: value('address'), notes: value('notes') });
        else throw new Error('Use Inventory to manage current sauna assignments.');
        if (editor?.kind === 'rental') { setSelectedCustomer(value('customerId')); onTab('rentals'); }
        close(); return;
      }
      let next = state;
      if (editor?.kind === 'customer') next = saveCustomer(state, { id: editor.customer?.id || draftId, kind: value('kind') as CustomerProfile['kind'], name: value('name'), email: value('email'), phone: value('phone'), archived: editor.customer?.archived || false, legacyReservationIds: editor.customer?.legacyReservationIds || [] });
      if (editor?.kind === 'rental') next = addRental(state, { id: draftId, customerId: value('customerId'), reservationId: null, address: value('address'), notes: value('notes') });
      if (editor?.kind === 'asset') next = addAsset(state, { id: crypto.randomUUID(), code: value('code'), model: value('model') });
      if (editor?.kind === 'install') next = addAssignment(state, { id: crypto.randomUUID(), rentalId: editor.rentalId, assetId: value('assetId'), installedOn: value('installedOn'), removedOn: null, address: '' });
      if (editor?.kind === 'return') next = recordReturn(state, editor.assignmentId, value('removedOn'));
      commit(next);
      if (editor?.kind === 'rental') { setSelectedCustomer(value('customerId')); onTab('rentals'); }
      setEditor(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save this record.'); }
    finally { setSaving(false); }
  };
  const archive = async (customer: CustomerProfile) => {
    try { if (onCommand) { await onCommand('archive_customer', { id: customer.id, version: customer.version, archived: !customer.archived }); setError(''); return; } commit(saveCustomer(state, { ...customer, archived: !customer.archived })); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update this customer.'); }
  };
  const customers = state.customers.filter(c => (showArchived || !c.archived) && `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase()));
  const visibleRentals = state.rentals.filter(r => !selectedCustomer || r.customerId === selectedCustomer);
  const selected = state.customers.find(c => c.id === selectedCustomer);
  return <section aria-label="Core rental records" className="space-y-3">
    {!live && <div className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
      {state.source ? <><strong>Private local copy · read only.</strong> Snapshot from {new Date(state.source.exportedAt).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} Pacific. {state.customers.length} separate customer profiles · {state.assets.length} saunas. Existing inventory links are shown for review; installation history is unconfirmed. Nothing connects to the live backend.</> : <><strong>Local draft workspace.</strong> Drafts stay in this browser tab. {import.meta.env.DEV && location.hostname === '127.0.0.1' && <Button variant="link" className="h-auto px-2" disabled={loadingCopy} onClick={loadCopy}>{loadingCopy ? 'Loading copy…' : 'Load private business copy'}</Button>}</>}
    </div>}

    {error && !editor && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {tab === 'customers' && <>
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Customers</h2><p className="mt-1 text-sm text-muted-foreground">Reservations stay separate. Shared emails are flagged, never merged automatically.</p></div><Button disabled={readOnly} onClick={() => open({ kind: 'customer' })}>Add customer</Button></div>
      <div className="flex flex-wrap items-center gap-4"><Input className="max-w-sm" aria-label="Search customers" placeholder="Search name, email or phone…" value={search} onChange={e => setSearch(e.target.value)} /><Label className="flex items-center gap-2"><input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />Show archived</Label></div>
      {!state.customers.length ? <Empty title="A home for each customer" text="Add a local customer to try the flow. Existing reservations will keep their original records when profiles are linked during the reviewed data migration." action="Add first customer" onClick={() => open({ kind: 'customer' })} /> : !customers.length ? <p role="status">No matching customers.</p> : <RecordsTable headers={['Customer', 'Contact', 'Reservations', 'Rentals', ...(!readOnly ? ['Actions'] : [])]}>{customers.map(c => <tr key={c.id} className="border-t border-border"><td className={cell}><strong>{customerName(c)}</strong><span className="mt-1 block text-xs text-muted-foreground">{c.kind === 'unknown' ? 'Type unconfirmed' : c.kind === 'business' ? 'Business' : 'Person'}{c.archived ? ' · Archived' : ''}</span>{possibleDuplicates(state.customers, c).length > 0 && <span className="mt-2 block text-xs text-amber-800">Shared email · review separately</span>}</td><td className={`${cell} max-w-[220px] break-all`}>{c.email || 'Email unknown'}<span className="block text-muted-foreground">{c.phone || 'Phone unknown'}</span></td><td className={cell}>{c.legacyReservationIds.length ? <details><summary className="cursor-pointer">{c.legacyReservationIds.length} linked reservation</summary>{c.legacyReservationIds.map(id => <code className="mt-2 block break-all text-xs" key={id}>{id}</code>)}</details> : 'None linked'}</td><td className={cell}><Button variant="link" className="h-auto p-0" onClick={() => { setSelectedCustomer(c.id); onTab('rentals'); }}>View rentals ({state.rentals.filter(r => r.customerId === c.id).length})</Button></td>{!readOnly && <td className={cell}><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={readOnly} onClick={() => open({ kind: 'customer', customer: c })}>Edit</Button><Button variant="outline" size="sm" disabled={readOnly || c.archived} onClick={() => open({ kind: 'rental', customerId: c.id })}>New rental</Button><Button variant="ghost" size="sm" disabled={readOnly} onClick={() => archive(c)}>{c.archived ? 'Restore' : 'Archive'}</Button></div></td>}</tr>)}</RecordsTable>}
    </>}
    {tab === 'rentals' && <>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Rentals</h2><Button disabled={readOnly || !state.customers.some(c => !c.archived)} onClick={() => open({ kind: 'rental', customerId: selectedCustomer || undefined })}>New rental</Button></div>
      {selected && <div className="flex items-center gap-3 text-xs">Rentals for {customerName(selected)}<Button variant="link" size="sm" onClick={() => setSelectedCustomer(null)}>Show all customers</Button></div>}
      {!visibleRentals.length ? <p className="p-3 text-xs text-muted-foreground">No rentals linked to this customer.{!readOnly && <Button variant="link" onClick={() => state.customers.some(c => !c.archived) ? open({ kind: 'rental' }) : onTab('customers')}>Create a local rental</Button>}</p> : <RecordsTable headers={['Customer', 'Service address', 'Status', 'Reservation', 'Saunas / history', 'Notes', 'Actions']}>
        {visibleRentals.map(r => <tr key={r.id} className="border-t border-border">
          <td className={cell}>{customerName(state.customers.find(c => c.id === r.customerId)!)}</td>
          <td className={cell}>{r.address || 'Unknown'}</td>
          <td className={cell}>{rentalStatus(state, r.id)}{r.source && <span className="mt-1 block text-[10px] text-muted-foreground">Existing inventory link; not a verified rental period.</span>}</td>
          <td className={cell}>{r.reservationId ? <details><summary className="cursor-pointer">Linked reservation</summary><code className="block break-all text-[10px]">{r.reservationId}</code></details> : '—'}</td>
          <td className={cell}>
            {state.legacyLinks?.filter(link => link.rentalId === r.id).map(link => <div key={`${link.kind}:${link.assetId}`} className="py-1"><strong>{state.assets.find(a => a.id === link.assetId)?.code || 'Unnumbered'}</strong> · {link.kind === 'current' ? 'Current' : 'Future'}<details><summary className="cursor-pointer text-muted-foreground">Details</summary><p>{state.assets.find(a => a.id === link.assetId)?.sourceStatus}</p><p>{link.recordedInstallDate ? `Recorded install: ${link.recordedInstallDate} (unconfirmed)` : 'Actual installation date unknown'}</p></details></div>)}
            {state.assignments.filter(a => a.rentalId === r.id).map(a => <div key={a.id} className="py-1">{state.assets.find(asset => asset.id === a.assetId)?.code} · {a.installedOn} → {a.removedOn || 'Still installed'}{!a.removedOn && <Button variant="outline" size="sm" className="ml-2 h-6 px-2 text-xs" onClick={() => open({ kind: 'return', assignmentId: a.id })}>Record return</Button>}</div>)}
            {!state.assignments.some(a => a.rentalId === r.id) && <span className="text-[10px] text-muted-foreground">No confirmed installation history</span>}
          </td>
          <td className={cell}>{r.notes || '—'}</td>
          <td className={cell}><Button variant="outline" size="sm" className="h-6 px-2 text-xs" disabled={readOnly || !state.assets.length} onClick={() => live ? onTab('inventory') : open({ kind: 'install', rentalId: r.id })}>{live ? 'Manage in Inventory' : 'Record installation'}</Button></td>
        </tr>)}
      </RecordsTable>}
    </>}
    <Dialog open={!!editor} onOpenChange={isOpen => { if (!isOpen) close(); }}><DialogContent><DialogHeader><DialogTitle>{editor?.kind === 'customer' ? editor.customer ? 'Edit customer' : 'Add customer' : editor?.kind === 'rental' ? 'New rental' : editor?.kind === 'asset' ? 'Add local sauna' : editor?.kind === 'install' ? 'Record installation' : 'Record return'}</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-4" key={JSON.stringify(editor)}>
      <p className="text-xs text-muted-foreground">{live ? 'Save this customer or rental record.' : 'Saved in this preview tab only.'}</p>
      {editor?.kind === 'customer' && <><Field label="Customer type"><select name="kind" className={fieldClass} defaultValue={editor.customer?.kind || 'person'}><option value="person">Person</option><option value="business">Business</option><option value="unknown">Unconfirmed</option></select></Field><Field label="Customer name"><Input name="name" defaultValue={editor.customer?.name} /></Field><Field label="Email"><Input name="email" type="email" defaultValue={editor.customer?.email} /></Field><Field label="Phone"><Input name="phone" type="tel" defaultValue={editor.customer?.phone} /></Field></>}
      {editor?.kind === 'rental' && <><Field label="Customer"><select name="customerId" required className={fieldClass} defaultValue={editor.customerId || ''}><option value="" disabled>Choose a customer</option>{state.customers.filter(c => !c.archived).map(c => <option value={c.id} key={c.id}>{customerName(c)}</option>)}</select></Field><Field label="Service address"><Input name="address" required /></Field><Field label="Rental notes (optional)"><Input name="notes" /></Field><p className="text-xs text-muted-foreground">No booking, contract or payment is created by this action.</p></>}
      {editor?.kind === 'asset' && <><Field label="Sauna number"><Input name="code" required /></Field><Field label="Model (optional)"><Input name="model" /></Field></>}
      {editor?.kind === 'install' && <><Field label="Physical sauna"><select name="assetId" required className={fieldClass} defaultValue=""><option value="" disabled>Choose a sauna</option>{state.assets.map(a => <option key={a.id} value={a.id}>{a.code}{state.assignments.some(link => link.assetId === a.id && !link.removedOn) ? ' · currently installed' : ''}</option>)}</select></Field><Field label="Actual installation date"><Input name="installedOn" type="date" required /></Field><p className="text-xs text-muted-foreground">Use a confirmed date. Scheduled dates and invoices do not establish installation.</p></>}
      {editor?.kind === 'return' && <><Field label="Actual return date"><Input name="removedOn" type="date" required /></Field><p className="text-xs text-muted-foreground">The return date is the first day outside this installation. For a swap, use the same date for the next installation. Day-level records require a return after the installation day.</p></>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={close}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? 'Saving…' : live ? 'Save' : 'Save local draft'}</Button></div>
    </form></DialogContent></Dialog>
  </section>;
}
