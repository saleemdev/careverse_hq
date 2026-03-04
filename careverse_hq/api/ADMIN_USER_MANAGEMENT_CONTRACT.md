# Admin User Management API Contract

This contract defines normalized endpoints for Administration > User Management.

## Base

- RPC route pattern: `/api/method/careverse_hq.api.admin_user_management.<method>`
- Authentication: required
- Authorization: caller must have one of:
  - `System Manager`
  - `Admin Central Admin`
  - `County Executive`

## Response Envelope

```json
{
  "success": true,
  "data": {},
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct validation errors",
    "fieldErrors": {
      "email": "Email is required"
    }
  },
  "meta": {
    "request_id": "abc123"
  }
}
```

- `success=true`: payload is in `data`
- `success=false`: payload is in `error`
- `meta.request_id`: trace id for audit/troubleshooting

## Methods

### 1) `get_reference_data()`

Returns options needed for forms/editors.

`data` shape:

```json
{
  "roles": ["System Manager", "Assistant"],
  "departments": ["Nairobi", "Mombasa"],
  "facilities": ["HF-001", "HF-002"]
}
```

### 2) `list_users(filters, page, page_size, sort)`

- `filters` fields:
  - `search` (string)
  - `status` (`enabled` | `disabled`)
  - `role` (string)
  - `department` (string)

`data` shape:

```json
{
  "items": [
    {
      "id": "john@example.com",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "phone": "+254700000001",
      "enabled": 1,
      "last_login": "2026-03-04 08:30:12",
      "must_reset_password": 0,
      "roles": ["Assistant", "County Executive"],
      "scope_summary": {
        "departments": 1,
        "facilities": 2,
        "total": 3
      }
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 42,
    "total_pages": 3
  }
}
```

### 3) `get_user_detail(user_id)`

`data` shape:

```json
{
  "user": {
    "id": "john@example.com",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+254700000001",
    "enabled": 1,
    "last_login": "2026-03-04 08:30:12",
    "roles": ["Assistant", "County Executive"],
    "scopes": [
      {
        "name": "UP-0001",
        "allow": "Department",
        "for_value": "Nairobi",
        "is_default": 0,
        "apply_to_all_doctypes": 1,
        "applicable_for": null
      }
    ]
  }
}
```

### 4) `create_user(payload, delivery_mode)`

- `payload` fields:
  - `first_name` (required)
  - `last_name` (required)
  - `email` (required)
  - `phone` (optional)
  - `roles` (required, array)
  - `scopes` (optional, array of scope objects)
- `delivery_mode`:
  - `email_only` (default)
  - `display_only`
  - `email_and_display`

If delivery mode permits display, `data.temp_password` is returned.

### 5) `update_user_profile(user_id, payload)`

- `payload` supports:
  - `first_name`
  - `last_name`
  - `phone`

### 6) `update_user_status(user_id, enabled, reason)`

- `enabled`: `0` or `1`
- `reason`: optional audit note

### 7) `update_user_roles(user_id, roles)`

- `roles`: required array
- System roles (`All`, `Guest`) are preserved automatically

### 8) `update_user_scope_permissions(user_id, scopes)`

- `scopes`: array of:
  - `allow`: `Department` or `Health Facility`
  - `for_value`: doctype record name
  - `is_default`: `0 | 1`
  - `apply_to_all_doctypes`: `0 | 1`
  - `applicable_for`: optional doctype

Behavior: idempotent replace for managed scoped doctypes.

### 9) `reset_user_password(user_id, delivery_mode)`

- `delivery_mode`:
  - `email_only`
  - `display_only`
  - `email_and_display`

`temp_password` is returned only when mode allows display.

## Compatibility

Legacy methods in `careverse_hq.api.user_management` are retained as adapters during migration:

- `create_team_user`
- `update_user`
- `reset_user_password`

They internally call the new contract methods and map responses to old envelope format.
