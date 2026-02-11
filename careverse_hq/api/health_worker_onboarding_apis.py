# DONE --> Dual search for user using ID and reg number
# DONE --> CHECK EXPIRY DATE SHOULD BE REQUESTED DATE + NUMBER OF SAYS SET IN CONFIG
# DONE --> CHECK API RESPONSE FORMAT
# DONE --> DESIGNATION IS USING LIKE TO CREATE INSTEAD OF CREATING EXACT MATCHES
# DONE --> FIX FACILITY AFFLIATION RECORD IS BEING CREATED MULTIPLE TIMES
# DONE --> ENSURE THE FACILITY AFFILIATION RECORD IS NOT DUPLICATED FOR THE SAME AFFILIATION
# DONE --> APPROVE & DECLINE APIS FOR MOBILE APP
# DONE --> CHECK EMPLOYEE, SHOULD NOT BE SET UNTIL EMPLOYEE IS CREATED, WHICH SHOULD HAPPEN AFTER THE STATUS IS SET TO CONFIRMED
# DONE --> THIS  VERIFICATION TOKEN TO BE SENT ONLY ON EMAIL FOR EMAIL CONFIRMATIONS NOT ON THE APP. REMOVE FROM FETCH WHEN EMAIL NOTIFICATION IS SETUP
# DONE --> ENCRYPT REQUEST BODY ON onboard_health_professional API
# DONE --> SET IF THE EXPIRY CONFIG IS 0, THEN THE INVITATION TO CONFIRM DOES NOT EXPIRE
# DONE --> APPROVE & DECLINE APIS VIA EMAIL
# PENDING --> BULK EMPLOYEE ONBOARDING, JUST CALL THE API MULTIPLE TIMES RIGHT?
# PENDING --> ADD REGENERATE INVITAION FOR EXPIRED AFFILIATION REQIESTS / TOKENS
# CONTINUE BUILDING


# step 0:  DONE
# step 1: Check if the user is already existing on the Health Professional doctype
# If not:
#     - create their record on HP doctype.
#     - Create a link from the HP record to the Health facility record
#     - create their record on Employee doctype.
#     - Create a link from the HP to the Company mapped to that facility
#     - create a record on the Professional Affiliation doctype with a status of "pending".
#     - Send an inviation to the email of the HP with details about: 1. The facility the HP is being linked to (name, address). 2. Who the inviter is 3. Capacity of role user is working at in the facility
#     - Create an API that feeds into this Professional Affiliation doctype that will be used by the HP app. An API that fetches the records on this doctype that are linked to that specific HP.
#

from careverse_hq.api.healthpro_mobile_app.jwt_auth_token_generation import (
    JWTDecorator,
)
from healthpro_erp.healthpro_erp.decorators.permissions import auth_required
from .utils import *
import frappe
from datetime import datetime, timedelta
import requests
from .hie_settings import HIE

_cryptoService = SecureTransportManager()
_hie = HIE()

from .health_worker_onboarding import *


@frappe.whitelist()
@auth_required()
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
                    message=error.get("message", "Error fetching health worker data"),
                    status_code=error.get("status_code"),
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

        if hwr_registration_number != registration_number:
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
@auth_required()
def health_professional_verification_v1(**kwargs):
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
                    message=error.get("message", "Error fetching health worker data"),
                    status_code=error.get("status_code"),
                )
            else:
                return api_response(
                    success=False,
                    message=error.get("message", "Error fetching health worker data"),
                    status_code=error.get("status_code", 500),
                )

        try:
            data = hwr_data
            affiliations = _practitioner_full_time_affiliation(
                identification_type=kwargs.get("identification_type"),
                identification_number=kwargs.get("identification_number"),
            )
            data["fulltime_affiliation"] = True if affiliations else False
            data["membership"]["full_name"] = mask_name(
                hwr_data.get("membership", {}).get("full_name")
            )
            data["membership"]["first_name"] = mask_name(
                hwr_data.get("membership", {}).get("first_name")
            )
            data["membership"]["middle_name"] = mask_name(
                hwr_data.get("membership", {}).get("middle_name")
            )
            data["membership"]["last_name"] = mask_name(
                hwr_data.get("membership", {}).get("last_name")
            )
            data["membership"]["registration_id"] = mask_name(
                hwr_data.get("membership", {}).get("registration_id")
            )
            data["membership"]["external_reference_id"] = mask_name(
                hwr_data.get("membership", {}).get("external_reference_id")
            )
            data["contacts"]["phone"] = mask_phone(
                hwr_data.get("contacts", {}).get("phone")
            )
            data["contacts"]["email"] = mask_email(
                hwr_data.get("contacts", {}).get("email")
            )
            licenses = hwr_data.get("licenses", [])

            masked_licenses = []
            for lic in licenses:
                masked_licenses.append(
                    {
                        **lic,  # keep other fields unchanged
                        "id": lic.get("id"),
                        "external_reference_id": mask_name(
                            lic.get("external_reference_id")
                        ),
                        "license_type": lic.get("license_type"),
                        "license_start": lic.get("license_start"),
                        "license_end": lic.get("license_end"),
                    }
                )

            data["licenses"] = masked_licenses

            # encrypted_hwr_data = _cryptoService.rsa_encrypt(data)
            encrypted_hwr_data = data
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
@auth_required()
def check_practitioner_full_time_affiliation(**kwargs):
    """
    Get identification number
    """
    kwargs.pop("cmd", None)
    if not kwargs.get("identification_type"):
        return api_response(
            success=False,
            message="Missing required param 'identification_type'!",
            status_code=404,
        )

    if not kwargs.get("identification_number"):
        return api_response(
            success=False,
            message="Missing required param 'identification_number'!",
            status_code=404,
        )

    try:
        affiliations = _practitioner_full_time_affiliation(
            identification_type=kwargs.get("identification_type"),
            identification_number=kwargs.get("identification_number"),
        )
        if affiliations:
            return api_response(
                success=True,
                message="Full type affiliation exists",
                data={"total": len(affiliations), "records": affiliations},
                status_code=200,
            )

        else:
            return api_response(
                success=True,
                message="Full type affiliation does not exists",
                data={"total": 0, "records": []},
                status_code=200,
            )

    except Exception as e:
        frappe.log_error(
            frappe.get_traceback(), "create_facility_affiliation_record failed"
        )
        return {
            "error": True,
            "message": f"Failed to create facility affiliation record: {str(e)}",
        }


