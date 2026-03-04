"""
Administration User Management API

Normalized APIs for User and User Permission administration.
"""

from __future__ import annotations

import json
import secrets
import string
from typing import Any, Dict, List, Optional, Tuple

import frappe
from frappe import _


ADMIN_ROLES = {"System Manager", "Admin Central Admin", "County Executive"}
SYSTEM_ROLES = {"All", "Guest"}
SCOPED_ALLOW_DOCTYPES = {"Company"}
VISIBILITY_ALLOW_DOCTYPES = {"Company"}


def _response(
    success: bool,
    *,
    data: Optional[Dict[str, Any]] = None,
    error: Optional[Dict[str, Any]] = None,
    status_code: int = 200,
    request_id: Optional[str] = None,
) -> Dict[str, Any]:
    frappe.local.response.http_status_code = status_code
    payload: Dict[str, Any] = {
        "success": success,
        "meta": {"request_id": request_id or frappe.generate_hash(length=10)},
    }
    if data is not None:
        payload["data"] = data
    if error is not None:
        payload["error"] = error
    return payload


def _error(code: str, message: str, field_errors: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    payload: Dict[str, Any] = {"code": code, "message": message}
    if field_errors:
        payload["fieldErrors"] = field_errors
    return payload


def _coerce_json(value: Any, default: Any) -> Any:
    if value is None:
        return default
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return default
    return value


def _require_admin_access() -> Optional[Dict[str, Any]]:
    user = frappe.session.user
    if not user or user == "Guest":
        return _response(
            False,
            error=_error("AUTH_UNAUTHENTICATED", _("Authentication is required")),
            status_code=401,
        )

    user_roles = set(frappe.get_roles(user))
    if not user_roles.intersection(ADMIN_ROLES):
        return _response(
            False,
            error=_error("AUTH_FORBIDDEN", _("You do not have permission to manage users")),
            status_code=403,
        )
    return None


def _generate_temp_password(length: int = 14) -> str:
    alphabet = string.ascii_letters + string.digits + string.punctuation
    password = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice(string.punctuation),
    ]
    password += [secrets.choice(alphabet) for _ in range(length - 4)]
    secrets.SystemRandom().shuffle(password)
    return "".join(password)


def _safe_get_docnames(doctype: str) -> List[str]:
    if not frappe.db.exists("DocType", doctype):
        return []
    rows = frappe.get_all(doctype, fields=["name"], limit_page_length=0, order_by="name asc")
    return [row["name"] for row in rows]


def _get_user_roles(user_id: str) -> List[str]:
    rows = frappe.get_all(
        "Has Role",
        filters={"parent": user_id, "parenttype": "User"},
        fields=["role"],
        order_by="role asc",
    )
    return [row["role"] for row in rows if row["role"] not in SYSTEM_ROLES]


def _get_user_scopes(user_id: str) -> List[Dict[str, Any]]:
    rows = frappe.get_all(
        "User Permission",
        filters={"user": user_id, "allow": ["in", list(SCOPED_ALLOW_DOCTYPES)]},
        fields=["name", "allow", "for_value", "is_default", "apply_to_all_doctypes", "applicable_for"],
        order_by="allow asc, for_value asc",
    )
    return [
        {
            "name": row["name"],
            "allow": row["allow"],
            "for_value": row["for_value"],
            "is_default": int(row.get("is_default") or 0),
            "apply_to_all_doctypes": int(row.get("apply_to_all_doctypes") or 0),
            "applicable_for": row.get("applicable_for"),
        }
        for row in rows
    ]


def _get_user_summary_row(user_doc: Dict[str, Any]) -> Dict[str, Any]:
    user_id = user_doc["name"]
    roles = _get_user_roles(user_id)
    scopes = _get_user_scopes(user_id)
    return {
        "id": user_doc["name"],
        "name": user_doc["name"],
        "email": user_doc.get("email"),
        "first_name": user_doc.get("first_name"),
        "last_name": user_doc.get("last_name"),
        "full_name": f"{user_doc.get('first_name') or ''} {user_doc.get('last_name') or ''}".strip(),
        "phone": user_doc.get("phone"),
        "enabled": int(user_doc.get("enabled") or 0),
        "last_login": user_doc.get("last_login"),
        "must_reset_password": int(user_doc.get("reset_password_key") is not None and user_doc.get("reset_password_key") != ""),
        "roles": roles,
        "scope_summary": {
            "departments": len([s for s in scopes if s["allow"] == "Department"]),
            "facilities": len([s for s in scopes if s["allow"] == "Health Facility"]),
            "total": len(scopes),
        },
    }


