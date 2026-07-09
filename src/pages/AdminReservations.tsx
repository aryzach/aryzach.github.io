import { useEffect, useState, useCallback, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";

const PASSWORD_STORAGE_KEY = "sf-sauna-admin-pw";

interface SaunaType {
  id: string;
  name: string;
  sort_order: number;
}

type SaunaStatus =
  | "Available"
  | "Reservation Hold"
  | "Reservation Confirmed"
  | "Installed"
  | "Returning"
  | "Maintenance"
  | "Incoming"
  | "Sold / Retired";

const STATUSES: SaunaStatus[] = [
  "Available",
  "Reservation Hold",
  "Reservation Confirmed",
  "Installed",
  "Returning",
  "Maintenance",
  "Incoming",
  "Sold / Retired",
];

const STATUS_STYLES: Record<SaunaStatus, string> = {
  "Available": "bg-green-100 text-green-800 border-green-300",
  "Reservation Hold": "bg-blue-100 text-blue-800 border-blue-300",
  "Reservation Confirmed": "bg-purple-100 text-purple-800 border-purple-300",
  "Installed": "bg-slate-800 text-white border-slate-800",
  "Returning": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Maintenance": "bg-orange-100 text-orange-800 border-orange-300",
  "Incoming": "bg-sky-100 text-sky-800 border-sky-300",
  "Sold / Retired": "bg-gray-200 text-gray-700 border-gray-300",
};

const ELIGIBILITY = ["indoor", "outdoor", "either"] as const;

interface InventoryRow {
  id: string;
  sauna_type_id: string;
  model: string | null;
  indoor_outdoor_eligibility: "indoor" | "outdoor" | "either";
  status: SaunaStatus;
  current_customer: string | null;
  install_date: string | null;
  available_date: string | null;
  location: string | null;
  condition: string | null;
  admin_notes: string | null;
  reservation_id: string | null;
  updated_at: string;
  created_at: string;
}

interface Reservation {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  sauna_type_id: string;
  install_address: string;
  placement_choice: string;
  access_notes: string | null;
  min_commitment_months: number;
  preferred_install_at: string;
  reservation_status: string;
  payment_status: string;
  contract_status: string;
  id_status: string;
  consult_status: string;
  admin_notes: string | null;
  sauna_inventory_id: string | null;
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

function fmtDate(d: string | null): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map((n) => parseInt(n, 10));
  if (!y) return d;
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timelineFor(row: InventoryRow): string {
  switch (row.status) {
    case "Available":
      return "Available now";
    case "Reservation Hold":
      return `Held for ${row.current_customer || "(unknown)"}`;
    case "Reservation Confirmed":
      return `Confirmed for ${row.current_customer || "(unknown)"}`;
    case "Installed":
      return `Installed with ${row.current_customer || "(unknown)"}${row.install_date ? ` · installed ${fmtDate(row.install_date)}` : ""}`;
    case "Returning":
      return `Returning · available ${fmtDate(row.available_date)}`;
    case "Maintenance":
      return `Maintenance · available ${fmtDate(row.available_date)}`;
    case "Incoming":
      return `Incoming · available ${fmtDate(row.available_date)}`;
    case "Sold / Retired":
      return "Retired";
  }
}

const AdminReservations = () => {
  useSEO({ title: "Admin — Inventory", description: "Internal sauna inventory admin." });

  const [password, setPassword] = useState<string>(() => sessionStorage.getItem(PASSWORD_STORAGE_KEY) || "");
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [types, setTypes] = useState<SaunaType[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [fType, setFType] = useState<string>("all");
  const [fStatus, setFStatus] = useState<string>("all");
  const [fCustomer, setFCustomer] = useState<string>("");
  const [fLocation, setFLocation] = useState<string>("");
  const [fCondition, setFCondition] = useState<string>("");

  const [editing, setEditing] = useState<InventoryRow | null>(null);
  const [creating, setCreating] = useState(false);

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
      const [typesRes, invRes, resRes] = await Promise.all([
        supabase.from("sauna_types").select("id, name, sort_order").order("sort_order"),
        callAdmin({ action: "list_inventory" }),
        callAdmin({ action: "list_reservations" }),
      ]);
      if (typesRes.data) setTypes(typesRes.data as SaunaType[]);
      setInventory(invRes.inventory || []);
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

  const filtered = useMemo(() => {
    return inventory.filter((r) => {
      if (fType !== "all" && r.sauna_type_id !== fType) return false;
      if (fStatus !== "all" && r.status !== fStatus) return false;
      if (fCustomer && !(r.current_customer || "").toLowerCase().includes(fCustomer.toLowerCase())) return false;
      if (fLocation && !(r.location || "").toLowerCase().includes(fLocation.toLowerCase())) return false;
      if (fCondition && !(r.condition || "").toLowerCase().includes(fCondition.toLowerCase())) return false;
      return true;
    });
  }, [inventory, fType, fStatus, fCustomer, fLocation, fCondition]);

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
                  <Input id="pw" type="password" value={pwInput} onChange={(e) => setPwInput(e.target.value)} autoFocus />
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
        <div className="container mx-auto px-4 max-w-[1400px]">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold text-foreground">Admin — Inventory</h1>
            <div className="flex gap-2">
              <Button onClick={() => setCreating(true)}>Add sauna</Button>
              <Button variant="outline" size="sm" onClick={logout}>Sign out</Button>
            </div>
          </div>

          {loading && <p className="text-muted-foreground">Loading…</p>}

          <section className="mb-10">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sauna inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div>
                    <Label className="text-xs">Sauna type</Label>
                    <Select value={fType} onValueChange={setFType}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        {types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={fStatus} onValueChange={setFStatus}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Current customer</Label>
                    <Input className="h-9" value={fCustomer} onChange={(e) => setFCustomer(e.target.value)} placeholder="Search…" />
                  </div>
                  <div>
                    <Label className="text-xs">Location</Label>
                    <Input className="h-9" value={fLocation} onChange={(e) => setFLocation(e.target.value)} placeholder="Search…" />
                  </div>
                  <div>
                    <Label className="text-xs">Condition</Label>
                    <Input className="h-9" value={fCondition} onChange={(e) => setFCondition(e.target.value)} placeholder="Search…" />
                  </div>
                </div>

                <div className="overflow-x-auto border border-border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="text-left px-3 py-2">ID</th>
                        <th className="text-left px-3 py-2">Type</th>
                        <th className="text-left px-3 py-2">Model</th>
                        <th className="text-left px-3 py-2">In/Out</th>
                        <th className="text-left px-3 py-2">Status</th>
                        <th className="text-left px-3 py-2">Customer</th>
                        <th className="text-left px-3 py-2">Install</th>
                        <th className="text-left px-3 py-2">Available</th>
                        <th className="text-left px-3 py-2">Location</th>
                        <th className="text-left px-3 py-2">Condition</th>
                        <th className="text-left px-3 py-2">Timeline</th>
                        <th className="text-left px-3 py-2">Notes</th>
                        <th className="text-left px-3 py-2">Updated</th>
                        <th className="text-left px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 && (
                        <tr><td colSpan={14} className="px-3 py-6 text-center text-muted-foreground">No saunas match.</td></tr>
                      )}
                      {filtered.map((r) => (
                        <tr key={r.id} className="border-t border-border">
                          <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}</td>
                          <td className="px-3 py-2">{types.find((t) => t.id === r.sauna_type_id)?.name || r.sauna_type_id}</td>
                          <td className="px-3 py-2">{r.model || "—"}</td>
                          <td className="px-3 py-2 capitalize">{r.indoor_outdoor_eligibility}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${STATUS_STYLES[r.status]}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-3 py-2">{r.current_customer || "—"}</td>
                          <td className="px-3 py-2">{fmtDate(r.install_date)}</td>
                          <td className="px-3 py-2">{fmtDate(r.available_date)}</td>
                          <td className="px-3 py-2">{r.location || "—"}</td>
                          <td className="px-3 py-2">{r.condition || "—"}</td>
                          <td className="px-3 py-2 text-xs">{timelineFor(r)}</td>
                          <td className="px-3 py-2 text-xs max-w-[200px] truncate" title={r.admin_notes || ""}>{r.admin_notes || "—"}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>Edit</Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  if (!confirm("Delete this sauna?")) return;
                                  try {
                                    await callAdmin({ action: "delete_inventory", id: r.id });
                                    toast.success("Deleted");
                                    await loadAll();
                                  } catch (e) { toast.error((e as Error).message); }
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
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
                  saunaTypes={types}
                  inventory={inventory}
                  onUpdate={async (patch) => {
                    try {
                      const res = await callAdmin({ action: "update_reservation", id: r.id, patch });
                      setReservations((prev) => prev.map((x) => (x.id === r.id ? res.reservation : x)));
                      toast.success("Saved");
                    } catch (e) { toast.error("Failed"); }
                  }}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />

      {(editing || creating) && (
        <InventoryDialog
          initial={editing}
          types={types}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={async (patch) => {
            try {
              if (editing) {
                await callAdmin({ action: "update_inventory", id: editing.id, patch });
                toast.success("Saved");
              } else {
                await callAdmin({ action: "create_inventory", ...patch });
                toast.success("Added");
              }
              setEditing(null);
              setCreating(false);
              await loadAll();
            } catch (e) { toast.error((e as Error).message); }
          }}
        />
      )}
    </div>
  );
};

const InventoryDialog = ({
  initial,
  types,
  onClose,
  onSave,
}: {
  initial: InventoryRow | null;
  types: SaunaType[];
  onClose: () => void;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
}) => {
  const [form, setForm] = useState({
    sauna_type_id: initial?.sauna_type_id || types[0]?.id || "",
    model: initial?.model || "",
    indoor_outdoor_eligibility: initial?.indoor_outdoor_eligibility || "either",
    status: initial?.status || ("Available" as SaunaStatus),
    current_customer: initial?.current_customer || "",
    install_date: initial?.install_date || "",
    available_date: initial?.available_date || "",
    location: initial?.location || "",
    condition: initial?.condition || "",
    admin_notes: initial?.admin_notes || "",
  });
  const setF = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit sauna" : "Add sauna"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Sauna type</Label>
            <Select value={form.sauna_type_id} onValueChange={(v) => setF("sauna_type_id", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {types.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Model / version</Label>
            <Input value={form.model} onChange={(e) => setF("model", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Indoor / outdoor eligibility</Label>
            <Select value={form.indoor_outdoor_eligibility} onValueChange={(v) => setF("indoor_outdoor_eligibility", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ELIGIBILITY.map((e) => <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={(v) => setF("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Current customer</Label>
            <Input value={form.current_customer} onChange={(e) => setF("current_customer", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Install date</Label>
            <Input type="date" value={form.install_date} onChange={(e) => setF("install_date", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Available date</Label>
            <Input type="date" value={form.available_date} onChange={(e) => setF("available_date", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Location</Label>
            <Input value={form.location} onChange={(e) => setF("location", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Condition</Label>
            <Input value={form.condition} onChange={(e) => setF("condition", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Admin notes</Label>
            <Textarea rows={3} value={form.admin_notes} onChange={(e) => setF("admin_notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ReservationRow = ({
  reservation,
  saunaTypes,
  inventory,
  onUpdate,
}: {
  reservation: Reservation;
  saunaTypes: SaunaType[];
  inventory: InventoryRow[];
  onUpdate: (patch: Partial<Reservation>) => Promise<void>;
}) => {
  const r = reservation;
  const [notes, setNotes] = useState(r.admin_notes || "");
  const linkedSauna = inventory.find((i) => i.id === r.sauna_inventory_id);

  const statusCol = (label: string, key: keyof Reservation, options: string[]) => (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={r[key] as string} onValueChange={(v) => onUpdate({ [key]: v } as Partial<Reservation>)}>
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
            {saunaTypes.find((s) => s.id === r.sauna_type_id)?.name || r.sauna_type_id} · {r.min_commitment_months}mo · install {new Date(r.preferred_install_at).toLocaleString()}
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            Created {new Date(r.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="text-xs text-muted-foreground">
          Address: {r.install_address} ({r.placement_choice}){r.access_notes ? ` · access: ${r.access_notes}` : ""}
          {linkedSauna && <> · sauna <span className="font-mono">{linkedSauna.id.slice(0, 8)}</span> ({linkedSauna.status})</>}
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