def _practitioner_full_time_affiliation(identification_type, identification_number):
    try:
        # Check for duplicate affiliation
        existing_affiliation = frappe.get_all(
            "Health Professional",
            filters={
                "identification_type": identification_type,
                "identification_number": identification_number,
            },
            fields=["name"],
        )
        if not existing_affiliation:
            return []

        health_professional_name = existing_affiliation[0].get("name")

        existing_fulltime_affiliation = frappe.get_all(
            "Facility Affiliation",
            filters={
                "health_professional": health_professional_name,
                "employment_type": "Full-time Employee",
                "affiliation_status": ["in", ["Pending", "Confirmed", "Active"]],
            },
            fields=["name", "affiliation_status"],
        )

        if existing_fulltime_affiliation:
            return existing_fulltime_affiliation

        else:
            return []

    except Exception as e:
        frappe.log_error(
            frappe.get_traceback(), "create_facility_affiliation_record failed"
        )
        return []


@frappe.whitelist()
@auth_required()
def onboard_health_professional(**kwargs):
    try:
        encrypted_data = kwargs.get("data")
        try:
            decrypted_data = _cryptoService.rsa_decrypt(encrypted_data)
        except Exception as e:
            frappe.log_error(f"Encryption Error: {e}")
            return api_response(
                success=False,
                message=f"Error decrypting response data",
                status_code=500,
            )

        # Validate input data first
        data = decrypted_data.get("data")
        validation_result = validate_onboarding_data(data)
        if not validation_result["valid"]:
            return api_response(
                success=False,
                message={"validation_errors": validation_result["errors"]},
                status_code=400,
            )
        # frappe.db.begin()
        employment_details = data.get("employment_details", [])
        if isinstance(employment_details, dict):
            employment_details = [employment_details]
        elif not isinstance(employment_details, list):
            employment_details = []

        # Create Health Professional Record
        health_professional_doc = frappe.new_doc("Health Professional")
        health_professional_doc_name = health_professional_doc.create_hp_from_hwr_data(
            data
        )

        # Creating Facility and Professional Affiliations
        facility_affiliations = []
        for employment_detail in employment_details:

            # Create Facility Affiliation Record
            facility_affiliation_result = create_facility_affiliation_record(
                health_professional_doc_name, employment_detail
            )

            # Extract facility affiliation name
            facility_affiliation_name = None
            if isinstance(facility_affiliation_result, dict):
                if facility_affiliation_result.get("success"):
                    facility_affiliation_name = facility_affiliation_result.get("name")
                else:
                    frappe.db.rollback()
                    return api_response(
                        success=False,
                        message=facility_affiliation_result["message"],
                        status_code=400,
                    )

            # Append to Professional Affiliation child table
            try:
                append_professional_affiliation_record(
                    health_professional_doc_name,
                    employment_detail,
                    facility_affiliation_name,
                )
            except Exception as append_error:
                frappe.log_error(
                    "append_professional_affiliation_record failed",
                    frappe.get_traceback(),
                )
                frappe.db.rollback()
                return api_response(
                    success=False,
                    message=f"Failed to create professional affiliation record: {str(append_error)}",
                    status_code=500,
                )
            verification_token = None
            if facility_affiliation_name:
                facility_doc = frappe.get_doc(
                    "Facility Affiliation", facility_affiliation_name
                )
                verification_token = facility_doc.verification_token

            facility_affiliations.append(facility_affiliation_name)

            # Queue the employment confirmation email (optional - don't fail onboarding if email fails)
            try:
                email_queued = queue_employment_confirmation_email(
                    health_professional_doc_name, verification_token
                )
                if not email_queued:
                    frappe.logger().warning(
                        f"Failed to queue confirmation email for HP: {health_professional_doc_name}"
                    )
            except Exception as email_error:
                # Log error but don't fail the onboarding process
                frappe.log_error(
                    f"Email sending failed for HP {health_professional_doc_name}: {str(email_error)}",
                    "Employment Confirmation Email Failed",
                )
                frappe.logger().warning(
                    f"Could not send confirmation email for HP: {health_professional_doc_name}. Error: {str(email_error)}"
                )

        # Return success response
        frappe.db.commit()
        return api_response(
            success=True,
            data={
                "health_professional": health_professional_doc_name,
                "facility_affiliation": facility_affiliations,
            },
            message="Health professional created successfully. Facility affiliation is pending confirmation.",
        )

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error("onboard_health_professional failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=f"Failed to onboard health professional: {str(e)}",
            status_code=500,
        )


