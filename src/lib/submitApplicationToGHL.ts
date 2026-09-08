// Job application submissions -> GoHighLevel inbound webhook.
// Webhook + pipeline/stage IDs are configurable via env, never hard-coded credentials.

const WEBHOOK_URL =
  (import.meta.env.VITE_GHL_HIRING_WEBHOOK_URL as string | undefined) ??
  (import.meta.env.VITE_GHL_INBOUND_WEBHOOK_URL as string | undefined) ??
  "https://services.leadconnectorhq.com/hooks/zyM3BNze9gmgtLAoCCQ0/webhook-trigger/a695d8cd-6c35-49f7-92b0-ad7208e52df4";

const PIPELINE_ID = (import.meta.env.VITE_GHL_HIRING_PIPELINE_ID as string | undefined) ?? "";
const STAGE_ID = (import.meta.env.VITE_GHL_HIRING_STAGE_ID as string | undefined) ?? "";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

const UTM_STORAGE_KEY = "sf_sauna_utm";

function storedUtms(): Record<string, string> {
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

/** Current-URL UTMs merged over anything persisted earlier in the session. */
export function currentUtms(): Record<string, string> {
  const out: Record<string, string> = { ...storedUtms() };
  if (typeof window !== "undefined") {
    const params = new URL(window.location.href).searchParams;
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) out[k] = v;
    }
  }
  for (const k of UTM_KEYS) if (!out[k]) out[k] = "";
  return out;
}

export interface ApplicationResult {
  ok: boolean;
  status?: number;
  error?: string;
}

let inflight = false;
let submittedFingerprint: string | null = null;

export async function submitApplicationToGHL(
  fields: Record<string, string>,
  opts: { role: string; source: string; timeoutMs?: number },
): Promise<ApplicationResult> {
  if (!WEBHOOK_URL) return { ok: false, error: "Application webhook is not configured." };

  const fingerprint = JSON.stringify(fields);
  if (inflight) return { ok: false, error: "A submission is already in progress." };
  if (fingerprint === submittedFingerprint) return { ok: true, status: 200 };

  const payload: Record<string, string> = {
    ...fields,
    email: (fields.email || "").trim().toLowerCase(),
    source: opts.source,
    role: opts.role,
    application_status: "New Applicant",
    submitted_at: new Date().toISOString(),
    page_url: typeof window !== "undefined" ? window.location.href : "",
    ...currentUtms(),
  };
  if (PIPELINE_ID) payload.pipeline_id = PIPELINE_ID;
  if (STAGE_ID) payload.pipeline_stage_id = STAGE_ID;

  inflight = true;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15000);
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    submittedFingerprint = fingerprint;
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  } finally {
    clearTimeout(timer);
    inflight = false;
  }
}
