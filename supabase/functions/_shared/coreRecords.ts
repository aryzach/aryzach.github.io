/** Called only after admin-api's existing password check. No provider calls or public queries. */
// deno-lint-ignore no-explicit-any
export async function readCoreRecords(client: any) {
  const queries = await Promise.all([
    client.from('customer_profiles').select('id,kind,display_name,email,phone,archived_at,version,primary_contact_name').order('created_at'),
    client.from('reservation_customer_links').select('reservation_id,customer_id'),
    client.from('rentals').select('id,customer_id,originating_reservation_id,service_address,notes,origin').order('created_at'),
    client.from('sauna_inventory').select('id,unit_code,model,status,current_customer_id,future_customer_id,install_date,sauna_type_id,retired_on'),
    client.from('reservations').select('id,created_at,reservation_status,install_address,sauna_type_id,stripe_customer_id,booking_kind,booked_on'),
    client.from('sauna_types').select('id,name'),
    client.from('xero_customer_links').select('tenant_id,contact_id,customer_id,contact_name,organisation_short_code,origin'),
  ]);
  for (const result of queries) if (result.error) throw result.error;
  const [profiles, links, rentals, assets, reservations, types, xeroLinks] = queries.map(result => result.data || []);
  const typeName = (id: string) => types.find((t: { id: string; name: string }) => t.id === id)?.name || id || '';
  return {
    // deno-lint-ignore no-explicit-any
    xeroLinks: xeroLinks.map((l: any) => ({ tenantId: l.tenant_id, contactId: l.contact_id, customerId: l.customer_id, name: l.contact_name, ...(l.organisation_short_code ? {shortCode:l.organisation_short_code}:{}), ...(l.origin ? {origin:l.origin}:{}) })),
    // deno-lint-ignore no-explicit-any
    reservations: reservations.map((r: any) => ({ id: r.id, createdAt: r.created_at || '', status: r.reservation_status || '', address: r.install_address || '', saunaType: typeName(r.sauna_type_id), stripeCustomerId: r.stripe_customer_id || null,bookingKind:r.booking_kind||'website',bookedOn:r.booked_on||null })),
    // deno-lint-ignore no-explicit-any
    customers: profiles.map((p: any) => ({ id: p.id, kind: p.kind, name: p.display_name || '', email: p.email || '', phone: p.phone || '', primaryContact:p.primary_contact_name||'', archived: !!p.archived_at, version: p.version, legacyReservationIds: links.filter((l: any) => l.customer_id === p.id).map((l: any) => l.reservation_id) })),
    // deno-lint-ignore no-explicit-any
    rentals: rentals.map((r: any) => ({ id: r.id, customerId: r.customer_id, reservationId: r.originating_reservation_id, address: r.service_address || '', notes: r.notes || '', ...(r.origin === 'legacy_inventory_link' ? { source: 'inventory_link' } : {}) })),
    // deno-lint-ignore no-explicit-any
    assets: assets.map((a: any) => ({ id: a.id, code: a.unit_code || '', model: a.model || '', sourceStatus: a.retired_on ? 'Retired' : a.status, typeName: typeName(a.sauna_type_id) })),
    assignments: [],
    // Existing inventory stays the operational authority in this phase. No dated history is inferred.
    // deno-lint-ignore no-explicit-any
    legacyLinks: assets.flatMap((a: any) => ['current','future'].flatMap(kind => {
      const reservationId = a[`${kind}_customer_id`];
      if (!reservationId) return [];
      // deno-lint-ignore no-explicit-any
      const rental = rentals.find((r: any) => r.originating_reservation_id === reservationId);
      return rental ? [{ assetId: a.id, rentalId: rental.id, kind, recordedInstallDate: kind === 'current' ? a.install_date : null }] : [];
    })),
  };
}
