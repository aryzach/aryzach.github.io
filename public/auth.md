# Agent Authentication — SF Sauna Rental

This document describes how autonomous agents can authenticate to the SF Sauna Rental API.

## Resource

- Resource identifier: `https://www.sfsaunarental.com`
- Protected resource metadata: [/.well-known/oauth-protected-resource](/.well-known/oauth-protected-resource)

## Authorization Server

- Issuer: `https://vwpeuejdgyjcwcymzjxt.supabase.co/auth/v1`
- OAuth metadata: [/.well-known/oauth-authorization-server](/.well-known/oauth-authorization-server)
- OpenID Connect metadata: [/.well-known/openid-configuration](/.well-known/openid-configuration)

## Registration

Agents can request client registration by contacting `support@sfsaunarental.com`. Dynamic client registration is not currently exposed publicly; manual registration returns a `client_id` and `client_secret`.

- Register URI (contact): `mailto:support@sfsaunarental.com?subject=Agent%20Client%20Registration`
- Supported identity types: `user`, `service`
- Supported credential types: `client_secret_basic`, `client_secret_post`, `pkce` (public clients)
- Supported grant types: `authorization_code`, `refresh_token`
- Supported scopes: `openid`, `profile`, `email`, `phone`

## Claims & Revocation

- Claims endpoint (userinfo): `https://vwpeuejdgyjcwcymzjxt.supabase.co/auth/v1/oauth/userinfo`
- Token revocation: contact `support@sfsaunarental.com` to revoke issued credentials.

## Contact

- Security & auth issues: `support@sfsaunarental.com`