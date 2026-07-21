/**
 * Cloudflare Worker: Add RFC 8288 / RFC 9727 agent discovery headers and proxy
 * OIDC/OAuth discovery metadata to the Lovable Cloud auth issuer.
 *
 * Deploy with:
 *   npx wrangler deploy --config wrangler.toml
 */

const AUTH_ISSUER = 'https://vwpeuejdgyjcwcymzjxt.supabase.co/auth/v1';

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

    // Proxy OIDC/OAuth discovery metadata to the canonical auth issuer.
    if (url.pathname === '/.well-known/openid-configuration') {
      const discovery = await fetch(`${AUTH_ISSUER}/.well-known/openid-configuration`);
      return new Response(discovery.body, {
        status: discovery.status,
        statusText: discovery.statusText,
        headers: {
          'Content-Type': discovery.headers.get('Content-Type') || 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (url.pathname === '/.well-known/oauth-authorization-server') {
      const discovery = await fetch(`${AUTH_ISSUER}/.well-known/oauth-authorization-server`);
      return new Response(discovery.body, {
        status: discovery.status,
        statusText: discovery.statusText,
        headers: {
          'Content-Type': discovery.headers.get('Content-Type') || 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

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
