import { emptyRentalWorkspace, type RentalWorkspace } from './rentalModel.ts';

type SourceReservation = { id: string; first_name?: string; last_name?: string; email?: string; phone?: string; install_address?: string; crm_monthly_price?: number };
type SourceAsset = { id: string; unit_code?: string; model?: string; status?: string; current_customer_id?: string; future_customer_id?: string; install_date?: string; sauna_type_id?: string; model_key?: string; style?: string; locations?: string[]; indoor_outdoor_eligibility?: string; current_customer?: string; future_customer?: string; minimum_term_ends?: string; available_date?: string; admin_notes?: string; reservation_id?: string; updated_at?: string; created_at?: string };
/** Explicit allowlist. Access tokens, documents and provider credentials never enter the preview. */
export function importRentalSnapshot(snapshot: { exported_at: string; tables: { reservations: SourceReservation[]; sauna_inventory: SourceAsset[]; sauna_types?: { id: string; name: string; sort_order: number }[]; contracts?: { reservation_id: string; status: string; monthly_price: number; commitment_months: number; signed_at: string; created_at: string }[] } }): RentalWorkspace {
  const state = emptyRentalWorkspace();
  state.source = { exportedAt: snapshot.exported_at };
  state.legacyLinks = [];
  const reservations = new Map(snapshot.tables.reservations.map(r => [r.id, r]));
  state.customers = snapshot.tables.reservations.map(r => ({ id: `local-customer:${r.id}`, kind: 'unknown', name: [r.first_name, r.last_name].filter(Boolean).join(' ').trim(), email: r.email || '', phone: r.phone || '', archived: false, legacyReservationIds: [r.id] }));
  state.assets = snapshot.tables.sauna_inventory.map(a => ({ id: a.id, code: a.unit_code || '', model: a.model || '', sourceStatus: a.status || 'Unknown' }));
  const linkedReservationIds = new Set<string>();
  for (const asset of snapshot.tables.sauna_inventory) {
    for (const [kind, reservationId] of [['current', asset.current_customer_id], ['future', asset.future_customer_id]] as const) {
      if (!reservationId) continue;
      if (!reservations.has(reservationId)) throw new Error('Snapshot contains an unresolved inventory/customer link.');
      linkedReservationIds.add(reservationId);
      state.legacyLinks.push({ assetId: asset.id, rentalId: `local-rental:${reservationId}`, kind, recordedInstallDate: kind === 'current' ? asset.install_date || null : null });
    }
  }
  state.rentals = [...linkedReservationIds].map(reservationId => ({ id: `local-rental:${reservationId}`, customerId: `local-customer:${reservationId}`, reservationId, address: reservations.get(reservationId)!.install_address || '', notes: '', source: 'inventory_link' }));
  const selectedStatuses = new Map<string, string>();
  const contracts = new Map<string, { monthly_price: number; commitment_months: number; signed_at: string | null }>();
  for (const contract of [...(snapshot.tables.contracts || [])].filter(c => c.status !== 'Voided').sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    const existing = contracts.get(contract.reservation_id);
    if (!existing || (selectedStatuses.get(contract.reservation_id) !== 'Signed' && contract.status === 'Signed')) { selectedStatuses.set(contract.reservation_id, contract.status); contracts.set(contract.reservation_id, { monthly_price: contract.monthly_price, commitment_months: contract.commitment_months, signed_at: contract.status === 'Signed' ? contract.signed_at : null }); }
  }
  state.legacyTypes = (snapshot.tables.sauna_types || []).map(t => ({ id: t.id, name: t.name, sort_order: t.sort_order }));
  state.legacyInventory = snapshot.tables.sauna_inventory.map(a => ({
    id: a.id, unit_code: a.unit_code || null, sauna_type_id: a.sauna_type_id || '', model: a.model || null,
    model_key: a.model_key || '', style: a.style || '', locations: a.locations || [],
    indoor_outdoor_eligibility: a.indoor_outdoor_eligibility || 'either', status: a.status || '',
    current_customer: a.current_customer || null, future_customer: a.future_customer || null,
    current_customer_id: a.current_customer_id || null, future_customer_id: a.future_customer_id || null,
    install_date: a.install_date || null, minimum_term_ends: a.minimum_term_ends || null,
    available_date: a.available_date || null, admin_notes: a.admin_notes || null, reservation_id: a.reservation_id || null,
    created_at: a.created_at || '', updated_at: a.updated_at || '',
    monthly_price: (a.current_customer_id ? contracts.get(a.current_customer_id)?.monthly_price ?? reservations.get(a.current_customer_id)?.crm_monthly_price : null) ?? null,
    current_contract: a.current_customer_id ? contracts.get(a.current_customer_id) || null : null,
    future_contract: a.future_customer_id ? contracts.get(a.future_customer_id) || null : null,
  }));
  // Imported links are evidence to review, not confirmed actual installation intervals.
  return state;
}
