/** Synthetic read-only fixtures. Never copy customer or production data here. */
import { PRICING_TIERS } from '../lib/generatedPricing.ts';

export const demoId = '00000000-0000-4000-8000-000000000001';
const names: Record<string, string> = {
  indoor_infrared_standard: 'Indoor Infrared', outdoor_infrared_standard: 'Outdoor Infrared',
  indoor_traditional_standard: 'Indoor Traditional', outdoor_traditional_standard: 'Outdoor Traditional',
  indoor_traditional_original: 'Original Collection Indoor', outdoor_traditional_original: 'Original Collection Outdoor',
};
export const saunaTypes = Object.keys(PRICING_TIERS).map((id, index) => ({
  id, name: names[id], description: 'Preview sauna', placement: id.startsWith('indoor') ? 'indoor' : 'outdoor',
  location: id.startsWith('indoor') ? 'indoor' : 'outdoor', style: id.includes('infrared') ? 'infrared' : 'traditional',
  model_key: id.endsWith('original') ? 'original' : 'standard', sort_order: index,
  reservation_fee_cents: 20000, stripe_payment_link: '',
}));
export const demoReservation = {
  id: demoId, first_name: 'Demo', last_name: 'Customer', email: 'demo@example.invalid', phone: '4155550100',
  city: 'San Francisco', install_address: '123 Example Street', sauna_type_id: 'indoor_traditional_standard',
  preferred_install_at: '2030-01-15T00:00:00Z', reservation_status: 'Pending Payment', payment_status: 'Pending',
  contract_status: 'Not Sent', consult_status: 'Not Scheduled', id_status: 'Not Uploaded',
  created_at: '2030-01-01T00:00:00Z', sauna_inventory_id: null, hold_deadline: null, hold_created_at: null,
  ach_status: 'Not Connected', installation_status: 'Not Scheduled',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json' },
});
const blocked = () => json({ error: 'Preview only: this operation is disabled.' }, 403);

export async function fixtureResponse(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname.startsWith('/rest/v1/')) {
    const table = url.pathname.split('/').pop();
    if (table === 'sauna_types') return json(saunaTypes);
    if (table === 'public_sauna_availability') return json(saunaTypes.map(t => ({
      sauna_type_id: t.id, available_now: 2, next_available_date: null,
    })));
    if (table === 'app_config') return json([]); // Never supply a real checkout destination.
    if (table === 'pricing_tiers') return json(Object.entries(PRICING_TIERS).flatMap(([id, tiers]) =>
      Object.entries(tiers).map(([months, tier]) => ({ sauna_type_id: id, commitment_months: Number(months),
        monthly_price: tier.monthly, install_fee: tier.installFee, badge: tier.badge ?? null }))));
    return blocked(); // Private table reads must not silently return data.
  }
  if (request.method !== 'POST') return blocked();
  const body = await request.json().catch(() => ({}));
  const fn = url.pathname.split('/').pop();
  if (fn === 'reservation-get' && body.id === demoId && body.token === 'preview') {
    return json({ reservation: demoReservation, id_photo: null, sauna_hold: null, assigned_sauna: null, is_waitlisted: false });
  }
  if (fn === 'contract-api' && body.action === 'get' && body.id === demoId && body.token === 'preview') {
    return json({ contract: null, masterAgreementUrl: null });
  }
  if (fn === 'admin-api' || fn === 'accounting-api') {
    const header = fn === 'admin-api' ? 'x-admin-password' : 'x-accounting-password';
    if (request.headers.get(header) !== 'preview') return json({ error: 'Use preview as the demo password.' }, 401);
    const reads: Record<string, unknown> = {
      login: { ok: true }, list_inventory: { inventory: [] },
      list_customers: { customers: [{ id: demoId, name: 'Demo Customer', email: 'demo@example.invalid' }] },
      list_reservations: { reservations: [demoReservation] },
      list_reservations_with_events: { reservations: [demoReservation], events: [] },
      list_waitlist: { entries: [] }, list_agreement_versions: { versions: [] },
      list_accounting: { rows: [] }, list_current_customers: { rows: [] },
    };
    if (Object.prototype.hasOwnProperty.call(reads, body.action)) return json(reads[body.action]);
  }
  return blocked();
}
