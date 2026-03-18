"""
Dashboard API

Provides RBAC-protected endpoints for F360 Central Executive Dashboard.
All endpoints filter data by Company (via User Permission) and optionally by Facilities.
"""

import frappe
from frappe import _
from typing import Optional, List, Dict
from frappe.utils import getdate, today, add_days, add_months, get_first_day, get_last_day
from collections import defaultdict
from .response import api_response
from .dashboard_utils import (
    _count,
    validate_user_facilities,
    generate_monthly_trend,
    get_period_dates,
    resolve_health_facility_reference,
)


def _normalize_optional_string(value: Optional[str]) -> Optional[str]:
    """Normalize optional string query parameters from HTTP requests."""
    if value is None:
        return None

    if isinstance(value, (dict, list)):
        return None

    normalized = str(value).strip()
    if not normalized or normalized.lower() in {"undefined", "null", "none"}:
        return None

    return normalized


def _build_affiliation_scope_filters(
    facilities: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
):
    """
    Build normalized Facility Affiliation filters with consistent scope behavior.
    Returns tuple(filters, is_empty_scope).
    """
    filters = {}

    facilities = _normalize_optional_string(facilities)
    date_from = _normalize_optional_string(date_from)
    date_to = _normalize_optional_string(date_to)

    if facilities:
        requested_facilities = [f.strip() for f in facilities.split(",") if f.strip()]
        if not requested_facilities:
            return {}, True

        facility_refs = set(requested_facilities)
        for facility_ref in requested_facilities:
            resolved = resolve_health_facility_reference(facility_ref)
            if resolved.get("facility_docname"):
                facility_refs.add(resolved["facility_docname"])
            if resolved.get("facility_id"):
                facility_refs.add(resolved["facility_id"])

        if not facility_refs:
            return {}, True

        filters["health_facility"] = ["in", list(facility_refs)]

    if date_from and date_to:
        filters["requested_date"] = ["between", [getdate(date_from), getdate(date_to)]]
    elif date_from:
        filters["requested_date"] = [">=", getdate(date_from)]
    elif date_to:
        filters["requested_date"] = ["<=", getdate(date_to)]

    return filters, False


