"""Custom landing page for CareVerse HQ"""
import frappe
from frappe import _

from careverse_hq.branding import get_configured_app_brand

no_cache = True

def get_context(context):
	"""Setup context for landing page"""

	# Check if user is logged in
	if frappe.session.user != "Guest":
		# Redirect logged-in users to dashboard
		frappe.local.flags.redirect_location = "/admin-central"
		raise frappe.Redirect

	# Page configuration
	context.no_cache = 1
	context.no_header = True
	context.no_breadcrumbs = True
	brand = get_configured_app_brand()
	context.title = _("Healthcare Management Platform - {0}").format(brand["app_name"])

	# Branding
	context.app_name = brand["app_name"]
	context.logo = brand["logo"]
	context.brand_initials = brand["initials"]

	# CTA configuration
	context.cta_text = "Get Started"
	context.cta_link = "/login"
	context.cta_secondary_text = "Sign In"
	context.cta_secondary_link = "/login"

	# Features list
	context.features = [
		{
			"icon": "📋",
			"title": "License Management",
			"description": "Automated tracking, renewal reminders, and compliance verification for all professional licenses."
		},
		{
			"icon": "✓",
			"title": "Compliance Tracking",
			"description": "Real-time monitoring of regulatory requirements with automated alerts and reporting."
		},
		{
			"icon": "📊",
			"title": "Regulatory Reporting",
			"description": "Comprehensive analytics and reporting tools for regulatory submissions and audits."
		},
		{
			"icon": "🏥",
			"title": "Facility Management",
			"description": "Centralized management of multiple facilities with role-based access control."
		},
		{
			"icon": "👥",
			"title": "Employee Credentialing",
			"description": "Streamlined credentialing workflows for healthcare professionals and staff."
		},
		{
			"icon": "🔒",
			"title": "Secure & Compliant",
			"description": "HIPAA-compliant platform with enterprise-grade security and data protection."
		}
	]

	return context