def _parse_sort(sort: str) -> str:
    allowed_fields = {
        "creation": "u.creation",
        "modified": "u.modified",
        "name": "u.name",
        "email": "u.email",
        "first_name": "u.first_name",
        "last_name": "u.last_name",
        "last_login": "u.last_login",
    }
    raw = (sort or "creation desc").strip().lower()
    parts = raw.split()
    field = parts[0] if parts else "creation"
    direction = parts[1] if len(parts) > 1 else "desc"
    safe_field = allowed_fields.get(field, "u.creation")
    safe_direction = "asc" if direction == "asc" else "desc"
    return f"{safe_field} {safe_direction}"


def _get_actor_visibility_restrictions(actor: str) -> List[Tuple[str, str]]:
    rows = frappe.get_all(
        "User Permission",
        filters={"user": actor, "allow": ["in", list(VISIBILITY_ALLOW_DOCTYPES)]},
        fields=["allow", "for_value"],
        limit_page_length=0,
    )
    deduped = {(row.get("allow"), row.get("for_value")) for row in rows if row.get("allow") and row.get("for_value")}
    return sorted(deduped)


def _can_actor_view_user(target_user: str, actor_roles: set, actor_restrictions: List[Tuple[str, str]]) -> bool:
    if "System Manager" in actor_roles:
        return True
    if not actor_restrictions:
        return False

    target_rows = frappe.get_all(
        "User Permission",
        filters={"user": target_user, "allow": ["in", list(VISIBILITY_ALLOW_DOCTYPES)]},
        fields=["allow", "for_value"],
        limit_page_length=0,
    )
    target_set = {(row.get("allow"), row.get("for_value")) for row in target_rows if row.get("allow") and row.get("for_value")}
    return any(pair in target_set for pair in actor_restrictions)


def _build_visibility_clause(actor_roles: set, actor_restrictions: List[Tuple[str, str]]) -> Tuple[str, List[Any]]:
    if "System Manager" in actor_roles:
        return "", []
    if not actor_restrictions:
        return " AND 1 = 0 ", []

    sub_parts: List[str] = []
    params: List[Any] = []
    for allow, for_value in actor_restrictions:
        sub_parts.append("(up_vis.allow = %s AND up_vis.for_value = %s)")
        params.extend([allow, for_value])

    clause = (
        " AND EXISTS ("
        "SELECT 1 FROM `tabUser Permission` up_vis "
        "WHERE up_vis.user = u.name AND ("
        + " OR ".join(sub_parts)
        + ")) "
    )
    return clause, params


def _audit(action_type: str, target_user: str, before_state: Any = None, after_state: Any = None, reason: str = "") -> None:
    payload = {
        "actor": frappe.session.user,
        "target_user": target_user,
        "action_type": action_type,
        "reason": reason,
        "before_state": before_state,
        "after_state": after_state,
        "timestamp": frappe.utils.now(),
        "request_id": frappe.generate_hash(length=10),
    }
    frappe.logger("admin_user_management").info(json.dumps(payload, default=str))


def _send_password_email(email: str, first_name: str, last_name: str, temp_password: str, is_reset: bool = False) -> None:
    site_url = frappe.utils.get_url()
    app_name = frappe.get_value("System Settings", None, "app_name") or "CareVerse HQ"
    message = frappe.render_template(
        "careverse_hq/templates/emails/user_credentials.html",
        {
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "password": temp_password,
            "site_url": site_url,
            "app_name": app_name,
            "is_reset": is_reset,
        },
    )
    subject = f"{app_name} - Password Reset" if is_reset else f"Welcome to {app_name} - Your Login Credentials"
    frappe.sendmail(recipients=[email], subject=subject, message=message, delayed=False)