@frappe.whitelist()
def fetch_pending_employment_confirmations_v1(**kwargs):
    """
    Fetch pending employment confirmations for the current logged-in health worker
    OR fetch a specific confirmation using verification token

    Args:
        token (str, optional): Verification token to fetch specific confirmation

    Returns:
        API response with pending employment requests that need confirmation
        - If token provided: returns single confirmation record
        - If no token: returns all pending confirmations for logged-in user
    """
    try:
        verification_token = kwargs.get("token")

        # TOKEN-BASED FLOW: Single record retrieval
        if verification_token:
            token_validation = validate_affiliation_token(verification_token)
            if not token_validation["valid"]:
                return api_response(
                    success=False,
                    message=token_validation["message"],
                    status_code=token_validation["status_code"],
                )

            affiliation_id = token_validation["affiliation_id"]

            # Get detailed employment information for specific record
            affiliation_details = frappe.db.sql(
                """
                SELECT 
                    fa.name,
                    fa.health_professional,
                    fa.health_facility,
                    fa.role,
                    fa.affiliation_status,
                    fa.employment_type,
                    fa.designation,
                    fa.start_date,
                    fa.end_date,
                    fa.requested_by,
                    fa.requested_date,
                    fa.expiry_date,
                    fa.verification_token,
                    
                    -- Facility details
                    hf.facility_name,
                    hf.county,
                    hf.sub_county,
                    hf.ward,
                    hf.address,
                    
                    -- Health Professional details
                    hp.full_name,
                    hp.email,
                    
                    -- Requested by user details
                    u.full_name as requester_name,
                    u.email as requester_email
                    
                FROM `tabFacility Affiliation` fa
                LEFT JOIN `tabHealth Facility` hf ON fa.health_facility = hf.name
                LEFT JOIN `tabHealth Professional` hp ON fa.health_professional = hp.name
                LEFT JOIN `tabUser` u ON fa.requested_by = u.name
                
                WHERE fa.name = %s
            """,
                (affiliation_id,),
                as_dict=True,
            )

            if not affiliation_details:
                return api_response(
                    success=False,
                    message="Employment details not found",
                    status_code=404,
                )

            details = affiliation_details[0]

            # Format single record response
            formatted_confirmation = {
                "affiliation_id": details.name,
                "health_professional": details.health_professional,
                "affiliation_status": details.affiliation_status,
                "verification_token": details.verification_token,
                "role": details.role,
                "employment_type": details.employment_type,
                "designation": details.designation,
                "start_date": (
                    details.start_date.strftime("%Y-%m-%d")
                    if details.start_date
                    else None
                ),
                "end_date": (
                    details.end_date.strftime("%Y-%m-%d") if details.end_date else None
                ),
                "requested_date": (
                    details.requested_date.strftime("%Y-%m-%d")
                    if details.requested_date
                    else None
                ),
                "expiry_date": (
                    details.expiry_date.strftime("%Y-%m-%d")
                    if details.expiry_date
                    else None
                ),
                "health_professional_info": {
                    "name": details.full_name,
                    "email": details.email,
                },
                "facility": {
                    "id": details.health_facility,
                    "name": details.facility_name,
                    "county": details.county,
                    "sub_county": details.sub_county,
                    "ward": details.ward,
                    "address": details.address,
                },
                "requested_by": {
                    "name": details.requester_name,
                    "email": details.requester_email,
                },
            }

            # Encrypt data response
            try:
                encrypted_formatted_confirmation = _cryptoService.rsa_encrypt(
                    formatted_confirmation
                )
            except Exception as e:
                frappe.log_error(f"Encryption Error: {e}")
                return api_response(
                    success=False,
                    message=f"Error encrypting response data",
                    status_code=500,
                )

            return api_response(
                success=True,
                data=encrypted_formatted_confirmation,
                message="Employment confirmation details retrieved successfully",
                status_code=200,
            )

        # SESSION-BASED FLOW: All pending confirmations for logged-in user
        else:
            current_user_email = frappe.session.user

            if not current_user_email or current_user_email == "Guest":
                return api_response(
                    success=False,
                    message="Authentication required",
                    status_code=401,
                )

            # Find Health Professional by email (check both email and official_email)
            health_professional = frappe.db.sql(
                """
                SELECT name, full_name 
                FROM `tabHealth Professional` 
                WHERE LOWER(email) = %s OR LOWER(official_email) = %s
                LIMIT 1
            """,
                (current_user_email.lower(), current_user_email.lower()),
                as_dict=True,
            )

            if not health_professional:
                return api_response(
                    success=False,
                    message="Health Worker not found",
                    status_code=404,
                )

            health_professional_name = health_professional[0].name
            health_professional_full_name = health_professional[0].full_name

            # Get current date for expiry filtering
            from datetime import datetime

            current_date = datetime.now().date()

            # Fetch pending employment confirmations
            pending_confirmations = frappe.db.sql(
                """
                SELECT 
                    fa.name,
                    fa.health_professional,
                    fa.health_facility,
                    fa.employee,
                    fa.role,
                    fa.affiliation_status,
                    fa.employment_type,
                    fa.designation,
                    fa.start_date,
                    fa.end_date,
                    fa.requested_by,
                    fa.requested_date,
                    fa.expiry_date,
                    fa.verification_token,
                    
                    -- Facility details
                    hf.facility_name,
                    hf.county,
                    hf.sub_county,
                    hf.ward,
                    hf.address,
                    
                    -- Requested by user details
                    u.full_name as requester_name,
                    u.email as requester_email
                    
                FROM `tabFacility Affiliation` fa
                LEFT JOIN `tabHealth Facility` hf ON fa.health_facility = hf.name
                LEFT JOIN `tabUser` u ON fa.requested_by = u.name
                
                WHERE fa.health_professional = %s
                AND fa.affiliation_status = 'Pending'
                AND fa.expiry_date >= %s
                
                ORDER BY fa.requested_date DESC
            """,
                (health_professional_name, current_date),
                as_dict=True,
            )

            # Format the response data
            formatted_confirmations = []
            for confirmation in pending_confirmations:
                formatted_confirmation = {
                    # Basic affiliation info
                    "affiliation_id": confirmation.name,
                    "health_professional": confirmation.health_professional,
                    "affiliation_status": confirmation.affiliation_status,
                    "verification_token": confirmation.verification_token,
                    # Employment details
                    "role": confirmation.role,
                    "employment_type": confirmation.employment_type,
                    "designation": confirmation.designation,
                    "start_date": (
                        confirmation.start_date.strftime("%Y-%m-%d")
                        if confirmation.start_date
                        else None
                    ),
                    "end_date": (
                        confirmation.end_date.strftime("%Y-%m-%d")
                        if confirmation.end_date
                        else None
                    ),
                    # Request metadata
                    "requested_date": (
                        confirmation.requested_date.strftime("%Y-%m-%d")
                        if confirmation.requested_date
                        else None
                    ),
                    "expiry_date": (
                        confirmation.expiry_date.strftime("%Y-%m-%d")
                        if confirmation.expiry_date
                        else None
                    ),
                    # Facility information
                    "facility": {
                        "id": confirmation.health_facility,
                        "name": confirmation.facility_name,
                        "county": confirmation.county,
                        "sub_county": confirmation.sub_county,
                        "ward": confirmation.ward,
                        "address": confirmation.address,
                    },
                    # Requester information
                    "requested_by": {
                        "name": confirmation.requester_name,
                        "email": confirmation.requester_email,
                    },
                }
                formatted_confirmations.append(formatted_confirmation)

            # Prepare response message
            if not formatted_confirmations:
                message = "No pending employment confirmations found for this user"
            else:
                message = f"Found {len(formatted_confirmations)} pending employment confirmation(s)"

            # Encrypt data response
            try:
                encrypted_formatted_confirmation = _cryptoService.rsa_encrypt(
                    formatted_confirmations
                )
            except Exception as e:
                frappe.log_error(f"Encryption Error: {e}")
                return api_response(
                    success=False,
                    message=f"Error encrypting response data",
                    status_code=500,
                )

            return api_response(
                success=True,
                message=message,
                data=(
                    encrypted_formatted_confirmation if formatted_confirmations else []
                ),
                status_code=200,
            )

    except Exception as e:
        frappe.log_error(
            frappe.get_traceback(), "fetch_pending_employment_confirmations failed"
        )
        return api_response(
            success=False,
            message=f"Failed to fetch pending employment confirmations: {str(e)}",
            status_code=500,
        )


