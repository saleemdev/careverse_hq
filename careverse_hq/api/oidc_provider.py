"""
Minimal OAuth/OIDC policy wrappers for Admin Central managed OIDC apps.

These wrappers delegate protocol handling to Frappe core and only enforce
Admin Central policy checks (managed app status + health-worker eligibility).
"""

from __future__ import annotations

import base64
from typing import Dict, Optional, Tuple
from urllib.parse import urlencode

import frappe
from frappe import _
from frappe.integrations.oauth2 import get_token as frappe_get_token
from frappe.integrations.oauth2 import (
	encode_params,
	get_oauth_server,
	get_oauth_settings,
	sanitize_kwargs,
)
from frappe.utils import escape_html
from oauthlib.oauth2 import FatalClientError, OAuth2Error


ACTIVE_HEALTH_PROFESSIONAL_STATUSES = {"active"}


def _json_error_response(error: str, description: str, status_code: int = 400) -> None:
	frappe.local.response = frappe._dict(
		{
			"error": error,
			"error_description": description,
			"request_id": frappe.generate_hash(length=10),
		}
	)
	frappe.local.response["http_status_code"] = status_code


_ERROR_USER_MESSAGES = {
	"invalid_request": "This sign-in link is incomplete. Return to the app and try again.",
	"invalid_client": "This app isn't available for sign-in right now.",
	"access_denied": "You don't have access to this app yet. Contact your administrator.",
	"unauthorized_client": "This app isn't allowed to request sign-in.",
	"unsupported_response_type": "This sign-in request type isn't supported.",
	"invalid_scope": "The requested permissions aren't valid.",
	"server_error": "Something went wrong on our end. Please try again.",
}


