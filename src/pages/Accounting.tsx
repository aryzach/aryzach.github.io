import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";
import { Download } from "lucide-react";

const PASSWORD_STORAGE_KEY = "sf-sauna-accounting-pw";

interface AccountingRow {
  reservation_id: string;
  name: string;
  email: string | null;
  sauna_type: string | null;
  city: string | null;
  contract_status: string | null;
  contract_id: string | null;
  contract_downloadable: boolean;
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
}

const money = (v: number | null | undefined) =>
  v == null ? "—" : v === 0 ? "$0" : `$${Number(v).toLocaleString("en-US")}`;

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
        const data = await call({ action: "list_accounting" });
        setRows(data.rows || []);
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

  const download = async (row: AccountingRow) => {
    try {
      const { url } = await call({ action: "contract_download_url", contract_id: row.contract_id });
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast.error((e as Error).message || "Could not open contract");
    }
  };

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-3 max-w-[1600px]">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold text-foreground">Accounting</h1>
            <div className="text-sm text-muted-foreground">
              {rows.length} customers · {money(totals.monthly)}/mo recurring
            </div>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Customer</th>
                    <th className="px-3 py-2 font-medium">Sauna</th>
                    <th className="px-3 py-2 font-medium">Term</th>
                    <th className="px-3 py-2 font-medium">Monthly</th>
                    <th className="px-3 py-2 font-medium">Security deposit</th>
                    <th className="px-3 py-2 font-medium">Reservation deposit</th>
                    <th className="px-3 py-2 font-medium">Installation</th>
                    <th className="px-3 py-2 font-medium">Delivery</th>
                    <th className="px-3 py-2 font-medium">Damage protection</th>
                    <th className="px-3 py-2 font-medium">Second heater</th>
                    <th className="px-3 py-2 font-medium">Stair / elevator</th>
                    <th className="px-3 py-2 font-medium">Contract</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.reservation_id} className="border-t border-border align-top">
                      <td className="px-3 py-2">
                        <div className="font-medium text-foreground">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </td>
                      <td className="px-3 py-2">{r.sauna_type ?? "—"}</td>
                      <td className="px-3 py-2">{r.commitment_months ? `${r.commitment_months} mo` : "—"}</td>
                      <td className="px-3 py-2 font-medium">{money(r.monthly_price)}</td>
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
                      <td className="px-3 py-2">
                        {r.contract_downloadable ? (
                          <Button size="sm" variant="outline" onClick={() => download(r)}>
                            <Download className="h-3.5 w-3.5 mr-1" /> Download
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">{r.contract_status ?? "None"}</span>
                        )}
                      </td>
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
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Accounting;
