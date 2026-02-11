from healthpro_erp.healthpro_erp.decorators.permissions import auth_required
from .utils import *
import frappe
from frappe import _
from frappe.utils import now
from datetime import datetime, timedelta
from .user_registration import create_employee_from_user

from .healthpro_mobile_app.mobile_notifications import send_firebase_notification

_cryptoService = SecureTransportManager()


@frappe.whitelist()
def health_professional_verification(**kwargs):
    registration_number = kwargs.pop("registration_number")

    if not registration_number:
        return api_response(
            success=False,
            message="Both National ID and Registration Number are required",
            status_code=400,
        )
    try:
        hwr_data, error = fetch_hwr_practitioner(**kwargs)

        # Check for None first, then check status
        if hwr_data is None or hwr_data.get("status") == "error":
            return api_response(
                success=False,
                message="User not found in the Health Worker Registry.",
                status_code=404,
            )

        if error:
            if (
                error.get(
                    "status_code",
                )
                == 404
            ):
                return api_response(
                    success=False,
                    message="User not found in the Health Worker Registry.",
                    status_code=404,
                )
            else:
                return api_response(
                    success=False,
                    message=error.get("message", "Error fetching health worker data"),
                    status_code=error.get("status_code", 500),
                )
        # verify the registration number matches
        hwr_registration_number = hwr_data.get("membership", {}).get(
            "external_reference_id"
        )

        if hwr_registration_number.lower() != registration_number.lower():
            return api_response(
                success=False,
                message="No health worker found with matching ID number & registration number details",
                status_code=404,
            )

        try:
            encrypted_hwr_data = _cryptoService.rsa_encrypt(hwr_data)
        except Exception as e:
            frappe.log_error(f"Encryption Error: {e}")
            return api_response(
                success=False,
                message=f"Error encrypting user data",
                status_code=500,
            )
        return api_response(
            success=True,
            # data=hwr_data,
            data=encrypted_hwr_data,
            message="Health Worker Record Retrieved Successfully",
            status_code=200,
        )
    except Exception as e:
        frappe.log_error(f"Error in fetch_hwr_practitioner: {str(e)}")
        return api_response(
            success=False,
            message="Error fetching health worker data from registry",
            status_code=500,
        )


@frappe.whitelist()
def onboard_health_professional(**kwargs):
    try:
        data = kwargs.get("data")

        # Validate input data first
        validation_result = validate_onboarding_data(data)
        if not validation_result["valid"]:
            return api_response(
                success=False,
                message={"validation_errors": validation_result["errors"]},
                status_code=400,
            )
        employment_details = data.get("employment_details", {})

        # Create Health Professional Record
        health_professional_doc = frappe.new_doc("Health Professional")
        health_professional_doc_name = health_professional_doc.create_hp_from_hwr_data(
            data
        )

        # Create Facility Affiliation Record
        facility_affiliation_result = create_facility_affiliation_record(
            health_professional_doc_name, employment_details
        )

        # Check if there was an error with facility affiliation
        if isinstance(
            facility_affiliation_result, dict
        ) and facility_affiliation_result.get("error"):
            return api_response(
                success=False,
                message=facility_affiliation_result["message"],
                status_code=400,
            )

        # Extract facility affiliation name
        facility_affiliation_name = None
        if isinstance(facility_affiliation_result, dict):
            if facility_affiliation_result.get("success"):
                facility_affiliation_name = facility_affiliation_result.get("name")
            else:
                return api_response(
                    success=False,
                    message=facility_affiliation_result.get(
                        "message", "Unknown error in facility affiliation"
                    ),
                    status_code=400,
                )
        else:
            facility_affiliation_name = facility_affiliation_result

        # Append to Professional Affiliation child table
        try:
            append_professional_affiliation_record(
                health_professional_doc_name,
                employment_details,
                facility_affiliation_name,
            )
        except Exception as append_error:
            frappe.log_error(
                frappe.get_traceback(), "append_professional_affiliation_record failed"
            )
            return api_response(
                success=False,
                message=f"Failed to create professional affiliation record: {str(append_error)}",
                status_code=500,
            )
        # Return success response
        frappe.db.commit()

        return api_response(
            success=True,
            data={
                "health_professional": health_professional_doc_name,
                "facility_affiliation": facility_affiliation_name,
            },
            message="Health professional created successfully. Facility affiliation is pending confirmation.",
        )

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "onboard_health_professional failed")
        return api_response(
            success=False,
            message=f"Failed to onboard health professional: {str(e)}",
            status_code=500,
        )