def _replace_user_roles(user_doc: Any, roles: List[str]) -> None:
    normalized = [r.strip() for r in roles if isinstance(r, str) and r.strip()]
    for role_name in normalized:
        if not frappe.db.exists("Role", role_name):
            frappe.throw(_("Role '{0}' does not exist").format(role_name))

    kept_system_roles = [r for r in user_doc.roles if r.role in SYSTEM_ROLES]
    user_doc.roles = kept_system_roles
    for role_name in sorted(set(normalized)):
        user_doc.append("roles", {"role": role_name})


def _replace_scope_permissions(user_id: str, scopes: List[Dict[str, Any]]) -> None:
    frappe.db.delete("User Permission", {"user": user_id, "allow": ["in", list(SCOPED_ALLOW_DOCTYPES)]})
    for scope in scopes:
        allow = scope.get("allow")
        for_value = scope.get("for_value")
        if allow not in SCOPED_ALLOW_DOCTYPES or not for_value:
            continue
        doc = frappe.get_doc(
            {
                "doctype": "User Permission",
                "user": user_id,
                "allow": allow,
                "for_value": for_value,
                "is_default": int(scope.get("is_default") or 0),
                "apply_to_all_doctypes": int(scope.get("apply_to_all_doctypes", 1)),
                "applicable_for": scope.get("applicable_for"),
            }
        )
        doc.insert(ignore_permissions=True)


def _load_user_detail(user_id: str) -> Dict[str, Any]:
    user_doc = frappe.get_doc("User", user_id)
    roles = _get_user_roles(user_id)
    scopes = _get_user_scopes(user_id)
    return {
        "id": user_doc.name,
        "name": user_doc.name,
        "email": user_doc.email,
        "first_name": user_doc.first_name,
        "last_name": user_doc.last_name,
        "phone": user_doc.phone,
        "enabled": int(user_doc.enabled or 0),
        "last_login": user_doc.last_login,
        "roles": roles,
        "scopes": scopes,
    }


@frappe.whitelist()
def get_reference_data() -> Dict[str, Any]:
    denied = _require_admin_access()
    if denied:
        return denied

    return _response(
        True,
        data={
            "roles": [r["name"] for r in frappe.get_all("Role", fields=["name"], order_by="name asc") if r["name"] not in SYSTEM_ROLES],
            "companies": _safe_get_docnames("Company"),
        },
    )


