# User Management Refactor QA Matrix

## Backend API Validation

- `list_users`: returns normalized envelope, pagination, and scope summary.
- `get_user_detail`: returns roles + scoped `User Permission`.
- `create_user`: validates required fields and roles, creates user and scopes.
- `update_user_profile`: updates first/last name and phone.
- `update_user_status`: toggles enabled state with reason capture.
- `update_user_roles`: replaces non-system roles safely.
- `update_user_scope_permissions`: replaces scoped permissions idempotently.
- `reset_user_password`: supports `email_only`, `display_only`, `email_and_display`.

## Compatibility Adapter Validation

- Legacy `create_team_user` delegates to `create_user` and returns legacy response shape.
- Legacy `update_user` delegates to profile/status/role methods and returns legacy shape.
- Legacy `reset_user_password` delegates to new reset API and returns legacy shape.

## Frontend UX Validation

- Route `#user-management` loads directory with hierarchy:
  - title and primary CTA
  - KPI strip
  - filter bar
  - table
- Route `#user-management/new` opens create wizard with 4-step flow.
- Route `#user-management/{userId}` opens detail workspace profile tab.
- Route `#user-management/security/{userId}` opens detail workspace security tab.
- Role and scope editors display change diff before save.
- Deactivate/activate action requires confirmation.

## Theme and Responsiveness

- Uses CSS variables (`var(--bg-primary)`, `var(--text-primary)`, etc.) for dark/light adaptation.
- Filter controls and cards wrap gracefully for mobile/tablet layouts.

## Build Validation Run

- Frontend build executed via `npm run build` with successful completion.
- Python syntax validation executed via:
  - `python3 -m py_compile careverse_hq/api/admin_user_management.py careverse_hq/api/user_management.py`
