"""
Employee API endpoints for CareVerse HQ

Provides comprehensive employee management with Company-based RBAC.
Links to Health Professional doctype for professional licensing details.

All endpoints leverage Frappe's native User Permissions for Company-based access control.
"""

import frappe
from typing import Optional
from .response import api_response


def _normalize_optional_string(value: Optional[str]) -> Optional[str]:
    """Normalize optional string query parameters from HTTP requests."""
    if value is None:
        return None
    if not isinstance(value, str):
        return value

    cleaned = value.strip()
    if not cleaned:
        return None

    if cleaned.lower() in {"undefined", "null", "none"}:
        return None

    return cleaned


@frappe.whitelist()
def get_employees(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    status: Optional[str] = None,
    company: Optional[str] = None,
    facility: Optional[str] = None,
    department: Optional[str] = None,
    is_licensed: Optional[bool] = None,
    cadre: Optional[str] = None
):
    """
    Get paginated list of employees.

    Frappe RBAC automatically applies Company-based User Permissions.
    No default filters - all filters are user-driven.

    Args:
        page: Page number (1-indexed)
        page_size: Number of records per page (max 100)
        search: Search term (employee_name, cell_number, company_email, personal_email)
        status: Filter by status (Active, Left, etc.) - optional
        company: Filter by company - optional
        facility: Filter by facility (custom_facility_id) - optional
        department: Filter by department - optional
        is_licensed: Filter licensed practitioners (employees with HP link) - optional
        cadre: Filter by professional_cadre (from linked Health Professional) - optional

    Returns:
        dict: {
            success: bool,
            data: {
                items: list,
                total_count: int,
                page: int,
                page_size: int,
                metrics: dict
            }
        }
    """
    try:
        # Normalize incoming optional string parameters first.
        search = _normalize_optional_string(search)
        status = _normalize_optional_string(status)
        company = _normalize_optional_string(company)
        facility = _normalize_optional_string(facility)
        department = _normalize_optional_string(department)
        cadre = _normalize_optional_string(cadre)

        # Parse parameters
        page = max(int(page), 1)
        page_size = max(1, min(int(page_size), 100))  # Max 100 records per page

        # Build filters - NO DEFAULT FILTERS (Frappe RBAC handles permissions)
        filters = {}

        if status:
            filters["status"] = status

        if company:
            filters["company"] = company

        if facility:
            filters["custom_facility_id"] = facility

        if department:
            filters["department"] = department

        # Handle bool-like values from query params or JSON payload
        is_licensed_flag = str(is_licensed).lower() in ("1", "true", "yes", "y")
        if is_licensed_flag:
            filters["custom_health_professional"] = ["is", "set"]

        # If cadre is provided, pre-filter employees by linked HPs with that cadre.
        if cadre:
            hp_names = frappe.get_all(
                "Health Professional",
                filters={"professional_cadre": cadre},
                pluck="name"
            )

            if not hp_names:
                return api_response(success=True, data={
                    "items": [],
                    "total_count": 0,
                    "page": page,
                    "page_size": page_size,
                    "metrics": {
                        "total_employees": 0
                    }
                })

            filters["custom_health_professional"] = ["in", hp_names]

        # Search filter (OR conditions)
        or_filters = None
        if search:
            or_filters = [
                ["employee_name", "like", f"%{search}%"],
                ["cell_number", "like", f"%{search}%"],
                ["company_email", "like", f"%{search}%"],
                ["personal_email", "like", f"%{search}%"]
            ]

        # Get total count with the same list API path to preserve permission behavior.
        count_result = frappe.get_list(
            "Employee",
            filters=filters if filters else None,
            or_filters=or_filters,
            fields=[{"COUNT": "name", "as": "total_count"}],
            page_length=1
        )
        total_count = int(count_result[0].total_count) if count_result else 0

        # Query Employee with fields
        employees = frappe.get_list(
            "Employee",
            filters=filters if filters else None,
            or_filters=or_filters,
            fields=[
                # Standard Employee fields
                "name", "employee_name", "employee_number",
                "first_name", "last_name", "middle_name",
                "gender", "date_of_birth", "date_of_joining", "date_of_leaving",
                "company", "department", "designation", "employment_type",
                "status", "cell_number", "personal_email", "company_email",
                "image",

                # Custom fields
                "custom_health_professional",
                "custom_facility_id", "custom_facility_name",
                "custom_identification_type", "custom_identification_number",
                "custom_is_licensed_practitioner",

                # System fields
                "creation", "modified"
            ],
            start=(page - 1) * page_size,
            page_length=page_size,
            order_by="employee_name asc"
        )

        # Enrich with Health Professional data in one query (avoid N+1 lookups).
        hp_names = [emp.custom_health_professional for emp in employees if emp.get("custom_health_professional")]
        hp_map = {}

        if hp_names:
            hp_records = frappe.get_list(
                "Health Professional",
                filters={"name": ["in", hp_names]},
                fields=[
                    "name",
                    "professional_cadre", "professional_specialty", "sub_specialty",
                    "registration_number", "license_id", "license_type", "license_end",
                    "phone", "email", "county"
                ],
                page_length=len(hp_names)
            )
            hp_map = {hp.name: hp for hp in hp_records}

        for emp in employees:
            hp_name = emp.get("custom_health_professional")
            if not hp_name:
                continue
            hp_data = hp_map.get(hp_name)
            if not hp_data:
                continue
            emp.update({
                "professional_cadre": hp_data.get("professional_cadre"),
                "professional_specialty": hp_data.get("professional_specialty"),
                "sub_specialty": hp_data.get("sub_specialty"),
                "registration_number": hp_data.get("registration_number"),
                "license_id": hp_data.get("license_id"),
                "license_type": hp_data.get("license_type"),
                "license_end": hp_data.get("license_end"),
                "phone": hp_data.get("phone"),
                "email": hp_data.get("email"),
                "county": hp_data.get("county")
            })

        return api_response(success=True, data={
            "items": employees,
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
            # Keep lightweight metrics for backward compatibility with existing UI state.
            "metrics": {
                "total_employees": total_count
            }
        })

    except Exception as e:
        frappe.log_error(f"Error fetching employees: {str(e)}\n{frappe.get_traceback()}")
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_employee_detail(id: str):
    """
    Get detailed employee information including Health Professional data and affiliations.

    Args:
        id: Employee name or employee_number

    Returns:
        dict: {
            success: bool,
            data: Employee record with health_professional_data and professional_affiliations
        }
    """
    try:
        # Try to find by name or employee_number
        employee = None

        if frappe.db.exists("Employee", id):
            employee = frappe.get_doc("Employee", id)
        else:
            # Try employee_number lookup
            emp_list = frappe.get_list(
                "Employee",
                filters={"employee_number": id},
                limit=1
            )
            if emp_list:
                employee = frappe.get_doc("Employee", emp_list[0].name)

        if not employee:
            return api_response(
                success=False,
                message=f"Employee not found: {id}",
                status_code=404
            )

        # Convert to dict
        emp_dict = employee.as_dict()

        # Get Health Professional data if linked
        if employee.custom_health_professional:
            try:
                hp = frappe.get_doc("Health Professional", employee.custom_health_professional)
                emp_dict["health_professional_data"] = hp.as_dict()
            except Exception as e:
                frappe.log_error(f"Error fetching HP data: {str(e)}")
                emp_dict["health_professional_data"] = None

        # Get facility affiliations (check both employee and legacy HP link)
        affiliation_filters = []
        if employee.name:
            affiliation_filters.append({"employee": employee.name})
        if employee.custom_health_professional:
            affiliation_filters.append({"health_professional": employee.custom_health_professional})

        affiliations = []
        for filter_dict in affiliation_filters:
            try:
                affs = frappe.get_list(
                    "Facility Affiliation",
                    filters=filter_dict,
                    fields=[
                        "name", "health_facility", "health_professional_name",
                        "role", "designation", "employment_type", "affiliation_status",
                        "start_date", "end_date", "facility_affiliation"
                    ],
                    order_by="start_date desc"
                )
                affiliations.extend(affs)
            except Exception as e:
                frappe.log_error(f"Error fetching affiliations: {str(e)}")

        # Remove duplicates
        seen = set()
        unique_affiliations = []
        for aff in affiliations:
            if aff.name not in seen:
                seen.add(aff.name)
                unique_affiliations.append(aff)

        # Get facility names for affiliations
        for affiliation in unique_affiliations:
            if affiliation.health_facility:
                try:
                    facility_name = frappe.db.get_value(
                        "Health Facility",
                        affiliation.health_facility,
                        "facility_name"
                    )
                    affiliation["health_facility_name"] = facility_name
                except Exception as e:
                    frappe.log_error(f"Error fetching facility name: {str(e)}")

        emp_dict["professional_affiliations"] = unique_affiliations

        return api_response(success=True, data=emp_dict)

    except Exception as e:
        frappe.log_error(f"Error fetching employee detail: {str(e)}\n{frappe.get_traceback()}")
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_professional_cadres():
    """
    Get distinct list of professional cadres for dropdown.

    Fetches cadres from Health Professionals linked to Employees.

    Returns:
        dict: {
            success: bool,
            data: [{label, value}, ...]
        }
    """
    try:
        # Get employees with HP links
        employees_with_hp = frappe.get_list(
            "Employee",
            filters={"custom_health_professional": ["is", "set"]},
            fields=["custom_health_professional"],
            distinct=True
        )

        if not employees_with_hp:
            return api_response(success=True, data=[])

        # Extract HP names
        hp_names = [emp.custom_health_professional for emp in employees_with_hp if emp.custom_health_professional]

        if not hp_names:
            return api_response(success=True, data=[])

        # Get cadres from linked HPs
        cadres = frappe.get_list(
            "Health Professional",
            filters={"name": ["in", hp_names]},
            fields=["professional_cadre"],
            distinct=True
        )

        # Format as options
        options = [
            {"label": cadre.professional_cadre, "value": cadre.professional_cadre}
            for cadre in cadres
            if cadre.professional_cadre
        ]

        # Sort alphabetically
        options.sort(key=lambda x: x["label"])

        return api_response(success=True, data=options)

    except Exception as e:
        frappe.log_error(f"Error fetching cadres: {str(e)}\n{frappe.get_traceback()}")
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_departments(company: Optional[str] = None):
    """
    Get departments list (optionally filtered by company).

    Args:
        company: Company name (optional)

    Returns:
        dict: {
            success: bool,
            data: [{label, value}, ...]
        }
    """
    try:
        filters = {}
        if company:
            filters["company"] = company

        departments = frappe.get_list(
            "Department",
            filters=filters,
            fields=["name", "department_name"],
            order_by="department_name asc"
        )

        options = [
            {
                "label": dept.department_name or dept.name,
                "value": dept.name
            }
            for dept in departments
        ]

        return api_response(success=True, data=options)

    except Exception as e:
        frappe.log_error(f"Error fetching departments: {str(e)}\n{frappe.get_traceback()}")
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_designations():
    """
    Get designations list.

    Returns:
        dict: {
            success: bool,
            data: [{label, value}, ...]
        }
    """
    try:
        designations = frappe.get_list(
            "Designation",
            fields=["name", "designation_name"],
            order_by="designation_name asc"
        )

        options = [
            {
                "label": desig.designation_name or desig.name,
                "value": desig.name
            }
            for desig in designations
        ]

        return api_response(success=True, data=options)

    except Exception as e:
        frappe.log_error(f"Error fetching designations: {str(e)}\n{frappe.get_traceback()}")
        return api_response(success=False, message=str(e), status_code=500)
