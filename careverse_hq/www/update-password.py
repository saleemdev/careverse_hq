"""Custom password reset/update page for CareVerse HQ"""
import frappe
from frappe import _

from careverse_hq.branding import get_configured_app_brand

no_cache = True

def get_context(context):
	"""Add branding to Frappe's default password reset page"""

	# Get the reset key from URL (if present)
	context.key = frappe.form_dict.get("key")

	# Branding
	brand = get_configured_app_brand()
	context.app_name = brand["app_name"]
	context.logo = brand["logo"]
	context.brand_initials = brand["initials"]

	# Page content
	if context.key:
		context.title = _("Reset Your Password - {0}").format(brand["app_name"])
		context.page_title = _("Reset Your Password")
		context.page_subtitle = _("Create a strong new password for your account")
	else:
		context.title = _("Forgot Password - {0}").format(brand["app_name"])
		context.page_title = _("Forgot Your Password?")
		context.page_subtitle = _("Enter your email to receive a password reset link")

	context.no_header = True
	context.no_breadcrumbs = True

	return context