@auth_required()
def create_facility_affiliation_record_v1(health_professional_name, employment_details):
    """
    Create Facility Affiliation record
    """
    import secrets
    from datetime import datetime, timedelta

    try:
        settings = frappe.get_doc("HealthPro Backend Settings")
        expiry_days = settings.affiliation_token_expiry_days
        if not expiry_days:
            return {
                "error": True,
                "message": "affiliation_token_expiry_days not configured in settings",
            }

        health_facility = employment_details.get("fid")

        if not health_facility:
            return {
                "error": True,
                "message": "Health facility ID (fid) is required in employment details",
            }

        # Check for duplicate affiliation
        existing_affiliation = frappe.get_all(
            "Facility Affiliation",
            filters={
                "health_professional": health_professional_name,
                "health_facility": health_facility,
                "affiliation_status": ["in", ["Pending", "Confirmed", "Active"]],
            },
            fields=["name", "affiliation_status"],
        )

        if existing_affiliation:
            return {
                "error": True,
                "message": f"Health Professional already has an existing affiliation request with this facility (Status: {existing_affiliation[1]})",
                "existing_affiliation": existing_affiliation[0],
            }

        # Ensure designation exists before creating record
        designation_name = employment_details.get("designation", "")
        if designation_name:
            ensure_designation_exists(designation_name)

        # Create new Facility Affiliation document
        doc = frappe.new_doc("Facility Affiliation")

        # Required fields
        doc.health_professional = health_professional_name
        doc.health_facility = health_facility
        doc.employee = None

        # Employment details
        doc.role = employment_details.get("designation", "")
        doc.employment_type = employment_details.get("employment_type", "")
        doc.designation = designation_name
        doc.start_date = employment_details.get("start_date")
        doc.end_date = employment_details.get("end_date")

        # Status and metadata
        doc.affiliation_status = "Pending"
        doc.requested_by = frappe.session.user
        doc.requested_date = datetime.now().date()
        doc.expiry_date = datetime.now().date() + timedelta(days=expiry_days)
        doc.verification_token = secrets.token_urlsafe(32)

        doc.insert()
        frappe.db.commit()

        # send the mobile notification
        notification_bundle = {}
        send_firebase_notification(notification_bundle)

        return {"success": True, "name": doc.name}

    except Exception as e:
        frappe.log_error(
            frappe.get_traceback(), "create_facility_affiliation_record failed"
        )
        return {
            "error": True,
            "message": f"Failed to create facility affiliation record: {str(e)}",
        }


def _create_facility_affiliation_record_internal(
    health_professional_name,
    employment_details,
    requested_by=None,
    ignore_permissions=False,
):
    """
    Internal function to create Facility Affiliation record (no auth decorator).
    Used by background jobs and internal processes.

    Args:
        health_professional_name (str): Health Professional document name
        employment_details (dict): Employment details including fid, employment_type, designation, etc.
        requested_by (str): User who requested the affiliation (optional, defaults to frappe.session.user)
        ignore_permissions (bool): Whether to bypass permission checks (default: False)

    Returns:
        dict: Result with 'success' or 'error' key
    """
    import secrets
    from datetime import datetime, timedelta

    try:
        settings = frappe.get_doc("HealthPro Backend Settings")
        expiry_days = settings.affiliation_token_expiry_days
        if not expiry_days:
            return {
                "error": True,
                "message": "affiliation_token_expiry_days not configured in settings",
            }

        health_facility = employment_details.get("fid")

        if not health_facility:
            return {
                "error": True,
                "message": "Health facility ID (fid) is required in employment details",
            }

        # Check for duplicate affiliation
        existing_affiliation = frappe.get_all(
            "Facility Affiliation",
            filters={
                "health_professional": health_professional_name,
                "health_facility": health_facility,
                "affiliation_status": ["in", ["Pending", "Confirmed", "Active"]],
            },
            fields=["name", "affiliation_status"],
        )

        existing_fulltime_affiliation = frappe.get_all(
            "Facility Affiliation",
            filters={
                "health_professional": health_professional_name,
                "employment_type": "Full-time Employee",
                "affiliation_status": ["in", ["Pending", "Confirmed", "Active"]],
            },
            fields=["name", "affiliation_status"],
        )

        if (
            existing_fulltime_affiliation
            and employment_details.get("employment_type") == "Full-time Employee"
        ):
            return {
                "error": True,
                "message": f"Health Professional already has an existing full time affiliation request with another facility",
                "existing_affiliation": existing_fulltime_affiliation,
            }

        if existing_affiliation:
            return {
                "error": True,
                "message": f"Health Professional already has an existing affiliation request with this facility",
                "existing_affiliation": existing_affiliation,
            }

        # Ensure designation exists before creating record
        designation_name = employment_details.get("designation", "")
        if designation_name:
            ensure_designation_exists(designation_name)

        # Create new Facility Affiliation document
        doc = frappe.new_doc("Facility Affiliation")

        # Required fields
        doc.health_professional = health_professional_name
        doc.health_facility = health_facility
        doc.employee = None

        # Employment details
        doc.role = employment_details.get("designation", "")
        doc.employment_type = employment_details.get("employment_type", "")
        doc.designation = designation_name
        doc.start_date = employment_details.get("start_date")
        doc.end_date = employment_details.get("end_date")

        # Status and metadata
        doc.affiliation_status = "Pending"
        doc.requested_by = requested_by or frappe.session.user
        doc.requested_date = datetime.now().date()
        doc.expiry_date = datetime.now().date() + timedelta(days=expiry_days)
        doc.verification_token = secrets.token_urlsafe(32)

        doc.save(ignore_permissions=ignore_permissions)

        return {"success": True, "name": doc.name}

    except Exception as e:
        frappe.log_error(
            "create_facility_affiliation_record_internal failed",
            frappe.get_traceback(),
        )
        return {
            "error": True,
            "message": f"Failed to create facility affiliation record: {str(e)}",
        }


