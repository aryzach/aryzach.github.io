ALTER TABLE public.reservations
  ADD COLUMN custom_delivery_fee integer,
  ADD COLUMN custom_stair_elevator_charge integer;

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_custom_delivery_fee_nonnegative
    CHECK (custom_delivery_fee IS NULL OR custom_delivery_fee >= 0),
  ADD CONSTRAINT reservations_custom_stair_charge_nonnegative
    CHECK (custom_stair_elevator_charge IS NULL OR custom_stair_elevator_charge >= 0);