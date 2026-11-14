import { emptyRentalWorkspace } from "../../src/lib/rentalModel.ts";
import {
  emptyLifecycle,
  type LifecycleTerm,
} from "../../src/lib/lifecycleModel.ts";
export const scatterTerm = (
  patch: Partial<LifecycleTerm> = {},
): LifecycleTerm => ({
  id: "t",
  rental_id: "r",
  agreement_id: "a",
  state: "active",
  effective_from: "2026-01-01",
  effective_until: null,
  minimum_months: 12,
  commitment_start: null,
  base_monthly_cents: 50000,
  extras: [{ name: "Heater", amountCents: 2000 }],
  currency: "USD",
  sauna_type: "Outdoor Traditional",
  source: "Contract",
  note: null,
  ...patch,
});
export function scatterFixture() {
  const state = emptyRentalWorkspace();
  state.customers = [
    {
      id: "c",
      name: "Example Current",
      email: "",
      phone: "",
      kind: "person",
      archived: false,
      legacyReservationIds: [],
    },
  ];
  state.lifecycle = {
    ...emptyLifecycle(),
    rentals: [
      {
        id: "r",
        customer_id: "c",
        originating_reservation_id: null,
        purpose: "rental",
        lifecycle_state: "active",
        actual_start: "2026-01-01",
        actual_end: null,
        actual_start_source: "owner",
        version: 1,
        history_gaps: [],
        service_address: null,
      },
    ],
    agreements: [
      {
        id: "a",
        rental_id: "r",
        contract_id: null,
        document_id: null,
        label: "Agreement",
        agreement_date: "2026-01-01",
        signed_on: "2026-01-01",
        signing_state: "signed",
        source_terms: {},
        owner_corrections: {},
      },
    ],
    terms: [scatterTerm()],
  };
  return state;
}
