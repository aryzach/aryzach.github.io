import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";
import { saunaTypeLabel } from "@/lib/reservationSaunaTypes";

const PASSWORD_STORAGE_KEY = "sf-sauna-admin-pw";

interface Reservation {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  sauna_type_id: string;
  sauna_inventory_id: string | null;
  preferred_install_at: string;
  reservation_status: string;
  payment_status: string;
  consult_status: string;
  contract_status: string;
  id_status: string;
  hold_created_at: string | null;
  hold_deadline: string | null;
  reservation_source: string;
  admin_notes: string | null;
  secure_token: string;
  created_at: string;
}

interface ReservationEvent {
  id: string;
  reservation_id: string;
  event_type: string;
  message: string | null;
  created_at: string;
}

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
      })
    : "—";

const STATUS_COLOR: Record<string, string> = {
  "Lead": "bg-gray-200 text-gray-900",
  "Pending Payment": "bg-yellow-100 text-yellow-900",
  "Reservation Hold": "bg-blue-100 text-blue-900",
  "Reservation Confirmed": "bg-purple-100 text-purple-900",
  "Needs Manual Review": "bg-orange-100 text-orange-900",
  "Cancelled": "bg-gray-200 text-gray-900",
  "Refunded": "bg-gray-200 text-gray-900",
};

