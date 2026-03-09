"""
User Context API

This module provides endpoints for fetching user's Company permission
and available Health Facilities scoped to that Company.
"""

import frappe
from frappe import _
from typing import Dict, List, Optional
import base64
from frappe.utils.file_manager import save_file
from .utils import api_response


@frappe.whitelist()
def get_user_company_context():
	"""
	Get user's Company (if any) and Health Facilities. Facilities are a simple
	frappe.get_list("Health Facility"); Frappe User Permissions apply automatically.
	"""
	try:
		user = frappe.session.user

		# Simple list of Health Facilities (User Permissions on Health Facility apply)
		facilities = frappe.get_list(
			"Health Facility",
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

		# Optional: Company from User Permission (for dashboard/other UI)
		company_doc = None
		user_permissions = frappe.get_all(
			"User Permission",
			filters={"user": user, "allow": "Company"},
			fields=["for_value", "is_default"],
			order_by="is_default desc",
			limit=1
		)
		if user_permissions:
			try:
				company_doc = frappe.get_doc("Company", user_permissions[0].for_value)
			except Exception:
				pass

		return api_response(
			success=True,
			data={
				"has_permission": True,
				"company": {
					"name": company_doc.name,
					"company_name": company_doc.company_name,
					"abbr": company_doc.abbr,
					"company_logo": getattr(company_doc, "company_logo", None),
					"country": getattr(company_doc, "country", None),
					"default_currency": getattr(company_doc, "default_currency", None),
				} if company_doc else None,
				"facilities": facilities,
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

		# Health Facility list: no filters — Frappe User Permissions on Health Facility apply
		facilities = frappe.get_list(
			"Health Facility",
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


@frappe.whitelist()
def get_my_profile():
	"""Return the logged-in user's profile details."""
	try:
		user = frappe.session.user
		if not user or user == "Guest":
			return api_response(
				success=False,
				message=_("Authentication required"),
				status_code=401
			)

		user_doc = frappe.get_doc("User", user)

		user_permissions = frappe.get_all(
			"User Permission",
			filters={"user": user_doc.name},
			fields=["allow", "for_value", "is_default", "applicable_for"],
			order_by="allow asc, is_default desc, for_value asc",
		)

		return api_response(
			success=True,
			data={
				"name": user_doc.name,
				"email": user_doc.email,
				"full_name": user_doc.full_name,
				"first_name": user_doc.first_name,
				"last_name": user_doc.last_name,
				"phone": user_doc.phone,
				"mobile_no": user_doc.mobile_no,
				"user_image": user_doc.user_image,
				"roles": frappe.get_roles(user_doc.name),
				"user_permissions": user_permissions,
			}
		)
	except Exception as e:
		frappe.log_error(
			message=frappe.get_traceback(),
			title="Get My Profile API Error"
		)
		return api_response(
			success=False,
			message=str(e),
			status_code=500
		)


@frappe.whitelist(methods=["POST"])
def set_my_profile_avatar(file_url: Optional[str] = None):
	"""Set avatar URL for the logged-in user from an uploaded File URL."""
	try:
		user = frappe.session.user
		if not user or user == "Guest":
			return api_response(
				success=False,
				message=_("Authentication required"),
				status_code=401
			)

		file_url = (file_url or "").strip()
		if not file_url:
			return api_response(
				success=False,
				message=_("file_url is required"),
				status_code=400
			)

		user_doc = frappe.get_doc("User", user)
		user_doc.user_image = file_url
		user_doc.save(ignore_permissions=True)
		frappe.db.commit()

		return api_response(
			success=True,
			message=_("Avatar updated successfully"),
			data={"user_image": file_url}
		)
	except Exception as e:
		frappe.log_error(
			message=frappe.get_traceback(),
			title="Set My Profile Avatar API Error"
		)
		return api_response(
			success=False,
			message=str(e),
			status_code=500
		)


@frappe.whitelist(methods=["POST"])
def upload_my_profile_avatar(
	file_name: Optional[str] = None,
	file_content_base64: Optional[str] = None
):
	"""Upload and assign avatar for the logged-in user."""
	try:
		user = frappe.session.user
		if not user or user == "Guest":
			return api_response(
				success=False,
				message=_("Authentication required"),
				status_code=401
			)

		file_name = (file_name or "").strip() or "avatar.png"
		file_content_base64 = (file_content_base64 or "").strip()
		if not file_content_base64:
			return api_response(
				success=False,
				message=_("file_content_base64 is required"),
				status_code=400
			)

		if "," in file_content_base64 and "base64" in file_content_base64[:64]:
			file_content_base64 = file_content_base64.split(",", 1)[1]

		try:
			file_bytes = base64.b64decode(file_content_base64)
		except Exception:
			return api_response(
				success=False,
				message=_("Invalid base64 file content"),
				status_code=400
			)

		file_doc = save_file(
			file_name,
			file_bytes,
			"User",
			user,
			is_private=0
		)

		user_doc = frappe.get_doc("User", user)
		user_doc.user_image = file_doc.file_url
		user_doc.save(ignore_permissions=True)
		frappe.db.commit()

		return api_response(
			success=True,
			message=_("Avatar updated successfully"),
			data={
				"user_image": file_doc.file_url,
				"file_name": file_doc.file_name,
			}
		)
	except Exception as e:
		frappe.log_error(
			message=frappe.get_traceback(),
			title="Upload My Profile Avatar API Error"
		)
		return api_response(
			success=False,
			message=str(e),
			status_code=500
		)
