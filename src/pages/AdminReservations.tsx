import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { computeAvailability, formatDatePretty, type AvailabilityEvent, type ConsumptionRow } from "@/lib/availability";
import { useSEO } from "@/hooks/useSEO";

const PASSWORD_STORAGE_KEY = "sf-sauna-admin-pw";

interface SaunaType {
  id: string;
  name: string;
  sort_order: number;
}

interface EventRow {
  id: string;
  sauna_type_id: string;
  quantity: number;
  available_starting_date: string;
  reason: string;
  notes: string | null;
}

interface Reservation {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  sauna_type_id: string;
  min_commitment_months: number;
  preferred_install_at: string;
  reservation_status: string;
  payment_status: string;
  contract_status: string;
  id_status: string;
  consult_status: string;
  admin_notes: string | null;
}

const RESERVATION_STATUSES = [
  "Pending Payment",
  "Deposit Paid",
  "Contract Pending",
  "ID Pending",
  "Consult Pending",
  "Pending Approval",
  "Approved",
  "Scheduled",
  "Installed",
  "Cancelled",
  "Refunded",
];
const PAYMENT_STATUSES = ["Pending", "Paid", "Refunded"];
const CONTRACT_STATUSES = ["Not Sent", "Sent", "Signed"];
const ID_STATUSES = ["Not Uploaded", "Uploaded", "Reviewed"];
const CONSULT_STATUSES = ["Not Scheduled", "Scheduled", "Complete"];
const REASONS = ["New inventory", "Customer cancellation", "Repair complete", "Manual adjustment"];