@frappe.whitelist()
def get_employees(
    facilities: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None
):
    """
    Get paginated list of employees.

    NO default filters - Frappe User Permissions handle access.
    All filters are user-driven.

    Args:
        facilities: Comma-separated facility hie_ids (optional, user input)
        page: Page number for pagination
        page_size: Items per page
        search: Search by employee_name (optional, user input)
        department: Filter by department (optional, user input)
        status: Filter by status (optional, user input)
    """
    try:
        # Build filters - ONLY from user input
        filters = {}

        if department:
            filters["department"] = department

        if status:
            filters["status"] = status

        if search:
            filters["employee_name"] = ["like", f"%{search}%"]

        if facilities:
            facility_list = [f.strip() for f in facilities.split(",") if f.strip()]
            if facility_list:
                filters["custom_facility_id"] = ["in", facility_list]

        offset = (int(page) - 1) * int(page_size)

        # Get total count (Frappe automatically applies User Permissions)
        total_count = _count("Employee", filters=filters)

        # frappe.get_list automatically applies User Permissions
        employees = frappe.get_list(
            "Employee",
            filters=filters,
            fields=[
                "name", "employee_name", "designation", "department",
                "cell_number", "company_email", "image", "status",
                "custom_facility_name", "custom_is_licensed_practitioner"
            ],
            order_by="employee_name asc",
            limit_start=offset,
            limit_page_length=int(page_size)
        )

        # Calculate metrics
        metrics = {
            "total_employees": total_count,
            "active_employees": _count(
                "Employee",
                filters={**filters, "status": "Active"}
            ),
            "licensed_practitioners": _count(
                "Employee",
                filters={**filters, "custom_health_professional": ["is", "set"]}
            ),
            "departments_count": len(frappe.get_list(
                "Employee",
                filters=filters,
                fields=["department"],
                distinct=True,
                limit_page_length=0
            ))
        }

        return api_response(success=True, data={
            "items": employees,
            "total_count": total_count,
            "page": int(page),
            "page_size": int(page_size),
            "metrics": metrics
        })
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Get Employees API Error")
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_assets(
    facilities: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None
):
    """Get list of Health Automation Devices.

    RBAC: frappe.get_list applies User Permissions (including Company) automatically.

    Args:
        facilities: Comma-separated facility hie_ids (optional)
        page: Page number for pagination (default: 1)
        page_size: Number of records per page (default: 20)
        status: Filter by device status (optional)
    """
    try:
        filters = {}
        if status:
            filters["status"] = status

        if facilities:
            facility_ids = [f.strip() for f in facilities.split(",") if f.strip()]
            valid_facility_ids = validate_user_facilities(facility_ids)
            if valid_facility_ids:
                # Support devices storing either Health Facility docname or facility ID.
                facility_refs = set(valid_facility_ids)
                for facility in frappe.get_list(
                    "Health Facility",
                    filters={"hie_id": ["in", valid_facility_ids]},
                    fields=["name", "hie_id"],
                    limit_page_length=0
                ):
                    if facility.get("name"):
                        facility_refs.add(facility["name"])
                    if facility.get("hie_id"):
                        facility_refs.add(facility["hie_id"])

                filters["health_facility"] = ["in", list(facility_refs)]
            else:
                return api_response(success=True, data=[])

        offset = (int(page) - 1) * int(page_size)

        # Get total count for pagination
        total_count = _count("Health Automation Device", filters=filters)

        assets = frappe.get_list(
            "Health Automation Device",
            filters=filters,
            fields=["name", "device_id", "device_name", "category", "status", "health_facility"],
            limit_start=offset,
            limit_page_length=int(page_size)
        )

        # Enrich with facility_name + facility_id (HIE ID) for consistent list rendering.
        facility_refs = list({a.get("health_facility") for a in assets if a.get("health_facility")})
        facility_map = {}
        if facility_refs:
            facilities_data = frappe.get_list(
                "Health Facility",
                filters={"hie_id": ["in", facility_refs]},
                fields=["name", "hie_id", "facility_name"],
                limit_page_length=0
            )

            # Some records may store Health Facility docname instead of HIE ID.
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

        for asset in assets:
            facility_ref = asset.get("health_facility")
            facility = facility_map.get(facility_ref)
            if facility:
                asset["facility_name"] = facility.get("facility_name") or facility_ref or ""
                asset["facility_id"] = facility.get("hie_id") or facility_ref or ""
            else:
                resolved = resolve_health_facility_reference(facility_ref)
                asset["facility_name"] = resolved.get("facility_name") or facility_ref or ""
                asset["facility_id"] = resolved.get("facility_id") or facility_ref or ""

        return api_response(success=True, data={
            "items": assets,
            "total_count": total_count,
            "page": int(page),
            "page_size": int(page_size)
        })
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Get Assets API Error")
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_affiliations(
    facilities: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    professional_name: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    expiry_from: Optional[str] = None,
    expiry_to: Optional[str] = None
):
    """
    Get list of facility affiliations.

    Simple GET endpoint - NO default filters.
    Frappe User Permissions automatically restrict access.
    All filters are user-driven from the frontend.

    Args:
        facilities: Comma-separated facility names (optional, user input)
        page: Page number for pagination
        page_size: Items per page
        status: Filter by affiliation_status (optional, user input)
        professional_name: Search by professional name (optional, user input)
        date_from: Filter by requested_date >= date_from (optional)
        date_to: Filter by requested_date <= date_to (optional)
        expiry_from: Filter by expiry_date >= expiry_from (optional)
        expiry_to: Filter by expiry_date <= expiry_to (optional)
    """
    try:
        def _normalize_optional_string(value: Optional[str]) -> Optional[str]:
            if value is None:
                return None

            # Handle dict/list objects that might come from JSON requests
            if isinstance(value, (dict, list)):
                return None

            normalized = str(value).strip()
            if not normalized or normalized.lower() in {"undefined", "null", "none"}:
                return None

            return normalized

        status = _normalize_optional_string(status)
        professional_name = _normalize_optional_string(professional_name)
        date_from = _normalize_optional_string(date_from)
        date_to = _normalize_optional_string(date_to)
        expiry_from = _normalize_optional_string(expiry_from)
        expiry_to = _normalize_optional_string(expiry_to)

        # Build filters dictionary - ONLY from user input
        filters = {}

        # Optional status filter
        if status:
            status_lookup = status.lower()

            # "Confirmed" on UI represents approved affiliations in either Active or Confirmed state
            if status_lookup == "confirmed":
                filters["affiliation_status"] = ["in", ["Active", "Confirmed"]]
            elif status_lookup in {"terminated", "inactive"}:
                # Terminated affiliations are persisted as Inactive in some flows.
                filters["affiliation_status"] = ["in", ["Inactive", "Terminated"]]
            else:
                normalized_status_map = {
                    "pending": "Pending",
                    "active": "Active",
                    "rejected": "Rejected",
                    "expired": "Expired",
                }
                filters["affiliation_status"] = normalized_status_map.get(status_lookup, status)

        # Optional professional name search
        if professional_name:
            filters["health_professional_name"] = ["like", f"%{professional_name}%"]

        # Optional facility filter (user-selected facilities)
        if facilities:
            facility_list = [f.strip() for f in facilities.split(",") if f.strip()]
            if facility_list:
                facility_refs = set(facility_list)
                for facility_ref in facility_list:
                    resolved = resolve_health_facility_reference(facility_ref)
                    if resolved.get("facility_docname"):
                        facility_refs.add(resolved["facility_docname"])
                    if resolved.get("facility_id"):
                        facility_refs.add(resolved["facility_id"])
                filters["health_facility"] = ["in", list(facility_refs)]

        # Optional date range filter
        if date_from and date_to:
            filters["requested_date"] = ["between", [date_from, date_to]]
        elif date_from:
            filters["requested_date"] = [">=", date_from]
        elif date_to:
            filters["requested_date"] = ["<=", date_to]

        # Optional affiliation expiry date range filter
        if expiry_from and expiry_to:
            filters["expiry_date"] = ["between", [expiry_from, expiry_to]]
        elif expiry_from:
            filters["expiry_date"] = [">=", expiry_from]
        elif expiry_to:
            filters["expiry_date"] = ["<=", expiry_to]

        # Calculate offset for pagination
        page = max(int(page), 1)
        page_size = max(int(page_size), 1)
        offset = (page - 1) * page_size

        # Get total count with permission-aware query
        total_count = _count("Facility Affiliation", filters=filters)

        # Base fields always present on Facility Affiliation
        base_fields = [
            "name",
            "health_professional",
            "health_professional_name",
            "health_facility",
            "affiliation_status",
            "employment_type",
            "requested_date",
            "start_date",
            "end_date",
            "expiry_date",
        ]
        # Optional termination/history fields (if on doctype)
        optional_fields = ["termination_reason", "termination_date", "terminated_by", "employee"]
        meta = frappe.get_meta("Facility Affiliation")
        request_fields = base_fields + [f for f in optional_fields if meta.has_field(f)]

        # Fetch affiliations using frappe.get_list
        # Frappe automatically applies User Permissions here
        affiliations = frappe.get_list(
            "Facility Affiliation",
            filters=filters,
            fields=request_fields,
            order_by="requested_date desc",
            limit_start=offset,
            limit_page_length=page_size
        )

        # Enrich with facility details (batch query to avoid N+1)
        facility_ids = [a.get("health_facility") for a in affiliations if a.get("health_facility")]
        facility_map = {}

        if facility_ids:
            facilities_data = frappe.get_list(
                "Health Facility",
                filters={"name": ["in", facility_ids]},
                fields=["name", "facility_name", "hie_id"],
                limit_page_length=0
            )

            if len(facilities_data) < len(facility_ids):
                by_hie_id = frappe.get_list(
                    "Health Facility",
                    filters={"hie_id": ["in", facility_ids]},
                    fields=["name", "facility_name", "hie_id"],
                    limit_page_length=0
                )
                facilities_data.extend(by_hie_id)

            for facility in facilities_data:
                facility_map[facility["name"]] = facility
                if facility.get("hie_id"):
                    facility_map[facility["hie_id"]] = facility

        # Add facility details to each affiliation
        for aff in affiliations:
            facility_id = aff.get("health_facility")
            facility = facility_map.get(facility_id)
            if facility:
                aff["facility_name"] = facility.get("facility_name", "") or facility_id or ""
                aff["facility_id"] = facility.get("hie_id", "") or facility_id or ""
            else:
                resolved = resolve_health_facility_reference(facility_id)
                aff["facility_name"] = resolved.get("facility_name") or facility_id or ""
                aff["facility_id"] = resolved.get("facility_id") or facility_id or ""

        # Status aggregates for dashboard cards.
        # Exclude explicit status filter so cards remain informative while other filters apply.
        aggregate_filters = dict(filters)
        aggregate_filters.pop("affiliation_status", None)

        status_rows = frappe.get_list(
            "Facility Affiliation",
            filters=aggregate_filters,
            fields=["affiliation_status"],
            limit_page_length=0
        )

        status_counts = defaultdict(int)
        for row in status_rows:
            current_status = (row.get("affiliation_status") or "").strip()
            if not current_status:
                continue
            status_counts[current_status] += 1

        active_count = status_counts.get("Active", 0)
        confirmed_raw_count = status_counts.get("Confirmed", 0)
        confirmed_count = active_count + confirmed_raw_count
        rejected_count = status_counts.get("Rejected", 0)
        terminated_count = status_counts.get("Inactive", 0) + status_counts.get("Terminated", 0)
        total_count_for_rate = sum(status_counts.values())

        status_aggregates = {
            "total": total_count_for_rate,
            "pending": status_counts.get("Pending", 0),
            "confirmed": confirmed_count,
            "active": active_count,
            "rejected": rejected_count,
            "expired": status_counts.get("Expired", 0),
            "inactive": status_counts.get("Inactive", 0),
            "terminated": terminated_count,
            "confirmation_rate": round((confirmed_count / total_count_for_rate) * 100, 1) if total_count_for_rate else 0.0,
            "rejection_rate": round((rejected_count / total_count_for_rate) * 100, 1) if total_count_for_rate else 0.0,
            # Backward compatibility for older frontend clients
            "approval_rate": round((confirmed_count / total_count_for_rate) * 100, 1) if total_count_for_rate else 0.0
        }

        return api_response(
            success=True,
            data={
                "items": affiliations,
                "total_count": total_count,
                "status_aggregates": status_aggregates,
                "page": page,
                "page_size": page_size
            }
        )

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Get Affiliations API Error")
        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )


@frappe.whitelist()
def get_leave_applications(
    facilities: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None
):
    """Get list of leave applications.

    RBAC: frappe.get_list applies User Permissions (including Company) automatically.
    """
    try:
        filters = {"docstatus": ["<", 2]}
        if status:
            filters["status"] = status

        if facilities:
            facility_ids = [f.strip() for f in facilities.split(",") if f.strip()]
            valid_facility_ids = validate_user_facilities(facility_ids)
            if not valid_facility_ids:
                return api_response(success=True, data={
                    "items": [],
                    "total_count": 0,
                    "page": int(page),
                    "page_size": int(page_size),
                })
            employee_ids = frappe.get_list(
                "Employee",
                filters={"custom_facility_id": ["in", valid_facility_ids]},
                pluck="name",
                limit_page_length=0
            )
            if employee_ids:
                filters["employee"] = ["in", employee_ids]
            else:
                return api_response(success=True, data={
                    "items": [],
                    "total_count": 0,
                    "page": int(page),
                    "page_size": int(page_size),
                })

        offset = (int(page) - 1) * int(page_size)

        # Get total count for pagination
        total_count = _count("Leave Application", filters=filters)

        leaves = frappe.get_list(
            "Leave Application",
            filters=filters,
            fields=[
                "name", "employee_name", "leave_type", "from_date",
                "to_date", "total_leave_days", "status"
            ],
            order_by="from_date desc",
            limit_start=offset,
            limit_page_length=int(page_size)
        )

        return api_response(success=True, data={
            "items": leaves,
            "total_count": total_count,
            "page": int(page),
            "page_size": int(page_size)
        })
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Get Leave Applications API Error")
        return api_response(success=False, message=str(e), status_code=500)


def _check_leave_application_access(docname: str, ptype: str = "read"):
    """
    Verify the current user can access a Leave Application via Frappe permissions.
    Returns (doc, None) on success or (None, error_message) on failure.
    """
    if not docname:
        return None, "Leave application name is required"
    if not frappe.db.exists("Leave Application", docname):
        return None, "Leave application not found"
    if not frappe.has_permission("Leave Application", ptype, docname):
        return None, "You do not have permission to access this leave application"
    doc = frappe.get_doc("Leave Application", docname)
    return doc, None


