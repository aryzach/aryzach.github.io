/**
 * Cloudflare Worker: Add RFC 8288 / RFC 9727 agent discovery headers and serve
 * the well-known OIDC/OAuth discovery metadata with the correct content type.
 *
 * Deploy with:
 *   npx wrangler deploy --config wrangler.toml
 */

const HOMEPAGE_LINKS = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</service-desc.json>; rel="service-desc"',
  '</llms.txt>; rel="describedby"',
  '<https://www.sfsaunarental.com>; rel="service-doc"',
  '</.well-known/openid-configuration>; rel="openid-configuration"',
  '</.well-known/oauth-authorization-server>; rel="oauth-authorization-server"',
].join(', ');

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const response = await fetch(request, { cf: { apps: false } });
    const newHeaders = new Headers(response.headers);

    if (url.pathname === '/' || url.pathname === '/index.html') {
      newHeaders.set('Link', HOMEPAGE_LINKS);
    }

    const contentTypePaths = {
      '/.well-known/api-catalog': 'application/linkset+json',
      '/service-desc.json': 'application/openapi+json',
      '/.well-known/openid-configuration': 'application/json',
      '/.well-known/oauth-authorization-server': 'application/json',
    };

    const ct = contentTypePaths[url.pathname];
    if (ct) {
      newHeaders.set('Content-Type', ct);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
