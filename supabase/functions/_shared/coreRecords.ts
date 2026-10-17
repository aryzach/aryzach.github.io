/** Called only after admin-api's existing password check. No provider calls or public queries. */
// deno-lint-ignore no-explicit-any
export async function readCoreRecords(client: any) {
  const queries = await Promise.all([
    client.from('customer_profiles').select('id,kind,display_name,email,phone,archived_at,version').order('created_at'),
    client.from('reservation_customer_links').select('reservation_id,customer_id'),
    client.from('rentals').select('id,customer_id,originating_reservation_id,service_address,notes,origin').order('created_at'),
    client.from('sauna_inventory').select('id,unit_code,model,status,current_customer_id,future_customer_id,install_date'),
  ]);
  for (const result of queries) if (result.error) throw result.error;
  const [profiles, links, rentals, assets] = queries.map(result => result.data || []);
  return {
    // deno-lint-ignore no-explicit-any
    customers: profiles.map((p: any) => ({ id: p.id, kind: p.kind, name: p.display_name || '', email: p.email || '', phone: p.phone || '', archived: !!p.archived_at, version: p.version, legacyReservationIds: links.filter((l: any) => l.customer_id === p.id).map((l: any) => l.reservation_id) })),
    // deno-lint-ignore no-explicit-any
    rentals: rentals.map((r: any) => ({ id: r.id, customerId: r.customer_id, reservationId: r.originating_reservation_id, address: r.service_address || '', notes: r.notes || '', ...(r.origin === 'legacy_inventory_link' ? { source: 'inventory_link' } : {}) })),
    // deno-lint-ignore no-explicit-any
    assets: assets.map((a: any) => ({ id: a.id, code: a.unit_code || '', model: a.model || '', sourceStatus: a.status })),
    assignments: [],
    // Existing inventory stays the operational authority in this phase. No dated history is inferred.
    // deno-lint-ignore no-explicit-any
    legacyLinks: assets.flatMap((a: any) => ['current','future'].flatMap(kind => {
      // deno-lint-ignore no-explicit-any
      const rental = rentals.find((r: any) => r.originating_reservation_id === a[`${kind}_customer_id`]);
      return rental ? [{ assetId: a.id, rentalId: rental.id, kind, recordedInstallDate: kind === 'current' ? a.install_date : null }] : [];
    })),
  };
}
