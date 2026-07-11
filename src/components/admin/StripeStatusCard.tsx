import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WebhookEvent {
  received_at: string;
  processed_at?: string | null;
  error_message?: string | null;
  event_type?: string | null;
  livemode?: boolean | null;
}

interface StripeStatus {
  mode: string;
  payment_link_mode: string | null;
  payment_link_configured: boolean;
  last_success: WebhookEvent | null;
  last_failure: WebhookEvent | null;
}

function fmtWhen(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Never";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (sameDay) return time;
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${date}, ${time}`;
}

interface Props {
  callAdmin: (body: Record<string, unknown>) => Promise<StripeStatus>;
}

export function StripeStatusCard({ callAdmin }: Props) {
  const [data, setData] = useState<StripeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await callAdmin({ action: "stripe_status" });
        if (alive) setData(res);
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [callAdmin]);

  const lastSuccessAt = data?.last_success?.received_at ?? null;
  const connected = !!lastSuccessAt;
  const mode = (data?.mode ?? "test").toUpperCase();
  const linkMode = data?.payment_link_configured
    ? (data.payment_link_mode ?? mode.toLowerCase()).toUpperCase()
    : "NOT SET";

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Stripe Status</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : !data ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                Connection
              </div>
              <div className="flex items-center gap-2 font-medium">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    connected ? "bg-green-500" : "bg-red-500"
                  }`}
                  aria-hidden
                />
                {connected ? "Connected" : "No webhooks yet"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                Last successful webhook
              </div>
              <div className="font-medium">{fmtWhen(lastSuccessAt)}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                Last failed webhook
              </div>
              <div className="font-medium">
                {fmtWhen(data.last_failure?.received_at ?? null)}
              </div>
              {data.last_failure?.error_message && (
                <div
                  className="text-xs text-muted-foreground truncate max-w-[220px]"
                  title={data.last_failure.error_message}
                >
                  {data.last_failure.error_message}
                </div>
              )}
            </div>
            <div className="flex gap-6">
              <div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                  Webhook mode
                </div>
                <div className="font-semibold">{mode}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                  Payment link
                </div>
                <div className="font-semibold">{linkMode}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}