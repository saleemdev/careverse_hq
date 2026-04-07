---
stepsCompleted: [1]
inputDocuments:
  - _bmad-output/oidc-provider/implementation-artifacts/IMPLEMENTATION_TRACKER.md
workflowType: 'prd'
---

# Product Requirements Document - OIDC Provider (Admin Central)

**Author:** Salim  
**Date:** 2026-04-05  
**Feature:** F360 Admin Central as OIDC Provider

## 1. Executive Summary

Implement F360 Admin Central as an OIDC/OAuth2 provider for relying applications, with a complete provider-side redirect UX and strict health-worker eligibility enforcement.

## 2. Scope

### In Scope

- OIDC app registration and management under `Administration`.
- OAuth client lifecycle (create, update, activate/deactivate, rotate secret).
- Provider-side redirect UX:
  - guest -> login redirect
  - consent allow/deny
  - callback success/error redirects
  - local provider error UX.
- Health-worker eligibility policy for authorization.
- In-app + markdown documentation.

### Out of Scope

- Social Login provider integrations (Google, Microsoft, etc).
- Federation to external identity providers.
- Client Credentials grant flow.

## 3. Goals

- Enable external systems to authenticate against F360 Admin Central.
- Provide Google Console-like admin workflow for onboarding OIDC apps.
- Enforce secure defaults and auditable administration.
- Ensure stable user subject identity (`sub`) for eligible health workers.

## 4. User Personas

- Platform Admin: registers and governs OIDC relying apps.
- Integrator Engineer: configures relying-party clients using generated quickstart details.
- Health Worker: authenticates and grants consent to approved apps.
- Security Auditor: verifies admin actions, lifecycle events, and policy compliance.

## 5. User Journeys

1. App onboarding journey
- Admin opens `Administration -> OIDC Apps`.
- Admin creates app, sets redirect URIs/scopes/client type.
- System creates mapped OAuth client and reveals credentials once.

2. Auth redirect journey
- Relying app sends user to `/authorize`.
- If guest, provider redirects to login then returns to authorization.
- User sees consent, clicks allow, gets redirected with `code` and `state`.

3. Deny/error journey
- User clicks deny -> redirect with `error=access_denied` and `state`.
- Invalid request or unsafe callback -> local provider error UX with request ID.

4. Governance journey
- Admin rotates secret or disables app.
- Audit log captures actor, action, before/after state.

## 6. Functional Requirements

- FR1: Admin can create/list/view/update/deactivate OIDC apps from Admin Central.
- FR2: Each OIDC app maps to one Frappe OAuth Client with managed metadata.
- FR3: System enforces exact redirect URI matching and client-type constraints.
- FR4: Public/native clients require PKCE.
- FR5: Provider-side login/consent/allow/deny/error redirects are fully supported.
- FR6: Only active users linked to Health Professional are eligible for authorization.
- FR7: System ensures stable `sub` identity for eligible users.
- FR8: Admin actions (create/update/rotate/disable) are auditable.
- FR9: Admin and integrator docs are available in-app and as markdown artifacts.

## 7. Non-Functional Requirements

- NFR1: No wildcard redirect URIs.
- NFR2: No Social Login surface as part of this feature.
- NFR3: Secrets never re-displayed after creation/rotation view.
- NFR4: API response contracts remain normalized and consistent.
- NFR5: Compatibility with Frappe native OAuth/OIDC internals.

## 8. Acceptance Criteria

1. Admin can onboard an OIDC app end-to-end without desk-only manual steps.
2. Positive authorization flow returns `code` + `state`.
3. Deny flow returns `error=access_denied` + `state`.
4. Invalid callback/unsafe request shows provider local error UX.
5. Non-eligible user (no HP link or disabled) is denied authorization.
6. Secret rotation invalidates previous secret usage.
7. Audit events exist for all privileged lifecycle actions.
8. Documentation is discoverable from OIDC Apps UI and markdown files.
