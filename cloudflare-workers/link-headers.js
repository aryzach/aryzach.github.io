/**
 * Cloudflare Worker: Add RFC 8288 Link headers for agent discovery.
 *
 * This worker intercepts the homepage (/) and adds Link headers pointing to
 * machine-readable resources. It passes through all other requests unchanged.
 *
 * Deploy with:
 *   npx wrangler deploy cloudflare-workers/link-headers.js --name sf-sauna-link-headers
 */

const LINK_HEADERS = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</service-desc.json>; rel="service-desc"',
  '</llms.txt>; rel="describedby"',
].join(', ');

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Only add Link headers on the homepage.
    const isHomepage = url.pathname === '/' || url.pathname === '/index.html';

    const response = await fetch(request, { cf: { apps: false } });

    if (!isHomepage) {
      return response;
    }

    const newHeaders = new Headers(response.headers);
    newHeaders.set('Link', LINK_HEADERS);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