// Embeddable panel that renders the reservation list. Reuses the parent's
// admin password via callAdmin. Used both by the standalone page and as a
// tab inside the AdminReservations inventory page.
export const ReservationsListPanel = ({
  callAdmin,
}: {
  callAdmin: (body: Record<string, unknown>) => Promise<any>;
}) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [events, setEvents] = useState<ReservationEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callAdmin({ action: "list_reservations_with_events" });
      setReservations(data.reservations ?? []);
      setEvents(data.events ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [callAdmin]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (id: string, kind: string, extra: Record<string, unknown> = {}) => {
    try {
      await callAdmin({ action: "reservation_action", id, kind, ...extra });
      toast.success("Updated");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const markPaid = async (id: string) => {
    if (!confirm("Manually mark this reservation as paid? (Skips Stripe.)")) return;
    try {
      await callAdmin({ action: "manual_mark_paid", id });
      toast.success("Marked paid");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const copyLink = (r: Reservation) => {
    const url = `${window.location.origin}/reservation/${r.id}?token=${encodeURIComponent(r.secure_token)}`;
    navigator.clipboard.writeText(url);
    toast.success("Reservation link copied");
  };

  const eventsFor = useMemo(() => {
    const m = new Map<string, ReservationEvent[]>();
    for (const e of events) {
      const arr = m.get(e.reservation_id) ?? [];
      arr.push(e);
      m.set(e.reservation_id, arr);
    }
    return m;
  }, [events]);

  const statusIcon = (done: boolean) => (done ? "✓" : "○");
  const styleFor = (typeId: string) => (/infrared/i.test(typeId) ? "Infrared" : "Traditional");

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium text-foreground">Magic Links</h2>
        <Button onClick={load} size="sm" variant="outline" disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      <div className="space-y-3">
        {reservations.length === 0 && !loading && (
          <p className="text-muted-foreground">No reservations yet.</p>
        )}
        {reservations.map((r) => {
          const isOpen = expandedId === r.id;
          const rEvents = eventsFor.get(r.id) ?? [];
          const paid = r.payment_status === "Paid";
          const consultDone = r.consult_status === "Scheduled" || r.consult_status === "Complete";
          const idDone = r.id_status === "Complete";
          const contractDone = r.contract_status === "Complete";
          const installDone = r.reservation_status === "Reservation Confirmed";
          return (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-grow min-w-[240px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">
                        {r.first_name} {r.last_name}
                      </span>
                      <Badge className={STATUS_COLOR[r.reservation_status] ?? "bg-gray-200"}>
                        {r.reservation_status}
                      </Badge>
                      <Badge variant="outline">{styleFor(r.sauna_type_id)}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {r.email} · {r.phone ?? "no phone"} · {r.city ?? "no city"}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {saunaTypeLabel(r.sauna_type_id)} · install {fmt(r.preferred_install_at)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>{statusIcon(paid)} Deposit</span>
                      <span>{statusIcon(consultDone)} Consult</span>
                      <span>{statusIcon(idDone)} Photo ID</span>
                      <span>{statusIcon(contractDone)} Contract</span>
                      <span>{statusIcon(installDone)} Install scheduled</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => copyLink(r)}>Copy Link</Button>
                    {r.payment_status !== "Paid" && r.reservation_status !== "Lead" && (
                      <Button size="sm" variant="outline" onClick={() => markPaid(r.id)}>Mark Paid</Button>
                    )}
                    {r.reservation_status === "Reservation Hold" && (
                      <>
                        <Button size="sm" onClick={() => doAction(r.id, "confirm")}>Confirm</Button>
                        <Button size="sm" variant="outline" onClick={() => doAction(r.id, "extend", { extend_days: 5 })}>+5 days</Button>
                        <Button size="sm" variant="destructive" onClick={() => doAction(r.id, "release")}>Release</Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                      {isOpen ? "Hide" : "Details"}
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Details</h4>
                      <dl className="text-sm space-y-1">
                        <Row k="Source" v={r.reservation_source} />
                        <Row k="Payment" v={r.payment_status} />
                        <Row k="Consult" v={r.consult_status} />
                        <Row k="Contract" v={r.contract_status} />
                        <Row k="ID" v={r.id_status} />
                        <Row k="Created" v={fmt(r.created_at)} />
                        {r.hold_deadline && <Row k="Hold ends" v={fmt(r.hold_deadline)} />}
                      </dl>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button size="sm" variant="outline" onClick={() => doAction(r.id, "mark_consult")}>Mark consult</Button>
                        <Button size="sm" variant="outline" onClick={() => doAction(r.id, "mark_contract")}>Mark contract</Button>
                        <Button size="sm" variant="outline" onClick={() => doAction(r.id, "mark_id")}>Mark ID</Button>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Timeline</h4>
                      <ol className="text-sm space-y-1.5">
                        {rEvents.length === 0 && <li className="text-muted-foreground">No events yet.</li>}
                        {rEvents.map((e) => (
                          <li key={e.id} className="flex items-baseline gap-3">
                            <span className="text-xs text-muted-foreground w-32 shrink-0">
                              {fmt(e.created_at)}
                            </span>
                            <div>
                              <div className="text-foreground font-medium">{e.event_type}</div>
                              {e.message && <div className="text-muted-foreground text-xs">{e.message}</div>}
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const AdminReservationsList = () => {
  useSEO({ title: "Admin — Reservations", description: "Internal reservations admin." });

  const [password, setPassword] = useState<string>(() => sessionStorage.getItem(PASSWORD_STORAGE_KEY) || "");
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");

  const callAdmin = useCallback(async (body: Record<string, unknown>) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/admin-api`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
    return res.json();
  }, [password]);

  useEffect(() => {
    if (!password) return;
    (async () => {
      try {
        await callAdmin({ action: "login" });
        setAuthed(true);
        sessionStorage.setItem(PASSWORD_STORAGE_KEY, password);
      } catch {
        sessionStorage.removeItem(PASSWORD_STORAGE_KEY);
        setPassword("");
      }
    })();
  }, [password, callAdmin]);

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow pt-24 pb-16 flex items-center">
          <div className="container mx-auto px-4 max-w-sm">
            <Card>
              <CardHeader><CardTitle>Admin</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); setPassword(pwInput); }} className="space-y-3">
                  <div>
                    <Label htmlFor="pw">Password</Label>
                    <Input id="pw" type="password" value={pwInput} onChange={(e) => setPwInput(e.target.value)} autoFocus />
                  </div>
                  <Button type="submit" className="w-full">Sign in</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">Reservations</h1>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm"><Link to="/admin">Inventory →</Link></Button>
            </div>
          </div>
          <ReservationsListPanel callAdmin={callAdmin} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between gap-4">
    <dt className="text-muted-foreground">{k}</dt>
    <dd className="text-foreground text-right">{v}</dd>
  </div>
);

export default AdminReservationsList;