@frappe.whitelist()
def fetch_pending_employment_confirmations_v2(**kwargs):
    """
    Fetch pending employment confirmations for the current logged-in health worker
    OR fetch a specific confirmation using verification token

    Args:
        token (str, optional): Verification token to fetch specific confirmation

    Returns:
        API response with pending employment requests that need confirmation
        - If token provided: returns single confirmation record
        - If no token: returns all pending confirmations for logged-in user
    """
    try:
        verification_token = kwargs.get("token")

        # TOKEN-BASED FLOW: Single record retrieval
        if verification_token:
            token_validation = validate_affiliation_token(verification_token)
            if not token_validation["valid"]:
                return api_response(
                    success=False,
                    message=token_validation["message"],
                    status_code=token_validation["status_code"],
                )

            affiliation_id = token_validation["affiliation_id"]

            # Get the main affiliation document using ORM (respects permissions)
            try:
                affiliation_doc = frappe.get_doc("Facility Affiliation", affiliation_id)
            except frappe.PermissionError:
                return api_response(
                    success=False,
                    message="Permission denied to access this employment record",
                    status_code=403,
                )
            except frappe.DoesNotExistError:
                return api_response(
                    success=False,
                    message="Employment details not found",
                    status_code=404,
                )

            # Get related documents using ORM (respects permissions)
            try:
                health_facility_doc = (
                    frappe.get_doc("Health Facility", affiliation_doc.health_facility)
                    if affiliation_doc.health_facility
                    else None
                )
                health_professional_doc = (
                    frappe.get_doc(
                        "Health Professional", affiliation_doc.health_professional
                    )
                    if affiliation_doc.health_professional
                    else None
                )
                requester_doc = (
                    frappe.get_doc("User", affiliation_doc.requested_by)
                    if affiliation_doc.requested_by
                    else None
                )
            except frappe.PermissionError:
                return api_response(
                    success=False,
                    message="Permission denied to access related records",
                    status_code=403,
                )

            # Format single record response
            formatted_confirmation = {
                "affiliation_id": affiliation_doc.name,
                "health_professional": affiliation_doc.health_professional,
                "affiliation_status": affiliation_doc.affiliation_status,
                "verification_token": affiliation_doc.verification_token,
                "role": affiliation_doc.role,
                "employment_type": affiliation_doc.employment_type,
                "designation": affiliation_doc.designation,
                "start_date": (
                    affiliation_doc.start_date.strftime("%Y-%m-%d")
                    if affiliation_doc.start_date
                    else None
                ),
                "end_date": (
                    affiliation_doc.end_date.strftime("%Y-%m-%d")
                    if affiliation_doc.end_date
                    else None
                ),
                "requested_date": (
                    affiliation_doc.requested_date.strftime("%Y-%m-%d")
                    if affiliation_doc.requested_date
                    else None
                ),
                "expiry_date": (
                    affiliation_doc.expiry_date.strftime("%Y-%m-%d")
                    if affiliation_doc.expiry_date
                    else None
                ),
                "health_professional_info": {
                    "name": (
                        health_professional_doc.full_name
                        if health_professional_doc
                        else None
                    ),
                    "email": (
                        health_professional_doc.email
                        if health_professional_doc
                        else None
                    ),
                },
                "facility": {
                    "id": affiliation_doc.health_facility,
                    "name": (
                        health_facility_doc.facility_name
                        if health_facility_doc
                        else None
                    ),
                    "county": (
                        health_facility_doc.county if health_facility_doc else None
                    ),
                    "sub_county": (
                        health_facility_doc.sub_county if health_facility_doc else None
                    ),
                    "ward": health_facility_doc.ward if health_facility_doc else None,
                    "address": (
                        health_facility_doc.address if health_facility_doc else None
                    ),
                },
                "requested_by": {
                    "name": requester_doc.full_name if requester_doc else None,
                    "email": requester_doc.email if requester_doc else None,
                },
            }

            # Encrypt data response
            try:
                encrypted_formatted_confirmation = _cryptoService.rsa_encrypt(
                    formatted_confirmation
                )
            except Exception as e:
                frappe.log_error(f"Encryption Error: {e}")
                return api_response(
                    success=False,
                    message=f"Error encrypting response data",
                    status_code=500,
                )

            return api_response(
                success=True,
                data=encrypted_formatted_confirmation,
                message="Employment confirmation details retrieved successfully",
                status_code=200,
            )

        # SESSION-BASED FLOW: All pending confirmations for logged-in user
        else:
            current_user_email = frappe.session.user

            if not current_user_email or current_user_email == "Guest":
                return api_response(
                    success=False,
                    message="Authentication required",
                    status_code=401,
                )

            # Find Health Professional by email using ORM (respects permissions)
            health_professionals = frappe.get_list(
                "Health Professional",
                filters=[
                    ["email", "like", f"%{current_user_email}%"],
                    "or",
                    ["official_email", "like", f"%{current_user_email}%"],
                ],
                fields=["name", "full_name"],
                limit=1,
            )

            if not health_professionals:
                return api_response(
                    success=False,
                    message="Health Worker not found",
                    status_code=404,
                )

            health_professional_name = health_professionals[0].name
            health_professional_full_name = health_professionals[0].full_name

            # Get current date for expiry filtering
            from datetime import datetime

            current_date = datetime.now().date()

            # Fetch pending employment confirmations using ORM (respects permissions)
            pending_affiliations = frappe.get_list(
                "Facility Affiliation",
                filters={
                    "health_professional": health_professional_name,
                    "affiliation_status": "Pending",
                    "expiry_date": [">=", current_date],
                },
                fields=[
                    "name",
                    "health_professional",
                    "health_facility",
                    "employee",
                    "role",
                    "affiliation_status",
                    "employment_type",
                    "designation",
                    "start_date",
                    "end_date",
                    "requested_by",
                    "requested_date",
                    "expiry_date",
                    "verification_token",
                ],
                order_by="requested_date desc",
            )

            # Format the response data
            formatted_confirmations = []
            for affiliation in pending_affiliations:
                try:
                    # Get related facility details (respects permissions)
                    facility_doc = None
                    if affiliation.health_facility:
                        try:
                            facility_doc = frappe.get_doc(
                                "Health Facility", affiliation.health_facility
                            )
                        except (frappe.PermissionError, frappe.DoesNotExistError):
                            pass  # Skip if no permission or doesn't exist

                    # Get requester details (respects permissions)
                    requester_doc = None
                    if affiliation.requested_by:
                        try:
                            requester_doc = frappe.get_doc(
                                "User", affiliation.requested_by
                            )
                        except (frappe.PermissionError, frappe.DoesNotExistError):
                            pass  # Skip if no permission or doesn't exist

                    formatted_confirmation = {
                        # Basic affiliation info
                        "affiliation_id": affiliation.name,
                        "health_professional": affiliation.health_professional,
                        "affiliation_status": affiliation.affiliation_status,
                        "verification_token": affiliation.verification_token,
                        # Employment details
                        "role": affiliation.role,
                        "employment_type": affiliation.employment_type,
                        "designation": affiliation.designation,
                        "start_date": (
                            affiliation.start_date.strftime("%Y-%m-%d")
                            if affiliation.start_date
                            else None
                        ),
                        "end_date": (
                            affiliation.end_date.strftime("%Y-%m-%d")
                            if affiliation.end_date
                            else None
                        ),
                        # Request metadata
                        "requested_date": (
                            affiliation.requested_date.strftime("%Y-%m-%d")
                            if affiliation.requested_date
                            else None
                        ),
                        "expiry_date": (
                            affiliation.expiry_date.strftime("%Y-%m-%d")
                            if affiliation.expiry_date
                            else None
                        ),
                        # Facility information
                        "facility": {
                            "id": affiliation.health_facility,
                            "name": (
                                facility_doc.facility_name if facility_doc else None
                            ),
                            "county": facility_doc.county if facility_doc else None,
                            "sub_county": (
                                facility_doc.sub_county if facility_doc else None
                            ),
                            "ward": facility_doc.ward if facility_doc else None,
                            "address": facility_doc.address if facility_doc else None,
                        },
                        # Requester information
                        "requested_by": {
                            "name": requester_doc.full_name if requester_doc else None,
                            "email": requester_doc.email if requester_doc else None,
                        },
                    }
                    formatted_confirmations.append(formatted_confirmation)

                except Exception as e:
                    frappe.log_error(
                        f"Error processing affiliation {affiliation.name}: {str(e)}"
                    )
                    continue  # Skip this record and continue with others

            # Prepare response message
            if not formatted_confirmations:
                message = "No pending employment confirmations found for this user"
            else:
                message = f"Found {len(formatted_confirmations)} pending employment confirmation(s)"

            # Encrypt data response
            try:
                encrypted_formatted_confirmation = _cryptoService.rsa_encrypt(
                    formatted_confirmations
                )
            except Exception as e:
                frappe.log_error(f"Encryption Error: {e}")
                return api_response(
                    success=False,
                    message=f"Error encrypting response data",
                    status_code=500,
                )

            return api_response(
                success=True,
                message=message,
                data=(
                    encrypted_formatted_confirmation if formatted_confirmations else []
                ),
                status_code=200,
            )

    except Exception as e:
        frappe.log_error(
            frappe.get_traceback(), "fetch_pending_employment_confirmations failed"
        )
        return api_response(
            success=False,
            message=f"Failed to fetch pending employment confirmations: {str(e)}",
            status_code=500,
        )


