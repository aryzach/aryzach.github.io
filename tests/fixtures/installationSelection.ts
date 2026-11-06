import {
  emptyRentalWorkspace,
  type RentalWorkspace,
} from "../../src/lib/rentalModel.ts";
import {
  emptyLifecycle,
  type LifecycleRental,
} from "../../src/lib/lifecycleModel.ts";
import type { Booking } from "../../src/lib/bookingModel.ts";
export const rental: LifecycleRental = {
  id: "rental-target",
  customer_id: "customer-target",
  originating_reservation_id: "booking-target",
  lifecycle_state: "planned",
  actual_start: null,
  actual_end: null,
  actual_start_source: null,
  version: 1,
  history_gaps: [],
  service_address: null,
};
export function installationFixture(): RentalWorkspace {
  const booking: Booking = {
    id: "booking-target",
    customerId: "customer-target",
    customerName: "Test Customer",
    rentalId: rental.id,
    state: "confirmed",
    version: 1,
    installOn: "2026-11-05",
    saunaId: "unit-56",
    saunaCode: "056",
    saunaTypeId: "outdoor",
    saunaType: "Outdoor Traditional",
    source: "website",
    legacyStatus: null,
    confirmationMode: "automatic",
    confirmationNote: null,
    readiness: {
      agreement: true,
      deposit: true,
      photoId: true,
      numberedUnit: true,
      date: true,
    },
    rentalState: "planned",
    purpose: "rental",
    createdAt: "",
    holdDeadline: null,
    installAddress: null,
  };
  return {
    ...emptyRentalWorkspace(),
    customers: [
      {
        id: "customer-target",
        kind: "person",
        name: "Test Customer",
        email: "",
        phone: "",
        archived: false,
        legacyReservationIds: ["booking-target"],
      },
    ],
    assets: [
      {
        id: "unit-56",
        code: "056",
        model: "Cedar",
        typeName: "Outdoor Traditional",
        sourceStatus: "Incoming",
      },
      {
        id: "unit-2",
        code: "002",
        model: "Cedar",
        typeName: "Outdoor Traditional",
        sourceStatus: "Available",
      },
      {
        id: "unit-49",
        code: "049",
        model: "Cedar",
        typeName: "Outdoor Traditional",
        sourceStatus: "Available",
      },
    ],
    bookings: [booking],
    legacyLinks: [
      {
        rentalId: rental.id,
        assetId: "unit-56",
        kind: "future",
        recordedInstallDate: null,
      },
    ],
    lifecycle: { ...emptyLifecycle(), rentals: [rental] },
  };
}