@auth_required()
def create_facility_affiliation_record(health_professional_name, employment_details):
    """
    Create Facility Affiliation record (API endpoint with auth).
    This is a wrapper around the internal function for API calls.
    """
    return _create_facility_affiliation_record_internal(
        health_professional_name, employment_details
    )


# @auth_required()
# def create_facility_affiliation_record(health_professional_name, employment_details):
#     """
#     Create Facility Affiliation record
#     """
#     import secrets
#     from datetime import datetime, timedelta

#     try:
#         settings = frappe.get_doc("HealthPro Backend Settings")
#         expiry_days = settings.affiliation_token_expiry_days
#         if not expiry_days:
#             return {
#                 "error": True,
#                 "message": "affiliation_token_expiry_days not configured in settings",
#             }

#         health_facility = employment_details.get("fid")

#         if not health_facility:
#             return {
#                 "error": True,
#                 "message": "Health facility ID (fid) is required in employment details",
#             }

#         # Check for duplicate affiliation
#         existing_affiliation = frappe.get_all(
#             "Facility Affiliation",
#             filters={
#                 "health_professional": health_professional_name,
#                 "health_facility": health_facility,
#                 "affiliation_status": ["in", ["Pending", "Confirmed", "Active"]],
#             },
#             fields=["name", "affiliation_status"],
#         )

#         existing_fulltime_affiliation = frappe.get_all(
#             "Facility Affiliation",
#             filters={
#                 "health_professional": health_professional_name,
#                 "employment_type": "Full-time Employee",
#                 "affiliation_status": ["in", ["Pending", "Confirmed", "Active"]],
#             },
#             fields=["name", "affiliation_status"],
#         )

#         if (
#             existing_fulltime_affiliation
#             and employment_details.get("employment_type") == "Full-time Employee"
#         ):
#             return {
#                 "error": True,
#                 "message": f"Health Professional already has an existing full time affiliation request with another facility",
#                 "existing_affiliation": existing_fulltime_affiliation,
#             }

#         if existing_affiliation:
#             return {
#                 "error": True,
#                 "message": f"Health Professional already has an existing affiliation request with this facility",
#                 "existing_affiliation": existing_affiliation,
#             }

#         # Ensure designation exists before creating record
#         designation_name = employment_details.get("designation", "")
#         if designation_name:
#             ensure_designation_exists(designation_name)

#         # Create new Facility Affiliation document
#         doc = frappe.new_doc("Facility Affiliation")

#         # Required fields
#         doc.health_professional = health_professional_name
#         doc.health_facility = health_facility
#         doc.employee = None

#         # Employment details
#         doc.role = employment_details.get("designation", "")
#         doc.employment_type = employment_details.get("employment_type", "")
#         doc.designation = designation_name
#         doc.start_date = employment_details.get("start_date")
#         doc.end_date = employment_details.get("end_date")

#         # Status and metadata
#         doc.affiliation_status = "Pending"
#         doc.requested_by = frappe.session.user
#         doc.requested_date = datetime.now().date()
#         doc.expiry_date = datetime.now().date() + timedelta(days=expiry_days)
#         doc.verification_token = secrets.token_urlsafe(32)

#         # doc.insert()
#         doc.save()
#         # frappe.db.commit()

#         return {"success": True, "name": doc.name}

#     except Exception as e:
#         frappe.log_error(
#             frappe.get_traceback(), "create_facility_affiliation_record failed"
#         )
#         return {
#             "error": True,
#             "message": f"Failed to create facility affiliation record: {str(e)}",
#         }


def append_professional_affiliation_record(
    health_professional_name, employment_details, facility_affiliation_name
):
    """
    Append record to Professional Affiliation child table
    """
    if not health_professional_name:
        raise ValueError("Health professional name is required")

    if not employment_details:
        raise ValueError("Employment details are required")

    # Ensure designation exists
    designation_name = employment_details.get("designation", "")
    if designation_name:
        ensure_designation_exists(designation_name)

    # Get the Health Professional document
    hp_doc = frappe.get_doc("Health Professional", health_professional_name)

    # Create new row in professional_affiliations child table
    affiliation_row = hp_doc.append("professional_affiliations", {})

    # Set child table fields
    affiliation_row.health_worker = health_professional_name
    affiliation_row.health_facility = employment_details.get("fid")
    affiliation_row.employee = None
    affiliation_row.role = employment_details.get("designation", "")
    affiliation_row.employment_type = employment_details.get("employment_type", "")
    affiliation_row.designation = designation_name  # This will now exist
    affiliation_row.start_date = employment_details.get("start_date")
    affiliation_row.end_date = employment_details.get("end_date")
    affiliation_row.affiliation_status = "Pending"
    affiliation_row.facility_affiliation = facility_affiliation_name

    # Save the parent document
    hp_doc.save()
    frappe.db.commit()


def ensure_designation_exists(designation_name):
    """
    Check if designation exists, create if not found
    """
    if not designation_name:
        return None

    designation_name = designation_name.strip()

    # ADDED: Additional validation for empty string after strip
    if not designation_name:
        return None

    # Try to find existing designation (case-insensitive)
    existing = frappe.get_list(
        "Designation",
        filters=[["designation_name", "like", f"{designation_name}"]],
        fields=["name", "designation_name"],
    )

    # Check for exact match (case-insensitive)
    for record in existing:
        if record.designation_name.lower() == designation_name.lower():
            return record.name

    # Create new designation if not found
    try:
        designation_doc = frappe.new_doc("Designation")
        designation_doc.designation_name = designation_name
        designation_doc.description = f"Auto-created designation: {designation_name}"
        designation_doc.insert(ignore_permissions=False)
        # frappe.db.commit()

        return designation_doc.name

    except Exception as e:
        frappe.log_error(f"Error creating designation {designation_name}: {str(e)}")
        return None


def create_default_designations():
    """
    Create default designations. Use this once to populate default designations
    """
    default_designations = [
        "Medical Officer",
        "Clinical Officer",
        "Registered Nurse",
        "Enrolled Nurse",
        "Community Health Worker",
        "Pharmacist",
        "Pharmaceutical Technologist",
        "Laboratory Technologist",
        "Medical Laboratory Technician",
        "Radiographer",
        "Physiotherapist",
        "Occupational Therapist",
        "Nutritionist",
        "Dentist",
        "Dental Technologist",
        "Ophthalmic Clinical Officer",
        "Public Health Officer",
        "Health Records Officer",
        "Medical Social Worker",
        "Counselor",
    ]

    created_count = 0
    for designation in default_designations:
        if ensure_designation_exists(designation):
            created_count += 1

    frappe.logger().info(f"Ensured {created_count} designations exist")
    return created_count


def validate_onboarding_data(data):
    """
    Validate required fields for health professional onboarding
    Returns: dict with 'valid' boolean and 'errors' list
    """
    errors = []

    if not data:
        return {"valid": False, "errors": ["No data provided"]}

    # Validate membership (all fields mandatory)
    membership = data.get("membership", {})
    if not membership:
        errors.append("membership section is required")
    else:
        membership_required = [
            "id",
            "status",
            "full_name",
            "gender",
            "first_name",
            "last_name",
            "registration_id",
            "external_reference_id",
            "licensing_body",
            "specialty",
            "is_active",
        ]
        for field in membership_required:
            if not membership.get(field):
                errors.append(f"membership.{field} is required")

    # Validate licenses (array can be empty, but if present, all fields required)
    licenses = data.get("licenses", [])
    if licenses:
        for i, license_data in enumerate(licenses):
            license_required = [
                "id",
                "external_reference_id",
                "license_type",
                "license_start",
                "license_end",
            ]
            for field in license_required:
                if not license_data.get(field):
                    errors.append(f"licenses[{i}].{field} is required")

    # Validate professional_details (only professional_cadre mandatory)
    professional_details = data.get("professional_details", {})
    if not professional_details:
        errors.append("professional_details section is required")
    else:
        if not professional_details.get("professional_cadre"):
            errors.append("professional_details.professional_cadre is required")

    # Validate contacts (phone and email mandatory)
    contacts = data.get("contacts", {})
    if not contacts:
        errors.append("contacts section is required")
    else:
        contacts_required = ["phone", "email"]
        for field in contacts_required:
            if not contacts.get(field):
                errors.append(f"contacts.{field} is required")

    # Validate identifiers (id type and number mandatory)
    identifiers = data.get("identifiers", {})
    if not identifiers:
        errors.append("identifiers section is required")
    else:
        identifiers_required = ["identification_type", "identification_number"]
        for field in identifiers_required:
            if not identifiers.get(field):
                errors.append(f"identifiers.{field} is required")

    # Validate employment_details (fid, employment_type, designation mandatory)
    employment_details = data.get("employment_details", [])
    if not employment_details:
        errors.append("employment_details section is required")
    else:
        if not isinstance(employment_details, list):
            employment_details = [employment_details]

        employment_required = ["fid", "employment_type", "designation"]
        for index, employment_detail in enumerate(employment_details):
            for field in employment_required:
                if not employment_detail.get(field):
                    errors.append(f"employment_details.{index}.{field} is required")

    return {"valid": len(errors) == 0, "errors": errors}


def create_employee_for_health_professional(
    health_professional, health_facility_id, facility_affiliation=None
):
    """
    Create employee record for health professional

    Args:
        health_professional (frappe.Document): Health Professional document
        health_facility_id (str): Health Facility ID

    Returns:
        frappe.Document: Created Employee document or None
    """
    try:
        # Check if Health Professional has a user account
        hp_email = health_professional.get("email")
        hp_official_email = health_professional.get("official_email")

        user_email = None
        if hp_email and frappe.db.exists("User", hp_email):
            user_email = hp_email
        elif hp_official_email and frappe.db.exists("User", hp_official_email):
            user_email = hp_official_email

        # If no user account, create employee from Health Professional data
        return create_employee_from_health_professional(
            health_professional, health_facility_id, facility_affiliation
        )

    except Exception as e:
        frappe.log_error(f"Error in create_employee_for_health_professional: {str(e)}")
        return None


def create_employee_from_health_professional(
    health_professional, health_facility_id, facility_affiliation=None
):
    """
    Create employee record from Health Professional data (no user account)

    Args:
        health_professional (frappe.Document): Health Professional document
        health_facility_id (str): Health Facility ID

    Returns:
        frappe.Document: Created Employee document
    """
    try:
        # Find department where name contains health_facility_id
        department = frappe.db.get_list(
            "Department",
            filters={"name": ["like", f"%{health_facility_id}%"]},
            fields=["name", "company"],
            limit=1,
        )

        if not department:
            raise frappe.ValidationError(
                f"No department found containing facility ID: {health_facility_id}"
            )

        department_name = department[0].name
        company_name = department[0].company

        if not company_name:
            raise frappe.ValidationError(
                f"No company linked to department {department_name}"
            )

        # Check if employee already exists for this HP and facility combination
        existing_employee = frappe.db.get_value(
            "Employee",
            {
                "custom_health_professional": health_professional.name,
                "department": department_name,
            },
            "name",
        )

        if existing_employee:
            return frappe.get_doc("Employee", existing_employee)

        # Extract names
        full_name = health_professional.get("full_name", "")
        first_name = health_professional.get("first_name", "")
        last_name = health_professional.get("last_name", "")

        # If first_name or last_name is empty, try to split full_name
        if not first_name or not last_name:
            name_parts = full_name.split()
            if len(name_parts) >= 2:
                first_name = first_name or name_parts[0]
                last_name = last_name or " ".join(name_parts[1:])
            elif len(name_parts) == 1:
                first_name = first_name or name_parts[0]
                last_name = last_name or ""

        # Create employee document
        employee = frappe.get_doc(
            {
                "doctype": "Employee",
                "first_name": first_name,
                "last_name": last_name,
                "employee_name": full_name or f"{first_name} {last_name}".strip(),
                "gender": health_professional.get("gender"),
                "date_of_birth": health_professional.get("date_of_birth"),
                "company": company_name,
                "department": department_name,
                "status": "Active",
                "date_of_joining": (
                    facility_affiliation.start_date
                    if facility_affiliation and facility_affiliation.start_date
                    else frappe.utils.today()
                ),
                "designation": (
                    facility_affiliation.designation if facility_affiliation else None
                ),
                "employment_type": (
                    facility_affiliation.employment_type
                    if facility_affiliation
                    else None
                ),
                "cell_number": health_professional.get("phone"),
                "personal_email": health_professional.get("email"),
                "company_email": health_professional.get("official_email"),
                "custom_identification_type": health_professional.get(
                    "identification_type"
                ),
                "custom_identification_number": health_professional.get(
                    "identification_number"
                ),
                "custom_health_professional": health_professional.name,  # Link back to HP record
                "custom_facility_id": health_facility_id,  # Link to HF record
                "create_user_permission": 0,
            }
        )

        # Insert employee record
        employee.insert(ignore_permissions=True)

        return employee

    except Exception as e:
        frappe.log_error(f"Error creating employee from health professional: {str(e)}")
        raise e


