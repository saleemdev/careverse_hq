import frappe
from frappe import _
from .utils import *
from .encryption import SecureTransportManager
from .user_authentication_token_manager import WebAppAuthTokenManager
from .hie_settings import HIE
from .user_authentication import Auth
from careverse_hq.api.healthpro_mobile_app.mobile_app_login import cr_login_validate_otp

_cryptoService = SecureTransportManager()
_hie = HIE()
_auth = Auth()

@frappe.whitelist(allow_guest=True)
def authenticate_user(**kwargs):
        """Verify OTP and complete login process"""
        
        # Step 0: Check response encryption requirements
        settings = frappe.get_doc("HealthPro Backend Settings")
        encrypt_web_login_response = settings.get("encrypt_web_login_response")

        if encrypt_web_login_response == True:
            agent = frappe.get_request_header("X-HIE-AGENT")

            if not agent:
                return api_response(
                    success=False,
                    message="X-HIE-AGENT header is required for encryption",
                    status_code=400,
                )
                
        kwargs.pop("cmd", None)
        req_data = kwargs
        
        # Step 1: Validate Input
        required_data = ["otp", "otp_record", "agent", "encrypted_pin", "identification_type", "identification_number"]
        missing_data = [
            field for field in required_data if not req_data.get(field)
        ]

        if missing_data:
            return api_response(
                success=False,
                message=f"Missing required fields: {', '.join(missing_data)}",
                status_code=400,
            )
        
        # Step 2: Verify OTP with CR
        # Call the internal validation function
        response_data, error = cr_login_validate_otp(
            agent=req_data.get("agent"),
            otp_record=req_data.get("otp_record"),
            otp=req_data.get("otp"),
            encrypted_pin=req_data.get("encrypted_pin"),
        )

        # Handle error cases (both HTTP errors and 200 with error status)
        if error:
            return api_response(
                success=False,
                message=f"CR Error: {error.get('message')}",
                status_code=error.get("status_code", 500),
            )

        # OTP validation successful, now authenticate the user in Frappe
        if not response_data:
            return api_response(
                success=False,
                message="CR Error: OTP validation failed - no response data received",
                status_code=500,
            )
            
        # Step 3: Fetch Full User Profile from CR
        # Get the full user data from client registry
        user_data, error = fetch_client_registry_user(
            identification_number=req_data.get("identification_number"),
            identification_type=req_data.get("identification_type"),
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
                success=False, message="No user data found on CR", status_code=404
            )
            
        # Step 4: Check if User Exists in Health BE and active
        username = user_data.get("email")
        try:
            user = frappe.get_doc("User", username)
        except frappe.DoesNotExistError:
            return api_response(
                success=False,
                message="This account is not registered",
                status_code=403,
            )
        
        # Check if account is active
        if user and not user.enabled:
            return api_response(
                success=False,
                message="This account has been disabled",
                status_code=403,
            )        

        # Step 5: Complete login process by calling post_login to setup session etc
        try:
            frappe.local.login_manager.login_as(username)
            frappe.local.login_manager.post_login()

            # Get session info
            sid = frappe.session.sid
            user_details = frappe.get_doc("User", username)
            role_profile = user_details.get("role_profile_name", None)

            user_roles = frappe.get_all(
                "Has Role", filters={"parent": username}, fields=["role"]
            )
            roles = [role["role"] for role in user_roles]

            # organization lookup
            organization_user_info = frappe.db.get_value(
                "Healthcare Organization User",
                {"user": username},
                ["name", "organization", "organization_region"],
            )

            user_organization = {
                "organization_id": None,
                "organization_name": None,
                "organization_region": None,
                "org_company_id": None,
                "region_company_id": None
            }
            organization_user_id = None

            if organization_user_info:
                organization_user_id, organization_id, organization_region = (
                    organization_user_info
                )

                if organization_id:  # Make sure org exists
                    organization_info = frappe.db.get_value(
                        "Healthcare Organization",
                        organization_id,
                        ["organization_name", "company"],
                    )
                    organization_name, org_company_id = organization_info

                    region_company_id = None
                    if organization_region:
                        region_company_id = frappe.db.get_value(
                            "Healthcare Organization Region",
                            organization_region,
                            "company",
                        )

                    user_organization = {
                        "organization_id": organization_id,
                        "organization_name": organization_name,
                        "organization_region": organization_region,
                        "org_company_id": org_company_id,
                        "region_company_id": region_company_id,
                    }
            
            user_data = {
                "name": user_details.full_name,
                "email": user_details.email,
                "phone": user_details.phone or user_details.get("mobile_no"),
                "hou_id": organization_user_id,
                "user_id": user_details.name,
                "sid": sid,
                "role_profile": role_profile or None,
                "roles": roles,
                "organization": user_organization
            }

            # Count facilities if user is Facility Admin
            if role_profile in [
                "Facility Admin",
                "Facility Administrator",
            ] or any(
                role in ["Facility Admin", "Facility Administrator"] for role in roles
            ):
                facility_count = frappe.db.count(
                    "Health Facility",
                    filters={
                        "administrators_email_address": username
                    }
                )
                user_data["facility_count"] = facility_count
                
            access_token = ""
            refresh_token = ""

            try:
                # Attempt to get compliance tokens (returns None if not a Compliance User)
                compliance_data = _auth._get_compliance_tokens(user_data)

                if compliance_data:
                    access_token = compliance_data.get("access_token")
                    refresh_token = compliance_data.get("refresh_token")
                    regulatory_body = compliance_data.get("regulatory_body")

                    if not refresh_token:
                        refresh_token = None
                        frappe.logger().info(
                            f"C360 did not provide refresh_token for user {user_details.name}"
                        )

                    if regulatory_body:
                        user_data["regulator"] = regulatory_body
                else:
                    # Not a Compliance User - use local tokens
                    token_manager = WebAppAuthTokenManager()
                    access_token = token_manager.generate_access_token(user_data)
                    refresh_token = token_manager.generate_refresh_token(user_data)

            except frappe.ValidationError as ve:
                frappe.log_error(
                    title="Compliance Login Failed - Validation Error",
                    message=f"User: {username}\nError: {str(ve)}",
                )
                return api_response(
                    success=False,
                    message=str(ve),
                    status_code=400,
                )

            except frappe.DoesNotExistError as dne:
                frappe.log_error(
                    title="Compliance Login Failed - User Not Found",
                    message=f"User: {username}\nError: {str(dne)}",
                )
                return api_response(
                    success=False,
                    message=str(dne),
                    status_code=404,
                )

            except Exception as e:
                frappe.log_error(
                    title="Compliance Login Failed - Unexpected Error",
                    message=f"User: {username}\nError: {str(e)}",
                )
                return api_response(
                    success=False,
                    message="Compliance Error: An unexpected error occurred during authentication. Please try again.",
                    status_code=500,
                )
            user_data["tokens"] = {
                "access_token": access_token,
                "refresh_token": refresh_token,
            }
            user_data.pop("user_id")
            # user_data.pop("sid")
            user_data.pop("roles")

            # frappe.local.response["session_id"] = sid  # send session-id in headers

            # Initialize response data with default value
            response_data = {"user": user_data}

            # Handle encryption if required
            if encrypt_web_login_response == True:
                try:
                    encrypted_res = _cryptoService.rsa_encrypt(user_data)
                    response_data = {"user": encrypted_res}
                except Exception as e:
                    return api_response(
                        success=False,
                        message=f"Error encrypting user data: {str(e)}",
                        status_code=500,
                    )

            return api_response(
                success=True,
                message="Login successful",
                data=response_data,
                status_code=200,
            )

        except Exception as e:
            frappe.log_error(f"Error completing login: {str(e)}")
            return api_response(
                success=False,
                message="Error completing login process",
                status_code=500,
            )