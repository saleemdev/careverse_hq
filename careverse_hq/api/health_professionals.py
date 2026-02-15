"""
Health Professional API endpoints for CareVerse HQ
Provides comprehensive health professional management with licensing,
credentials, and facility affiliations
"""

import frappe
from frappe import _
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta


@frappe.whitelist()
def get_health_professionals(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    status: Optional[str] = None,
    cadre: Optional[str] = None,
    specialty: Optional[str] = None
):
    """
    Get paginated list of health professionals (Employees with Health Professional link)
    Frappe RBAC (Role-Based Access Control) handles permissions automatically

    Args:
        page: Page number (1-indexed)
        page_size: Number of records per page
        search: Search term (searches employee_name, cell_number, email)
        status: Filter by status (Active, Left) - optional, no default
        cadre: Filter by professional_cadre - optional
        specialty: Filter by professional_specialty - optional

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
        # Parse parameters
        page = int(page)
        page_size = min(int(page_size), 100)  # Max 100 records per page

        # Build filters - NO DEFAULT FILTERS, let Frappe RBAC handle permissions
        filters = {}

        # Add optional filters only if provided
        if status:
            filters["status"] = status

        # Add search filter (search on Employee fields)
        or_filters = None
        if search:
            or_filters = [
                ["employee_name", "like", f"%{search}%"],
                ["cell_number", "like", f"%{search}%"],
                ["company_email", "like", f"%{search}%"],
                ["personal_email", "like", f"%{search}%"]
            ]

        # Get total count for pagination
        # Note: frappe.db.count() does NOT support or_filters parameter
        if or_filters:
            # When search/or_filters are present, use frappe.get_all for counting
            total_count = len(frappe.get_all(
                "Employee",
                filters=filters,
                or_filters=or_filters
            ))
        else:
            # Simple count when no or_filters
            total_count = frappe.db.count(
                "Employee",
                filters=filters
            )

        # Query Employee with health professional data
        # Frappe RBAC automatically filters based on user permissions
        employees = frappe.get_list(
            "Employee",
            filters=filters,
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

        # Enrich with Health Professional data
        for emp in employees:
            if emp.get("custom_health_professional"):
                try:
                    hp_data = frappe.db.get_value(
                        "Health Professional",
                        emp.custom_health_professional,
                        [
                            "professional_cadre", "professional_specialty",
                            "sub_specialty", "registration_number",
                            "license_id", "license_type", "license_end",
                            "phone", "email", "county"
                        ],
                        as_dict=True
                    )
                    if hp_data:
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
                except Exception as e:
                    frappe.log_error(f"Error fetching HP data for {emp.name}: {str(e)}")

        # Filter by cadre/specialty if specified (post-fetch filter since cadre is in HP table)
        if cadre:
            employees = [
                emp for emp in employees
                if emp.get("professional_cadre") == cadre
            ]
            total_count = len(employees)

        if specialty:
            employees = [
                emp for emp in employees
                if emp.get("professional_specialty") == specialty
            ]
            total_count = len(employees)

        # Calculate metrics
        metrics = calculate_health_professional_metrics(status, cadre, specialty, search)

        return {
            "success": True,
            "data": {
                "items": employees,
                "total_count": total_count,
                "page": page,
                "page_size": page_size,
                "metrics": metrics
            }
        }

    except Exception as e:
        frappe.log_error(f"Error fetching health professionals: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


@frappe.whitelist()
def get_health_professional_detail(id: str):
    """
    Get detailed health professional information including affiliations

    Args:
        id: Health Professional name or registration_id

    Returns:
        dict: {
            success: bool,
            data: dict (Health Professional record with affiliations)
        }
    """
    try:
        # Try to find by name or registration_id
        hp = None

        # First try direct name lookup
        if frappe.db.exists("Health Professional", id):
            hp = frappe.get_doc("Health Professional", id)
        else:
            # Try registration_id lookup
            hp_list = frappe.get_list(
                "Health Professional",
                filters={"registration_id": id},
                limit=1
            )
            if hp_list:
                hp = frappe.get_doc("Health Professional", hp_list[0].name)

        if not hp:
            return {
                "success": False,
                "error": f"Health Professional not found: {id}"
            }

        # Get professional affiliations
        affiliations = frappe.get_list(
            "Facility Affiliation",
            filters={"health_professional": hp.name},
            fields=[
                "name", "health_facility", "health_professional_name",
                "role", "designation", "employment_type", "affiliation_status",
                "start_date", "end_date", "facility_affiliation"
            ],
            order_by="start_date desc"
        )

        # Get health facility names for affiliations
        for affiliation in affiliations:
            if affiliation.health_facility:
                facility_name = frappe.db.get_value(
                    "Health Facility",
                    affiliation.health_facility,
                    "health_facility_name"
                )
                affiliation["health_facility_name"] = facility_name

        # Get employee record if exists
        employee_data = None
        if hp.employee:
            employee_data = frappe.get_value(
                "Employee",
                hp.employee,
                ["name", "employee_name", "department", "designation",
                 "date_of_joining", "company"],
                as_dict=True
            )

        # Build response
        hp_dict = hp.as_dict()
        hp_dict["professional_affiliations"] = affiliations
        hp_dict["employee_record"] = employee_data

        return {
            "success": True,
            "data": hp_dict
        }

    except Exception as e:
        frappe.log_error(f"Error fetching health professional detail: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


@frappe.whitelist()
def get_professional_cadres():
    """
    Get distinct list of professional cadres for dropdown

    Returns:
        dict: {
            success: bool,
            data: list of {label, value} objects
        }
    """
    try:
        cadres = frappe.get_list(
            "Health Professional",
            fields=["professional_cadre"],
            distinct=True,
            filters={"professional_cadre": ["is", "set"]},
            order_by="professional_cadre asc"
        )

        # Format for dropdown
        options = [
            {"label": cadre.professional_cadre, "value": cadre.professional_cadre}
            for cadre in cadres
            if cadre.professional_cadre
        ]

        return {
            "success": True,
            "data": options
        }

    except Exception as e:
        frappe.log_error(f"Error fetching professional cadres: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


@frappe.whitelist()
def get_specialties_by_cadre(cadre: Optional[str] = None):
    """
    Get distinct list of specialties, optionally filtered by cadre

    Args:
        cadre: Optional professional cadre to filter by

    Returns:
        dict: {
            success: bool,
            data: list of {label, value} objects
        }
    """
    try:
        filters = {"professional_specialty": ["is", "set"]}

        if cadre:
            filters["professional_cadre"] = cadre

        specialties = frappe.get_list(
            "Health Professional",
            fields=["professional_specialty"],
            distinct=True,
            filters=filters,
            order_by="professional_specialty asc"
        )

        # Format for dropdown
        options = [
            {"label": spec.professional_specialty, "value": spec.professional_specialty}
            for spec in specialties
            if spec.professional_specialty
        ]

        return {
            "success": True,
            "data": options
        }

    except Exception as e:
        frappe.log_error(f"Error fetching specialties: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }


def calculate_health_professional_metrics(
    status: Optional[str] = None,
    cadre: Optional[str] = None,
    specialty: Optional[str] = None,
    search: Optional[str] = None
) -> Dict[str, int]:
    """
    Internal function to calculate health professional metrics
    Frappe RBAC automatically applies user permissions

    Args:
        status: Optional status filter
        cadre: Optional cadre filter
        specialty: Optional specialty filter
        search: Optional search term

    Returns:
        dict: Metrics dictionary
    """
    # Build filters - NO DEFAULT FILTERS
    filters = {}
    if status:
        filters["status"] = status

    or_filters = None
    if search:
        or_filters = [
            ["employee_name", "like", f"%{search}%"],
            ["cell_number", "like", f"%{search}%"],
            ["company_email", "like", f"%{search}%"],
            ["personal_email", "like", f"%{search}%"]
        ]

    # Total count - Query Employee doctype
    if or_filters:
        total_count = len(frappe.get_all(
            "Employee",
            filters=filters,
            or_filters=or_filters
        ))
    else:
        total_count = frappe.db.count(
            "Employee",
            filters=filters
        )

    # Active employees
    active_filters = filters.copy()
    active_filters["status"] = "Active"

    if or_filters:
        active_count = len(frappe.get_all(
            "Employee",
            filters=active_filters,
            or_filters=or_filters
        ))
    else:
        active_count = frappe.db.count(
            "Employee",
            filters=active_filters
        )

    # For cadre count, we need to fetch HP data
    # This is a simplified version - just return 0 for now
    cadre_count = 0

    # Active affiliations - simplified
    active_affiliations = 0

    return {
        "total_count": total_count,
        "licensed_active": active_count,
        "cadre_count": cadre_count,
        "active_affiliations": active_affiliations
    }
