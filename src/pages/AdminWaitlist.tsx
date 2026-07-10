import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { saunaTypeLabel } from "@/lib/reservationSaunaTypes";

interface WaitlistEntry {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  sauna_type_id: string;
  preferred_install_date: string | null;
  reservation_source: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const STATUSES = ["Open", "Contacted", "Converted", "Closed"] as const;

function fmtDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type ColKey =
  | "created" | "name" | "email" | "phone" | "city"
  | "sauna" | "preferred" | "source" | "status";

interface Props {
  callAdmin: (body: Record<string, unknown>) => Promise<any>;
}

export const WaitlistPanel = ({ callAdmin }: Props) => {
  const [rows, setRows] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<ColKey, string>>({
    created: "", name: "", email: "", phone: "", city: "",
    sauna: "", preferred: "", source: "", status: "",
  });
  const [sortCol, setSortCol] = useState<ColKey | null>("created");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const toggleSort = (k: ColKey) => {
    if (sortCol !== k) { setSortCol(k); setSortDir("asc"); }
    else if (sortDir === "asc") setSortDir("desc");
    else { setSortCol(null); setSortDir("asc"); }
  };
  const setF = (k: ColKey, v: string) => setFilters((p) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callAdmin({ action: "list_waitlist" });
      setRows(res.waitlist || []);
    } catch (e) {
      toast.error((e as Error).message || "Failed to load waitlist");
    } finally {
      setLoading(false);
    }
  }, [callAdmin]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().trim();
    let out = rows.filter((r) => {
      const name = `${r.first_name} ${r.last_name}`;
      if (filters.name && !norm(name).includes(norm(filters.name))) return false;
      if (filters.email && !norm(r.email).includes(norm(filters.email))) return false;
      if (filters.phone && !norm(r.phone ?? "").includes(norm(filters.phone))) return false;
      if (filters.city && !norm(r.city ?? "").includes(norm(filters.city))) return false;
      if (filters.sauna && !norm(saunaTypeLabel(r.sauna_type_id)).includes(norm(filters.sauna))) return false;
      if (filters.preferred && !norm(r.preferred_install_date ?? "").includes(norm(filters.preferred))) return false;
      if (filters.source && !norm(r.reservation_source).includes(norm(filters.source))) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.created && !r.created_at.startsWith(filters.created)) return false;
      return true;
    });
    if (sortCol) {
      const dir = sortDir === "asc" ? 1 : -1;
      const val = (r: WaitlistEntry): string => {
        switch (sortCol) {
          case "created": return r.created_at;
          case "name": return `${r.first_name} ${r.last_name}`;
          case "email": return r.email;
          case "phone": return r.phone ?? "";
          case "city": return r.city ?? "";
          case "sauna": return saunaTypeLabel(r.sauna_type_id);
          case "preferred": return r.preferred_install_date ?? "";
          case "source": return r.reservation_source;
          case "status": return r.status;
        }
      };
      out = [...out].sort((a, b) => val(a).localeCompare(val(b)) * dir);
    }
    return out;
  }, [rows, filters, sortCol, sortDir]);

  const del = async (id: string) => {
    if (!confirm("Delete this waitlist entry?")) return;
    try {
      await callAdmin({ action: "delete_waitlist", id });
      toast.success("Deleted");
      await load();
    } catch (e) {
      toast.error((e as Error).message || "Failed");
    }
  };

  const setStatus = async (id: string, status: string) => {
    try {
      await callAdmin({ action: "update_waitlist", id, patch: { status } });
      setRows((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (e) {
      toast.error((e as Error).message || "Failed");
    }
  };

  const sortArrow = (k: ColKey) =>
    sortCol === k ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  const cols: { key: ColKey; label: string }[] = [
    { key: "created", label: "Added" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "city", label: "City" },
    { key: "sauna", label: "Sauna Type" },
    { key: "preferred", label: "Preferred Install" },
    { key: "source", label: "Source" },
    { key: "status", label: "Status" },
  ];

  if (loading) return <p className="text-muted-foreground">Loading waitlist…</p>;

  return (
    <div className="overflow-x-auto">
      <div className="mb-2 text-sm text-muted-foreground">{filtered.length} entries</div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="text-left border-b border-border">
            {cols.map((c) => (
              <th
                key={c.key}
                onClick={() => toggleSort(c.key)}
                className="px-2 py-2 font-medium cursor-pointer select-none whitespace-nowrap"
              >
                {c.label}{sortArrow(c.key)}
              </th>
            ))}
            <th className="px-2 py-2 font-medium">Actions</th>
          </tr>
          <tr className="border-b border-border">
            {cols.map((c) => (
              <th key={c.key} className="px-2 py-1">
                {c.key === "status" ? (
                  <select
                    value={filters.status}
                    onChange={(e) => setF("status", e.target.value)}
                    className="w-full text-xs border border-input rounded px-1 py-0.5 bg-background"
                  >
                    <option value="">All</option>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <Input
                    value={filters[c.key]}
                    onChange={(e) => setF(c.key, e.target.value)}
                    className="h-7 text-xs"
                    placeholder="filter"
                  />
                )}
              </th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-b border-border align-top">
              <td className="px-2 py-2 whitespace-nowrap">{fmtDate(r.created_at)}</td>
              <td className="px-2 py-2 whitespace-nowrap">{r.first_name} {r.last_name}</td>
              <td className="px-2 py-2">{r.email}</td>
              <td className="px-2 py-2 whitespace-nowrap">{r.phone || "—"}</td>
              <td className="px-2 py-2">{r.city || "—"}</td>
              <td className="px-2 py-2">{saunaTypeLabel(r.sauna_type_id)}</td>
              <td className="px-2 py-2 whitespace-nowrap">{fmtDate(r.preferred_install_date)}</td>
              <td className="px-2 py-2">{r.reservation_source}</td>
              <td className="px-2 py-2">
                <select
                  value={r.status}
                  onChange={(e) => setStatus(r.id, e.target.value)}
                  className="text-xs border border-input rounded px-1 py-0.5 bg-background"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td className="px-2 py-2">
                <Button size="sm" variant="destructive" onClick={() => del(r.id)}>Delete</Button>
              </td>
            </tr>
          ))}
          {!filtered.length && (
            <tr>
              <td colSpan={cols.length + 1} className="text-center py-6 text-muted-foreground">
                No waitlist entries.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};