---
stepsCompleted: [1]
inputDocuments:
  - _bmad-output/planning-artifacts/shift-management-product-brief.md
  - _bmad-output/planning-artifacts/research/technical-frappe-hrms-shift-management-research-2026-04-05.md
  - _bmad-output/planning-artifacts/shift-management-admin-ui-rbac-spec.md
workflowType: 'prd'
---

# Product Requirements Document - careverse_hq

**Author:** Salim
**Date:** 2026-04-05
**Feature:** Shift Management (Frappe HRMS-aligned, Admin Only Phase)

## 1. Executive Summary

Implement a first production Shift Management workflow in Careverse HQ that replaces attendance placeholders and provides admin-only shift creation, reassignment, and attendance visibility while preserving HRMS as source of truth.

## 2. Problem Statement

- Current attendance pages are placeholders.
- HR/admin users lack one scoped workflow for creating/reassigning shifts and monitoring attendance.
- Manual shift-change and exception handling slows response and increases risk.

## 3. Goals

- Provide in-app admin workflows for shift creation and reassignment.
- Provide in-app attendance visibility for admins.
- Surface late-arrival and missing-checkin exceptions quickly for admin action.
- Maintain strict company/facility access controls.

## 4. Non-Goals

- Building a replacement for core HRMS shift engine.
- Building advanced scheduling optimization in v1.
- Redesigning payroll or leave modules.
- Employee self-service shift request UX in v1.

## 5. User Personas

- HR Operations Admin: creates/reassigns shifts and resolves attendance exceptions.
- HR Supervisor Admin: validates staffing coverage and approves final shift changes where needed.
- Compliance Reviewer Admin: validates attendance auditability.

## 6. User Journeys

1. Shift creation journey
- User opens `#attendance`.
- User creates a shift assignment for selected employee(s), range, and shift type.
- System validates scope and confirms creation.

2. Shift reassignment journey
- User opens `#attendance`.
- User selects an existing assignment and reassigns/swaps shift.
- System validates scope and records auditable change.

3. Attendance visibility journey
- User opens `#late-arrivals` (or attendance exceptions panel).
- User filters by date range and facility scope.
- System returns attendance and exception records aligned to scoped employees/shifts.

## 7. Functional Requirements

- FR1: System must allow admins to create shift assignments by employee, shift type, and date window.
- FR2: System must allow admins to reassign/swap existing shifts with auditable metadata.
- FR3: System must list shift assignments by employee, date window, and authorized scope.
- FR4: System must display attendance visibility records and exceptions (late arrivals, missing checkouts, unresolved checkins).
- FR5: System must support filter controls (date, facility, employee, shift status).
- FR6: System must provide normalized paginated responses (`items`, `total_count`, `page`, `page_size`).
- FR7: System must expose API errors in a consistent shape (`success`, `message`, `data`).
- FR8: UI must follow existing module consistency patterns used in Asset Management:
  - token-based styling via Ant Design `ConfigProvider` + `theme.useToken`
  - responsive sizing via `useResponsive` and shared token files
  - list shell consistency (KPI row + filter row + table card + `EmptyState`)
- FR9: Shift list and attendance list endpoints must use `frappe.get_list` for RBAC-safe querying.
- FR10: Facility filtering must be fail-closed using validated permitted facility IDs.

## 8. Non-Functional Requirements

- NFR1: No cross-company data leakage.
- NFR2: Facility-scoped users can only access permitted facilities.
- NFR3: Read endpoints should return within acceptable UI latency for typical list sizes.
- NFR4: Create/reassign actions must be auditable.
- NFR5: Feature should remain compatible with HRMS upgrade path by minimizing custom core overrides.
- NFR6: UI theming must remain dark/light compatible with existing global token system.
- NFR7: API counts/aggregations must avoid permission bypass patterns.

## 9. Data and Integration Constraints

- Canonical entities remain in HRMS/Frappe:
  - Shift assignments and shift requests
  - Employee checkins
  - Attendance records
- `careverse_hq` owns:
  - Access-scoped orchestration APIs
  - UI composition
  - Organization-specific validation and response shaping
- RBAC query constraints:
  - Use `frappe.get_list` for user-facing list queries.
  - Use RBAC-safe count helpers (not raw DB counts for user-facing aggregates).
  - Enforce document permissions before mutation operations.

## 10. Acceptance Criteria (V1)

1. `#attendance` route shows real shift data and supports admin shift creation.
2. `#attendance` route supports admin shift reassignment.
3. `#late-arrivals` route shows actionable attendance visibility/exception records.
4. Unauthorized facility/company data is not retrievable through feature APIs.
5. UI follows Asset Management module token/layout consistency patterns.
6. Basic tests cover permission checks and key success/error paths.

## 11. Delivery Slices

1. Slice A: Admin read-only shift assignment list + filters + attendance visibility list.
2. Slice B: Admin shift creation endpoint + UI form flow.
3. Slice C: Admin shift reassignment endpoint + UI action flow.
4. Slice D: Hardening (tests, error handling, audit outputs, token consistency checks).

## 12. Open Questions

- Which admin role/profile should be the explicit gate for create/reassign actions?
- Should reassignment be implemented as swap-only, or include direct overwrite flows?
- Do we need cross-facility rollup dashboards in v1, or only scoped views?