@frappe.whitelist()
@JWTDecorator.validate_token
def fetch_pending_employment_confirmations(**kwargs):
    """
    Fetch pending employment confirmations for the current logged-in health worker
    OR fetch a specific confirmation using verification token

    Args:
        token (str, optional): Verification token to fetch specific confirmation

    Returns:
        API response with pending employment requests that need confirmation
        - If token provided: returns single confirmation record
        - If no token: returns all pending confirmations for logged-in user
    """
    try:
        verification_token = kwargs.get("token")

        # TOKEN-BASED FLOW: Single record retrieval
        if verification_token:
            return get_single_employment_confirmation(verification_token)

        # SESSION-BASED FLOW: All pending confirmations for logged-in user
        else:
            jwt_payload = frappe.local.jwt_payload
            practitioner_id = jwt_payload.get("practitioner_id")

            return get_all_pending_confirmations(practitioner_id=practitioner_id)

    except Exception as e:
        frappe.log_error(
            frappe.get_traceback(), "fetch_pending_employment_confirmations failed"
        )
        return api_response(
            success=False,
            message=f"Failed to fetch pending employment confirmations: {str(e)}",
            status_code=500,
        )


def get_related_documents(affiliation):
    """
    Get related documents for an affiliation record

    Args:
        affiliation: Affiliation document or dict with health_facility and requested_by

    Returns:
        dict: Contains facility_doc, health_professional_doc, requester_doc (or None if not accessible)
    """
    facility_doc = None
    health_professional_doc = None
    requester_doc = None

    try:
        if hasattr(affiliation, "health_facility") and affiliation.health_facility:
            facility_doc = frappe.get_doc(
                "Health Facility", affiliation.health_facility
            )
    except (frappe.PermissionError, frappe.DoesNotExistError):
        pass

    try:
        if (
            hasattr(affiliation, "health_professional")
            and affiliation.health_professional
        ):
            health_professional_doc = frappe.get_doc(
                "Health Professional", affiliation.health_professional
            )
    except (frappe.PermissionError, frappe.DoesNotExistError):
        pass

    try:
        if hasattr(affiliation, "requested_by") and affiliation.requested_by:
            requester_doc = frappe.get_doc("User", affiliation.requested_by)
    except (frappe.PermissionError, frappe.DoesNotExistError):
        pass

    return {
        "facility_doc": facility_doc,
        "health_professional_doc": health_professional_doc,
        "requester_doc": requester_doc,
    }


def format_confirmation_data(affiliation, related_docs):
    """
    Format affiliation data into standardized confirmation format

    Args:
        affiliation: Affiliation document or dict
        related_docs: Dict containing facility_doc, health_professional_doc, requester_doc

    Returns:
        dict: Formatted confirmation data
    """
    facility_doc = related_docs.get("facility_doc")
    health_professional_doc = related_docs.get("health_professional_doc")
    requester_doc = related_docs.get("requester_doc")

    return {
        "affiliation_id": affiliation.name,
        "health_professional": affiliation.health_professional,
        "employee_number": affiliation.employee or None,
        "affiliation_status": affiliation.affiliation_status,
        "verification_token": affiliation.verification_token,
        "role": affiliation.role,
        "employment_type": affiliation.employment_type,
        "designation": affiliation.designation,
        "start_date": (
            affiliation.start_date.strftime("%Y-%m-%d")
            if affiliation.start_date
            else None
        ),
        "end_date": (
            affiliation.end_date.strftime("%Y-%m-%d") if affiliation.end_date else None
        ),
        "requested_date": (
            affiliation.requested_date.strftime("%Y-%m-%d")
            if affiliation.requested_date
            else None
        ),
        "expiry_date": (
            affiliation.expiry_date.strftime("%Y-%m-%d")
            if affiliation.expiry_date
            else None
        ),
        "health_professional_info": {
            "name": (
                health_professional_doc.full_name if health_professional_doc else None
            ),
            "email": health_professional_doc.email if health_professional_doc else None,
        },
        "facility": {
            "id": affiliation.health_facility,
            "name": facility_doc.facility_name if facility_doc else None,
            "county": facility_doc.county if facility_doc else None,
            "sub_county": facility_doc.sub_county if facility_doc else None,
            "ward": facility_doc.ward if facility_doc else None,
            "address": facility_doc.address if facility_doc else None,
            "keph_level": facility_doc.kephl_level if facility_doc else None,
            "facility_type": facility_doc.facility_type if facility_doc else None,
        },
        "requested_by": {
            "name": requester_doc.full_name if requester_doc else None,
            "email": requester_doc.email if requester_doc else None,
        },
    }


