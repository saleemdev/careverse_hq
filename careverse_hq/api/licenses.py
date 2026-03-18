"""
License Record API endpoints for F360 Central Administration

Provides APIs for:
- Getting licenses overview with statistics
- Getting detailed license information with child tables
- Facility-based filtering with permission checks
"""

from typing import Optional, List
import frappe
from frappe.desk.reportview import get_count
from .response import api_response
from .dashboard_utils import validate_user_facilities
from datetime import datetime, timedelta


@frappe.whitelist()
def get_licenses_overview(facilities: Optional[str] = None):
	"""
	Get licenses overview with statistics and list.

	Filters by user's Company and selected Facilities.
	Returns statistics (total, by status, by regulatory body, expiry alerts, payment status).

	Args:
		facilities: Comma-separated list of facility IDs to filter by

	Returns:
		dict: {
			"status": "success",
			"data": {
				"statistics": {...},
				"licenses": [...]
			}
		}
	"""
	try:
		# Parse and validate facilities
		license_filters = {"docstatus": 1}

		if facilities:
			facility_ids = [f.strip() for f in facilities.split(",") if f.strip()]
			valid_facility_ids = validate_user_facilities(facility_ids)
			if valid_facility_ids:
				license_filters["health_facility"] = ["in", valid_facility_ids]

		# Get all licenses (frappe.get_list applies User Permissions automatically)
		licenses = frappe.get_list(
			"License Record",
			filters=license_filters,
			fields=[
				"name", "health_facility", "facility_name", "license_type",
				"license_type_name", "license_number", "application_type",
				"status", "issue_date", "expiry_date", "regulatory_body",
				"license_fee", "license_fee_paid", "docstatus"
			],
			order_by="modified desc",
			limit_page_length=0
		)

		# Enrich with facility details
		facility_refs = list({l.get("health_facility") for l in licenses if l.get("health_facility")})
		facility_map = {}
		if facility_refs:
			facilities_data = frappe.get_list(
				"Health Facility",
				filters={"hie_id": ["in", facility_refs]},
				fields=["name", "hie_id", "facility_name"],
				limit_page_length=0
			)

			if len(facilities_data) < len(facility_refs):
				by_name_data = frappe.get_list(
					"Health Facility",
					filters={"name": ["in", facility_refs]},
					fields=["name", "hie_id", "facility_name"],
					limit_page_length=0
				)
				facilities_data.extend(by_name_data)

			for facility in facilities_data:
				if facility.get("name"):
					facility_map[facility["name"]] = facility
				if facility.get("hie_id"):
					facility_map[facility["hie_id"]] = facility

		for license_rec in licenses:
			facility_ref = license_rec.get("health_facility")
			facility = facility_map.get(facility_ref)
			if facility:
				license_rec["facility_name"] = license_rec.get("facility_name") or facility.get("facility_name") or facility_ref or "Unknown Facility"
				license_rec["facility_id"] = facility.get("hie_id") or ""
			else:
				license_rec["facility_name"] = license_rec.get("facility_name") or facility_ref or "Unknown Facility"
				license_rec["facility_id"] = ""

		# Calculate days to expiry for each license
		today = datetime.now().date()
		for license_rec in licenses:
			if license_rec.get("expiry_date"):
				expiry = datetime.fromisoformat(str(license_rec["expiry_date"])).date()
				days_to_expiry = (expiry - today).days
				license_rec["days_to_expiry"] = days_to_expiry
				license_rec["expiry_status"] = get_expiry_status(days_to_expiry)
			else:
				license_rec["days_to_expiry"] = None
				license_rec["expiry_status"] = None

		# Calculate statistics
		statistics = calculate_statistics(licenses)

		return api_response(
			success=True,
			data={
				"statistics": statistics,
				"licenses": licenses
			}
		)

	except Exception as e:
		frappe.log_error(message=frappe.get_traceback(), title="Licenses Overview API Error")
		return api_response(
			success=False,
			message=f"Error fetching licenses: {str(e)}",
			status_code=500
		)