const AdminReservations = () => {
  useSEO({ title: "Admin — Reservations", description: "Internal reservation admin." });

  const [password, setPassword] = useState<string>(() => sessionStorage.getItem(PASSWORD_STORAGE_KEY) || "");
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [types, setTypes] = useState<SaunaType[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [consumption, setConsumption] = useState<ConsumptionRow[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  const callAdmin = useCallback(
    async (body: Record<string, unknown>) => {
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
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      return res.json();
    },
    [password],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [typesRes, consRes, evRes, resRes] = await Promise.all([
        supabase.from("sauna_types").select("id, name, sort_order").order("sort_order"),
        supabase.from("paid_reservation_consumption").select("*"),
        callAdmin({ action: "list_events" }),
        callAdmin({ action: "list_reservations" }),
      ]);
      if (typesRes.data) setTypes(typesRes.data as SaunaType[]);
      if (consRes.data) setConsumption(consRes.data as ConsumptionRow[]);
      setEvents(evRes.events || []);
      setReservations(resRes.reservations || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, [callAdmin]);

  useEffect(() => {
    if (!password) return;
    (async () => {
      try {
        await callAdmin({ action: "login" });
        setAuthed(true);
        sessionStorage.setItem(PASSWORD_STORAGE_KEY, password);
        await loadAll();
      } catch {
        sessionStorage.removeItem(PASSWORD_STORAGE_KEY);
        setPassword("");
        setAuthed(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setPassword(pwInput);
  };

  const logout = () => {
    sessionStorage.removeItem(PASSWORD_STORAGE_KEY);
    setPassword("");
    setAuthed(false);
    setPwInput("");
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <Card className="w-full max-w-sm">
            <CardHeader><CardTitle>Admin login</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <Label htmlFor="pw">Password</Label>
                  <Input
                    id="pw"
                    type="password"
                    value={pwInput}
                    onChange={(e) => setPwInput(e.target.value)}
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full">Sign in</Button>
              </form>
            </CardContent>
          </Card>
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
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-semibold text-foreground">Admin — Reservations</h1>
            <Button variant="outline" size="sm" onClick={logout}>Sign out</Button>
          </div>

          {loading && <p className="text-muted-foreground">Loading…</p>}

          <section className="space-y-6 mb-12">
            <h2 className="text-xl font-semibold text-foreground">Inventory by sauna type</h2>
            {types.map((t) => {
              const avail = computeAvailability(t.id, events, consumption);
              const typeEvents = events.filter((e) => e.sauna_type_id === t.id);
              return (
                <Card key={t.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{t.name}</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        Available now: <span className="font-medium text-foreground">{avail.availableToday}</span>
                        {avail.status === "future" && avail.nextAvailableDate && (
                          <> · Next: {formatDatePretty(avail.nextAvailableDate)}</>
                        )}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="w-24"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {typeEvents.length === 0 && (
                          <TableRow><TableCell colSpan={5} className="text-muted-foreground text-sm">No availability events yet.</TableCell></TableRow>
                        )}
                        {typeEvents.map((ev) => (
                          <EventRowEditor
                            key={ev.id}
                            event={ev}
                            onSave={async (patch) => {
                              try {
                                await callAdmin({ action: "update_event", id: ev.id, patch });
                                toast.success("Updated");
                                await loadAll();
                              } catch (e) { toast.error("Failed"); }
                            }}
                            onDelete={async () => {
                              if (!confirm("Delete this availability event?")) return;
                              try {
                                await callAdmin({ action: "delete_event", id: ev.id });
                                toast.success("Deleted");
                                await loadAll();
                              } catch (e) { toast.error("Failed"); }
                            }}
                          />
                        ))}
                      </TableBody>
                    </Table>

                    <AddEventForm
                      saunaTypeId={t.id}
                      onCreate={async (payload) => {
                        try {
                          await callAdmin({ action: "create_event", ...payload });
                          toast.success("Added");
                          await loadAll();
                        } catch (e) { toast.error("Failed"); }
                      }}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Reservations</h2>
            <div className="space-y-3">
              {reservations.length === 0 && (
                <p className="text-muted-foreground text-sm">No reservations yet.</p>
              )}
              {reservations.map((r) => (
                <ReservationRow
                  key={r.id}
                  reservation={r}
                  onUpdate={async (patch) => {
                    try {
                      const res = await callAdmin({ action: "update_reservation", id: r.id, patch });
                      setReservations((prev) => prev.map((x) => (x.id === r.id ? res.reservation : x)));
                      toast.success("Saved");
                      // Refresh consumption view since payment/status affect it
                      const { data } = await supabase.from("paid_reservation_consumption").select("*");
                      if (data) setConsumption(data as ConsumptionRow[]);
                    } catch (e) { toast.error("Failed"); }
                  }}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const EventRowEditor = ({
  event,
  onSave,
  onDelete,
}: {
  event: EventRow;
  onSave: (patch: Partial<EventRow>) => Promise<void>;
  onDelete: () => Promise<void>;
}) => {
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(event.quantity);
  const [date, setDate] = useState(event.available_starting_date);
  const [reason, setReason] = useState(event.reason);
  const [notes, setNotes] = useState(event.notes || "");

  if (!editing) {
    return (
      <TableRow>
        <TableCell>{formatDatePretty(event.available_starting_date)}</TableCell>
        <TableCell>{event.quantity}</TableCell>
        <TableCell>{event.reason}</TableCell>
        <TableCell className="max-w-xs truncate">{event.notes}</TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
            <Button size="sm" variant="ghost" onClick={onDelete}>Delete</Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></TableCell>
      <TableCell><Input type="number" value={qty} onChange={(e) => setQty(parseInt(e.target.value || "0", 10))} /></TableCell>
      <TableCell>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
        </Select>
      </TableCell>
      <TableCell><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button size="sm" onClick={async () => { await onSave({ quantity: qty, available_starting_date: date, reason, notes }); setEditing(false); }}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const AddEventForm = ({
  saunaTypeId,
  onCreate,
}: {
  saunaTypeId: string;
  onCreate: (p: { sauna_type_id: string; quantity: number; available_starting_date: string; reason: string; notes: string }) => Promise<void>;
}) => {
  const [qty, setQty] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState(REASONS[0]);
  const [notes, setNotes] = useState("");
  return (
    <form
      className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-4 pt-4 border-t border-border"
      onSubmit={async (e) => {
        e.preventDefault();
        await onCreate({ sauna_type_id: saunaTypeId, quantity: qty, available_starting_date: date, reason, notes });
        setNotes("");
        setQty(1);
      }}
    >
      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      <Input type="number" min={1} value={qty} onChange={(e) => setQty(parseInt(e.target.value || "1", 10))} required />
      <Select value={reason} onValueChange={setReason}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
      </Select>
      <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button type="submit">Add availability</Button>
    </form>
  );
};

const ReservationRow = ({
  reservation,
  onUpdate,
}: {
  reservation: Reservation;
  onUpdate: (patch: Partial<Reservation>) => Promise<void>;
}) => {
  const r = reservation;
  const [notes, setNotes] = useState(r.admin_notes || "");

  const statusCol = (
    label: string,
    key: keyof Reservation,
    options: string[],
  ) => (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={r[key] as string} onValueChange={(v) => onUpdate({ [key]: v } as any)}>
        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
          <span className="font-semibold text-foreground">{r.first_name} {r.last_name}</span>
          <span className="text-muted-foreground">{r.email}</span>
          <span className="text-muted-foreground">{r.phone}</span>
          <span className="text-muted-foreground">
            {r.sauna_type_id} · {r.min_commitment_months}mo · install {new Date(r.preferred_install_at).toLocaleString()}
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            Created {new Date(r.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {statusCol("Reservation", "reservation_status", RESERVATION_STATUSES)}
          {statusCol("Payment", "payment_status", PAYMENT_STATUSES)}
          {statusCol("Contract", "contract_status", CONTRACT_STATUSES)}
          {statusCol("ID", "id_status", ID_STATUSES)}
          {statusCol("Consult", "consult_status", CONSULT_STATUSES)}
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Admin notes</Label>
          <div className="flex gap-2">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button size="sm" onClick={() => onUpdate({ admin_notes: notes })}>Save</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminReservations;