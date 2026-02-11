"""Custom login page for CareVerse HQ"""
import frappe
from frappe import _
from frappe.utils.oauth import get_oauth2_providers
from frappe.core.doctype.navbar_settings.navbar_settings import get_app_logo
from urllib.parse import urlparse, parse_qs

no_cache = True  # CRITICAL: Disable caching for auth pages

def get_context(context):
	"""Setup context for custom login page"""

	# Validate and sanitize redirect URL (security critical)
	redirect_to = frappe.local.request.args.get("redirect-to")
	redirect_to = sanitize_redirect(redirect_to)

	# Check if user is already logged in
	if frappe.session.user != "Guest":
		redirect_to = redirect_to or "/admin-central"
		frappe.local.flags.redirect_location = redirect_to
		raise frappe.Redirect

	# Page configuration
	context.no_cache = 1
	context.no_header = True
	context.no_breadcrumbs = True
	context.title = _("Sign In - CareVerse HQ")

	# Branding
	context.app_name = frappe.get_website_settings("app_name") or "CareVerse HQ"
	context.logo = get_app_logo() or "/assets/careverse_hq/images/logo.svg"

	# Authentication settings
	context.disable_signup = frappe.get_website_settings("disable_signup") or 0
	context.disable_user_pass_login = frappe.get_system_settings("disable_user_pass_login") or 0
	context.login_with_email_link = frappe.get_system_settings("login_with_email_link") or 0

	# Login label (Email / Username / Mobile)
	login_label = []
	if frappe.utils.cint(frappe.get_system_settings("allow_login_using_mobile_number")):
		login_label.append(_("Mobile"))
	if frappe.utils.cint(frappe.get_system_settings("allow_login_using_user_name")):
		login_label.append(_("Username"))
	login_label.append(_("Email"))
	context.login_label = f" {_('or')} ".join(login_label)
	context.login_name_placeholder = login_label[0]

	# Social login providers (Google, Microsoft, Custom)
	context.provider_logins = get_oauth2_providers()

	# LDAP settings (if enabled)
	from frappe.integrations.doctype.ldap_settings.ldap_settings import LDAPSettings
	if frappe.db.get_value("LDAP Settings", "LDAP Settings", "enabled"):
		context.ldap_settings = LDAPSettings.get_ldap_client_settings()

	# Redirect parameter for post-login
	context.redirect_to = redirect_to or "/admin-central"

	return context

def sanitize_redirect(redirect_url):
	"""Prevent open redirect vulnerabilities"""
	if not redirect_url:
		return None

	# Parse URLs
	parsed_redirect = urlparse(redirect_url)
	parsed_request = urlparse(frappe.local.request.url)

	# Block external URLs
	if parsed_redirect.scheme or parsed_redirect.netloc:
		if parsed_request.netloc != parsed_redirect.netloc:
			frappe.local.flags.redirect_location = "/"
			frappe.throw(_("Invalid redirect URL"), frappe.InvalidStatusError)
			return None

	# Only allow internal paths
	if not redirect_url.startswith('/'):
		redirect_url = '/' + redirect_url

	# Whitelist known safe paths
	safe_paths = ['/admin-central', '/desk', '/api', '/app']
	is_safe = any(redirect_url.startswith(path) for path in safe_paths)

	if not is_safe and redirect_url not in ['/', '/home']:
		return '/admin-central'

	return redirect_url
