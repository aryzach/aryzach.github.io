/** Production access requires both a production build and a recognized host. */
export const productionHosts = [
  'sfsaunarental.com', 'www.sfsaunarental.com',
  'aryzach.github.io',
];

export function isProductionRuntime(mode: string, hostname: string): boolean {
  return mode === 'production' && productionHosts.includes(hostname);
}

export function isExternalAction(raw: string, base: string): boolean {
  const url = new URL(raw, base);
  return url.origin !== new URL(base).origin &&
    ['cal.com', 'buy.stripe.com', 'checkout.stripe.com', 'billing.stripe.com'].includes(url.hostname);
}

/** Static generation may read public catalog data, never private tables or functions. */
export function isPublicPrerenderRead(method: string, pathname: string): boolean {
  return method === "GET" && ["sauna_types", "public_sauna_availability", "pricing_tiers", "pricing_config", "app_config"]
    .some(table => pathname === `/rest/v1/${table}`);
}
