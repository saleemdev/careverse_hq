"""
Facility Admin Self-Onboarding API

This module implements a single synchronous endpoint for facility admin registration.
The flow is:
1. Check if user already exists (by ID hash)
2. If not exists, fetch from Client Registry
3. Validate KYC data completeness
4. Check HFR for facility ownership
5. Create User + Healthcare Organization User (with empty organization field)
6. Return success
"""

import frappe
import requests
from frappe import _
from careverse_hq.api.utils import api_response, fetch_client_registry_user
from careverse_hq.api.user_registration import generate_user_identity_hash
from careverse_hq.api.hie_settings import HIE

_hie = HIE()


def _check_user_exists_by_identity_hash(identification_type, identification_number):
    """
    Check if a Healthcare Organization User already exists with the given ID hash.

    This is the FIRST step in the registration flow to enable fast idempotency.
    If user exists, we return success immediately without calling CR or HFR APIs.

    Args:
        identification_type (str): Type of identification (e.g., "National ID", "Passport")
        identification_number (str): The identification number

    Returns:
        dict or None: If user exists, returns api_response dict with success=True.
                     If user doesn't exist, returns None (proceed with registration).

    Raises:
        Exception: If there's an error checking user existence (operation must stop)

    Example:
        result = _check_user_exists_by_identity_hash("National ID", "12345678")
        if result:
            return result  # User exists, return success
        # Otherwise continue with registration
    """
    try:
        user_hash = generate_user_identity_hash(
            identification_type, identification_number
        )

        hou_exists = frappe.db.exists(
            "Healthcare Organization User", {"user_identity_hash": user_hash}
        )
        user_id = frappe.db.get_value(
            "Healthcare Organization User", {"user_identity_hash": user_hash}, "user"
        )
        if hou_exists:
            api_response(
                success=True,
                message="Verification successful, proceed to login",
                status_code=201,
            )
            return True, user_id  # Return True to indicate user exists

        return False, None  # Return None to indicate user doesn't exist

    except Exception as e:
        frappe.log_error(
            "Facility Admin Registration - User Existence Check",
            f"Error checking user existence: {str(e)}",
        )
        # Re-raise the exception - this check is mandatory
        raise


def _fetch_and_validate_cr_user(identification_type, identification_number):
    """
    Fetch user from Client Registry and validate KYC data completeness.

    This combines Step 3 (CR fetch) and Step 4 (KYC validation) into one function
    since they are tightly coupled.

    Args:
        identification_type (str): Type of identification (e.g., "National ID")
        identification_number (str): The identification number

    Returns:
        tuple: (user_data_dict, error_response)
            - user_data_dict: Dict with CR user data if successful, None otherwise
            - error_response: api_response dict if error occurred, None if successful

    Raises:
        Exception: If there's a critical error (will be caught by main endpoint)
    """
    try:
        user_data, error = fetch_client_registry_user(
            identification_type=identification_type,
            identification_number=identification_number,
        )

        frappe.log_error(
            "Facility Admin Registration - CR Verification towwwwwwwwwwwwww",
            f"{error}",
        )
        # Handle CR API errors
        if error:
            api_response(
                success=False,
                message=error.get(
                    "message", "Error fetching user from Client Registry"
                ),
                status_code=error.get("status_code", 500),
            )
            return None, True

        # Handle no user data returned
        if not user_data:
            api_response(
                success=False,
                message="User not found in Client Registry. Please register on Afyangu first.",
                status_code=404,
            )
            return None, True

        # Extract the nested data object
        cr_user = user_data.get("data")
        if not cr_user:
            api_response(
                success=False,
                message="Invalid response from Client Registry - no user data",
                status_code=500,
            )
            return None, True
        frappe.log_error(
            "CR User",
            f"CR User Data: {cr_user}",
        )
        required_fields = {
            "first_name": "First Name",
            "last_name": "Last Name",
            "phone": "Phone Number",
            "email": "Email Address",
            "date_of_birth": "Date of Birth",
            "gender": "Gender",
            "identification_number": "Identification Number",
            "identification_type": "Identification Type",
        }
        email = cr_user.get("email")
        phone = cr_user.get("phone")
        frappe.log_error(
            "Email and phone",
            f"Email: {email}, Phone: {phone}",
        )
        missing_fields = []
        for field, label in required_fields.items():
            value = cr_user.get(field)

            # Check if value is missing, None, empty string, or whitespace-only
            is_missing = (
                value is None
                or value == ""
                or (isinstance(value, str) and value.strip() == "")
            )

            # frappe.log_error(
            #     f"Field Check: {field}",
            #     f"Value: '{value}' | Type: {type(value)} | Is Missing: {is_missing}",
            # )

            if is_missing:
                missing_fields.append(label)

        frappe.log_error(
            "All Missing Fields",
            f"Missing fields list: {missing_fields} | Count: {len(missing_fields)}",
        )

        if missing_fields:
            api_response(
                success=False,
                message=f"Incomplete KYC data in Client Registry. Missing: {', '.join(missing_fields)}. Please update your profile on Afyangu.",
                status_code=417,
            )
            return None, True
        return cr_user, None

    except Exception as e:
        frappe.log_error(
            "Exception validatikng CR User",
            f"Error fetching/validating CR user: {str(e)}",
        )
        # Re-raise - this is a mandatory check
        raise


