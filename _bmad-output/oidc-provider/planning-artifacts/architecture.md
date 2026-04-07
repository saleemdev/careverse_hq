---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - _bmad-output/oidc-provider/planning-artifacts/prd.md
workflowType: 'architecture'
---

# Architecture - OIDC Provider in Admin Central

## 1. Architectural Summary

Use Frappe-native OAuth/OIDC primitives as the protocol engine and add Careverse orchestration for administration UX, validation, identity policy, and auditability.

## 2. Core Decisions

1. Reuse native Frappe endpoints:
   - `/api/method/frappe.integrations.oauth2.authorize`
   - `/api/method/frappe.integrations.oauth2.get_token`
   - `/api/method/frappe.integrations.oauth2.openid_profile`
2. Keep Social Login provider integrations out of scope for this stream.
3. Add an Admin Central registry module (`OIDC App`) that maps to Frappe `OAuth Client`.
4. Enforce health-worker eligibility at authorization decision boundaries.
5. Use normalized admin API contract style matching `admin_user_management`.

## 3. Component Model

### 3.1 Backend Components

- `careverse_hq.api.oidc_apps`
  - app CRUD/lifecycle APIs
  - OAuth Client mapping orchestration
  - secret rotation orchestration
  - quickstart payload generation
- `careverse_hq.api.oidc_identity`
  - health-worker eligibility checks
  - subject stability enforcement/backfill/reconciliation
- `careverse_hq.api.oidc_audit`
  - append-only audit event logging + retrieval

### 3.2 Data Model

- New DocType: `OIDC App`
  - key fields: `app_name`, `status`, `client_type`, `oauth_client`, `default_redirect_uri`, `scopes`, `trusted_client`
- Child DocType: `OIDC App Redirect URI`
- Child DocType: `OIDC App Scope`
- Optional DocType: `OIDC App Audit Log` (or logger-based equivalent)

### 3.3 Frontend Components

- Navigation: `Administration -> OIDC Apps`
- Pages:
  - list view
  - create/edit wizard
  - detail workspace with status + secret rotation + docs panel
- Store/API:
  - `oidcAppsApi` in `frontend/src/services/api.ts`
  - `oidcAppsStore` in `frontend/src/stores/modules`

## 4. Redirect UX Architecture

1. Authorization request enters provider via native Frappe authorize endpoint.
2. If unauthenticated, user is redirected to `/login` with return path preserved.
3. Post-login return continues auth flow.
4. Consent page displays app + scope context and explicit allow/deny actions.
5. Allow: redirect to registered callback with `code` + `state`.
6. Deny: redirect to callback with `error=access_denied` + `state`.
7. Unsafe/invalid redirect scenarios show local provider error page with request ID.

## 5. Security Controls

- Exact redirect URI matching only.
- PKCE required for public/native client types.
- Confidential web clients use secret-based token auth method.
- Secret reveal once at create/rotate.
- Full lifecycle audit events.
- Eligibility gate blocks disabled users and users without Health Professional link.

## 6. Public Interface Contract

- `get_reference_data()`
- `list_oidc_apps(filters, page, page_size, sort)`
- `get_oidc_app_detail(app_id)`
- `create_oidc_app(payload)`
- `update_oidc_app(app_id, payload)`
- `rotate_oidc_client_secret(app_id)`
- `set_oidc_app_status(app_id, status, reason)`
- `get_oidc_quickstart(app_id)`

## 7. Operational Architecture

- Scheduled reconciliation job for identity mapping drift.
- OIDC configuration docs generated per app for integrators.
- Incident playbook for secret compromise and immediate disablement.
