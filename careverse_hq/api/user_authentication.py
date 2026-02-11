import frappe
from frappe import _
import json
import requests
import jwt
import uuid
from datetime import datetime, timedelta
from careverse_hq.api.redis_connection import RedisConnection
from .utils import *
from .encryption import SecureTransportManager
from .user_authentication_token_manager import WebAppAuthTokenManager
from .user_authentication_token_manager import require_auth
from .auth_token_blacklist_manager import TokenBlacklistManager
from .hie_settings import HIE
from careverse_hq.api.healthpro_mobile_app.mobile_app_login import (
    cr_login_validate_otp,
)

_cryptoService = SecureTransportManager()
_hie = HIE()


class Auth:
    def __init__(self):
        self.settings = frappe.get_single("HealthPro Backend Settings")
        self.jwt_security_hash = self.settings.jwt_security_hash
        self.allowed_login_attempts = self.settings.allowed_login_attempts
        self.lockout_period_seconds = self.settings.lockout_period_seconds
        self.password_reset_expiry_seconds = self.settings.password_reset_expiry_seconds
        self.frontend_baseurl = self.settings.frontend_baseurl

    def initiate_login(self, username, password, otp_mode=None):
        """Handle first step of login (username/password) and send OTP"""
        # Check if account is locked due to too many failed attempts
        if self._is_account_locked(username):
            return api_response(
                success=False,
                message="Account temporarily locked due to too many failed attempts",
                status_code=429,  # Too Many Requests
            )

        # Check if account is active
        user_status = frappe.db.get_value("User", username, "enabled")
        if not user_status:
            return api_response(
                success=False,
                message="This account does not exist or has been disabled",
                status_code=403,
            )

        # Verify credentials without creating a full session
        try:
            frappe.local.login_manager.authenticate(username, password)
        except Exception as e:
            self._increment_failed_attempts(username)
            return api_response(
                success=False,
                message="Authentication Failed. Username and password do not match.",
                status_code=401,
            )

        # Get user's phone number
        user_data = frappe.get_all(
            "User",
            filters={"username": username},
            fields=["phone", "email"],
            limit_page_length=1,
        )

        if not user_data:
            return api_response(
                success=False,
                message="User Not Found",
                status_code=404,
            )

        phone = user_data[0].get("phone")
        if not phone:
            return api_response(
                success=False,
                message="Phone number not found in user profile",
                status_code=400,
            )

        email = user_data[0].get("email")
        if not email:
            return api_response(
                success=False,
                message="Email not found in user profile",
                status_code=400,
            )

        # Mask phone number for response
        masked_phone = mask_phone(phone)
        masked_email = mask_email(email)

        # Send OTP
        if otp_mode:
            otp_result = send_otp(
                phone=phone,
                email=email,
                mode=otp_mode,
                token_data={"username": username},
            )

            if otp_result.get("status") != "success":
                return api_response(
                    success=False,
                    message=f"Unable to send OTP: {otp_result.get('message', 'Unknown error')}",
                    status_code=500,
                )

            # Return success without session info
            otp_response = otp_result.get("otp_record", {})
            otp_record = otp_response.get("otp_record")
            return api_response(
                success=True,
                message="Authentication Successful. OTP sent successfully",
                data={
                    "phone": masked_phone,
                    "otp_record": otp_record,
                },
                status_code=200,
            )

        return api_response(
            success=True,
            message="Authentication Successful",
            data={
                "phone": masked_phone,
                "email": masked_email,
            },
            status_code=200,
        )

    def complete_login(self, **kwargs):
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

        otp = kwargs.get("otp")
        otp_record = kwargs.get("otp_record")
        username = kwargs.get("username")

        if not otp_record or not otp or not username:
            return api_response(
                success=False,
                message="OTP, OTP record  and username are required",
                status_code=400,
            )

        # Verify the OTP with token_data for verification
        verification_result = verify_otp(
            otp_record=otp_record, otp=otp, token_data={"username": username}
        )

        if verification_result.get("status") != "success":
            return api_response(
                success=False,
                message=verification_result.get("message"),
                status_code=401,
            )

        # Complete login process by calling post_login to setup session etc
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

            user_organization = {}
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
                "organization": user_organization,
            }

            access_token = ""
            refresh_token = ""

            try:
                # Attempt to get compliance tokens (returns None if not a Compliance User)
                compliance_data = self._get_compliance_tokens(user_data)

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

    def _is_account_locked(self, username):
        """Check if account is locked due to too many failed attempts"""
        redis_conn = RedisConnection.get_instance()

        key = f"login_failed:{username}"
        failed_attempts = redis_conn.get_value(key)

        # Check if attempts exist and exceed the threshold
        if failed_attempts and int(failed_attempts) >= self.allowed_login_attempts:
            return True
        return False

    def _increment_failed_attempts(self, username):
        """Track failed login attempts"""
        redis_conn = RedisConnection.get_instance()

        key = f"login_failed:{username}"
        # Get current value
        current_attempts = redis_conn.get_value(key, 0)

        # Increment and store back
        new_attempts = int(current_attempts) + 1

        # Set with expiration time
        redis_conn.set_value(
            key, new_attempts, expires_in_sec=self.lockout_period_seconds
        )

    def _reset_failed_attempts(self, username):
        """Reset failed attempts counter after successful login"""
        redis_conn = RedisConnection.get_instance()

        key = f"login_failed:{username}"
        redis_conn.delete_value(key)

    def debug_login_attempts(self, username):
        """Debug function to check login attempts in Redis"""
        redis_conn = RedisConnection.get_instance()
        key = f"login_failed:{username}"

        attempts = redis_conn.get_value(key, 0)
        ttl = redis_conn.get_client().ttl(key)

        frappe.logger().info(
            f"User: {username}, Failed attempts: {attempts}, TTL: {ttl}s"
        )
        return {
            "username": username,
            "attempts": attempts,
            "ttl_seconds": ttl,
            "lockout_threshold": self.allowed_login_attempts,
        }

    def initiate_password_reset(self, username):
        """Initiate the password reset process"""
        # Check if user exists with this username
        if not frappe.db.exists("User", {"username": username}):
            return api_response(
                success=False,
                message="No user found with this username",
                status_code=404,
            )

        username = frappe.db.get_value("User", {"email": username}, "name")

        # Generate a unique reset token
        reset_token = str(uuid.uuid4())

        # Store token in Redis with expiry
        redis_conn = RedisConnection.get_instance()
        redis_conn.set_value(
            f"pwd_reset:{reset_token}",
            username,
            expires_in_sec=self.password_reset_expiry_seconds,
        )

        # Get the reset link pointing to FE
        # reset_link = f"{self.frontend_baseurl}/reset-password?token={reset_token}"
        reset_link = (
            f"{self.frontend_baseurl}/validate-password-token?token={reset_token}"
        )
        # reset_link = f"{self.frontend_baseurl}/reset-password"
        if not self.password_reset_expiry_seconds is None:
            expiry_minutes = 30
        else:
            expiry_minutes = int(self.password_reset_expiry_seconds // 60)

        expiry_minutes = min(expiry_minutes, 60)
        # "reset_link": reset_link,
        # Send Password Reset mail
        args = {
            "subject": "HealthPro Account Password Reset",
            "reset_link": reset_link,
            "reset_token": reset_token,
            "user": username,
            "expires_in": f"{expiry_minutes} minutes",
        }

        # Send reset email using mail template
        try:

            frappe.enqueue(
                method="careverse_hq.api.utils.send_custom_email",
                queue="default",
                timeout=300,
                template_name="forgot_password",
                template_args=args,
                recipient=username,
                sender="healthpro@kenya-hie.health",
                job_name=f"forgot_password_email_{username}_{frappe.utils.now()}",
            )

        except Exception as e:
            frappe.log_error(
                message=f"Failed to send password reset email to {username}: {str(e)}",
                title="Password Reset Email Failed",
            )
            return api_response(
                success=False,
                message="Failed to send password reset email. Please try again later.",
                status_code=500,
            )

        return api_response(
            success=True,
            message=f"A password reset link has been sent to your email address.",
            status_code=200,
        )

    def complete_password_reset(self, token, new_password):
        """Complete the password reset process"""
        redis_conn = RedisConnection.get_instance()

        # Validate token
        username = redis_conn.get_value(f"pwd_reset:{token}")
        if not username:
            return api_response(
                success=False, message="Invalid or expired reset token", status_code=400
            )

        # Check if user exists
        if not frappe.db.exists("User", username):
            return api_response(
                success=False, message="User no longer exists", status_code=404
            )

        # Validate password strength
        try:
            self._validate_password_strength(new_password)
        except Exception as e:
            return api_response(success=False, message=str(e), status_code=400)

        # Update the password
        try:
            user = frappe.get_doc("User", username)
            user.new_password = new_password
            user.save()

            # Delete the used token
            redis_conn.delete_value(f"pwd_reset:{token}")

            frappe.log_error(
                message=f"Password reset completed successfully for user: {username}",
                title="Password Reset Completed",
            )

            return api_response(
                success=True,
                message="Your password has been reset successfully. You can now log in with your new password.",
                status_code=200,
            )
        except Exception as e:
            frappe.log_error(f"Password reset error for {username}: {str(e)}")
            return api_response(
                success=False,
                message="An error occurred while resetting your password",
                status_code=500,
            )

    def _validate_password_strength(self, password):
        """Validate password meets strength requirements"""
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")

        # Check for uppercase, lowercase, number, and special character
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(not c.isalnum() for c in password)

        if not (has_upper and has_lower and has_digit and has_special):
            raise ValueError(
                "Password must contain at least one uppercase letter, one lowercase letter, "
                "one number, and one special character"
            )

        # Check if password matches common passwords list (if available)
        common_passwords = self._get_common_passwords()
        if password.lower() in common_passwords:
            raise ValueError("Password is too common or easily guessable")

    def _get_common_passwords(self):
        """Get list of common passwords to prevent"""
        # Or load from file or db
        return [
            "password",
            "12345678",
            "qwerty",
            "admin123",
            "welcome",
            "password123",
            "123456789",
            "letmein",
        ]

    def _get_compliance_tokens(self, user_data):
        """
        Get compliance tokens from C360 for Compliance Users

        Args:
            user_data (dict): User data containing roles, email, user_id, phone

        Returns:
            dict: {
                "access_token": str,
                "refresh_token": str or None,
                "regulatory_body": str or None
            } or None if not a Compliance User

        Raises:
            frappe.ValidationError: For 400 errors (missing parameters)
            frappe.DoesNotExistError: For 404 errors (user not found)
            Exception: For 500 errors or network issues
        """
        settings = frappe.get_single("HealthPro Backend Settings")
        roles = user_data.get("roles", [])

        # Only call C360 for Compliance Users
        if "Compliance User" not in roles:
            return None

        try:
            base_url = settings.get("hie_url")
            c360_login_uri = settings.get("c360_login_uri")

            if not base_url or not c360_login_uri:
                frappe.log_error(
                    title="Compliance Configuration Error",
                    message="hie_base_url or c360_login_uri not configured in HealthPro Backend Settings",
                )
                raise frappe.ValidationError(
                    "Compliance Error: System configuration incomplete. Please contact administrator."
                )

            token = _hie.generate_jwt_token()

            # Prepare request
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": f"Bearer {token}",
            }

            # Prepare payload - send user_id (username), email, and phone
            payload = {
                "user_id": user_data.get("user_id"),  # username
                "email": user_data.get("email"),
                "phone": user_data.get("phone"),
            }

            # Make API call
            url = f"{base_url}{c360_login_uri}"
            response = requests.post(
                url=url,
                headers=headers,
                json=payload,
                timeout=10,
            )
            if response.status_code == 404:
                frappe.log_error(
                    title="C360 User Not Found",
                    message=f"User not found in C360: {json.dumps(response_data)}",
                )
                raise frappe.DoesNotExistError("User not found in C360")
            response_data = {}
            try:
                response_data = response.json()
            except Exception as e:
                print(e)
                raise Exception(
                    "Compliance Error: Invalid response from compliance system"
                )

            if response.status_code == 200:
                data = response_data.get("data", {})
                access_token = data.get("access_token")
                refresh_token = data.get("refresh_token")
                regulatory_body = data.get("regulatory_body")

                if not access_token:
                    frappe.log_error(
                        title="Compliance Token Missing",
                        message=f"C360 response missing token: {json.dumps(response_data)}",
                    )
                    raise Exception(
                        "Compliance Error: Invalid response from compliance system"
                    )

                return {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "regulatory_body": regulatory_body,
                }

            else:
                response_json = response.json()
                frappe.log_error(
                    title="C360 Error",
                    message=f"Status: {response.status_code}\nResponse: {json.dumps(response_json, indent=2)}",
                )
                raise Exception(f"Compliance Error: {response_json}")

        except requests.exceptions.RequestException as e:
            frappe.log_error(title="C360 Network Error", message=str(e))
            raise Exception("Compliance Error: Network error. Please try again later.")

        except Exception as e:
            frappe.log_error(title="C360 Error", message=str(e))
            raise