def _check_hfr_facility_ownership(identification_number):
    """
    Check if the user owns any facilities in the Health Facility Registry (HFR).

    This function queries the HFR API to find facilities owned by the given ID number.

    Args:
        identification_number (str): The owner's identification number

    Returns:
        tuple: (facilities_list, error_response)
            - facilities_list: List of facility dicts if successful, None otherwise
            - error_response: api_response dict if error occurred, None if successful

    Raises:
        Exception: If there's a critical error (will be caught by main endpoint)
    """
    try:
        settings = frappe.db.get_singles_dict("HealthPro Backend Settings")
        base_url = settings.get("hie_url")
        fetch_owner_facilities_url = settings.get("hfr_fetch_owner_facilities_url")

        if not base_url:
            frappe.log_error(
                "HIE URL not configured in Settings",
                "HIE URL not configured in HealthPro Backend Settings",
            )
            api_response(
                success=False,
                message="HIE Base Url API not configured. Please contact system administrator.",
                status_code=500,
            )
            return None, True

        if not fetch_owner_facilities_url:
            frappe.log_error(
                "HFR Fetch Owner Facilities not configured in Settings",
                "HFR Fetch Owner Facilities URL not configured in HealthPro Backend Settings",
            )
            api_response(
                success=False,
                message="HFR Owner Facilities API not configured. Please contact system administrator.",
                status_code=500,
            )
            return None, True

        hfr_url = f"{base_url}{fetch_owner_facilities_url}"
        token = _hie.generate_jwt_token()
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
        }

        params = {"owner_id_number": identification_number}
        frappe.log_error(
            title="Fetching HFR facilities for owner ID",
            message=f"Fetching HFR facilities for owner ID: {identification_number}"
        )

        response = requests.get(
            hfr_url,
            headers=headers,
            params=params,
            timeout=30,
        )

        # Parse JSON response first
        try:
            res_json = response.json()
            frappe.log_error(
                "HFR Facilities by Owner Response",
                f"HFR Response: {res_json}",
            )
        except ValueError as e:
            frappe.log_error(
                "Invalid JSON response from HFR API",
                f"Invalid JSON response from HFR API: {response.text}",
            )
            api_response(
                success=False,
                message="Invalid response from HFR API",
                status_code=500,
            )
            return None, True

        # Extract data from response
        data = res_json.get("message", {})
        status = data.get("status")
        data_obj = data.get("data", {})
        count = data_obj.get("count", 0)
        facilities = data_obj.get("facilities", [])

        # Handle 404 with count=0 as "no facilities found" (not an error)
        if response.status_code == 404 and count == 0:
            return [], None

        response.raise_for_status()

        if status == "error":
            error_msg = data.get("message", "Unknown error from HFR API")
            frappe.log_error(
                "HFR Response Error",
                f"HFR API returned error: {error_msg}",
            )
            api_response(
                success=False,
                message=f"HFR API error: {error_msg}",
                status_code=response.status_code,
            )
            return None, True

        if status == "success":
            # Even with success status, check if count is 0
            if count == 0:
                return [], None
            return facilities, None

        frappe.log_error(
            "HFR API returned unexpected status ",
            f"HFR API returned unexpected status: {status}",
        )
        api_response(
            success=False,
            message="Unexpected response from HFR API",
            status_code=500,
        )
        return None, True

    except requests.exceptions.Timeout:
        frappe.log_error(
            "HFR API timeout for owner ID",
            f"HFR API timeout for owner ID: {identification_number}",
        )
        api_response(
            success=False,
            message="HFR API request timed out while checking facility ownership. Please try again later.",
            status_code=504,
        )
        return None, True

    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        frappe.log_error(
            "HFR API request error",
            f"HFR API request error: {error_msg}",
        )
        api_response(
            success=False,
            message=f"Failed to connect to HFR API: {error_msg}",
            status_code=503,
        )
        return None, True

    except Exception as e:
        frappe.log_error(
            "Error checking HFR facility ownership",
            f"Error checking HFR facility ownership: {str(e)}",
        )
        # Re-raise - this is a mandatory check
        raise