@frappe.whitelist()
def list_users(filters=None, page=1, page_size=20, sort="creation desc") -> Dict[str, Any]:
    denied = _require_admin_access()
    if denied:
        return denied

    parsed_filters = _coerce_json(filters, {}) or {}
    page_num = max(int(page or 1), 1)
    size = max(min(int(page_size or 20), 100), 1)
    offset = (page_num - 1) * size
    order_by = _parse_sort(sort)

    actor = frappe.session.user
    actor_roles = set(frappe.get_roles(actor))
    actor_restrictions = _get_actor_visibility_restrictions(actor)
    visibility_clause, visibility_params = _build_visibility_clause(actor_roles, actor_restrictions)

    where_parts = [
        "u.user_type = 'System User'",
        "u.name != 'Administrator'",
        "u.name != 'Guest'",
    ]
    params: List[Any] = []

    status = (parsed_filters.get("status") or "").strip().lower()
    if status in {"enabled", "disabled"}:
        where_parts.append("u.enabled = %s")
        params.append(1 if status == "enabled" else 0)

    search = (parsed_filters.get("search") or "").strip()
    if search:
        where_parts.append("(u.first_name LIKE %s OR u.last_name LIKE %s OR u.email LIKE %s)")
        like_value = f"%{search}%"
        params.extend([like_value, like_value, like_value])

    role_filter = (parsed_filters.get("role") or "").strip()
    if role_filter:
        where_parts.append(
            "EXISTS (SELECT 1 FROM `tabHas Role` hr "
            "WHERE hr.parent = u.name AND hr.parenttype = 'User' AND hr.role = %s)"
        )
        params.append(role_filter)

    company_filter = (parsed_filters.get("company") or "").strip()
    if company_filter:
        where_parts.append(
            "EXISTS (SELECT 1 FROM `tabUser Permission` up_comp "
            "WHERE up_comp.user = u.name AND up_comp.allow = 'Company' AND up_comp.for_value = %s)"
        )
        params.append(company_filter)

    where_sql = " WHERE " + " AND ".join(where_parts)

    count_sql = (
        "SELECT COUNT(*) AS total "
        "FROM `tabUser` u "
        + where_sql
        + visibility_clause
    )
    count_row = frappe.db.sql(count_sql, params + visibility_params, as_dict=True)
    total = int((count_row[0] or {}).get("total") or 0)

    list_sql = (
        "SELECT u.name, u.email, u.first_name, u.last_name, u.phone, u.enabled, u.last_login, u.reset_password_key "
        "FROM `tabUser` u "
        + where_sql
        + visibility_clause
        + f" ORDER BY {order_by} LIMIT %s OFFSET %s"
    )
    docs = frappe.db.sql(list_sql, params + visibility_params + [size, offset], as_dict=True)

    user_ids = [doc["name"] for doc in docs]
    role_map: Dict[str, List[str]] = {user_id: [] for user_id in user_ids}
    scope_summary: Dict[str, Dict[str, int]] = {
        user_id: {"companies": 0, "total": 0} for user_id in user_ids
    }

    if user_ids:
        role_rows = frappe.db.sql(
            "SELECT parent AS user_id, role "
            "FROM `tabHas Role` "
            "WHERE parenttype = 'User' AND parent IN %(user_ids)s AND role NOT IN ('All', 'Guest') "
            "ORDER BY role ASC",
            {"user_ids": tuple(user_ids)},
            as_dict=True,
        )
        for row in role_rows:
            role_map.setdefault(row["user_id"], []).append(row["role"])

        scope_rows = frappe.db.sql(
            "SELECT user, allow, COUNT(*) AS count "
            "FROM `tabUser Permission` "
            "WHERE user IN %(user_ids)s AND allow IN ('Company') "
            "GROUP BY user, allow",
            {"user_ids": tuple(user_ids)},
            as_dict=True,
        )
        for row in scope_rows:
            summary = scope_summary.setdefault(row["user"], {"companies": 0, "total": 0})
            if row["allow"] == "Company":
                summary["companies"] = int(row["count"] or 0)
            summary["total"] = summary["companies"]

    items: List[Dict[str, Any]] = []
    for doc in docs:
        user_id = doc["name"]
        items.append(
            {
                "id": user_id,
                "name": user_id,
                "email": doc.get("email"),
                "first_name": doc.get("first_name"),
                "last_name": doc.get("last_name"),
                "full_name": f"{doc.get('first_name') or ''} {doc.get('last_name') or ''}".strip(),
                "phone": doc.get("phone"),
                "enabled": int(doc.get("enabled") or 0),
                "last_login": doc.get("last_login"),
                "must_reset_password": int(bool(doc.get("reset_password_key"))),
                "roles": role_map.get(user_id, []),
                "scope_summary": scope_summary.get(user_id, {"companies": 0, "total": 0}),
            }
        )

    return _response(
        True,
        data={
            "items": items,
            "pagination": {
                "page": page_num,
                "page_size": size,
                "total": total,
                "total_pages": (total + size - 1) // size if total else 1,
            },
        },
    )


@frappe.whitelist()
def get_user_detail(user_id: str) -> Dict[str, Any]:
    denied = _require_admin_access()
    if denied:
        return denied

    if not user_id or not frappe.db.exists("User", user_id):
        return _response(False, error=_error("USER_NOT_FOUND", _("User not found")), status_code=404)

    actor = frappe.session.user
    actor_roles = set(frappe.get_roles(actor))
    actor_restrictions = _get_actor_visibility_restrictions(actor)
    if not _can_actor_view_user(user_id, actor_roles, actor_restrictions):
        return _response(False, error=_error("AUTH_FORBIDDEN", _("You cannot view this user")), status_code=403)

    return _response(True, data={"user": _load_user_detail(user_id)})