def update_professional_affiliations_child_table(
    health_professional_name, facility_affiliation_name, employee_name
):
    """
    Update Professional Affiliations child table with employee and active status

    Args:
        health_professional_name (str): Health Professional document name
        facility_affiliation_name (str): Facility Affiliation document name
        employee_name (str): Employee document name
    """
    try:
        # Get Health Professional document
        hp_doc = frappe.get_doc("Health Professional", health_professional_name)

        # Find the matching row in professional_affiliations child table
        for row in hp_doc.professional_affiliations:
            if row.facility_affiliation == facility_affiliation_name:
                row.employee = employee_name
                row.affiliation_status = "Active"
                break

        # Save the parent document
        hp_doc.save()

    except Exception as e:
        frappe.log_error(
            f"Error updating professional affiliations child table: {str(e)}"
        )
        raise e


def remove_professional_affiliation_record(
    health_professional_name, facility_affiliation_name
):
    """
    Remove the professional affiliation record from the Health Professional's child table

    Args:
        health_professional_name (str): Name of the Health Professional doc
        facility_affiliation_name (str): Name of the Facility Affiliation to remove
    """
    try:
        # Get the Health Professional doc
        hp_doc = frappe.get_doc("Health Professional", health_professional_name)

        # Find and remove the affiliation record
        affiliations_to_keep = [
            aff
            for aff in hp_doc.professional_affiliations
            if aff.facility_affiliation != facility_affiliation_name
        ]

        hp_doc.set("professional_affiliations", affiliations_to_keep)
        hp_doc.save()

    except Exception as e:
        frappe.log_error(
            f"Error removing professional affiliation {facility_affiliation_name} "
            f"from Health Professional {health_professional_name}: {str(e)}"
        )
        raise e


def generate_employment_confirmation_email_link(verification_token):
    """
    Generate employment confirmation email link using backend settings

    Args:
        verification_token (str): The verification token

    Returns:
        str: Complete confirmation URL
    """
    try:
        # Get confirmation page & base URLs from backend settings
        settings = frappe.get_doc("HealthPro Backend Settings")
        confirmation_page_url = settings.get("frontend_employment_confirmation_page")
        frontend_baseurl = settings.get("frontend_baseurl")

        if not confirmation_page_url or not frontend_baseurl:
            frappe.log_error(
                "Confirmation page URL or Frontend Base URL not set in Healthpro Backend Settings"
            )
            return None

        confirmation_url = (
            f"{frontend_baseurl}{confirmation_page_url}?token={verification_token}"
        )
        return confirmation_url

    except Exception as e:
        frappe.log_error(f"Error generating confirmation link: {str(e)}")
        return None


