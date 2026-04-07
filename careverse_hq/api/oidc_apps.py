"""
OIDC app management APIs for Admin Central.

These APIs intentionally orchestrate Frappe's native OAuth Client doctype while
persisting Admin Central-specific lifecycle and audit metadata in OIDC App.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

import frappe
from frappe import _


ADMIN_ROLES = {"System Manager", "Admin Central Admin", "County Executive"}
VALID_APP_STATUSES = {"Draft", "Active", "Disabled", "Archived"}
VALID_CLIENT_TYPES = {"Web Confidential", "Native Public"}
REQUIRED_OIDC_DOCTYPES = (
    "OIDC App",
    "OIDC App Redirect URI",
    "OIDC App Scope",
    "OIDC App Audit Event",
)


def _response(
    success: bool,
    *,
    data: Optional[Dict[str, Any]] = None,
    error: Optional[Dict[str, Any]] = None,
    status_code: int = 200,
) -> Dict[str, Any]:
    frappe.local.response.http_status_code = status_code
    payload: Dict[str, Any] = {
        "success": success,
        "meta": {"request_id": frappe.generate_hash(length=10)},
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


def _require_admin_access() -> Optional[Dict[str, Any]]:
    user = frappe.session.user
    if not user or user == "Guest":
        return _response(False, error=_error("AUTH_UNAUTHENTICATED", _("Please sign in to continue")), status_code=401)
    if not set(frappe.get_roles(user)).intersection(ADMIN_ROLES):
        return _response(False, error=_error("AUTH_FORBIDDEN", _("You do not have access to manage sign-in apps")), status_code=403)
    return None


def _ensure_oidc_doctypes_ready() -> Optional[Dict[str, Any]]:
    missing = [doctype for doctype in REQUIRED_OIDC_DOCTYPES if not frappe.db.exists("DocType", doctype)]
    if not missing:
        return None

    return _response(
        False,
        error=_error(
            "OIDC_SETUP_INCOMPLETE",
            _("Sign-in setup is in progress. Please try again in a moment."),
            {"missing_doctypes": ", ".join(missing)},
        ),
        status_code=503,
    )


def _coerce_json(value: Any, default: Any) -> Any:
    if value is None:
        return default
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return default
    return value


def _coerce_list(value: Any) -> List[str]:
    candidate = _coerce_json(value, value)
    if candidate is None:
        return []
    if isinstance(candidate, str):
        if "\n" in candidate:
            return [item.strip() for item in candidate.splitlines() if item.strip()]
        if "," in candidate:
            return [item.strip() for item in candidate.split(",") if item.strip()]
        return [candidate.strip()] if candidate.strip() else []
    if isinstance(candidate, list):
        return [str(item).strip() for item in candidate if str(item).strip()]
    return []


def _resolve_app_id(app_id: Optional[str] = None) -> str:
    candidates = [
        app_id,
        frappe.form_dict.get("app_id") if getattr(frappe, "form_dict", None) else None,
        frappe.form_dict.get("appId") if getattr(frappe, "form_dict", None) else None,
    ]
    for candidate in candidates:
        if candidate is None:
            continue
        value = str(candidate).strip()
        if value:
            return value
    return ""


def _require_app_id(app_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    resolved = _resolve_app_id(app_id)
    if resolved:
        return None
    return _response(False, error=_error("VALIDATION_ERROR", _("Select an app")), status_code=400)


def _serialize_oidc_app(doc) -> Dict[str, Any]:
    redirect_uris = [row.redirect_uri for row in (doc.redirect_uris or []) if (row.redirect_uri or "").strip()]
    scopes = [row.scope for row in (doc.scopes or []) if (row.scope or "").strip()]
    return {
        "id": doc.name,
        "app_name": doc.app_name,
        "owner_system": doc.owner_system,
        "contacts": doc.contacts,
        "status": doc.status,
        "client_type": doc.client_type,
        "oauth_client": doc.oauth_client,
        "trusted_client": int(doc.trusted_client or 0),
        "default_redirect_uri": doc.default_redirect_uri,
        "redirect_uris": redirect_uris,
        "scopes": scopes,
        "description": doc.description,
        "last_secret_rotated_on": doc.last_secret_rotated_on,
        "modified": doc.modified,
    }


def _append_audit_event(doc, action: str, reason: str = "", details: Optional[Dict[str, Any]] = None) -> None:
    doc.append(
        "audit_events",
        {
            "event_time": frappe.utils.now_datetime(),
            "actor": frappe.session.user,
            "action": action,
            "reason": reason or "",
            "details": json.dumps(details or {}, default=str),
        },
    )


def _get_scopes_supported() -> List[str]:
    configured = frappe.get_cached_value("OAuth Settings", "OAuth Settings", "scopes_supported")
    if not configured:
        return ["openid", "profile", "email"]
    items = [scope.strip() for scope in str(configured).splitlines() if scope.strip()]
    if "openid" not in items:
        items.insert(0, "openid")
    return items


def _validate_payload(data: Dict[str, Any], *, is_update: bool = False) -> Optional[Dict[str, Any]]:
    field_errors: Dict[str, str] = {}

    app_name = (data.get("app_name") or "").strip()
    if not is_update and not app_name:
        field_errors["app_name"] = "App name is required."

    client_type = (data.get("client_type") or "").strip()
    if client_type and client_type not in VALID_CLIENT_TYPES:
        field_errors["client_type"] = "Choose a valid client type."

    status = (data.get("status") or "").strip()
    if status and status not in VALID_APP_STATUSES:
        field_errors["status"] = "Choose a valid status."

    default_redirect_uri = (data.get("default_redirect_uri") or "").strip()
    redirect_uris = _coerce_list(data.get("redirect_uris"))
    merged_uris = []
    if default_redirect_uri:
        merged_uris.append(default_redirect_uri)
    merged_uris.extend(redirect_uris)
    merged_uris = list(dict.fromkeys([uri.strip() for uri in merged_uris if uri.strip()]))
    if not is_update and not merged_uris:
        field_errors["redirect_uris"] = "At least one redirect URI is required."

    for uri in merged_uris:
        is_https = uri.startswith("https://")
        is_localhost = uri.startswith("http://localhost") or uri.startswith("http://127.0.0.1")
        if not (is_https or is_localhost):
            field_errors["redirect_uris"] = "Use HTTPS redirect URLs. http://localhost is allowed only for local testing."
            break

    scopes = _coerce_list(data.get("scopes"))
    if scopes and "openid" not in scopes:
        field_errors["scopes"] = "Include the openid scope."

    if field_errors:
        return _response(
            False,
            error=_error("VALIDATION_ERROR", _("Please fix the highlighted fields"), field_errors),
            status_code=400,
        )

    return None


def _sync_oauth_client(doc, payload: Dict[str, Any]) -> None:
    redirect_uris = _coerce_list(payload.get("redirect_uris"))
    default_redirect_uri = (payload.get("default_redirect_uri") or doc.default_redirect_uri or "").strip()
    if default_redirect_uri and default_redirect_uri not in redirect_uris:
        redirect_uris.insert(0, default_redirect_uri)
    redirect_uris = list(dict.fromkeys([uri for uri in redirect_uris if uri]))
    if not redirect_uris and doc.redirect_uris:
        redirect_uris = [row.redirect_uri for row in doc.redirect_uris if (row.redirect_uri or "").strip()]
    if not default_redirect_uri and redirect_uris:
        default_redirect_uri = redirect_uris[0]

    scopes = _coerce_list(payload.get("scopes"))
    if not scopes and doc.scopes:
        scopes = [row.scope for row in doc.scopes if (row.scope or "").strip()]
    if "openid" not in scopes:
        scopes.insert(0, "openid")
    scopes = list(dict.fromkeys(scopes))

    client_type = (payload.get("client_type") or doc.client_type or "Web Confidential").strip()
    token_endpoint_auth_method = "Client Secret Basic" if client_type == "Web Confidential" else "None"

    oauth_client_name = doc.oauth_client
    if oauth_client_name and frappe.db.exists("OAuth Client", oauth_client_name):
        oauth_doc = frappe.get_doc("OAuth Client", oauth_client_name)
    else:
        oauth_doc = frappe.new_doc("OAuth Client")
        oauth_doc.app_name = payload.get("app_name") or doc.app_name

    oauth_doc.app_name = payload.get("app_name") or doc.app_name
    oauth_doc.default_redirect_uri = default_redirect_uri
    oauth_doc.redirect_uris = "\n".join(redirect_uris)
    oauth_doc.scopes = " ".join(scopes)
    oauth_doc.grant_type = "Authorization Code"
    oauth_doc.response_type = "Code"
    oauth_doc.skip_authorization = int(payload.get("trusted_client", doc.trusted_client) or 0)
    oauth_doc.token_endpoint_auth_method = token_endpoint_auth_method

    if oauth_doc.is_new():
        oauth_doc.insert(ignore_permissions=True)
    else:
        oauth_doc.save(ignore_permissions=True)

    doc.oauth_client = oauth_doc.name
    doc.client_type = client_type
    doc.default_redirect_uri = default_redirect_uri
    doc.redirect_uris = []
    for uri in redirect_uris:
        doc.append("redirect_uris", {"redirect_uri": uri})

    doc.scopes = []
    for scope in scopes:
        doc.append("scopes", {"scope": scope})


@frappe.whitelist()
def get_reference_data() -> Dict[str, Any]:
    denied = _require_admin_access()
    if denied:
        return denied
    setup_error = _ensure_oidc_doctypes_ready()
    if setup_error:
        return setup_error
    return _response(
        True,
        data={
            "client_types": sorted(VALID_CLIENT_TYPES),
            "statuses": sorted(VALID_APP_STATUSES),
            "supported_scopes": _get_scopes_supported(),
        },
    )


@frappe.whitelist()
def list_oidc_apps(filters=None, page=1, page_size=20, sort="modified desc") -> Dict[str, Any]:
    denied = _require_admin_access()
    if denied:
        return denied
    setup_error = _ensure_oidc_doctypes_ready()
    if setup_error:
        return setup_error

    parsed_filters = _coerce_json(filters, {}) or {}
    page_num = max(int(page or 1), 1)
    size = max(min(int(page_size or 20), 100), 1)
    start = (page_num - 1) * size

    query_filters: Dict[str, Any] = {}
    status = (parsed_filters.get("status") or "").strip()
    if status:
        query_filters["status"] = status
    client_type = (parsed_filters.get("client_type") or "").strip()
    if client_type:
        query_filters["client_type"] = client_type

    search = (parsed_filters.get("search") or "").strip()
    or_filters = None
    if search:
        or_filters = [
            ["app_name", "like", f"%{search}%"],
            ["owner_system", "like", f"%{search}%"],
            ["oauth_client", "like", f"%{search}%"],
        ]

    rows = frappe.get_list(
        "OIDC App",
        filters=query_filters,
        or_filters=or_filters,
        fields=[
            "name",
            "app_name",
            "owner_system",
            "status",
            "client_type",
            "oauth_client",
            "default_redirect_uri",
            "last_secret_rotated_on",
            "modified",
        ],
        order_by=sort or "modified desc",
        start=start,
        page_length=size,
    )
    for row in rows:
        row["id"] = row.get("name")

    total = len(
        frappe.get_list(
            "OIDC App",
            filters=query_filters,
            or_filters=or_filters,
            fields=["name"],
            limit_page_length=0,
        )
    )

    return _response(
        True,
        data={
            "items": rows,
            "pagination": {
                "page": page_num,
                "page_size": size,
                "total": total,
                "total_pages": (total + size - 1) // size if total else 1,
            },
        },
    )


@frappe.whitelist()
def get_oidc_app_detail(app_id: Optional[str] = None) -> Dict[str, Any]:
    denied = _require_admin_access()
    if denied:
        return denied
    setup_error = _ensure_oidc_doctypes_ready()
    if setup_error:
        return setup_error
    app_id_value = _resolve_app_id(app_id)
    if not app_id_value:
        return _response(False, error=_error("VALIDATION_ERROR", _("Select an app")), status_code=400)
    if not frappe.db.exists("OIDC App", app_id_value):
        return _response(False, error=_error("NOT_FOUND", _("We couldn't find that app")), status_code=404)

    doc = frappe.get_doc("OIDC App", app_id_value)
    app_data = _serialize_oidc_app(doc)
    audit_events = []
    for row in (doc.audit_events or []):
        audit_events.append(
            {
                "event_time": row.event_time,
                "actor": row.actor,
                "action": row.action,
                "reason": row.reason,
                "details": row.details,
            }
        )

    oauth_meta = {}
    if doc.oauth_client and frappe.db.exists("OAuth Client", doc.oauth_client):
        oauth_doc = frappe.get_doc("OAuth Client", doc.oauth_client)
        oauth_meta = {
            "client_id": oauth_doc.client_id,
            "grant_type": oauth_doc.grant_type,
            "response_type": oauth_doc.response_type,
            "token_endpoint_auth_method": oauth_doc.token_endpoint_auth_method,
            "skip_authorization": int(oauth_doc.skip_authorization or 0),
        }

    return _response(True, data={"app": app_data, "oauth_client": oauth_meta, "audit_events": audit_events})


@frappe.whitelist()
def create_oidc_app(payload=None) -> Dict[str, Any]:
    denied = _require_admin_access()
    if denied:
        return denied
    setup_error = _ensure_oidc_doctypes_ready()
    if setup_error:
        return setup_error

    data = _coerce_json(payload, {}) or {}
    validation = _validate_payload(data)
    if validation:
        return validation

    try:
        doc = frappe.new_doc("OIDC App")
        doc.app_name = (data.get("app_name") or "").strip()
        doc.owner_system = (data.get("owner_system") or "").strip()
        doc.contacts = (data.get("contacts") or "").strip()
        doc.status = (data.get("status") or "Draft").strip() or "Draft"
        doc.client_type = (data.get("client_type") or "Web Confidential").strip()
        doc.trusted_client = int(data.get("trusted_client") or 0)
        doc.description = (data.get("description") or "").strip()

        _sync_oauth_client(doc, data)
        _append_audit_event(doc, "create_oidc_app", details={"status": doc.status, "client_type": doc.client_type})
        doc.insert(ignore_permissions=True)
        frappe.db.commit()

        oauth_client = frappe.get_doc("OAuth Client", doc.oauth_client)
        return _response(
            True,
            data={
                "app": _serialize_oidc_app(doc),
                "credentials": {
                    "client_id": oauth_client.client_id,
                    "client_secret": oauth_client.client_secret,
                },
            },
            status_code=201,
        )
    except Exception as exc:
        frappe.db.rollback()
        frappe.log_error(f"create_oidc_app failed: {exc}\n{frappe.get_traceback()}", "OIDC Apps")
        return _response(False, error=_error("CREATE_FAILED", _("We couldn't create the app. Please try again")), status_code=500)


@frappe.whitelist()
def update_oidc_app(app_id: Optional[str] = None, payload=None) -> Dict[str, Any]:
    denied = _require_admin_access()
    if denied:
        return denied
    setup_error = _ensure_oidc_doctypes_ready()
    if setup_error:
        return setup_error
    app_id_value = _resolve_app_id(app_id)
    if not app_id_value:
        return _response(False, error=_error("VALIDATION_ERROR", _("Select an app")), status_code=400)
    if not frappe.db.exists("OIDC App", app_id_value):
        return _response(False, error=_error("NOT_FOUND", _("We couldn't find that app")), status_code=404)

    data = _coerce_json(payload, {}) or {}
    validation = _validate_payload(data, is_update=True)
    if validation:
        return validation

    try:
        doc = frappe.get_doc("OIDC App", app_id_value)
        if "app_name" in data:
            doc.app_name = (data.get("app_name") or "").strip()
        if "owner_system" in data:
            doc.owner_system = (data.get("owner_system") or "").strip()
        if "contacts" in data:
            doc.contacts = (data.get("contacts") or "").strip()
        if "description" in data:
            doc.description = (data.get("description") or "").strip()
        if "status" in data and data.get("status"):
            doc.status = (data.get("status") or "").strip()
        if "client_type" in data and data.get("client_type"):
            doc.client_type = (data.get("client_type") or "").strip()
        if "trusted_client" in data:
            doc.trusted_client = int(data.get("trusted_client") or 0)

        _sync_oauth_client(doc, data)
        _append_audit_event(doc, "update_oidc_app", details={"updated_fields": sorted(list(data.keys()))})
        doc.save(ignore_permissions=True)
        frappe.db.commit()
        return _response(True, data={"app": _serialize_oidc_app(doc)})
    except Exception as exc:
        frappe.db.rollback()
        frappe.log_error(f"update_oidc_app failed: {exc}\n{frappe.get_traceback()}", "OIDC Apps")
        return _response(False, error=_error("UPDATE_FAILED", _("We couldn't save app changes. Please try again")), status_code=500)


@frappe.whitelist()
def rotate_oidc_client_secret(app_id: Optional[str] = None, reason: str = "") -> Dict[str, Any]:
    denied = _require_admin_access()
    if denied:
        return denied
    setup_error = _ensure_oidc_doctypes_ready()
    if setup_error:
        return setup_error
    app_id_value = _resolve_app_id(app_id)
    if not app_id_value:
        return _response(False, error=_error("VALIDATION_ERROR", _("Select an app")), status_code=400)
    if not frappe.db.exists("OIDC App", app_id_value):
        return _response(False, error=_error("NOT_FOUND", _("We couldn't find that app")), status_code=404)

    try:
        doc = frappe.get_doc("OIDC App", app_id_value)
        if not doc.oauth_client or not frappe.db.exists("OAuth Client", doc.oauth_client):
            return _response(False, error=_error("MISSING_OAUTH_CLIENT", _("This app setup is incomplete. Open the app and save again")), status_code=400)

        new_secret = frappe.generate_hash(length=32)
        frappe.db.set_value("OAuth Client", doc.oauth_client, "client_secret", new_secret, update_modified=True)
        doc.last_secret_rotated_on = frappe.utils.now_datetime()
        _append_audit_event(doc, "rotate_oidc_client_secret", reason=reason, details={"oauth_client": doc.oauth_client})
        doc.save(ignore_permissions=True)
        frappe.db.commit()

        return _response(
            True,
            data={
                "app_id": doc.name,
                "oauth_client": doc.oauth_client,
                "client_secret": new_secret,
                "last_secret_rotated_on": doc.last_secret_rotated_on,
            },
        )
    except Exception as exc:
        frappe.db.rollback()
        frappe.log_error(f"rotate_oidc_client_secret failed: {exc}\n{frappe.get_traceback()}", "OIDC Apps")
        return _response(False, error=_error("ROTATION_FAILED", _("We couldn't rotate the secret. Please try again")), status_code=500)


@frappe.whitelist()
def set_oidc_app_status(app_id: Optional[str] = None, status: Optional[str] = None, reason: str = "") -> Dict[str, Any]:
    denied = _require_admin_access()
    if denied:
        return denied
    setup_error = _ensure_oidc_doctypes_ready()
    if setup_error:
        return setup_error
    app_id_value = _resolve_app_id(app_id)
    if not app_id_value:
        return _response(False, error=_error("VALIDATION_ERROR", _("Select an app")), status_code=400)
    if not frappe.db.exists("OIDC App", app_id_value):
        return _response(False, error=_error("NOT_FOUND", _("We couldn't find that app")), status_code=404)
    status_value = (
        status
        or (frappe.form_dict.get("status") if getattr(frappe, "form_dict", None) else "")
        or ""
    ).strip()
    if status_value not in VALID_APP_STATUSES:
        return _response(False, error=_error("VALIDATION_ERROR", _("Choose a valid status")), status_code=400)

    try:
        doc = frappe.get_doc("OIDC App", app_id_value)
        before = doc.status
        doc.status = status_value
        _append_audit_event(doc, "set_oidc_app_status", reason=reason, details={"from": before, "to": status_value})
        doc.save(ignore_permissions=True)
        frappe.db.commit()
        return _response(True, data={"app": _serialize_oidc_app(doc), "status_changed": {"from": before, "to": status_value}})
    except Exception as exc:
        frappe.db.rollback()
        frappe.log_error(f"set_oidc_app_status failed: {exc}\n{frappe.get_traceback()}", "OIDC Apps")
        return _response(False, error=_error("STATUS_UPDATE_FAILED", _("We couldn't update app status. Please try again")), status_code=500)


@frappe.whitelist()
def get_oidc_quickstart(app_id: Optional[str] = None) -> Dict[str, Any]:
    denied = _require_admin_access()
    if denied:
        return denied
    setup_error = _ensure_oidc_doctypes_ready()
    if setup_error:
        return setup_error
    app_id_value = _resolve_app_id(app_id)
    if not app_id_value:
        return _response(False, error=_error("VALIDATION_ERROR", _("Select an app")), status_code=400)
    if not frappe.db.exists("OIDC App", app_id_value):
        return _response(False, error=_error("NOT_FOUND", _("We couldn't find that app")), status_code=404)

    doc = frappe.get_doc("OIDC App", app_id_value)
    if not doc.oauth_client or not frappe.db.exists("OAuth Client", doc.oauth_client):
        return _response(False, error=_error("MISSING_OAUTH_CLIENT", _("This app setup is incomplete. Open the app and save again")), status_code=400)

    oauth_doc = frappe.get_doc("OAuth Client", doc.oauth_client)
    base_url = frappe.utils.get_url()
    scopes = [row.scope for row in (doc.scopes or []) if (row.scope or "").strip()]
    redirect_uris = [row.redirect_uri for row in (doc.redirect_uris or []) if (row.redirect_uri or "").strip()]
    return _response(
        True,
        data={
            "app": _serialize_oidc_app(doc),
            "oauth": {
                "client_id": oauth_doc.client_id,
                "token_endpoint_auth_method": oauth_doc.token_endpoint_auth_method,
                "authorization_endpoint": f"{base_url}/api/method/frappe.integrations.oauth2.authorize",
                "token_endpoint": f"{base_url}/api/method/frappe.integrations.oauth2.get_token",
                "userinfo_endpoint": f"{base_url}/api/method/frappe.integrations.oauth2.openid_profile",
                "scopes": scopes,
                "redirect_uris": redirect_uris,
            },
        },
    )
