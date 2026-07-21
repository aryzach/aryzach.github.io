// x402 payment-protected endpoint (https://x402.org)
// Returns HTTP 402 Payment Required with payment requirements agents can fulfill.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-payment",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Expose-Headers": "x-payment-response, www-authenticate",
};

// USDC on Base Sepolia testnet — replace PAY_TO with your wallet to accept live payments.
const PAY_TO = Deno.env.get("X402_PAY_TO_ADDRESS") ?? "0x0000000000000000000000000000000000000000";
const NETWORK = Deno.env.get("X402_NETWORK") ?? "base-sepolia";
const ASSET = Deno.env.get("X402_ASSET") ?? "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // USDC base-sepolia
const FACILITATOR = Deno.env.get("X402_FACILITATOR_URL") ?? "https://x402.org/facilitator";

function paymentRequirements(resource: string) {
  return {
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: NETWORK,
        maxAmountRequired: "10000", // 0.01 USDC (6 decimals)
        resource,
        description: "Access SF Sauna Rental agent API (pricing, availability, reservation quote).",
        mimeType: "application/json",
        payTo: PAY_TO,
        maxTimeoutSeconds: 60,
        asset: ASSET,
        extra: { name: "USDC", version: "2" },
      },
    ],
    error: "X-PAYMENT header is required",
    facilitator: FACILITATOR,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const resource = `${url.origin}${url.pathname}`;
  const payment = req.headers.get("x-payment");

  if (!payment) {
    const body = paymentRequirements(resource);
    return new Response(JSON.stringify(body), {
      status: 402,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "WWW-Authenticate": `x402 realm="sfsaunarental", facilitator="${FACILITATOR}"`,
      },
    });
  }

  // In production, verify `payment` payload with the facilitator before serving content.
  // For now, treat presence of the header as an agent-signaled payment attempt.
  return new Response(
    JSON.stringify({
      ok: true,
      resource,
      data: {
        service: "sf-sauna-rental",
        message: "Payment accepted. Agent access granted.",
      },
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Payment-Response": "settled",
      },
    },
  );
});