import frappe
import requests
import hashlib
from urllib.parse import urljoin
from .encryption import SecureTransportManager
from .hie_settings import *
from .utils import api_response
from healthpro_erp.api.utils import (
    verify_otp,
    send_otp,
    mask_phone,
    mask_email,
    mask_name,
    fetch_client_registry_user,
    get_cr_user_contacts,
    fetch_hwr_practitioner,
    decrypt_client_registry_user,
    decrypt_request_data,
    encrypt_response_data
)
from healthpro_erp.healthpro_erp.doctype.healthcare_organization.healthcare_organization import (
    HealthcareOrganization,
)
from healthpro_erp.healthpro_erp.doctype.healthcare_organization_user.healthcare_organization_user import (
    HealthcareOrganizationUser,
)
from healthpro_erp.healthpro_erp.doctype.healthcare_organization_user_role.healthcare_organization_user_role import (
    HealthcareOrganizationUserRole,
)
from careverse_hq.api.regions import add_region_v1
from careverse_hq.api.permissions_manager import create_user_permissions_bulk
from .jwt_token_management import get_token_manager

_hie = HIE()
_cryptoService = SecureTransportManager()


@frappe.whitelist()
def verify_user_id(**kwargs):
    """
    API function to verify user by extracting phone number, email and ID
    from the client registry.

    Args:
        identification_type (str): Type of identification (e.g., 'National ID')
        identification_number (str): Identification number
    """
    try:
        # Get the full user data from client registry
        user_data, error = fetch_client_registry_user(**kwargs)

        if error:
            return api_response(
                success=False,
                message=error.get("message"),
                status_code=error.get("status_code", 500),
            )

        if not user_data:
            return api_response(
                success=False, message="No user data found", status_code=404
            )

        identification_number = kwargs.get("identification_number")
        identification_type = kwargs.get("identification_type")

        # Extract contact information
        contact_info = get_cr_user_contacts(data=user_data)
        if not contact_info.get("phone") or contact_info.get("phone") == "":
            return api_response(
                success=False,
                message="Phone number not provided. Please update your phone number on Afyayangu to continue.",
                status_code=400,
            )
        if not contact_info.get("email") or contact_info.get("email") == "":
            return api_response(
                success=False,
                message="Email not provided. Please update your email address on Afyayangu to continue.",
                status_code=400,
            )
        masked_phone = mask_phone(contact_info.get("phone"))
        masked_email = mask_email(contact_info.get("email"))
        response = {
            "phone": masked_phone,
            "email": masked_email,
            "identification_number": identification_number,
            "identification_type": identification_type,
        }

        if isinstance(contact_info, dict) and contact_info.get("status") == "error":
            return api_response(
                success=False,
                message=response,
                status_code=404,
            )

        # Add ID number to the response
        # response["id_number"] = identification_number

        return api_response(success=True, data=response, status_code=200)

    except Exception as e:
        error_message = str(e)
        frappe.log_error(
            "Verification Error", f"User Verification Error: {error_message}"
        )
        return api_response(
            success=False,
            message=f"Error verifying user: {error_message}",
            status_code=500,
        )


@frappe.whitelist()
def registration_send_otp(**kwargs):
    """
    Send an OTP to a user for verification purposes.

    Args:
        identification_type (str): Type of identification (e.g., 'National ID')
        identification_number (str): Identification number
        mode (str): How the user wants to receive the OTP ('sms', 'email', or 'whatsapp')

    Returns:
        dict: API response with success status, message, and status code
    """
    try:
        # Required parameters check
        required_fields = ["identification_type", "identification_number", "mode"]
        missing_params = [param for param in required_fields if not kwargs.get(param)]

        if missing_params:
            return api_response(
                success=False,
                message=f"Missing required parameters: {', '.join(missing_params)}",
                status_code=400,
            )

        mode = kwargs.get("mode")
        id_type = kwargs.get("identification_type")
        id_number = kwargs.get("identification_number")
        if mode.lower() not in ["sms", "email", "whatsapp"]:
            return api_response(
                success=False,
                message=f"Invalid mode: {mode}. Must be 'sms', 'email', or 'whatsapp'",
                status_code=400,
            )

        # Get the full user data from client registry
        user_data, error = fetch_client_registry_user(**kwargs)

        if error:
            return api_response(
                success=False,
                message=error.get("message"),
                status_code=error.get("status_code", 500),
            )

        if not user_data:
            return api_response(
                success=False, message="No user data found", status_code=404
            )

        # Extract contact information
        contact_info = get_cr_user_contacts(data=user_data)

        if isinstance(contact_info, dict) and contact_info.get("status") == "error":
            return api_response(
                success=False,
                message=contact_info.get("message"),
                status_code=404,
            )

        # Get contact details
        phone = contact_info.get("phone")
        email = contact_info.get("email")

        # Validate that we have the contact info for the selected mode
        if mode == "sms" and not phone:
            return api_response(
                success=False,
                message="Phone number required",
                status_code=400,
            )
        elif mode == "email" and not email:
            return api_response(
                success=False,
                message="Email required",
                status_code=400,
            )
        elif mode == "whatsapp" and not phone:
            return api_response(
                success=False,
                message="Phone number required",
                status_code=400,
            )

        # Send the OTP
        token_data = {
            "identification_type": id_type,
            "identification_number": id_number,
        }
        # Send the OTP with token data
        otp_result = send_otp(
            phone=phone, email=email, mode=mode, token_data=token_data
        )

        if otp_result.get("status") == "error":
            return api_response(
                success=False,
                message=otp_result.get("message", "Failed to send OTP"),
                status_code=500,
            )

        return api_response(
            success=True,
            message=otp_result.get("otp_record", f"OTP sent successfully via {mode}"),
            status_code=200,
        )

    except Exception as e:
        error_message = str(e)
        frappe.log_error(
            "OTP Verification Error", f"OTP Verification Error: {error_message}"
        )
        return api_response(
            success=False,
            message=f"Error sending verification OTP: {error_message}",
            status_code=500,
        )


@frappe.whitelist()
def registration_verify_otp(**kwargs):
    """
    API function to verify registration OTP.

    Args:
        otp_record (str): ID of the OTP record to verify
        otp (str): The OTP code entered by the user
        token_data (dict): Mandatory data to verify against the stored token_data

    Returns:
        Response using api_response function indicating OTP verification status
    """
    # Check if token_data is provided as it is mandatory for registration
    token_data = kwargs.get("token_data")
    if not token_data:
        return api_response(
            success=False,
            message="Missing required parameter: token_data",
            status_code=400,
        )

    # Call the verify_otp function with try-except
    try:
        result = verify_otp(**kwargs)
    except Exception as e:
        return api_response(
            success=False,
            message=f"Error verifying OTP: {str(e)}",
            status_code=500,
        )

    if result["status"] == "success":
        identification_number = token_data.get("identification_number")
        identification_type = token_data.get("identification_type")

        try:
            user_data, error = fetch_client_registry_user(
                identification_number=identification_number,
                identification_type=identification_type,
            )
        except Exception as e:
            return api_response(
                success=False,
                message=f"Error fetching user data: {str(e)}",
                status_code=500,
            )

        if error:
            return api_response(
                success=False,
                message=error.get("message", "Unknown error fetching user data"),
                status_code=error.get("status_code", 500),
            )

        if user_data:
            user_info = {}
            fields = [
                "first_name",
                "middle_name",
                "last_name",
                "gender",
                "date_of_birth",
                "phone",
                "email",
                "id",
            ]
            for field in fields:
                user_info[field] = user_data.get("data", {}).get(field)

            try:
                encrypted_user_info = _cryptoService.rsa_encrypt(user_info)
            except Exception as e:
                return api_response(
                    success=False,
                    message=f"Error encrypting user data: {str(e)}",
                    status_code=500,
                )

            message = {"is_valid": True, "data": encrypted_user_info}

            return api_response(success=True, message=message, status_code=200)
        else:
            return api_response(
                success=False, message="User data not found", status_code=404
            )
    else:
        return api_response(success=False, message=result["message"], status_code=400)


