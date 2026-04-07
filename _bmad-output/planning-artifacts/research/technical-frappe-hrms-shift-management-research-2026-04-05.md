---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - docs/CODE_REVIEW_LEAVE_MODULE.md
  - frontend/src/App.tsx
workflowType: 'research'
lastStep: 6
research_type: 'Technical Research'
research_topic: 'Frappe HRMS Shift Management in careverse_hq'
research_goals: 'Define a brownfield-ready shift management implementation using HRMS primitives and Careverse access controls.'
user_name: 'Salim'
date: '2026-04-05'
web_research_enabled: true
source_verification: true
---

# Research Report: Technical Research

**Date:** 2026-04-05
**Author:** Salim
**Research Type:** Technical Research

---

## Research Overview

This research seeds BMAD planning for Shift Management in `careverse_hq` using Frappe HRMS-native entities, APIs, and attendance mechanics. The goal is to avoid custom duplication and build an access-controlled orchestration layer on top of HRMS. Current delivery scope is admin-only: create shift, reassign shift, and attendance visibility.

## HRMS Primitives To Reuse

1. Shift and roster
- Active shifts endpoint: `/api/method/hrms.api.get_shifts`
- Roster events endpoint: `/api/method/hrms.api.roster.get_events`
- Shift swap endpoint: `/api/method/hrms.api.roster.swap_shift`

2. Shift request workflow
- Shift requests endpoint: `/api/method/hrms.api.get_shift_requests`

3. Attendance and checkins
- Checkin ingestion endpoint:
  `/api/method/hrms.hr.doctype.employee_checkin.employee_checkin.add_log_based_on_employee_field`
- Bulk attendance endpoint:
  `/api/method/hrms.hr.doctype.attendance.attendance.mark_bulk_attendance`

## Brownfield Fit In This Repo

1. Existing frontend placeholder routes
- `attendance` and `late-arrivals` routes currently render an under-construction state in `frontend/src/App.tsx`.
- These routes are ideal insertion points for the first Shift Management UI slice.

2. Existing access control pattern
- Current APIs in this repo consistently scope by company and facilities.
- Shift APIs should follow the same guardrails: no facility-scope bypass, no cross-company leakage.

3. Existing HR-related implementation precedent
- Leave module review shows a practical pattern: use HRMS canonical doctypes, expose scoped APIs in `careverse_hq`, keep UI aggregation local.

4. Existing module UI baseline for consistency
- Asset Management (`ERPNextAssetsListView`, `AssetDetailView`) already implements the expected module shell:
  - KPI cards, filter/header row, table card, empty states, and token-aware styling.
- Shift Management should reuse this exact UX language to reduce cognitive load and avoid design drift.

## RBAC-Safe Querying Requirements (Frappe)

1. `frappe.get_list` for user-facing queries
- Context7 Frappe docs emphasize that `frappe.get_list` applies user permissions.
- Shift list and attendance visibility endpoints should use `frappe.get_list` (not permission-bypassing query paths).

2. Fail-closed facility scoping
- Validate requested facilities against permitted facilities before querying shift/attendance data.
- If requested scope resolves to zero permitted facilities, return empty/forbidden outcome instead of broadening scope.

3. Document action permission checks
- For create/reassign flows, enforce doctype/document permissions before mutation.

## Recommended Implementation Shape (Phase 1)

1. API layer (`careverse_hq/api/shift_management.py`)
- `get_shift_assignments(employee=None, from_date=None, to_date=None, facilities=None)`
- `create_shift_assignment(...)` (admin-only)
- `reassign_shift(...)` (admin-only swap/reassignment)
- `get_attendance_exceptions(...)` for late/missed checkin monitoring

2. Frontend slice
- Replace `attendance` placeholder with:
  - Admin shift list/create/reassign view aligned to Asset module shell
  - Attendance visibility table and exceptions panel

3. Data contract conventions
- Standardized response shape:
  - `success`, `message`, `data`
  - Paginated list responses with `items`, `total_count`, `page`, `page_size`

4. Design consistency constraints
- Use `theme.useToken()` in component-level styles.
- Reuse global card, spacing, and status visual language (including `stat-card` variants).
- Keep responsive behavior via shared token utilities (`useResponsive`, `COMPONENT_WIDTHS`).

## Implementation Update (2026-04-05)

1. Backend APIs implemented in `careverse_hq/api/shift_management.py`
- `get_shift_dashboard(...)`
- `get_shift_assignments(...)`
- `get_attendance_visibility(...)`
- `get_shift_filter_options(...)`
- `create_shift_assignment(...)`
- `reassign_shift_assignment(...)`

2. Frontend implementation completed for Phase 1
- Attendance placeholders replaced in `frontend/src/App.tsx`:
  - `#attendance` -> Shift Management (assignments tab)
  - `#late-arrivals` -> Attendance visibility tab with late-only preset
- Admin module page added:
  - `frontend/src/components/modules/hr/ShiftManagementView.tsx`
  - Includes KPI row, filter/action header, assignments + attendance tabs, create/reassign modals.
  - Includes table/calendar dual views for both tabs.
  - Includes calendar date-cell shift creation entry point (`+` action).
  - Includes in-flow Shift Type creation modal when link reference is missing.
- API client surface added:
  - `shiftManagementApi` in `frontend/src/services/api.ts`

3. RBAC and fail-closed behavior in implementation
- User-facing list endpoints use `frappe.get_list`.
- Requested facilities are validated with `validate_user_facilities`.
- Explicit out-of-scope facility requests return empty scoped results.
- Create/reassign paths enforce role + doctype/document permission checks.
- Shift Type creation path enforces role + doctype create permission checks.

4. Tests added (unit level, mocked Frappe)
- `careverse_hq/tests/test_shift_management_api.py`
- Coverage targets:
  - admin-role enforcement
  - fail-closed facility filtering
  - required field validation for mutations
  - out-of-scope employee rejection
- Executed successfully with:
  - `/Users/salim/frappe/my-bench/env/bin/python -m unittest careverse_hq.tests.test_shift_management_api`

5. Integration tests added (site-backed)
- `careverse_hq/tests/test_shift_management_integration.py`
- Executed successfully with:
  - `FRAPPE_SITE=desk.kns.co.ke ... bench_helper.py frappe --site desk.kns.co.ke run-tests --module careverse_hq.tests.test_shift_management_integration`
- Coverage targets:
  - non-admin access denied on dashboard
  - admin dashboard response shape
  - fail-closed empty results for unresolvable requested facility filters
  - required field validation for create/reassign mutation endpoints

6. Remaining gaps for next increment
- Add attendance detail drill-down and action workflows (if required by operations).
- Add explicit audit trail UI for reassignment history.

## Risks and Mitigations

1. Risk: Facility scoping drift.
- Mitigation: enforce access checks in every shift endpoint, not only list endpoints.

2. Risk: Attendance mismatch due to missing checkin data.
- Mitigation: surface "unreconciled checkins" and "insufficient logs" as explicit states.

3. Risk: Workflow fragmentation between HRMS and custom endpoints.
- Mitigation: keep state transitions in HRMS documents and use `careverse_hq` as orchestration only.

## Context7 Sources

- BMAD docs:
  - https://context7.com/bmadcode/bmad-method/llms.txt
  - https://github.com/bmadcode/bmad-method/blob/main/README.md
- HRMS docs:
  - https://context7.com/frappe/hrms/llms.txt
- Frappe docs:
  - https://context7.com/frappe/frappe/llms.txt
- Ant Design docs:
  - https://context7.com/ant-design/ant-design/llms.txt
