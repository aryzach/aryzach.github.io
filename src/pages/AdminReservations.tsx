import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  | "Sold";

const STATUSES: SaunaStatus[] = [
  "Available",
  "Reservation Hold",
  "Reservation Confirmed",
  "Installed",
  "Returning",
  "Maintenance",
  "Incoming",
  "Sold",
];

const STATUS_STYLES: Record<SaunaStatus, string> = {
  "Available": "bg-green-100 text-green-900 border-green-200",
  "Reservation Hold": "bg-blue-100 text-blue-900 border-blue-200",
  "Reservation Confirmed": "bg-purple-100 text-purple-900 border-purple-200",
  "Installed": "bg-slate-200 text-slate-900 border-slate-300",
  "Returning": "bg-yellow-100 text-yellow-900 border-yellow-200",
  "Maintenance": "bg-orange-100 text-orange-900 border-orange-200",
  "Incoming": "bg-sky-100 text-sky-900 border-sky-200",
  "Sold": "bg-gray-200 text-gray-900 border-gray-300",
};

const ELIGIBILITY = ["indoor", "outdoor", "either"] as const;
const MODELS = ["Standard", "Prototype"] as const;
type ModelValue = typeof MODELS[number];
const STYLES = ["Traditional", "Infrared"] as const;
type StyleValue = typeof STYLES[number];

const ELIG_LABEL: Record<"indoor" | "outdoor" | "either", string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  either: "Both",
};

function styleFor(sauna_type_id: string): StyleValue {
  return /infrared/i.test(sauna_type_id) ? "Infrared" : "Traditional";
}

function saunaTypeIdFor(style: StyleValue, elig: "indoor" | "outdoor" | "either"): string | null {
  const loc = elig === "either" ? "either" : elig;
  const key = `${style.toLowerCase()}|${loc}`;
  return STYLE_LOC_TO_TYPE[key] ?? null;
}

// Map CSV "Style" + "Location" to a sauna_type_id in the DB.
const STYLE_LOC_TO_TYPE: Record<string, string> = {
  "infrared|indoor": "indoor_infrared",
  "infrared|outdoor": "outdoor_infrared",
  "traditional|indoor": "indoor_traditional",
  "traditional|outdoor": "outdoor_traditional_latest",
  "traditional|either": "indoor_outdoor_traditional_latest",
};

const LOCATION_TO_ELIG: Record<string, "indoor" | "outdoor" | "either"> = {
  indoor: "indoor",
  outdoor: "outdoor",
  both: "either",
  either: "either",
};

// Minimal CSV parser supporting quoted fields and escaped quotes.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        cur.push(field); field = "";
        if (cur.length > 1 || cur[0] !== "") rows.push(cur);
        cur = [];
      } else field += c;
    }
  }
  if (field !== "" || cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}

function normalizeDate(v: string): string | null {
  const s = v.trim();
  if (!s) return null;
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface InventoryRow {
  id: string;
  unit_code: string | null;
  sauna_type_id: string;
  model: string | null;
  indoor_outdoor_eligibility: "indoor" | "outdoor" | "either";
  status: SaunaStatus;
  current_customer: string | null;
  install_date: string | null;
  available_date: string | null;
  admin_notes: string | null;
  reservation_id: string | null;
  updated_at: string;
  created_at: string;
}

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
    case "Sold":
      return "Sold";
  }
}