@frappe.whitelist()
def create_user(payload=None, delivery_mode="email_only") -> Dict[str, Any]:
    denied = _require_admin_access()
    if denied:
        return denied

    data = _coerce_json(payload, {}) or {}
    required = ["first_name", "last_name", "email"]
    missing = {field: _("This field is required") for field in required if not data.get(field)}
    roles = data.get("roles") or []
    if not roles:
        missing["roles"] = _("At least one role is required")
    if missing:
        return _response(False, error=_error("VALIDATION_ERROR", _("Please correct validation errors"), missing), status_code=400)

    email = data.get("email")
    if frappe.db.exists("User", email):
        return _response(False, error=_error("USER_EXISTS", _("User already exists")), status_code=409)

    temp_password = _generate_temp_password()
    try:
        user_doc = frappe.get_doc(
            {
                "doctype": "User",
                "email": email,
                "first_name": data.get("first_name"),
                "last_name": data.get("last_name"),
                "phone": data.get("phone"),
                "new_password": temp_password,
                "enabled": 1,
                "user_type": "System User",
                "send_welcome_email": 0,
                "must_reset_password": 1,
            }
        )
        _replace_user_roles(user_doc, roles)
        user_doc.insert(ignore_permissions=True)
        _replace_scope_permissions(user_doc.name, data.get("scopes") or [])
        frappe.db.commit()

        if delivery_mode in {"email_only", "email_and_display"}:
            _send_password_email(
                email=user_doc.email,
                first_name=user_doc.first_name or "",
                last_name=user_doc.last_name or "",
                temp_password=temp_password,
                is_reset=False,
            )

        detail = _load_user_detail(user_doc.name)
        response_data: Dict[str, Any] = {"user": detail}
        if delivery_mode in {"display_only", "email_and_display"}:
            response_data["temp_password"] = temp_password

        _audit("create_user", user_doc.name, before_state=None, after_state=detail)
        return _response(True, data=response_data, status_code=201)
    except frappe.ValidationError as exc:
        frappe.db.rollback()
        return _response(False, error=_error("VALIDATION_ERROR", str(exc)), status_code=400)
    except Exception as exc:
        frappe.db.rollback()
        frappe.log_error(f"create_user failed: {exc}\n{frappe.get_traceback()}", "Admin User Management")
        return _response(False, error=_error("CREATE_FAILED", _("Failed to create user")), status_code=500)


@frappe.whitelist()
def update_user_profile(user_id: str, payload=None) -> Dict[str, Any]:
    denied = _require_admin_access()
    if denied:
        return denied

    if not frappe.db.exists("User", user_id):
        return _response(False, error=_error("USER_NOT_FOUND", _("User not found")), status_code=404)

    data = _coerce_json(payload, {}) or {}
    allowed_fields = {"first_name", "last_name", "phone"}
    try:
        user_doc = frappe.get_doc("User", user_id)
        before = {
            "first_name": user_doc.first_name,
            "last_name": user_doc.last_name,
            "phone": user_doc.phone,
        }
        for field_name in allowed_fields:
            if field_name in data:
                setattr(user_doc, field_name, data.get(field_name))
        user_doc.save(ignore_permissions=True)
        frappe.db.commit()
        after = {
            "first_name": user_doc.first_name,
            "last_name": user_doc.last_name,
            "phone": user_doc.phone,
        }
        _audit("update_user_profile", user_id, before_state=before, after_state=after)
        return _response(True, data={"user": _load_user_detail(user_id)})
    except Exception as exc:
        frappe.db.rollback()
        frappe.log_error(f"update_user_profile failed: {exc}\n{frappe.get_traceback()}", "Admin User Management")
        return _response(False, error=_error("UPDATE_FAILED", _("Failed to update user profile")), status_code=500)


@frappe.whitelist()
def update_user_status(user_id: str, enabled: int, reason: str = "") -> Dict[str, Any]:
    denied = _require_admin_access()
    if denied:
        return denied

    if not frappe.db.exists("User", user_id):
        return _response(False, error=_error("USER_NOT_FOUND", _("User not found")), status_code=404)

    try:
        user_doc = frappe.get_doc("User", user_id)
        before = {"enabled": int(user_doc.enabled or 0)}
        user_doc.enabled = int(enabled)
        user_doc.save(ignore_permissions=True)
        frappe.db.commit()
        after = {"enabled": int(user_doc.enabled or 0)}
        _audit("update_user_status", user_id, before_state=before, after_state=after, reason=reason or "")
        return _response(True, data={"user": _load_user_detail(user_id)})
    except Exception as exc:
        frappe.db.rollback()
        frappe.log_error(f"update_user_status failed: {exc}\n{frappe.get_traceback()}", "Admin User Management")
        return _response(False, error=_error("STATUS_UPDATE_FAILED", _("Failed to update user status")), status_code=500)


