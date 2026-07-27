import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CustomerRow {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  install_address: string | null;
  city: string | null;
  reservation_id: string | null;
  created_at: string;
  reservation: {
    id: string;
    sauna_type_id: string;
    reservation_status: string;
    payment_status: string;
    preferred_install_at: string | null;
    sauna_inventory_id: string | null;
  } | null;
  sauna: {
    id: string;
    unit_code: string | null;
    sauna_type_id: string;
    status: string;
  } | null;
}

export function CustomersPanel({
  callAdmin,
}: {
  callAdmin: (action: string, payload?: Record<string, unknown>) => Promise<any>;
}) {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callAdmin("list_customers");
      setRows(res.customers ?? []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [callAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const hay = [r.name, r.email, r.phone, r.city, r.install_address]
      .filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const openReservation = (id: string) => {
    window.open(`/reservation/${id}`, "_blank");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Customers ({rows.length})</CardTitle>
        <div className="flex items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, city…"
            className="h-8 w-64"
          />
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Phone</th>
              <th className="py-2 pr-3">City</th>
              <th className="py-2 pr-3">Sauna</th>
              <th className="py-2 pr-3">Reservation</th>
              <th className="py-2 pr-3">Payment</th>
              <th className="py-2 pr-3">Created</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-border/60 align-top">
                <td className="py-2 pr-3 font-medium">{c.name}</td>
                <td className="py-2 pr-3">{c.email ?? "—"}</td>
                <td className="py-2 pr-3">{c.phone ?? "—"}</td>
                <td className="py-2 pr-3">{c.city ?? "—"}</td>
                <td className="py-2 pr-3">
                  {c.sauna
                    ? `${c.sauna.unit_code ?? c.sauna.sauna_type_id}`
                    : c.reservation?.sauna_type_id ?? "—"}
                </td>
                <td className="py-2 pr-3">{c.reservation?.reservation_status ?? "—"}</td>
                <td className="py-2 pr-3">{c.reservation?.payment_status ?? "—"}</td>
                <td className="py-2 pr-3 text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
                <td className="py-2 pr-3">
                  {c.reservation_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7"
                      onClick={() => openReservation(c.reservation_id!)}
                    >
                      Open
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {!filtered.length && !loading && (
              <tr>
                <td colSpan={9} className="py-6 text-center text-muted-foreground">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}