const AdminReservations = () => {
  useSEO({ title: "Admin — Inventory", description: "Internal sauna inventory admin." });

  const [password, setPassword] = useState<string>(() => sessionStorage.getItem(PASSWORD_STORAGE_KEY) || "");
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [types, setTypes] = useState<SaunaType[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"inventory" | "calendar">("inventory");
  const [calMonth, setCalMonth] = useState<{ y: number; m: number }>(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  // Per-column filters
  type ColKey =
    | "id"
    | "location"
    | "style"
    | "model"
    | "status"
    | "customer"
    | "install"
    | "available"
    | "timeline"
    | "notes"
    | "updated";
  const [colFilters, setColFilters] = useState<Record<ColKey, string>>({
    id: "", location: "", style: "", model: "", status: "",
    customer: "", install: "", available: "", timeline: "", notes: "", updated: "",
  });
  const setColFilter = (k: ColKey, v: string) => setColFilters((p) => ({ ...p, [k]: v }));
  const [sortCol, setSortCol] = useState<ColKey | null>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const toggleSort = (k: ColKey) => {
    if (sortCol !== k) { setSortCol(k); setSortDir("asc"); }
    else if (sortDir === "asc") setSortDir("desc");
    else { setSortCol(null); setSortDir("asc"); }
  };

  const [draft, setDraft] = useState<null | {
    unit_code: string;
    style: StyleValue;
    model: string;
    indoor_outdoor_eligibility: "indoor" | "outdoor" | "either";
    status: SaunaStatus;
    current_customer: string;
    install_date: string;
    available_date: string;
    admin_notes: string;
  }>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftErrorField, setDraftErrorField] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<null | { ok: number; errors: { row: number; message: string }[] }>(null);

  const downloadTemplate = () => {
    const headers = ["ID", "Location", "Style", "Model", "Status", "Customer", "Install", "Available", "Notes"];
    const sample = ["SF-001", "Indoor", "Traditional", "Standard", "Available", "", "", "", ""];
    const csv = headers.join(",") + "\n" + sample.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sauna-inventory-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) throw new Error("CSV is empty.");
      const headers = rows[0].map((h) => h.trim().toLowerCase());
      const idx = (name: string) => headers.indexOf(name.toLowerCase());
      const col = {
        id: idx("ID"),
        location: idx("Location"),
        style: idx("Style"),
        model: idx("Model"),
        status: idx("Status"),
        customer: idx("Customer"),
        install: idx("Install"),
        available: idx("Available"),
        notes: idx("Notes"),
      };
      let ok = 0;
      const errors: { row: number; message: string }[] = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (r.every((c) => !c.trim())) continue;
        const get = (k: number) => (k >= 0 ? (r[k] || "").trim() : "");
        try {
          const locRaw = get(col.location).toLowerCase();
          const styleRaw = get(col.style).toLowerCase();
          const elig = LOCATION_TO_ELIG[locRaw];
          if (!elig) throw new Error(`Invalid Location "${get(col.location)}" (use Indoor, Outdoor, or Both)`);
          if (!styleRaw) throw new Error("Missing Style");
          const typeKey = `${styleRaw}|${elig}`;
          const sauna_type_id = STYLE_LOC_TO_TYPE[typeKey];
          if (!sauna_type_id) throw new Error(`No sauna type for Style="${get(col.style)}" + Location="${get(col.location)}"`);

          const statusRaw = get(col.status);
          const status = statusRaw
            ? (STATUSES.find((s) => s.toLowerCase() === statusRaw.toLowerCase()) || null)
            : "Available";
          if (!status) throw new Error(`Invalid Status "${statusRaw}"`);

          const install_date = normalizeDate(get(col.install));
          if (get(col.install) && !install_date) throw new Error(`Invalid Install date "${get(col.install)}"`);
          const available_date = normalizeDate(get(col.available));
          if (get(col.available) && !available_date) throw new Error(`Invalid Available date "${get(col.available)}"`);

          const modelRaw = get(col.model);
          const model = modelRaw
            ? (MODELS.find((m) => m.toLowerCase() === modelRaw.toLowerCase()) || null)
            : "";
          if (modelRaw && !model) throw new Error(`Invalid Model "${modelRaw}" (must be Standard or Prototype)`);

          await callAdmin({
            action: "create_inventory",
            unit_code: get(col.id) || "",
            sauna_type_id,
            model: model || "",
            indoor_outdoor_eligibility: elig,
            status,
            current_customer: get(col.customer) || "",
            install_date: install_date || "",
            available_date: available_date || "",
            admin_notes: get(col.notes) || "",
          });
          ok++;
        } catch (e) {
          errors.push({ row: i + 1, message: (e as Error).message });
        }
      }
      setImportResult({ ok, errors });
      if (ok > 0) toast.success(`Imported ${ok} sauna${ok === 1 ? "" : "s"}`);
      if (errors.length) toast.error(`${errors.length} row${errors.length === 1 ? "" : "s"} failed`);
      await loadAll();
    } catch (e) {
      toast.error((e as Error).message || "Import failed");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const startDraft = () => {
    setDraftError(null);
    setDraftErrorField(null);
    setDraft({
      unit_code: "",
      style: "Traditional",
      model: "",
      indoor_outdoor_eligibility: "either",
      status: "Available",
      current_customer: "",
      install_date: "",
      available_date: "",
      admin_notes: "",
    });
  };

  const setD = <K extends keyof NonNullable<typeof draft>>(k: K, v: NonNullable<typeof draft>[K]) =>
    setDraft((p) => (p ? { ...p, [k]: v } : p));

  const saveDraft = async () => {
    if (!draft) return;
    setDraftError(null);
    setDraftErrorField(null);
    const sauna_type_id = saunaTypeIdFor(draft.style, draft.indoor_outdoor_eligibility);
    if (!sauna_type_id) {
      setDraftError(`No sauna type for ${draft.style} + ${ELIG_LABEL[draft.indoor_outdoor_eligibility]}.`);
      setDraftErrorField("style");
      return;
    }
    setSavingDraft(true);
    try {
      const { style, ...rest } = draft;
      void style;
      await callAdmin({ action: "create_inventory", ...rest, sauna_type_id });
      toast.success("Added");
      setDraft(null);
      await loadAll();
    } catch (e) {
      const msg = (e as Error).message || "Failed to save.";
      // Try to map Postgres errors to a field
      const fieldMatches: [RegExp, string][] = [
        [/install_date/i, "install_date"],
        [/available_date/i, "available_date"],
        [/sauna_type_id/i, "sauna_type_id"],
        [/indoor_outdoor_eligibility/i, "indoor_outdoor_eligibility"],
        [/unit_code/i, "unit_code"],
        [/status/i, "status"],
        [/current_customer/i, "current_customer"],
        [/model/i, "model"],
      ];
      const hit = fieldMatches.find(([re]) => re.test(msg));
      setDraftErrorField(hit ? hit[1] : null);
      setDraftError(msg);
    } finally {
      setSavingDraft(false);
    }
  };

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
      const [typesRes, invRes] = await Promise.all([
        supabase.from("sauna_types").select("id, name, sort_order").order("sort_order"),
        callAdmin({ action: "list_inventory" }),
      ]);
      if (typesRes.data) setTypes(typesRes.data as SaunaType[]);
      setInventory(invRes.inventory || []);
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

  const rowValues = (r: InventoryRow): Record<ColKey, string> => ({
    id: r.unit_code || "",
    location: ELIG_LABEL[r.indoor_outdoor_eligibility],
    style: styleFor(r.sauna_type_id),
    model: r.model || "",
    status: r.status,
    customer: r.current_customer || "",
    install: r.install_date || "",
    available: r.available_date || "",
    timeline: timelineFor(r),
    notes: r.admin_notes || "",
    updated: r.updated_at,
  });

  const filtered = useMemo(() => {
    const active = (Object.entries(colFilters) as [ColKey, string][]).filter(([, v]) => v !== "");
    const rows = inventory.filter((r) => {
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
  }, [inventory, colFilters, sortCol, sortDir]);

  // Inline cell save. Optimistically update local state then send patch.
  const updateCell = async (id: string, key: keyof InventoryRow, value: string | null) => {
    setInventory((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } as InventoryRow : r)));
    try {
      await callAdmin({ action: "update_inventory", id, patch: { [key]: value } });
    } catch (e) {
      toast.error((e as Error).message || "Save failed");
      await loadAll();
    }
  };

  // Location and Style both feed sauna_type_id; recompute and patch together.
  const updateLocationOrStyle = async (
    row: InventoryRow,
    which: "location" | "style",
    value: "indoor" | "outdoor" | "either" | StyleValue,
  ) => {
    const nextElig = which === "location" ? (value as "indoor" | "outdoor" | "either") : row.indoor_outdoor_eligibility;
    const nextStyle = which === "style" ? (value as StyleValue) : styleFor(row.sauna_type_id);
    const nextTypeId = saunaTypeIdFor(nextStyle, nextElig);
    if (!nextTypeId) {
      toast.error(`No sauna type for ${nextStyle} + ${ELIG_LABEL[nextElig]}.`);
      return;
    }
    const patch = { indoor_outdoor_eligibility: nextElig, sauna_type_id: nextTypeId };
    setInventory((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...patch } : r)));
    try {
      await callAdmin({ action: "update_inventory", id: row.id, patch });
    } catch (e) {
      toast.error((e as Error).message || "Save failed");
      await loadAll();
    }
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
        <div className="container mx-auto px-3 max-w-[1600px]">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold text-foreground">Admin — Inventory</h1>
            <div className="flex gap-2">
              <Button onClick={startDraft} disabled={!!draft}>Add sauna</Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                {importing ? "Importing…" : "Import CSV"}
              </Button>
              <Button variant="outline" onClick={downloadTemplate}>Template</Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); }}
              />
              <Button variant="outline" size="sm" onClick={logout}>Sign out</Button>
            </div>
          </div>

          {loading && <p className="text-muted-foreground">Loading…</p>}

          {importResult && (
            <div className="mb-4 p-3 rounded-md border border-border bg-card text-sm">
              <div className="font-medium mb-1">Import result: {importResult.ok} added, {importResult.errors.length} failed</div>
              {importResult.errors.length > 0 && (
                <ul className="text-xs text-destructive space-y-0.5 max-h-40 overflow-auto">
                  {importResult.errors.map((er, i) => (
                    <li key={i}>Row {er.row}: {er.message}</li>
                  ))}
                </ul>
              )}
              <button className="text-xs text-muted-foreground underline mt-2" onClick={() => setImportResult(null)}>Dismiss</button>
            </div>
          )}

          <section className="mb-10">
            <div className="space-y-3">
                <div className="overflow-x-auto border border-border rounded-md bg-card">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
                      <tr>
                        {([
                          ["id", "ID"],
                          ["location", "Location"],
                          ["style", "Style"],
                          ["model", "Model"],
                          ["status", "Status"],
                          ["customer", "Customer"],
                          ["install", "Install"],
                          ["available", "Available"],
                          ["timeline", "Timeline"],
                          ["notes", "Notes"],
                          ["updated", "Updated"],
                        ] as [ColKey, string][]).map(([k, label]) => (
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
                        <th className="text-left px-2 py-1.5"></th>
                      </tr>
                      <tr className="border-t border-border bg-muted/30">
                        <th className="px-1 py-1 border-r border-border">
                          <input className="w-full h-6 px-1.5 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" placeholder="Filter…" value={colFilters.id} onChange={(e) => setColFilter("id", e.target.value)} />
                        </th>
                        <th className="px-1 py-1 border-r border-border">
                          <select className="w-full h-6 px-1 text-xs bg-background border border-border rounded-sm outline-none" value={colFilters.location} onChange={(e) => setColFilter("location", e.target.value)}>
                            <option value="">All</option>
                            {ELIGIBILITY.map((e) => <option key={e} value={ELIG_LABEL[e]}>{ELIG_LABEL[e]}</option>)}
                          </select>
                        </th>
                        <th className="px-1 py-1 border-r border-border">
                          <select className="w-full h-6 px-1 text-xs bg-background border border-border rounded-sm outline-none" value={colFilters.style} onChange={(e) => setColFilter("style", e.target.value)}>
                            <option value="">All</option>
                            {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </th>
                        <th className="px-1 py-1 border-r border-border">
                          <select className="w-full h-6 px-1 text-xs bg-background border border-border rounded-sm outline-none" value={colFilters.model} onChange={(e) => setColFilter("model", e.target.value)}>
                            <option value="">All</option>
                            {MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </th>
                        <th className="px-1 py-1 border-r border-border">
                          <select className="w-full h-6 px-1 text-xs bg-background border border-border rounded-sm outline-none" value={colFilters.status} onChange={(e) => setColFilter("status", e.target.value)}>
                            <option value="">All</option>
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </th>
                        <th className="px-1 py-1 border-r border-border">
                          <input className="w-full h-6 px-1.5 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" placeholder="Filter…" value={colFilters.customer} onChange={(e) => setColFilter("customer", e.target.value)} />
                        </th>
                        <th className="px-1 py-1 border-r border-border">
                          <input className="w-full h-6 px-1.5 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" placeholder="YYYY-MM" value={colFilters.install} onChange={(e) => setColFilter("install", e.target.value)} />
                        </th>
                        <th className="px-1 py-1 border-r border-border">
                          <input className="w-full h-6 px-1.5 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" placeholder="YYYY-MM" value={colFilters.available} onChange={(e) => setColFilter("available", e.target.value)} />
                        </th>
                        <th className="px-1 py-1 border-r border-border">
                          <input className="w-full h-6 px-1.5 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" placeholder="Filter…" value={colFilters.timeline} onChange={(e) => setColFilter("timeline", e.target.value)} />
                        </th>
                        <th className="px-1 py-1 border-r border-border">
                          <input className="w-full h-6 px-1.5 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" placeholder="Filter…" value={colFilters.notes} onChange={(e) => setColFilter("notes", e.target.value)} />
                        </th>
                        <th className="px-1 py-1 border-r border-border">
                          <input className="w-full h-6 px-1.5 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" placeholder="YYYY-MM" value={colFilters.updated} onChange={(e) => setColFilter("updated", e.target.value)} />
                        </th>
                        <th className="px-1 py-1"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {draft && (
                        <>
                          <tr className="border-t border-border bg-primary/5">
                            <td className="px-1 py-1 border-r border-border">
                              <Input className={`h-7 text-xs font-mono ${draftErrorField === "unit_code" ? "border-destructive" : ""}`} value={draft.unit_code} onChange={(e) => setD("unit_code", e.target.value)} placeholder="ID" />
                            </td>
                            <td className="px-1 py-1 border-r border-border">
                              <Select value={draft.indoor_outdoor_eligibility} onValueChange={(v) => setD("indoor_outdoor_eligibility", v as "indoor" | "outdoor" | "either")}>
                                <SelectTrigger className={`h-7 text-xs ${draftErrorField === "indoor_outdoor_eligibility" || draftErrorField === "style" ? "border-destructive" : ""}`}><SelectValue /></SelectTrigger>
                                <SelectContent>{ELIGIBILITY.map((e) => <SelectItem key={e} value={e}>{ELIG_LABEL[e]}</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                            <td className="px-1 py-1 border-r border-border">
                              <Select value={draft.style} onValueChange={(v) => setD("style", v as StyleValue)}>
                                <SelectTrigger className={`h-7 text-xs ${draftErrorField === "style" ? "border-destructive" : ""}`}>
                                  <SelectValue placeholder="Style" />
                                </SelectTrigger>
                                <SelectContent>
                                  {STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-1 py-1 border-r border-border">
                              <Select value={draft.model} onValueChange={(v) => setD("model", v)}>
                                <SelectTrigger className={`h-7 text-xs ${draftErrorField === "model" ? "border-destructive" : ""}`}>
                                  <SelectValue placeholder="Model" />
                                </SelectTrigger>
                                <SelectContent>
                                  {MODELS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-1 py-1 border-r border-border">
                              <Select value={draft.status} onValueChange={(v) => setD("status", v as SaunaStatus)}>
                                <SelectTrigger className={`h-7 text-xs ${draftErrorField === "status" ? "border-destructive" : ""}`}><SelectValue /></SelectTrigger>
                                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                            <td className="px-1 py-1 border-r border-border">
                              <Input className={`h-7 text-xs ${draftErrorField === "current_customer" ? "border-destructive" : ""}`} value={draft.current_customer} onChange={(e) => setD("current_customer", e.target.value)} placeholder="Customer" />
                            </td>
                            <td className="px-1 py-1 border-r border-border">
                              <Input type="date" className={`h-7 text-xs ${draftErrorField === "install_date" ? "border-destructive" : ""}`} value={draft.install_date} onChange={(e) => setD("install_date", e.target.value)} />
                            </td>
                            <td className="px-1 py-1 border-r border-border">
                              <Input type="date" className={`h-7 text-xs ${draftErrorField === "available_date" ? "border-destructive" : ""}`} value={draft.available_date} onChange={(e) => setD("available_date", e.target.value)} />
                            </td>
                            <td className="px-1 py-1 border-r border-border text-muted-foreground">—</td>
                            <td className="px-1 py-1 border-r border-border">
                              <Input className="h-7 text-xs" value={draft.admin_notes} onChange={(e) => setD("admin_notes", e.target.value)} placeholder="Notes" />
                            </td>
                            <td className="px-1 py-1 border-r border-border text-muted-foreground">—</td>
                            <td className="px-1 py-1">
                              <div className="flex gap-1">
                                <Button size="sm" className="h-7 text-xs px-2" onClick={saveDraft} disabled={savingDraft}>{savingDraft ? "…" : "Save"}</Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => { setDraft(null); setDraftError(null); setDraftErrorField(null); }}>Cancel</Button>
                              </div>
                            </td>
                          </tr>
                          {draftError && (
                            <tr className="bg-destructive/10">
                              <td colSpan={12} className="px-3 py-2 text-xs text-destructive">
                                {draftErrorField ? <><strong className="capitalize">{draftErrorField.replace(/_/g, " ")}:</strong> {draftError}</> : draftError}
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                      {filtered.length === 0 && !draft && (
                        <tr><td colSpan={12} className="px-3 py-6 text-center text-muted-foreground">No saunas match.</td></tr>
                      )}
                      {filtered.map((r) => (
                        <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                          <td className="px-1 py-0.5 border-r border-border">
                            <TextCell value={r.unit_code || ""} mono onSave={(v) => updateCell(r.id, "unit_code", v || null)} />
                          </td>
                          <td className="px-1 py-0.5 border-r border-border">
                            <SelectCell
                              value={r.indoor_outdoor_eligibility}
                              options={ELIGIBILITY.map((e) => ({ value: e, label: ELIG_LABEL[e] }))}
                              onSave={(v) => updateLocationOrStyle(r, "location", v as "indoor" | "outdoor" | "either")}
                            />
                          </td>
                          <td className="px-1 py-0.5 border-r border-border">
                            <SelectCell
                              value={styleFor(r.sauna_type_id)}
                              options={STYLES.map((s) => ({ value: s, label: s }))}
                              onSave={(v) => updateLocationOrStyle(r, "style", v as StyleValue)}
                            />
                          </td>
                          <td className="px-1 py-0.5 border-r border-border">
                            <SelectCell
                              value={r.model || ""}
                              options={[{ value: "", label: "—" }, ...MODELS.map((m) => ({ value: m, label: m }))]}
                              onSave={(v) => updateCell(r.id, "model", v || null)}
                            />
                          </td>
                          <td className="px-1 py-0.5 border-r border-border">
                            <SelectCell
                              value={r.status}
                              options={STATUSES.map((s) => ({ value: s, label: s, className: STATUS_STYLES[s] }))}
                              onSave={(v) => updateCell(r.id, "status", v)}
                              badgeClass={STATUS_STYLES[r.status]}
                            />
                          </td>
                          <td className="px-1 py-0.5 border-r border-border">
                            <TextCell value={r.current_customer || ""} onSave={(v) => updateCell(r.id, "current_customer", v || null)} />
                          </td>
                          <td className="px-1 py-0.5 border-r border-border">
                            <DateCell value={r.install_date} onSave={(v) => updateCell(r.id, "install_date", v)} />
                          </td>
                          <td className="px-1 py-0.5 border-r border-border">
                            <DateCell value={r.available_date} onSave={(v) => updateCell(r.id, "available_date", v)} />
                          </td>
                          <td className="px-2 py-1 border-r border-border text-muted-foreground whitespace-nowrap">{timelineFor(r)}</td>
                          <td className="px-1 py-0.5 border-r border-border">
                            <TextCell value={r.admin_notes || ""} onSave={(v) => updateCell(r.id, "admin_notes", v || null)} />
                          </td>
                          <td className="px-2 py-1 border-r border-border text-muted-foreground whitespace-nowrap">{new Date(r.updated_at).toLocaleDateString()}</td>
                          <td className="px-1 py-0.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-xs px-2"
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// ---------- Spreadsheet cells ----------

const TextCell = ({ value, onSave, mono }: { value: string; onSave: (v: string) => void; mono?: boolean }) => {
  const [local, setLocal] = useState(value);
  const ref = useRef(value);
  useEffect(() => { setLocal(value); ref.current = value; }, [value]);
  return (
    <input
      className={`w-full h-7 px-1.5 text-xs bg-transparent border border-transparent hover:border-border focus:border-primary focus:bg-background rounded-sm outline-none ${mono ? "font-mono" : ""}`}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => { if (local !== ref.current) onSave(local); }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { setLocal(ref.current); (e.target as HTMLInputElement).blur(); } }}
    />
  );
};

const DateCell = ({ value, onSave }: { value: string | null; onSave: (v: string | null) => void }) => {
  const [local, setLocal] = useState(value || "");
  const ref = useRef(value || "");
  const [focused, setFocused] = useState(false);
  useEffect(() => { setLocal(value || ""); ref.current = value || ""; }, [value]);
  const showAsDate = focused || !!local;
  return (
    <input
      type={showAsDate ? "date" : "text"}
      className="w-full h-7 px-1.5 text-xs bg-transparent border border-transparent hover:border-border focus:border-primary focus:bg-background rounded-sm outline-none"
      value={local}
      readOnly={!showAsDate}
      onChange={(e) => setLocal(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => { setFocused(false); if (local !== ref.current) onSave(local || null); }}
    />
  );
};

const SelectCell = ({
  value,
  options,
  onSave,
  capitalize,
  badgeClass,
}: {
  value: string;
  options: { value: string; label: string; className?: string }[];
  onSave: (v: string) => void;
  capitalize?: boolean;
  badgeClass?: string;
}) => {
  return (
    <select
      className={`w-full h-7 px-1.5 text-xs border border-transparent hover:border-border focus:border-primary rounded-sm outline-none ${capitalize ? "capitalize" : ""} ${badgeClass ? `font-medium ${badgeClass}` : "bg-transparent focus:bg-background"}`}
      value={value}
      onChange={(e) => onSave(e.target.value)}
    >
      {options.map((o) => <option key={o.value} value={o.value} className={o.className}>{o.label}</option>)}
    </select>
  );
};

export default AdminReservations;