def _render_authorize_error(error_code: str, message: str, details: Optional[Dict[str, str]] = None) -> None:
	request_id = frappe.generate_hash(length=10)
	details = details or {}

	safe_detail_labels = {"app": "App", "status": "Status"}
	details_rows = "".join(
		f"""<div class="meta-row"><span class="meta-label">{escape_html(safe_detail_labels[str(key)])}</span><span class="meta-val">{escape_html(str(value))}</span></div>"""
		for key, value in details.items()
		if str(key) in safe_detail_labels and value is not None and str(value).strip()
	)

	user_message = escape_html(_ERROR_USER_MESSAGES.get(error_code, message))

	content = f"""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
#footer,.web-footer,header,.navbar,nav,.page-header{{display:none!important}}
#page-content,#body,.container,.container-fluid{{padding:0!important;margin:0!important;max-width:100%!important;background:transparent!important;border:none!important;box-shadow:none!important}}
body{{
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif!important;
  background:
    radial-gradient(58% 46% at 10% 28%,rgba(248,113,113,.14) 0%,transparent 70%),
    radial-gradient(42% 34% at 86% 60%,rgba(96,165,250,.16) 0%,transparent 70%),
    linear-gradient(168deg,#f4f7fb 0%,#fdf8f8 45%,#f4f7fa 100%)!important;
  -webkit-font-smoothing:antialiased;
}}
.cv-error-shell{{
  min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
}}
.cv-error-card{{
  width:100%;max-width:460px;
  background:rgba(255,255,255,.80);
  backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  border:1px solid rgba(255,255,255,.55);
  border-radius:18px;
  box-shadow:0 16px 48px rgba(15,23,42,.10),0 2px 8px rgba(15,23,42,.06);
  padding:36px 32px 32px;
}}
.cv-icon-wrap{{
  width:52px;height:52px;border-radius:14px;
  background:linear-gradient(135deg,rgba(239,68,68,.12),rgba(220,38,38,.06));
  border:1px solid rgba(239,68,68,.18);
  display:flex;align-items:center;justify-content:center;
  margin-bottom:20px;
}}
.cv-icon-wrap svg{{width:26px;height:26px;color:#dc2626}}
.cv-error-card h2{{font-size:20px;font-weight:700;color:#1e293b;margin:0 0 8px;line-height:1.3}}
.cv-subtitle{{font-size:14px;color:#475467;line-height:1.6;margin-bottom:20px}}
.cv-meta{{
  background:rgba(248,250,252,.80);border:1px solid rgba(226,232,240,.70);
  border-radius:10px;padding:14px 16px;margin-bottom:20px;
  display:flex;flex-direction:column;gap:8px;
}}
.cv-meta-row{{display:flex;align-items:baseline;gap:8px;font-size:13px}}
.cv-meta-label{{font-weight:600;color:#64748b;min-width:80px;flex-shrink:0}}
.cv-meta-val{{color:#334155;font-family:ui-monospace,monospace;font-size:12px;word-break:break-all}}
.cv-req-id{{
  font-size:11px;
  background:rgba(241,245,249,.90);border:1px dashed rgba(203,213,225,.80);
  border-radius:6px;padding:8px 12px;color:#64748b;
  display:flex;align-items:center;justify-content:space-between;gap:8px;
  margin-bottom:24px;
}}
.cv-req-id-label{{font-weight:600;color:#475467}}
.cv-req-id-val{{font-family:ui-monospace,monospace;font-size:12px;letter-spacing:.5px}}
.cv-help{{font-size:12px;color:#94a3b8;line-height:1.6;margin-bottom:24px}}
.cv-btn{{
  display:inline-flex;align-items:center;gap:6px;
  padding:9px 18px;border-radius:10px;font-size:14px;font-weight:600;
  text-decoration:none;cursor:pointer;transition:all .16s ease;
  background:transparent;border:1.5px solid rgba(203,213,225,.80);color:#475467;
}}
.cv-btn:hover{{background:rgba(241,245,249,.90);border-color:#94a3b8;color:#334155}}
.cv-brand{{text-align:center;margin-top:28px;font-size:11px;color:#cbd5e1;letter-spacing:.3px}}
</style>
<div class="cv-error-shell">
  <div class="cv-error-card">
    <div class="cv-icon-wrap">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
      </svg>
    </div>
    <h2>Sign-in couldn't be completed</h2>
    <p class="cv-subtitle">{user_message}</p>
    <div class="cv-meta">
      <div class="cv-meta-row"><span class="cv-meta-label">Error</span><span class="cv-meta-val">{escape_html(error_code)}</span></div>
      {details_rows}
    </div>
    <div class="cv-req-id">
      <span class="cv-req-id-label">Request ID</span>
      <span class="cv-req-id-val">{escape_html(request_id)}</span>
    </div>
    <p class="cv-help">Share the request ID with support if you need help resolving this.</p>
    <a href="/" class="cv-btn">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
      </svg>
      Back to safety
    </a>
    <div class="cv-brand">Powered by CareVerse HQ</div>
  </div>
</div>"""

	frappe.local.response.http_status_code = 403
	frappe.respond_as_web_page(_("Sign-in error — CareVerse"), content, indicator_color="red")


def _get_managed_oidc_app(client_id: str):
	if not client_id:
		return None
	if not frappe.db.exists("DocType", "OIDC App"):
		return None
	try:
		return frappe.db.get_value(
			"OIDC App",
			{"oauth_client": client_id},
			["name", "app_name", "status"],
			as_dict=True,
		)
	except Exception:
		return None


def _is_health_professional_user_eligible(user: str) -> Tuple[bool, str, Dict[str, str]]:
	if not user or user == "Guest":
		return False, _("Please sign in to continue"), {}

	is_enabled = int(frappe.db.get_value("User", user, "enabled") or 0)
	if not is_enabled:
		return False, _("Your account can't sign in right now. Contact support."), {"user": user}

	if not frappe.db.exists("DocType", "Health Professional"):
		return False, _("Sign-in is temporarily unavailable"), {"user": user}

	hp = frappe.db.get_value("Health Professional", {"user": user}, ["name", "status"], as_dict=True)
	if not hp:
		return False, _("Your account isn't set up for this sign-in yet. Contact support."), {"user": user}

	hp_status = (hp.status or "").strip()
	if not hp_status:
		return (
			False,
			_("Your profile setup is incomplete. Please contact support"),
			{"health_professional": hp.name},
		)

	if hp_status.lower() not in ACTIVE_HEALTH_PROFESSIONAL_STATUSES:
		return (
			False,
			_("Your profile isn't active for sign-in. Contact support."),
			{"health_professional": hp.name, "status": hp_status},
		)

	return True, "", {"health_professional": hp.name, "status": hp_status}


