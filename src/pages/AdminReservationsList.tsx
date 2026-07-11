import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  stripe_customer_id?: string | null;
  stripe_customer_linkage_missing?: boolean | null;
  ach_status?: string | null;
  ach_connected_at?: string | null;
  stripe_ach_setup_intent_id?: string | null;
  stripe_ach_payment_method_id?: string | null;
  ach_bank_name?: string | null;
  ach_bank_last4?: string | null;
  ach_last_error?: string | null;
  default_payment_method_status?: string | null;
  default_payment_method_updated_at?: string | null;
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

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const STATUS_COLOR: Record<string, string> = {
  "Lead": "bg-gray-200 text-gray-900 border-gray-300",
  "Pending Payment": "bg-yellow-100 text-yellow-900 border-yellow-200",
  "Reservation Hold": "bg-blue-100 text-blue-900 border-blue-200",
  "Reservation Confirmed": "bg-purple-100 text-purple-900 border-purple-200",
  "Needs Manual Review": "bg-orange-100 text-orange-900 border-orange-200",
  "Cancelled": "bg-gray-200 text-gray-900 border-gray-300",
  "Refunded": "bg-gray-200 text-gray-900 border-gray-300",
};

const styleFor = (typeId: string) => (/infrared/i.test(typeId) ? "Infrared" : "Traditional");

type ColKey =
  | "name" | "email" | "phone" | "city" | "sauna" | "style" | "install"
  | "status" | "payment" | "consult" | "id" | "contract" | "created";

