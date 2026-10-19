import {inventoryAvailability} from '@/lib/inventoryAvailability';
import {Dialog,DialogContent,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {fleetEditable,incomingBookingConflicts} from '@/lib/incomingFleet';
import SaunaStateBadge from '@/components/admin/SaunaStateBadge';
import {fetchAdminJson} from '@/lib/adminRequest';
import XeroSyncPanel from '@/components/admin/XeroSyncPanel';
import XeroCustomerHistory from '@/components/admin/XeroCustomerHistory';
import BookingsPanel from '@/components/admin/BookingsPanel';
import SaunaConditionPanel from '@/components/admin/SaunaConditionPanel';
import {saunaLifecycle} from '@/lib/bookingModel';
import CoreRecordsPanel from "@/components/admin/CoreRecordsPanel";
import { readWorkspace } from "@/dev/coreWorkspace";
import { CustomerInsights } from "@/components/admin/CustomerInsights";
import { previewEnabled } from "@/lib/runtime";
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
import { ReservationsListPanel } from "./AdminReservationsList";
import { WaitlistPanel } from "./AdminWaitlist";
import { AgreementVersionsPanel } from "./AdminAgreementVersions";
import { StripeStatusCard } from "@/components/admin/StripeStatusCard";
import { CustomerPickerCell, type CustomerOption } from "@/components/admin/CustomerPickerCell";
import { useResizableColumns, ColResizeHandle } from "@/hooks/useResizableColumns";
import { RevenueDashboard, type RevenueUnit } from "@/components/admin/RevenueDashboard";

const PASSWORD_STORAGE_KEY = "sf-sauna-admin-pw";
const conditionLabel=(value:string)=>({ready:'Ready',inspection:'Needs inspection',maintenance:'Maintenance',unknown:'Not recorded'}[value]||'Not recorded');

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
  | "Transfer Planned"
  | "Sold"
  | "Pre-sold";

const STATUSES: SaunaStatus[] = [
  "Available",
  "Reservation Hold",
  "Reservation Confirmed",
  "Installed",
  "Returning",
  "Maintenance",
  "Incoming",
  "Transfer Planned",
  "Sold",
  "Pre-sold",
];

const STATUS_STYLES: Record<SaunaStatus, string> = {
  "Available": "bg-green-100 text-green-900 border-green-200",
  "Reservation Hold": "bg-blue-100 text-blue-900 border-blue-200",
  "Reservation Confirmed": "bg-purple-100 text-purple-900 border-purple-200",
  "Installed": "bg-slate-200 text-slate-900 border-slate-300",
  "Returning": "bg-yellow-100 text-yellow-900 border-yellow-200",
  "Maintenance": "bg-orange-100 text-orange-900 border-orange-200",
  "Incoming": "bg-sky-100 text-sky-900 border-sky-200",
  "Transfer Planned": "bg-indigo-100 text-indigo-900 border-indigo-200",
  "Sold": "bg-gray-200 text-gray-900 border-gray-300",
  "Pre-sold": "bg-teal-100 text-teal-900 border-teal-200",
};

const ELIGIBILITY = ["indoor", "outdoor", "either"] as const;
const MODELS = ["Standard", "Original Collection", "v1 — Fir/Cedar", "v2 — Cedar"] as const;
type ModelValue = typeof MODELS[number];
const STYLES = ["Traditional", "Infrared"] as const;
type StyleValue = typeof STYLES[number];

const ELIG_LABEL: Record<"indoor" | "outdoor" | "either", string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  either: "Both",
};

function styleFor(row: { style?: string | null; sauna_type_id: string }): StyleValue {
  const raw = row.style || row.sauna_type_id;
  return /infrared/i.test(raw) ? "Infrared" : "Traditional";
}

const locationsFor = (elig: "indoor" | "outdoor" | "either"): string[] =>
  elig === "either" ? ["indoor", "outdoor"] : [elig];

type ModelKey = "standard" | "original" | "v1_fir_cedar" | "v2_cedar";
const modelKeyFor = (model?: string | null): ModelKey =>
  model === "Original Collection" ? "original"
  : model === "v1 — Fir/Cedar" ? "v1_fir_cedar"
  : model === "v2 — Cedar" ? "v2_cedar"
  : "standard";
// v1/v2 units rent under the standard sauna types.
const typeModelKeyFor = (model?: string | null): "standard" | "original" =>
  model === "Original Collection" ? "original" : "standard";

// A sauna type is exactly one (location, style, model) combination.
// Units that fit both locations are keyed to the indoor type but count for both.
function saunaTypeIdFor(
  style: StyleValue,
  elig: "indoor" | "outdoor" | "either",
  model?: string | null,
): string {
  const loc = elig === "outdoor" ? "outdoor" : "indoor";
  return `${loc}_${style.toLowerCase()}_${typeModelKeyFor(model)}`;
}

// Map CSV "Style" + "Location" to a sauna_type_id in the DB.
const STYLE_LOC_TO_TYPE: Record<string, string> = {
  "infrared|indoor": "indoor_infrared_standard",
  "infrared|outdoor": "outdoor_infrared_standard",
  "infrared|either": "indoor_infrared_standard",
  "traditional|indoor": "indoor_traditional_standard",
  "traditional|outdoor": "outdoor_traditional_standard",
  "traditional|either": "indoor_traditional_standard",
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
  model_key: ModelKey;
  style: "traditional" | "infrared";
  locations: string[];
  indoor_outdoor_eligibility: "indoor" | "outdoor" | "either";
  status: SaunaStatus;
  current_customer: string | null;
  future_customer: string | null;
  current_customer_id: string | null;
  future_customer_id: string | null;
  install_date: string | null;
  minimum_term_ends: string | null;
  available_date: string | null;
  incoming_eta?: string | null;
  condition_state?: string;
  retired_on?: string | null;
  admin_notes: string | null;
  monthly_price: number | null;
  current_contract: RevenueUnit["current_contract"];
  future_contract: RevenueUnit["future_contract"];
  reservation_id: string | null;
  updated_at: string;
  created_at: string;
}


