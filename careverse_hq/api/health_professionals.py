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
                "start_date", "end_date"
            ],
            order_by="start_date desc"
        )

        # Get health facility names for affiliations
        for affiliation in affiliations:
            if affiliation.health_facility:
                facility_name = frappe.db.get_value(
                    "Health Facility",
                    affiliation.health_facility,
                    "facility_name"
                )
                affiliation["health_facility_name"] = facility_name

        # Get employee record if exists (including image for profile photo)
        employee_data = None
        if hp.employee:
            employee_data = frappe.get_value(
                "Employee",
                hp.employee,
                ["name", "employee_name", "department", "designation",
                 "date_of_joining", "company", "image"],
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


@frappe.whitelist()
def sync_health_professional_from_hwr(health_professional_id):
    """
    Initiate sync of Health Professional data from HWR API

    Args:
        health_professional_id: Health Professional document name (PUID)

    Returns:
        dict: {success: bool, message: str, job_id: str}
    """
    try:
        # 1. Validate HP exists
        if not frappe.db.exists("Health Professional", health_professional_id):
            return {
                "success": False,
                "message": f"Health Professional {health_professional_id} not found"
            }

        # 2. Check if sync already in progress
        hp = frappe.get_doc("Health Professional", health_professional_id)
        if hp.sync_in_progress:
            return {
                "success": False,
                "message": "Sync already in progress for this Health Professional"
            }

        # 3. Check if recently synced (< 5 minutes) for idempotency
        if hp.last_sync_date:
            from frappe.utils import add_to_date, now, get_datetime
            five_minutes_ago = get_datetime(add_to_date(now(), minutes=-5))
            if get_datetime(hp.last_sync_date) > five_minutes_ago:
                return {
                    "success": False,
                    "message": "Health Professional was synced recently. Please wait before syncing again."
                }

        # 4. Execute sync synchronously
        sync_health_professional_background(health_professional_id)

        # 5. Return success
        return {
            "success": True,
            "message": "Sync completed successfully"
        }

    except Exception as e:
        frappe.log_error(
            f"Error initiating sync for {health_professional_id}: {str(e)}\n\n{frappe.get_traceback()}",
            "HP Sync Initiation Error"
        )
        return {
            "success": False,
            "message": f"Failed to initiate sync: {str(e)}"
        }


def sync_health_professional_background(health_professional_id):
    """
    Background job to sync HP data from HWR

    Process:
    1. Get HP document
    2. Extract identifiers (registration_id OR identification_type + identification_number)
    3. Call fetch_hwr_practitioner() from healthpro_erp.api.utils
    4. Map HWR data to HP fields using _map_hwr_to_hp_fields()
    5. Update document with changed fields only
    6. Update sync status fields
    7. Log result to document comments
    8. Clear sync_in_progress flag
    """
    try:
        from healthpro_erp.api.utils import fetch_hwr_practitioner
        from frappe.utils import now

        # 1. Get HP document
        hp = frappe.get_doc("Health Professional", health_professional_id)

        # 2. Extract identifiers - prefer regulator number, then registration_number, then ID docs
        kwargs = {}
        if hp.external_reference_id:
            kwargs["registration_number"] = hp.external_reference_id
        elif hp.registration_number:
            kwargs["id"] = hp.registration_number
        elif hp.identification_type and hp.identification_number:
            kwargs["identification_type"] = hp.identification_type
            kwargs["identification_number"] = hp.identification_number
        else:
            raise Exception("Health Professional has no registration number or identification credentials")

        # 3. Call fetch_hwr_practitioner()
        hwr_data, error = fetch_hwr_practitioner(**kwargs)

        if error:
            # Sync failed
            frappe.db.set_value(
                "Health Professional",
                health_professional_id,
                {
                    "last_sync_date": now(),
                    "last_sync_status": "Failed",
                    "last_sync_error": str(error.get("message", "Unknown error")),
                    "sync_in_progress": 0
                },
                update_modified=False
            )
            frappe.db.commit()

            # Log to document comments
            hp.add_comment("Comment", f"HWR Sync Failed: {error.get('message', 'Unknown error')}")

            frappe.log_error(
                f"HWR sync failed for {health_professional_id}: {error}",
                "HP Sync Failure"
            )
            return

        # 4. Map HWR data to HP fields
        changed_fields = _map_hwr_to_hp_fields(hwr_data, hp)

        # 5. Update document with changed fields only
        if changed_fields:
            for field, value in changed_fields.items():
                setattr(hp, field, value)

            # Update sync status
            hp.last_sync_date = now()
            hp.last_sync_status = "Success"
            hp.last_sync_error = None
            hp.sync_in_progress = 0

            hp.save(ignore_permissions=True)
            frappe.db.commit()

            # 7. Log result to document comments
            changed_field_names = ", ".join(changed_fields.keys())
            hp.add_comment(
                "Comment",
                f"HWR Sync Successful: Updated fields: {changed_field_names}"
            )
        else:
            # No changes, but sync was successful
            frappe.db.set_value(
                "Health Professional",
                health_professional_id,
                {
                    "last_sync_date": now(),
                    "last_sync_status": "Success",
                    "last_sync_error": None,
                    "sync_in_progress": 0
                },
                update_modified=False
            )
            frappe.db.commit()

            hp.add_comment("Comment", "HWR Sync Successful: No changes detected")

        frappe.log_error(
            f"HWR sync successful for {health_professional_id}",
            "HP Sync Success"
        )

    except Exception as e:
        # 8. Clear sync_in_progress flag on error
        frappe.db.set_value(
            "Health Professional",
            health_professional_id,
            {
                "last_sync_date": frappe.utils.now(),
                "last_sync_status": "Failed",
                "last_sync_error": str(e)[:500],  # Limit error message length
                "sync_in_progress": 0
            },
            update_modified=False
        )
        frappe.db.commit()

        frappe.log_error(
            f"HWR sync error for {health_professional_id}: {str(e)}\n\n{frappe.get_traceback()}",
            "HP Sync Error"
        )


def _map_hwr_to_hp_fields(hwr_data, hp_doc):
    """
    Map HWR API fields to Health Professional fields
    Returns only fields that have changed

    HWR Structure (from test):
    {
      "membership": {
        "id": "PUID-0004946-1",
        "full_name": "Dr ALEX WAHOME NDUNGU",
        "first_name": "ALEX",
        "middle_name": "WAHOME",
        "last_name": "NDUNGU",
        "registration_id": "PUID-126296",
        "external_reference_id": "A4537",
        "specialty": "GENERAL SURGERY",
        "gender": "Male",
        "status": "Licensed"
      },
      "contacts": {
        "phone": "0721869468",
        "email": "wahomena@yahoo.com",
        "postal_address": "P.O BOX 587 00600 NAIROBI"
      },
      "licenses": [
        {
          "id": "KMPDC-SP-2026-648694",
          "external_reference_id": "SP/2026/638074",
          "license_type": "SPECIALIST PRACTICE",
          "license_start": "2025-11-14",
          "license_end": "2026-12-31"
        }
      ]
    }

    Mapping:
    - membership.full_name → full_name
    - membership.first_name → first_name
    - membership.last_name → last_name
    - membership.middle_name → middle_name
    - membership.specialty → professional_specialty
    - membership.gender → gender
    - membership.status → status
    - contacts.phone → official_phone (clean: +254 → 0)
    - contacts.email → official_email
    - contacts.postal_address → postal_address
    - licenses[most_recent].* → license_* fields
    """
    changed_fields = {}

    # Map membership fields
    membership = hwr_data.get("membership", {})
    field_mapping = {
        "full_name": membership.get("full_name"),
        "first_name": membership.get("first_name"),
        "last_name": membership.get("last_name"),
        "middle_name": membership.get("middle_name"),
        "professional_specialty": membership.get("specialty"),
        "status": membership.get("status")
    }

    # Map gender - convert to proper case
    if membership.get("gender"):
        gender_value = membership.get("gender")
        # Try to find matching Gender doctype
        if frappe.db.exists("Gender", gender_value):
            field_mapping["gender"] = gender_value
        elif frappe.db.exists("Gender", gender_value.title()):
            field_mapping["gender"] = gender_value.title()

    # Map contacts
    contacts = hwr_data.get("contacts", {})

    # Clean phone number (+254 → 0)
    if contacts.get("phone"):
        phone = contacts.get("phone", "").strip()
        if phone.startswith("+254"):
            phone = "0" + phone[4:]
        field_mapping["official_phone"] = phone

    field_mapping["official_email"] = contacts.get("email")
    field_mapping["postal_address"] = contacts.get("postal_address")

    # Map most recent license
    licenses = hwr_data.get("licenses", [])
    if licenses:
        most_recent_license = _get_most_recent_license(licenses)
        field_mapping["license_id"] = most_recent_license.get("id")
        field_mapping["license_external_reference_id"] = most_recent_license.get("external_reference_id")
        field_mapping["license_type"] = most_recent_license.get("license_type")
        field_mapping["license_start"] = most_recent_license.get("license_start")
        field_mapping["license_end"] = most_recent_license.get("license_end")

        # Log other licenses to comments if multiple exist
        if len(licenses) > 1:
            other_licenses = [lic for lic in licenses if lic.get("id") != most_recent_license.get("id")]
            if other_licenses:
                license_info = "\n".join([
                    f"- {lic.get('license_type')}: {lic.get('id')} (Valid: {lic.get('license_start')} to {lic.get('license_end')})"
                    for lic in other_licenses
                ])
                hp_doc.add_comment(
                    "Comment",
                    f"HWR Sync: Additional licenses found:\n{license_info}"
                )

    # Compare and collect changed fields
    for field, new_value in field_mapping.items():
        if new_value is None:
            continue

        current_value = getattr(hp_doc, field, None)

        # Convert values to strings for comparison to handle type differences
        if str(current_value) != str(new_value):
            changed_fields[field] = new_value

    return changed_fields


def _get_most_recent_license(licenses):
    """
    Find license with furthest license_end date
    If multiple with same end date, prefer most recent license_start

    Args:
        licenses: List of license dictionaries from HWR

    Returns:
        dict: Most recent license
    """
    if not licenses:
        return {}

    # Sort by license_end (descending), then license_start (descending)
    from datetime import datetime

    def parse_date(date_str):
        """Parse date string to datetime for comparison"""
        if not date_str:
            return datetime.min
        try:
            return datetime.strptime(str(date_str), "%Y-%m-%d")
        except:
            return datetime.min

    sorted_licenses = sorted(
        licenses,
        key=lambda x: (parse_date(x.get("license_end")), parse_date(x.get("license_start"))),
        reverse=True
    )

    return sorted_licenses[0]