@frappe.whitelist(allow_guest=True)
def initiate_login():
    try:
        encrypted_data = frappe.request.get_json()
        try:
            response = _cryptoService.rsa_decrypt(encrypted_data.get("data"))
            decrypted_data = response.get("data")
        except Exception as e:
            return api_response(
                success=False,
                message=f"Error encrypting user data: {str(e)}",
                status_code=500,
            )

        username = decrypted_data.get("username")
        password = decrypted_data.get("password")
        otp_mode = decrypted_data.get("mode")

        if not username or not password:
            api_response(
                success=False,
                message=f"Username and password are required",
                status_code=500,
            )

        _auth = Auth()
        res = _auth.initiate_login(username, password, otp_mode)
        return res
    except Exception as e:
        frappe.log_error(f"Login API error: {str(e)}")
        return api_response(
            success=False,
            message=f"Internal server error: {str(e)}",
            status_code=500,
        )


@frappe.whitelist(allow_guest=True)
def complete_login():
    try:
        encrypted_data = frappe.request.get_json()
        try:
            response = _cryptoService.rsa_decrypt(encrypted_data.get("data"))
            decrypted_data = response.get("data")
        except Exception as e:
            return api_response(
                success=False,
                message=f"Error encrypting user data: {str(e)}",
                status_code=500,
            )

        otp = decrypted_data.get("otp")
        otp_record = decrypted_data.get("otp_record")
        username = decrypted_data.get("username")

        required_data = ["otp", "otp_record", "username"]
        missing_data = [
            field for field in required_data if not decrypted_data.get(field)
        ]

        if missing_data:
            return api_response(
                success=False,
                message=f"Missing required fields: {', '.join(missing_data)}",
                status_code=400,
            )

        _auth = Auth()
        res = _auth.complete_login(otp=otp, otp_record=otp_record, username=username)
        return res
    except Exception as e:
        frappe.log_error(f"Login API error: {str(e)}")
        return api_response(
            success=False,
            message=f"Internal server error: {str(e)}",
            status_code=500,
        )