def _extract_client_id_from_basic_auth() -> Optional[str]:
	auth_header = frappe.get_request_header("Authorization") or ""
	if not auth_header.lower().startswith("basic "):
		return None
	try:
		encoded = auth_header.split(" ", 1)[1].strip()
		decoded = base64.b64decode(encoded).decode("utf-8")
		client_id, _sep, _secret = decoded.partition(":")
		client_id = client_id.strip()
		return client_id or None
	except Exception:
		return None


_SCOPE_META: Dict[str, Dict[str, str]] = {
	"openid": {
		"label": "Basic identity",
		"desc": "Confirms who you are",
		"icon": '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>',
	},
	"profile": {
		"label": "Name & photo",
		"desc": "Your full name and profile picture",
		"icon": '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>',
	},
	"email": {
		"label": "Email address",
		"desc": "Your registered email",
		"icon": '<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/>',
	},
	"roles": {
		"label": "Roles & permissions",
		"desc": "Which roles you hold in the system",
		"icon": '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>',
	},
}

_SCOPE_DEFAULT_ICON = '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z"/>'


def _render_consent_page(app_name: str, scopes: List[str], success_url: str, failure_url: str) -> str:
	scope_rows = ""
	seen: set = set()
	for scope in scopes:
		key = scope.strip().lower()
		if key in seen:
			continue
		seen.add(key)
		meta = _SCOPE_META.get(key)
		if meta:
			label = escape_html(meta["label"])
			desc = escape_html(meta["desc"])
			icon_path = meta["icon"]
		else:
			label = escape_html(scope.title())
			desc = ""
			icon_path = _SCOPE_DEFAULT_ICON
		desc_html = f'<span class="cv-scope-desc">{desc}</span>' if desc else ""
		scope_rows += f"""
    <div class="cv-scope-row">
      <span class="cv-scope-icon">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">{icon_path}</svg>
      </span>
      <span class="cv-scope-text"><span class="cv-scope-label">{label}</span>{desc_html}</span>
    </div>"""

	safe_app = escape_html(app_name or "An app")
	safe_success = escape_html(success_url)
	safe_failure = escape_html(failure_url or "/")

	return f"""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
#footer,.web-footer,header,.navbar,nav,.page-header{{display:none!important}}
#page-content,#body,.container,.container-fluid{{padding:0!important;margin:0!important;max-width:100%!important;background:transparent!important;border:none!important;box-shadow:none!important}}
body{{
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif!important;
  background:
    radial-gradient(58% 46% at 10% 28%,rgba(129,140,248,.20) 0%,transparent 70%),
    radial-gradient(42% 34% at 86% 60%,rgba(96,165,250,.20) 0%,transparent 70%),
    linear-gradient(168deg,#f4f7fb 0%,#f8faf7 45%,#f4f7fa 100%)!important;
  -webkit-font-smoothing:antialiased;
}}
.cv-consent-shell{{
  min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
}}
.cv-consent-card{{
  width:100%;max-width:440px;
  background:rgba(255,255,255,.82);
  backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  border:1px solid rgba(255,255,255,.55);
  border-radius:18px;
  box-shadow:0 16px 48px rgba(15,23,42,.10),0 2px 8px rgba(15,23,42,.06);
  padding:36px 32px 32px;
}}
.cv-consent-logo{{
  width:48px;height:48px;border-radius:12px;
  background:linear-gradient(135deg,rgba(22,119,255,.14),rgba(114,46,209,.10));
  border:1px solid rgba(22,119,255,.18);
  display:flex;align-items:center;justify-content:center;
  margin-bottom:20px;
}}
.cv-consent-logo svg{{width:24px;height:24px;color:#1677ff}}
.cv-consent-card h2{{font-size:20px;font-weight:700;color:#1e293b;margin:0 0 6px;line-height:1.3}}
.cv-consent-subtitle{{font-size:14px;color:#64748b;margin:0 0 22px;line-height:1.5}}
.cv-consent-subtitle strong{{color:#334155;font-weight:600}}
.cv-divider{{height:1px;background:rgba(226,232,240,.80);margin-bottom:18px}}
.cv-scope-list{{display:flex;flex-direction:column;gap:12px;margin-bottom:18px}}
.cv-scope-row{{display:flex;align-items:flex-start;gap:10px}}
.cv-scope-icon{{
  width:30px;height:30px;border-radius:8px;flex-shrink:0;
  background:rgba(22,119,255,.07);border:1px solid rgba(22,119,255,.12);
  display:flex;align-items:center;justify-content:center;margin-top:1px;
}}
.cv-scope-icon svg{{color:#1677ff}}
.cv-scope-text{{display:flex;flex-direction:column;gap:2px}}
.cv-scope-label{{font-size:13px;font-weight:600;color:#1e293b;line-height:1.4}}
.cv-scope-desc{{font-size:12px;color:#94a3b8;line-height:1.4}}
.cv-security-note{{
  font-size:12px;color:#94a3b8;line-height:1.6;
  padding:10px 12px;border-radius:8px;
  background:rgba(241,245,249,.70);border:1px solid rgba(226,232,240,.60);
  margin-bottom:22px;
}}
.cv-consent-actions{{display:flex;flex-direction:column;gap:10px}}
.cv-btn-allow{{
  display:flex;align-items:center;justify-content:center;gap:6px;
  padding:10px 18px;border-radius:10px;font-size:14px;font-weight:600;
  background:linear-gradient(135deg,#1677ff,#0958d9);color:#fff;
  border:none;cursor:pointer;transition:all .18s ease;text-decoration:none;
  box-shadow:0 2px 8px rgba(22,119,255,.28);
}}
.cv-btn-allow:hover{{background:linear-gradient(135deg,#4096ff,#1677ff);box-shadow:0 4px 14px rgba(22,119,255,.38)}}
.cv-btn-deny{{
  display:flex;align-items:center;justify-content:center;
  padding:9px 18px;border-radius:10px;font-size:14px;font-weight:500;
  background:transparent;border:1.5px solid rgba(203,213,225,.80);color:#64748b;
  cursor:pointer;transition:all .16s ease;text-decoration:none;
}}
.cv-btn-deny:hover{{background:rgba(241,245,249,.90);border-color:#94a3b8;color:#475467}}
.cv-brand{{text-align:center;margin-top:24px;font-size:11px;color:#cbd5e1;letter-spacing:.3px}}
</style>
<div class="cv-consent-shell">
  <div class="cv-consent-card">
    <div class="cv-consent-logo">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/>
      </svg>
    </div>
    <h2>Allow access?</h2>
    <p class="cv-consent-subtitle"><strong>{safe_app}</strong> wants to access your account</p>
    <div class="cv-divider"></div>
    <div class="cv-scope-list">
      {scope_rows}
    </div>
    <p class="cv-security-note">CareVerse will not share your credentials or password with this app.</p>
    <div class="cv-consent-actions">
      <a href="{safe_success}" class="cv-btn-allow">Allow access</a>
      <a href="{safe_failure}" class="cv-btn-deny">No, cancel</a>
    </div>
    <div class="cv-brand">Powered by CareVerse HQ</div>
  </div>
</div>"""