def encrypt_and_respond(data, message, success=True, status_code=200):
    """
    Encrypt data and return API response

    Args:
        data: Data to encrypt and return
        message: Response message
        success: Success status
        status_code: HTTP status code

    Returns:
        API response with encrypted data
    """
    try:
        encrypted_data = _cryptoService.rsa_encrypt(data)
        return api_response(
            success=success,
            data=encrypted_data,
            message=message,
            status_code=status_code,
        )
    except Exception as e:
        frappe.log_error(f"Encryption Error: {e}")
        return api_response(
            success=False,
            message="Error encrypting response data",
            status_code=500,
        )


def find_health_professional_by_email(email):
    """
    Find health professional by email address

    Args:
        email: Email address to search for

    Returns:
        dict: Health professional info or None if not found
    """
    health_professionals = frappe.get_list(
        "Health Professional",
        or_filters=[
            ["email", "like", f"%{email}%"],
            ["official_email", "like", f"%{email}%"],
        ],
        fields=["name", "full_name"],
        limit=1,
    )

    if not health_professionals:
        return None

    return {
        "name": health_professionals[0].name,
        "full_name": health_professionals[0].full_name,
    }


def find_health_professional_by_practitioner_id(practitioner_id):
    """
    Find health professional by email address

    Args:
        email: Email address to search for

    Returns:
        dict: Health professional info or None if not found
    """
    health_professionals = frappe.get_list(
        "Health Professional",
        or_filters={
            "name": practitioner_id,
            "registration_number": practitioner_id,
        },
        fields=["name", "full_name"],
        limit=1,
    )

    if not health_professionals:
        return None

    return {
        "name": health_professionals[0].name,
        "full_name": health_professionals[0].full_name,
    }


def get_single_employment_confirmation(verification_token):
    """
    Get single employment confirmation using verification token

    Args:
        verification_token: Token to validate and retrieve confirmation

    Returns:
        API response with single confirmation or error
    """
    # Validate token
    token_validation = validate_affiliation_token(verification_token)
    if not token_validation["valid"]:
        return api_response(
            success=False,
            message=token_validation["message"],
            status_code=token_validation["status_code"],
        )

    affiliation_id = token_validation["affiliation_id"]

    # Get the main affiliation document
    try:
        affiliation_doc = frappe.get_doc("Facility Affiliation", affiliation_id)
    except frappe.PermissionError:
        return api_response(
            success=False,
            message="Permission denied to access this employment record",
            status_code=403,
        )
    except frappe.DoesNotExistError:
        return api_response(
            success=False,
            message="Employment details not found",
            status_code=404,
        )

    # Get related documents
    related_docs = get_related_documents(affiliation_doc)

    # Check if we can access related documents
    if not related_docs["health_professional_doc"] or not related_docs["facility_doc"]:
        return api_response(
            success=False,
            message="Permission denied to access related records",
            status_code=403,
        )

    # Format the confirmation
    formatted_confirmation = format_confirmation_data(affiliation_doc, related_docs)

    # Return encrypted response
    return encrypt_and_respond(
        data=formatted_confirmation,
        message="Employment confirmation details retrieved successfully",
        status_code=200,
    )


def get_all_pending_confirmations(current_user_email=None, practitioner_id=None):
    """
    Get all pending employment confirmations for logged-in user

    Args:
        current_user_email: Email of current user

    Returns:
        API response with list of pending confirmations or error
    """
    # Find health professional
    health_professional = None

    if current_user_email:
        health_professional = find_health_professional_by_email(current_user_email)
    elif practitioner_id:
        health_professional = find_health_professional_by_practitioner_id(
            practitioner_id
        )

    if not health_professional:
        return api_response(
            success=False,
            message="Health Worker not found",
            status_code=404,
        )

    # Get current date for expiry filtering
    from datetime import datetime

    current_date = datetime.now().date()

    # Fetch pending employment confirmations
    pending_affiliations = frappe.get_list(
        "Facility Affiliation",
        filters={
            "health_professional": health_professional["name"],
            # "affiliation_status": "Pending",
            "expiry_date": [">=", current_date],
        },
        fields=[
            "name",
            "health_professional",
            "health_facility",
            "employee",
            "role",
            "affiliation_status",
            "employment_type",
            "designation",
            "start_date",
            "end_date",
            "requested_by",
            "requested_date",
            "expiry_date",
            "verification_token",
        ],
        order_by="requested_date desc",
    )

    # Format confirmations
    formatted_confirmations = []
    for affiliation in pending_affiliations:
        try:
            # Get related documents
            related_docs = get_related_documents(affiliation)

            # Format confirmation
            formatted_confirmation = format_confirmation_data(affiliation, related_docs)
            formatted_confirmations.append(formatted_confirmation)

        except Exception as e:
            frappe.log_error(
                f"Error processing affiliation {affiliation.name}: {str(e)}"
            )
            continue

    # Prepare response message
    if not formatted_confirmations:
        message = "No pending employment confirmations found for this user"
        return api_response(
            success=True,
            message=message,
            data=[],
            status_code=200,
        )
    else:
        message = (
            f"Found {len(formatted_confirmations)} pending employment confirmation(s)"
        )
        return encrypt_and_respond(
            data=formatted_confirmations, message=message, status_code=200
        )