@frappe.whitelist()
def get_leave_application_detail(name: Optional[str] = None):
    """Get full details of a single leave application for HR review/approval."""
    if not name:
        return api_response(success=False, message="Leave application name is required", status_code=400)
    try:
        doc, err = _check_leave_application_access(name)
        if err:
            return api_response(success=False, message=err, status_code=403)
        fields_to_send = [
            "name", "employee", "employee_name", "leave_type", "from_date", "to_date",
            "total_leave_days", "status", "docstatus", "company",
            "reason_for_leave", "leave_approver", "posting_date", "modified", "modified_by",
        ]
        data = {k: getattr(doc, k, None) for k in fields_to_send if hasattr(doc, k)}
        return api_response(success=True, data=data)
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Get Leave Application Detail API Error")
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def approve_leave_application(name: Optional[str] = None):
    """Approve a leave application (submit the document)."""
    if not name:
        return api_response(success=False, message="Leave application name is required", status_code=400)
    try:
        doc, err = _check_leave_application_access(name, "submit")
        if err:
            return api_response(success=False, message=err, status_code=403)
        if doc.docstatus == 1:
            return api_response(success=True, data={"status": "Approved"}, message="Already approved")
        if doc.docstatus == 2:
            return api_response(success=False, message="Cannot approve a cancelled leave application", status_code=400)
        doc.submit()
        return api_response(success=True, data={"status": "Approved"}, message="Leave application approved")
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Approve Leave Application API Error")
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def reject_leave_application(name: Optional[str] = None):
    """Reject a leave application: set status to Rejected (draft) or cancel if already submitted."""
    if not name:
        return api_response(success=False, message="Leave application name is required", status_code=400)
    try:
        doc, err = _check_leave_application_access(name, "write")
        if err:
            return api_response(success=False, message=err, status_code=403)
        if doc.docstatus == 2:
            return api_response(success=True, data={"status": "Cancelled"}, message="Already cancelled")
        if doc.docstatus == 1:
            doc.cancel()
            return api_response(success=True, data={"status": "Cancelled"}, message="Leave application rejected")
        doc.status = "Rejected"
        doc.save()
        return api_response(success=True, data={"status": "Rejected"}, message="Leave application rejected")
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Reject Leave Application API Error")
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_purchase_orders(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None
):
    """Get list of purchase orders.

    RBAC: frappe.get_list applies User Permissions (including Company) automatically.
    """
    try:
        filters = {"docstatus": ["<", 2]}
        if status:
            filters["status"] = status

        offset = (int(page) - 1) * int(page_size)

        # Get total count for pagination
        total_count = _count("Purchase Order", filters=filters)

        pos = frappe.get_list(
            "Purchase Order",
            filters=filters,
            fields=["name", "supplier", "transaction_date", "grand_total", "status", "currency"],
            order_by="transaction_date desc",
            limit_start=offset,
            limit_page_length=int(page_size)
        )

        return api_response(success=True, data={
            "items": pos,
            "total_count": total_count,
            "page": int(page),
            "page_size": int(page_size)
        })
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Get Purchase Orders API Error")
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_expense_claims(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None
):
    """Get list of expense claims.

    RBAC: frappe.get_list applies User Permissions (including Company) automatically.
    """
    try:
        filters = {"docstatus": ["<", 2]}
        if status:
            filters["status"] = status

        offset = (int(page) - 1) * int(page_size)

        # Get total count for pagination
        total_count = _count("Expense Claim", filters=filters)

        claims = frappe.get_list(
            "Expense Claim",
            filters=filters,
            fields=["name", "employee_name", "posting_date", "total_claimed_amount", "status"],
            order_by="posting_date desc",
            limit_start=offset,
            limit_page_length=int(page_size)
        )

        return api_response(success=True, data={
            "items": claims,
            "total_count": total_count,
            "page": int(page),
            "page_size": int(page_size)
        })
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Get Expense Claims API Error")
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_material_requests(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None
):
    """Get list of material requests.

    RBAC: frappe.get_list applies User Permissions (including Company) automatically.
    """
    try:
        filters = {"docstatus": ["<", 2]}
        if status:
            filters["status"] = status

        offset = (int(page) - 1) * int(page_size)

        # Get total count for pagination
        total_count = _count("Material Request", filters=filters)

        mrs = frappe.get_list(
            "Material Request",
            filters=filters,
            fields=["name", "transaction_date", "status", "material_request_type"],
            order_by="transaction_date desc",
            limit_start=offset,
            limit_page_length=int(page_size)
        )

        return api_response(success=True, data={
            "items": mrs,
            "total_count": total_count,
            "page": int(page),
            "page_size": int(page_size)
        })
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Get Material Requests API Error")
        return api_response(success=False, message=str(e), status_code=500)

@frappe.whitelist()
def get_facilities(
    page: int = 1,
    page_size: int = 50
):
    """Get list of Health Facilities

    Args:
        page: Page number for pagination (default: 1)
        page_size: Number of records per page (default: 50)

    Returns:
        List of all health facilities
    """
    try:
        # No filters - return ALL facilities
        filters = {}
        offset = (int(page) - 1) * int(page_size)

        # Get total count for pagination
        total_count = _count("Health Facility", filters=filters)

        facilities = frappe.get_list(
            "Health Facility",
            filters=filters,
            fields=["name", "facility_name", "kephl_level", "hie_id", "operational_status", "county"],
            limit_start=offset,
            limit_page_length=int(page_size)
        )

        return api_response(success=True, data={
            "items": facilities,
            "total_count": total_count,
            "page": int(page),
            "page_size": int(page_size)
        })
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Get Facilities API Error")
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_company_overview():
    """
    Get company overview statistics.

    RBAC: Every _count() call uses frappe.get_list which applies User Permissions
    (including Company) automatically. No manual company filter needed.

    Returns:
        {
            "active_employees": int,
            "total_departments": int,
            "total_facilities": int,
            "total_assets": int,
            "active_affiliations": int,
            "pending_affiliations": int
        }
    """
    try:
        return api_response(
            success=True,
            data={
                "active_employees": _count("Employee", {"status": "Active"}),
                "total_departments": _count("Department"),
                "total_facilities": _count("Health Facility"),
                "total_assets": _count("Health Automation Device"),
                "active_affiliations": _count("Facility Affiliation", {"affiliation_status": "Active"}),
                "pending_affiliations": _count("Facility Affiliation", {"affiliation_status": "Pending"}),
            }
        )

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Dashboard API Error")
        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )


@frappe.whitelist()
def get_affiliation_statistics(
    facilities: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """
    Get affiliation statistics with breakdown by status, employment type, and monthly trends.

    RBAC: frappe.get_list applies User Permissions automatically.

    Args:
        facilities: Comma-separated facility hie_ids (optional)
        date_from: Start date for filtering (optional)
        date_to: End date for filtering (optional)
    
    Returns:
        {
            "by_status": {...},
            "by_employment_type": {...},
            "by_professional_cadre": {...},
            "monthly_trend": [...]
        }
    """
    try:
        filters, empty_scope = _build_affiliation_scope_filters(
            facilities=facilities,
            date_from=date_from,
            date_to=date_to,
        )

        if empty_scope:
            return api_response(
                success=True,
                data={
                    "by_status": {},
                    "status_aggregates": {
                        "total": 0,
                        "pending": 0,
                        "confirmed": 0,
                        "active": 0,
                        "rejected": 0,
                        "expired": 0,
                        "inactive": 0,
                        "terminated": 0,
                        "confirmation_rate": 0.0,
                        "rejection_rate": 0.0,
                        "approval_rate": 0.0
                    },
                    "by_employment_type": {},
                    "by_professional_cadre": {},
                    "by_licensing_body": {},
                    "monthly_trend": [],
                    "total": 0,
                    "unique_health_professionals": 0,
                    "unique_confirmed_health_professionals": 0
                }
            )
        
        # Get all affiliations
        affiliations = frappe.get_list(
            "Facility Affiliation",
            filters=filters,
            fields=[
                "name",
                "affiliation_status",
                "employment_type",
                "requested_date",
                "health_professional",
                "health_facility"
            ],
            limit_page_length=0
        )
        
        # Aggregate by status
        by_status = defaultdict(int)
        by_employment_type = defaultdict(int)
        monthly_trend = []
        
        for aff in affiliations:
            # Status breakdown
            status = aff.get("affiliation_status", "Unknown")
            by_status[status] += 1
            
            # Employment type breakdown
            emp_type = aff.get("employment_type", "Unknown")
            by_employment_type[emp_type] += 1
        
        # Generate monthly trend
        monthly_trend = generate_monthly_trend(affiliations, "requested_date")

        active_count = by_status.get("Active", 0)
        confirmed_raw_count = by_status.get("Confirmed", 0)
        confirmed_count = active_count + confirmed_raw_count
        rejected_count = by_status.get("Rejected", 0)
        terminated_count = by_status.get("Inactive", 0) + by_status.get("Terminated", 0)
        total_count_for_rate = len(affiliations)

        status_aggregates = {
            "total": total_count_for_rate,
            "pending": by_status.get("Pending", 0),
            "confirmed": confirmed_count,
            "active": active_count,
            "rejected": rejected_count,
            "expired": by_status.get("Expired", 0),
            "inactive": by_status.get("Inactive", 0),
            "terminated": terminated_count,
            "confirmation_rate": round((confirmed_count / total_count_for_rate) * 100, 1) if total_count_for_rate else 0.0,
            "rejection_rate": round((rejected_count / total_count_for_rate) * 100, 1) if total_count_for_rate else 0.0,
            "approval_rate": round((confirmed_count / total_count_for_rate) * 100, 1) if total_count_for_rate else 0.0,
        }
        
        # Get professional cadre and licensing body breakdown (requires join with Health Professional)
        by_cadre = defaultdict(lambda: defaultdict(int))
        by_licensing_body = defaultdict(lambda: defaultdict(int))
        professional_ids = [a.get("health_professional") for a in affiliations if a.get("health_professional")]
        unique_professionals = {p for p in professional_ids if p}
        confirmed_professionals = {
            a.get("health_professional")
            for a in affiliations
            if a.get("health_professional") and (a.get("affiliation_status") in ["Active", "Confirmed"])
        }
        if professional_ids:
            professionals = frappe.get_list(
                "Health Professional",
                filters={"name": ["in", professional_ids]},
                fields=["name", "professional_cadre", "licensing_body"],
                limit_page_length=0
            )
            cadre_map = {p.name: p.get("professional_cadre", "Unknown") for p in professionals}
            licensing_map = {p.name: p.get("licensing_body", "Unknown") for p in professionals}
            for aff in affiliations:
                prof_id = aff.get("health_professional")
                status = aff.get("affiliation_status", "Unknown")
                cadre = cadre_map.get(prof_id, "Unknown")
                licensing_body = licensing_map.get(prof_id, "Unknown")

                # Track by cadre
                by_cadre[cadre]["total"] += 1
                by_cadre[cadre][status] += 1

                # Track by licensing body
                by_licensing_body[licensing_body]["total"] += 1
                by_licensing_body[licensing_body][status] += 1

        # Serialize nested dicts to regular dicts for JSON response
        by_cadre_serialized = {k: dict(v) for k, v in by_cadre.items()}
        by_licensing_body_serialized = {k: dict(v) for k, v in by_licensing_body.items()}

        return api_response(
            success=True,
            data={
                "by_status": dict(by_status),
                "status_aggregates": status_aggregates,
                "by_employment_type": dict(by_employment_type),
                "by_professional_cadre": by_cadre_serialized,
                "by_licensing_body": by_licensing_body_serialized,
                "monthly_trend": monthly_trend,
                "total": len(affiliations),
                "unique_health_professionals": len(unique_professionals),
                "unique_confirmed_health_professionals": len(confirmed_professionals),
            }
        )
    
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Affiliation Statistics API Error")
        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )


@frappe.whitelist()
def get_pending_affiliations(
    facilities: Optional[str] = None,
    limit: int = 10
):
    """
    Get list of pending affiliations with details.

    RBAC: frappe.get_list applies User Permissions automatically.

    Args:
        facilities: Comma-separated facility hie_ids (optional)
        limit: Maximum number of records to return (default: 10)
    """
    try:
        filters = {"affiliation_status": "Pending"}

        if facilities:
            facility_ids = [f.strip() for f in facilities.split(",") if f.strip()]
            valid_facilities = validate_user_facilities(facility_ids)
            if valid_facilities:
                filters["health_facility"] = ["in", valid_facilities]
        
        # Get pending affiliations
        pending = frappe.get_list(
            "Facility Affiliation",
            filters=filters,
            fields=[
                "name",
                "health_professional",
                "health_professional_name",
                "health_facility",
                "employment_type",
                "requested_date",
                "requested_by"
            ],
            order_by="requested_date desc",
            limit=limit
        )
        
        # Enrich with facility names
        for aff in pending:
            facility_id = aff.get("health_facility")
            if facility_id:
                try:
                    facility_name = frappe.get_cached_value("Health Facility", facility_id, "facility_name")
                    aff["facility_name"] = facility_name or ""
                except Exception:
                    aff["facility_name"] = ""
            else:
                aff["facility_name"] = ""
        
        return api_response(
            success=True,
            data={
                "count": len(pending),
                "items": pending
            }
        )
    
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Pending Affiliations API Error")
        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )


@frappe.whitelist()
def get_facility_metrics_overview(
    facilities: Optional[str] = None,
    metric_type: Optional[str] = None,
    period: str = "monthly"
):
    """
    Get facility metrics overview with current vs previous period comparison.

    RBAC: frappe.get_list applies User Permissions automatically.

    Args:
        facilities: Comma-separated facility hie_ids (optional)
        metric_type: Specific metric type to filter (optional)
        period: Period type - 'monthly', 'quarterly', or 'yearly' (default: 'monthly')
    """
    try:
        periods = get_period_dates(period)

        filters = {
            "is_latest": 1,
            "is_active": 1
        }

        if facilities:
            facility_ids = [f.strip() for f in facilities.split(",") if f.strip()]
            valid_facilities = validate_user_facilities(facility_ids)
            if valid_facilities:
                facility_names = frappe.get_list(
                    "Health Facility",
                    filters={"hie_id": ["in", valid_facilities]},
                    pluck="name",
                    limit_page_length=0
                )
                if facility_names:
                    filters["health_facility"] = ["in", facility_names]
        
        # Metric type filter
        if metric_type:
            filters["metric_type"] = metric_type
        
        # Get current period metrics
        current_filters = {**filters, **{
            "period_start_date": [">=", periods["current_start"]],
            "period_end_date": ["<=", periods["current_end"]]
        }}
        current_metrics = frappe.get_list(
            "Facility Metrics",
            filters=current_filters,
            fields=["metric_value", "health_facility", "metric_type"],
            limit_page_length=0
        )
        
        # Get previous period metrics
        prev_filters = {**filters, **{
            "period_start_date": [">=", periods["prev_start"]],
            "period_end_date": ["<=", periods["prev_end"]]
        }}
        prev_metrics = frappe.get_list(
            "Facility Metrics",
            filters=prev_filters,
            fields=["metric_value", "health_facility", "metric_type"],
            limit_page_length=0
        )
        
        # Calculate totals
        current_total = sum(m.get("metric_value", 0) or 0 for m in current_metrics)
        prev_total = sum(m.get("metric_value", 0) or 0 for m in prev_metrics)
        
        # Calculate percentage change
        if prev_total > 0:
            percentage_change = ((current_total - prev_total) / prev_total) * 100
        else:
            percentage_change = 100.0 if current_total > 0 else 0.0
        
        # Breakdown by facility
        facility_breakdown = defaultdict(float)
        for m in current_metrics:
            facility = m.get("health_facility", "Unknown")
            facility_breakdown[facility] += m.get("metric_value", 0) or 0
        
        breakdown_list = [
            {"facility": k, "total": v}
            for k, v in sorted(facility_breakdown.items(), key=lambda x: x[1], reverse=True)
        ]
        
        # Generate trend (last 6 periods)
        trend = []
        for i in range(6):
            period_start = add_months(periods["current_start"], -i)
            period_end = get_last_day(period_start)
            trend_filters = {**filters, **{
                "period_start_date": [">=", period_start],
                "period_end_date": ["<=", period_end]
            }}
            period_metrics = frappe.get_list(
                "Facility Metrics",
                filters=trend_filters,
                fields=["metric_value"],
                limit_page_length=0
            )
            period_total = sum(m.get("metric_value", 0) or 0 for m in period_metrics)
            trend.append({
                "period": period_start.strftime("%Y-%m"),
                "value": period_total
            })
        trend.reverse()
        
        return api_response(
            success=True,
            data={
                "current_period_total": current_total,
                "previous_period_total": prev_total,
                "percentage_change": round(percentage_change, 2),
                "trend": trend,
                "breakdown_by_facility": breakdown_list
            }
        )
    
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Facility Metrics Overview API Error")
        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )


# Removed duplicate get_license_compliance_overview definition to resolve "nonsense" duplication.


@frappe.whitelist()
def get_financial_overview(
    fiscal_year: Optional[str] = None
):
    """
    Get financial overview including Purchase Orders, Material Requests, Expense Claims, and Budget.

    RBAC: frappe.get_list applies User Permissions (including Company) automatically.

    Args:
        fiscal_year: Fiscal year (optional)
    """
    try:
        base_filters = {"docstatus": ["<", 2]}

        purchase_orders = frappe.get_list(
            "Purchase Order",
            filters=base_filters,
            fields=["name", "grand_total", "status"],
            limit_page_length=0
        )
        po_pending = [po for po in purchase_orders if po.get("status") in ["Draft", "To Receive and Bill", "To Bill"]]
        po_total = sum(po.get("grand_total", 0) or 0 for po in purchase_orders)
        po_pending_total = sum(po.get("grand_total", 0) or 0 for po in po_pending)

        material_requests = frappe.get_list(
            "Material Request",
            filters=base_filters,
            fields=["name", "status"],
            limit_page_length=0
        )
        mr_pending = [mr for mr in material_requests if mr.get("status") in ["Draft", "Pending", "Submitted"]]

        expense_claims = frappe.get_list(
            "Expense Claim",
            filters=base_filters,
            fields=["name", "total_claimed_amount", "status"],
            limit_page_length=0
        )
        ec_pending = [ec for ec in expense_claims if ec.get("status") in ["Draft", "Submitted"]]
        ec_total = sum(ec.get("total_claimed_amount", 0) or 0 for ec in expense_claims)
        ec_pending_total = sum(ec.get("total_claimed_amount", 0) or 0 for ec in ec_pending)

        budget_summary = {
            "total_budget": 0,
            "utilized": 0,
            "remaining": 0,
            "utilization_percent": 0
        }
        try:
            budget_filters = {"fiscal_year": fiscal_year} if fiscal_year else {}
            budgets = frappe.get_list(
                "Budget",
                filters=budget_filters,
                fields=["name", "total_budgeted_amount"],
                limit_page_length=0
            )
            if budgets:
                budget_summary["total_budget"] = sum(b.get("total_budgeted_amount", 0) or 0 for b in budgets)
        except Exception:
            pass
        
        return api_response(
            success=True,
            data={
                "purchase_orders": {
                    "total": len(purchase_orders),
                    "pending": len(po_pending),
                    "total_value": po_total,
                    "pending_value": po_pending_total
                },
                "material_requests": {
                    "total": len(material_requests),
                    "pending": len(mr_pending)
                },
                "expense_claims": {
                    "total": len(expense_claims),
                    "pending": len(ec_pending),
                    "total_value": ec_total,
                    "pending_value": ec_pending_total
                },
                "budget_summary": budget_summary
            }
        )
    
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Financial Overview API Error")
        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )


@frappe.whitelist()
def get_attendance_summary(
    facilities: Optional[str] = None,
    date: Optional[str] = None
):
    """
    Get attendance summary for a specific date.

    RBAC: frappe.get_list applies User Permissions (including Company) automatically.

    Args:
        facilities: Comma-separated facility hie_ids (optional)
        date: Date to get summary for (default: today)
    """
    try:
        if not date:
            date = today()

        filters = {"attendance_date": date, "docstatus": ["<", 2]}

        valid_facility_ids = []
        if facilities:
            facility_ids = [f.strip() for f in facilities.split(",") if f.strip()]
            valid_facility_ids = validate_user_facilities(facility_ids)
            if valid_facility_ids:
                employee_ids = frappe.get_list(
                    "Employee",
                    filters={"custom_facility_id": ["in", valid_facility_ids]},
                    pluck="name",
                    limit_page_length=0
                )
                if employee_ids:
                    filters["employee"] = ["in", employee_ids]
                else:
                    return api_response(success=True, data={
                        "total_employees": 0, "present": 0, "absent": 0,
                        "on_leave": 0, "late": 0, "attendance_rate": 0, "by_department": []
                    })

        attendance = frappe.get_list(
            "Attendance",
            filters=filters,
            fields=["status", "late_entry", "department"],
            limit_page_length=0
        )

        emp_filters = {"status": "Active"}
        if valid_facility_ids:
            emp_filters["custom_facility_id"] = ["in", valid_facility_ids]
        total_employees = _count("Employee", filters=emp_filters)
        
        stats = {
            "present": 0,
            "absent": 0,
            "on_leave": 0,
            "late": 0
        }
        
        dept_stats = defaultdict(lambda: {"present": 0, "total": 0})
        
        # Count statuses
        for att in attendance:
            status = att.get("status")
            if status == "Present":
                stats["present"] += 1
                if att.get("late_entry"):
                    stats["late"] += 1
            elif status == "Absent":
                stats["absent"] += 1
            elif status == "On Leave":
                stats["on_leave"] += 1
            
            dept = att.get("department") or "Unknown"
            if status == "Present":
                dept_stats[dept]["present"] += 1
            dept_stats[dept]["total"] += 1

        # Fallback for absent if not recorded
        recorded_count = stats["present"] + stats["absent"] + stats["on_leave"]
        if total_employees > recorded_count:
            stats["absent"] += (total_employees - recorded_count)

        attendance_rate = 0
        if total_employees > 0:
            attendance_rate = round((stats["present"] / total_employees) * 100, 2)
            
        by_dept = []
        for dept, d_stat in dept_stats.items():
            by_dept.append({
                "department": dept,
                "present": d_stat["present"],
                "total": d_stat["total"]
            })

        return api_response(success=True, data={
            "total_employees": total_employees,
            "present": stats["present"],
            "absent": stats["absent"],
            "on_leave": stats["on_leave"],
            "late": stats["late"],
            "attendance_rate": attendance_rate,
            "by_department": sorted(by_dept, key=lambda x: x["present"], reverse=True)
        })
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Attendance Summary API Error")
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_attendance_records(
    facilities: Optional[str] = None,
    date: Optional[str] = None,
    department: Optional[str] = None,
    limit: int = 50
):
    """
    Get detailed attendance records for a date.

    RBAC: frappe.get_list applies User Permissions (including Company) automatically.
    """
    try:
        if not date:
            date = today()

        filters = {"attendance_date": date, "docstatus": ["<", 2]}
        if department:
            filters["department"] = department

        if facilities:
            facility_ids = [f.strip() for f in facilities.split(",") if f.strip()]
            valid_facility_ids = validate_user_facilities(facility_ids)
            if valid_facility_ids:
                employee_ids = frappe.get_list(
                    "Employee",
                    filters={"custom_facility_id": ["in", valid_facility_ids]},
                    pluck="name",
                    limit_page_length=0
                )
                if employee_ids:
                    filters["employee"] = ["in", employee_ids]
                else:
                    return api_response(success=True, data=[])

        records = frappe.get_list(
            "Attendance",
            filters=filters,
            fields=[
                "name", "employee", "employee_name", "status", 
                "in_time", "out_time", "department", "late_entry"
            ],
            order_by="creation desc",
            limit=limit
        )
        
        # Format times for frontend
        for r in records:
            if r.in_time:
                r.check_in = r.in_time.strftime("%H:%M")
            else:
                r.check_in = None
            
            if r.out_time:
                r.check_out = r.out_time.strftime("%H:%M")
            else:
                r.check_out = None
                
        return api_response(success=True, data=records)
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Attendance Records API Error")
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_recent_activities(
    limit: int = 20,
    activity_type: Optional[str] = None
):
    """
    Get recent activities from Activity Log.

    RBAC: frappe.get_list applies User Permissions automatically.

    Args:
        limit: Maximum number of records (default: 20)
        activity_type: Filter by reference doctype (optional)
    """
    try:
        filters = {}
        if activity_type:
            filters["reference_doctype"] = activity_type
        
        # Get recent activities
        activities = frappe.get_list(
            "Activity Log",
            filters=filters,
            fields=[
                "name",
                "reference_doctype",
                "reference_name",
                "subject",
                "creation",
                "owner",
                "link_doctype",
                "link_name"
            ],
            order_by="creation desc",
            limit=limit
        )
        
        # Enrich with user names
        for activity in activities:
            owner = activity.get("owner")
            if owner:
                try:
                    user_full_name = frappe.get_cached_value("User", owner, "full_name")
                    activity["user_name"] = user_full_name or owner
                except Exception:
                    activity["user_name"] = owner
            else:
                activity["user_name"] = "System"
        
        return api_response(
            success=True,
            data={
                "count": len(activities),
                "items": activities
            }
        )
    
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Recent Activities API Error")
        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )


@frappe.whitelist()
def get_license_compliance_overview(facilities: Optional[str] = None):
    """
    Get detailed facility license compliance overview.

    RBAC: frappe.get_list applies User Permissions (including Company) automatically.

    Args:
        facilities: Comma-separated facility hie_ids (optional)
    """
    try:
        license_filters = {}

        if facilities:
            facility_ids = [f.strip() for f in facilities.split(",") if f.strip()]
            valid_facility_ids = validate_user_facilities(facility_ids)
            if valid_facility_ids:
                license_filters["health_facility"] = ["in", valid_facility_ids]

        # Get all licenses (all docstatus, filtered by company/facilities)
        all_licenses = frappe.get_list(
            "License Record",
            filters=license_filters,
            fields=[
                "name", "health_facility", "facility_name",
                "license_type_name", "regulatory_body",
                "expiry_date", "license_fee", "status"
            ],
            order_by="modified desc",
            limit_page_length=0
        )

        # Calculate metrics from filtered records
        active = sum(1 for lic in all_licenses if lic.status == "Active")
        expired = sum(1 for lic in all_licenses if lic.status == "Expired")
        pending_statuses = {"Pending", "Draft", "Pending Renewal", "Pending Payment", "Info Requested"}
        pending = sum(1 for lic in all_licenses if lic.status in pending_statuses)

        # Expiring soon (next 60 days) - for active licenses only
        limit_date = add_days(today(), 60)
        expiring_soon = sum(1 for lic in all_licenses
                          if lic.status == "Active" and lic.expiry_date
                          and today() <= lic.expiry_date <= limit_date)

        # Compliance Rate: Active vs Tracked (Active + Expired)
        denominator = active + expired
        compliance_rate = round((active / denominator * 100), 1) if denominator > 0 else 0

        # Format details for the dashboard
        formatted_details = []
        for d in all_licenses:
            regulator_name = d.regulatory_body
            if d.regulatory_body:
                regulator_name = frappe.get_cached_value("Regulatory Body", d.regulatory_body, "regulatory_body_name") or d.regulatory_body

            formatted_details.append({
                "facility_name": d.facility_name or "Unknown Facility",
                "license_type": d.license_type_name or "Unknown License",
                "expiry_date": d.expiry_date,
                "amount": d.license_fee or 0,
                "regulator": regulator_name or "Unknown",
                "status": d.status
            })

        return api_response(success=True, data={
            "compliance_rate": compliance_rate,
            "total_active_licenses": active,
            "expired_licenses": expired,
            "pending_licenses": pending,
            "licenses_expiring_soon": expiring_soon,
            "expiring_details": formatted_details
        })

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "License Compliance API Error")
        return api_response(success=False, message=str(e), status_code=500)