def _create_facility_admin_user(cr_user, identification_type, identification_number):
    """
    Create User and Healthcare Organization User records for facility admin.

    This function creates:
    1. Frappe User (for authentication via CR)
    2. Healthcare Organization User (with empty organization field)

    Args:
        cr_user (dict): Client Registry user data
        identification_type (str): Type of identification
        identification_number (str): Identification number

    Returns:
        tuple: (user_email, error_response)
            - user_email: Email of created user if successful, None otherwise
            - error_response: api_response dict if error occurred, None if successful

    Raises:
        Exception: If there's a critical error (will be caught by main endpoint)
    """
    try:
        email = cr_user.get("email")

        frappe.log_error(
            "Facility Admin Registration - User Creation Start",
            f"Email from CR: {email}, CR User: {cr_user}",
        )

        if frappe.db.exists("User", email):
            frappe.log_error(
                f"User {email} already exists",
                f"User {email} already exists, skipping User creation",
            )
            user_email = email
        else:
            user = frappe.get_doc(
                {
                    "doctype": "User",
                    "email": email,
                    "username": email,
                    "first_name": cr_user.get("first_name"),
                    "middle_name": cr_user.get("middle_name"),
                    "last_name": cr_user.get("last_name"),
                    "phone": cr_user.get("phone"),
                    "enabled": 1,
                    "user_type": "System User",
                    "send_welcome_email": 0,
                    "role_profile_name": "Facility Admin",
                }
            )

            user.append("roles", {"role": "Facility Admin"})
            user.insert(ignore_permissions=True)
            user_email = user.name

        # Create Healthcare Organization User
        from healthpro_erp.healthpro_erp.doctype.healthcare_organization_user.healthcare_organization_user import (
            HealthcareOrganizationUser,
        )

        user_data = {
            "user": user_email,
            "first_name": cr_user.get("first_name"),
            "middle_name": cr_user.get("middle_name"),
            "last_name": cr_user.get("last_name"),
            "id_type": identification_type,
            "id_number": identification_number,
            "phone_number": cr_user.get("phone"),
            "email": email,
            "gender": cr_user.get("gender"),
            "date_of_birth": cr_user.get("date_of_birth"),
            "client_registry_id": cr_user.get("id"),
            "role": "Facility Admin",
            "organization": None,  # Empty - will be set after facility selection
            "organization_region": None,  # Empty - will be set after facility selection
            "email_verified": False,
        }

        healthcare_user = HealthcareOrganizationUser.create(**user_data)

        frappe.log_error(
            "Facility Admin Registration - User Creation Success",
            f"Created User: {user_email}, Healthcare User: {healthcare_user.name}",
        )

        frappe.db.commit()

        return user_email, None

    except Exception as e:
        error_message = str(e)

        frappe.log_error(
            "Facility Admin Registration - User Creation",
            f"Error creating user records: {error_message}",
        )
        frappe.db.rollback()

        # Extract user-friendly error message on common errors
        if "Could not find" in error_message and "Role:" in error_message:
            user_message = (
                f"System configuration error: {error_message}. Please contact support."
            )
        elif "must be unique" in error_message.lower():
            user_message = (
                "This user account already exists. Please try logging in instead."
            )
        elif "duplicate entry" in error_message.lower():
            user_message = (
                "This user account already exists. Please try logging in instead."
            )
        else:
            user_message = f"Failed to create user account: {error_message}"

        api_response(
            success=False,
            message=user_message,
            status_code=500,
        )
        return None, True  # True indicates error occurred


