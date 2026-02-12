"""Custom password reset/update page for CareVerse HQ"""
import frappe
from frappe import _
from frappe.core.doctype.navbar_settings.navbar_settings import get_app_logo

no_cache = True

def get_context(context):
	"""Add branding to Frappe's default password reset page"""

	# Get the reset key from URL (if present)
	context.key = frappe.form_dict.get("key")

	# Branding
	context.app_name = frappe.get_website_settings("app_name") or "CareVerse HQ"
	context.logo = get_app_logo() or "/assets/careverse_hq/images/logo.svg"

	# Page content
	if context.key:
		context.title = _("Reset Your Password - CareVerse HQ")
		context.page_title = _("Reset Your Password")
		context.page_subtitle = _("Create a strong new password for your account")
	else:
		context.title = _("Forgot Password - CareVerse HQ")
		context.page_title = _("Forgot Your Password?")
		context.page_subtitle = _("Enter your email to receive a password reset link")

	context.no_header = True
	context.no_breadcrumbs = True

	return context
