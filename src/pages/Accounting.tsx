import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSEO } from "@/hooks/useSEO";

const PASSWORD_STORAGE_KEY = "sf-sauna-accounting-pw";

interface AccountingRow {
  reservation_id: string;
  name: string;
  unit_code: string | null;
  is_sale: boolean;
  commitment_months: number | null;
  monthly_price: number | null;
  security_deposit: number | null;
  delivery_fee: number | null;
  install_fee: number | null;
  insurance_selected: boolean;
  insurance_monthly_price: number;
  second_heater_selected: boolean;
  second_heater_monthly_price: number;
  stair_elevator_charge: number | null;
  reservation_deposit: number;
  payment_method: string;
}

interface CurrentCustomerRow {
  reservation_id: string;
  name: string;
  unit_code: string | null;
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
  const [rows, setRows] = useState<AccountingRow[]>([]);
  const [currentRows, setCurrentRows] = useState<CurrentCustomerRow[]>([]);
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
      try {
        await call({ action: "login" });
        setAuthed(true);
        sessionStorage.setItem(PASSWORD_STORAGE_KEY, password);
        const [data, cur] = await Promise.all([
          call({ action: "list_accounting" }),
          call({ action: "list_current_customers" }),
        ]);
        setRows(data.rows || []);
        setCurrentRows(cur.rows || []);
      } catch {
        sessionStorage.removeItem(PASSWORD_STORAGE_KEY);
        setPassword("");
        setAuthed(false);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  const totals = useMemo(() => {
    const monthly = rows.reduce(
      (sum, r) =>
        sum +
        (r.monthly_price ?? 0) +
        (r.insurance_selected ? r.insurance_monthly_price : 0) +
        (r.second_heater_selected ? r.second_heater_monthly_price : 0),
      0,
    );
    return { monthly };
  }, [rows]);

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
                <Button type="submit" className="w-full">Sign in</Button>
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
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-semibold text-foreground">Accounting</h1>
            <div className="text-sm text-muted-foreground">
              {tab === "billing"
                ? `${rows.length} customers · ${money(totals.monthly)}/mo recurring`
                : `${currentRows.length} current customers · ${money(currentTotal)}/mo`}
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
            <div className="overflow-x-auto border border-border rounded-lg bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Customer</th>
                    <th className="px-3 py-2 font-medium">Sauna #</th>
                    <th className="px-3 py-2 font-medium">Term</th>
                    <th className="px-3 py-2 font-medium">Monthly</th>
                    <th className="px-3 py-2 font-medium">Payment method</th>
                    <th className="px-3 py-2 font-medium">Security deposit</th>
                    <th className="px-3 py-2 font-medium">Reservation deposit</th>
                    <th className="px-3 py-2 font-medium">Installation</th>
                    <th className="px-3 py-2 font-medium">Delivery</th>
                    <th className="px-3 py-2 font-medium">Damage protection</th>
                    <th className="px-3 py-2 font-medium">Second heater</th>
                    <th className="px-3 py-2 font-medium">Stair / elevator</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.reservation_id} className="border-t border-border align-top">
                      <td className="px-3 py-2 font-medium text-foreground">{r.name}</td>
                      <td className="px-3 py-2">{r.unit_code ?? "—"}</td>
                      <td className="px-3 py-2">{r.is_sale ? "Sale" : r.commitment_months ? `${r.commitment_months} mo` : "—"}</td>
                      <td className="px-3 py-2 font-medium">{money(r.monthly_price)}</td>
                      <td className="px-3 py-2">{r.payment_method ?? "—"}</td>
                      <td className="px-3 py-2">{money(r.security_deposit)}</td>
                      <td className="px-3 py-2">{money(r.reservation_deposit)}</td>
                      <td className="px-3 py-2">{money(r.install_fee)}</td>
                      <td className="px-3 py-2">{money(r.delivery_fee)}</td>
                      <td className="px-3 py-2">
                        {r.insurance_selected ? `${money(r.insurance_monthly_price)}/mo` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {r.second_heater_selected ? `${money(r.second_heater_monthly_price)}/mo` : "—"}
                      </td>
                      <td className="px-3 py-2">{money(r.stair_elevator_charge)}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={12} className="px-3 py-8 text-center text-muted-foreground">
                        No customers yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Customer</th>
                    <th className="px-3 py-2 font-medium">Sauna #</th>
                    <th className="px-3 py-2 font-medium">Style</th>
                    <th className="px-3 py-2 font-medium">Model</th>
                    <th className="px-3 py-2 font-medium">Install date</th>
                    <th className="px-3 py-2 font-medium">$/mo</th>
                    <th className="px-3 py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((r) => (
                    <tr key={r.reservation_id} className="border-t border-border align-top">
                      <td className="px-3 py-2 font-medium text-foreground">{r.name}</td>
                      <td className="px-3 py-2">{r.unit_code ?? "—"}</td>
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
                      <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                        No current customers yet.
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