@frappe.whitelist(allow_guest=True, methods=["POST"])
def facility_admin_register(**kwargs):
    """
    KYC and Registration for Facility Admins

    Single synchronous endpoint that:
    1. Checks if user already exists (idempotent)
    2. Validates user in Client Registry
    3. Checks HFR for facility ownership
    4. Creates user account + Healthcare Organization User
    5. Returns success for login

    Request Body:
        identification_type (str): Type of ID (e.g., "National ID")
        identification_number (str): ID number

    Response (201):
        {
            "status": "success",
            "message": "Verification successful, proceed to login"
        }

    Error Responses:
        400: Missing/invalid parameters or incomplete KYC data
        404: User not found in CR or no facilities in HFR
        500: Server error
    """
    try:
        # VALIDATE INPUT PARAMETERS
        identification_type = kwargs.get("identification_type")
        identification_number = kwargs.get("identification_number")

        if not identification_type or not identification_number:
            api_response(
                success=False,
                message="identification_type and identification_number are required",
                status_code=400,
            )
            return

        # CHECK IF USER ALREADY EXISTS (IDEMPOTENCY)
        existing_user_response, user_id = _check_user_exists_by_identity_hash(
            identification_type, identification_number
        )

        if existing_user_response:
            frappe.log_error(
                "Facility Admin Registration - User Already Exists",
                f"User {user_id} already exists",
            )
            # If user already existed, we can check if they have facility admin role and if not, we give them the role.
            user = frappe.get_doc("User", user_id)
            user.add_roles("Facility Admin")
            user.save(ignore_permissions=True)
            # api_response(
            #     success=True,
            #     message="User already exists and has been given facility admin role",
            #     status_code=200,
            # )
            return
        frappe.log_error(
            "Facility Admin Registration - User Does Not Exist",
            f"User does not exist, continuing with registration",
        )
        # FETCH FROM CR AND VALIDATE KYC DATA
        cr_user, error_occurred = _fetch_and_validate_cr_user(
            identification_type, identification_number
        )

        if error_occurred:
            frappe.log_error(
                "erro occured when fetching and validating cr user",
                f"{error_occurred}",
            )
            return

        # CHECK HFR FOR FACILITY OWNERSHIP
        facilities, error_occurred = _check_hfr_facility_ownership(
            identification_number
        )

        if error_occurred:
            return

        if not facilities or len(facilities) == 0:
            api_response(
                success=False,
                message="No facilities found registered under this ID number. If you have a facility, please contact the regulator to update the facility owner details.",
                status_code=404,
            )
            return

        # CREATE USER + HEALTHCARE ORGANIZATION USER
        user_email, error_occurred = _create_facility_admin_user(
            cr_user, identification_type, identification_number
        )

        if error_occurred:
            return

        api_response(
            success=True,
            message="Registration successful. You can now proceed to login.",
            data={
                "email": user_email,
                "is_new_user": True,
            },
            status_code=201,
        )

    except Exception as e:
        frappe.log_error(message=str(e), title="Facility Admin Registration Error")
        api_response(
            success=False, message=f"Registration failed: {str(e)}", status_code=500
        )
