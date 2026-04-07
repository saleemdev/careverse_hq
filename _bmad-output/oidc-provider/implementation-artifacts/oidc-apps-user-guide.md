# OIDC Apps User Guide (Admin Central)

Date: 2026-04-05

## Purpose
Use `Administration > OIDC Apps` to add and manage apps that sign in with F360 Admin Central.

## Scope
- Social sign-in options are not part of this flow.
- Use this module to add apps, manage redirect URLs, rotate secrets, and control app status.
- Use `Setup` in-app to copy the sign-in endpoints and integration values.

## Add App Workflow
1. Open `Administration > OIDC Apps`.
2. Select `Add App`.
3. Provide:
   - `App Name`
   - `Client Type` (`Web Confidential` or `Native Public`)
   - `Default Redirect URI`
   - `Redirect URIs` (one per line)
   - `Scopes` (must include `openid`)
4. Save.
5. Copy the one-time `client_id` and `client_secret` (for confidential clients).

## Operations
- `Edit`: Update redirects/scopes/metadata.
- `Activate` or `Disable`: Toggle app availability.
- `Rotate Secret`: Generate a new secret immediately.
- `Setup`: View generated endpoints and app-specific integration values.

## Eligibility Rules (Provider Side)
- User must be authenticated and enabled.
- For managed OIDC apps, user must be linked to `Health Professional`.
- `Health Professional.status` must be active.

## Notes
- Use exact redirect URI matching.
- For public/native clients, PKCE is enforced by Frappe OAuth implementation.
- Keep secret rotation and status changes in your incident/change-management process.