@frappe.whitelist(allow_guest=True)
def register_organization_user():
    """
    Expected JSON body:
    {
        "request_data": "encrypted_base64_string"
    }

    After decryption, the expected JSON structure is:
    {
        "user_details": {...},
        "organization_details": {...},
        "account_credentials": {...},
        "secondary_user_details": {...} // Optional
    }
    """

    try:
        request_data = frappe.request.json
        settings = frappe.get_single("HealthPro Backend Settings")
        frontend_baseurl = settings.get("frontend_baseurl")
        email_verification_expiry_hours = int(
            settings.get("email_verification_expiry_hours", 24)
        )
        sender_email = settings.get(
            "healthpro_sender_email", "healthpro@kenya-hie.health"
        )

        if not request_data:
            return api_response(
                success=False, message="No data provided", status_code=400
            )

        # Extract encrypted data
        encrypted_data = request_data.get("request_data")

        try:
            import base64

            base64.b64decode(encrypted_data)
        except Exception:
            return api_response(
                success=False,
                message="Invalid data format. Data not properly encrypted",
                status_code=400,
            )

        try:
            decrypted_request_data = _cryptoService.rsa_decrypt(encrypted_data)
            decrypted_request_data = decrypted_request_data.get("data")
        except Exception as e:
            return api_response(
                success=False,
                message=f"Error decrypting user data: {str(e)}",
                status_code=500,
            )

        # Validate payload content
        is_valid, error_message = validate_registration_payload(decrypted_request_data)
        if not is_valid:
            return api_response(
                success=False,
                message=error_message,
                status_code=400,
            )

        # Ensure roles exist
        roles_valid, roles_error = ensure_user_roles_exist(decrypted_request_data)
        if not roles_valid:
            return api_response(
                success=False,
                message=roles_error,
                status_code=400,
            )

        # Extract and validate required sections
        user_details = decrypted_request_data.get("user_details")
        org_details = decrypted_request_data.get("organization_details")
        account_credentials = decrypted_request_data.get("account_credentials")

        if not user_details or not org_details or not account_credentials:
            return api_response(
                success=False,
                message="Missing required data: user_details, organization_details, or account_credentials",
                status_code=400,
            )

        # check cr_number, confirm exists
        cr_id = user_details.get("client_registry_id")

        user_data, error = fetch_client_registry_user(cr_id=cr_id)

        if error:
            return api_response(
                success=False,
                message=error.get("message"),
                status_code=error.get("status_code", 500),
            )

        if not user_data:
            return api_response(
                success=False, message="No user data found", status_code=404
            )

        # check that username and email are the same
        email = user_details.get("email")
        username = account_credentials.get("username")
        if not email or not username:
            return api_response(
                success=False,
                message="Email and username not provided",
                status_code=400,
            )

        if email != username:
            return api_response(
                success=False,
                message="Email and username do not match",
                status_code=400,
            )

        # Begin transaction
        frappe.db.begin()

        try:
            # 1. Check if org exists, if not, create organization first (required for user)
            org_name = org_details.get("name")
            existing_orgs = frappe.get_all(
                "Healthcare Organization",
                filters={"organization_name": org_name},
                fields=["name"],
            )

            if existing_orgs:
                organization = frappe.get_doc(
                    "Healthcare Organization", existing_orgs[0].name
                )

                # Check if organization already has a company linked if not, create and link it
                if not organization.get("company"):
                    company = create_company_from_organization(org_details)
                    organization.company = company.name
                    organization.save(ignore_permissions=True)
            else:
                organization = create_organization(org_details)
                company = create_company_from_organization(org_details)
                organization.company = company.name
                organization.save(ignore_permissions=True)

            # 2. Create user
            user = create_user_account(
                account_credentials, user_details, organization.name
            )

            # 3. Create healthcare organization user and link to organization
            healthcare_user = create_healthcare_user(
                user_details, organization.name, user.name
            )

            # 4. Handle secondary user if provided
            secondary_user_data = decrypted_request_data.get("secondary_user_details")
            secondary_user = None
            if secondary_user_data:
                secondary_user = handle_secondary_user(
                    secondary_user_data=secondary_user_data,
                    organization_name=organization.name,
                    healthcare_user=healthcare_user,
                )

            # 5. Create Regions
            # Queue the region creation job
            regions = org_details.get("regions", [])
            frappe.enqueue(
                method="careverse_hq.api.user_registration.create_regions_async",
                queue="long",
                timeout=900,
                regions=regions,
                organization=organization.name,
                job_name=f"regions_creation_on_user_reg_{email}_{frappe.utils.now()}",
            )

            # Token generation for email verification
            token_manager = get_token_manager()
            token_data = {
                "email": user.email,
                "verification_type": "registration",
            }

            email_verification_token = token_manager.generate_token(
                token_data, expiry_hours=str(email_verification_expiry_hours)
            )

            email_verification_link = f"{frontend_baseurl}/email_verification?token={email_verification_token}"

            # Send verification mail
            args = {
                "subject": "HealthPro Email Verification",
                "reset_link": email_verification_link,
                "user": user.email,
                "expires_in": f"{email_verification_expiry_hours} hours",
                "token": email_verification_token,
            }

            frappe.enqueue(
                method="careverse_hq.api.utils.send_custom_email",
                queue="default",
                timeout=300,
                template_name="registration_verification",
                template_args=args,
                recipient=user.email,
                sender=sender_email,
                job_name=f"registration_verification_email_{user.email}_{frappe.utils.now()}",
            )

            # Create user permissions
            create_user_permissions_bulk(
                user=user.name,
                permissions=[
                    {
                        "doctype": "Healthcare Organization",
                        "values": [organization.name],
                    },
                    {"doctype": "Company", "values": [organization.company]},
                ],
            )

            # Prepare response data
            response_data = {
                "organization": {
                    "id": organization.name,
                    "name": organization.organization_name,
                },
                "organization user": {
                    "id": healthcare_user.name,
                    "email": user_details.get("email"),
                    "email_verification_link": email_verification_link,
                },
            }

            if secondary_user:
                response_data["secondary_user"] = {
                    "email": secondary_user_data.get("email"),
                    "message": f"Invitation successfully sent to {secondary_user_data.get('first_name')} {secondary_user_data.get('last_name')}",
                    "token": secondary_user.get("token"),
                }

            # Encrypt response
            encrypted_response = _cryptoService.rsa_encrypt(response_data)

            # Commit transaction after everything has succeeded
            frappe.db.commit()

            return api_response(
                success=True,
                data=encrypted_response,
                message="Registration successful",
                status_code=201,
            )

        except Exception as e:
            frappe.db.rollback()
            frappe.log_error("Registration Transaction Error", frappe.get_traceback())
            return api_response(
                success=False,
                message=f"Registration Failed: {str(e)}",
                status_code=500,
            )

    except Exception as e:
        frappe.log_error("Registration Request Error", frappe.get_traceback())
        return api_response(
            success=False,
            message=f"Registration Failed: {str(e)}",
            status_code=500,
        )