def _resolve_client_id_from_token_request() -> Optional[str]:
	form = frappe.form_dict or {}

	client_id = (form.get("client_id") or "").strip()
	if client_id:
		return client_id

	code = (form.get("code") or "").strip()
	if code and frappe.db.exists("OAuth Authorization Code", code):
		client_id = frappe.db.get_value("OAuth Authorization Code", code, "client")
		if client_id:
			return str(client_id)

	refresh_token = (form.get("refresh_token") or "").strip()
	if refresh_token:
		client_id = frappe.db.get_value("OAuth Bearer Token", {"refresh_token": refresh_token}, "client")
		if client_id:
			return str(client_id)

	return _extract_client_id_from_basic_auth()


@frappe.whitelist(allow_guest=True)
def authorize(**kwargs):
	"""Admin Central wrapper for Frappe authorize endpoint."""

	if frappe.session.user == "Guest":
		frappe.local.response["type"] = "redirect"
		frappe.local.response["location"] = "/login?" + urlencode({"redirect-to": frappe.request.url})
		return

	client_id = (kwargs.get("client_id") or frappe.form_dict.get("client_id") or "").strip()
	if not client_id:
		_render_authorize_error(
			"invalid_request",
			_("This sign-in request is incomplete. Please start again from the app"),
		)
		return

	managed_app = _get_managed_oidc_app(client_id)
	if managed_app:
		if managed_app.status != "Active":
			_render_authorize_error(
				"invalid_client",
				_("This sign-in app is unavailable right now."),
				{"app": managed_app.app_name, "status": managed_app.status},
			)
			return

		is_eligible, reason, metadata = _is_health_professional_user_eligible(frappe.session.user)
		if not is_eligible:
			_render_authorize_error("access_denied", reason, metadata)
			return

	success_url = "/api/method/frappe.integrations.oauth2.approve?" + encode_params(sanitize_kwargs(kwargs))

	redirect_uri = frappe.form_dict.get("redirect_uri", "")
	state = frappe.form_dict.get("state", "")
	failure_query = {"error": "access_denied"}
	if state:
		failure_query["state"] = state
	if redirect_uri:
		separator = "&" if "?" in redirect_uri else "?"
		failure_url = f"{redirect_uri}{separator}{encode_params(failure_query)}"
	else:
		failure_url = ""

	try:
		r = frappe.request
		(
			scopes,
			frappe.flags.oauth_credentials,
		) = get_oauth_server().validate_authorization_request(r.url, r.method, r.get_data(), r.headers)

		skip_auth = frappe.db.get_value(
			"OAuth Client",
			frappe.flags.oauth_credentials["client_id"],
			"skip_authorization",
		)
		unrevoked_tokens = frappe.db.exists("OAuth Bearer Token", {"status": "Active", "user": frappe.session.user})

		if skip_auth or (get_oauth_settings().skip_authorization == "Auto" and unrevoked_tokens):
			frappe.local.response["type"] = "redirect"
			frappe.local.response["location"] = success_url
			return

		app_display_name = (
			frappe.db.get_value("OAuth Client", client_id, "app_name")
			or (managed_app.app_name if managed_app else None)
			or client_id
		)
		resp_html = _render_consent_page(app_display_name, scopes, success_url, failure_url)
		frappe.respond_as_web_page(frappe._("Confirm Access — CareVerse"), resp_html, primary_action=None)
		return
	except (FatalClientError, OAuth2Error) as exc:
		error_code = getattr(exc, "error", "invalid_request")
		message = getattr(exc, "description", _("Invalid sign-in request"))
		_render_authorize_error(error_code, message)
		return


@frappe.whitelist(allow_guest=True)
def get_token(*args, **kwargs):
	"""Admin Central wrapper for Frappe token endpoint."""

	client_id = _resolve_client_id_from_token_request()
	if client_id:
		managed_app = _get_managed_oidc_app(client_id)
		if managed_app and managed_app.status != "Active":
			_json_error_response("invalid_client", _("This sign-in app is unavailable right now."), status_code=403)
			return

		code = (frappe.form_dict.get("code") or "").strip()
		if code and frappe.db.exists("OAuth Authorization Code", code):
			code_user = frappe.db.get_value("OAuth Authorization Code", code, "user")
			if code_user:
				is_eligible, reason, _metadata = _is_health_professional_user_eligible(code_user)
				if not is_eligible:
					_json_error_response("access_denied", reason, status_code=403)
					return

	return frappe_get_token(*args, **kwargs)