@frappe.whitelist()
def update_user_roles(user_id: str, roles=None) -> Dict[str, Any]:
    denied = _require_admin_access()
    if denied:
        return denied

    if not frappe.db.exists("User", user_id):
        return _response(False, error=_error("USER_NOT_FOUND", _("User not found")), status_code=404)

    parsed_roles = _coerce_json(roles, [])
    if not isinstance(parsed_roles, list) or not parsed_roles:
        return _response(
            False,
            error=_error("VALIDATION_ERROR", _("At least one role is required"), {"roles": _("At least one role is required")}),
            status_code=400,
        )

    try:
        user_doc = frappe.get_doc("User", user_id)
        before = _get_user_roles(user_id)
        _replace_user_roles(user_doc, parsed_roles)
        user_doc.save(ignore_permissions=True)
        frappe.db.commit()
        after = _get_user_roles(user_id)
        _audit("update_user_roles", user_id, before_state=before, after_state=after)
        return _response(True, data={"user": _load_user_detail(user_id)})
    except Exception as exc:
        frappe.db.rollback()
        frappe.log_error(f"update_user_roles failed: {exc}\n{frappe.get_traceback()}", "Admin User Management")
        return _response(False, error=_error("ROLE_UPDATE_FAILED", _("Failed to update user roles")), status_code=500)


@frappe.whitelist()
def update_user_scope_permissions(user_id: str, scopes=None) -> Dict[str, Any]:
    denied = _require_admin_access()
    if denied:
        return denied

    if not frappe.db.exists("User", user_id):
        return _response(False, error=_error("USER_NOT_FOUND", _("User not found")), status_code=404)

    parsed_scopes = _coerce_json(scopes, [])
    if not isinstance(parsed_scopes, list):
        return _response(False, error=_error("VALIDATION_ERROR", _("Scopes must be a list")), status_code=400)

    try:
        before = _get_user_scopes(user_id)
        _replace_scope_permissions(user_id, parsed_scopes)
        frappe.db.commit()
        after = _get_user_scopes(user_id)
        _audit("update_user_scope_permissions", user_id, before_state=before, after_state=after)
        return _response(True, data={"user": _load_user_detail(user_id)})
    except Exception as exc:
        frappe.db.rollback()
        frappe.log_error(f"update_user_scope_permissions failed: {exc}\n{frappe.get_traceback()}", "Admin User Management")
        return _response(False, error=_error("SCOPE_UPDATE_FAILED", _("Failed to update user scope permissions")), status_code=500)


@frappe.whitelist()
def reset_user_password(user_id: str, delivery_mode: str = "email_only") -> Dict[str, Any]:
    denied = _require_admin_access()
    if denied:
        return denied

    if not frappe.db.exists("User", user_id):
        return _response(False, error=_error("USER_NOT_FOUND", _("User not found")), status_code=404)

    if delivery_mode not in {"email_only", "display_only", "email_and_display"}:
        return _response(False, error=_error("VALIDATION_ERROR", _("Unsupported delivery mode")), status_code=400)

    temp_password = _generate_temp_password()
    try:
        user_doc = frappe.get_doc("User", user_id)
        user_doc.new_password = temp_password
        user_doc.must_reset_password = 1
        user_doc.save(ignore_permissions=True)
        frappe.db.commit()

        if delivery_mode in {"email_only", "email_and_display"}:
            _send_password_email(
                email=user_doc.email,
                first_name=user_doc.first_name or "",
                last_name=user_doc.last_name or "",
                temp_password=temp_password,
                is_reset=True,
            )

        out: Dict[str, Any] = {"user_id": user_id, "delivery_mode": delivery_mode}
        if delivery_mode in {"display_only", "email_and_display"}:
            out["temp_password"] = temp_password

        _audit("reset_user_password", user_id, before_state=None, after_state={"delivery_mode": delivery_mode})
        return _response(True, data=out)
    except Exception as exc:
        frappe.db.rollback()
        frappe.log_error(f"reset_user_password failed: {exc}\n{frappe.get_traceback()}", "Admin User Management")
        return _response(False, error=_error("PASSWORD_RESET_FAILED", _("Failed to reset password")), status_code=500)
