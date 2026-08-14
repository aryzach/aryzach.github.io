// Centralized GoHighLevel inbound webhook client for all lead-capture forms.
// See docs and per-form usage below.

// GoHighLevel inbound webhook. Publicly callable from the browser — safe to ship.
// Override at build time by setting VITE_GHL_INBOUND_WEBHOOK_URL.
const DEFAULT_WEBHOOK_URL =
  "https://services.leadconnectorhq.com/hooks/zyM3BNze9gmgtLAoCCQ0/webhook-trigger/021d1bd1-97d6-41ee-b5e6-8683de1a2a07";
const WEBHOOK_URL =
  (import.meta.env.VITE_GHL_INBOUND_WEBHOOK_URL as string | undefined) ??
  DEFAULT_WEBHOOK_URL;

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

type UtmKey = (typeof UTM_KEYS)[number];
type UtmMap = Partial<Record<UtmKey, string>>;

const UTM_STORAGE_KEY = "sf_sauna_utm";
const UTM_SOURCE_KEY = "utm_source";

function readStoredUtms(): UtmMap {
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as UtmMap;
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

/** Capture UTM params from the current URL and persist for later form submits. */
export function captureUtmParams(): UtmMap {
  if (typeof window === "undefined") return {};
  const url = new URL(window.location.href);
  const found: UtmMap = {};
  for (const k of UTM_KEYS) {
    const v = url.searchParams.get(k);
    if (v) found[k] = v;
  }
  const stored = readStoredUtms();
  const merged = { ...stored, ...found };
  if (Object.keys(found).length > 0) {
    try {
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // ignore quota / privacy-mode errors
    }
  }
  if (found.utm_source) {
    try {
      localStorage.setItem(UTM_SOURCE_KEY, found.utm_source);
    } catch {
      // ignore quota / privacy-mode errors
    }
  }
  return merged;
}

function currentUtms(): UtmMap {
  const stored = readStoredUtms();
  if (!stored.utm_source) {
    try {
      const standalone = localStorage.getItem(UTM_SOURCE_KEY);
      if (standalone) stored.utm_source = standalone;
    } catch {
      // ignore privacy-mode errors
    }
  }
  return stored;
}

/** Split a "Full Name" into first + last. Last name may be empty. */
export function splitFullName(full: string): { first_name: string; last_name: string } {
  const trimmed = full.trim().replace(/\s+/g, " ");
  if (!trimmed) return { first_name: "", last_name: "" };
  const parts = trimmed.split(" ");
  const first_name = parts.shift() ?? "";
  const last_name = parts.join(" ");
  return { first_name, last_name };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface LeadFields {
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  city?: string;
  region?: string;
  sauna_type?: string;
  installation_location?: string;
  preferred_installation_date?: string;
  intent?: string;
  timeline?: string;
  sauna_brand?: string;
  referral_source?: string;
  photo_urls?: string[];
  [key: string]: string | string[] | undefined;
}

export interface SubmitLeadArgs {
  form_source: string;
  form_name: string;
  fields: LeadFields;
  /** Optional per-form request timeout, ms. */
  timeoutMs?: number;
}

export interface SubmitLeadResult {
  ok: boolean;
  status?: number;
  error?: string;
}

function normalize(fields: LeadFields): LeadFields {
  const out: LeadFields = {};
  for (const [key, raw] of Object.entries(fields)) {
    if (raw === undefined || raw === null) continue;
    if (Array.isArray(raw)) {
      if (raw.length > 0) out[key] = raw;
      continue;
    }
    let v = String(raw).trim();
    if (!v) continue;
    if (key === "email") v = v.toLowerCase();
    out[key] = v;
  }
  if (out.email && typeof out.email === "string" && !EMAIL_RE.test(out.email)) {
    // caller should have validated; drop invalid rather than send junk
    delete out.email;
  }
  return out;
}

// Track in-flight submissions to prevent duplicate clicks.
const inflight = new Set<string>();

/** Push the GTM conversion event after a successful lead submission. */
function pushLeadConversionEvent(
  form_source: string,
  form_name: string,
  fields: LeadFields,
) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: "reservation_request_submitted",
    form_source,
    form_name,
    ...(typeof fields.sauna_type === "string" ? { sauna_type: fields.sauna_type } : {}),
    ...(typeof fields.city === "string" ? { city: fields.city } : {}),
    page_path: window.location.pathname,
  });
}

export async function submitLeadToGHL({
  form_source,
  form_name,
  fields,
  timeoutMs = 15000,
}: SubmitLeadArgs): Promise<SubmitLeadResult> {
  if (!WEBHOOK_URL) {
    return { ok: false, error: "Lead webhook is not configured." };
  }
  if (inflight.has(form_source)) {
    return { ok: false, error: "A submission is already in progress." };
  }

  const cleaned = normalize(fields);

  const meta: Record<string, string> = {
    form_source,
    form_name,
    submitted_at: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    meta.page_url = window.location.href;
    meta.page_path = window.location.pathname;
    meta.page_title = document.title;
    if (document.referrer) meta.referrer = document.referrer;
  }

  const utms = currentUtms();

  const payload = {
    ...meta,
    ...utms,
    utm_source: utms.utm_source || "direct",
    ...cleaned,
  };

  inflight.add(form_source);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    }
    pushLeadConversionEvent(form_source, form_name, cleaned);
    return { ok: true, status: res.status };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timer);
    inflight.delete(form_source);
  }
}

/**
 * Upload photos to the private `lead-uploads` bucket and return signed URLs
 * (valid 7 days) suitable for sending to GHL.
 * Returns { urls, failed } — the caller should still submit the lead even
 * if uploads fail, and communicate that to the user.
 */
export async function uploadLeadPhotos(
  files: File[],
  folder: string,
): Promise<{ urls: string[]; failed: number }> {
  if (!files.length) return { urls: [], failed: 0 };
  const { supabase } = await import("@/integrations/supabase/client");
  const urls: string[] = [];
  let failed = 0;
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const { error: upErr } = await supabase.storage
      .from("lead-uploads")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (upErr) {
      failed++;
      continue;
    }
    const { data: signed, error: signErr } = await supabase.storage
      .from("lead-uploads")
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (signErr || !signed?.signedUrl) {
      failed++;
      continue;
    }
    urls.push(signed.signedUrl);
  }
  return { urls, failed };
}