const AdminReservations = () => {
  useSEO({ title: "Admin — Inventory", description: "Internal sauna inventory admin.", noindex: true });

  const [password, setPassword] = useState<string>(() => sessionStorage.getItem(PASSWORD_STORAGE_KEY) || "");
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [types, setTypes] = useState<SaunaType[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncReview,setSyncReview]=useState<{customerId?:string;contactId?:string}|null>(null);
  const [coreWorkspace, setCoreWorkspace] = useState(() => previewEnabled ? readWorkspace() : null);
  const [tab, setTab] = useState<"customers" | "rentals" | "insights" | "dashboard" | "inventory" | "calendar" | "reservations" | "waitlist" | "agreements">(() => new URLSearchParams(location.search).has("customerReservation") ? "customers" : new URLSearchParams(location.search).has("xero") ? "insights" : "inventory");
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
    | "fleet"
    | "custody"
    | "condition"
    | "booking_availability"
    | "customer"
    | "future_customer"
    | "install"
    | "committed"
    | "available"
    | "monthly"
    | "notes"
    | "updated";
  const [colFilters, setColFilters] = useState<Record<ColKey, string>>({
    id: "", location: "", style: "", model: "", fleet: "", custody: "", condition: "", booking_availability: "",
    customer: "", future_customer: "", install: "", committed: "", available: "", monthly: "", notes: "", updated: "",
  });
  const setColFilter = (k: ColKey, v: string) => setColFilters((p) => ({ ...p, [k]: v }));
  const INVENTORY_COLS: [ColKey, string][] = [
    ["id", "ID"],
    ["location", "Suitable for"],
    ["style", "Style"],
    ["model", "Model"],
    ["fleet", "Fleet"],
    ["custody", "Location"],
    ["condition", "Condition"],
    ["booking_availability", "Booking availability"],
    ["customer", "Current Customer"],
    ["future_customer", "Future Customer"],
    ["install", "Install"],
    ["committed", "Committed until"],
    ["monthly", "$/mo"],
    ["notes", "Notes"],
    ["updated", "Updated"],
  ];
  const { widths: invWidths, startResize: startInvResize, totalWidth: invTotalWidth } = useResizableColumns<ColKey | "actions">(
    "admin.inventory.colWidths.v1",
    [...INVENTORY_COLS.map(([k]) => k), "actions"] as (ColKey | "actions")[],
    130,
  );
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
    current_customer_id: string | null;
    future_customer_id: string | null;
    install_date: string;
    available_date: string;
    incoming_eta: string;
    admin_notes: string;
  }>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftErrorField, setDraftErrorField] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<null | { ok: number; errors: { row: number; message: string }[] }>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [fleetEditor,setFleetEditor]=useState<string|null>(null);
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const clearSelection = () => setSelectedIds(new Set());

  const bulkDelete = async () => {
    if (previewEnabled || !selectedIds.size) return;
    if (!confirm(`Delete ${selectedIds.size} sauna${selectedIds.size === 1 ? "" : "s"}?`)) return;
    setBulkBusy(true);
    let ok = 0; let fail = 0;
    for (const id of Array.from(selectedIds)) {
      try { await callAdmin({ action: "delete_inventory", id }); ok++; }
      catch { fail++; }
    }
    setBulkBusy(false);
    clearSelection();
    if (ok) toast.success(`Deleted ${ok}`);
    if (fail) toast.error(`${fail} failed`);
    await loadAll();
  };

  const downloadTemplate = () => {
    const headers = ["ID", "Location", "Style", "Model", "Status", "Customer", "Install", "Available", "Notes", "Inbound"];
    const sample = ["SF-001", "Indoor", "Traditional", "Standard", "Available", "", "", "", "", ""];
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
        inbound: idx("Inbound"),
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

          const incoming_eta=normalizeDate(get(col.inbound));
          if(status==='Incoming'&&(!incoming_eta||(available_date&&available_date<=incoming_eta)))throw Error('Inbound date required; availability must be after inbound.');
          const modelRaw = get(col.model);
          const model = modelRaw
            ? (MODELS.find((m) => m.toLowerCase() === modelRaw.toLowerCase()) || null)
            : "";
          if (modelRaw && !model) throw new Error(`Invalid Model "${modelRaw}" (must be Standard, Original Collection, v1 — Fir/Cedar, or v2 — Cedar)`);

          void sauna_type_id;
          const styleValue: StyleValue = styleRaw === "infrared" ? "Infrared" : "Traditional";
          const resolvedTypeId = saunaTypeIdFor(styleValue, elig, model || null);

          await callAdmin({
            action: "create_inventory",
            unit_code: get(col.id) || "",
            sauna_type_id: resolvedTypeId,
            model: model || "Standard",
            model_key: modelKeyFor(model),
            style: styleValue.toLowerCase(),
            locations: locationsFor(elig),
            indoor_outdoor_eligibility: elig,
            status,
            current_customer: get(col.customer) || "",
            install_date: install_date || "",
            available_date: available_date || "",
            incoming_eta:incoming_eta||"",
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
      current_customer_id: null,
      future_customer_id: null,
      install_date: "",
      available_date: "",
      incoming_eta: "",
      admin_notes: "",
    });
  };

  const setD = <K extends keyof NonNullable<typeof draft>>(k: K, v: NonNullable<typeof draft>[K]) =>
    setDraft((p) => (p ? { ...p, [k]: v } : p));

  const saveDraft = async () => {
    if (!draft) return;
    setDraftError(null);
    setDraftErrorField(null);
    const sauna_type_id = saunaTypeIdFor(draft.style, draft.indoor_outdoor_eligibility, draft.model);
    if(draft.status==='Incoming'&&(!draft.incoming_eta||(draft.available_date&&draft.available_date<=draft.incoming_eta))){setDraftError('Inbound date is required; booking availability must be after inbound.');return;}
    setSavingDraft(true);
    try {
      const { style, ...rest } = draft;
      await callAdmin({
        action: "create_inventory",
        ...rest,
        sauna_type_id,
        style: style.toLowerCase(),
        model_key: modelKeyFor(draft.model),
        locations: locationsFor(draft.indoor_outdoor_eligibility),
      });
      toast.success("Added");
      setDraft(null);
      await loadAll();
    } catch (e) {
      const msg = (e as Error).message || "Failed to save.";
      // Try to map Postgres errors to a field
      const fieldMatches: [RegExp, string][] = [
        [/install_date/i, "install_date"],
        [/available_date/i, "available_date"],
        [/incoming_eta|Inbound date/i, "incoming_eta"],
        [/sauna_type_id/i, "sauna_type_id"],
        [/indoor_outdoor_eligibility/i, "indoor_outdoor_eligibility"],
        [/unit_code/i, "unit_code"],
        [/status/i, "status"],
        [/current_customer/i, "current_customer_id"],
        [/future_customer/i, "future_customer_id"],
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
    async (body: Record<string, unknown>, bounded = false) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const url = `${supabaseUrl}/functions/v1/admin-api`;
      const init = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(body),
      };
      if (bounded || ['lifecycle_command','core_workspace'].includes(String(body.action))) return fetchAdminJson(url, init);
      const res = await fetch(url, init);
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
      return res.json();
    },
    [password],
  );

  const readLtvSources = useCallback(() => callAdmin({ action: "ltv_sources" }), [callAdmin]);

  useEffect(() => {
    if (!previewEnabled || !coreWorkspace?.source) return;
    if (coreWorkspace.legacyInventory) {
      setInventory(coreWorkspace.legacyInventory as unknown as InventoryRow[]);
      setTypes(coreWorkspace.legacyTypes || []);
      setCustomers(coreWorkspace.customers.flatMap(c => c.legacyReservationIds.map(id => ({ id, name: c.name || c.email, email: c.email }))));
    }
    if ((!coreWorkspace.reservations || !coreWorkspace.lifecycle) && import.meta.env.DEV && location.hostname === '127.0.0.1') {
      // Upgrade the existing read-only copy without replacing customer/rental drafts.
      fetch('/__local-records', { headers: { 'x-sf-local-records': '1' }, cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(copy => {
        if (!copy?.legacyInventory || !copy.lifecycle) return;
        setCoreWorkspace(previous => {
          if (!previous?.source) return previous;
          const next = { ...copy,legacyInventory: copy.legacyInventory, legacyTypes: copy.legacyTypes, reservations: copy.reservations, assets: copy.assets };
          sessionStorage.setItem('sf-sauna-core-records-preview-v1', JSON.stringify(next));
          return next;
        });
      }).catch(() => toast.error('Could not load the local inventory copy.'));
    }
  }, [coreWorkspace]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [typesRes, invRes, custRes] = await Promise.all([
        supabase.from("sauna_types").select("id, name, sort_order").order("sort_order"),
        callAdmin({ action: "list_inventory" }),
        callAdmin({ action: "list_customers" }),
      ]);
      if (typesRes.data) setTypes(typesRes.data as SaunaType[]);
      if (!previewEnabled) {
        setInventory(invRes.inventory || []);
        const core = await callAdmin({ action: "core_workspace" });
        setCoreWorkspace(core?.workspace || null);
      }
      if (!previewEnabled) setCustomers((custRes.customers || []).map((c: any) => ({ id: c.id, name: c.name, email: c.email })));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, [callAdmin]);

  const inventoryStateCommand=async(action:'booking_command'|'lifecycle_command',operation:string,record:Record<string,unknown>)=>{
    const {commandId,...fields}=record;const request={action,operation,commandId,record:fields};
    const result=previewEnabled?await fetchAdminJson('/__local-lifecycle',{method:'POST',headers:{'content-type':'application/json','x-sf-local-records':'1'},body:JSON.stringify(request)}):await callAdmin(request,true);
    setCoreWorkspace(result.workspace);
    if(previewEnabled){try{sessionStorage.setItem('sf-sauna-core-records-preview-v1',JSON.stringify(result.workspace));}catch{toast.warning('Saved in the local database, but this tab could not cache the updated inventory.',{id:'inventory-cache-warning'});}}
  };
  const refreshInventoryWorkspace=async()=>{
    if(previewEnabled){const copy=await fetchAdminJson('/__local-records',{headers:{'x-sf-local-records':'1'},cache:'no-store'});setCoreWorkspace(copy);try{sessionStorage.setItem('sf-sauna-core-records-preview-v1',JSON.stringify(copy));}catch{toast.warning('Inventory refreshed, but this tab could not cache it.',{id:'inventory-cache-warning'});}return;}
    const [core,rows]=await Promise.all([callAdmin({action:'core_workspace'},true),callAdmin({action:'list_inventory'},true)]);
    setCoreWorkspace(core.workspace);setInventory(rows.inventory||[]);
  };

  const refreshAfterSync=useCallback(async()=>{
    if(!previewEnabled){await loadAll();return;}
    const response=await fetch('/__local-records',{headers:{'x-sf-local-records':'1'},cache:'no-store'});
    if(!response.ok)throw Error('Could not refresh the local copy');
    const copy=await response.json();setCoreWorkspace(copy);sessionStorage.setItem('sf-sauna-core-records-preview-v1',JSON.stringify(copy));
  },[loadAll]);

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

  // Ids already used in other rows for each side, to prevent picking twice.
  const currentAssignedIds = useMemo(() => new Set(inventory.map((r) => r.current_customer_id).filter(Boolean) as string[]), [inventory]);
  const futureAssignedIds = useMemo(() => new Set(inventory.map((r) => r.future_customer_id).filter(Boolean) as string[]), [inventory]);

  const fleetWorkspace=coreWorkspace?{...coreWorkspace,legacyInventory:previewEnabled?coreWorkspace.legacyInventory:inventory.map(row=>({...row}))}:null;
  const inventoryLife = (r: InventoryRow) => saunaLifecycle({...coreWorkspace?.assets.find(a=>a.id===r.id),sourceStatus:r.status});
  const bookingAvailability=(r:InventoryRow)=>inventoryAvailability({status:r.status,currentCustomer:!!r.current_customer_id,reserved:!!r.future_customer_id,condition:r.condition_state||inventoryLife(r).condition,retired:inventoryLife(r).fleet==='Retired',inboundOn:r.incoming_eta,availableOn:r.available_date});
  const rowValues = (r: InventoryRow): Record<ColKey, string> => ({
    id: r.unit_code || "",
    location: ELIG_LABEL[r.indoor_outdoor_eligibility],
    style: styleFor(r),
    model: r.model || "",
    fleet: inventoryLife(r).fleet,
    custody: inventoryLife(r).custody,
    condition: conditionLabel(inventoryLife(r).condition),
    booking_availability: bookingAvailability(r).label,
    customer: r.current_customer || "",
    future_customer: r.future_customer || "",
    install: r.install_date || "",
    committed: r.minimum_term_ends || "",
    available: r.available_date || "",
    monthly: r.monthly_price == null ? "" : String(r.monthly_price),
    notes: r.admin_notes || "",
    updated: r.updated_at,
  });

  const filtered = useMemo(() => {
    const active = (Object.entries(colFilters) as [ColKey, string][]).filter(([, v]) => v !== "");
    const rows = inventory.filter((r) => {
      if (!active.length) return true;
      const vals = rowValues(r);
      return active.every(([k, v]) => k==='booking_availability'?bookingAvailability(r).kind===v:['fleet','custody','condition'].includes(k)?vals[k]===v:vals[k].toLowerCase().includes(v.toLowerCase()));
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
  }, [inventory, colFilters, sortCol, sortDir,coreWorkspace]);

  // Inline cell save. Optimistically update local state then send patch.
  const updateCell = async (id: string, key: keyof InventoryRow, value: string | null) => {
    if (["current_customer_id", "install_date"].includes(key) || key === "status" && ["Installed", "Sold"].includes(value || "")) { toast.info("Use Rentals → Manage to record an installation, return, swap or sale with its history."); setTab("rentals"); return; }
    setInventory((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const next = { ...r, [key]: value } as InventoryRow;
      // Mirror customer id -> name locally so the display stays in sync.
      if (key === "current_customer_id") {
        next.current_customer = value ? (customers.find((c) => c.id === value)?.name ?? null) : null;
      } else if (key === "future_customer_id") {
        next.future_customer = value ? (customers.find((c) => c.id === value)?.name ?? null) : null;
      }
      return next;
    }));
    try {
      await callAdmin({ action: "update_inventory", id, patch: { [key]: value } });
      if (key === "current_customer_id" || key === "future_customer_id") await loadAll();
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
    const nextStyle = which === "style" ? (value as StyleValue) : styleFor(row);
    const patch = {
      indoor_outdoor_eligibility: nextElig,
      locations: locationsFor(nextElig),
      style: nextStyle.toLowerCase() as "traditional" | "infrared",
      model_key: modelKeyFor(row.model),
      sauna_type_id: saunaTypeIdFor(nextStyle, nextElig, row.model),
    };
    setInventory((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...patch } : r)));
    try {
      await callAdmin({ action: "update_inventory", id: row.id, patch });
    } catch (e) {
      toast.error((e as Error).message || "Save failed");
      await loadAll();
    }
  };

  const updateModel = async (row: InventoryRow, nextModel: string | null) => {
    const style = styleFor(row);
    const patch = {
      model: nextModel,
      model_key: modelKeyFor(nextModel),
      style: style.toLowerCase() as "traditional" | "infrared",
      locations: locationsFor(row.indoor_outdoor_eligibility),
      sauna_type_id: saunaTypeIdFor(style, row.indoor_outdoor_eligibility, nextModel),
    };
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
            <h1 className="text-3xl font-semibold text-foreground">Admin</h1>
            <div className="flex gap-2">
              {tab !== "insights" && !["customers", "rentals"].includes(tab) && <>
              <Button onClick={startDraft} disabled={previewEnabled || !!draft}>Add sauna</Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={previewEnabled || importing}>
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
              </>}
              <Button variant="outline" size="sm" onClick={logout}>Sign out</Button>
            </div>
          </div>

          <div className="mb-4 flex w-fit max-w-full overflow-x-auto rounded-md border border-border bg-card p-0.5">
            {(previewEnabled || coreWorkspace) && <><Button variant={tab === "customers" ? "default" : "ghost"} size="sm" onClick={() => setTab("customers")}>Customers</Button><Button variant={tab === "rentals" ? "default" : "ghost"} size="sm" onClick={() => setTab("rentals")}>Rentals</Button></>}
            {<Button variant={tab === "insights" ? "default" : "ghost"} size="sm" onClick={() => setTab("insights")}>Customer insights</Button>}
            <Button variant={tab === "dashboard" ? "default" : "ghost"} size="sm" onClick={() => setTab("dashboard")}>Dashboard</Button>
            <button
              type="button"
              className={`px-3 py-1.5 text-sm rounded ${tab === "inventory" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              onClick={() => setTab("inventory")}
            >Inventory</button>
            <button
              type="button"
              className={`px-3 py-1.5 text-sm rounded ${tab === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              onClick={() => setTab("calendar")}
            >Calendar</button>
            <button
              type="button"
              className={`px-3 py-1.5 text-sm rounded ${tab === "reservations" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              onClick={() => setTab("reservations")}
            >Bookings</button>
            <button
              type="button"
              className={`px-3 py-1.5 text-sm rounded ${tab === "waitlist" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              onClick={() => setTab("waitlist")}
            >Waitlist</button>
            <button
              type="button"
              className={`px-3 py-1.5 text-sm rounded ${tab === "agreements" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              onClick={() => setTab("agreements")}
            >Agreements</button>
          </div>

          {loading && <p className="text-muted-foreground">Loading…</p>}

          {!["insights", "customers", "rentals"].includes(tab) && !previewEnabled && <StripeStatusCard callAdmin={callAdmin} />}

          {coreWorkspace && tab==='customers' && <XeroSyncPanel password={password} onSynced={refreshAfterSync} onReview={setSyncReview}/>}
          {coreWorkspace && syncReview && <XeroCustomerHistory state={coreWorkspace} customerId={syncReview.customerId||null} initialContactId={syncReview.contactId} initialView="payments" onClose={()=>setSyncReview(null)} onRead={previewEnabled?undefined:selection=>callAdmin({action:'xero_customer_history',...selection})} onLifecycle={async(operation,record)=>{const {commandId,...fields}=record;const request={action:'lifecycle_command',operation,commandId,record:fields};if(previewEnabled){const r=await fetch('/__local-lifecycle',{method:'POST',headers:{'content-type':'application/json','x-sf-local-records':'1'},body:JSON.stringify(request)});if(!r.ok)throw Error('Could not save local classification');}else await callAdmin(request);await refreshAfterSync();}}/>}
          {coreWorkspace && (tab === "customers" || tab === "rentals" || (previewEnabled && tab === "inventory")) && <CoreRecordsPanel tab={tab} state={coreWorkspace} onChange={setCoreWorkspace} onTab={setTab} onReadHistory={previewEnabled ? undefined : async selection => callAdmin({action:"xero_customer_history",...selection})} onLifecycle={previewEnabled&&!import.meta.env.DEV?undefined:async (operation,record)=>{
            const {commandId,...fields}=record;
            const request={action:'lifecycle_command',operation,commandId,record:fields};
            const result=previewEnabled?await fetchAdminJson('/__local-lifecycle',{method:'POST',headers:{'content-type':'application/json','x-sf-local-records':'1'},body:JSON.stringify(request)}):await callAdmin(request);
            setCoreWorkspace(result.workspace);
            if(previewEnabled)sessionStorage.setItem('sf-sauna-core-records-preview-v1',JSON.stringify(result.workspace));
            else void loadAll();
          }} onOpenAgreement={async id=>{
            const agreement=coreWorkspace.lifecycle?.agreements.find(a=>a.id===id);
            if(previewEnabled){const doc=coreWorkspace.lifecycle?.documents.find(d=>d.id===agreement?.document_id);const url=doc?.local_url||agreement?.local_url;if(!url)throw new Error('No local PDF copy is available for this agreement.');window.open(url,'_blank','noopener,noreferrer');return;}
            const result=await callAdmin({action:'lifecycle_document_url',agreementId:id});window.open(result.url,'_blank','noopener,noreferrer');
          }} onRefresh={async()=>{const copy=previewEnabled?await fetchAdminJson('/__local-records',{headers:{'x-sf-local-records':'1'},cache:'no-store'}):(await callAdmin({action:'core_workspace'})).workspace;setCoreWorkspace(copy);if(previewEnabled)sessionStorage.setItem('sf-sauna-core-records-preview-v1',JSON.stringify(copy));}} onUpload={async(file,commandId,incomplete)=>{
            if(file.size>20*1024*1024)throw new Error('Choose a PDF up to 20 MB.');
            const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
            const request={action:'lifecycle_document_upload',base64:btoa(binary),filename:file.name,commandId,incomplete};
            const result=previewEnabled?await fetch('/__local-lifecycle',{method:'POST',headers:{'content-type':'application/json','x-sf-local-records':'1'},body:JSON.stringify(request)}).then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body.error||'Upload failed');return body;}):await callAdmin(request);return result.documentId;
          }} onCommand={previewEnabled ? undefined : async (command, record) => {
            const result = await callAdmin({ action: "core_command", command, record });
            setCoreWorkspace(result.workspace);
          }} />}

          {tab === "insights" && <CustomerInsights password={password} state={coreWorkspace} onReadSources={previewEnabled ? undefined : readLtvSources} />}

          {tab === "dashboard" && (previewEnabled ? <p role="status">Waiting for data</p> : <RevenueDashboard inventory={inventory} />)}

          {tab === "reservations" && coreWorkspace && <>
            <BookingsPanel state={coreWorkspace} onRentals={()=>setTab('rentals')} onRefresh={async()=>{if(!previewEnabled){await loadAll();return;}const r=await fetch('/__local-records',{headers:{'x-sf-local-records':'1'},cache:'no-store'});if(!r.ok)throw Error('Could not refresh local bookings');const copy=await r.json();setCoreWorkspace(copy);sessionStorage.setItem('sf-sauna-core-records-preview-v1',JSON.stringify(copy));}} onCommand={async(operation,record)=>{
              const {commandId,...fields}=record;const request={action:'booking_command',operation,commandId,record:fields};
              const result=previewEnabled?await fetch('/__local-lifecycle',{method:'POST',headers:{'content-type':'application/json','x-sf-local-records':'1'},body:JSON.stringify(request)}).then(async r=>{const body=await r.json();if(!r.ok)throw Error(body.error||'Local booking operation failed');return body;}):await callAdmin(request);
              setCoreWorkspace(result.workspace);if(previewEnabled)sessionStorage.setItem('sf-sauna-core-records-preview-v1',JSON.stringify(result.workspace));else await loadAll();
            }} onCreate={async(operation,record)=>{
              const {commandId,...fields}=record;const request={action:'lifecycle_command',operation,commandId,record:fields};
              const result=previewEnabled?await fetch('/__local-lifecycle',{method:'POST',headers:{'content-type':'application/json','x-sf-local-records':'1'},body:JSON.stringify(request)}).then(async r=>{const body=await r.json();if(!r.ok)throw Error(body.error||'Local booking creation failed');return body;}):await callAdmin(request);
              setCoreWorkspace(result.workspace);if(previewEnabled)sessionStorage.setItem('sf-sauna-core-records-preview-v1',JSON.stringify(result.workspace));else await loadAll();
            }}/>
            {!previewEnabled&&<details className="mt-5"><summary className="cursor-pointer text-sm text-muted-foreground">Booking links & payment tools</summary><div className="mt-3"><ReservationsListPanel callAdmin={callAdmin}/></div></details>}
          </>}

          {tab === "waitlist" && (
            <WaitlistPanel callAdmin={callAdmin} />
          )}

          {tab === "agreements" && (
            <AgreementVersionsPanel callAdmin={callAdmin} />
          )}

          {tab === "calendar" && (
            <CalendarView
              inventory={inventory}
              types={types}
              month={calMonth}
              onPrev={() => setCalMonth((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))}
              onNext={() => setCalMonth((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))}
              onToday={() => { const d = new Date(); setCalMonth({ y: d.getFullYear(), m: d.getMonth() }); }}
            />
          )}

          {tab === 'inventory' && coreWorkspace && <Dialog open={!!fleetEditor} onOpenChange={open=>{if(!open&&!bulkBusy)setFleetEditor(null);}}><DialogContent className="max-w-3xl max-h-[90vh] overflow-auto" onInteractOutside={e=>{if(bulkBusy)e.preventDefault();}} onEscapeKeyDown={e=>{if(bulkBusy)e.preventDefault();}}><DialogHeader><DialogTitle>Sauna location & availability</DialogTitle></DialogHeader>{fleetEditor&&<SaunaConditionPanel key={fleetEditor} inline onClose={()=>setFleetEditor(null)} initialTargets={[fleetEditor]} initialAction="incoming" state={fleetWorkspace!} onBusyChange={setBulkBusy} onRefresh={refreshInventoryWorkspace} onAssetState={(operation,record)=>inventoryStateCommand('lifecycle_command',operation,record)} onCommand={(operation,record)=>inventoryStateCommand('booking_command',operation,record)}/>}</DialogContent></Dialog>}
          {tab === "inventory" && coreWorkspace && <SaunaConditionPanel state={fleetWorkspace!} selectedIds={[...selectedIds]} onBusyChange={setBulkBusy} onSelectionChange={ids=>setSelectedIds(new Set(ids))} onRefresh={refreshInventoryWorkspace} onAssetState={(operation,record)=>inventoryStateCommand('lifecycle_command',operation,record)} onCommand={(operation,record)=>inventoryStateCommand('booking_command',operation,record)}/>}

          {tab === "inventory" && (
            <>
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

          {selectedIds.size > 0 && (
            <div className="mb-3 p-2 rounded-md border border-primary bg-primary/5 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{selectedIds.size} selected</span>
              <span className="text-xs text-muted-foreground">Use Bookings for reservations and Rentals for physical movements.</span>
              <Button size="sm" variant="destructive" className="h-7 text-xs px-2" disabled={bulkBusy||previewEnabled} onClick={bulkDelete}>Delete</Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs px-2 ml-auto" disabled={bulkBusy} onClick={clearSelection}>Clear</Button>
            </div>
          )}

          <section className="mb-10">
            <div className="space-y-3">
                <div className="max-h-[calc(100vh-12rem)] overflow-auto border border-border rounded-md bg-card">
                  <table aria-label="Sauna inventory" className="text-xs border-collapse" style={{ tableLayout: "fixed", width: invTotalWidth + 32, minWidth: "100%" }}>
                    <colgroup>
                      <col style={{ width: 32 }} />
                      {INVENTORY_COLS.map(([k]) => (
                        <col key={k} style={{ width: invWidths[k] }} />
                      ))}
                      <col style={{ width: invWidths["actions"] }} />
                    </colgroup>
                    <thead className="sticky top-0 z-10 bg-muted text-[10px] uppercase tracking-wide text-muted-foreground shadow-[0_1px_0_0_hsl(var(--border))]">
                      <tr>
                        <th className="px-2 py-1.5 border-r border-border w-8">
                          <input
                            type="checkbox"
                            disabled={bulkBusy||(previewEnabled&&!import.meta.env.DEV)}
                            aria-label="Select all"
                            checked={filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id))}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds(new Set(filtered.map((r) => r.id)));
                              else clearSelection();
                            }}
                          />
                        </th>
                        {INVENTORY_COLS.map(([k, label]) => (
                          <th key={k} aria-sort={sortCol===k?(sortDir==='asc'?'ascending':'descending'):'none'} className="relative text-left px-2 py-1.5 border-r border-border select-none">
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
                            <ColResizeHandle onMouseDown={(e) => startInvResize(k, e)} />
                          </th>
                        ))}
                        <th className="relative text-left px-2 py-1.5">
                          <ColResizeHandle onMouseDown={(e) => startInvResize("actions", e)} />
                        </th>
                      </tr>
                      <tr className="border-t border-border bg-muted/30">
                        <th className="px-2 py-1 border-r border-border"></th>
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
                        {(['fleet','custody','condition','booking_availability'] as const).map(key=><th key={key} className="px-1 py-1 border-r border-border">
                          <select aria-label={`Filter ${key==='custody'?'location':key==='booking_availability'?'booking availability':key}`} className="w-full h-6 px-1 text-xs bg-background border border-border rounded-sm outline-none" value={colFilters[key]} onChange={e=>setColFilter(key,e.target.value)}>
                            <option value="">All</option>
                            {(key==='booking_availability'?['Available now','Unavailable','Available on']:[...new Set(inventory.map(r=>rowValues(r)[key]))].sort()).map(value=><option key={value} value={value}>{value}</option>)}
                          </select>
                        </th>)}
                        <th className="px-1 py-1 border-r border-border">
                          <input className="w-full h-6 px-1.5 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" placeholder="Filter…" value={colFilters.customer} onChange={(e) => setColFilter("customer", e.target.value)} />
                        </th>
                        <th className="px-1 py-1 border-r border-border">
                          <input className="w-full h-6 px-1.5 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" placeholder="Filter…" value={colFilters.future_customer} onChange={(e) => setColFilter("future_customer", e.target.value)} />
                        </th>
                        <th className="px-1 py-1 border-r border-border">
                          <input className="w-full h-6 px-1.5 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" placeholder="YYYY-MM" value={colFilters.install} onChange={(e) => setColFilter("install", e.target.value)} />
                        </th>
                        <th className="px-1 py-1 border-r border-border">
                          <input className="w-full h-6 px-1.5 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" placeholder="YYYY-MM" value={colFilters.committed} onChange={(e) => setColFilter("committed", e.target.value)} />
                        </th>
                        <th className="px-1 py-1 border-r border-border">
                          <input className="w-full h-6 px-1.5 text-xs bg-background border border-border rounded-sm outline-none focus:border-primary" placeholder="Filter…" value={colFilters.monthly} onChange={(e) => setColFilter("monthly", e.target.value)} />
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
                            <td className="px-2 py-1 border-r border-border"></td>
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
                                <SelectContent>{["Available","Maintenance","Incoming"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                            <td className="px-2 py-1 border-r border-border"><SaunaStateBadge value={saunaLifecycle({sourceStatus:draft.status}).custody}/>{draft.status==='Incoming'&&<Input aria-label="New sauna inbound date" type="date" className="mt-1 h-7 text-xs" value={draft.incoming_eta} onChange={e=>setD('incoming_eta',e.target.value)}/>}</td>
                            <td className="px-2 py-1 border-r border-border"><SaunaStateBadge value="Not recorded"/></td>
                            <td className="px-2 py-1 border-r border-border">{draft.status==='Incoming'?<Input aria-label="New sauna booking available on" type="date" className="h-7 text-xs" value={draft.available_date} onChange={e=>setD('available_date',e.target.value)}/>:<SaunaStateBadge value={draft.status==='Available'?'Available now':'Unavailable'}/>}</td>
                            <td className="px-1 py-1 border-r border-border">
                              <CustomerPickerCell
                                readOnly
                                value={draft.current_customer_id}
                                customers={customers}
                                disabledIds={currentAssignedIds}
                                placeholder=""
                                onChange={(id) => setD("current_customer_id", id)}
                              />
                            </td>
                            <td className="px-1 py-1 border-r border-border">
                              <CustomerPickerCell
                                readOnly
                                value={draft.future_customer_id}
                                customers={customers}
                                disabledIds={futureAssignedIds}
                                placeholder=""
                                onChange={(id) => setD("future_customer_id", id)}
                              />
                            </td>
                            <td className="px-1 py-1 border-r border-border">
                              <Input type="date" className={`h-7 text-xs ${draftErrorField === "install_date" ? "border-destructive" : ""}`} value={draft.install_date} onChange={(e) => setD("install_date", e.target.value)} />
                            </td>
                            <td className="px-1 py-1 border-r border-border text-muted-foreground">—</td>
                            <td className="px-1 py-1 border-r border-border text-muted-foreground">—</td>
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
                              <td colSpan={INVENTORY_COLS.length + 2} className="px-3 py-2 text-xs text-destructive">
                                {draftErrorField ? <><strong className="capitalize">{draftErrorField.replace(/_/g, " ")}:</strong> {draftError}</> : draftError}
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                      {filtered.length === 0 && !draft && (
                        <tr><td colSpan={INVENTORY_COLS.length + 2} className="px-3 py-6 text-center text-muted-foreground">No saunas match.</td></tr>
                      )}
                      {filtered.map((r) => (
                        <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                          <td className="px-2 py-0.5 border-r border-border">
                            <input
                              type="checkbox"
                              disabled={bulkBusy||(previewEnabled&&!import.meta.env.DEV)}
                              aria-label={`Select ${r.unit_code || r.id}`}
                              checked={selectedIds.has(r.id)}
                              onChange={() => toggleSelect(r.id)}
                            />
                          </td>
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
                              value={styleFor(r)}
                              options={STYLES.map((s) => ({ value: s, label: s }))}
                              onSave={(v) => updateLocationOrStyle(r, "style", v as StyleValue)}
                            />
                          </td>
                          <td className="px-1 py-0.5 border-r border-border">
                            <SelectCell
                              value={r.model || ""}
                              options={[{ value: "", label: "—" }, ...MODELS.map((m) => ({ value: m, label: m }))]}
                              onSave={(v) => updateModel(r, v || null)}
                            />
                          </td>
                          {(['fleet','custody','condition','booking_availability'] as const).map(key=><td key={key} className="px-2 py-1.5 border-r border-border align-top"><span title={key==='booking_availability'?'Reserved and customer-held units are unavailable. Incoming booking dates must follow inbound arrival.':undefined}>{key==='fleet'?<div><button type="button" aria-label={`Edit fleet for sauna ${r.unit_code}`} title="Edit fleet status" className="rounded-md text-left hover:ring-2 hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-default" disabled={bulkBusy||!coreWorkspace||!fleetEditable({...coreWorkspace?.assets.find(a=>a.id===r.id),sourceStatus:r.status},!!r.current_customer_id)} onClick={()=>setFleetEditor(r.id)}><SaunaStateBadge value={rowValues(r)[key]}/><span className="ml-1 text-primary" aria-hidden="true">✎</span></button>{r.status==='Incoming'&&incomingBookingConflicts(coreWorkspace?.bookings||[],[r.id],String(r.available_date&&r.incoming_eta&&r.available_date>r.incoming_eta?r.available_date:r.incoming_eta||'')).length>0&&<button type="button" className="mt-1 block text-left text-[10px] font-medium text-amber-800 underline" onClick={()=>setTab('reservations')}>Install date needs review</button>}</div>:key==='custody'&&r.status==='Incoming'?<button type="button" aria-label={`Edit inbound date for sauna ${r.unit_code}`} disabled={bulkBusy} className="text-left" onClick={()=>setFleetEditor(r.id)}><SaunaStateBadge value="Inbound"/><span className="mt-1 block text-xs text-primary underline">{r.incoming_eta||'Set inbound date'} ✎</span></button>:key==='booking_availability'?<button type="button" title={bookingAvailability(r).reason} aria-label={`Edit booking availability for sauna ${r.unit_code}`} disabled={bulkBusy||r.status!=='Incoming'||!coreWorkspace} className="text-left disabled:cursor-default" onClick={()=>setFleetEditor(r.id)}><SaunaStateBadge value={bookingAvailability(r).label}/>{r.status==='Incoming'&&<span className="ml-1 text-primary" aria-hidden="true">✎</span>}</button>:<SaunaStateBadge value={rowValues(r)[key]}/>}</span></td>)}
                          <td className="px-1 py-0.5 border-r border-border">
                            <CustomerPickerCell
                                readOnly
                              value={r.current_customer_id}
                              customers={customers}
                              disabledIds={new Set([...currentAssignedIds].filter((id) => id !== r.current_customer_id))}
                              onChange={(id) => updateCell(r.id, "current_customer_id", id)}
                            />
                          </td>
                          <td className="px-1 py-0.5 border-r border-border">
                            <CustomerPickerCell
                                readOnly
                              value={r.future_customer_id}
                              customers={customers}
                              disabledIds={new Set([...futureAssignedIds].filter((id) => id !== r.future_customer_id))}
                              onChange={(id) => updateCell(r.id, "future_customer_id", id)}
                            />
                          </td>
                          <td className="px-1 py-0.5 border-r border-border">
                            <span className="px-1 text-xs">{r.install_date||"—"}</span>
                          </td>
                          <td className="px-1 py-0.5 border-r border-border">
                            <span className="px-1 text-xs">{r.minimum_term_ends||"—"}</span>
                          </td>
                          <td className="px-2 py-1 border-r border-border tabular-nums whitespace-nowrap">{r.monthly_price == null ? "—" : r.monthly_price.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}</td>
                          <td className="px-1 py-0.5 border-r border-border">
                            <TextCell value={r.admin_notes || ""} onSave={(v) => updateCell(r.id, "admin_notes", v || null)} />
                          </td>
                          <td className="px-2 py-1 border-r border-border text-muted-foreground whitespace-nowrap">{new Date(r.updated_at).toLocaleDateString()}</td>
                          <td className="px-1 py-0.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={previewEnabled}
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
            </>
          )}
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
      readOnly={previewEnabled}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => { if (local !== ref.current) onSave(local); }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") { setLocal(ref.current); (e.target as HTMLInputElement).blur(); } }}
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
      disabled={previewEnabled}
      className={`w-full h-7 px-1.5 text-xs border border-transparent hover:border-border focus:border-primary rounded-sm outline-none ${capitalize ? "capitalize" : ""} ${badgeClass ? `font-medium ${badgeClass}` : "bg-transparent focus:bg-background"}`}
      value={value}
      onChange={(e) => onSave(e.target.value)}
    >
      {options.map((o) => <option key={o.value} value={o.value} className={o.className}>{o.label}</option>)}
    </select>
  );
};

export default AdminReservations;

// ---------- Calendar View ----------

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function isAvailableOn(row: InventoryRow, dayIso: string): boolean {
 const a=inventoryAvailability({status:row.status,currentCustomer:!!row.current_customer_id,reserved:!!row.future_customer_id,condition:row.condition_state||'unknown',retired:!!row.retired_on,inboundOn:row.incoming_eta,availableOn:row.available_date});
 return a.kind==='Available now'||(a.kind==='Available on'&&!!row.available_date&&row.available_date<=dayIso);
}

const CalendarView = ({
  inventory,
  types,
  month,
  onPrev,
  onNext,
  onToday,
}: {
  inventory: InventoryRow[];
  types: SaunaType[];
  month: { y: number; m: number };
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) => {
  const { y, m } = month;
  const firstDay = new Date(y, m, 1);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startWeekday = firstDay.getDay(); // 0=Sun
  const todayIso = isoDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const monthLabel = firstDay.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const typesToShow = types.length ? types : Array.from(new Set(inventory.map((r) => r.sauna_type_id))).map((id) => ({ id, name: id, sort_order: 0 }));

  const shortName = (n: string) => n.replace(/\s*sauna\s*/i, "").trim();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPrev}>‹</Button>
          <Button variant="outline" size="sm" onClick={onToday}>Today</Button>
          <Button variant="outline" size="sm" onClick={onNext}>›</Button>
          <h2 className="text-lg font-semibold ml-2">{monthLabel}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-green-500" /> Installation</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-red-500" /> Returning</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> Incoming</span>
        </div>
      </div>

      <div className="border border-border rounded-md bg-card overflow-hidden">
        <div className="grid grid-cols-7 bg-muted/60 text-[10px] uppercase tracking-wide text-muted-foreground">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} className="px-2 py-1.5 border-r border-border last:border-r-0">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={i} className="min-h-[110px] border-r border-b border-border bg-muted/20 last:border-r-0" />;
            }
            const dayIso = isoDate(y, m, day);
            const installs = inventory.filter((r) => r.install_date === dayIso);
            const returning = inventory.filter((r) => r.status === "Returning" && r.available_date === dayIso);
            const incoming = inventory.filter((r) => r.status === "Incoming" && r.available_date === dayIso);
            const isToday = dayIso === todayIso;
            return (
              <div
                key={i}
                className={`min-h-[110px] p-1.5 border-r border-b border-border last:border-r-0 ${isToday ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-foreground"}`}>{day}</span>
                  <div className="flex gap-0.5">
                    {installs.length > 0 && <span title={`${installs.length} installation${installs.length===1?"":"s"}`} className="inline-block w-2 h-2 rounded-full bg-green-500" />}
                    {returning.length > 0 && <span title={`${returning.length} returning`} className="inline-block w-2 h-2 rounded-full bg-red-500" />}
                    {incoming.length > 0 && <span title={`${incoming.length} incoming`} className="inline-block w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                </div>
                <div className="space-y-0.5">
                  {typesToShow.map((t) => {
                    const count = inventory.filter((r) => r.sauna_type_id === t.id && isAvailableOn(r, dayIso)).length;
                    if (count === 0) return null;
                    return (
                      <div key={t.id} className="text-[10px] leading-tight text-muted-foreground flex justify-between gap-1">
                        <span className="truncate">{shortName(t.name)}</span>
                        <span className="font-medium text-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
