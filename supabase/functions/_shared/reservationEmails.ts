// Shared Resend-based email sender for reservation flow emails.
// Used by reservation-create, stripe-webhook, and admin-api resend actions.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { saunaTypeLabel } from "./saunaLabels.ts";

export type ReservationEmailType = "reservation_created" | "payment_received";

interface Reservation {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  sauna_type_id: string;
  preferred_install_at: string;
  reservation_status: string;
  payment_status: string;
  consult_status: string;
  contract_status: string;
  id_status: string;
  secure_token: string;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  } catch { return iso; }
}

function baseUrl(): string {
  return (Deno.env.get("PUBLIC_APP_URL") || "https://sfsaunarental.com").replace(/\/+$/, "");
}

function dashboardUrl(r: Reservation): string {
  return `${baseUrl()}/reservation/${r.id}?token=${encodeURIComponent(r.secure_token)}`;
}

function esc(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

const CALCOM = "https://cal.com/sfsaunarental/sf-sauna-video-consultation?overlayCalendar=true";

function shell(inner: string, previewText: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>SF Sauna</title></head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917;">
<div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0">${esc(previewText)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e7e5e4;border-radius:12px;padding:28px;">
<tr><td>
<div style="font-size:14px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#57534e;margin-bottom:20px;">SF Sauna</div>
${inner}
<hr style="border:none;border-top:1px solid #e7e5e4;margin:28px 0 16px;"/>
<div style="font-size:12px;color:#78716c;line-height:1.5;">
Save this email. The private reservation link lets you return at any time without creating an account.<br/>
Need help? Just reply to this email.<br/><br/>
<a href="${baseUrl()}" style="color:#78716c;text-decoration:underline;">sfsaunarental.com</a>
</div>
</td></tr></table>
</td></tr></table>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="background:#1c1917;border-radius:8px;">
<a href="${href}" style="display:inline-block;padding:14px 22px;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;">${esc(label)}</a>
</td></tr></table>`;
}

function checklist(r: Reservation): string {
  const rows: [string, string][] = [
    ["Video consultation", statusLabel(r.consult_status)],
    ["Rental agreement", statusLabel(r.contract_status)],
    ["Photo ID", statusLabel(r.id_status)],
    ["Installation scheduling", r.reservation_status === "Reservation Confirmed" ? "Scheduled" : "Not scheduled"],
  ];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 4px;">
${rows.map(([k, v]) => `<tr>
<td style="padding:8px 0;border-bottom:1px solid #f5f5f4;font-size:14px;color:#57534e;">${esc(k)}</td>
<td style="padding:8px 0;border-bottom:1px solid #f5f5f4;font-size:14px;color:#1c1917;text-align:right;font-weight:500;">${esc(v)}</td>
</tr>`).join("")}
</table>`;
}

function statusLabel(s: string): string {
  if (!s || s === "Not Started" || s === "N/A") return "Not started";
  return s;
}

function summaryTable(r: Reservation, statusLine: string): string {
  const rows: [string, string][] = [
    ["Sauna", saunaTypeLabel(r.sauna_type_id)],
    ["Preferred installation date", fmtDate(r.preferred_install_at)],
    ["City", r.city || "—"],
    ["Reservation status", statusLine],
    ["Reservation payment", "$200"],
  ];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 4px;">
${rows.map(([k, v]) => `<tr>
<td style="padding:8px 0;border-bottom:1px solid #f5f5f4;font-size:14px;color:#57534e;">${esc(k)}</td>
<td style="padding:8px 0;border-bottom:1px solid #f5f5f4;font-size:14px;color:#1c1917;text-align:right;font-weight:500;">${esc(v)}</td>
</tr>`).join("")}
</table>`;
}

function renderInitialEmail(r: Reservation): { subject: string; html: string; text: string } {
  const url = dashboardUrl(r);
  const subject = "Continue your SF Sauna reservation";
  const inner = `
<h1 style="font-size:22px;font-weight:600;margin:0 0 12px;color:#1c1917;">Hi ${esc(r.first_name)},</h1>
<p style="font-size:15px;line-height:1.55;color:#1c1917;margin:0 0 16px;">Thanks for starting your SF Sauna reservation.</p>
<div style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#78716c;margin:20px 0 6px;">Reservation details</div>
${summaryTable(r, "Pending Payment")}
<p style="font-size:14px;line-height:1.55;color:#57534e;margin:16px 0 8px;">
No sauna is on hold yet. Complete the $200 reservation payment to activate your temporary hold.
</p>
<div style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#78716c;margin:24px 0 6px;">Next step</div>
<p style="font-size:15px;line-height:1.55;color:#1c1917;margin:0 0 4px;">
Schedule your Video Consultation so we can confirm a sauna will work in your home and answer any questions you might have.
</p>
${button(CALCOM, "Schedule Video Consultation")}
<p style="font-size:14px;line-height:1.55;color:#57534e;margin:16px 0 8px;">
Your private reservation dashboard:
</p>
${button(url, "Continue Your Reservation")}
<p style="font-size:13px;line-height:1.5;color:#78716c;word-break:break-all;margin:0 0 8px;">
If the button doesn't work, open this link:<br/>
<a href="${url}" style="color:#1c1917;">${esc(url)}</a>
</p>`;
  const text = `Hi ${r.first_name},

Thanks for starting your SF Sauna reservation.

Sauna: ${saunaTypeLabel(r.sauna_type_id)}
Preferred installation date: ${fmtDate(r.preferred_install_at)}
City: ${r.city || "-"}
Reservation status: Pending Payment
Reservation payment: $200

No sauna is on hold yet. Complete the $200 reservation payment to activate your temporary hold.

Next step: Schedule your Video Consultation
${CALCOM}

Your private reservation dashboard:
${url}

Save this email. Need help? Just reply.`;
  return { subject, html: shell(inner, "Your private reservation link and next steps are inside."), text };
}

function renderPaymentEmail(r: Reservation): { subject: string; html: string; text: string } {
  const url = dashboardUrl(r);
  const subject = "Your SF Sauna reservation payment is complete";
  const inner = `
<h1 style="font-size:22px;font-weight:600;margin:0 0 12px;color:#1c1917;">Hi ${esc(r.first_name)},</h1>
<p style="font-size:15px;line-height:1.55;color:#1c1917;margin:0 0 12px;">We received your $200 reservation deposit.</p>
<p style="font-size:14px;line-height:1.55;color:#57534e;margin:0 0 16px;">
We're confirming availability for your requested installation date and will follow up shortly.
</p>
<div style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#78716c;margin:20px 0 6px;">Remaining checklist</div>
${checklist(r)}
${button(url, "Continue Your Reservation")}
<p style="font-size:13px;line-height:1.5;color:#78716c;word-break:break-all;margin:0 0 8px;">
If the button doesn't work, open this link:<br/>
<a href="${url}" style="color:#1c1917;">${esc(url)}</a>
</p>`;
  const text = `Hi ${r.first_name},

We received your $200 reservation deposit.

We're confirming availability for your requested installation date and will follow up shortly.

Remaining checklist:
- Video consultation: ${statusLabel(r.consult_status)}
- Rental agreement: ${statusLabel(r.contract_status)}
- Photo ID: ${statusLabel(r.id_status)}
- Installation scheduling: ${r.reservation_status === "Reservation Confirmed" ? "Scheduled" : "Not scheduled"}

Continue your reservation:
${url}`;
  return { subject, html: shell(inner, "We received your reservation payment."), text };
}

export async function sendReservationEmail(
  supabase: SupabaseClient,
  reservationId: string,
  emailType: ReservationEmailType,
  opts: { force?: boolean } = {},
): Promise<{ ok: boolean; skipped?: boolean; error?: string; resend_id?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESERVATION_EMAIL_FROM") || "SF Sauna <reservations@updates.sfsaunarental.com>";
  const replyTo = Deno.env.get("RESERVATION_EMAIL_REPLY_TO") || undefined;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not configured" };

  const { data: r } = await supabase
    .from("reservations")
    .select("id, first_name, last_name, email, phone, city, sauna_type_id, preferred_install_at, reservation_status, payment_status, consult_status, contract_status, id_status, secure_token")
    .eq("id", reservationId)
    .maybeSingle();
  if (!r) return { ok: false, error: "Reservation not found" };
  const reservation = r as Reservation;

  // De-dupe unless forced
  if (!opts.force) {
    const { data: existing } = await supabase
      .from("reservation_email_events")
      .select("id")
      .eq("reservation_id", reservationId)
      .eq("email_type", emailType)
      .eq("delivery_status", "sent")
      .limit(1);
    if (existing && existing.length > 0) return { ok: true, skipped: true };
  }

  const rendered = emailType === "reservation_created"
    ? renderInitialEmail(reservation)
    : renderPaymentEmail(reservation);

  const body: Record<string, unknown> = {
    from,
    to: [reservation.email],
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  };
  if (replyTo) body.reply_to = replyTo;

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    const text = await resp.text();
    if (!resp.ok) {
      await supabase.from("reservation_email_events").insert({
        reservation_id: reservationId,
        email_type: emailType,
        recipient_email: reservation.email,
        delivery_status: "failed",
        error_message: `[${resp.status}] ${text.slice(0, 500)}`,
      });
      return { ok: false, error: `Resend ${resp.status}: ${text.slice(0, 200)}` };
    }
    let resendId: string | null = null;
    try { resendId = JSON.parse(text)?.id ?? null; } catch { /* ignore */ }
    await supabase.from("reservation_email_events").insert({
      reservation_id: reservationId,
      email_type: emailType,
      recipient_email: reservation.email,
      resend_email_id: resendId,
      delivery_status: "sent",
      sent_at: new Date().toISOString(),
    });
    return { ok: true, resend_id: resendId ?? undefined };
  } catch (e) {
    await supabase.from("reservation_email_events").insert({
      reservation_id: reservationId,
      email_type: emailType,
      recipient_email: reservation.email,
      delivery_status: "failed",
      error_message: (e as Error).message?.slice(0, 500) ?? "unknown",
    });
    return { ok: false, error: (e as Error).message };
  }
}

export function makeSupabase(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}