---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/oidc-provider/planning-artifacts/prd.md
  - _bmad-output/oidc-provider/planning-artifacts/architecture.md
workflowType: 'epics'
---

# careverse_hq - OIDC Provider Epic Breakdown

## Requirements Inventory

### Functional Requirements

- Admin OIDC app lifecycle management.
- Provider redirect UX for login/consent/allow/deny/error.
- Eligibility and subject identity governance for health workers.
- API + store + UI surfaces for Admin Central operations.
- Docs and quickstart support.

### Non-Functional Requirements

- Secure redirect and PKCE enforcement.
- Stable subject identity.
- Auditability for all privileged actions.
- Consistent normalized API contracts.

## Epic List

1. Identity Governance and Eligibility Enforcement.
2. OIDC App Registry and Secure Lifecycle APIs.
3. Admin Central UX and Redirect Experience.
4. Documentation, QA, and Go-live Readiness.

## Epic 1: Identity Governance and Eligibility Enforcement

Establish strict health-worker eligibility and stable `sub` identity for provider authorization.

### Story 1.1: Health Worker Eligibility Policy
As a platform admin, I want authorization to be limited to eligible health workers, so that relying apps authenticate only approved principals.

**Acceptance Criteria:**
- **Given** a user attempts authorization and is not linked to Health Professional  
  **When** authorize is evaluated  
  **Then** authorization is denied with clear policy reason.
- **Given** a linked user is disabled  
  **When** authorize is evaluated  
  **Then** authorization is denied.

### Story 1.2: Subject Stability Backfill
As a security engineer, I want stable subject identifiers, so that relying apps can trust user continuity.

**Acceptance Criteria:**
- **Given** an eligible user lacks `User Social Login` entry for provider `frappe`  
  **When** reconciliation runs  
  **Then** a stable subject mapping is created.

### Story 1.3: Identity Reconciliation Report
As an operator, I want a drift report for identity mapping, so that broken user-health-professional linkages are remediated.

**Acceptance Criteria:**
- **Given** mapping anomalies exist  
  **When** report runs  
  **Then** anomalies are listed by category with actionable remediation hints.

## Epic 2: OIDC App Registry and Secure Lifecycle APIs

Create and govern relying-party app registrations safely through Admin Central.

### Story 2.1: OIDC App DocType and OAuth Client Mapping
As an admin, I want each managed app represented in Admin Central, so that lifecycle state is explicit and auditable.

### Story 2.2: OIDC App Admin API (Create/List/Detail)
As an admin UI, I want normalized APIs, so that app workflows are reliable and consistent.

### Story 2.3: Secret Rotation and Audit
As a security admin, I want controlled secret rotation with audit events, so that compromise response is immediate and traceable.

### Story 2.4: Validation and Security Guardrails
As a platform owner, I want strict redirect/scope/client validations, so that misconfiguration and abuse are prevented.

## Epic 3: Admin Central UX and Redirect Experience

Implement Google Console-like app onboarding and complete provider-side redirect UX.

### Story 3.1: Navigation and OIDC Apps Shell
As an admin, I want OIDC Apps under Administration, so that app governance is discoverable.

### Story 3.2: OIDC App Create Wizard
As an admin, I want a guided wizard, so that app onboarding is fast and safe.

### Story 3.3: Consent UI Branding and Scope Display
As an end-user, I want clear consent information, so that access decisions are informed.

### Story 3.4: Redirect Error UX
As an integrator, I want deterministic provider error behavior, so that troubleshooting is fast.

### Story 3.5: Login Context (No Social Surface)
As an auth user, I want to continue seamlessly to authorization after login, without social-login options in this scope.

## Epic 4: Documentation, QA, and Go-live Readiness

Provide operational documentation and verification before production roll-out.

### Story 4.1: In-app Quickstart
As an integrator, I want per-app setup snippets, so that I can integrate quickly.

### Story 4.2: Operator Runbook
As ops/security, I want clear lifecycle and incident playbooks, so that operations are safe.

### Story 4.3: Integrator Guide
As external app teams, I want complete web/native PKCE guidance, so that implementations are standards-compliant.

### Story 4.4: End-to-End Provider Flow Tests
As QA, I want complete positive/negative redirect tests, so that releases are trustworthy.

### Story 4.5: Go-live Checklist
As release manager, I want a final readiness checklist, so that launch risk is controlled.
