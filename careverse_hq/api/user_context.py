"""
User Context API

This module provides endpoints for fetching user's Company permission
and available Health Facilities scoped to that Company.
"""

import frappe
from frappe import _
from typing import Dict, List, Optional
from .utils import api_response


@frappe.whitelist()
def get_user_company_context():
	"""
	Get user's Company permission and available facilities.

	Returns:
		{
			"success": bool,
			"has_permission": bool,
			"company": {...} or None,
			"facilities": [...] or []
		}
	"""
	try:
		user = frappe.session.user

		# Debug logging
		frappe.logger().info(f"[USER CONTEXT] Checking permissions for user: {user}")

		# Check for Company user permission
		user_permissions = frappe.get_all(
			"User Permission",
			filters={
				"user": user,
				"allow": "Company"
			},
			fields=["for_value", "is_default"],
			order_by="is_default desc",
			limit=1
		)

		# Debug logging
		frappe.logger().info(f"[USER CONTEXT] Found {len(user_permissions)} Company permissions")
		if user_permissions:
			frappe.logger().info(f"[USER CONTEXT] Company: {user_permissions[0].for_value}")

		if not user_permissions:
			return api_response(
				success=True,
				data={
					"has_permission": False,
					"company": None,
					"facilities": []
				}
			)

		company_name = user_permissions[0].for_value

		# Get company details
		company_doc = frappe.get_doc("Company", company_name)

		# Get facilities for this company (filtered by organization_company)
		facilities = frappe.get_all(
			"Health Facility",
			filters={"organization_company": company_name},
			fields=[
				"hie_id",
				"facility_name",
				"facility_mfl",
				"facility_type",
				"category",
				"organization_company",
				"region_company",
				"county",
				"sub_county"
			],
			order_by="facility_name asc"
		)

		return api_response(
			success=True,
			data={
				"has_permission": True,
				"company": {
					"name": company_doc.name,
					"company_name": company_doc.company_name,
					"abbr": company_doc.abbr,
					"country": company_doc.country if hasattr(company_doc, "country") else None,
					"default_currency": company_doc.default_currency
				},
				"facilities": facilities
			}
		)

	except frappe.PermissionError:
		return api_response(
			success=False,
			message=_("Access denied to Company information"),
			status_code=403
		)
	except Exception as e:
		frappe.log_error(
			message=frappe.get_traceback(),
			title="User Context API Error"
		)
		return api_response(
			success=False,
			message=str(e),
			status_code=500
		)


@frappe.whitelist()
def get_facilities_for_company(company: str):
	"""
	Get all facilities for a specific company.
	Used for refresh/reload scenarios.

	Args:
		company: Company name

	Returns:
		{
			"success": bool,
			"facilities": [...]
		}
	"""
	try:
		user = frappe.session.user

		# Verify user has permission for this company
		user_permissions = frappe.get_all(
			"User Permission",
			filters={
				"user": user,
				"allow": "Company",
				"for_value": company
			},
			limit=1
		)

		if not user_permissions:
			return api_response(
				success=False,
				message=_("You do not have permission for this Company"),
				status_code=403
			)

		# Get facilities for this company
		facilities = frappe.get_all(
			"Health Facility",
			filters={"organization_company": company},
			fields=[
				"hie_id",
				"facility_name",
				"facility_mfl",
				"facility_type",
				"category",
				"organization_company",
				"region_company",
				"county",
				"sub_county"
			],
			order_by="facility_name asc"
		)

		return api_response(
			success=True,
			data={
				"facilities": facilities
			}
		)

	except frappe.PermissionError:
		return api_response(
			success=False,
			message=_("Access denied to facility information"),
			status_code=403
		)
	except Exception as e:
		frappe.log_error(
			message=frappe.get_traceback(),
			title="Get Facilities API Error"
		)
		return api_response(
			success=False,
			message=str(e),
			status_code=500
		)
