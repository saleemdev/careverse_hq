---
project_name: 'careverse_hq'
user_name: 'Salim'
date: '2026-04-05'
sections_completed: ['technology_stack', 'critical_rules', 'admin_only_scope', 'uiux_consistency_tokens', 'rbac_get_list_rules', 'feature_seed_shift_management', 'shift_management_phase1_implemented']
existing_patterns_found: 17
status: 'in-progress'
latest_update: '2026-04-05'
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- Backend: Frappe app (`careverse_hq`) in Python.
- Frontend: React + TypeScript under `frontend/`, bundled to `careverse_hq/public/admin-central/`.
- API pattern: whitelisted Frappe methods returning normalized payloads via shared helpers (for example `api_response` usage in existing APIs).
- Workflow-heavy domain: existing modules rely on `workflow_state` transitions and server-side validation.

## Critical Implementation Rules

- Always enforce company and facility scoping on all HR-facing endpoints.
- Reuse Frappe/HRMS core doctypes where possible; avoid duplicating master data in custom doctypes.
- For Shift Management, prefer integrating with HRMS entities:
  - `Shift Type`
  - `Shift Assignment`
  - `Employee Checkin`
  - `Attendance`
  - roster and shift request APIs
- Keep data authority boundaries clear:
  - HRMS handles canonical shift and attendance records.
  - `careverse_hq` adds orchestration, scoping, UI flow, and organization-specific policy checks.
- Preserve current frontend route conventions (`#attendance`, `#late-arrivals`) and replace "under construction" incrementally.

## Admin-Only Scope (Current Phase)

- Feature access is admin-only for this implementation slice.
- Supported capabilities:
  - Create shifts (admin workflow over HRMS shift setup/assignment models).
  - Reassign shifts (admin workflow for approved shift changes/swaps).
  - Attendance visibility (admin monitoring view for shift-aligned attendance and exceptions).
- Not in scope for this phase:
  - Employee self-service shift requests UI.
  - Non-admin approval chains outside admin roles.

## UI/UX Consistency Baseline (Asset Management Module)

- Align Shift Management list/detail UX to Asset module patterns:
  - `frontend/src/components/modules/assets/ERPNextAssetsListView.tsx`
  - `frontend/src/components/modules/assets/AssetDetailView.tsx`
- Mandatory visual/system consistency:
  - Use Ant Design theme tokens from `ConfigProvider` (`frontend/src/App.tsx`) and consume via `theme.useToken()`.
  - Reuse responsive helpers: `useResponsive` + `COMPONENT_WIDTHS` from `frontend/src/styles/tokens.ts`.
  - Use the same card/list shell style for module pages:
    - container padding (`16px` mobile, `24px` desktop)
    - card radius/border/shadow conventions (`borderRadius: 12`, borderless surface, soft shadow)
  - Reuse shared UI primitives where applicable:
    - `EmptyState`
    - `TableSkeleton`
    - `stat-card` visual variants defined in `frontend/src/App.css`
  - Status colors should come from token semantics (`token.colorSuccess`, `token.colorWarning`, `token.colorError`, `token.colorPrimary`) rather than hardcoded values when practical.

## RBAC and Querying Requirements (Mandatory)

- All user-facing Shift Management list queries must use `frappe.get_list` so DocPerm/User Permission filters apply.
- Aggregates/counts for Shift Management must follow RBAC-safe patterns:
  - use `_count()` style helper based on `frappe.get_list`, not `frappe.db.count`.
- Avoid permission-bypassing patterns in shift APIs:
  - no `frappe.db.get_all` for user-facing list endpoints.
  - no global counts that skip user permissions.
- Facility scope must be fail-closed:
  - validate requested facility IDs with `validate_user_facilities`.
  - if requested facilities resolve to none, return empty result (or 403 where appropriate), never broaden scope.
- For document actions (create/reassign/approve), enforce doc-level permission checks (`doc.has_permission(...)`) before mutation.
- API response contract must remain consistent: `success`, `message`, `data`; paginated payloads: `items`, `total_count`, `page`, `page_size`.

## Feature Seed: Shift Management (Frappe HR)

- Existing state:
  - Frontend routes for attendance exist as placeholders in `frontend/src/App.tsx`.
  - Leave flows already integrate HRMS-style records and access controls.
- Initial feature target:
  - Admin shift creation flow.
  - Admin shift reassignment flow.
  - Admin attendance visibility dashboard (including exception visibility).
- Design intent:
  - Keep implementation brownfield-safe and additive.
  - Use BMAD planning artifacts under `_bmad-output/planning-artifacts`.
  - Treat `_bmad-output/planning-artifacts/shift-management-admin-ui-rbac-spec.md` as an implementation checklist baseline.

## Shift Management Implementation Snapshot (2026-04-05)

- Backend module implemented:
  - `careverse_hq/api/shift_management.py`
  - Includes dashboard, assignments list, attendance visibility, filter options, create assignment, reassign shift.
- Frontend module implemented:
  - `frontend/src/components/modules/hr/ShiftManagementView.tsx`
  - Wired to routes in `frontend/src/App.tsx` for `attendance` and `late-arrivals`.
  - Supports both table and calendar views for Shift and Attendance tabs.
  - Supports shift creation directly from calendar date cells.
  - Supports in-flow Shift Type creation when link reference is missing.
- Navigation/title consistency updated:
  - `frontend/src/access/accessPolicy.tsx`
  - `frontend/src/components/AppLayout.tsx`
- API client added:
  - `shiftManagementApi` in `frontend/src/services/api.ts`
  - includes `createShiftType` flow
- Unit tests added:
  - `careverse_hq/tests/test_shift_management_api.py`
- Integration tests added:
  - `careverse_hq/tests/test_shift_management_integration.py`
  - validated on `desk.kns.co.ke` with module-targeted run-tests

## Next Implementation Priorities

- Add attendance detail drill-down workflow and escalation actions if required.
- Add optional reassignment audit timeline view for admin traceability.

## Context7 Sources Used

- BMAD install and workflow guidance:
  - https://context7.com/bmadcode/bmad-method/llms.txt
  - https://github.com/bmadcode/bmad-method/blob/main/README.md
- Frappe HRMS shift and attendance API context:
  - https://context7.com/frappe/hrms/llms.txt
- Frappe permission/query context:
  - https://context7.com/frappe/frappe/llms.txt
- Ant Design token/theming context:
  - https://context7.com/ant-design/ant-design/llms.txt
