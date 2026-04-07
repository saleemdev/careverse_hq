# OIDC Integrator Guide (Web + Native PKCE)

Date: 2026-04-05

## Endpoints
- Authorization: `/api/method/frappe.integrations.oauth2.authorize`
- Token: `/api/method/frappe.integrations.oauth2.get_token`
- UserInfo: `/api/method/frappe.integrations.oauth2.openid_profile`
- OIDC Metadata: `/.well-known/openid-configuration`

Use `OIDC Apps > Quickstart` for app-specific values.

## Web Confidential Client
1. Register app as `Web Confidential`.
2. Configure exact redirect URI list.
3. Use `client_id + client_secret` at token exchange.
4. Request scopes including `openid`.

## Native/Public Client (PKCE)
1. Register app as `Native Public`.
2. Configure redirect URI list.
3. Send `code_challenge` + `code_challenge_method` on authorize request.
4. Send `code_verifier` on token request.
5. Do not use client secret.

## Error Handling
- Deny flow: callback receives `error=access_denied` and `state`.
- Invalid/inactive managed app: provider returns policy error.
- Preserve and validate `state` in all redirects.

## Security Requirements
- Redirect URI must match exactly.
- Use HTTPS in non-local environments.
- Rotate client secrets on suspicion or scheduled policy.
- Cache tokens securely and honor expiry.
