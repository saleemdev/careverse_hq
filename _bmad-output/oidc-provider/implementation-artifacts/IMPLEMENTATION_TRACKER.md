# OIDC Provider Implementation Tracker

Date: 2026-04-05  
Project: `careverse_hq-oidc-provider`  
Workspace: `_bmad-output/oidc-provider/*`

## Scope Lock
- Social Login integrations are out of scope.
- F360 Admin Central acts as OIDC provider for external/internal relying apps.
- Full provider-side redirect UX is in scope (login, consent, allow, deny, error redirects).
- Health-worker identity eligibility is enforced.
- Critical OIDC app operations must use explicit in-page workflows (no modal/dialog shortcuts).

## Setup Status
- [x] Backed up `_bmad/bmm/config.yaml` to `_bmad/bmm/config.pre-oidc.yaml`
- [x] Switched BMaD artifact paths to isolated OIDC workspace
- [x] Created isolated planning and implementation directories
- [x] Seeded `sprint-status.yaml`

## BMaD Planning Status
- [x] PRD created at `planning-artifacts/prd.md`
- [x] Architecture created at `planning-artifacts/architecture.md`
- [x] Epics and stories created at `planning-artifacts/epics.md`
- [x] Readiness report created at `planning-artifacts/readiness-report.md`

## BMaD Execution Notes
- Attempted command-chain execution via shell command discovery.
- Result: no `bmad-*` commands are available in current PATH.
- Mitigation applied: artifacts generated directly in BMaD expected structure, with sprint tracker initialized for story-by-story execution.

## Current Build Progress (2026-04-05)
- [x] OIDC App DocTypes and OAuth Client mapping scaffolded.
- [x] OIDC app lifecycle APIs implemented (`create/list/detail/update/rotate/status/quickstart`).
- [x] Admin Central module added: `Administration > OIDC Apps`.
- [x] OIDC frontend service (`oidcAppsApi`) and state store (`oidcAppsStore`) wired.
- [x] Provider wrappers added by overriding Frappe OAuth entrypoints (protocol remains on Frappe core):
  - `frappe.integrations.oauth2.authorize` -> `careverse_hq.api.oidc_provider.authorize`
  - `frappe.integrations.oauth2.get_token` -> `careverse_hq.api.oidc_provider.get_token`
- [x] Login context updated to hide social providers for OIDC authorize flow.
- [x] In-app quickstart view implemented.
- [x] Operator/integrator/user markdown docs added.
- [x] Admin OIDC app UX refactored to dialog-free workspace patterns:
  - Removed `Modal`, `Drawer`, and `Popconfirm` usage for create/edit/rotate/status.
  - Added explicit workspace tabs for create/edit/overview/quickstart/rotate/status.
  - One-time credentials/secret reveal now shown inline with copy controls.
- [x] OIDC app doctype discovery hardening:
  - OIDC doctypes moved under `careverse_hq/careverse_hq/doctype/*` to match app package structure.
  - API setup guard returns explicit `OIDC_SETUP_INCOMPLETE` response with missing doctypes.
- [x] Logout regression hardening:
  - Public jobs logout switched to `GET /api/method/logout` with `credentials: include`.
  - Async logout calls standardized to `void logout()` in UI handlers.

## Next Execution Steps
1. Complete consent-page branding alignment without forking protocol handlers.
2. Add targeted e2e coverage for positive/negative authorize+token flows.
3. Execute go-live checklist and closure readiness report.
4. Restore `_bmad/bmm/config.yaml` from `config.pre-oidc.yaml` after OIDC stream closure.

## Public Interfaces Tracked
- `careverse_hq.api.oidc_apps.get_reference_data`
- `careverse_hq.api.oidc_apps.list_oidc_apps`
- `careverse_hq.api.oidc_apps.get_oidc_app_detail`
- `careverse_hq.api.oidc_apps.create_oidc_app`
- `careverse_hq.api.oidc_apps.update_oidc_app`
- `careverse_hq.api.oidc_apps.rotate_oidc_client_secret`
- `careverse_hq.api.oidc_apps.set_oidc_app_status`
- `careverse_hq.api.oidc_apps.get_oidc_quickstart`