def validate_affiliation_token(verification_token):
    """
    Validate employment confirmation token and return affiliation details

    Args:
        verification_token (str): The verification token to validate

    Returns:
        dict: Contains validation result and affiliation data if valid
    """
    try:
        if not verification_token:
            return {
                "valid": False,
                "message": "Verification token is required",
                "status_code": 400,
            }

        # Find the Facility Affiliation record with this token
        facility_affiliation = frappe.db.get_value(
            "Facility Affiliation",
            {"verification_token": verification_token},
            [
                "name",
                "health_professional",
                "affiliation_status",
                "expiry_date",
                "token_used",
            ],
            as_dict=True,
        )

        if not facility_affiliation:
            return {
                "valid": False,
                "message": "Invalid verification token",
                "status_code": 404,
            }

        # Check if token has been used
        if facility_affiliation.get("token_used"):
            return {
                "valid": False,
                "message": "This link is no longer active",
                "status_code": 400,
            }

        # Check if token has expired
        current_date = datetime.now().date()
        if (
            facility_affiliation.expiry_date
            and facility_affiliation.expiry_date < current_date
        ):
            return {
                "valid": False,
                "message": "This invitation has expired",
                "status_code": 400,
            }

        # Check if affiliation is still pending
        if facility_affiliation.affiliation_status != "Pending":
            return {
                "valid": False,
                "message": f"This request has already been set as {facility_affiliation.affiliation_status.lower()}",
                "status_code": 400,
            }

        return {
            "valid": True,
            "affiliation_id": facility_affiliation.name,
            "health_professional": facility_affiliation.health_professional,
        }

    except Exception as e:
        frappe.log_error(
            f"Token validation error: {str(e)}", "validate_affiliation_token"
        )
        return {"valid": False, "message": "Error validating token", "status_code": 500}


def authenticate_employment_request(affiliation_id, verification_token=None):
    """
    Authenticate employment request using either token or session

    Args:
        affiliation_id (str): The Facility Affiliation record ID
        verification_token (str, optional): Verification token for email-based auth

    Returns:
        dict: Authentication result with health professional info
    """
    try:
        # Get the Facility Affiliation record
        try:
            facility_affiliation = frappe.get_doc(
                "Facility Affiliation", affiliation_id
            )
        except frappe.DoesNotExistError:
            return {
                "authenticated": False,
                "message": "Affiliation request not found",
                "status_code": 404,
            }

        # Token-based authentication (email flow)
        if verification_token:
            token_validation = validate_affiliation_token(verification_token)
            if not token_validation["valid"]:
                return {
                    "authenticated": False,
                    "message": token_validation["message"],
                    "status_code": token_validation["status_code"],
                }

            # Verify token belongs to this affiliation
            if facility_affiliation.verification_token != verification_token:
                return {
                    "authenticated": False,
                    "message": "Invalid verification token for this request",
                    "status_code": 403,
                }

            return {
                "authenticated": True,
                "auth_method": "token",
                "health_professional": facility_affiliation.health_professional,
                "facility_affiliation": facility_affiliation,
            }

        # Session-based authentication (in-app flow)
        else:
            current_user_email = frappe.session.user

            if not current_user_email or current_user_email == "Guest":
                return {
                    "authenticated": False,
                    "message": "Authentication required",
                    "status_code": 401,
                }

            # Get Health Professional record
            try:
                health_professional = frappe.get_doc(
                    "Health Professional", facility_affiliation.health_professional
                )
            except frappe.DoesNotExistError:
                return {
                    "authenticated": False,
                    "message": "Health Professional record not found",
                    "status_code": 404,
                }

            # Validate user email matches health professional
            hp_email = health_professional.get("email")
            hp_official_email = health_professional.get("official_email")
            current_email = current_user_email.lower() if current_user_email else ""
            hp_email_lower = hp_email.lower() if hp_email else ""
            hp_official_email_lower = (
                hp_official_email.lower() if hp_official_email else ""
            )

            if current_email not in [hp_email_lower, hp_official_email_lower]:
                return {
                    "authenticated": False,
                    "message": "Unauthorized: You can only manage your own employment requests",
                    "status_code": 403,
                }

            return {
                "authenticated": True,
                "auth_method": "session",
                "health_professional": facility_affiliation.health_professional,
                "health_professional_doc": health_professional,
                "facility_affiliation": facility_affiliation,
            }

    except Exception as e:
        frappe.log_error(
            f"Authentication error: {str(e)}", "authenticate_employment_request"
        )
        return {
            "authenticated": False,
            "message": "Authentication error occurred",
            "status_code": 500,
        }


def queue_employment_confirmation_email(health_professional_name, verification_token):
    """
    Queue employment confirmation email to be sent to health professional

    Args:
        health_professional_name (str): Name of the Health Professional document
        verification_token (str): The verification token for confirmation link

    Returns:
        bool: True if email was queued successfully, False otherwise
    """
    try:
        # Queue the email sending job
        frappe.enqueue(
            method="careverse_hq.api.health_worker_onboarding.send_employment_confirmation_email",
            queue="default",
            timeout=300,
            health_professional_name=health_professional_name,
            verification_token=verification_token,
            job_name=f"employment_confirmation_email_{health_professional_name}_{now()}",
        )

        frappe.logger().info(
            f"Employment confirmation email queued for HP: {health_professional_name}"
        )

    except Exception as e:
        frappe.log_error(f"Failed to queue employment confirmation email: {str(e)}")
        return False