@frappe.whitelist(methods=["POST"])
def generate_c360_x_access_token():
    besettings = frappe.get_single("Healthpro Settings")
    settings = frappe.get_single("HealthPro Backend Settings")
    _base_url = settings.get("hie_url")
    _c360_x_access_token_url = settings.get("c360_x_access_token_url")
    _c360_user = settings.get("c360_x_access_token_user")

    # Validate settings
    if not _base_url or not _c360_x_access_token_url:
        error_msg = "Required settings not configured for C360 sync"
        frappe.log_error(
            title="C360 access_token settings not configured:",
            message=error_msg,
        )
    # Make API call
    url = f"{_base_url}{_c360_x_access_token_url}"

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    payload = {"email": _c360_user, "user_id": _c360_user}
    from requests.auth import HTTPBasicAuth

    basic_auth = HTTPBasicAuth(
        besettings.get("hie_username"), besettings.get_password("hie_password")
    )

    # log payload before its sent
    response = requests.post(
        url, json=payload, headers=headers, timeout=30, auth=basic_auth
    )
    response.raise_for_status()
    response_data = response.json()
    return response_data.get("data", {}).get("access_token", None)


def sync_affiliation_to_c360(facility_affiliation_doc):
    """
    Sync confirmed facility affiliation to C360 external API

    Args:
        facility_affiliation_doc: Facility Affiliation document object

    Returns:
        dict: {"success": bool, "message": str}
    """
    try:
        # Check if already synced successfully
        if facility_affiliation_doc.c360_sync_status == "Success":
            frappe.logger().info(
                f"Affiliation {facility_affiliation_doc.name} already synced to C360. Skipping."
            )
            return {"success": True, "message": "Already synced"}

        # Get settings
        settings = frappe.get_single("HealthPro Backend Settings")
        _base_url = settings.get("hie_url")
        _c360_affiliation_sync_url = settings.get("c360_affiliation_sync_url")

        # Validate settings
        if not _base_url or not _c360_affiliation_sync_url:
            error_msg = "Required settings not configured for C360 sync"
            frappe.log_error(
                title=f"C360 Sync Failed: {facility_affiliation_doc.name}",
                message=error_msg,
            )
            facility_affiliation_doc.db_set(
                "c360_sync_status", "Failed", update_modified=False
            )
            return {"success": False, "message": error_msg}

        # Fetch related documents
        try:
            professional = frappe.get_doc(
                "Health Professional", facility_affiliation_doc.health_professional
            )
            facility = frappe.get_doc(
                "Health Facility", facility_affiliation_doc.health_facility
            )
        except Exception as e:
            error_msg = f"Failed to fetch related documents: {str(e)}"
            frappe.log_error(
                title=f"C360 Sync Failed: {facility_affiliation_doc.name}",
                message=f"{error_msg}\n{frappe.get_traceback()}",
            )
            facility_affiliation_doc.db_set(
                "c360_sync_status", "Failed", update_modified=False
            )
            return {"success": False, "message": error_msg}

        # Build API payload
        payload = {
            "affiliation": {
                "professional": {
                    "registration_number": professional.registration_number or "",
                    "external_reference_id": professional.external_reference_id or "",
                    "identification_number": professional.identification_number or "",
                    "identification_type": professional.identification_type or "",
                    "first_name": professional.first_name or "",
                    "last_name": professional.last_name or "",
                    "id_number": professional.identification_number or "",
                    "email": professional.email or "",
                },
                "facility": {
                    "registration_number": facility.registration_number or "",
                    "fid": facility.hie_id or "",
                    "facility_name": facility.facility_name or "",
                    "facility_type": facility.facility_type or "",
                    "address": facility.address or "",
                    "keph_level": facility.kephl_level or "",
                },
                "start_date": (
                    str(facility_affiliation_doc.start_date)
                    if facility_affiliation_doc.start_date
                    else ""
                ),
                "role": facility_affiliation_doc.role or "",
                "employment_type": facility_affiliation_doc.employment_type or "",
            }
        }

        # Make API call
        url = f"{_base_url}{_c360_affiliation_sync_url}"
        token = _hie.generate_jwt_token()
        agent = settings.get("default_agent")

        auth = (
            _hie.get_hie_settings()["username"],
            _hie.get_hie_settings()["password"],
        )
        x_access_token = generate_c360_x_access_token()

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
            "x-hie-agent": agent,
            "x-access-token": f"Bearer {x_access_token}",
        }

        # log payload before its sent
        frappe.log_error(
            title="C360 Post Affiliation Payload",
            message=f"data: Payload: {payload}, Headers: {headers}",
        )

        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=30,
            # auth=auth
        )
        # response.raise_for_status()
        response_data = response.json()
        frappe.log_error(
            title="Update License Application F360 Response",
            message=json.dumps(response_data, indent=2, default=str),
        )
        # frappe.log_error(f"C360 Response", response_data)
        # frappe.log_error(f"C360 Payload", payload)

        # Validate success: Check both HTTP status code and response body status
        if (
            response.status_code not in [200, 201]
            or response_data.get("status") != "ok"
        ):
            raise ValueError(
                f"C360 returned non-success HTTP status code: {response.status_code}"
            )

        # Log success
        frappe.log_error(
            title=f"C360 Sync Success: {facility_affiliation_doc.name}",
            message=f"Successfully synced affiliation to C360.\nPayload: {json.dumps(payload, indent=2)}\nResponse: {json.dumps(response_data, indent=2)}",
        )

        # Update sync status
        facility_affiliation_doc.db_set(
            "c360_sync_status", "Success", update_modified=False
        )

        return {
            "success": True,
            "message": "Successfully synced to C360",
            "response": response_data,
        }

    except requests.exceptions.HTTPError as http_err:
        error_msg = f"HTTP error occurred: {http_err}"
        frappe.log_error(
            title=f"C360 Sync HTTP Error: {facility_affiliation_doc.name}",
            message=f"{error_msg}\nStatus Code: {http_err.response.status_code if http_err.response else 'N/A'}\nResponse: {http_err.response.text if http_err.response else 'N/A'}\n{frappe.get_traceback()}",
        )
        facility_affiliation_doc.db_set(
            "c360_sync_status", "Failed", update_modified=False
        )
        return {"success": False, "message": error_msg}

    except requests.exceptions.Timeout:
        error_msg = "Request to C360 API timed out after 30 seconds"
        frappe.log_error(
            title=f"C360 Sync Timeout: {facility_affiliation_doc.name}",
            message=error_msg,
        )
        facility_affiliation_doc.db_set(
            "c360_sync_status", "Failed", update_modified=False
        )
        return {"success": False, "message": error_msg}

    except Exception as e:
        error_msg = f"Unexpected error during C360 sync: {str(e)}"
        frappe.log_error(
            title=f"C360 Sync Error: {facility_affiliation_doc.name}",
            message=f"{error_msg}\n{frappe.get_traceback()}",
        )
        facility_affiliation_doc.db_set(
            "c360_sync_status", "Failed", update_modified=False
        )
        return {"success": False, "message": error_msg}


