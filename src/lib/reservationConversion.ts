const FLAG_KEY = "reservation_request_just_submitted";

type PendingConversion = {
  sauna_type?: string;
  city?: string;
  page_path?: string;
};

/**
 * Mark that a reservation was successfully created. Called right before we
 * navigate to the reservation page — the event itself is fired there so the
 * navigation cannot interrupt the analytics request.
 */
export function markReservationSubmitted(details: PendingConversion = {}) {
  try {
    sessionStorage.setItem(FLAG_KEY, JSON.stringify({ ...details, flag: true }));
  } catch {
    /* storage unavailable — skip */
  }
}

/**
 * On the destination reservation page: fire the conversion once if the flag is
 * present, then clear it so refresh/revisit doesn't duplicate the conversion.
 */
export function flushReservationSubmittedEvent() {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(FLAG_KEY);
    if (raw) sessionStorage.removeItem(FLAG_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  let details: PendingConversion = {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") details = parsed as PendingConversion;
  } catch {
    /* legacy "true" value — no details */
  }

  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: "reservation_request_submitted",
    ...(details.sauna_type ? { sauna_type: details.sauna_type } : {}),
    ...(details.city ? { city: details.city } : {}),
    page_path: details.page_path ?? window.location.pathname,
  });
}