@frappe.whitelist(allow_guest=True)
def register_verify_email():
    token = frappe.request.args.get("token")
    email = frappe.request.args.get("email")
    token_manager = get_token_manager()

    # First verify the token without email verification
    success, message, token_data = token_manager.verify_token(token)

    if not success:
        return {"success": False, "message": message}

    # If email was provided, check if it matches
    if isinstance(token_data, str):
        token_data = json.loads(token_data)
    if email and token_data.get("email") != email:
        return {"success": False, "message": "Email mismatch in verification"}

    user_email = token_data.get("email")

    # Begin transaction
    frappe.db.savepoint("registration_email_invitation_verification")

    try:
        # Update healthcare organization user
        frappe.db.set_value(
            "Healthcare Organization User",
            {"email": user_email},
            "email_verified",
            True,
        )

        # Enable user
        frappe.db.set_value("User", user_email, "enabled", True)

        # Create employee record
        employee = create_employee_from_user(user_email)

        if not employee:
            raise ValueError("Failed to create employee record: missing required data")

        # If we got here, everything succeeded
        frappe.db.commit()

        # Invalidate token only after successful commit
        token_manager.invalidate_token(token)

        return {
            "success": True,
            "message": "Email verified and employee record created successfully",
        }

    except Exception as e:
        # Roll back all changes if any step fails
        frappe.db.rollback()
        frappe.log_error(
            "Email verification transaction failed", frappe.get_traceback()
        )

        return {
            "success": False,
            "message": f"Verification failed: {str(e)}",
        }


@frappe.whitelist(allow_guest=True)
def verify_invitation_token():
    """
    Verify if the JWT invitation token is valid
    """
    try:
        import jwt
        import hashlib
        from datetime import datetime

        token = frappe.request.args.get("token")

        if not token:
            return api_response(
                success=False, message="No token provided", status_code=400
            )

        settings = frappe.get_single("HealthPro Backend Settings")
        jwt_secret = settings.get_password("jwt_security_hash")

        if not jwt_secret:
            return api_response(
                success=False, message="Security configuration error", status_code=500
            )

        # Hash the token for efficient database lookup (token_hash field is indexed)
        token_hash = hashlib.sha256(token.encode()).hexdigest()

        invitations = frappe.get_all(
            "Healthcare Organization Invitation",
            filters={"token_hash": token_hash, "is_active": 1},
            fields=[
                "name",
                "first_name",
                "last_name",
                "email",
                "role",
                "organization",
                "status",
                "expiry",
                "token",
                "invited_by",
            ],
        )

        if not invitations:
            return api_response(
                success=False,
                message="Invitation not found or has been deactivated",
                status_code=400,
            )

        invitation = invitations[0]

        # Decode and verify JWT token
        try:
            payload = jwt.decode(invitation.token, jwt_secret, algorithms=["HS256"])
            token_data = payload.get("token_data")
        except jwt.ExpiredSignatureError:
            invitation_doc = frappe.get_doc(
                "Healthcare Organization Invitation", invitation["name"]
            )
            invitation_doc.is_active = 0
            invitation_doc.status = "Expired"
            invitation_doc.save(ignore_permissions=True)
            frappe.db.commit()
            return api_response(
                success=False, message="This invitation has expired", status_code=400
            )
        except jwt.InvalidTokenError:
            return api_response(
                success=False, message="Invalid invitation token", status_code=400
            )

        # Extract data from token
        email = token_data.get("email")
        organization_name = token_data.get("organization")
        role = token_data.get("role")

        if not email or not organization_name:
            return api_response(
                success=False, message="Invalid token data", status_code=400
            )
        if email != invitation.email:
            return api_response(
                success=False, message="Invalid token data", status_code=400
            )

        # Update status to Viewed if not already accepted
        if invitation["status"] != "Accepted":
            frappe.db.set_value(
                "Healthcare Organization Invitation",
                invitation["name"],
                "status",
                "Viewed",
            )

        # Get organization details
        organization = frappe.get_doc(
            "Healthcare Organization", invitation["organization"]
        )
        # return {"invitaion": invitation, "invited_by": invitation.invited_by}
        inviter = frappe.get_doc("Healthcare Organization User", invitation.invited_by)
        invited_by_details = {}
        if inviter:
            invited_by_details = {
                "first_name": inviter.first_name,
                "last_name": inviter.last_name,
                "email": inviter.email,
                "role": inviter.role,
                "phone_number": inviter.phone_number,
            }
        response_data = {
            "invitation": {
                "id": invitation["name"],
                "first_name": invitation["first_name"],
                "last_name": invitation["last_name"],
                "email": invitation["email"],
                "role": invitation["role"],
            },
            "organization": {
                "id": organization.name,
                "name": organization.organization_name,
                "address": organization.address,
                "phone": organization.official_phone_number,
                "email": organization.official_email,
            },
            "invited_by": invited_by_details,
        }
        try:
            encrypted_response = _cryptoService.rsa_encrypt(response_data)
        except Exception as e:
            return api_response(
                success=False,
                message=f"Error encrypting user data: {str(e)}",
                status_code=500,
            )
        return api_response(
            success=True,
            data=encrypted_response,
            message="Valid invitation token",
            status_code=200,
        )

    except Exception as e:
        frappe.log_error("Invitation Verification Error", frappe.get_traceback())
        return api_response(
            success=False,
            message=f"Error verifying invitation: {str(e)}",
            status_code=500,
        )


def create_organization(org_details):
    """Create a Healthcare Organization record"""
    return HealthcareOrganization.create(**org_details)


def create_healthcare_user(user_details, organization_name, user):
    """Create a Healthcare Organization User record"""
    user_data = user_details.copy()
    user_data["organization"] = organization_name
    user_data["user"] = user
    user_data["email_verified"] = False

    return HealthcareOrganizationUser.create(**user_data)


def create_user_account(credentials, user_details, organization_name):
    """Create a Frappe User record"""
    if not credentials.get("username") or not credentials.get("password"):
        raise ValueError("Username and password are required")

    if frappe.db.exists("User", credentials.get("username")):
        raise ValueError(f"This user already exists")

    user = frappe.get_doc(
        {
            "doctype": "User",
            "username": credentials.get("username"),
            "email": user_details.get("email"),
            "first_name": user_details.get("first_name"),
            "middle_name": user_details.get("middle_name"),
            "last_name": user_details.get("last_name"),
            "phone": user_details.get("phone_number"),
            "enabled": False,
            "send_welcome_email": 0,
            "user_type": "Website User",
        }
    )

    user.new_password = credentials.get("password")

    registering_user_role = user.get("role")
    role = user_details.get("role", registering_user_role)
    user.append("roles", {"role": role})
    user.role_profile_name = role

    user.insert(ignore_permissions=True)

    return user


