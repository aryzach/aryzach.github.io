import {
  database,
  callbackUri,
  appOrigin,
  encryptionSecret,
  activeToken,
} from "../_shared/server.ts";
import {
  authorizationUrl,
  randomSecret,
  sha256,
  pkceChallenge,
  seal,
  encryptionKey,
  XERO_SCOPES,
  XERO_RESOURCES,
  allowedAccountingRead,
  summarizeRecords,
} from "../_shared/xero.ts";

Deno.serve(async (req) => {
  let origin: string;
  try {
    origin = appOrigin();
  } catch {
    return new Response("Integration configuration required", { status: 503 });
  }
  const requestOrigin = req.headers.get("origin");
  const allowedOrigins = new Set([origin, "https://www.sfsaunarental.com"]);
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": requestOrigin && allowedOrigins.has(requestOrigin) ? requestOrigin : origin,
    "Access-Control-Allow-Headers": "content-type, apikey, x-admin-password",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });
  if (requestOrigin && !allowedOrigins.has(requestOrigin))
    return json({ error: "Origin not allowed" }, 403);
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const password = Deno.env.get("ADMIN_PASSWORD");
  if (!password || req.headers.get("x-admin-password") !== password)
    return json({ error: "Unauthorized" }, 401);
  if (Number(req.headers.get("content-length") || 0) > 4096)
    return json({ error: "Request too large" }, 413);
  let body: { action?: string; tenantId?: string };
  try {
    const raw = await req.text();
    if (raw.length > 4096) return json({ error: "Request too large" }, 413);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return json({ error: "Invalid request" }, 400);
    body = parsed;
    if (!["status", "start", "select_tenant", "inspect", "tracking_sample"].includes(body.action ?? ""))
      return json({ error: "Unknown action" }, 400);
    if (body.tenantId !== undefined && typeof body.tenantId !== "string")
      return json({ error: "Invalid organization" }, 400);
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  try {
    const db = database();
    let configured =
      !!Deno.env.get("XERO_CLIENT_ID") &&
      !!Deno.env.get("XERO_CLIENT_SECRET") &&
      !!Deno.env.get("XERO_TOKEN_ENCRYPTION_KEY");
    if (configured) {
      try { await encryptionKey(encryptionSecret()); }
      catch { configured = false; }
    }
    if (body.action === "status") {
      const [{ data: row, error }, sessions] = await Promise.all([
        db
          .from("xero_oauth_connection")
          .select("tenants,selected_tenant_id,updated_at")
          .eq("id", "primary")
          .maybeSingle(),
        db.from("xero_oauth_sessions").select("state_hash").limit(0),
      ]);
      return json({
        configured,
        storageReady: !error && !sessions.error,
        authorized: !!row,
        tenants: row?.tenants ?? [],
        selectedTenantId: row?.selected_tenant_id ?? null,
        redirectUri: callbackUri(),
        scopes: XERO_SCOPES,
      });
    }
    if (!configured)
      return json(
        {
          error:
            "Backend credentials and encryption key must be configured first",
        },
        503,
      );
    if (body.action === "start") {
      const state = randomSecret();
      const verifier = randomSecret();
      const { error } = await db.from("xero_oauth_sessions").insert({
        state_hash: await sha256(state),
        verifier_ciphertext: await seal(verifier, encryptionSecret(), "pkce"),
        expires_at: new Date(Date.now() + 10 * 60000).toISOString(),
      });
      if (error)
        return json(
          { error: "Private OAuth storage must be provisioned first" },
          503,
        );
      // Deletes expired OAuth metadata only, never business records.
      await db
        .from("xero_oauth_sessions")
        .delete()
        .lt("expires_at", new Date().toISOString());
      return json({
        authorizationUrl: authorizationUrl(
          Deno.env.get("XERO_CLIENT_ID") || "",
          callbackUri(),
          state,
          await pkceChallenge(verifier),
        ),
      });
    }
    if (body.action === "select_tenant") {
      if (!body.tenantId || !/^[0-9a-f-]{36}$/i.test(body.tenantId))
        return json({ error: "Invalid organization" }, 400);
      const { data: row, error } = await db
        .from("xero_oauth_connection")
        .select("tenants")
        .eq("id", "primary")
        .maybeSingle();
      if (
        error ||
        !row ||
        !row.tenants.some(
          (tenant: { id: string }) => tenant.id === body.tenantId,
        )
      )
        return json({ error: "Organization was not authorized" }, 403);
      const { error: updateError } = await db
        .from("xero_oauth_connection")
        .update({
          selected_tenant_id: body.tenantId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "primary");
      if (updateError) throw new Error("Organization selection failed");
      return json({ ok: true });
    }
    if (body.action === "inspect") {
      const { row, token } = await activeToken(db);
      const summaries = [];
      // Four fixed GET routes only. No arbitrary URLs, mutation actions or bulk import.
      for (const resource of XERO_RESOURCES) {
        if (!allowedAccountingRead(resource, "GET"))
          throw new Error("Read not allowed");
        const response = await fetch(
          `https://api.xero.com/api.xro/2.0/${resource}?page=1`,
          {
            method: "GET",
            redirect: "error",
            signal: AbortSignal.timeout(15000),
            headers: {
              Authorization: `Bearer ${token.access_token}`,
              "Xero-tenant-id": row.selected_tenant_id,
              Accept: "application/json",
            },
          },
        );
        if (!response.ok)
          return json(
            {
              error: `Xero ${resource} read failed (${response.status}); no history was imported`,
            },
            502,
          );
        const payload = await response.json();
        summaries.push({ resource, ...summarizeRecords(payload[resource]) });
      }
      return json({
        summaries,
        inspectedAt: new Date().toISOString(),
        note: "First page only; structural inspection of up to five records per resource. Not organization totals. No business records were stored.",
      });
    }
    if (body.action === "tracking_sample") {
      const { row, token } = await activeToken(db);
      const xeroHeaders = {
        Authorization: `Bearer ${token.access_token}`,
        "Xero-tenant-id": row.selected_tenant_id,
        Accept: "application/json",
      };
      const get = async (path: string) => {
        const res = await fetch(`https://api.xero.com/api.xro/2.0/${path}`, {
          method: "GET",
          redirect: "error",
          signal: AbortSignal.timeout(15000),
          headers: xeroHeaders,
        });
        if (!res.ok) throw new Error(`Xero read failed (${res.status})`);
        return res.json();
      };

      interface TrackingEntry { TrackingCategoryID?: string; TrackingOptionID?: string; Name?: string; Option?: string }
      interface Line { Tracking?: TrackingEntry[] }

      const coverage = {
        invoicesRead: 0, invoicesWithLineDetails: 0, eligibleLines: 0,
        taggedLines: 0, untaggedLines: 0,
        creditNotesRead: 0, creditLinesTagged: 0, creditLinesUntagged: 0,
        paymentsRead: 0, paymentsWithInvoiceLink: 0,
        pages: { invoices: 0, creditNotes: 0 }, partial: false,
        sampleDateRange: { earliest: null as string | null, latest: null as string | null },
      };
      // category name -> { categoryId, options: option label -> optionId }
      const categories = new Map<string, { categoryId: string | null; options: Map<string, string | null> }>();

      const noteDate = (date?: string) => {
        if (typeof date !== "string") return;
        const day = date.slice(0, 10);
        if (!coverage.sampleDateRange.earliest || day < coverage.sampleDateRange.earliest) coverage.sampleDateRange.earliest = day;
        if (!coverage.sampleDateRange.latest || day > coverage.sampleDateRange.latest) coverage.sampleDateRange.latest = day;
      };
      const noteTracking = (lines: Line[], onTagged: () => void, onUntagged: () => void) => {
        for (const line of lines) {
          if (Array.isArray(line?.Tracking) && line.Tracking.length > 0) {
            onTagged();
            for (const t of line.Tracking) {
              if (!t?.Name) continue;
              const cat = categories.get(t.Name) ?? { categoryId: t.TrackingCategoryID ?? null, options: new Map<string, string | null>() };
              cat.categoryId = cat.categoryId ?? t.TrackingCategoryID ?? null;
              if (t.Option) cat.options.set(t.Option, t.TrackingOptionID ?? null);
              categories.set(t.Name, cat);
            }
          } else {
            onUntagged();
          }
        }
      };

      // Invoices: sales (ACCREC) only; drafts/voided/deleted excluded via Statuses filter.
      // Aggregate type/status shape of page 1 (no customer details or amounts).
      const firstPage = await get("Invoices?page=1");
      const invoiceShape: Record<string, number> = {};
      for (const i of Array.isArray(firstPage?.Invoices) ? firstPage.Invoices : []) {
        const key = `${i?.Type ?? "?"}/${i?.Status ?? "?"}`;
        invoiceShape[key] = (invoiceShape[key] ?? 0) + 1;
      }
      // Report excluded draft/voided/deleted sales invoices separately, never silently.
      const allSales = await get(`Invoices?where=${encodeURIComponent('Type=="ACCREC"')}`);
      const salesInvoicesTotal = Array.isArray(allSales?.Invoices) ? allSales.Invoices.length : -1;
      const excludedSalesInvoices = Array.isArray(allSales?.Invoices)
        ? allSales.Invoices.filter((i: { Status?: string }) => i?.Status && !["AUTHORISED", "PAID"].includes(i.Status)).length
        : 0;
      for (let page = 1; page <= 3; page++) {
        const payload = await get(`Invoices?page=${page}&where=${encodeURIComponent('Type=="ACCREC"')}&Statuses=AUTHORISED,PAID`);
        const invoices = Array.isArray(payload?.Invoices) ? payload.Invoices : [];
        coverage.pages.invoices = page;
        if (invoices.length === 0) break;
        for (const inv of invoices) {
          coverage.invoicesRead++;
          noteDate(inv?.Date);
          if (!Array.isArray(inv?.LineItems)) continue; // paged list omits detail; flagged as unavailable, not zero
          coverage.invoicesWithLineDetails++;
          coverage.eligibleLines += inv.LineItems.length;
          noteTracking(inv.LineItems, () => coverage.taggedLines++, () => coverage.untaggedLines++);
        }
        if (page === 3 && invoices.length === 100) coverage.partial = true;
        if (invoices.length < 100) break;
      }

      for (let page = 1; page <= 2; page++) {
        const payload = await get(`CreditNotes?page=${page}`);
        const notes = Array.isArray(payload?.CreditNotes) ? payload.CreditNotes : [];
        coverage.pages.creditNotes = page;
        if (notes.length === 0) break;
        for (const cn of notes) {
          coverage.creditNotesRead++;
          noteDate(cn?.Date);
          if (Array.isArray(cn?.LineItems))
            noteTracking(cn.LineItems, () => coverage.creditLinesTagged++, () => coverage.creditLinesUntagged++);
        }
        if (notes.length < 100) break;
      }

      const paymentsPayload = await get("Payments?page=1");
      const payments = Array.isArray(paymentsPayload?.Payments) ? paymentsPayload.Payments : [];
      coverage.paymentsRead = payments.length;
      coverage.paymentsWithInvoiceLink = payments.filter((p: { Invoice?: { InvoiceID?: string } }) => p?.Invoice?.InvoiceID).length;

      return json({
        coverage: { ...coverage, salesInvoicesTotal, excludedSalesInvoices, invoiceShape },
        categories: [...categories.entries()].map(([name, c]) => ({
          name,
          categoryId: c.categoryId,
          options: [...c.options.entries()].map(([label, optionId]) => ({ label, optionId })),
        })),
        note: "Bounded sample (<=3 invoice pages, <=2 credit-note pages, 1 payments page). Missing tags are observed gaps in the sample, not proof of absence. Nothing stored; no customer PII or amounts returned. Match option labels against inventory unit codes in the admin UI.",
      });
    }
    return json({ error: "Unknown action" }, 400);
  } catch {
    // Never return provider bodies, exception strings, tokens or customer records.
    return json(
      {
        error:
          "Xero connection operation failed. Check configuration or reconnect; no accounting records were changed.",
      },
      502,
    );
  }
});
