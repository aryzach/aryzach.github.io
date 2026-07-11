// Shared helper: set a us_bank_account PaymentMethod as the Stripe
// Customer's default_payment_method and verify the change stuck.
//
// Never throws — returns a structured result the caller can persist.

function formEncode(obj: Record<string, string>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) p.append(k, v);
  return p.toString();
}

export interface SetAchDefaultResult {
  ok: boolean;
  verified: boolean;
  pm_type?: string;
  bank_name?: string | null;
  bank_last4?: string | null;
  customer_default_after?: string | null;
  error?: string;
}

export async function setAchAsCustomerDefault(
  stripeKey: string,
  customerId: string,
  paymentMethodId: string,
): Promise<SetAchDefaultResult> {
  try {
    // 1. Confirm PM is us_bank_account and belongs to this customer.
    const pmRes = await fetch(`https://api.stripe.com/v1/payment_methods/${paymentMethodId}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const pm = await pmRes.json();
    if (!pmRes.ok) {
      return { ok: false, verified: false, error: pm.error?.message ?? "PaymentMethod lookup failed" };
    }
    if (pm.type !== "us_bank_account") {
      return {
        ok: false,
        verified: false,
        pm_type: pm.type,
        error: `PaymentMethod is ${pm.type}, not us_bank_account`,
      };
    }
    const pmCustomer: string | null =
      typeof pm.customer === "string" ? pm.customer : pm.customer?.id ?? null;
    if (pmCustomer && pmCustomer !== customerId) {
      return {
        ok: false,
        verified: false,
        error: `PaymentMethod belongs to a different Customer (${pmCustomer}).`,
      };
    }

    const bankName = pm?.us_bank_account?.bank_name ?? null;
    const bankLast4 = pm?.us_bank_account?.last4 ?? null;

    // 2. Update customer default_payment_method.
    const upRes = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formEncode({
        "invoice_settings[default_payment_method]": paymentMethodId,
      }),
    });
    const upBody = await upRes.json();
    if (!upRes.ok) {
      return {
        ok: false,
        verified: false,
        pm_type: "us_bank_account",
        bank_name: bankName,
        bank_last4: bankLast4,
        error: upBody.error?.message ?? "Customer update failed",
      };
    }

    // 3. Retrieve customer and confirm default_payment_method.
    const cRes = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const c = await cRes.json();
    const defaultAfter: string | null = c?.invoice_settings?.default_payment_method ?? null;
    const verified = defaultAfter === paymentMethodId;

    return {
      ok: verified,
      verified,
      pm_type: "us_bank_account",
      bank_name: bankName,
      bank_last4: bankLast4,
      customer_default_after: defaultAfter,
      error: verified ? undefined : "Customer default_payment_method did not match after update.",
    };
  } catch (e) {
    return { ok: false, verified: false, error: (e as Error).message };
  }
}

// List active/trialing/past_due subscriptions for a Customer with their
// subscription-level default_payment_method (which overrides customer default).
export async function listCustomerSubscriptions(
  stripeKey: string,
  customerId: string,
): Promise<{ ok: boolean; subscriptions?: any[]; error?: string }> {
  try {
    const url = new URL("https://api.stripe.com/v1/subscriptions");
    url.searchParams.set("customer", customerId);
    url.searchParams.set("status", "all");
    url.searchParams.set("limit", "20");
    const r = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const body = await r.json();
    if (!r.ok) return { ok: false, error: body.error?.message ?? "Subscription list failed" };
    const subs = (body.data ?? []).map((s: any) => ({
      id: s.id,
      status: s.status,
      default_payment_method: s.default_payment_method ?? null,
      current_period_end: s.current_period_end,
      items: (s.items?.data ?? []).map((it: any) => ({
        price_id: it.price?.id,
        product: it.price?.product,
        amount: it.price?.unit_amount,
        currency: it.price?.currency,
        interval: it.price?.recurring?.interval,
      })),
    }));
    return { ok: true, subscriptions: subs };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function setSubscriptionDefaultPaymentMethod(
  stripeKey: string,
  subscriptionId: string,
  paymentMethodId: string,
): Promise<{ ok: boolean; error?: string; default_payment_method?: string | null }> {
  try {
    const r = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formEncode({ default_payment_method: paymentMethodId }),
    });
    const body = await r.json();
    if (!r.ok) return { ok: false, error: body.error?.message ?? "Subscription update failed" };
    return { ok: true, default_payment_method: body.default_payment_method ?? null };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}