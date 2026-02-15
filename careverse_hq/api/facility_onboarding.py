import base64
from dataclasses import fields
import json

import requests
import frappe
from .hie_settings import HIE
from .encryption import SecureTransportManager
from requests import HTTPError, RequestException
from frappe.exceptions import ValidationError, PermissionError, UniqueValidationError
from .utils import api_response
from healthpro_erp.api.utils import (
    verify_otp,
    mask_phone,
    mask_name,
    send_otp,
    get_cr_user_contacts,
    fetch_client_registry_user,
)
from frappe.email.doctype.email_template.email_template import get_email_template
from .jwt_token_management import get_token_manager
from healthpro_erp.healthpro_erp.decorators.permissions import auth_required, AuthError
from careverse_hq.api.user_registration import (
    create_user_account,
    create_healthcare_user,
)
from careverse_hq.api.permissions_manager import create_user_permissions_bulk

_hie = HIE()
_cryptoService = SecureTransportManager()


def _get_user_if_exist(email):
    user_id = frappe.db.exists("User", email) or frappe.db.get_value(
        "User", {"email": email}, "name"
    )
    try:
        if user_id:
            return frappe.get_doc("User", user_id)
    except frappe.DoesNotExistError:
        return None


def _is_healthcare_user_exist(id_no):
    healthcare_user_id = frappe.db.get_value(
        "Healthcare Organization User", {"identification_number": id_no}, "name"
    )
    return healthcare_user_id


def _validate_admin_details(admin_details):
    required_administrator_fields = [
        "designation",
        "administrators_first_name",
        # "administrators_middle_name",
        "administrators_last_name",
        "administrators_id_no",
        "administrators_id_type",
        "administrators_phone_number",
        "administrators_email_address",
        "administrators_password",
        "administrators_role",
        "administrators_gender",
        "administrators_date_of_birth",
    ]
    for field in required_administrator_fields:
        if field not in admin_details or not admin_details[field]:
            return False, "Missing required field in admin_details: {}".format(field)
    return True, None


def _fulfill_required_records_creation_for_admin(
    admin_details, organization_id, health_facility
):
    settings = frappe.db.get_singles_dict("HealthPro Backend Settings")

    # Prepare data for records creation
    user_details = {
        "email": admin_details.get("administrators_email_address"),
        "first_name": admin_details.get("administrators_first_name"),
        "middle_name": admin_details.get("administrators_middle_name"),
        "last_name": admin_details.get("administrators_last_name"),
        "phone_number": admin_details.get("administrators_phone_number"),
        "role": admin_details.get("administrators_role"),
        "id_number": admin_details.get("administrators_id_no"),
        "id_type": admin_details.get("administrators_id_type"),
        "gender": admin_details.get("administrators_gender"),
        "date_of_birth": admin_details.get("administrators_date_of_birth"),
    }

    account_credentials = {
        "username": admin_details.get("administrators_email_address"),
        "password": admin_details.get("administrators_password"),
    }

    # 1. Create user account record
    user = _get_user_if_exist(admin_details.get("administrators_email_address"))
    if not user:
        user = create_user_account(account_credentials, user_details, organization_id)

    # 2. Create healthcare organization user and link to organization
    if not _is_healthcare_user_exist(admin_details.get("administrators_id_no")):
        healthcare_user = create_healthcare_user(
            user_details, organization_id, user.name
        )

    # 3. Send the invitation email to the facility admin
    email = admin_details.get("administrators_email_address")
    email_verification_expiry_hours = int(
        settings.get("email_verification_expiry_hours", 24)
    )
    frontend_baseurl = settings.get("frontend_baseurl")

    # Token generation for email verification
    token_manager = get_token_manager()
    token_data = {
        "email": email,
        "verification_type": "registration",
    }
    email_verification_token = token_manager.generate_token(
        token_data, expiry_hours=str(email_verification_expiry_hours)
    )

    email_verification_link = (
        f"{frontend_baseurl}/email_verification?token={email_verification_token}"
    )

    send_invitation_email(
        email,
        email_verification_link,
        email_verification_expiry_hours,
        email_verification_token,
        account_credentials,
    )

    # Return user and permission data for later processing
    # User permissions will be created AFTER commit to avoid race condition
    return {
        "user": user,
        "permissions_data": {
            "user": user.name,
            "permissions": [
                {"doctype": "Healthcare Organization", "values": [organization_id]},
                {"doctype": "Health Facility", "values": [health_facility.name]},
                {"doctype": "Department", "values": [health_facility.department]},
            ],
        },
    }


