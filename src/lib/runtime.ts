import { isProductionRuntime } from './runtimePolicy';

export const productionEnabled = isProductionRuntime(import.meta.env.MODE, location.hostname);
// Set only by scripts/prerender.mjs before page scripts; permits public reads only.
export const staticRenderEnabled = import.meta.env.MODE === 'production' &&
  ['localhost', '127.0.0.1'].includes(location.hostname) &&
  (window as Window & { __SF_STATIC_RENDER?: boolean }).__SF_STATIC_RENDER === true;
export const previewEnabled = !productionEnabled && !staticRenderEnabled;

// Keep production defaults compatible with the existing Lovable publication.
// These values are public browser configuration, never server credentials.
export const services = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  leadWebhook: import.meta.env.VITE_GHL_INBOUND_WEBHOOK_URL ??
    'https://services.leadconnectorhq.com/hooks/zyM3BNze9gmgtLAoCCQ0/webhook-trigger/021d1bd1-97d6-41ee-b5e6-8683de1a2a07',
  hiringWebhook: import.meta.env.VITE_GHL_HIRING_WEBHOOK_URL ?? import.meta.env.VITE_GHL_INBOUND_WEBHOOK_URL ??
    'https://services.leadconnectorhq.com/hooks/zyM3BNze9gmgtLAoCCQ0/webhook-trigger/a695d8cd-6c35-49f7-92b0-ad7208e52df4',
};

export const previewMessage = 'Preview only: submissions, uploads, bookings and payments are disabled.';

export function safeActionUrl(url: string): string {
  return productionEnabled || staticRenderEnabled ? url : `${location.origin}/preview-disabled`;
}