@frappe.whitelist()
def logout():
    """Handle user logout and invalidate session"""
    try:
        # Get the current user before logging out
        user = frappe.session.user

        # Use Frappe's built-in logout function to invalidate the session
        frappe.local.login_manager.logout()

        # Clear any cookies
        if hasattr(frappe.response, "delete_cookie") and callable(
            frappe.response.delete_cookie
        ):
            frappe.response.delete_cookie("sid")

        return api_response(
            success=True,
            message="Logged out successfully",
            status_code=200,
        )
    except Exception as e:
        frappe.log_error(f"Error during logout: {str(e)}")
        return api_response(
            success=False,
            message="Error processing logout request",
            status_code=500,
        )


@frappe.whitelist()
@require_auth
def logout_with_blacklist():
    """Handle user logout and invalidate session with robust error recovery"""
    token_data = frappe.local.jwt_payload
    try:
        # Get critical data FIRST
        user = frappe.session.user
        access_token = (
            frappe.get_request_header("x-access-token", "")
            .replace("Bearer ", "")
            .strip()
        )
        refresh_token = (frappe.local.form_dict.get("refresh_token") or "").strip()

        # Validate tokens exist
        if not (access_token and refresh_token):
            return api_response(
                success=False,
                message="Both access and refresh tokens required",
                status_code=400,
            )

        try:
            _blacklist_manager = TokenBlacklistManager()
            _blacklist_manager.revoke_multiple_tokens(
                [access_token, refresh_token], reason="user_logout", revoked_by=user
            )
        except Exception as e:
            frappe.log_error(
                title="Token Blacklist Failed",
                message=f"User {user}: {str(e)}",
            )

        # Invalidate session
        frappe.local.login_manager.logout()

        # Clear any cookies
        if hasattr(frappe.response, "delete_cookie") and callable(
            frappe.response.delete_cookie
        ):
            frappe.response.delete_cookie("sid")

        return api_response(
            success=True,
            message="Logged out successfully",
            status_code=200,
        )

    except Exception as e:
        frappe.log_error(
            title="Logout Process Failure",
            message=f"User {user}: {str(e)}",
        )
        return api_response(
            success=False,
            message="Logout could not be completed",
            status_code=500,
        )