def fetch_facility(**kwargs):
    """
    Fetch facility details from the HFR API.

    Steps:
    1. Retrieve API credentials (`hfr_base_url`) from HealthPro Settings.
    2. Generate an API token using the `generate_jwt_token()` function.
    3. Build the request payload with `facility_name`, `registration_number`, or `facility_code`.
    4. Make a GET request to the HFR API with the payload.
    5. Handle errors (e.g., HTTP errors, request exceptions) and log them.
    6. Return the facility data or an appropriate error response.

    """
    # Fetch API credentials
    settings = frappe.db.get_singles_dict("HealthPro Backend Settings")
    hfr_url = settings.hie_url + settings.hfr_fetch_url

    api_key = _hie.generate_jwt_token()
    if not api_key:
        return api_response(
            success=False,
            message="Failed to generate HFR API token. Please check your credentials.",
            status_code=400,
        )
    payload = {}

    # Build search payload
    if kwargs.get("facility_name"):
        payload["facility-name"] = kwargs.get("facility_name")
    if kwargs.get("registration_number"):
        payload["registration-number"] = kwargs.get("registration_number")
    if kwargs.get("facility_code"):
        payload["facility-code"] = kwargs.get("facility_code")
    if kwargs.get("facility_id"):
        payload["facility-fid"] = kwargs.get("facility_id")

    if not payload:
        return api_response(
            success=False,
            message="You must provide facility_name, registration_number, facility_id or facility_code.",
            status_code=400,
        )

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    resp = requests.get(hfr_url, headers=headers, json=payload, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    # Process successful response
    message = data.get("message")
    if not message:
        return api_response(
            success=True,
            data={"message": "No facilities found matching the search criteria."},
            status_code=200,
        )

    return message


def initial_facility_search(**kwargs):
    """
        Perform an initial search for a facility and return masked data.

        Steps:
        1. Call `fetch_facility` to retrieve facility data from the HFR API.
        2. Mask sensitive fields like `facility_owner` and `telephone_no`.
        3. Return the masked facility data in the response.
    .
    """
    search_fields = [
        "facility_name",
        "facility_id",
        "registration_number",
        "facility_code",
    ]
    kwargs.pop("cmd", None)

    if not any(kwargs.get(field) for field in search_fields):
        return api_response(
            success=False,
            message="Please provide at least one of: facility_id, registration_number, or facility_code",
            status_code=400,
        )

    try:
        facility_data = fetch_facility(**kwargs)

        facility = {
            "facility_name": facility_data.get("facility_name"),
            "location": facility_data.get("county"),
            "facility_owner": mask_name(facility_data.get("facility_owner")),
            "telephone_no": mask_phone(facility_data.get("telephone_no")),
        }
        return api_response(success=True, data={"facility": facility}, status_code=200)

    except HTTPError as e:
        status = getattr(e.response, "status_code", 500)
        frappe.log_error(f"HFR HTTPError {status}: {e}", "HFR API Error")
        return api_response(
            success=False,
            message=f"HFR API error: Failed to fetch facility or the facility does not exist",
            status_code=status,
        )

    except RequestException as e:
        frappe.log_error(f"HFR RequestException: {e}", "HFR API Error")
        return api_response(
            success=False,
            message="Unable to reach HFR API. Please try again later.",
            status_code=500,
        )

    except Exception as e:
        frappe.log_error(str(e), "Facility Search Error")
        return api_response(
            success=False, message=f"Facility Search Error: {str(e)}", status_code=500
        )
    


def facility_send_otp(**kwargs):
    """
    Send an OTP to the facility's contact number.

    Steps:
    1. Call `fetch_facility` to retrieve facility data from the HFR API.
    2. Extract the facility's contact number (`telephone_no`).
    3. Use the `send_otp` function to send an OTP to the contact number.
    4. Handle errors during OTP sending and log them.
    5. Return a success response with the OTP record or an error response.

    """
    search_fields = [
        "facility_name",
        "facility_id",
        "registration_number",
        "facility_code",
    ]
    kwargs.pop("cmd", None)

    if not any(kwargs.get(field) for field in search_fields):
        return api_response(
            success=False,
            message="Please provide at least one of: facility_id, registration_number, or facility_code",
            status_code=400,
        )

    try:
        facility_result = fetch_facility(**kwargs)

        phone = facility_result.get("telephone_no")

        if not phone or phone == "":
            return api_response(
                success=False,
                message="No contact number found in HFR data",
                status_code=400,
            )

        otp_response = send_otp(phone=phone, mode="sms")

        if otp_response["status"] == "error":
            return api_response(
                success=False,
                message=otp_response.get("message", "Failed to send OTP"),
                status_code=400,
            )

        return api_response(
            success=True,
            message=f"OTP sent successfully to {phone}",
            data={"otp_record": otp_response.get("otp_record")},
            status_code=200,
        )

    except HTTPError as e:
        status = getattr(e.response, "status_code", 500)
        frappe.log_error(f"HFR HTTPError {status}: {e}", "HFR API Error")
        return api_response(
            success=False,
            message=f"HFR API error: Failed to fetch facility or the facility does not exist",
            status_code=status,
        )

    except RequestException as e:
        frappe.log_error(f"HFR RequestException: {e}", "HFR API Error")
        return api_response(
            success=False,
            message="Unable to reach HFR API. Please try again later.",
            status_code=500,
        )

    except Exception as e:
        frappe.log_error(str(e), "OTP Send Error")
        return api_response(
            success=False, message=f"Failed to send OTP: {str(e)}", status_code=500
        )


def get_full_facility_data(**encrypted_payload):
    """
    Retrieve full facility data after OTP verification.

    Steps:
    1. Verify the OTP using the `verify_otp` function.
    2. If OTP verification fails, return an error response.
    3. Call `fetch_facility` to retrieve facility data from the HFR API.
    4. Return the full facility data in the response.

    """
    try:
        decrypted_payload = _cryptoService.rsa_decrypt(encrypted_payload["payload"])
        kwargs = decrypted_payload["data"]
        kwargs.pop("cmd", None)
        otp_record = kwargs.get("otp_record")
        otp = kwargs.get("otp")

        if not otp_record or not otp:
            return api_response(
                success=False,
                message="OTP record ID and OTP code are required.",
                status_code=401,
            )

        verify_result = verify_otp(otp_record=otp_record, otp=otp)
        if not verify_result["status"] == "success":
            return api_response(
                success=False,
                message=verify_result.get("message", "OTP verification failed."),
                status_code=401,
            )

        facility_data = fetch_facility(**kwargs)
        encrypted_response = _cryptoService.rsa_encrypt(facility_data)

        return api_response(success=True, data=encrypted_response, status_code=200)

    except HTTPError as e:
        status = getattr(e.response, "status_code", 500)
        frappe.log_error(f"HFR HTTPError {status}: {e}", "HFR API Error")
        return api_response(
            success=False,
            message=f"HFR API error (HTTP {status}): {str(e)}",
            status_code=status,
        )

    except RequestException as e:
        frappe.log_error(f"HFR RequestException: {e}", "HFR API Error")
        return api_response(
            success=False,
            message="Unable to reach HFR API. Please try again later.",
            status_code=500,
        )

    except Exception as e:
        frappe.log_error(str(e), "OTP Send Error")
        return api_response(
            success=False,
            message=f"Failed to Fetch Facility: {str(e)}",
            status_code=500,
        )


def create_facility_update_hfr(**encrypted_kwargs):
    """
    Create a facility record in the ERP database and sync it with HFR.

    Steps:
    1. Validate the input payload and extract `registration_number` and `update_fields`.
    2. Check if a facility with the given `registration_number` already exists locally.
    3. If not, create a new `Health Facility` record in the local database.
    4. Prepare the HFR payload and make a PUT request to update the facility in HFR.
    5. Commit the transaction if everything succeeds; otherwise, rollback and log errors.

    """
    try:
        if not encrypted_kwargs:
            return api_response(
                success=False, message="Payload is required", status_code=400
            )
        decrypted_payload = _cryptoService.rsa_decrypt(encrypted_kwargs["payload"])
        kwargs = decrypted_payload["data"]
        kwargs.pop("cmd", None)

        required_fields = [
            "registration_number",
            "designation",
            "administrators_first_name",
            "administrators_middle_name",
            "administrators_last_name",
            "administrators_id_no",
            "administrators_phone_number",
            "administrators_email_address",
        ]

        for field in required_fields:
            if field not in kwargs or not kwargs[field]:
                return api_response(
                    success=False,
                    message=f"`{field}` is required",
                    status_code=400,
                )

        registration_number = kwargs.get("registration_number")

        update_fields = kwargs.get("update_fields", None)

        ownership_type = kwargs.get("facility_type", "")
        """ if ownership_type not in ["private", "public"]:
            return api_response(
                success=False,
                message="`facility_type` must be either 'private' or 'public'",
                status_code=400,
            ) """

        organization_id = kwargs.get("organization_id")
        is_health_facility = kwargs.get("is_health_facility")
        company_name = kwargs.get("company_name")

        if is_health_facility == "true":
            is_health_facility = True
        else:
            is_health_facility = False

        if not ownership_type or not organization_id:
            return api_response(
                success=False,
                message="`facility_type`, and `organization_id` are required",
                status_code=400,
            )

        # --- Step 1: Check if Health Organization exists ---
        health_org = frappe.get_all(
            "Healthcare Organization",
            filters={"name": organization_id},
            fields=["name", "organization_name"],
        )
        if not health_org:
            return api_response(
                success=False,
                message="Organization not found. Please create the organization first.",
                status_code=400,
            )

        organization_name = health_org[0]["organization_name"]
        # --- Create Company Hierarchy ---

        """ if ownership_type == "private":
            # Step 1: Create Sub-Company (Region/Sub-County)
            if not frappe.db.exists(
                "Company", company_name
            ):  # Only create if a company doesn't exist else the same company assigned to the facility
                doc = frappe.get_doc(
                    {
                        "doctype": "Company",
                        "company_name": company_name,
                        "parent_company": organization_name,
                        "default_currency": "KES",
                        "country": "Kenya",
                    }
                )
                doc.insert()

        else:  # public
            company_exists = frappe.db.exists(
                "Company",
                {"company_name": company_name, "parent_company": organization_name},
            )

            if not company_exists:
                doc = frappe.get_doc(
                    {
                        "doctype": "Company",
                        "company_name": company_name,
                        "default_currency": "KES",
                        "country": "Kenya",
                        "parent_company": organization_name,
                    }
                )
                doc.insert() """

        company_exists = frappe.db.exists(
            "Company",
            {"company_name": company_name, "parent_company": organization_name},
        )

        if not company_exists:
            doc = frappe.get_doc(
                {
                    "doctype": "Company",
                    "company_name": company_name,
                    "default_currency": "KES",
                    "country": "Kenya",
                    "parent_company": organization_name,
                }
            )
            doc.insert()

        settings = frappe.db.get_singles_dict("HealthPro Backend Settings")
        base_url = settings.get("hie_url")
        update_url = settings.get("hfr_update_url")
        if not (base_url and update_url):
            return api_response(
                success=False, message="HFR credentials not configured", status_code=500
            )

        # Prepare HFR payload & headers
        hfr_payload = {
            "registration_number": registration_number,
            "update_fields": update_fields,
        }
        token = _hie.generate_jwt_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        existing = frappe.get_all(
            "Health Facility",
            filters={"registration_number": registration_number},
            pluck="name",
            limit_page_length=1,
        )

        if existing:
            return api_response(
                success=False,
                message="Facility with registration_number {0} already exists".format(
                    registration_number
                ),
                status_code=409,
            )

        response = {}
        if not is_health_facility:  # If not a health facility, create a department
            department_doc = frappe.get_doc(
                {
                    "doctype": "Department",
                    "department_name": kwargs.get("facility_name"),
                    "company": company_name,
                }
            )
            department_doc.insert()
            dept_doc = frappe.get_doc("Department", department_doc.name).as_dict()
            del dept_doc["creation"]
            del dept_doc["modified"]
            response["department"] = dept_doc

        else:  # If a health facility, create a Health Facility record
            db_fields = {
                "hie_id": kwargs.get("facility_fid"),
                "facility_name": kwargs.get("facility_name"),
                "facility_type": kwargs.get("facility_type"),
                "facility_owner": kwargs.get("facility_owner"),
                "website": kwargs.get("website", ""),
                "registration_number": kwargs.get("registration_number"),
                "facility_administrator": kwargs.get(
                    "facility_administrator"
                ),  # fallback to same as owner - is it?
                "category": kwargs.get("facility_category"),
                "kephl_level": kwargs.get("facility_level"),
                "address": kwargs.get("physical_address"),
                "email": kwargs.get("official_email"),
                "county": company_name,
                "ward": kwargs.get("ward"),
                "license_number": kwargs.get("current_license_number"),
                "license_fee_paid": kwargs.get("license_fee_paid", ""),
                "license_type": kwargs.get("current_license_type"),
                "license_expiry": kwargs.get("current_license_expiry_date"),
                "license_issuance": kwargs.get("current_license_issuance_date", ""),
                "healthcare_organization": health_org[0]["name"],
                # administrator
                "designation": kwargs.get("designation"),
                "administrators_first_name": kwargs.get("administrators_first_name"),
                "administrators_middle_name": kwargs.get("administrators_middle_name"),
                "administrators_last_name": kwargs.get("administrators_last_name"),
                "administrators_id_no": kwargs.get("administrators_id_no"),
                "administrators_phone_number": kwargs.get(
                    "administrators_phone_number"
                ),
                "administrators_email_address": kwargs.get(
                    "administrators_email_address"
                ),
            }

            doc = frappe.get_doc({"doctype": "Health Facility", **db_fields})
            doc.insert()

            # Handle contacts child table
            contacts = kwargs.get("contacts", [])
            if contacts and isinstance(contacts, list):
                for contact in contacts:
                    if contact.get("contact_name") and contact.get("phone_number"):
                        doc.append(
                            "contacts",
                            {
                                "contact_name": contact.get("contact_name"),
                                "phone_number": contact.get("phone_number"),
                            },
                        )

            # Handle banks child table
            banks = kwargs.get("banks", [])
            if banks and isinstance(banks, list):
                for bank in banks:
                    if bank.get("bank_name") and bank.get("account_number"):
                        doc.append(
                            "banks",
                            {
                                "bank_name": bank.get("bank_name"),
                                "branch_name": bank.get("branch_name", ""),
                                "account_name": bank.get("account_name", ""),
                                "account_number": bank.get("account_number"),
                                "purpose": bank.get("purpose", ""),
                            },
                        )

            # Save the document with child table data
            doc.save()

            full_doc = doc.as_dict()
            del full_doc["creation"]
            del full_doc["modified"]
            response["facility"] = full_doc

        hfr_response = "No update_fields provided. Skipped HFR sync."

        # Only sync with HFR if update_fields are provided
        if update_fields:
            resp = requests.put(
                url=f"{base_url}{update_url}",
                json=hfr_payload,
                headers=headers,
                timeout=10,
            )
            resp.raise_for_status()

            try:
                hfr_response = resp.json()
            except ValueError:
                hfr_response = {"raw_response": resp.text}

        # Send the invitation email to the facility admin
        email_invitation = kwargs.get("email_invitation")
        if email_invitation:
            email = kwargs.get("administrators_email_address")
            email_verification_expiry_hours = int(
                settings.get("email_verification_expiry_hours", 24)
            )
            frontend_baseurl = settings.get("frontend_baseurl")

            # Token generation for email verification
            token_manager = get_token_manager()
            token_data = {
                "email": email,
                "verification_type": "registration",
            }
            email_verification_token = token_manager.generate_token(
                token_data, expiry_hours=str(email_verification_expiry_hours)
            )

            email_verification_link = f"{frontend_baseurl}/email_verification?token={email_verification_token}"

            send_invitation_email(
                email,
                email_verification_link,
                email_verification_expiry_hours,
                email_verification_token,
            )

        frappe.db.commit()
        response["hfr_response"] = hfr_response
        encrypted_response = _cryptoService.rsa_encrypt(response)
        return api_response(
            success=True,
            message="Facility/Department saved locally and synced to HFR",
            data=encrypted_response,
            status_code=201,
        )

    except requests.exceptions.RequestException as e:
        status = getattr(e.response, "status_code", 500)
        frappe.db.rollback()
        frappe.log_error(f"HFR sync failed: {str(e)}", "HFR Update Org Error")
        return api_response(
            success=False,
            message="Failed to update HFR: {0}".format(str(e)),
            status_code=status,
        )

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(str(e), "Health Facility not created")
        return api_response(
            success=False,
            message="Failed to save facility: {0}".format(str(e)),
            status_code=500,
        )


def save_company(company_name, is_group=False, parent_company=None):
    if not company_name:
        return None

    if not frappe.db.exists("Company", {"company_name": company_name}):
        abbr = generate_company_abbreviation(company_name)
        doc = frappe.get_doc(
            {
                "doctype": "Company",
                "company_name": company_name,
                "abbr": abbr,
                "is_group": is_group,
                "parent_company": parent_company,
                "default_currency": "KES",
                "country": "Kenya",
            }
        )
        doc.insert()
        return doc.name


def generate_company_abbreviation(company_name):
    """
    Generate a unique company abbreviation.
    For multi-word: first letter of each word, then add more letters progressively.
    For single word: progressive length until unique.
    """
    if not company_name:
        return ""

    def check_abbr_exists(abbr):
        """Check if abbreviation exists in database"""
        return frappe.db.exists("Company", {"abbr": abbr})

    # Clean name and split into words
    words = company_name.strip().split()

    if len(words) > 1:
        # Multi-word: start with first letter of each word, then add more letters
        abbr = "".join(word[0].upper() for word in words)
        if not check_abbr_exists(abbr):
            return abbr

        # If taken, progressively add more letters from each word
        for extra_chars in range(1, 4):  # add 1, 2, 3 extra chars per word
            abbr = ""
            for word in words:
                # Take 1 + extra_chars from each word (up to word length)
                chars_to_take = min(1 + extra_chars, len(word))
                abbr += word[:chars_to_take].upper()
            if not check_abbr_exists(abbr):
                return abbr

    # Single word or fallback: progressive length
    word = words[0].upper()
    for length in range(1, len(word) + 1):
        abbr = word[:length]
        if not check_abbr_exists(abbr):
            return abbr

    # Last resort: add number
    base = word[:3]
    counter = 1
    while check_abbr_exists(f"{base}{counter}"):
        counter += 1
    return f"{base}{counter}"


def create_new_facility(**encrypted_kwargs):
    """
    Create a facility record in the ERP database and sync it with HFR.

    Steps
    1. Get Organization id.
    2. Validate the input payload and extract `registration_number` and `update_fields`.
    3. Check if a facility with the given `registration_number` already exists locally.
    4. If not, create a new `Health Facility` record in the local database.
    5. Commit the transaction if everything succeeds; otherwise, rollback and log errors.

    """
    try:
        if not encrypted_kwargs:
            return api_response(
                success=False, message="Payload is required", status_code=400
            )
        decrypted_payload = _cryptoService.rsa_decrypt(encrypted_kwargs["payload"])
        kwargs = decrypted_payload["data"]
        kwargs.pop("cmd", None)

        required_fields = [
            "registration_number",
            "region",
        ]

        for field in required_fields:
            if field not in kwargs or not kwargs[field]:
                return api_response(
                    success=False,
                    message=f"`{field}` is required",
                    status_code=400,
                )

        # Extract and validate admin details
        admin_details = kwargs.get("admin_details")
        if admin_details:
            is_valid, error_message = _validate_admin_details(admin_details)
            if not is_valid:
                return api_response(
                    success=False,
                    message=error_message,
                    status_code=400,
                )

        facility_registration_number = kwargs.get("registration_number")

        # get the health care organization user
        LoggedInUser = current_user = frappe.session.user
        Health_care_user = frappe.get_doc(
            "Healthcare Organization User", {"user": LoggedInUser}
        )

        Organization_id = Health_care_user.get("organization", None)
        if not Organization_id:
            return api_response(
                success=False,
                message="Organization is required",
                status_code=400,
            )

        # get Organization
        Organization = frappe.get_doc("Healthcare Organization", Organization_id)
        if not Organization:
            return api_response(
                success=False,
                message="Organization is not found",
                status_code=400,
            )

        Region = frappe.get_doc("Healthcare Organization Region", kwargs.get("region"))
        if not Region:
            return api_response(
                success=False,
                message="Region is not found",
                status_code=400,
            )

        # check if facility already exists
        existing = frappe.get_all(
            "Health Facility",
            filters={"registration_number": facility_registration_number},
            pluck="name",
            limit_page_length=1,
        )
        if existing:
            return api_response(
                success=False,
                message="This facility is already onboarded to another organization",
                status_code=409,
            )

        facility = fetch_facility(registration_number=facility_registration_number)
        if facility.get("error"):
            return api_response(
                success=False,
                message=f"Facility with registration_number {facility_registration_number} not found in HFR",
                status_code=404,
            )

        if not facility.get("facility_fid"):
            return api_response(
                success=False,
                message=f"Facility ID is missing for this facility!",
                status_code=404,
            )

        """ county = facility.get("county", None)
        sub_county = facility.get("sub_county", None)

        # check county and sub county companies exists
        if county:
            if not frappe.db.exists("Company", {"company_name": county}):
                save_company(facility.get("county"), True)

        if sub_county:
            if not frappe.db.exists("Company", {"company_name": sub_county}):
                save_company(sub_county, False, county)  """

        try:
            department = frappe.get_doc(
                "Department", {"department_name": facility.get("facility_fid")}
            )
        except frappe.DoesNotExistError:
            # Create a new Department document
            department = frappe.new_doc("Department")
            department.name = facility.get("facility_fid")
            department.department_name = facility.get("facility_fid")
            department.company = Region.get("company")
            department.custom_is_health_facility = True
            department.is_group = True
            department.insert()

        department_name = department.get("name", None)
        region = Region.get("company")
        organization = frappe.get_doc("Company", region)
        organization_county = organization.get("parent_company", None)

        db_fields = {
            "hie_id": facility.get("facility_fid")
            or facility.get("registration_number"),
            "facility_name": facility.get("facility_name"),
            "facility_type": facility.get("facility_type"),
            "facility_owner_type": facility.get("facility_owner_type"),
            "facility_owner": facility.get("facility_owner"),
            "website": facility.get("website", ""),
            "registration_number": facility.get("registration_number"),
            "category": facility.get("facility_category"),
            "kephl_level": facility.get("facility_level"),
            "address": facility.get("physical_address"),
            "email": facility.get("official_email"),
            "number_of_beds": facility.get("number_of_beds"),
            "latitude": facility.get("latitude"),
            "longitude": facility.get("longitude"),
            "county": facility.get("county"),
            "sub_county": facility.get("sub_county"),
            "organization_company": organization_county,
            "region_company": region,
            "ward": facility.get("ward", None),
            "license_number": facility.get("current_license_number"),
            "license_fee_paid": facility.get("license_fee_paid", ""),
            "license_type": facility.get("current_license_type"),
            "license_expiry": facility.get("current_license_expiry_date"),
            "license_issuance": facility.get("current_license_issuance_date", ""),
            "healthcare_organization": Organization_id,
            "healthcare_organization_region": kwargs.get("region"),
            "department": department_name,
            "kra_pin": facility.get("kra_pin", ""),
            "facility_mfl": facility.get("facility_code", ""),
            "regulatory_body": facility.get("regulatory_body", ""),
            "operational_status": facility.get("operational_status", ""),
            "license_type": facility.get("current_license_type", ""),
            "approved": facility.get("approved", ""),
            "license_renewal_duration": facility.get("license_renewal_duration", ""),
            "current_license_renewal_date": facility.get(
                "current_license_renewal_date", ""
            ),
            "standing": facility.get("standing", ""),
            "reason": facility.get("reason", ""),
            "suspension_date": facility.get("suspension_date", ""),
            "suspension_reason": facility.get("suspension_reason", ""),
            "earliest_reistatement_date": facility.get(
                "earliest_reistatement_date", ""
            ),
            "reinstatement_recommendations": facility.get(
                "reinstatement_recommendations", ""
            ),
            "accuracy": facility.get("accuracy", ""),
            "pcn": facility.get("pcn", ""),
            "altitude": facility.get("altitude", ""),
            "constituency": facility.get("constituency", ""),
            "maximum_bed_allocation": facility.get("maximum_bed_allocation", ""),
            "number_of_cots": facility.get("number_of_cots", ""),
            "open_whole_day": facility.get("open_whole_day", ""),
            "open_public_holiday": facility.get("open_public_holiday", ""),
            "open_weekends": facility.get("open_weekends", ""),
            "open_late_night": facility.get("open_late_night", ""),
            "administrator_board_registration_number": facility.get(
                "owner_board_registration_number", ""
            ),
            "administrator_current_license_number": facility.get(
                "owner_current_license_number", ""
            ),
        }

        if admin_details:
            db_fields["facility_administrator"] = (
                admin_details.get("administrators_first_name")
                + " "
                + admin_details.get("administrators_last_name")
            )
            db_fields["designation"] = admin_details.get("designation")
            db_fields["administrators_first_name"] = admin_details.get(
                "administrators_first_name"
            )
            db_fields["administrators_middle_name"] = admin_details.get(
                "administrators_middle_name"
            )
            db_fields["administrators_last_name"] = admin_details.get(
                "administrators_last_name"
            )
            db_fields["administrators_id_no"] = admin_details.get(
                "administrators_id_no"
            )
            db_fields["administrators_phone_number"] = admin_details.get(
                "administrators_phone_number"
            )
            db_fields["administrators_email_address"] = admin_details.get(
                "administrators_email_address"
            )
            db_fields["administrators_id_type"] = admin_details.get(
                "administrators_id_type"
            )
            db_fields["administrators_gender"] = admin_details.get(
                "administrators_gender"
            )
            db_fields["administrators_date_of_birth"] = admin_details.get(
                "administrators_date_of_birth"
            )

        doc = frappe.get_doc({"doctype": "Health Facility", **db_fields})

        # Handle level history
        level_histories = facility.get("level_history", [])
        if level_histories and isinstance(level_histories, list):
            for history in level_histories:
                if history.get("level") and history.get("effective_start_date"):
                    # check if level dictionary concept exists first and add if not
                    if not frappe.db.exists(
                        "Registry Dictionary Concept", history.get("level")
                    ):
                        # Create new document
                        concept = frappe.get_doc(
                            {
                                "doctype": "Registry Dictionary Concept",
                                "concept_name": history.get("level"),
                            }
                        )
                        concept.insert()

                    doc.append(
                        "level_history",
                        {
                            "level": history.get("level"),
                            "effective_start_date": history.get("effective_start_date"),
                            "effective_end_date": history.get("effective_end_date"),
                        },
                    )

        # Handle Available Services
        available_services = facility.get("available_services", [])
        if available_services and isinstance(available_services, list):
            for service in available_services:
                if service.get("name"):
                    # check if level dictionary concept exists first and add if not
                    if not frappe.db.exists(
                        "Registry Dictionary Concept", service.get("name")
                    ):
                        # Create new document
                        concept = frappe.get_doc(
                            {
                                "doctype": "Registry Dictionary Concept",
                                "concept_name": service.get("name"),
                            }
                        )
                        concept.insert()

                    doc.append(
                        "facility_available_services",
                        {
                            "available_services": service.get("name"),
                            "is_available": service.get("is_available"),
                        },
                    )

        # Handle Admission Types
        admission_types = facility.get("admission_types", [])
        if admission_types and isinstance(admission_types, list):
            for item in admission_types:
                if item.get("admission_types"):
                    # check if level dictionary concept exists first and add if not
                    if not frappe.db.exists(
                        "Registry Dictionary Concept", item.get("admission_types")
                    ):
                        # Create new document
                        concept = frappe.get_doc(
                            {
                                "doctype": "Registry Dictionary Concept",
                                "concept_name": item.get("admission_types"),
                            }
                        )
                        concept.insert()
                    doc.append(
                        "facility_admission_types",
                        {
                            "admission_types": item.get("admission_types"),
                        },
                    )

        # Handle bed capacity
        bed_capacity_distribution = facility.get("bed_capacity_distribution", [])
        if bed_capacity_distribution and isinstance(bed_capacity_distribution, list):
            for item in bed_capacity_distribution:
                if item.get("type"):
                    # check if level dictionary concept exists first and add if not
                    if not frappe.db.exists(
                        "Registry Dictionary Concept", item.get("type")
                    ):
                        # Create new document
                        concept = frappe.get_doc(
                            {
                                "doctype": "Registry Dictionary Concept",
                                "concept_name": item.get("type"),
                            }
                        )
                        concept.insert()
                    doc.append(
                        "bed_capacity_distribution",
                        {
                            "type": item.get("type"),
                            "capacity": item.get("capacity"),
                        },
                    )

        # Handle contacts child table
        contacts = kwargs.get("contacts", [])
        if contacts and isinstance(contacts, list):
            for contact in contacts:
                if contact.get("contact_name") and contact.get("phone_number"):
                    doc.append(
                        "contacts",
                        {
                            "contact_name": contact.get("contact_name"),
                            "phone_number": contact.get("phone_number"),
                        },
                    )

        # Handle banks child table
        banks = kwargs.get("banks", [])
        if banks and isinstance(banks, list):
            for bank in banks:
                if bank.get("bank_name") and bank.get("account_number"):
                    doc.append(
                        "banks",
                        {
                            "bank_name": bank.get("bank_name"),
                            "branch_name": bank.get("branch_name", ""),
                            "account_name": bank.get("account_name", ""),
                            "account_number": bank.get("account_number"),
                            "purpose": bank.get("purpose", ""),
                        },
                    )
        # Save the document with child table data
        doc.insert()

        health_facility = doc.as_dict()

        # update the department with the health facility
        dept = frappe.get_doc("Department", department_name)
        dept.custom_health_facility = health_facility.get("name")
        dept.save()

        response = {}
        response["facility"] = {
            "facility_name": health_facility.get("facility_name"),
            "facility_administrator": health_facility.get("facility_administrator"),
            "registration_number": health_facility.get("registration_number"),
            "facility_type": health_facility.get("facility_type"),
            "facility_owner_type": health_facility.get("facility_owner_type"),
            "healthcare_organization": health_facility.get("healthcare_organization"),
            "healthcare_organization_region": health_facility.get(
                "healthcare_organization_region"
            ),
            "department": health_facility.get("department"),
            "hie_id": health_facility.get("hie_id"),
            "kephl_level": health_facility.get("kephl_level"),
            "county": health_facility.get("county"),
            "sub_county": health_facility.get("sub_county"),
            "administrators_id_no": health_facility.get("administrators_id_no"),
            "administrators_email_address": health_facility.get(
                "administrators_email_address"
            ),
        }

        # Create required records for Facility Admin if admin details are provided
        admin_result = None
        if admin_details:
            admin_result = _fulfill_required_records_creation_for_admin(
                admin_details, Organization_id, health_facility
            )

        # Commit transaction before enqueuing async jobs
        frappe.db.commit()

        # Create user permissions AFTER commit to avoid race condition
        if admin_result and admin_result.get("permissions_data"):
            create_user_permissions_bulk(**admin_result["permissions_data"])

        encrypted_response = _cryptoService.rsa_encrypt(response)
        return api_response(
            success=True,
            data=encrypted_response,
            status_code=201,
        )

    except requests.exceptions.RequestException as e:
        status = getattr(e.response, "status_code", 500)
        frappe.db.rollback()
        frappe.log_error(f"HFR sync failed: {str(e)}", "HFR Update Org Error")
        return api_response(
            success=False,
            message="Failed to update HFR: {0}".format(str(e)),
            status_code=status,
        )

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error("Health Facility not created", str(e))
        return api_response(
            success=False,
            message="Failed to save facility: {0}".format(str(e)),
            status_code=500,
        )


def update_existing_facility(**encrypted_kwargs):
    """
    Update an existing facility record in the ERP database.
    """
    try:
        if not encrypted_kwargs:
            return api_response(
                success=False, message="Payload is required", status_code=400
            )

        decrypted_payload = _cryptoService.rsa_decrypt(encrypted_kwargs["payload"])
        kwargs = decrypted_payload["data"]
        kwargs.pop("cmd", None)

        # Registration number is required to identify the facility
        registration_number = kwargs.get("registration_number")
        if not registration_number:
            return api_response(
                success=False,
                message="registration_number is required",
                status_code=400,
            )

        # Extract and validate admin details
        admin_details = kwargs.get("admin_details")
        if admin_details:
            is_valid, error_message = _validate_admin_details(admin_details)
            if not is_valid:
                return api_response(
                    success=False,
                    message=error_message,
                    status_code=400,
                )

        # Check if facility exists
        facility_name = frappe.db.get_value(
            "Health Facility", {"registration_number": registration_number}, "name"
        )

        if not facility_name:
            return api_response(
                success=False,
                message="Facility with the provided registration number not found",
                status_code=404,
            )

        # Get the facility document
        doc = frappe.get_doc("Health Facility", facility_name)

        # Update basic fields if provided
        updateable_fields = [
            "county",
            "sub_county",
            "ward",
            "constituency",
            "phone",
            "email",
            "address",
            "industry",
            "maximum_bed_allocation",
            "number_of_beds",
            "open_whole_day",
            "open_public_holiday",
            "open_weekends",
            "open_late_night" "website",
            "latitude",
            "longitude",
        ]

        for field in updateable_fields:
            if field in kwargs and kwargs[field] is not None:
                doc.set(field, kwargs[field])

        create_admin_records = False
        if admin_details:
            if not doc.administrators_email_address:
                doc.set(
                    "facility_administrator",
                    admin_details.get("administrators_first_name")
                    + " "
                    + admin_details.get("administrators_last_name"),
                )
                doc.set("designation", admin_details.get("designation"))
                doc.set(
                    "administrators_first_name",
                    admin_details.get("administrators_first_name"),
                )
                doc.set(
                    "administrators_middle_name",
                    admin_details.get("administrators_middle_name"),
                )
                doc.set(
                    "administrators_last_name",
                    admin_details.get("administrators_last_name"),
                )
                doc.set(
                    "administrators_id_no", admin_details.get("administrators_id_no")
                )
                doc.set(
                    "administrators_phone_number",
                    admin_details.get("administrators_phone_number"),
                )
                doc.set(
                    "administrators_email_address",
                    admin_details.get("administrators_email_address"),
                )
                doc.set(
                    "administrators_id_type",
                    admin_details.get("administrators_id_type"),
                )
                doc.set(
                    "administrators_gender", admin_details.get("administrators_gender")
                )
                doc.set(
                    "administrators_date_of_birth",
                    admin_details.get("administrators_date_of_birth"),
                )
                create_admin_records = True

        # Update contacts if provided
        if "contacts" in kwargs and isinstance(kwargs["contacts"], list):
            doc.contacts = []  # Clear existing
            for contact in kwargs["contacts"]:
                if contact.get("contact_name") and contact.get("phone_number"):
                    doc.append(
                        "contacts",
                        {
                            "contact_name": contact.get("contact_name"),
                            "phone_number": contact.get("phone_number"),
                        },
                    )

        # Update banks if provided
        if "banks" in kwargs and isinstance(kwargs["banks"], list):
            doc.banks = []  # Clear existing
            for bank in kwargs["banks"]:
                if bank.get("bank_name") and bank.get("account_number"):
                    doc.append(
                        "banks",
                        {
                            "bank_name": bank.get("bank_name"),
                            "branch_name": bank.get("branch_name", ""),
                            "account_name": bank.get("account_name", ""),
                            "account_number": bank.get("account_number"),
                            "purpose": bank.get("purpose", ""),
                        },
                    )

        # Save the document
        doc.save()

        # Create required records for Facility Admin if admin details are provided
        admin_result = None
        if create_admin_records:
            admin_result = _fulfill_required_records_creation_for_admin(
                admin_details, doc.healthcare_organization, doc
            )

        frappe.db.commit()

        # Create user permissions AFTER commit to avoid race condition
        if admin_result and admin_result.get("permissions_data"):
            create_user_permissions_bulk(**admin_result["permissions_data"])

        # Prepare response
        response = {
            "facility": {
                "facility_name": doc.facility_name,
                "registration_number": doc.registration_number,
                "facility_administrator": doc.facility_administrator,
                "administrators_email_address": doc.administrators_email_address,
            }
        }

        encrypted_response = _cryptoService.rsa_encrypt(response)
        return api_response(
            success=True,
            data=encrypted_response,
            message="Facility updated successfully",
            status_code=200,
        )

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error("Health Facility update failed", str(e))
        return api_response(
            success=False,
            message=f"Failed to update facility: {str(e)}",
            status_code=500,
        )


def add_company(**data):
    try:
        company_name = data.get("company_name")
        company_type = data.get("company_type")
        parent_company = data.get(
            "parent_company"
        )  # optional, can be used to create sub-companies

        if not company_name or not company_type:
            return api_response(
                success=False,
                message="`company_name` and `company_type` are required",
                status_code=400,
            )

        if frappe.db.exists("Company", {"company_name": company_name}):
            return api_response(
                success=False,
                message=f"Company '{company_name}' already exists.",
                status_code=409,
            )

        company_doc = frappe.get_doc(
            {
                "doctype": "Company",
                "company_name": company_name,
                "custom_company_type": company_type,
                "parent_company": parent_company,
                "default_currency": "KES",
                "country": "Kenya",
                "is_group": True,
            }
        )

        company_doc.insert()
        frappe.db.commit()

        return api_response(
            success=True,
            message="Company created successfully",
            data={"company_id": company_doc.name},
            status_code=201,
        )

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(str(e), "Create Company Error")
        return api_response(
            success=False,
            message=f"Failed to create company: {str(e)}",
            status_code=500,
        )


def get_companies(organization_name=None, company_type=None):
    try:
        fields = [
            "name",
            "company_name",
            "parent_company",
            "custom_company_type",
            "default_currency",
            "country",
        ]
        companies = []

        # If organization_name is provided, fetch the parent company by company_name
        if organization_name:
            parent_company = frappe.get_all(
                "Company", filters={"company_name": organization_name}, fields=fields
            )
            if parent_company:
                companies.extend(parent_company)

                # Fetch all child companies where this is the parent
                child_filters = {"parent_company": organization_name}
                if company_type:
                    child_filters["custom_company_type"] = company_type

                child_companies = frappe.get_all(
                    "Company", filters=child_filters, fields=fields
                )
                companies.extend(child_companies)
            else:
                # If no matching parent company is found, fallback to searching as child only
                filters = {"parent_company": organization_name}
                if company_type:
                    filters["custom_company_type"] = company_type
                companies = frappe.get_all("Company", filters=filters, fields=fields)

        else:
            # No organization_name filter passed, fetch all companies (optionally filtered by company_type)
            filters = {}
            if company_type:
                filters["custom_company_type"] = company_type
            companies = frappe.get_all("Company", filters=filters, fields=fields)

        return api_response(
            success=True, data={"companies": companies}, status_code=200
        )

    except Exception as e:
        frappe.log_error(str(e), "Fetch Companies Error")
        return api_response(
            success=False,
            message=f"Failed to fetch companies: {str(e)}",
            status_code=500,
        )


def add_department(**encrypted_kwargs):
    try:
        if not encrypted_kwargs:
            return api_response(
                success=False, message="Payload is required", status_code=400
            )
        decrypted_payload = _cryptoService.rsa_decrypt(encrypted_kwargs["payload"])
        data = decrypted_payload["data"]

        # Extract required fields from the decrypted payload
        department_name = data.get("department_name")
        company = data.get("company")
        description = data.get("description", "")
        custom_health_facility = data.get("custom_health_facility", None)
        is_group = data.get("is_group", False)

        if not department_name or not company:
            return api_response(
                success=False,
                message="`department_name` and `company` are required",
                status_code=400,
            )

        if frappe.db.exists(
            "Department", {"department": department_name, "company": company}
        ):
            return api_response(
                success=False,
                message=f"Department '{department_name}' already exists in {company}.",
                status_code=409,
            )

        department_doc = frappe.get_doc(
            {
                "doctype": "Department",
                "department_name": department_name,
                "custom_description": description,
                "parent_department": "All Departments",  # Default parent department
                "company": company,
                "custom_health_facility": custom_health_facility,
                "custom_is_health_facility": True,
                "is_group": is_group,
            }
        )

        department_doc.insert()
        response = {"department_id": department_doc.name}
        encrypted_response = _cryptoService.rsa_encrypt(response)
        frappe.db.commit()

        return api_response(
            success=True,
            message="Department created successfully",
            data=encrypted_response,
            status_code=201,
        )

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(str(e), "Create Department Error")
        return api_response(
            success=False,
            message=f"Failed to create department: {str(e)}",
            status_code=500,
        )


def get_departments(company_name=None, facility=None):
    try:
        filters = {}
        filters["custom_is_health_facility"] = (
            True  # Only fetch departments against health facilities
        )
        if company_name:
            filters["company"] = company_name
        if facility:
            filters["custom_health_facility"] = facility

        departments = frappe.get_all(
            "Department",
            filters=filters,
            fields=[
                "name",
                "department_name",
                "company",
                "custom_health_facility",
                "is_group",
                "custom_is_health_facility",
            ],
        )

        response = {"departments": departments}
        encrypted_response = _cryptoService.rsa_encrypt(response)
        return api_response(success=True, data=encrypted_response, status_code=200)

    except Exception as e:
        frappe.log_error(str(e), "Fetch Departments Error")
        return api_response(
            success=False,
            message=f"Failed to fetch departments: {str(e)}",
            status_code=500,
        )

def get_facility_departments(facility=None):
    try:
        filters = {}
        filters["custom_is_health_facility"] = (
            False  # Only fetch departments against health facilities
        )
        if facility:
            filters["custom_health_facility"] = facility

        departments = frappe.get_all(
            "Department",
            filters=filters,
            fields=[
                "name",
                "department_name",
                "company",
                "custom_health_facility",
                "is_group",
                "custom_is_health_facility",
            ],
        )

        response = {"departments": departments}
        encrypted_response = _cryptoService.rsa_encrypt(response)
        return api_response(success=True, data=encrypted_response, status_code=200)

    except Exception as e:
        frappe.log_error(str(e), "Fetch Departments Error")
        return api_response(
            success=False,
            message=f"Failed to fetch departments: {str(e)}",
            status_code=500,
        )


def add_service_point(**encrypted_kwargs):
    try:
        if not encrypted_kwargs:
            return api_response(
                success=False, message="Payload is required", status_code=400
            )
        decrypted_payload = _cryptoService.rsa_decrypt(encrypted_kwargs["payload"])
        data = decrypted_payload["data"]

        # Extract required fields from the decrypted payload
        name = data.get("name")
        parent_department = data.get("parent_department", "All Departments")
        company = data.get("company")
        number_of_stations = data.get("number_of_stations")
        no_of_shifts = data.get("number_of_shifts")
        shifts_available = data.get("shifts_available")

        # --- 1. Create Service Point ---
        sp_doc = frappe.get_doc(
            {
                "doctype": "Department",
                "department_name": name,
                "company": company,
                "parent_department": parent_department,
                "custom_number_of_stations": number_of_stations,
                "custom_shifts_available": shifts_available,
                "custom_number_of_shifts": no_of_shifts,
                "custom_is_service_point": True,
            }
        )
        sp_doc.insert(ignore_permissions=True)

        response = {"service_point_id": sp_doc.name}
        encrypted_response = _cryptoService.rsa_encrypt(response)
        return api_response(success=True, status_code=200, data=encrypted_response)

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(str(e), "Create Service Point Failed")
        return api_response(
            success=False,
            message=f"Service Point creation failed: {str(e)}",
            status_code=500,
        )


def add_service_point_v1(**encrypted_kwargs):
    try:
        if not encrypted_kwargs:
            return api_response(
                success=False, message="Payload is required", status_code=400
            )
        decrypted_payload = _cryptoService.rsa_decrypt(encrypted_kwargs["payload"])
        kwargs = decrypted_payload["data"]
        kwargs.pop("cmd", None)

        required_fields = [
            "service_point",
            "health_facility",
            "department",
            "number_of_stations",
        ]

        for field in required_fields:
            if field not in kwargs or not kwargs[field]:
                return api_response(
                    success=False,
                    message=f"`{field}` is required",
                    status_code=400,
                )

        if kwargs.get("shifts_available") in ["Yes","yes", "true", "True", True, 1, "1"]:
            if not kwargs.get("number_of_shifts"):
                return api_response(
                    success=False,
                    message=f"Number of shifts is required",
                    status_code=400,
                )
        # check if is ward
        if kwargs.get("is_ward") in ["Yes","yes", "true", "True", True, 1, "1"]:
            if not kwargs.get("ward_gender"):
                return api_response(
                    success=False,
                    message="Ward Gender is required!",
                    status_code=400,
                )
            if not kwargs.get("ward_type"):
                return api_response(
                    success=False,
                    message="Ward Type is required!",
                    status_code=400,
                )

        # 1. Check if Location exists if not create
        try:
            location = frappe.get_doc(
                "Location", {"custom_location_id": kwargs.get("service_point")}
            )
        except frappe.DoesNotExistError:
            # Create a new Department document
            return api_response(
                success=False,
                message=f"The provided Service Point does not exist!",
                status_code=400,
            )

        location_name = location.get("name", None)

        # load the department
        try:
            department = frappe.get_doc(
                "Department", {"name": kwargs.get("department")}
            )
        except frappe.DoesNotExistError:
            return api_response(
                success=False,
                message=f"The provided department does not exist!",
                status_code=400,
            )
        # Load the health facility
        try:
            health_facility = frappe.get_doc(
                "Health Facility", kwargs.get("health_facility")
            )
        except frappe.DoesNotExistError:
            return api_response(
                success=False,
                message=f"The provided Health facility does not exist!",
                status_code=400,
            )

        # create the service point
        # 1. check if service point already exist
        service_point_exists = frappe.db.exists(
            "Service Points",
            {
                "health_facility": kwargs.get("health_facility"),
                "location_id": kwargs.get("service_point"),
            },
        )
        if service_point_exists:
            return api_response(
                success=False,
                message=f"The provided Service point already Exists!",
                status_code=400,
            )

        # Create a new service point document
        s_point = frappe.new_doc("Service Points")
        s_point.location_id = location.get("custom_location_id")
        s_point.service_point_name = location.get("name")
        s_point.department = department.get("name")
        s_point.health_facility = health_facility.get("name")
        s_point.number_of_stations = kwargs.get("number_of_stations")
        if kwargs.get("shifts_available"):
            s_point.shifts_available = True
            s_point.number_of_shifts = kwargs.get("number_of_shifts")
        if kwargs.get("is_ward"):
            s_point.is_ward = True
        if kwargs.get("ward_gender"):
            s_point.ward_gender = kwargs.get("ward_gender")
        if kwargs.get("ward_type"):
            s_point.ward_type = kwargs.get("ward_type")

        if kwargs.get("service_type"):
            s_point.service_type = kwargs.get("service_type")
        if kwargs.get("description"):
            s_point.description = kwargs.get("description")

        if kwargs.get("regulator"):
            s_point.regulator = kwargs.get("regulator")
        if kwargs.get("regulator_registration_number"):
            s_point.regulator_registration_number = kwargs.get("regulator_registration_number")   
        if kwargs.get("facility_fid"):
            s_point.facility_fid = kwargs.get("facility_fid")

        s_point.is_active = True
        s_point.insert()
        frappe.db.commit()

        response = {
            "service_point": s_point.get("service_point_name", None),
            "department": s_point.get("department", None),
            "number_of_stations": s_point.get("number_of_stations", None),
            "shifts_available": s_point.get("shifts_available", None),
            "description": s_point.get("description", None),
        }
        encrypted_response = _cryptoService.rsa_encrypt(response)
        return api_response(success=True, status_code=200, data=encrypted_response)

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(str(e), "Create Service Point Failed")
        return api_response(
            success=False,
            message=f"Service Point creation failed: {str(e)}",
            status_code=500,
        )


def edit_service_point_v1(**encrypted_kwargs):
    try:
        if not encrypted_kwargs:
            return api_response(
                success=False, message="Payload is required", status_code=400
            )
        decrypted_payload = _cryptoService.rsa_decrypt(encrypted_kwargs["payload"])
        kwargs = decrypted_payload["data"]
        kwargs.pop("cmd", None)

        required_fields = [
            "service_point",
        ]

        for field in required_fields:
            if field not in kwargs or not kwargs[field]:
                return api_response(
                    success=False,
                    message=f"`{field}` is required",
                    status_code=400,
                )

        # update the service point
        try:
            update_fields = {}

            if kwargs.get("department"):
                # load the department
                try:
                    department = frappe.get_doc(
                        "Department", {"name": kwargs.get("department")}
                    )
                    update_fields["department"] = department.get("name")
                except frappe.DoesNotExistError:
                    return api_response(
                        success=False,
                        message=f"The provided department does not exist!",
                        status_code=400,
                    )

            if kwargs.get("number_of_stations"):
                update_fields["number_of_stations"] = kwargs.get("number_of_stations")
            if kwargs.get("shifts_available"):
                update_fields["shifts_available"] = kwargs.get("shifts_available")
            if kwargs.get("number_of_shifts"):
                update_fields["number_of_shifts"] = kwargs.get("number_of_shifts")
            if kwargs.get("service_type"):
                update_fields["service_type"] = kwargs.get("service_type")
            if kwargs.get("description"):
                update_fields["description"] = kwargs.get("description")
            if kwargs.get("is_active"):
                update_fields["is_active"] = kwargs.get("is_active")
            if kwargs.get("is_ward"):
                update_fields["is_ward"] = True
            if kwargs.get("ward_gender"):
                update_fields["ward_gender"] = kwargs.get("ward_gender")
            if kwargs.get("ward_type"):
                update_fields["ward_type"] = kwargs.get("ward_type")
            if kwargs.get("regulator"):
                update_fields["regulator"] = kwargs.get("regulator")
            if kwargs.get("regulator_registration_number"):
                update_fields[
                    "regulator_registration_number"
                ] = kwargs.get("regulator_registration_number")
            if kwargs.get("facility_fid"):
                update_fields["facility_fid"] = kwargs.get("facility_fid")  

            # update the doctype
            doc = frappe.get_doc("Service Points", kwargs.get("service_point"))

            for field, value in update_fields.items():
                doc.set(field, value)

            doc.save()

            frappe.db.commit()

            response = {
                "messate": "Updated successfully",
            }
            encrypted_response = _cryptoService.rsa_encrypt(response)
            return api_response(success=True, status_code=200, data=encrypted_response)

        except Exception as e:
            frappe.log_error("There was an error updating service type", str(e))
            return api_response(
                success=False,
                message="There was an error updating service type!",
                status_code=500,
            )
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(str(e), "Update Service Point Failed")
        return api_response(
            success=False,
            message=f"Update Point creation failed: {str(e)}",
            status_code=500,
        )


def get_ward_types_v1(**kwargs):
    try:
        service_points = frappe.get_all(
            "Registry Dictionary Concept",
            filters={"concept_class": "Ward Type"},
            pluck="name",
        )

        return api_response(success=True, data=service_points, status_code=200)

    except Exception as e:
        frappe.log_error(str(e), "Fetch Ward Types Error")
        return api_response(
            success=False,
            message=f"Failed to fetch Ward Types: {str(e)}",
            status_code=500,
        )


def remove_service_point(**encrypted_kwargs):
    try:
        if not encrypted_kwargs:
            return api_response(
                success=False, message="Payload is required", status_code=400
            )
        decrypted_payload = _cryptoService.rsa_decrypt(encrypted_kwargs["payload"])
        kwargs = decrypted_payload["data"]
        kwargs.pop("cmd", None)

        required_fields = [
            "service_point",
        ]

        for field in required_fields:
            if field not in kwargs or not kwargs[field]:
                return api_response(
                    success=False,
                    message=f"`{field}` is required",
                    status_code=400,
                )

        # create the service point
        # 1. check if service point already exist
        try:
            service_point = frappe.get_doc(
                "Service Points",
                {
                    "name": kwargs.get("service_point"),
                },
            )
        except Exception as e:
            frappe.log_error("Service Point load error", str(e))
            return api_response(
                success=False,
                message="An error occurred while retrieving the service point.",
                status_code=500,
            )

        # delete the service point
        try:
            frappe.delete_doc(
                "Service Points", service_point.get("name"), ignore_permissions=False
            )
        except ValidationError as ve:
            frappe.db.rollback()
            return api_response(success=False, message=str(ve), status_code=400)

        except AuthError as ae:
            return api_response(
                success=False, message=ae.message, status_code=ae.status_code
            )

        except Exception as e:
            frappe.db.rollback()
            frappe.log_error("Service Point Deletion Error", frappe.get_traceback())
            return api_response(
                success=False,
                message="Failed to delete the Service Point due to an internal error.",
                status_code=500,
            )

        response = {
            "message": "Successfully deleted the service point",
        }
        encrypted_response = _cryptoService.rsa_encrypt(response)
        return api_response(success=True, status_code=200, data=encrypted_response)

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(str(e), "Create Service Point Failed")
        return api_response(
            success=False,
            message=f"Service Point creation failed: {str(e)}",
            status_code=500,
        )


def get_location_service_points():
    try:
        service_points = frappe.get_all(
            "Location",
            filters={"custom_is_service_point": True},
            fields=[
                "custom_location_id as service_point_id",
                "location_name as service_point_name",
            ],
        )

        response = {"service_points": service_points}
        return api_response(success=True, data=response, status_code=200)

    except Exception as e:
        frappe.log_error(str(e), "Fetch Service Points Error")
        return api_response(
            success=False,
            message=f"Failed to fetch service points: {str(e)}",
            status_code=500,
        )


def get_service_points(department=None):
    try:
        filters = {}
        filters["custom_is_service_point"] = True
        if department:
            filters["name"] = department

        service_points = frappe.get_all(
            "Department",
            filters=filters,
            fields=[
                "name",
                "department_name",
                "parent_department",
                "custom_number_of_stations",
                "custom_shift_available",
                "custom_number_of_shifts",
            ],
        )

        response = {"service_points": service_points}
        encrypted_response = _cryptoService.rsa_encrypt(response)
        return api_response(success=True, data=encrypted_response, status_code=200)

    except Exception as e:
        frappe.log_error(str(e), "Fetch Service Points Error")
        return api_response(
            success=False,
            message=f"Failed to fetch service points: {str(e)}",
            status_code=500,
        )


def get_service_points_v1(**kwargs):
    try:
        filters = {}
        if kwargs.get("health_facility"):
            filters["health_facility"] = kwargs.get("health_facility")
        if kwargs.get("department"):
            filters["department"] = kwargs.get("department")
        if kwargs.get("shifts_available") is not None:
            shift_value = str(kwargs.get("shifts_available")).lower()
            if shift_value in ["true", "1", "available"]:
                filters["shifts_available"] = 1
            elif shift_value in ["false", "0", "not available", "unavailable"]:
                filters["shifts_available"] = 0
        if kwargs.get("search"):
            filters["service_point_name"] = ["like", f"%{kwargs.get('search')}%"]

        service_points = frappe.get_list(
            "Service Points",
            filters=filters,
            fields=[
                "name as service_point_id",
                "service_point_name",
                "department",
                "health_facility",
                "number_of_stations",
                "shifts_available",
                "number_of_shifts",
                "service_type",
                "is_ward",
                "ward_gender",
                "ward_type",
                "description",
                "is_active",
            ],
        )

        response = {"service_points": service_points}
        return response
        encrypted_response = _cryptoService.rsa_encrypt(response)
        return api_response(success=True, data=encrypted_response, status_code=200)

    except Exception as e:
        frappe.log_error(str(e), "Fetch Service Points Error")
        return api_response(
            success=False,
            message=f"Failed to fetch service points: {str(e)}",
            status_code=500,
        )


def send_invitation_email(
    recipient_email,
    invitation_link,
    invitation_expiry_minutes,
    token=None,
    account_credentials={},
):

    # Send email
    args = {
        "subject": "Registration Invite",
        "user": recipient_email,
        "invitation_link": invitation_link,
        "invitation_expiry_minutes": invitation_expiry_minutes,
        "username": account_credentials.get("username"),
        "password": account_credentials.get("password"),
        "token": token,
    }
    frappe.enqueue(
        method="careverse_hq.api.utils.send_custom_email",
        queue="default",
        timeout=300,
        template_name="registration_invite",
        template_args=args,
        recipient=recipient_email,
        sender="healthpro@kenya-hie.health",
        job_name=f"facility_admin_invitation_email_{recipient_email}_{frappe.utils.now()}",
    )


def get_designations_list():
    try:
        designations = frappe.get_all("Designation", fields=["*"])
        return api_response(
            success=True,
            data=[d.designation_name for d in designations],
            status_code=200,
        )

    except Exception as e:
        frappe.log_error(str(e), "Fetch Designations Error")
        return api_response(
            success=False,
            message=f"Failed to fetch designations: {str(e)}",
            status_code=500,
        )


def get_designations_list_v1(**kwargs):
    kwargs.pop('cmd',None)
    try:
        filters = []
        # Build filters based on provided kwargs
        if kwargs.get("regulatory_body"):
            #load the Body to see if it exists
            reg_body = kwargs.get("regulatory_body")
            try:
                docs = frappe.get_all(
                    "Regulatory Body",
                    or_filters={
                        "name": reg_body,
                        "abbreviation": reg_body
                    },
                    fields=["name", "abbreviation"]
                )
                doc_name = docs[0].get('name')
                filters.append([
                    "Designation Regulatory Body", 
                    "regulatory_body", 
                    "=", 
                    doc_name
                ])
            except Exception as e:
                return api_response(
                    success=False,
                    message="Sorry The provided Regulatory Body does not exist",
                    status_code=400,
                )
        
        if kwargs.get("cadre"):
            filters.append([
                "Designation Regulatory Body", 
                "cadre", 
                "=", 
                kwargs["cadre"]
            ])
        
        designations = frappe.get_all(
            "Designation",
            filters=filters,
            pluck="name"
        )
        
        return api_response(
                success=True,
                data=designations,
                status_code=200,
            )
        
    except Exception as e:
        frappe.log_error(str(e), "Fetch Designations Error")
        return api_response(
            success=False,
            message=f"Failed to fetch designations: {str(e)}",
            status_code=500,
        )
    
def get_designations_list_v2(**kwargs):
    kwargs.pop('cmd',None)
    try:
        filters = []
        # Build filters based on provided kwargs
        if kwargs.get("regulatory_body"):
            #load the Body to see if it exists
            reg_body = kwargs.get("regulatory_body")
            try:
                docs = frappe.get_all(
                    "Regulatory Body",
                    or_filters={
                        "name": reg_body,
                        "abbreviation": reg_body
                    },
                    fields=["name", "abbreviation"]
                )
                doc_name = docs[0].get('name')
                filters.append([
                    "Designation Regulatory Body", 
                    "regulatory_body", 
                    "=", 
                    doc_name
                ])
            except Exception as e:
                return api_response(
                    success=False,
                    message="Sorry The provided Regulatory Body does not exist",
                    status_code=400,
                )
        
        if kwargs.get("cadre"):
            filters.append([
                "Designation Regulatory Body", 
                "cadre", 
                "=", 
                kwargs["cadre"]
            ])
        
        if kwargs.get("is_fulltime"):
            filters.append([
                "custom_is_fulltime", 
                "=", 
               True if kwargs["is_fulltime"] in ['True','true'] else False
            ])
        
        designations = frappe.get_all(
            "Designation",
            filters=filters,
            fields=['name','custom_is_fulltime as is_fulltime']
        )
        
        return api_response(
                success=True,
                data=designations,
                status_code=200,
            )
        
    except Exception as e:
        frappe.log_error(str(e), "Fetch Designations Error")
        return api_response(
            success=False,
            message=f"Failed to fetch designations: {str(e)}",
            status_code=500,
        )
    

def trigger_hwr_update(**kwargs):
    """
    Trigger an update on hwr
    """
    try:
        kwargs.pop("cmd", None)

        # Registration number is required to identify the facility
        registration_number = kwargs.get("registration_number")
        if not registration_number:
            return api_response(
                success=False,
                message="registration_number is required",
                status_code=400,
            )

        settings = frappe.get_single("HealthPro Backend Settings")

        url = "{}{}?registration_number={}".format(
            settings.get("hie_url", None),
            settings.get("trigger_hwr_update_url", None),
            registration_number,
        )
        headers = {"Content-Type": "application/json"}
        token = generate_token()

        if token:
            headers["Authorization"] = f"Basic {token}"
        try:
            response = requests.get(url, headers=headers, timeout=10)
            result = response
            # Flatten and decode
            flat = [chr(i) for sublist in result for i in sublist]
            token_str = "".join(flat)
            frappe.log_error(
                "Updating facility on FWR Error", "API Response: {}".format(token_str)
            )
            api_resp = json.loads(token_str)

            update_status = api_resp.get("message", {}).get("success", None)
            if update_status in [True, "true"]:
                return api_response(
                    success=True,
                    message="Facility updated successfully on HWR",
                    status_code=200,
                )
            else:
                return api_response(
                    success=False,
                    message=api_resp.get("message", {}).get("error"),
                    status_code=400,
                )
        except Exception as e:
            frappe.error_log("Failed to update Facility on HWR", str(e))
            return api_response(
                success=False,
                message="Failed to update Facility on HWR",
                status_code=400,
            )

    except Exception as e:
        frappe.log_error("HWR Health Facility update failed", str(e))
        return api_response(
            success=False,
            message=f"Failed to update HWR facility: {str(e)}",
            status_code=500,
        )


def generate_token():
    settings = frappe.get_single("Healthpro Settings")
    username = settings.get("hie_username", None)
    password = settings.get_password("hie_password", None)
    token_string = f"{username}:{password}"

    token = base64.b64encode(token_string.encode("utf-8")).decode("utf-8")
    return token


def get_facility_admin_kyc(**kwargs):
    """
    API function to verify user by information from the client registry.

    Args:
        identification_type (str): Type of identification (e.g., 'National ID')
        identification_number (str): Identification number
    """
    try:
        first_name = kwargs.get("first_name")
        identification_type = kwargs.get("identification_type")
        identification_number = kwargs.get("identification_number")

        has_required_fields = (
            first_name and identification_type and identification_number
        )

        # Validate that required parameters are provided
        if not has_required_fields:
            return None, {
                "message": "Required parameters missing. Provide 'identification_type', 'identification_number' and 'first_name'",
                "status_code": 400,
            }

        # Get the full user data from client registry
        user_data, error = fetch_client_registry_user(
            identification_number=kwargs.get("identification_number"),
            identification_type=kwargs.get("identification_type"),
        )

        if error:
            return api_response(
                success=False,
                message=error.get("message"),
                status_code=error.get("status_code", 500),
            )

        user_data = user_data.get("data")
        if not user_data:
            return api_response(
                success=False, message="No user data found", status_code=404
            )

        # Verify required KYC fields
        required_kyc_fields = [
            "id", "first_name", "last_name", "phone", "email", "date_of_birth", "identification_number", "identification_type", "gender"
        ]
        
        missing_kyc_fields = []
        for kyc_field in required_kyc_fields:
            kyc_field_value = user_data.get(kyc_field)
            if not kyc_field_value:
                missing_kyc_fields.append(kyc_field)
        
        if missing_kyc_fields:
            return {
                "success": False,
                "message": "Sorry, we could not verify this user due to missing data for: {}".format(", ".join(missing_kyc_fields)),
                "status_code": 404,
            }
    
        if first_name.lower() != user_data.get("first_name").lower():
            return api_response(
                success=False,
                message="Sorry, we could not verify this user. Identifier data and names do not match.",
                status_code=404,
            )

        return api_response(success=True, data=user_data, status_code=200)

    except Exception as e:
        error_message = str(e)
        frappe.log_error(
            f"Facility Admin KYC Error: {error_message}", "Verification Error"
        )
        return api_response(
            success=False,
            message=f"Error Faility Admin KYC: {error_message}",
            status_code=500,
        )