def handle_secondary_user(**kwargs):
    """Create an invitation for a secondary user (admin or owner)"""
    secondary_user_data = kwargs.get("secondary_user_data")
    organization_name = kwargs.get("organization_name")
    healthcare_user = kwargs.get("healthcare_user")
    try:
        import jwt
        from datetime import datetime, timedelta

        settings = frappe.get_single("HealthPro Backend Settings")
        jwt_secret = settings.get_password("jwt_security_hash")
        sender_email = settings.get(
            "healthpro_sender_email", "healthpro@kenya-hie.health"
        )

        invitation_expiry_minutes = settings.get(
            "registration_invitation_expiry_minutes"
        )
        if not jwt_secret or not invitation_expiry_minutes:
            raise Exception(
                "Token generation failed: security hash or expiry not configured"
            )

        expiry = datetime.utcnow() + timedelta(minutes=invitation_expiry_minutes)

        role = secondary_user_data.get("role")

        # JWT Token
        token_data = {
            "email": secondary_user_data.get("email"),
            "organization": organization_name,
            "role": role,
        }

        jwt_payload = {"token_data": token_data, "exp": expiry}

        jwt_token = jwt.encode(jwt_payload, jwt_secret, algorithm="HS256")
        token_hash = hash_token(jwt_token)
        invitation = frappe.get_doc(
            {
                "doctype": "Healthcare Organization Invitation",
                "first_name": secondary_user_data.get("first_name"),
                "last_name": secondary_user_data.get("last_name"),
                "email": secondary_user_data.get("email"),
                "phone": secondary_user_data.get("phone"),
                "role": role,
                "organization": organization_name,
                "invited_by": healthcare_user.name,
                "status": "Pending",
                "is_active": 1,
                "token": jwt_token,
                "token_hash": token_hash,
                "expiry": expiry.strftime("%Y-%m-%d %H:%M:%S"),
            }
        )

        invitation.insert(ignore_permissions=True)

        # Send the invitation email
        send_invitation_email(
            invitation=invitation,
            organization_name=organization_name,
            healthcare_user=healthcare_user,
        )

        return invitation

    except Exception as e:
        frappe.log_error("Secondary User Invitation Error", frappe.get_traceback())
        raise Exception(f"Failed to create invitation: {str(e)}")


def hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()


def generate_user_identity_hash(identification_type, identification_number):
    """
    Generate a unique hash from identification type and number.

    Args:
        identification_type (str): Type of identification (e.g., "National ID", "Passport")
        identification_number (str): The identification number

    Returns:
        str: SHA256 hash of the combination
    """
    import hashlib

    # Normalize inputs (lowercase, strip whitespace)
    id_type = str(identification_type).strip().lower()
    id_number = str(identification_number).strip().lower()

    # Create composite string
    composite = f"{id_type}|{id_number}"

    # Generate SHA256 hash
    hash_object = hashlib.sha256(composite.encode("utf-8"))
    return hash_object.hexdigest()


def send_invitation_email(**kwargs):
    invitation = kwargs.get("invitation")
    organization_name = kwargs.get("organization_name")
    healthcare_user = kwargs.get("healthcare_user")
    """Send invitation email to the secondary user"""
    try:
        # Build the invitation URL with token frontend_baseurl
        settings = frappe.get_single("HealthPro Backend Settings")
        frontend_url = settings.get("frontend_url")
        sender_email = settings.get(
            "healthpro_sender_email", "healthpro@kenya-hie.health"
        )
        invitation_url = "{0}/register?token={1}".format(frontend_url, invitation.token)
        token = invitation.token
        inviter_name = "{0}".format(healthcare_user.first_name)

        # Send email
        args = {
            "subject": "Invitation to register on Healthpro as a {0} for {1}".format(
                invitation.role, organization_name
            ),
            "role": invitation.role,
            "invitation": invitation,
            "organization_name": organization_name,
            "inviter_name": inviter_name,
            "invitation_url": invitation_url,
            "expiry_date": invitation.expiry,
            "token": token,
        }

        frappe.enqueue(
            method="careverse_hq.api.utils.send_custom_email",
            queue="default",
            timeout=300,
            template_name="healthcare_organization_invitation",
            template_args=args,
            recipient=invitation.email,
            sender=sender_email,
            job_name=f"healthcare_organization_invitation_email_{invitation.email}_{frappe.utils.now()}",
        )

        # Update status to Sent
        invitation.db_set("status", "Sent")

    except Exception as e:
        frappe.log_error("Invitation Email Error", frappe.get_traceback())
        raise Exception(f"Failed to send invitation email: {str(e)}")


def validate_registration_payload(decrypted_request_data):
    """
    Validates the registration payload to ensure all required fields are present.
    Returns a tuple (is_valid, error_message).
    """
    if not decrypted_request_data:
        return False, "Empty request data"

    # Check main required sections
    required_sections = ["user_details", "organization_details", "account_credentials"]
    for section in required_sections:
        if section not in decrypted_request_data or not decrypted_request_data[section]:
            return False, f"Missing required section: {section}"

    # Validate user_details fields
    user_details = decrypted_request_data["user_details"]
    required_user_fields = [
        "role",
        "first_name",
        "last_name",
        "id_type",
        "id_number",
        "phone_number",
        "email",
        "client_registry_id",
    ]
    for field in required_user_fields:
        if field not in user_details or not user_details[field]:
            return False, f"Missing required field in user_details: {field}"

    # Validate organization_details fields
    org_details = decrypted_request_data["organization_details"]
    required_org_fields = [
        "name",
        # "address",
        # "official_phone_number",
        # "official_email",
        # "head_office",
        # "registration_number",
        "custom_has_regions",
    ]
    for field in required_org_fields:
        if field not in org_details or not org_details[field]:
            return False, f"Missing required field in organization_details: {field}"

    # Validate account_credentials fields
    credentials = decrypted_request_data["account_credentials"]
    required_credential_fields = ["username", "password"]
    for field in required_credential_fields:
        if field not in credentials or not credentials[field]:
            return False, f"Missing required field in account_credentials: {field}"

    # Check if secondary_user_details is present, and if so, validate its fields
    secondary_user = None
    secondary_email = None
    if (
        "secondary_user_details" in decrypted_request_data
        and decrypted_request_data["secondary_user_details"]
    ):
        secondary_user = decrypted_request_data["secondary_user_details"]
        required_secondary_fields = [
            "first_name",
            "last_name",
            "email",
            "phone",
            "role",
        ]
        for field in required_secondary_fields:
            if field not in secondary_user or not secondary_user[field]:
                return (
                    False,
                    f"Missing required field in secondary_user_details: {field}",
                )

        # Make sure secondary user email is different from primary user email
        primary_email = user_details.get("email")
        if secondary_user:
            secondary_email = secondary_user.get("email")

        if primary_email.lower() == secondary_email.lower():
            return (
                False,
                "Admin email must be different from your own: {}".format(primary_email),
            )

    return True, ""