@frappe.whitelist()
@JWTDecorator.validate_token
def confirm_employment_affiliation(**kwargs):
    """
    Confirm employment affiliation request
    Supports both in-app (session) and email (token) authentication

    Args:
        affiliation_id (str): The Facility Affiliation record ID to confirm
        verification_token (str, optional): Verification token for email-based confirmation

    Returns:
        API response with confirmation status
    """
    try:
        affiliation_id = kwargs.get("affiliation_id")
        verification_token = kwargs.get("verification_token")

        if not affiliation_id:
            return api_response(
                success=False,
                message="Affiliation ID is required",
                status_code=400,
            )
        if not verification_token:
            verification_token = frappe.db.get_value(
                "Facility Affiliation", affiliation_id, "verification_token"
            )

        # Authenticate request
        auth_result = authenticate_employment_request(
            affiliation_id, verification_token
        )
        if not auth_result["authenticated"]:
            return api_response(
                success=False,
                message=auth_result["message"],
                status_code=auth_result["status_code"],
            )

        facility_affiliation = auth_result["facility_affiliation"]

        # Get Health Professional record
        if auth_result["auth_method"] == "session":
            health_professional = auth_result["health_professional_doc"]
        else:
            health_professional = frappe.get_doc(
                "Health Professional", auth_result["health_professional"]
            )

        # Check if affiliation is still pending
        if facility_affiliation.affiliation_status != "Pending":
            return api_response(
                success=False,
                message=f"This affiliation request has already been set to {facility_affiliation.affiliation_status}",
                status_code=400,
            )

        # Check expiry date
        current_date = datetime.now().date()
        if (
            facility_affiliation.expiry_date
            and facility_affiliation.expiry_date < current_date
        ):
            return api_response(
                success=False,
                message="This invitation is no longer valid",
                status_code=400,
            )

        # Create Employee Record
        employee_doc = None
        try:
            employee_doc = create_employee_for_health_professional(
                health_professional,
                facility_affiliation.health_facility,
                facility_affiliation,
            )

            if not employee_doc:
                return api_response(
                    success=False,
                    message="Failed to create employee record",
                    status_code=500,
                )

        except Exception as e:
            frappe.log_error(
                f"Employee creation failed: {str(e)}", "confirm_employment_affiliation"
            )
            return api_response(
                success=False,
                message=f"Failed to create employee record: {str(e)}",
                status_code=500,
            )

        # Update Facility Affiliation
        facility_affiliation.employee = employee_doc.name
        facility_affiliation.affiliation_status = "Active"

        # Mark token as used if token-based authentication
        if verification_token:
            facility_affiliation.token_used = 1

        facility_affiliation.save()

        # Update Professional Affiliations child table
        update_professional_affiliations_child_table(
            auth_result["health_professional"], affiliation_id, employee_doc.name
        )

        frappe.db.commit()

        # Sync to C360 asynchronously if status is Active
        if facility_affiliation.affiliation_status == "Active":
            frappe.enqueue(
                method="careverse_hq.api.health_worker_onboarding_apis.sync_affiliation_to_c360",
                queue="default",
                timeout=300,
                facility_affiliation_doc=facility_affiliation,
                is_async=True,
            )

        return api_response(
            success=True,
            data={
                "affiliation_id": affiliation_id,
                "employee_id": employee_doc.name,
                "status": "Active",
                "auth_method": auth_result["auth_method"],
            },
            message="Employment affiliation confirmed successfully",
            status_code=200,
        )

    except Exception as e:
        frappe.log_error(
            frappe.get_traceback(), "confirm_employment_affiliation failed"
        )
        return api_response(
            success=False,
            message=f"Failed to confirm employment affiliation: {str(e)}",
            status_code=500,
        )


@frappe.whitelist()
@JWTDecorator.validate_token
def reject_employment_affiliation(**kwargs):
    """
    Reject employment affiliation request
    Supports both in-app (session) and email (token) authentication

    Args:
        affiliation_id (str): The Facility Affiliation record ID to reject
        verification_token (str, optional): Verification token for email-based rejection

    Returns:
        API response with rejection status
    """
    try:
        affiliation_id = kwargs.get("affiliation_id")
        verification_token = kwargs.get("verification_token")

        if not affiliation_id:
            return api_response(
                success=False,
                message="Affiliation ID is required",
                status_code=400,
            )
        if not verification_token:
            verification_token = frappe.db.get_value(
                "Facility Affiliation", affiliation_id, "verification_token"
            )
        # Authenticate request
        auth_result = authenticate_employment_request(
            affiliation_id, verification_token
        )
        if not auth_result["authenticated"]:
            return api_response(
                success=False,
                message=auth_result["message"],
                status_code=auth_result["status_code"],
            )

        facility_affiliation = auth_result["facility_affiliation"]

        # Check if affiliation is still pending
        if facility_affiliation.affiliation_status != "Pending":
            return api_response(
                success=False,
                message=f"This affiliation request has already been set to {facility_affiliation.affiliation_status}",
                status_code=400,
            )

        # Check expiry date
        current_date = datetime.now().date()
        if (
            facility_affiliation.expiry_date
            and facility_affiliation.expiry_date < current_date
        ):
            return api_response(
                success=False,
                message="This invitation is no longer valid",
                status_code=400,
            )

        # Update status to Rejected
        facility_affiliation.affiliation_status = "Rejected"
        facility_affiliation.rejection_date = datetime.now()

        # Mark token as used if token-based authentication
        if verification_token:
            facility_affiliation.token_used = 1

        facility_affiliation.save()

        # Remove from Professional Affiliations child table
        remove_professional_affiliation_record(
            auth_result["health_professional"], facility_affiliation.name
        )

        frappe.db.commit()

        return api_response(
            success=True,
            data={
                "affiliation_id": affiliation_id,
                "status": "Rejected",
                "auth_method": auth_result["auth_method"],
            },
            message="Employment affiliation rejected successfully",
            status_code=200,
        )

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "reject_employment_affiliation failed")
        return api_response(
            success=False,
            message=f"Failed to reject employment affiliation: {str(e)}",
            status_code=500,
        )
