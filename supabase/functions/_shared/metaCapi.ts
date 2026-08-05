// Server-side Meta Conversions API helper.
// Never logs the access token or raw customer PII.

const GRAPH_API_VERSION = "v21.0";

async function sha256Hex(value: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const normEmail = (v?: string | null) => (v ? v.trim().toLowerCase() : "");
const normName = (v?: string | null) => (v ? v.trim().toLowerCase() : "");
const normPhone = (v?: string | null) => (v ? v.replace(/\D/g, "") : "");

export interface MetaUserInput {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export async function buildHashedUserData(input: MetaUserInput): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {};
  const em = normEmail(input.email);
  const ph = normPhone(input.phone);
  const fn = normName(input.firstName);
  const ln = normName(input.lastName);
  if (em) out.em = [await sha256Hex(em)];
  if (ph) out.ph = [await sha256Hex(ph)];
  if (fn) out.fn = [await sha256Hex(fn)];
  if (ln) out.ln = [await sha256Hex(ln)];
  return out;
}

export interface MetaSendResult {
  ok: boolean;
  status: number;
  eventsReceived?: number;
  messages?: unknown;
  fbtraceId?: string;
  error?: string;
}

export interface SendPurchaseArgs {
  eventId: string;
  value: number;
  currency?: string;
  contentIds: string[];
  contentName?: string;
  eventSourceUrl?: string;
  userData: Record<string, string[]>;
  testEventCode?: string | null;
}

export async function sendMetaPurchase(args: SendPurchaseArgs): Promise<MetaSendResult> {
  const pixelId = Deno.env.get("META_PIXEL_ID");
  const accessToken = Deno.env.get("META_CAPI_ACCESS_TOKEN");
  if (!pixelId || !accessToken) {
    return { ok: false, status: 0, error: "Meta credentials not configured" };
  }

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: args.eventId,
        action_source: "website",
        event_source_url: args.eventSourceUrl ?? "https://sfsaunarental.com/",
        user_data: args.userData,
        custom_data: {
          currency: args.currency ?? "USD",
          value: args.value,
          content_name: args.contentName ?? "Reservation Deposit",
          content_ids: args.contentIds,
          content_type: "product",
        },
      },
    ],
  };
  if (args.testEventCode) payload.test_event_code = args.testEventCode;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const status = res.status;
    let body: any = null;
    try { body = await res.json(); } catch { /* non-JSON response */ }

    const result: MetaSendResult = {
      ok: res.ok && !body?.error,
      status,
      eventsReceived: body?.events_received,
      messages: body?.messages,
      fbtraceId: body?.fbtrace_id ?? body?.error?.fbtrace_id,
    };
    if (!result.ok) {
      result.error = String(body?.error?.message ?? `Meta responded ${status}`).slice(0, 500);
    }
    return result;
  } catch (e) {
    return { ok: false, status: 0, error: String(e).slice(0, 500) };
  }
}

export async function fetchSessionLineItems(
  stripeKey: string,
  sessionId: string,
): Promise<any[]> {
  const res = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}/line_items?limit=100`,
    { headers: { Authorization: `Bearer ${stripeKey}` } },
  );
  if (!res.ok) throw new Error(`Stripe line_items failed: ${res.status}`);
  const json = await res.json();
  return json?.data ?? [];
}