@frappe.whitelist()
def get_license_detail(license_id: str):
	"""
	Get detailed license information including child tables.

	Args:
		license_id: License Record ID (e.g., LR-00001)

	Returns:
		dict: {
			"status": "success",
			"data": {
				"license": {...},
				"services": [...],
				"additional_information": [...],
				"compliance_documents": [...]
			}
		}
	"""
	try:
		# Permission check via Frappe's built-in permission framework
		if not frappe.db.exists("License Record", license_id):
			return api_response(success=False, message="License not found", status_code=404)

		if not frappe.has_permission("License Record", "read", license_id):
			return api_response(success=False, message="License not found or access denied", status_code=403)

		license_rec = frappe.get_doc("License Record", license_id)

		if license_rec.docstatus != 1:
			return api_response(
				success=False,
				message="License not found or is not in a valid state",
				status_code=404
			)

		# Get child table data (frappe.get_list applies User Permissions)
		services = frappe.get_list(
			"Available Services",
			filters={"parent": license_id, "parenttype": "License Record"},
			fields=["available_services", "is_available"],
			limit_page_length=0
		)

		additional_information = frappe.get_list(
			"License Additional Information",
			filters={"parent": license_id, "parenttype": "License Record"},
			fields=["title", "request_comment", "status", "requested_on", "provided_on", "response"],
			limit_page_length=0
		)

		compliance_documents = frappe.get_list(
			"License Record Documents",
			filters={"parent": license_id, "parenttype": "License Record"},
			fields=["document_type", "document_file"],
			limit_page_length=0
		)

		# Calculate days to expiry
		days_to_expiry = None
		expiry_status = None
		if license_rec.expiry_date:
			today = datetime.now().date()
			expiry = datetime.fromisoformat(str(license_rec.expiry_date)).date()
			days_to_expiry = (expiry - today).days
			expiry_status = get_expiry_status(days_to_expiry)

		# Build response
		license_data = license_rec.as_dict()
		license_data["days_to_expiry"] = days_to_expiry
		license_data["expiry_status"] = expiry_status

		return api_response(
			success=True,
			data={
				"license": license_data,
				"services": services,
				"additional_information": additional_information,
				"compliance_documents": compliance_documents
			}
		)

	except frappe.DoesNotExistError:
		return api_response(
			success=False,
			message="License not found",
			status_code=404
		)
	except Exception as e:
		frappe.log_error(message=frappe.get_traceback(), title="License Detail API Error")
		return api_response(
			success=False,
			message=f"Error fetching license: {str(e)}",
			status_code=500
		)


def calculate_statistics(licenses: List[dict]) -> dict:
	"""Calculate overview statistics from license list."""
	stats = {
		"total": len(licenses),
		"by_status": {},
		"by_regulatory_body": {},
		"expiry_alerts": {
			"expiring_30_days": 0,
			"expiring_60_days": 0,
			"expiring_90_days": 0,
			"expired": 0
		},
		"payment_status": {
			"paid": 0,
			"pending": 0
		}
	}

	for license_rec in licenses:
		# Count by status
		status = license_rec.get("status", "Unknown")
		stats["by_status"][status] = stats["by_status"].get(status, 0) + 1

		# Count by regulatory body
		regulator = license_rec.get("regulatory_body", "Unknown")
		if regulator:
			stats["by_regulatory_body"][regulator] = stats["by_regulatory_body"].get(regulator, 0) + 1

		# Count expiry alerts
		days_to_expiry = license_rec.get("days_to_expiry")
		if days_to_expiry is not None:
			if days_to_expiry < 0:
				stats["expiry_alerts"]["expired"] += 1
			elif days_to_expiry <= 30:
				stats["expiry_alerts"]["expiring_30_days"] += 1
			elif days_to_expiry <= 60:
				stats["expiry_alerts"]["expiring_60_days"] += 1
			elif days_to_expiry <= 90:
				stats["expiry_alerts"]["expiring_90_days"] += 1

		# Count payment status
		if license_rec.get("license_fee_paid"):
			stats["payment_status"]["paid"] += 1
		else:
			stats["payment_status"]["pending"] += 1

	return stats


def get_expiry_status(days_to_expiry: Optional[int]) -> Optional[str]:
	"""Get expiry status based on days to expiry."""
	if days_to_expiry is None:
		return None

	if days_to_expiry < 0:
		return "expired"
	elif days_to_expiry <= 30:
		return "expiring_soon"
	elif days_to_expiry <= 60:
		return "expiring_medium"
	elif days_to_expiry <= 90:
		return "expiring_future"
	else:
		return "active"
