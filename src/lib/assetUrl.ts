// Lovable CDN assets are served from the Lovable-hosted origin. When this site
// is deployed elsewhere (e.g. GitHub Pages), the `/__l5e/...` path doesn't
// exist on that host, so we always resolve asset URLs against Lovable's origin.
export const LOVABLE_ASSET_ORIGIN = "https://cedar-home-sanctuary.lovable.app";

export const assetUrl = (a: { url: string }): string =>
  a.url.startsWith("http") ? a.url : `${LOVABLE_ASSET_ORIGIN}${a.url}`;