def validate_user_uniqueness(user_details):
    """
    Validate that no Healthcare Organization User exists with the same identification details.

    Args:
        user_details (dict): User details containing id_type and id_number

    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    id_type = user_details.get("id_type")
    id_number = user_details.get("id_number")

    if not id_type or not id_number:
        return False, "Identification type and number are required"

    # Generate hash
    user_hash = generate_user_identity_hash(id_type, id_number)

    # Check if user with this hash already exists
    existing_user = frappe.db.exists(
        "Healthcare Organization User", {"user_identity_hash": user_hash}
    )

    if existing_user:
        return False, "A user with these identification details already exists"

    return True, None


def ensure_user_roles_exist(decrypted_request_data):
    """
    Checks if the roles specified in user_details and secondary_user_details exist.
    Creates them if they don't exist.
    """
    try:
        # Extract roles
        primary_role = decrypted_request_data.get("user_details", {}).get("role")

        # Get secondary role if it exists
        secondary_role = None
        if decrypted_request_data.get("secondary_user_details"):
            secondary_role = decrypted_request_data.get(
                "secondary_user_details", {}
            ).get("role")

        # Check and create primary & secondary role if needed
        if primary_role:
            create_frappe_role(primary_role)

        if secondary_role:
            create_frappe_role(secondary_role)

        return True, ""
    except Exception as e:
        frappe.log_error("Error ensuring user roles exist", frappe.get_traceback())
        return False, f"Failed to ensure roles exist: {str(e)}"


def create_healthcare_user_role(role_name):
    """
    Checks if a healthcare organization user role exists and creates it if it doesn't.
    """
    # Check if role exists in Healthcare Organization User Role doctype
    existing_roles = frappe.get_all(
        "Healthcare Organization User Role",
        filters={"role_name": role_name},
        fields=["name"],
    )

    # If role doesn't exist, create it
    if not existing_roles:
        description = f"Default {role_name} role created during registration"

        HealthcareOrganizationUserRole.create(
            role_name=role_name, description=description
        )
        frappe.db.commit()


def create_frappe_role(role_name):
    """
    Checks if a standard Frappe role exists and creates it if it doesn't.

    """
    if not frappe.db.exists("Role", role_name):
        role = frappe.new_doc("Role")
        role.role_name = role_name
        role.name = role_name  #

        # Optional: set other standard Role fields
        role.desk_access = 0
        role.two_factor_auth = 0

        role.insert()
        frappe.db.commit()

def validate_if_already_admin(user_details, org_details):
    # Check if user is already admin or Org has admin already
    org_name = org_details.get("name")
    role = user_details.get("role")
    first_name = user_details.get("first_name")
    
    existing_orgs = frappe.get_all(
        "Healthcare Organization",
        filters={"organization_name": org_name},
        fields=["name"],
    )

    if existing_orgs:
        already_org_has_admin = frappe.db.get_value(
            "Healthcare Organization User", {"role": role, "organization": existing_orgs[0].name}, "user"
        )   
        if already_org_has_admin:
            return False, f"{org_name} already has {role}"
            
    already_org_admin = frappe.db.get_value(
        "Healthcare Organization User", {"role": role, "user": user_details.get("email")}, "organization"
    )
    if already_org_admin:
        return False, f"{first_name} is already {role} of an organization"
        
    return True, ""

def _get_unique_abbreviation(base_abbr):
    """
    Generate unique company abbreviation by adding incremental suffix if duplicate.
    Format: BASE, BASE-001, BASE-002, etc.

    Args:
        base_abbr (str): Base abbreviation to check

    Returns:
        str: Unique abbreviation
    """
    # Check if base abbreviation is available
    if not frappe.db.exists("Company", {"abbr": base_abbr}):
        return base_abbr

    # If duplicate, add incremental suffix: -001, -002, etc.
    counter = 1
    while True:
        new_abbr = f"{base_abbr}-{counter:03d}"  # Format as 001, 002, etc.
        if not frappe.db.exists("Company", {"abbr": new_abbr}):
            return new_abbr
        counter += 1

        # Safety check to prevent infinite loop
        if counter > 999:
            frappe.throw(f"Unable to generate unique abbreviation for {base_abbr}")


def create_company_from_organization(org_details):
    """
    Create an ERPNext Company based on Healthcare Organization details

    Args:
        org_details (dict): Organization details with required fields

    Returns:
        frappe.Document: The created Company document
    """

    company_name = org_details.get("name")
    if not company_name:
        frappe.throw("Organization name is required to create a company")

    # Check if company already exists
    if frappe.db.exists("Company", {"company_name": company_name}):
        return frappe.get_doc("Company", {"company_name": company_name})

    # Generate unique abbreviation with incremental suffix if duplicate
    base_abbr = "".join(word[0].upper() for word in company_name.split())[:5]
    abbr = _get_unique_abbreviation(base_abbr)

    # Create the company doc
    company = frappe.get_doc(
        {
            "doctype": "Company",
            "company_name": company_name,
            "abbr": abbr,
            "default_currency": "KES",
            "country": "Kenya",
            # "create_chart_of_accounts_based_on": "Standard Template",
            "domain": "Services",
            "enable_perpetual_inventory": 0,
            "is_group": 1,
            "custom_has_regions": org_details.get("custom_has_regions"),
            # Map additional fields from organization
            "phone_no": org_details.get("official_phone_number"),
            "email": org_details.get("official_email"),
            "registration_details": org_details.get("registration_number", ""),
            "parent_company": org_details.get("parent_company", ""),
            "website": org_details.get("website", ""),
        }
    )

    company.insert(ignore_permissions=True)

    return company


def create_employee_from_user(user_email):
    """
    Create an employee record for a user after email verification

    Args:
        user_email (str): Email of the verified user

    Returns:
        frappe.Document: The created Employee document
    """
    # Step 1: Get the user document
    user = frappe.get_doc("User", user_email)

    # Step 2: Get the Healthcare Organization User document
    healthcare_user = frappe.get_all(
        "Healthcare Organization User",
        filters={"user": user_email},
        fields=["*"],
        limit=1,
    )

    if not healthcare_user:
        frappe.log_error(
            "Employee Creation Error",
            f"No Healthcare Organization User found for {user_email}",
        )
        return None

    healthcare_user = healthcare_user[0]

    # Step 3: Get the organization and company
    organization_name = healthcare_user.get("organization")
    if not organization_name:
        frappe.log_error(
            "Employee Creation Error",
            f"No organization linked to Healthcare Organization User {healthcare_user.name}",
        )
        return None

    organization = frappe.get_doc("Healthcare Organization", organization_name)
    company_name = organization.get("company")

    if not company_name:
        frappe.log_error(
            "Employee Creation Error",
            f"No company linked to organization {organization_name}",
        )
        return None

    # Step 4: Check if employee already exists
    existing_employee = frappe.db.exists("Employee", {"user_id": user_email})
    if existing_employee:
        return frappe.get_doc("Employee", existing_employee)

    # Step 5: Create the employee
    employee = frappe.get_doc(
        {
            "doctype": "Employee",
            "first_name": healthcare_user.get("first_name"),
            "middle_name": healthcare_user.get("middle_name") or "",
            "last_name": healthcare_user.get("last_name"),
            "gender": healthcare_user.get("gender"),
            "date_of_birth": healthcare_user.get("date_of_birth"),
            "employee_name": f"{healthcare_user.get('first_name')} {healthcare_user.get('last_name')}",
            "user_id": user_email,
            "company": company_name,
            "status": "Active",
            "date_of_joining": frappe.utils.today(),
            "cell_number": healthcare_user.get("phone_number"),
            "personal_email": user_email,
            "company_email": user_email,
            # Add the correct identification fields
            "custom_identification_type": healthcare_user.get("identification_type"),
            "custom_identification_number": healthcare_user.get(
                "identification_number"
            ),
            "designation": healthcare_user.get("role"),
            "create_user_permission": 0,
        }
    )

    employee.insert(ignore_permissions=True)

    # Link employee to healthcare user if field exists
    if frappe.get_meta("Healthcare Organization User").has_field("employee"):
        frappe.db.set_value(
            "Healthcare Organization User",
            healthcare_user.get("name"),
            "employee",
            employee.name,
        )

    return employee


def create_regions_sync(regions, organization):
    """
    Create region records synchronously (fast operation).
    Company creation is deferred to after_save or async job.

    Args:
        regions (list): List of region names
        organization (str): Parent organization name

    Returns:
        list: List of created region names
    """
    created_regions = []

    for region_name in regions:
        try:
            # Check if region already exists for this organization
            # Now uses unique_identifier which combines both fields
            import hashlib

            composite = f"{organization}_{region_name}"
            unique_id = hashlib.md5(composite.encode()).hexdigest()

            region_exists = frappe.db.exists(
                "Healthcare Organization Region",
                {"unique_identifier": unique_id},
            )

            if region_exists:
                frappe.log_error(
                    "Skipping Region already exists",
                    f"Region '{region_name}' already exists for organization '{organization}'",
                )
                continue

            # Create region WITHOUT company (skip company creation in before_save)
            h_region = frappe.new_doc("Healthcare Organization Region")
            h_region.region_name = region_name
            h_region.parent_organization = organization

            # Set flag to skip synchronous company creation in before_save
            h_region._skip_company_creation = True

            h_region.insert(ignore_permissions=True)

            created_regions.append(h_region.name)
            frappe.log_error(
                "Region Creation Debug",
                f"Region created: {h_region.name} (company will be created async)",
            )

        except Exception as e:
            frappe.log_error(
                "Region Creation Error",
                f"Failed to create region '{region_name}': {str(e)}\n{frappe.get_traceback()}",
            )

    return created_regions


def create_region_companies_async(region_names, user_id=None):
    """
    Background job to create companies for regions SEQUENTIALLY.
    This prevents database lock contention on the parent company's nested set fields.

    Process:
    1. Receives all regions for a user
    2. Creates companies one-by-one in the same worker
    3. Updates region.company field after each creation
    4. Expects No lock contention because only ONE worker processes all regions sequentially

    Args:
        region_names (list or str): List of Healthcare Organization Region names, or single region name
    """

    # Handle both single string and list of strings
    if isinstance(region_names, str):
        region_names = [region_names]

    frappe.log_error("Region Company Debug", f"Processing {len(region_names)} regions")

    success_count = 0
    failed_count = 0
    failed_regions = []

    for region_name in region_names:
        try:
            # Get the region document
            region_doc = frappe.get_doc("Healthcare Organization Region", region_name)
            parent_org = frappe.get_doc(
                "Healthcare Organization", region_doc.parent_organization
            )

            if not parent_org.company:
                frappe.log_error(
                    "Region Company Creation Error",
                    f"Parent organization '{parent_org.name}' has no company. Cannot create region company.",
                )
                continue

            parent_company = frappe.get_doc("Company", parent_org.company)

            # Create company name
            company_name = f"{parent_company.company_name} - {region_doc.region_name}"

            # Check if company already exists
            if frappe.db.exists("Company", company_name):
                frappe.db.set_value(
                    "Healthcare Organization Region",
                    region_name,
                    "company",
                    company_name,
                )
                frappe.db.commit()
                continue

            # Generate abbreviation
            from healthpro_erp.healthpro_erp.doctype.healthcare_organization_region.healthcare_organization_region import (
                _generate_region_company_abbreviation,
            )

            abbr = _generate_region_company_abbreviation(
                parent_company.company_name, region_doc.region_name
            )
            frappe.log_error("Region Company Debug", f"Generated abbreviation: {abbr}")

            # Create the company
            frappe.log_error("Region Company Debug", f"Creating company document...")
            new_company = frappe.get_doc(
                {
                    "doctype": "Company",
                    "company_name": company_name,
                    "abbr": abbr,
                    "country": "Kenya",
                    "default_currency": "KES",
                    "parent_company": parent_org.company,
                    "custom_company_type": "Region",
                }
            )

            frappe.log_error("Region Company Debug", f"Inserting company...")
            new_company.insert(ignore_permissions=True)
            frappe.db.commit()

            # Update region with company name
            frappe.db.set_value(
                "Healthcare Organization Region",
                region_name,
                "company",
                new_company.name,
            )
            frappe.db.commit()

            frappe.log_error(
                "Region Company Creation - Success",
                f"✅ Company '{company_name}' created and linked to region '{region_name}'",
            )
            success_count += 1
            
            # The async job needs the User to exist in DB before creating permissions
            if new_company and user_id:
                create_user_permissions_bulk(
                    user=user_id,
                    permissions=[
                        {"doctype": "Company", "values": [new_company.name]},
                    ],
                )
                frappe.log_error(
                    "Region Company User Permission - Creation Started",
                    f"✅ Company: '{company_name}', User: '{user_id}'",
                )

        except Exception as e:
            frappe.log_error(
                "Region Company Creation - Error",
                f"❌ Failed to create company for region '{region_name}': {str(e)}\n{frappe.get_traceback()}",
            )
            failed_count += 1
            failed_regions.append({"region": region_name, "error": str(e)})

    # Log summary
    frappe.log_error(
        "Region Company Creation - Summary",
        f"Completed processing {len(region_names)} regions\n"
        f"✅ Success: {success_count}\n"
        f"❌ Failed: {failed_count}\n"
        f"Failed regions: {failed_regions if failed_regions else 'None'}",
    )

# ============================================================================
# V2 ASYNC REGISTRATION FUNCTIONS
# ============================================================================


def send_registration_failure_email(email, error_message, user_name=None):
    """
    Send email notification when registration fails
    Called from background job, so executes synchronously.

    Args:
        email (str): User's email address
        error_message (str): Error message to include (sanitized)
        user_name (str, optional): User's full name or first name
    """
    try:
        from careverse_hq.api.utils import send_custom_email

        settings = frappe.get_single("HealthPro Backend Settings")
        support_email = settings.get("support_email", "support@healthpro.ke")
        sender_email = settings.get(
            "healthpro_sender_email", "healthpro@kenya-hie.health"
        )

        # Sanitize error message - don't expose technical details
        error_summary = "We encountered a technical issue while creating your account."
        if "already exists" in error_message.lower():
            error_summary = "An account with this information already exists."
        elif "duplicate" in error_message.lower():
            error_summary = "This registration appears to be a duplicate."

        args = {
            "subject": "HealthPro Registration - Action Required",
            "user": user_name or email,  # Use name if provided, fallback to email
            "error_summary": error_summary,
            "support_email": support_email,
        }

        # Call synchronously - we're already in a background job
        result = send_custom_email(
            template_name="registration_failure",
            template_args=args,
            recipient=email,
            sender=sender_email,
        )

        if result.get("success"):
            frappe.log_error(
                "Email Debug", f"Registration failure email sent to {email}"
            )
        else:
            frappe.log_error("Email Error", f"Failed to send failure email to {email}")

    except Exception as e:
        frappe.log_error(
            "Failure Email Error", f"Failed to send failure email to {email}: {str(e)}"
        )


def send_registration_success_email(
    email, verification_link, expiry_hours, email_verification_token, user_name=None
):
    """
    Send email notification when registration succeeds
    Called from background job, so executes synchronously.

    Args:
        email (str): User's email address
        verification_link (str): Email verification link
        expiry_hours (int): Hours until link expires
        email_verification_token (str): Verification token
        user_name (str, optional): User's full name or first name
    """
    try:
        from careverse_hq.api.utils import send_custom_email

        settings = frappe.get_single("HealthPro Backend Settings")
        support_email = settings.get("support_email", "support@healthpro.ke")
        sender_email = settings.get(
            "healthpro_sender_email", "healthpro@kenya-hie.health"
        )

        args = {
            "subject": "Welcome to HealthPro - Verify Your Email",
            "user": user_name or email,  # Use name if provided, fallback to email
            "verification_link": verification_link,
            "expires_in": f"{expiry_hours} hours",
            "support_email": support_email,
            "token": email_verification_token,
        }

        # Call synchronously - we're already in a background job
        result = send_custom_email(
            template_name="registration_success",
            template_args=args,
            recipient=email,
            sender=sender_email,
        )

        if result.get("success"):
            frappe.log_error(
                "Email Debug", f"Registration success email sent to {email}"
            )
        else:
            frappe.log_error("Email Error", f"Failed to send success email to {email}")

    except Exception as e:
        frappe.log_error(
            "Success Email Error", f"Failed to send success email to {email}: {str(e)}"
        )


def process_organization_registration_async(
    request_id,
    user_details,
    org_details,
    account_credentials,
    secondary_user_details=None,
):
    """
    Background job to process organization registration.
    All operations wrapped in transaction with rollback on failure.

    Args:
        request_id (str): Organization User Registration Request ID
        user_details (dict): User information
        org_details (dict): Organization information
        account_credentials (dict): Account credentials
        secondary_user_details (dict, optional): Secondary user information
    """
    try:
        # Update status to Processing
        registration_request = frappe.get_doc(
            "Organization User Registration Request", request_id
        )
        registration_request.status = "Processing"
        registration_request.save(ignore_permissions=True)
        frappe.db.commit()

        frappe.log_error(
            "Registration Debug",
            f"Starting async registration for request {request_id}",
        )

        # Get settings
        settings = frappe.get_single("HealthPro Backend Settings")
        frontend_baseurl = settings.get("frontend_baseurl")
        email_verification_expiry_hours = int(
            settings.get("email_verification_expiry_hours", 24)
        )

        # BEGIN TRANSACTION
        # frappe.db.begin()

        try:
            # 1. Create or get organization
            org_name = org_details.get("name")
            existing_orgs = frappe.get_all(
                "Healthcare Organization",
                filters={"organization_name": org_name},
                fields=["name"],
            )

            if existing_orgs:
                organization = frappe.get_doc(
                    "Healthcare Organization", existing_orgs[0].name
                )
                # Check if organization already has a company linked if not, create and link it
                if not organization.get("company"):
                    company = create_company_from_organization(org_details)
                    organization.company = company.name
                    organization.save(ignore_permissions=True)
            else:
                organization = create_organization(org_details)
                company = create_company_from_organization(org_details)
                organization.company = company.name
                organization.save(ignore_permissions=True)

            frappe.log_error(
                "Registration Debug",
                f"Organization created/retrieved: {organization.name}",
            )

            # 2. Create user account
            user = create_user_account(
                account_credentials, user_details, organization.name
            )

            frappe.log_error("Registration Debug", f"User account created: {user.name}")

            # 3. Create healthcare organization user
            healthcare_user = create_healthcare_user(
                user_details, organization.name, user.name
            )

            frappe.log_error(
                "Registration Debug", f"Healthcare user created: {healthcare_user.name}"
            )

            # 4. Handle secondary user if provided
            secondary_user = None
            if secondary_user_details:
                secondary_user = handle_secondary_user(
                    secondary_user_data=secondary_user_details,
                    organization_name=organization.name,
                    healthcare_user=healthcare_user,
                )
                frappe.log_error("Registration Debug", f"Secondary user handled")

            # 5. Create regions synchronously (fast - just records, no companies)
            regions = org_details.get("regions", [])
            created_region_names = []
            if regions:
                try:
                    created_region_names = create_regions_sync(
                        regions, organization.name
                    )
                    frappe.log_error(
                        "Registration Debug",
                        f"Created {len(created_region_names)} region records (companies will be created async)",
                    )
                except Exception as e:
                    # Log but don't fail registration - regions are optional
                    frappe.log_error(
                        "Region Creation Warning",
                        f"Region creation failed but registration continues: {str(e)}\n{frappe.get_traceback()}",
                    )
                    frappe.logger().warning(
                        f"Region creation failed for {user.email}, but registration will continue"
                    )

            # 6. Enqueue company creation for regions (slow operation - async)
            if created_region_names:
                frappe.enqueue(
                    method="careverse_hq.api.user_registration.create_region_companies_async",
                    queue="long",
                    timeout=1800,  # 30 minutes for company creation
                    region_names=created_region_names,
                    user_id=user.name,
                    job_name=f"region_companies_{organization.name}_{frappe.utils.now()}",
                )
                frappe.log_error(
                    "Registration Debug",
                    f"Enqueued company creation job for {len(created_region_names)} regions",
                )

            # 7. Generate email verification token
            token_manager = get_token_manager()
            token_data = {"email": user.email, "verification_type": "registration"}
            email_verification_token = token_manager.generate_token(
                token_data, expiry_hours=str(email_verification_expiry_hours)
            )
            email_verification_link = f"{frontend_baseurl}/email_verification?token={email_verification_token}"

            frappe.log_error(
                "Registration Debug", f"Email verification token generated"
            )

            # COMMIT TRANSACTION - All records created successfully
            frappe.db.commit()

            frappe.log_error(
                "Registration Debug",
                f"Transaction committed successfully for {user.email}",
            )

            # 8. Create user permissions (AFTER commit to avoid race condition)
            # The async job needs the User to exist in DB before creating permissions
            create_user_permissions_bulk(
                user=user.name,
                permissions=[
                    {
                        "doctype": "Healthcare Organization",
                        "values": [organization.name],
                    },
                    {"doctype": "Company", "values": [organization.company]},
                ],
            )

            frappe.log_error("Registration Debug", f"User permissions job enqueued")

            # 9. Update registration request to Completed
            registration_request.status = "Completed"
            registration_request.completed_at = frappe.utils.now()
            registration_request.organization_id = organization.name
            registration_request.user_id = user.name
            registration_request.save(ignore_permissions=True)
            frappe.db.commit()

            # 10. Send success email (after commit)
            # Use user's full name or first name for personalization
            user_display_name = user.first_name
            send_registration_success_email(
                user.email,
                email_verification_link,
                email_verification_expiry_hours,
                email_verification_token,
                user_name=user_display_name,
            )

            frappe.log_error(
                "Registration Debug",
                f"Registration completed successfully for {user.email}",
            )

        except Exception as e:
            # ROLLBACK TRANSACTION
            frappe.db.rollback()

            frappe.log_error(
                "Registration Debug", f"Registration transaction failed: {str(e)}"
            )

            # Update registration request to Failed
            registration_request.reload()
            registration_request.status = "Failed"
            registration_request.error_message = str(e)
            registration_request.save(ignore_permissions=True)
            frappe.db.commit()

            # Send failure email
            # Try to get user's name from user_details for personalization
            user_display_name = None
            if user_details:
                first_name = user_details.get("first_name")
                last_name = user_details.get("last_name")
                if first_name and last_name:
                    user_display_name = f"{first_name} {last_name}"
                elif first_name:
                    user_display_name = first_name

            send_registration_failure_email(
                user_details.get("email"), str(e), user_name=user_display_name
            )

            frappe.log_error(
                "Registration Transaction Error Async", frappe.get_traceback()
            )
            raise

    except Exception as e:
        frappe.log_error("Registration Async Job Error", frappe.get_traceback())
        raise


@frappe.whitelist(allow_guest=True)
def register_organization_user_v2():
    """
    V2: Async registration - validates and enqueues background job.
    Returns immediately with 200 Accepted status.

    Expected JSON body:
    {
        "request_data": "encrypted_base64_string"
    }

    After decryption, the expected JSON structure is:
    {
        "user_details": {...},
        "organization_details": {...},
        "account_credentials": {...},
        "secondary_user_details": {...} // Optional
    }

    Returns:
        200 Accepted with request_id for tracking
    """
    try:
        request_data = frappe.request.json
        settings = frappe.get_single("HealthPro Backend Settings")

        if not request_data:
            return api_response(
                success=False, message="No data provided", status_code=400
            )

        # Extract encrypted data
        encrypted_data = request_data.get("request_data")

        try:
            import base64

            base64.b64decode(encrypted_data)
        except Exception:
            return api_response(
                success=False,
                message="Invalid data format. Data not properly encrypted",
                status_code=400,
            )

        try:
            decrypted_request_data = _cryptoService.rsa_decrypt(encrypted_data)
            decrypted_request_data = decrypted_request_data.get("data")
        except Exception as e:
            return api_response(
                success=False,
                message=f"Error decrypting user data: {str(e)}",
                status_code=500,
            )

        # Validate payload content
        is_valid, error_message = validate_registration_payload(decrypted_request_data)
        if not is_valid:
            return api_response(
                success=False,
                message=error_message,
                status_code=400,
            )

        # Validate user uniqueness (check for duplicate identification)
        user_details = decrypted_request_data.get("user_details")
        is_unique, uniqueness_error = validate_user_uniqueness(user_details)
        if not is_unique:
            return api_response(
                success=False,
                message=uniqueness_error,
                status_code=400,
            )

        # Ensure roles exist
        roles_valid, roles_error = ensure_user_roles_exist(decrypted_request_data)
        if not roles_valid:
            return api_response(
                success=False,
                message=roles_error,
                status_code=400,
            )

        # Extract and validate required sections
        user_details = decrypted_request_data.get("user_details")
        org_details = decrypted_request_data.get("organization_details")
        account_credentials = decrypted_request_data.get("account_credentials")

        if not user_details or not org_details or not account_credentials:
            return api_response(
                success=False,
                message="Missing required data: user_details, organization_details, or account_credentials",
                status_code=400,
            )

        # Check CR number, confirm exists
        cr_id = user_details.get("client_registry_id")
        user_data, error = fetch_client_registry_user(cr_id=cr_id)

        if error:
            return api_response(
                success=False,
                message=error.get("message"),
                status_code=error.get("status_code", 500),
            )

        if not user_data:
            return api_response(
                success=False,
                message="No record found for this user on the Client Registry. Please check your details and try again.",
                status_code=404,
            )

        # Check that username and email are the same
        email = user_details.get("email")
        username = account_credentials.get("username")
        if not email or not username:
            return api_response(
                success=False,
                message="Email and username not provided",
                status_code=400,
            )

        if email.lower() != username.lower():
            return api_response(
                success=False,
                message="Email and username do not match",
                status_code=400,
            )

        # Validate user if already admin or Organization has admin already
        is_valid, error = validate_if_already_admin(user_details, org_details)
        if not is_valid:
            return api_response(
                success=False,
                message=error,
                status_code=400,
            )
            
        # CRITICAL: Check for duplicate user (prevent duplicate processing)
        if frappe.db.exists("User", email):
            return api_response(
                success=False,
                message="Sorry, a user with these details already exists. Please try again with different details.",
                status_code=409,
            )

        # Create Registration Request tracking record
        org_name = org_details.get("name")
        registration_request = frappe.get_doc(
            {
                "doctype": "Organization User Registration Request",
                "email": email,
                "organization_name": org_name,
                "status": "Pending",
                "request_data_json": frappe.as_json(decrypted_request_data),
            }
        )
        registration_request.insert(ignore_permissions=True)
        frappe.db.commit()

        frappe.log_error(
            "Registration Debug",
            f"Registration request created: {registration_request.name}",
        )

        # Enqueue background job with Administrator context
        frappe.enqueue(
            method="careverse_hq.api.user_registration.process_organization_registration_async",
            queue="long",
            timeout=900,
            request_id=registration_request.name,
            user_details=user_details,
            org_details=org_details,
            account_credentials=account_credentials,
            secondary_user_details=decrypted_request_data.get("secondary_user_details"),
            job_name=f"org_registration_{email}_{frappe.utils.now()}",
        )

        frappe.log_error("Registration Debug", f"Background job enqueued for {email}")

        # Build response data
        response_data = {
            "request_id": registration_request.name,
            "email": email,
        }

        # Check if response should be encrypted
        encrypt_response = settings.get("encrypt_registration_response", 1)
        encrypted_response = None
        if encrypt_response:
            try:
                encrypted_response = _cryptoService.rsa_encrypt(response_data)
            except Exception as e:
                return api_response(
                    success=False,
                    message=f"Error encrypting response data: {str(e)}",
                    status_code=500,
                )
        return api_response(
            success=True,
            data=encrypted_response if encrypt_response else response_data,
            message="Your registration request has been submitted successfully. Please check your email for a confirmation message.",
            status_code=201,
        )

    except Exception as e:
        frappe.log_error("Registration Request Error V2", frappe.get_traceback())
        return api_response(
            success=False, message=f"Registration Failed: {str(e)}", status_code=500
        )


@frappe.whitelist()
def migrate_user_identity_hashes():
    """
    Migration script to populate user_identity_hash for existing Healthcare Organization Users.
    Can be called via API to update all records.

    Requires: System Manager role

    Returns:
        dict: Summary of migration results
    """
    # Check permissions
    if not frappe.has_permission("Healthcare Organization User", "write"):
        frappe.throw("Insufficient permissions. System Manager role required.")

    try:
        # Get all Healthcare Organization Users without user_identity_hash
        users = frappe.get_all(
            "Healthcare Organization User",
            filters=[["user_identity_hash", "in", ["", None]]],
            fields=["name", "identification_type", "identification_number"],
        )

        updated_count = 0
        error_count = 0
        errors = []

        for user in users:
            try:
                # Generate hash
                user_hash = generate_user_identity_hash(
                    user.identification_type, user.identification_number
                )

                # Update record
                frappe.db.set_value(
                    "Healthcare Organization User",
                    user.name,
                    "user_identity_hash",
                    user_hash,
                    update_modified=False,
                )

                updated_count += 1

            except Exception as e:
                error_count += 1
                errors.append({"user": user.name, "error": str(e)})
                frappe.log_error(
                    f"Migration Error for {user.name}", frappe.get_traceback()
                )

        # Commit changes
        frappe.db.commit()

        return {
            "success": True,
            "message": f"Migration completed. Updated {updated_count} records.",
            "total_users": len(users),
            "updated_count": updated_count,
            "error_count": error_count,
            "errors": errors,
        }

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error("User Identity Hash Migration Failed", frappe.get_traceback())
        return {"success": False, "message": f"Migration failed: {str(e)}"}