def send_employment_confirmation_email(health_professional_name, verification_token):
    """
    Send employment confirmation email to health professional
    This function runs as a background job

    Args:
        health_professional_name (str): Name of the Health Professional document
        verification_token (str): The verification token for confirmation link
    """
    try:
        # Get Health Professional document
        hp_doc = frappe.get_doc("Health Professional", health_professional_name)

        if not hp_doc:
            frappe.log_error(
                f"Health Professional not found: {health_professional_name}"
            )
            return

        # Generate confirmation link
        confirmation_link = generate_employment_confirmation_email_link(
            verification_token
        )

        if not confirmation_link:
            frappe.log_error(
                f"Failed to generate confirmation link for HP: {health_professional_name}"
            )
            return

        # Get recipient emails
        recipients = []
        if hp_doc.get("email"):
            recipients.append(hp_doc.email)
        if hp_doc.get("official_email"):
            recipients.append(hp_doc.official_email)

        if not recipients:
            frappe.log_error(
                f"No email addresses found for HP: {health_professional_name}"
            )
            return

        # Remove duplicates
        recipients = list(dict.fromkeys(recipients))

        hp_full_name = hp_doc.get("full_name") or hp_doc.get("first_name", "")
        if hp_doc.get("last_name"):
            hp_full_name = (
                f"{hp_doc.get('first_name', '')} {hp_doc.get('last_name', '')}".strip()
            )

        # Get facility affiliation details using verification token
        facility_name = "a health facility"
        position_title = "a health professional"
        employment_type = "employment"
        requested_by = "a facility administrator"

        try:
            # First, find the document name using the verification token
            facility_affiliation_name = frappe.db.get_value(
                "Facility Affiliation",
                {"verification_token": verification_token},
                "name",
            )

            if facility_affiliation_name:
                # Now get the full document
                facility_affiliation = frappe.get_doc(
                    "Facility Affiliation", facility_affiliation_name
                )

                # Get facility name
                if facility_affiliation.get("health_facility"):
                    facility_doc = frappe.get_doc(
                        "Health Facility", facility_affiliation.health_facility
                    )
                    facility_name = (
                        facility_doc.get("facility_name")
                        or facility_affiliation.health_facility
                    )

                # Get position/designation
                if facility_affiliation.get("designation"):
                    position_title = facility_affiliation.get("designation")

                # Get employment type
                if facility_affiliation.get("employment_type"):
                    employment_type = facility_affiliation.get("employment_type")

                # Get requested by email
                if facility_affiliation.get("requested_by"):
                    requested_by = facility_affiliation.get("requested_by")

                frappe.logger().info(
                    f"Retrieved facility affiliation details for token: {verification_token}"
                )
            else:
                frappe.logger().warning(
                    f"No facility affiliation found for token: {verification_token}"
                )

        except Exception as facility_error:
            frappe.log_error(
                f"Could not retrieve facility affiliation details: {str(facility_error)}"
            )

        # Prepare template arguments
        template_args = {
            "hp_full_name": hp_full_name,
            "facility_name": facility_name,
            "position_title": position_title,
            "employment_type": employment_type,
            "requested_by": requested_by,
            "confirmation_link": confirmation_link,
        }

        # Send email to all recipients using Email Template
        for recipient in recipients:
            try:
                template_doc = frappe.get_doc(
                    "Email Template", "Employment Verification Request"
                )

                subject = frappe.render_template(template_doc.subject, template_args)
                message = frappe.render_template(template_doc.response, template_args)

                frappe.sendmail(
                    recipients=[recipient],
                    subject=subject,
                    message=message,
                    header=["Employment Verification", "orange"],
                )

                frappe.logger().info(
                    f"Employment verification email sent to: {recipient}"
                )

            except Exception as email_error:
                frappe.log_error(
                    f"Failed to send email to {recipient}: {str(email_error)}"
                )

        frappe.logger().info(
            f"Employment confirmation email process completed for HP: {health_professional_name}"
        )

    except Exception as e:
        frappe.log_error(f"Error in send_employment_confirmation_email: {str(e)}")
        raise
