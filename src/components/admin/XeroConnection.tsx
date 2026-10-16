import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { previewEnabled, services } from "@/lib/runtime";

interface Status {
  configured: boolean;
  storageReady: boolean;
  authorized: boolean;
  tenants: { id: string; name: string }[];
  selectedTenantId: string | null;
  redirectUri: string;
  scopes: string[];
}
interface Inspection {
  summaries: {
    resource: string;
    pageReturnedRecords: number;
    sampledRecords: number;
    fieldsPresent: string[];
  }[];
  inspectedAt: string;
  note: string;
}
export function XeroConnection({ password }: { password: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const call = useCallback(
    async (body: object) => {
      if (previewEnabled)
        throw new Error(
          "Preview cannot connect to production Xero. Backend setup is required.",
        );
      const response = await fetch(
        `${services.supabaseUrl}/functions/v1/xero-admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "x-admin-password": password,
          },
          body: JSON.stringify(body),
        },
      );
      if (!response.ok)
        throw new Error(
          response.status === 401
            ? "Admin authorization required."
            : "Xero backend setup is required or the connection is unavailable.",
        );
      return response.json();
    },
    [password],
  );
  const refresh = useCallback(async () => {
    setBusy(true);
    setMessage("");
    try {
      setStatus(await call({ action: "status" }));
    } catch (error) {
      setMessage((error as Error).message);
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }, [call]);
  useEffect(() => {
    if (!previewEnabled) void refresh();
  }, [refresh]);
  const connect = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await call({ action: "start" });
      const url = new URL(result.authorizationUrl);
      if (
        url.origin !== "https://login.xero.com" ||
        url.pathname !== "/identity/connect/authorize"
      )
        throw new Error("Invalid authorization destination");
      location.assign(url.toString());
    } catch {
      setMessage(
        "Could not start Xero authorization. Check backend configuration.",
      );
      setBusy(false);
    }
  };
  const selectTenant = async (id: string) => {
    setBusy(true);
    setMessage("");
    setInspection(null);
    try {
      await call({ action: "select_tenant", tenantId: id });
      await refresh();
    } catch {
      setMessage("Organization selection failed.");
    } finally {
      setBusy(false);
    }
  };
  const inspect = async () => {
    setBusy(true);
    setMessage("");
    setInspection(null);
    try {
      setInspection(await call({ action: "inspect" }));
    } catch {
      setMessage(
        "Read-only inspection failed. No customer history was imported.",
      );
    } finally {
      setBusy(false);
    }
  };
  const ready =
    !previewEnabled && !!status?.configured && !!status?.storageReady;
  return (
    <section
      aria-label="Xero connection"
      className="rounded-xl border bg-card p-5"
    >
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h3 className="font-semibold">Xero · read-only connection</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Authorize accounting reads. Connecting does not calculate metrics or
            import customer history.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refresh}
            disabled={previewEnabled || busy}
          >
            {busy ? "Checking…" : "Check connection"}
          </Button>
          <Button onClick={connect} disabled={!ready || busy}>
            {status?.authorized ? "Reconnect Xero" : "Connect Xero"}
          </Button>
        </div>
      </div>
      <p className="mt-4 text-sm" role="status">
        {previewEnabled
          ? "Backend setup required. Preview does not access production Xero."
          : message ||
            (!status
              ? "Checking connection…"
              : !ready
                ? "Backend setup required: credentials, private token storage and encryption key."
                : !status.authorized
                  ? "Waiting for Xero authorization."
                  : !status.selectedTenantId
                    ? "Select an authorized organization."
                    : "Organization authorized. History is waiting for data import.")}
      </p>
      {status && (
        <p className="mt-2 break-all text-xs text-muted-foreground">
          OAuth redirect URI: {status.redirectUri}
        </p>
      )}
      {ready && status?.authorized && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm">
            Organization
            <select
              aria-label="Xero organization"
              value={status.selectedTenantId ?? ""}
              disabled={busy}
              onChange={(e) => void selectTenant(e.target.value)}
              className="ml-3 rounded-md border bg-background p-2"
            >
              <option value="" disabled>
                Select organization
              </option>
              {status.tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="outline"
            disabled={busy || !status.selectedTenantId}
            onClick={inspect}
          >
            Inspect read-only sample
          </Button>
        </div>
      )}
      {inspection && (
        <div className="mt-4 overflow-x-auto">
          <p className="mb-2 text-xs text-muted-foreground">
            {inspection.note}
          </p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="p-2">Source</th>
                <th className="p-2">Records inspected</th>
                <th className="p-2">Fields present</th>
              </tr>
            </thead>
            <tbody>
              {inspection.summaries.map((row) => (
                <tr className="border-t" key={row.resource}>
                  <td className="p-2">{row.resource}</td>
                  <td className="p-2">{row.sampledRecords}</td>
                  <td className="p-2 text-xs">
                    {row.fieldsPresent.join(", ") || "No fields observed"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