@frappe.whitelist(allow_guest=True)
def forgot_password():
    """API endpoint to initiate password reset"""
    try:
        data = frappe.request.get_json()
        username = data.get("username")
        if not username:
            return api_response(
                success=False,
                message="Username is required",
                status_code=400,
            )

        _auth = Auth()

        return _auth.initiate_password_reset(username)

    except Exception as e:
        frappe.log_error(f"Forgot password API error: {str(e)}")
        return api_response(
            success=False,
            message=f"Internal server error: {str(e)}",
            status_code=500,
        )


@frappe.whitelist(allow_guest=True)
def validate_password_reset_token():
    """API endpoint to validate reset token before showing the password form"""
    try:
        token = frappe.request.args.get("token")

        if not token:
            return api_response(
                success=False,
                message="Reset token is required",
                status_code=400,
            )

        # Check if token exists in Redis and hasn't expired
        redis_conn = RedisConnection.get_instance()
        username = redis_conn.get_value(f"pwd_reset:{token}")

        if not username:
            return api_response(
                success=False,
                message="Invalid or expired reset token",
                status_code=400,
            )

        return api_response(
            success=True,
            message="Token is valid",
            data={"username": username},
            status_code=200,
        )
    except Exception as e:
        frappe.log_error(f"Token validation error: {str(e)}")
        return api_response(
            success=False,
            message="Error validating token",
            status_code=500,
        )


