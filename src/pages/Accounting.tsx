import type { BillingRow } from "@/lib/billingHistory";
import BillingHistory from "@/components/BillingHistory";
import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSEO } from "@/hooks/useSEO";

const PASSWORD_STORAGE_KEY = "sf-sauna-accounting-pw";

interface CurrentCustomerRow {
  reservation_id: string | null;
  name: string | null;
  unit_code: string | null;
  status: string | null;
  style: string | null;
  model: string | null;
  install_date: string | null;
  monthly_price: number | null;
  admin_notes: string | null;
}

const money = (v: number | null | undefined) =>
  v == null ? "—" : v === 0 ? "$0" : `$${Number(v).toLocaleString("en-US")}`;

const prettyDate = (d: string | null) => {
  if (!d) return "—";
  const parsed = new Date(`${d}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const prettyStyle = (s: string | null) => {
  if (!s) return "—";
  return s === "infrared" ? "Infrared" : s === "traditional" ? "Traditional" : s;
};

const Accounting = () => {
  useSEO({
    title: "Accounting | SF Sauna",
    description: "Internal accounting overview.",
    noindex: true,
  });

  const [pwInput, setPwInput] = useState("");
  const [password, setPassword] = useState<string>(
    () => sessionStorage.getItem(PASSWORD_STORAGE_KEY) || "",
  );
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [currentRows, setCurrentRows] = useState<CurrentCustomerRow[]>([]);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<"billing" | "current">("billing");

  const call = useCallback(
    async (body: Record<string, unknown>) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/accounting-api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-accounting-password": password,
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

  useEffect(() => {
    if (!password) return;
    (async () => {
      setLoading(true);
      let loggedIn = false;
      setLoadError("");
      try {
        await call({ action: "login" });
        loggedIn = true;
        setAuthed(true);
        sessionStorage.setItem(PASSWORD_STORAGE_KEY, password);
        const [data, cur] = await Promise.all([
          call({ action: "list_accounting" }),
          call({ action: "list_current_customers" }),
        ]);
        let billingRows = data.rows || [];
        if (import.meta.env.DEV) {
          try {
            const copy = await fetch('/__local-records', {headers:{'x-sf-local-records':'1'}});
            if (copy.ok) { const snapshot = await copy.json(); if (Array.isArray(snapshot.billingRows)) billingRows = snapshot.billingRows; }
          } catch { /* A private copied history is optional; preview stays empty by default. */ }
        }
        setRows(billingRows);
        setCurrentRows(cur.rows || []);
      } catch (e) {
        setLoadError(loggedIn ? "Could not load billing history. Please retry." : "Incorrect password or accounting is unavailable.");
        if (!loggedIn) {
        sessionStorage.removeItem(PASSWORD_STORAGE_KEY);
        setPassword("");
        setAuthed(false);
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  const activeBaseRent = useMemo(() => rows.filter(r => r.status === 'Current' && !r.is_sale).reduce((sum,r) => sum + (r.monthly_price ?? 0),0),[rows]);

  const openAgreement = async (id: string) => {
    // Open synchronously so browsers don't block the document after the private URL request.
    const opened = window.open('about:blank', '_blank');
    if (opened) opened.opener = null;
    try {
      const data = await call({action:'history_agreement_url',agreement_id:id});
      const url = new URL(data.url);
      if (url.protocol !== 'https:' || url.origin !== new URL(import.meta.env.VITE_SUPABASE_URL).origin) throw new Error('Unexpected document URL');
      if (opened) opened.location.href = url.href;
      else throw new Error('Allow pop-ups to view the agreement.');
    } catch (e) { opened?.close(); throw e; }
  };

  const currentTotal = useMemo(
    () => currentRows.reduce((sum, r) => sum + (r.monthly_price ?? 0), 0),
    [currentRows],
  );

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <Card className="w-full max-w-sm">
            <CardHeader><CardTitle>Accounting login</CardTitle></CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPassword(pwInput);
                }}
                className="space-y-3"
              >
                <div>
                  <Label htmlFor="pw">Password</Label>
                  <Input id="pw" type="password" value={pwInput} onChange={(e) => setPwInput(e.target.value)} autoFocus />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>Sign in</Button>
                {loadError && <p role="alert" className="text-sm text-destructive">{loadError}</p>}
              </form>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const tabBtn = (active: boolean) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-3 max-w-[1600px]">
          <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
            <h1 className="text-3xl font-semibold text-foreground">Accounting</h1>
            <div className="text-sm text-muted-foreground">
              {tab === "billing"
                ? `${money(activeBaseRent)}/mo recorded current base rent`
                : `${currentRows.length} saunas · ${money(currentTotal)}/mo`}
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button className={tabBtn(tab === "billing")} onClick={() => setTab("billing")}>
              Billing
            </button>
            <button className={tabBtn(tab === "current")} onClick={() => setTab("current")}>
              Current customers
            </button>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : tab === "billing" ? (
            <>{loadError && <div role="alert" className="mb-4 text-destructive">{loadError} <Button variant="outline" onClick={()=>window.location.reload()}>Retry</Button></div>}<BillingHistory rows={rows} onAgreement={openAgreement}/></>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Customer</th>
                    <th className="px-3 py-2 font-medium">Sauna #</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Style</th>
                    <th className="px-3 py-2 font-medium">Model</th>
                    <th className="px-3 py-2 font-medium">Install date</th>
                    <th className="px-3 py-2 font-medium">$/mo</th>
                    <th className="px-3 py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((r) => (
                    <tr key={r.unit_code ?? r.reservation_id ?? "unknown"} className="border-t border-border align-top">
                      <td className="px-3 py-2 font-medium text-foreground">{r.name || "—"}</td>
                      <td className="px-3 py-2">{r.unit_code ?? "—"}</td>
                      <td className="px-3 py-2">{r.status ?? "—"}</td>
                      <td className="px-3 py-2">{prettyStyle(r.style)}</td>
                      <td className="px-3 py-2">{r.model ?? "—"}</td>
                      <td className="px-3 py-2">{prettyDate(r.install_date)}</td>
                      <td className="px-3 py-2 font-medium tabular-nums">{money(r.monthly_price)}</td>
                      <td className="px-3 py-2 max-w-[360px] whitespace-pre-wrap text-muted-foreground">
                        {r.admin_notes || "—"}
                      </td>
                    </tr>
                  ))}
                  {currentRows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                        No saunas yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Accounting;
