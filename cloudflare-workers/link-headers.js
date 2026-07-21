/**
 * Cloudflare Worker: Add RFC 8288 / RFC 9727 / RFC 9728 agent discovery Link
 * headers and serve well-known metadata files with the correct content type.
 *
 * Deployment modes:
 *  1. Zone route (recommended): add a route for www.sfsaunarental.com/* in the
 *     sfsaunarental.com zone. The worker fetches the configured origin directly.
 *  2. Standalone proxy: set ORIGIN_URL env var (e.g. https://example.github.io/)
 *     and point your DNS to this worker. It will proxy all requests to ORIGIN_URL.
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
  '</.well-known/oauth-protected-resource>; rel="oauth-protected-resource"',
  '</auth.md>; rel="auth-md"; type="text/markdown"',
  '</.well-known/mcp/server-card.json>; rel="mcp-server-card"',
  '</.well-known/agent-skills/index.json>; rel="agent-skills"',
  '</.well-known/x402.json>; rel="payment"',
  '</openapi.json>; rel="service-desc"; type="application/openapi+json"',
  '</.well-known/ucp>; rel="ucp-profile"',
  '</.well-known/acp.json>; rel="acp-discovery"',
].join(', ');

const CONTENT_TYPES = {
  '/.well-known/api-catalog': 'application/linkset+json',
  '/service-desc.json': 'application/openapi+json',
  '/.well-known/openid-configuration': 'application/json',
  '/.well-known/oauth-authorization-server': 'application/json',
  '/.well-known/oauth-protected-resource': 'application/json',
  '/auth.md': 'text/markdown; charset=utf-8',
  '/.well-known/mcp/server-card.json': 'application/json',
  '/.well-known/agent-skills/index.json': 'application/json',
  '/.well-known/x402.json': 'application/json',
  '/openapi.json': 'application/openapi+json',
  '/.well-known/ucp': 'application/json',
  '/.well-known/acp.json': 'application/json',
};

function buildUpstreamRequest(request, env) {
  const url = new URL(request.url);

  // If ORIGIN_URL is set, rewrite the request to that origin. This is the
  // standalone-proxy mode. Otherwise, fetch the same URL (zone-route mode),
  // which Cloudflare resolves to the configured origin behind the worker.
  if (env.ORIGIN_URL) {
    const upstream = new URL(url.pathname + url.search, env.ORIGIN_URL);
    const upstreamRequest = new Request(upstream, request);
    upstreamRequest.headers.set('Host', upstream.host);
    return upstreamRequest;
  }

  return request;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const upstreamRequest = buildUpstreamRequest(request, env);
    const response = await fetch(upstreamRequest, { cf: { apps: false } });
    const newHeaders = new Headers(response.headers);

    if (url.pathname === '/' || url.pathname === '/index.html') {
      newHeaders.set('Link', HOMEPAGE_LINKS);
    }

    const ct = CONTENT_TYPES[url.pathname];
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
