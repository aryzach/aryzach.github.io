// WebMCP provider — exposes site actions to AI agents via navigator.modelContext.
// Spec: https://webmachinelearning.github.io/webmcp/

type WebMCPTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: any) => Promise<any> | any;
};

type ModelContext = {
  provideContext: (ctx: { tools: WebMCPTool[] }) => void | Promise<void>;
};

const RESERVATION_ENDPOINT =
  "https://vwpeuejdgyjcwcymzjxt.supabase.co/functions/v1/reservation-create";

const tools: WebMCPTool[] = [
  {
    name: "navigate",
    description: "Navigate the SF Sauna Rental site to a same-origin path (e.g. '/pricing', '/contact', '/how-it-works').",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Same-origin path starting with '/'." },
      },
      required: ["path"],
    },
    execute: ({ path }: { path: string }) => {
      if (typeof path !== "string" || !path.startsWith("/")) {
        throw new Error("path must be a same-origin path starting with '/'");
      }
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
      return { ok: true, path };
    },
  },
  {
    name: "open_reservation_modal",
    description: "Open the reservation modal so the user can start a sauna rental reservation.",
    inputSchema: { type: "object", properties: {} },
    execute: () => {
      window.dispatchEvent(new CustomEvent("open-reservation-modal"));
      return { ok: true };
    },
  },
  {
    name: "list_sauna_types",
    description: "List the sauna rental variants offered by SF Sauna Rental.",
    inputSchema: { type: "object", properties: {} },
    execute: () => ({
      variants: [
        "Infrared Indoor",
        "Infrared Outdoor",
        "Traditional Indoor",
        "Traditional Outdoor",
        "Traditional Original Collection Indoor",
        "Traditional Original Collection Outdoor",
      ],
      terms_months: [1, 3, 6, 12],
      reservation_deposit_usd: 200,
    }),
  },
  {
    name: "create_reservation",
    description:
      "Submit a new sauna rental reservation. The customer receives a magic-link email to pay the $200 deposit and finish onboarding.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string", format: "email" },
        phone: { type: "string" },
        address: { type: "string", description: "Delivery address in the SF Bay Area." },
        sauna_type: {
          type: "string",
          enum: [
            "infrared_indoor",
            "infrared_outdoor",
            "traditional_indoor",
            "traditional_outdoor",
            "traditional_original_indoor",
            "traditional_original_outdoor",
          ],
        },
        term_months: { type: "integer", enum: [1, 3, 6, 12] },
      },
      required: ["name", "email", "phone", "sauna_type", "term_months"],
    },
    execute: async (input: Record<string, unknown>) => {
      const res = await fetch(RESERVATION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.error ?? `Request failed (${res.status})`);
      return data;
    },
  },
  {
    name: "get_contact_info",
    description: "Get SF Sauna Rental contact information and service area.",
    inputSchema: { type: "object", properties: {} },
    execute: () => ({
      business: "SF Sauna Rental",
      email: "support@sfsaunarental.com",
      site: "https://www.sfsaunarental.com",
      service_area: "San Francisco Bay Area",
    }),
  },
];

let registered = false;

export async function registerWebMCP() {
  if (registered) return;
  if (typeof navigator === "undefined") return;
  const mc = (navigator as unknown as { modelContext?: ModelContext }).modelContext;
  if (!mc?.provideContext) return;
  try {
    await mc.provideContext({ tools });
    registered = true;
  } catch (err) {
    console.warn("[webmcp] provideContext failed", err);
  }
}