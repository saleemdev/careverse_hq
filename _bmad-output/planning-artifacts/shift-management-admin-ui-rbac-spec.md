# Shift Management Admin UI/RBAC Spec

## Implementation Status (2026-04-05)

- Completed in current implementation:
  - Admin-only shift management page with Asset-module visual shell parity.
  - Route wiring:
    - `#attendance` -> Shift Management.
    - `#late-arrivals` -> Attendance visibility preset.
  - Dual data views for both tabs:
    - table view
    - calendar view
  - Shift creation directly from calendar date cells.
  - Link-reference recovery for missing Shift Type:
    - in-flow `Create Shift Type` modal aligned to Asset Item creation pattern.
  - API client and backend endpoint wiring for:
    - dashboard aggregates
    - shift assignments list
    - attendance visibility list
    - filter options
    - create assignment
    - reassign shift
    - create shift type
  - Unit tests for key RBAC/fail-closed/validation branches (`test_shift_management_api.py`).
  - Site-backed integration tests (`test_shift_management_integration.py`) validated on `desk.kns.co.ke`.

- Pending for next increment:
  - Attendance detail drill-down/actions beyond list visibility.
  - Optional audit-focused reassignment timeline in UI.

## Scope Lock (Phase 1)

- Audience: Admin users only.
- Capabilities:
  - Create shift assignment.
  - Reassign/swap shift assignment.
  - View attendance and exceptions.
- Exclusions:
  - Employee self-service shift changes.
  - Non-admin workflow variants.

## UI/UX Consistency Requirements (Asset Module Baseline)

### Page shell

- Match module container pattern:
  - `padding: 16px` mobile, `24px` desktop.
- Use a primary module card style:
  - `borderRadius: 12`
  - `border: none`
  - `boxShadow: 0 2px 12px rgba(0,0,0,0.08)`

### Structural layout

- Reuse Asset list module composition:
  - KPI row
  - Filter/search/actions row
  - Table or card list surface
  - Empty state and loading skeleton

### Token and styling rules

- Consume Ant Design tokens via `theme.useToken()` for component-level styling.
- Use global `ConfigProvider` theme token palette from `frontend/src/App.tsx`.
- Reuse shared responsive utilities:
  - `useResponsive`
  - `COMPONENT_WIDTHS` from `frontend/src/styles/tokens.ts`
- Prefer semantic token colors:
  - `token.colorPrimary`
  - `token.colorSuccess`
  - `token.colorWarning`
  - `token.colorError`
- Reuse stat card variants in `frontend/src/App.css` (`stat-card--*`) where KPI cards are used.

### Shared components

- Use existing `EmptyState` and `TableSkeleton` components.
- Keep table pagination behavior consistent with existing module lists.

## Backend RBAC Requirements (`frappe.get_list`)

- Use `frappe.get_list` for all user-facing Shift and Attendance list queries.
- Do not use permission-bypassing query patterns for user-facing endpoints.
- For aggregates/counts, use RBAC-safe count strategy based on `frappe.get_list`.
- Validate requested facilities against user-permitted facilities before querying.
- Fail closed:
  - requested facilities not permitted => empty result or 403.
- Enforce doc-level permissions for create/reassign actions before any write.
- Return API responses in existing normalized shape:
  - `success`, `message`, `data`
  - paginated lists: `items`, `total_count`, `page`, `page_size`

## Suggested Endpoint Set

- `get_shift_assignments(...)`
- `create_shift_assignment(...)` (admin-only)
- `reassign_shift_assignment(...)` (admin-only)
- `get_attendance_visibility(...)`
- `get_shift_dashboard(...)`
- `get_shift_filter_options(...)`

## Source Anchors (Local)

- `frontend/src/components/modules/assets/ERPNextAssetsListView.tsx`
- `frontend/src/components/modules/assets/AssetDetailView.tsx`
- `frontend/src/App.tsx`
- `frontend/src/styles/tokens.ts`
- `frontend/src/App.css`
- `careverse_hq/api/erpnext_assets.py`
- `careverse_hq/api/dashboard_utils.py`
