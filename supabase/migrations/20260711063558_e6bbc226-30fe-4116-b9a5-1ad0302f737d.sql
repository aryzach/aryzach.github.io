ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS video_consult_booking_id text,
  ADD COLUMN IF NOT EXISTS video_consult_scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS installation_booking_id text,
  ADD COLUMN IF NOT EXISTS installation_scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS installation_status text NOT NULL DEFAULT 'Not Scheduled';

CREATE INDEX IF NOT EXISTS reservations_video_consult_booking_id_idx
  ON public.reservations (video_consult_booking_id);
CREATE INDEX IF NOT EXISTS reservations_installation_booking_id_idx
  ON public.reservations (installation_booking_id);