// Embeddable table that lists reservations with per-column filters, sort, and
// row-level actions (copy magic link, mark paid, confirm/extend/release, delete).
export const ReservationsListPanel = ({
  callAdmin,
}: {
  callAdmin: (body: Record<string, unknown>) => Promise<any>;
}) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [colFilters, setColFilters] = useState<Record<ColKey, string>>({
    name: "", email: "", phone: "", city: "", sauna: "", style: "", install: "",
    status: "", payment: "", consult: "", id: "", contract: "", created: "",
  });
  const setColFilter = (k: ColKey, v: string) => setColFilters((p) => ({ ...p, [k]: v }));
  const [sortCol, setSortCol] = useState<ColKey | null>("created");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const toggleSort = (k: ColKey) => {
    if (sortCol !== k) { setSortCol(k); setSortDir("asc"); }
    else if (sortDir === "asc") setSortDir("desc");
    else { setSortCol(null); setSortDir("asc"); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callAdmin({ action: "list_reservations" });
      setReservations(data.reservations ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [callAdmin]);

  useEffect(() => { load(); }, [load]);

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

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
    const notes = prompt("Add an admin note explaining why this is being marked paid manually:");
    if (!notes || !notes.trim()) { toast.error("An admin note is required."); return; }
    try {
      await callAdmin({ action: "manual_mark_paid", id, notes: notes.trim() });
      toast.success("Marked paid");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const deleteReservation = async (r: Reservation) => {
    if (!confirm(`Delete reservation for ${r.first_name} ${r.last_name}? This cannot be undone.`)) return;
    try {
      await callAdmin({ action: "delete_reservation", id: r.id });
      toast.success("Deleted");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const [achDialogId, setAchDialogId] = useState<string | null>(null);
  const [subs, setSubs] = useState<any[] | null>(null);
  const [subsBusy, setSubsBusy] = useState(false);

  const setAchAsDefault = async (id: string) => {
    try {
      const res = await callAdmin({ action: "set_ach_as_default", id });
      if (res.ok) toast.success("ACH set as Stripe Customer default.");
      else toast.error(res.error || "Failed to set default.");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const loadSubs = async (id: string) => {
    setSubsBusy(true);
    try {
      const res = await callAdmin({ action: "list_customer_subscriptions", id });
      setSubs(res.subscriptions ?? []);
    } catch (e) {
      toast.error((e as Error).message);
      setSubs([]);
    } finally {
      setSubsBusy(false);
    }
  };

  const setSubDefault = async (id: string, subscription_id: string) => {
    try {
      await callAdmin({ action: "set_subscription_default_pm", id, subscription_id });
      toast.success("Subscription default_payment_method updated.");
      await loadSubs(id);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const runBulk = async (
    label: string,
    fn: (r: Reservation) => Promise<unknown> | unknown,
    confirmMsg?: string,
  ) => {
    const targets = filtered.filter((r) => selected.has(r.id));
    if (targets.length === 0) { toast.error("Nothing selected"); return; }
    if (confirmMsg && !confirm(confirmMsg.replace("{n}", String(targets.length)))) return;
    setBulkBusy(true);
    let ok = 0, fail = 0;
    for (const r of targets) {
      try { await fn(r); ok++; } catch { fail++; }
    }
    setBulkBusy(false);
    if (fail === 0) toast.success(`${label}: ${ok} updated`);
    else toast.error(`${label}: ${ok} ok, ${fail} failed`);
    setSelected(new Set());
    await load();
  };

  const bulkDelete = () =>
    runBulk(
      "Delete",
      (r) => callAdmin({ action: "delete_reservation", id: r.id }),
      "Delete {n} reservations? This cannot be undone.",
    );
  const bulkMarkPaid = () =>
    {
      const notes = prompt("Add an admin note (applied to all selected reservations):");
      if (!notes || !notes.trim()) { toast.error("An admin note is required."); return; }
      return runBulk(
      "Mark Paid",
      (r) => callAdmin({ action: "manual_mark_paid", id: r.id, notes: notes.trim() }),
      "Manually mark {n} reservations as paid?",
      );
    };
  const bulkConfirm = () =>
    runBulk("Confirm", (r) => callAdmin({ action: "reservation_action", id: r.id, kind: "confirm" }));
  const bulkRelease = () =>
    runBulk("Release", (r) => callAdmin({ action: "reservation_action", id: r.id, kind: "release" }),
      "Release {n} holds?");
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // fall through to legacy path
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const bulkCopyLinks = async () => {
    const targets = filtered.filter((r) => selected.has(r.id));
    if (!targets.length) { toast.error("Nothing selected"); return; }
    const text = targets
      .map((r) => `${r.first_name} ${r.last_name}\t${window.location.origin}/reservation/${r.id}?token=${encodeURIComponent(r.secure_token)}`)
      .join("\n");
    const ok = await copyToClipboard(text);
    if (ok) toast.success(`Copied ${targets.length} links`);
    else toast.error("Copy blocked. Open in a new tab to copy.");
  };

  const copyLink = async (r: Reservation) => {
    const url = `${window.location.origin}/reservation/${r.id}?token=${encodeURIComponent(r.secure_token)}`;
    const ok = await copyToClipboard(url);
    if (ok) toast.success("Reservation link copied");
    else toast.error("Copy blocked. Open in a new tab to copy.");
  };

  const rowValues = (r: Reservation): Record<ColKey, string> => ({
    name: `${r.first_name} ${r.last_name}`.trim(),
    email: r.email,
    phone: r.phone ?? "",
    city: r.city ?? "",
    sauna: saunaTypeLabel(r.sauna_type_id),
    style: styleFor(r.sauna_type_id),
    install: r.preferred_install_at?.slice(0, 10) ?? "",
    status: r.reservation_status,
    payment: r.payment_status,
    consult: r.consult_status,
    id: r.id_status,
    contract: r.contract_status,
    created: r.created_at,
  });

  const filtered = useMemo(() => {
    const active = (Object.entries(colFilters) as [ColKey, string][]).filter(([, v]) => v !== "");
    const rows = reservations.filter((r) => {
      if (!active.length) return true;
      const vals = rowValues(r);
      return active.every(([k, v]) => vals[k].toLowerCase().includes(v.toLowerCase()));
    });
    if (sortCol) {
      rows.sort((a, b) => {
        const av = rowValues(a)[sortCol];
        const bv = rowValues(b)[sortCol];
        const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [reservations, colFilters, sortCol, sortDir]);

  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const someSelected = filtered.some((r) => selected.has(r.id));
  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const r of filtered) next.delete(r.id);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const r of filtered) next.add(r.id);
        return next;
      });
    }
  };

  const cols: [ColKey, string][] = [
    ["name", "Name"], ["email", "Email"], ["phone", "Phone"], ["city", "City"],
    ["sauna", "Sauna"], ["style", "Style"], ["install", "Install"],
    ["status", "Status"], ["payment", "Payment"],
    ["consult", "Consult"], ["id", "ID"], ["contract", "Contract"],
    ["created", "Created"],
  ];

  const statusOpts = ["Lead", "Pending Payment", "Reservation Hold", "Reservation Confirmed", "Needs Manual Review", "Cancelled", "Refunded"];
  const paymentOpts = ["Pending", "Paid", "Refunded", "Failed"];
  const stepOpts = ["Not Scheduled", "Scheduled", "Complete", "Not Sent", "Not Uploaded"];
  const styleOpts = ["Traditional", "Infrared"];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium text-foreground">
          Magic Links{" "}
          <span className="text-sm text-muted-foreground font-normal">
            ({filtered.length}{filtered.length !== reservations.length ? ` of ${reservations.length}` : ""})
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={async () => {
              try {
                const res = await callAdmin({ action: "backfill_stripe_customers" });
                const linked = (res.results ?? []).filter((r: any) => r.status === "linked").length;
                const missing = (res.results ?? []).filter((r: any) => r.status === "no_customer_on_session").length;
                toast.success(`Backfill: ${linked} linked, ${missing} missing customer, ${res.processed - linked - missing} errors`);
                await load();
              } catch (e) {
                toast.error((e as Error).message || "Backfill failed");
              }
            }}
            size="sm"
            variant="outline"
          >
            Backfill Stripe Customers
          </Button>
          <Button onClick={load} size="sm" variant="outline" disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-2 p-2 border border-border rounded-md bg-muted/40">
          <span className="text-xs text-foreground font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={bulkBusy} onClick={bulkCopyLinks}>Copy Links</Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={bulkBusy} onClick={bulkMarkPaid}>Mark Paid</Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={bulkBusy} onClick={bulkConfirm}>Confirm Hold</Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={bulkBusy} onClick={bulkRelease}>Release Hold</Button>
          <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" disabled={bulkBusy} onClick={bulkDelete}>Delete</Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={bulkBusy} onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <div className="overflow-x-auto border border-border rounded-md bg-card">
        <table className="w-full text-xs border-collapse">
          <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-2 py-1.5 border-r border-border w-8">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = !allSelected && someSelected; }}
                  onChange={toggleAll}
                />
              </th>
              {cols.map(([k, label]) => (
                <th key={k} className="text-left px-2 py-1.5 border-r border-border select-none">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                    onClick={() => toggleSort(k)}
                  >
                    {label}
                    <span className="text-[9px] opacity-70">
                      {sortCol === k ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </button>
                </th>
              ))}
              <th className="text-left px-2 py-1.5">Actions</th>
            </tr>
            <tr className="border-t border-border bg-muted/30">
              <th className="px-1 py-1 border-r border-border"></th>
              {cols.map(([k]) => (
                <th key={k} className="px-1 py-1 border-r border-border">
                  {k === "status" ? (
                    <select className="w-full h-6 px-1 text-xs bg-background border border-border rounded-sm outline-none" value={colFilters.status} onChange={(e) => setColFilter("status", e.target.value)}>
                      <option value="">All</option>
                      {statusOpts.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : k === "payment" ? (
                    <select className="w-full h-6 px-1 text-xs bg-background border border-border rounded-sm outline-none" value={colFilters.payment} onChange={(e) => setColFilter("payment", e.target.value)}>
                      <option value="">All</option>
                      {paymentOpts.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : k === "style" ? (
                    <select className="w-full h-6 px-1 text-xs bg-background border border-border rounded-sm outline-none" value={colFilters.style} onChange={(e) => setColFilter("style", e.target.value)}>
                      <option value="">All</option>
                      {styleOpts.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : k === "consult" || k === "id" || k === "contract" ? (
                    <select className="w-full h-6 px-1 text-xs bg-background border border-border rounded-sm outline-none" value={colFilters[k]} onChange={(e) => setColFilter(k, e.target.value)}>
                      <option value="">All</option>
                      {stepOpts.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input
                      className="w-full h-6 px-1.5 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary"
                      placeholder={k === "install" || k === "created" ? "YYYY-MM" : "Filter…"}
                      value={colFilters[k]}
                      onChange={(e) => setColFilter(k, e.target.value)}
                    />
                  )}
                </th>
              ))}
              <th className="px-1 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading && (
              <tr><td colSpan={cols.length + 2} className="text-center text-muted-foreground py-6">
                {reservations.length === 0 ? "No reservations yet." : "No matches."}
              </td></tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-2 py-1.5 border-r border-border">
                  <input
                    type="checkbox"
                    aria-label={`Select ${r.first_name} ${r.last_name}`}
                    checked={selected.has(r.id)}
                    onChange={() => toggleOne(r.id)}
                  />
                </td>
                <td className="px-2 py-1.5 border-r border-border font-medium text-foreground whitespace-nowrap">
                  {r.first_name} {r.last_name}
                </td>
                <td className="px-2 py-1.5 border-r border-border text-muted-foreground">{r.email}</td>
                <td className="px-2 py-1.5 border-r border-border text-muted-foreground whitespace-nowrap">{r.phone ?? "—"}</td>
                <td className="px-2 py-1.5 border-r border-border text-muted-foreground">{r.city ?? "—"}</td>
                <td className="px-2 py-1.5 border-r border-border text-muted-foreground whitespace-nowrap">{saunaTypeLabel(r.sauna_type_id)}</td>
                <td className="px-2 py-1.5 border-r border-border text-muted-foreground">{styleFor(r.sauna_type_id)}</td>
                <td className="px-2 py-1.5 border-r border-border text-muted-foreground whitespace-nowrap">{fmtDate(r.preferred_install_at)}</td>
                <td className="px-2 py-1.5 border-r border-border whitespace-nowrap">
                  <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] ${STATUS_COLOR[r.reservation_status] ?? "bg-gray-200 text-gray-900 border-gray-300"}`}>
                    {r.reservation_status}
                  </span>
                </td>
                <td className="px-2 py-1.5 border-r border-border text-muted-foreground">{r.payment_status}</td>
                <td className="px-2 py-1.5 border-r border-border text-muted-foreground">{r.consult_status}</td>
                <td className="px-2 py-1.5 border-r border-border text-muted-foreground">{r.id_status}</td>
                <td className="px-2 py-1.5 border-r border-border text-muted-foreground">{r.contract_status}</td>
                <td className="px-2 py-1.5 border-r border-border text-muted-foreground whitespace-nowrap">{fmt(r.created_at)}</td>
                <td className="px-2 py-1.5 whitespace-nowrap">
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => copyLink(r)}>Copy</Button>
                    {r.payment_status !== "Paid" && r.reservation_status !== "Lead" && (
                      <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => markPaid(r.id)}>Mark Paid</Button>
                    )}
                    {r.reservation_status === "Reservation Hold" && (
                      <>
                        <Button size="sm" className="h-6 px-2 text-[10px]" onClick={() => doAction(r.id, "confirm")}>Confirm</Button>
                        <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => doAction(r.id, "release")}>Release</Button>
                      </>
                    )}
                    {r.consult_status !== "Scheduled" && r.consult_status !== "Complete" && (
                      <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => doAction(r.id, "mark_consult_scheduled")}>Consult Scheduled</Button>
                    )}
                    {r.consult_status !== "Complete" && (
                      <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => doAction(r.id, "mark_consult")}>Consult Complete</Button>
                    )}
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => doAction(r.id, "mark_install_scheduled")}>Install Scheduled</Button>
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => doAction(r.id, "mark_install_complete")}>Install Complete</Button>
                    <Button size="sm" variant="destructive" className="h-6 px-2 text-[10px]" onClick={() => deleteReservation(r)}>Delete</Button>
                    {r.stripe_ach_payment_method_id && (
                      <Button
                        size="sm"
                        variant={r.ach_status === "Connected, Default Update Failed" ? "default" : "outline"}
                        className="h-6 px-2 text-[10px]"
                        onClick={() => { setAchDialogId(r.id); setSubs(null); }}
                      >
                        ACH
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {achDialogId && (() => {
        const r = reservations.find((x) => x.id === achDialogId);
        if (!r) return null;
        return (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setAchDialogId(null)}>
            <div className="bg-card border border-border rounded-md p-4 max-w-lg w-full text-sm" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">ACH Tools — {r.first_name} {r.last_name}</h3>
                <button className="text-muted-foreground hover:text-foreground" onClick={() => setAchDialogId(null)}>✕</button>
              </div>
              <dl className="space-y-1 text-xs mb-3">
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">ACH status</dt><dd>{r.ach_status ?? "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Bank</dt><dd>{r.ach_bank_name && r.ach_bank_last4 ? `${r.ach_bank_name} ••${r.ach_bank_last4}` : "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Customer default PM</dt><dd>{r.default_payment_method_status ?? "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Default updated</dt><dd>{r.default_payment_method_updated_at ? fmt(r.default_payment_method_updated_at) : "—"}</dd></div>
                {r.ach_last_error && (
                  <div className="text-orange-700 dark:text-orange-400 mt-2 text-[11px]">{r.ach_last_error}</div>
                )}
              </dl>
              <div className="flex flex-wrap gap-2 mb-4">
                <Button size="sm" onClick={() => setAchAsDefault(r.id)}>Set ACH as Stripe Default</Button>
                <Button size="sm" variant="outline" onClick={() => loadSubs(r.id)} disabled={subsBusy}>
                  {subsBusy ? "Loading…" : "List Subscriptions"}
                </Button>
              </div>
              {subs && (
                <div className="border-t border-border pt-3">
                  <div className="text-xs font-medium mb-2">Active Stripe Subscriptions</div>
                  {subs.length === 0 && <div className="text-xs text-muted-foreground">None found.</div>}
                  {subs.map((s) => {
                    const overrides = s.default_payment_method && s.default_payment_method !== r.stripe_ach_payment_method_id;
                    return (
                      <div key={s.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0 text-xs">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-[11px] truncate">{s.id}</div>
                          <div className="text-muted-foreground text-[11px]">
                            {s.status} · default PM: {s.default_payment_method ?? "(uses customer default)"}
                            {overrides && <span className="ml-2 text-orange-600">overrides customer default</span>}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => setSubDefault(r.id, s.id)}>
                          Set ACH as default
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}
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