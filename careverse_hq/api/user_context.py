"""
User Context API

This module provides endpoints for fetching user's Company permission
and available Health Facilities scoped to that Company.
"""

import frappe
from frappe import _
from typing import Optional
import base64
from frappe.utils.file_manager import save_file
from careverse_hq.branding import get_configured_app_brand
from .utils import api_response


def _get_company_scoped_facilities(company_name: Optional[str] = None):
	"""Return facilities visible to the current user via Frappe permissions."""
	fields = [
		"hie_id",
		"facility_name",
		"facility_mfl",
		"facility_type",
		"category",
		"organization_company",
		"region_company",
		"county",
		"sub_county",
	]

	query_kwargs = {
		"fields": fields,
		"order_by": "facility_name asc",
		"limit_page_length": 0,
	}

	return frappe.get_list("Health Facility", **query_kwargs)


def _get_app_brand():
	"""Return the global product brand configured for website/app chrome."""
	return get_configured_app_brand()


@frappe.whitelist(allow_guest=True)
def get_app_branding():
	"""Return public-facing brand metadata for login and guest surfaces."""
	return api_response(success=True, data=_get_app_brand())


@frappe.whitelist()
def get_user_company_context():
	"""
	Determine the calling user's access mode for Admin Central.

	Access modes (evaluated in order):
	  1. **company**   – user has a Company User Permission → tenant-scoped.
	  2. **oversight**  – user holds a role listed in Admin Central Settings →
	     full cross-tenant visibility (data scoped by Frappe Role Permissions).
	  3. **none**       – neither of the above → blocked.

	Both *company* and *oversight* users get the same frontend experience.
	Facilities are loaded via ``frappe.get_list`` so Frappe's native
	permission model (Role Permissions + User Permissions) governs what
	records each user sees.
	"""
	try:
		user = frappe.session.user

		# ── 1. Company User Permission check ──────────────────────────
		company_doc = None
		company_permissions = frappe.get_all(
			"User Permission",
			filters={"user": user, "allow": "Company"},
			fields=["for_value", "is_default"],
			order_by="is_default desc",
			limit=5,
		)
		for perm in company_permissions:
			company_name = perm.get("for_value")
			if not company_name:
				continue
			if not frappe.db.exists("Company", company_name):
				continue
			company_doc = frappe.db.get_value(
				"Company",
				company_name,
				["name", "company_name", "abbr", "company_logo", "country", "default_currency"],
				as_dict=True,
			)
			if company_doc:
				break

		has_company_permission = bool(company_doc)

		# ── 2. Oversight role check (settings-driven) ─────────────────
		from careverse_hq.careverse_hq.doctype.admin_central_settings.admin_central_settings import (
			AdminCentralSettings,
		)
		is_oversight_user = AdminCentralSettings.is_oversight_user(user)

		# ── 3. Resolve access mode ────────────────────────────────────
		if has_company_permission:
			access_mode = "company"
		elif is_oversight_user:
			access_mode = "oversight"
		else:
			access_mode = "none"

		has_permission = access_mode != "none"

		# ── 4. Health Facility data (only if DocType exists) ──────────
		_hf_doctype_exists = frappe.db.exists("DocType", "Health Facility")
		has_health_facility_permission = bool(
			_hf_doctype_exists
			and frappe.db.exists("User Permission", {"user": user, "allow": "Health Facility"})
		)

		facilities = []
		if has_permission and _hf_doctype_exists:
			facilities = _get_company_scoped_facilities(company_doc.get("name") if company_doc else None)

		return api_response(
			success=True,
			data={
				"has_permission": has_permission,
				"has_company_permission": has_company_permission,
				"has_health_facility_permission": has_health_facility_permission,
				"is_oversight_user": is_oversight_user,
				"access_mode": access_mode,
				"company": company_doc,
				"brand": _get_app_brand(),
				"facilities": facilities,
			},
		)

	except frappe.PermissionError:
		return api_response(
			success=False,
			message=_("You do not have the required permissions to access this resource. Please contact your administrator."),
			status_code=403,
		)
	except Exception as e:
		frappe.log_error(
			message=frappe.get_traceback(),
			title="User Context API Error",
		)
		return api_response(
			success=False,
			message=_("Something went wrong while loading your account context. Please try refreshing the page or contact support if the issue persists."),
			status_code=500,
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

		# Verify user has Company permission for this company.
		has_company_permission = bool(
			frappe.db.exists(
				"User Permission",
				{"user": user, "allow": "Company", "for_value": company},
			)
		)

		if not has_company_permission:
			return api_response(
				success=False,
				message=_("You do not have permission for this Company"),
				status_code=403
			)

		# Health Facility list: no filters — Frappe User Permissions on Health Facility apply
		facilities = []
		if frappe.db.exists("DocType", "Health Facility"):
			facilities = _get_company_scoped_facilities(company)

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
	except Exception:
		frappe.log_error(
			message=frappe.get_traceback(),
			title="Get Facilities API Error"
		)
		return api_response(
			success=False,
			message=_("Unable to load facility data. Please try again or contact support."),
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
	except Exception:
		frappe.log_error(
			message=frappe.get_traceback(),
			title="Get My Profile API Error"
		)
		return api_response(
			success=False,
			message=_("Unable to load your profile. Please try again."),
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
	except Exception:
		frappe.log_error(
			message=frappe.get_traceback(),
			title="Set My Profile Avatar API Error"
		)
		return api_response(
			success=False,
			message=_("Unable to update your avatar. Please try again."),
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
	except Exception:
		frappe.log_error(
			message=frappe.get_traceback(),
			title="Upload My Profile Avatar API Error"
		)
		return api_response(
			success=False,
			message=_("Unable to upload your avatar. Please try again."),
			status_code=500
		)