@frappe.whitelist(allow_guest=True)
def reset_password():
    """API endpoint to complete password reset"""
    try:
        encrypted_data = frappe.request.get_json()
        try:
            response = _cryptoService.rsa_decrypt(encrypted_data.get("data"))
            decrypted_data = response.get("data")
        except Exception as e:
            return api_response(
                success=False,
                message=f"Error decrypting data: {str(e)}",
                status_code=500,
            )

        token = decrypted_data.get("token")
        new_password = decrypted_data.get("new_password")

        if not token or not new_password:
            return api_response(
                success=False,
                message="Reset token and new password are required",
                status_code=400,
            )

        _auth = Auth()
        return _auth.complete_password_reset(token, new_password)
    except Exception as e:
        frappe.log_error(f"Reset password API error: {str(e)}")
        return api_response(
            success=False,
            message=f"Internal server error: {str(e)}",
            status_code=500,
        )


@frappe.whitelist(allow_guest=True)
def local_encrypt_data(**kwargs):
    return _cryptoService.rsa_encrypt(kwargs)


@frappe.whitelist(allow_guest=True)
def local_decrypt_data(**kwargs):
    encrypted_data = frappe.request.get_json()
    response = _cryptoService.rsa_decrypt(encrypted_data.get("data"))
    return response
