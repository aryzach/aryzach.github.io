/**
 * Cloudflare Worker: Add RFC 8288 / RFC 9727 agent discovery headers.
 *
 * Adds Link headers on the homepage and ensures the API catalog is served
 * with the correct application/linkset+json content type.
 *
 * Deploy with:
 *   npx wrangler deploy --config wrangler.toml
 */

const HOMEPAGE_LINKS = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</service-desc.json>; rel="service-desc"',
  '</llms.txt>; rel="describedby"',
  '<https://www.sfsaunarental.com>; rel="service-doc"',
].join(', ');

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const response = await fetch(request, { cf: { apps: false } });
    const newHeaders = new Headers(response.headers);

    if (url.pathname === '/' || url.pathname === '/index.html') {
      newHeaders.set('Link', HOMEPAGE_LINKS);
    }

    if (url.pathname === '/.well-known/api-catalog') {
      newHeaders.set('Content-Type', 'application/linkset+json');
    }

    if (url.pathname === '/service-desc.json') {
      newHeaders.set('Content-Type', 'application/openapi+json');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
