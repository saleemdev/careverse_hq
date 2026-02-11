import jwt
import frappe
from datetime import datetime, timedelta
from functools import wraps
from .utils import api_response
from .encryption import SecureTransportManager
import traceback

_cryptoService = SecureTransportManager()


class WebAppAuthTokenManager:
    """Helper class for JWT token generation and validation"""

    def __init__(self):
        self.settings = frappe.get_single("HealthPro Backend Settings")

        # Validate required settings exist and are not empty
        required_settings = {
            "jwt_security_hash": "JWT Security Hash",
            "web_access_token_expiry_minutes": "Access Token Expiry (minutes)",
            "web_refresh_token_expiry_hours": "Refresh Token Expiry (hours)",
        }

        missing_settings = []

        for field_name, display_name in required_settings.items():
            value = getattr(self.settings, field_name, None)
            if not value:  # Handles None, empty string, 0
                missing_settings.append(display_name)

        if missing_settings:
            error_msg = f"Missing required JWT configuration: {', '.join(missing_settings)}. Please configure these in Settings."
            frappe.log_error(error_msg)
            frappe.throw(error_msg, frappe.ValidationError)

        # Set instance variables only after validation
        self.jwt_security_hash = self.settings.jwt_security_hash
        self.web_access_token_expiry_minutes = (
            self.settings.web_access_token_expiry_minutes
        )
        self.web_refresh_token_expiry_hours = (
            self.settings.web_refresh_token_expiry_hours
        )

    def generate_access_token(self, user_data):
        """
        Generate JWT access token with business context

        Args:
            user_data: Dict containing user information including:
                - username/email
                - organization_id and organization_name
                - roles, role_profile
                - access_scope (optional)

        Returns:
            str: JWT access token
        """
        now = datetime.now()

        if "access_scope" in user_data and user_data["access_scope"]:
            access_scope = user_data["access_scope"]
        else:
            access_scope = self._build_access_scope(user_data)

        payload = {
            "iss": "HealthPro ERP Backend",
            "sub": user_data.get("user_id"),
            "iat": int(now.timestamp()),
            "exp": int(
                (
                    now + timedelta(minutes=self.web_access_token_expiry_minutes)
                ).timestamp()
            ),
            "jti": frappe.generate_hash(length=16),
            "session_id": user_data.get("sid"),
            "user_id": user_data.get("user_id"),
            "role_profile": user_data.get("role_profile"),
            "access_scope": access_scope,
            "token_type": "access",
        }

        try:
            token = jwt.encode(payload, self.jwt_security_hash, algorithm="HS256")
            encrypted_token = _cryptoService.rsa_encrypt(token)
            return encrypted_token
        except Exception as e:
            frappe.log_error(f"Error generating access token: {str(e)}")
            frappe.throw("Failed to generate access token")

    def generate_refresh_token(self, user_data):
        """
        Generate JWT refresh token for obtaining new access tokens
        Updated to include all necessary claims for token refresh

        Args:
            user_data: Dict containing user information

        Returns:
            str: JWT refresh token
        """
        now = datetime.now()
        access_scope = self._build_access_scope(user_data)
        organization_data = user_data.get("organization", {})

        payload = {
            "iss": "HealthPro ERP Backend",
            "sub": user_data.get("user_id"),
            "iat": int(now.timestamp()),
            "exp": int(
                (now + timedelta(hours=self.web_refresh_token_expiry_hours)).timestamp()
            ),
            "jti": frappe.generate_hash(length=16),
            "session_id": user_data.get("sid"),
            "user_id": user_data.get("user_id"),
            "role_profile": user_data.get("role_profile"),
            "access_scope": access_scope,
            "token_type": "refresh",
        }

        try:
            token = jwt.encode(payload, self.jwt_security_hash, algorithm="HS256")
            encrypted_token = _cryptoService.rsa_encrypt(token)
            return encrypted_token
        except Exception as e:
            frappe.log_error(f"Error generating refresh token: {str(e)}")
            frappe.throw("Failed to generate refresh token")

    def validate_refresh_token(self, token):
        """
        Validate and decode refresh token

        Args:
            token (str): JWT refresh token

        Returns:
            dict: Status response with success, message, data, and status_code
        """
        try:
            # Decode and verify token
            decrypted_token = _cryptoService.rsa_decrypt(token).get("data")
            payload = jwt.decode(
                decrypted_token, self.jwt_security_hash, algorithms=["HS256"]
            )

            # Verify token type
            if payload.get("token_type") != "refresh":
                return {
                    "success": False,
                    "message": "Invalid token type - expected refresh token",
                    "data": None,
                    "status_code": 401,
                }

            # Verify required claims exist
            required_claims = ["sub", "user_id", "access_scope", "role_profile"]
            missing_claims = [
                claim for claim in required_claims if claim not in payload
            ]
            if missing_claims:
                return {
                    "success": False,
                    "message": f"Token missing required claims: {', '.join(missing_claims)}",
                    "data": None,
                    "status_code": 401,
                }

            return {
                "success": True,
                "message": "Refresh token validated successfully",
                "data": payload,
                "status_code": 200,
            }

        except jwt.ExpiredSignatureError:
            frappe.log_error("Refresh token expired")
            return {
                "success": False,
                "message": "Refresh token has expired",
                "data": None,
                "status_code": 401,
            }
        except jwt.InvalidTokenError as e:
            frappe.log_error(f"Invalid refresh token: {str(e)}")
            return {
                "success": False,
                "message": "Invalid refresh token format or signature",
                "data": None,
                "status_code": 401,
            }
        except Exception as e:
            frappe.log_error(f"Error validating refresh token: {str(e)}")
            return {
                "success": False,
                "message": "Internal error validating token",
                "data": None,
                "status_code": 500,
            }

    def validate_access_token(self, token):
        """
        Validate and decode access token

        Args:
            token (str): JWT access token

        Returns:
            dict: Status response with success, message, data, and status_code
            Format: {
                "success": True/False,
                "message": "Error description",
                "data": token_payload or None,
                "status_code": HTTP status code
            }
        """
        try:
            # Decode and verify token
            decrypted_token = _cryptoService.rsa_decrypt(token).get("data")
            payload = jwt.decode(
                decrypted_token, self.jwt_security_hash, algorithms=["HS256"]
            )

            # Verify token type
            if payload.get("token_type") != "access":
                return {
                    "success": False,
                    "message": "Invalid token type - expected access token",
                    "data": None,
                    "status_code": 401,
                }

            # Verify required claims exist
            required_claims = ["sub", "user_id", "access_scope", "role_profile"]
            missing_claims = [
                claim for claim in required_claims if claim not in payload
            ]
            if missing_claims:
                return {
                    "success": False,
                    "message": f"Token missing required claims: {', '.join(missing_claims)}",
                    "data": None,
                    "status_code": 401,
                }

            return {
                "success": True,
                "message": "Token validated successfully",
                "data": payload,
                "status_code": 200,
            }

        except jwt.ExpiredSignatureError:
            frappe.log_error("Access token expired")
            return {
                "success": False,
                "message": "Access token has expired",
                "data": None,
                "status_code": 401,
            }
        except jwt.InvalidTokenError as e:
            frappe.log_error(f"Invalid access token: {str(e)}")
            return {
                "success": False,
                "message": "Invalid access token format or signature",
                "data": None,
                "status_code": 401,
            }
        except Exception as e:
            frappe.log_error(f"Error validating access token: {str(e)}")
            return {
                "success": False,
                "message": "Internal error validating token",
                "data": None,
                "status_code": 500,
            }

    def _build_access_scope(self, user_data):
        """
        Build access scope based on user's role profile and organization assignment
        """
        role_profile = user_data.get("role_profile")
        roles = user_data.get("roles", [])
        organization = user_data.get("organization", {})

        access_scope = {
            "level": None,
            "organization": None,
            "region": None,
            "facilities": None,
            "supplier_id": None,
            "practitioner_id": None,
            "org_company_id": None,
            "region_company_id": None,
        }

        # Check if user has organization details
        has_organization = bool(organization)

        if role_profile == "DHA Agent" or "DHA Agent" in roles:
            access_scope.update(
                {
                    "level": "national",
                    "organization": "all",
                    "region": "all",
                    "facilities": "all",
                }
            )

        elif role_profile == "Supplier" or "Supplier" in roles:
            supplier_id = self._get_supplier_id_for_user(user_data)
            access_scope.update(
                {
                    "level": "supplier",
                    "organization": "all",
                    "region": "all",
                    "facilities": "all",
                    "supplier_id": supplier_id,
                }
            )

        elif role_profile in ["Organization Owner", "Organization Admin"] or any(
            role in ["Organization Owner", "Organization Admin"] for role in roles
        ):
            if has_organization:

                org_company_id = organization.get("org_company_id")
                if not org_company_id:
                    frappe.throw(
                        "Organization company is missing.", frappe.ValidationError
                    )

                access_scope.update(
                    {
                        "level": "organization",
                        "organization": organization.get("organization_id"),
                        "region": "all",
                        "facilities": "all",
                        "org_company_id": org_company_id,
                    }
                )

        elif role_profile in ["Regional Administrator", "Regional Admin"] or any(
            role in ["Regional Administrator", "Regional Admin"] for role in roles
        ):
            if has_organization:

                org_company_id = organization.get("org_company_id")
                if not org_company_id:
                    frappe.throw(
                        "Organization company is missing.", frappe.ValidationError
                    )

                region_company_id = organization.get("region_company_id")
                if not region_company_id:
                    frappe.throw(
                        "Organization region company is missing.",
                        frappe.ValidationError,
                    )

                access_scope.update(
                    {
                        "level": "region",
                        "organization": organization.get("organization_id"),
                        "region": organization.get("organization_region"),
                        "facilities": "all",
                        "org_company_id": org_company_id,
                        "region_company_id": region_company_id,
                    }
                )

        elif role_profile in [
            "Facility Admin",
            "Facility Administrator",
        ] or any(
            role in ["Facility Admin", "Facility Administrator"] for role in roles
        ):
            if has_organization:
                facilities = frappe.get_list(
                    "Health Facility",
                    {"facility_administrator": user_data.get("user_id")},
                )
                access_scope.update(
                    {
                        "level": "facility",
                        "organization": organization.get("organization_id"),
                        "region": "all",
                        "facilities": [facility["name"] for facility in facilities],
                    }
                )

        elif role_profile == "Facility Owner" or any(
            role in ["Facility Owner"] for role in roles
        ):
            facilities = frappe.get_list(
                "Health Facility", {"facility_owner": user_data.get("user_id")}
            )
            access_scope.update(
                {
                    "level": "facility",
                    "user_id": user_data.get("user_id"),
                    "organization": (
                        organization.get("organization_id") if organization else None
                    ),
                    "region": "all",
                    "facilities": [facility["name"] for facility in facilities],
                }
            )

        elif role_profile in ["Health Practitioner", "Health Professional"] or any(
            role in ["Health Practitioner", "Health Professional"] for role in roles
        ):
            try:
                practitioner_id = self._get_practitioner_id_for_user(
                    user_data.get("user_id")
                )

            except Exception as e:
                frappe.log_error(
                    "Access Scope Error",
                    f"Error getting practitioner ID: {str(e)}",
                )
                practitioner_id = None

            try:
                facilities = self._fetch_practitioner_facilities(
                    user_data.get("user_id")
                )
            except Exception as e:
                frappe.log_error(
                    f"Error fetching facilities", f"Access Scope Error: {str(e)}"
                )
                facilities = []

            access_scope.update(
                {
                    "level": "facility",
                    "facilities": facilities,
                    "practitioner_id": practitioner_id,
                    "organization": (
                        organization.get("organization_id") if organization else "all"
                    ),
                    "region": "all",
                }
            )

        else:
            # Add debugging for unmatched conditions
            frappe.log_error(
                "Access Scope Debug",
                f"No condition matched for role_profile: '{role_profile}', roles: {roles}",
            )

        return access_scope

    def _get_supplier_id_for_user(self, user_data):
        """Query Supplier doctype to get supplier ID for a portal user"""
        user_id = user_data.get("user_id")
        if not user_id:
            return None

        try:
            if not frappe.db.exists("User", user_id):
                return None

            # Query for supplier portal user
            supplier_id = frappe.db.get_value(
                "Portal User", {"user": user_id, "parenttype": "Supplier"}, "parent"
            )

            return supplier_id

        except Exception as e:
            frappe.log_error(f"Error getting supplier ID for user {user_id}: {str(e)}")
            return None

    def _get_practitioner_id_for_user(self, user_id):
        """Query Health Practitioner doctype"""
        practitioner_id = frappe.db.get_value("Health Professional", {"user": user_id})
        return practitioner_id

    def _fetch_practitioner_facilities(self, user_id):
        affiliations = frappe.get_list(
            "Facility Affiliation",
            filters={"user": user_id},
            fields=["health_facility"],
        )
        return [affiliation.health_facility for affiliation in affiliations]


def require_auth(roles=[]):
    """
    Decorator for API endpoints that require JWT authentication

    Validates:
    1. Frappe session (SID cookie) - user is logged into Frappe
    2. JWT access token - valid, not expired, proper signature
    3. Cross-validation - JWT subject matches Frappe session user

    Sets frappe.local.jwt_payload for use in decorated function
    """

    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            try:
                # Check if frappe.local exists and is properly initialized
                if not hasattr(frappe, "local") or frappe.local is None:
                    frappe.response["message"] = "Server initialization error"
                    frappe.response["success"] = False
                    frappe.response["status_code"] = 500
                    return

                # Initialize response if it doesn't exist
                if (
                    not hasattr(frappe.local, "response")
                    or frappe.local.response is None
                ):
                    frappe.local.response = {}

                # Extract JWT token from Authorization header
                auth_header = frappe.get_request_header("x-access-token", "")

                if not auth_header or not auth_header.startswith("Bearer "):
                    frappe.local.response.update(
                        {
                            "success": False,
                            "message": "Access token required - missing x-access-token header",
                            "status_code": 401,
                        }
                    )
                    return

                access_token = auth_header.split(" ")[1]

                token_manager = WebAppAuthTokenManager()
                validation_result = token_manager.validate_access_token(access_token)

                if not validation_result.get("success", False):
                    frappe.local.response.update(
                        {
                            "success": False,
                            "message": validation_result.get(
                                "message", "Token validation failed"
                            ),
                            "status_code": validation_result.get("status_code", 401),
                        }
                    )
                    return

                token_payload = validation_result.get("data")
                if not token_payload:
                    frappe.local.response.update(
                        {
                            "success": False,
                            "message": "Invalid token payload",
                            "status_code": 401,
                        }
                    )
                    return

                # Cross-validate JWT subject with Frappe session user
                jwt_user = token_payload.get("user_id")

                # Check if frappe.session exists
                if not hasattr(frappe, "session") or frappe.session is None:
                    frappe.local.response.update(
                        {
                            "success": False,
                            "message": "Session not available",
                            "status_code": 500,
                        }
                    )
                    return

                session_user = getattr(frappe.session, "user", None)

                if jwt_user != session_user:
                    frappe.log_error(
                        f"JWT user mismatch: JWT={jwt_user}, Session={session_user}"
                    )
                    frappe.local.response.update(
                        {
                            "success": False,
                            "message": "Token user mismatch",
                            "status_code": 403,
                        }
                    )
                    return

                # Check user Role Profile/Role
                if roles:
                    role_profile = token_payload.get("role_profile")
                    user_roles = frappe.get_roles(session_user)
                    if not (
                        role_profile in roles
                        or any(role in user_roles for role in roles)
                    ):
                        frappe.local.response.update(
                            {
                                "success": False,
                                "message": "Unauthorized. You are not allowed to perform this action",
                                "status_code": 403,
                            }
                        )
                        return

                # Store token payload in frappe.local for use in API function
                frappe.local.jwt_payload = token_payload

                # Call the original function
                return f(*args, **kwargs)

            except Exception as e:
                frappe.log_error(f"JWT authentication error in {f.__name__}: {str(e)}")

                try:
                    frappe.local.response.update(
                        {
                            "success": False,
                            "message": "Authentication error occurred",
                            "status_code": 500,
                        }
                    )
                except:
                    frappe.response = {
                        "success": False,
                        "message": "Critical authentication error",
                        "status_code": 500,
                    }
                return

        return wrapper

    return decorator


def generate_tokens_for_user(user_data):
    """
    Helper function to generate both access and refresh tokens

    Args:
        user_data: Dict with user info (username, organization_id, organization_name, roles, etc.)

    Returns:
        dict: Contains access_token and refresh_token
    """
    token_manager = WebAppAuthTokenManager()

    access_token = token_manager.generate_access_token(user_data)
    refresh_token = token_manager.generate_refresh_token(user_data)

    return {"access_token": access_token, "refresh_token": refresh_token}


# API Endpoint for Token Refresh
@frappe.whitelist(allow_guest=True, methods=["POST"])
def refresh_access_token():
    """
    API endpoint to refresh access token using refresh token

    Expected request body:
    {
        "refresh_token": "jwt_refresh_token_here"
    }

    Returns:
    {
        "success": True/False,
        "message": "Description",
        "data": {
            "access_token": "new_jwt_access_token",
            "expires_in": 3600  # seconds
        },
        "status_code": 200
    }
    """
    try:
        # Get request data
        data = frappe.local.form_dict
        refresh_token = data.get("refresh_token")

        if not refresh_token:
            frappe.local.response["http_status_code"] = 400
            return {
                "success": False,
                "message": "Refresh token is required",
                "data": None,
                "status_code": 400,
            }

        # Initialize token manager
        token_manager = WebAppAuthTokenManager()

        # Validate refresh token
        validation_result = token_manager.validate_refresh_token(refresh_token)

        if not validation_result["success"]:
            frappe.local.response["http_status_code"] = validation_result["status_code"]
            return validation_result

        # Extract user data from refresh token payload
        refresh_payload = validation_result["data"]

        # Reuse the existing access_scope instead of rebuilding it
        user_data = {
            "user_id": refresh_payload.get("user_id"),
            "role_profile": refresh_payload.get("role_profile"),
            "sid": refresh_payload.get("session_id"),
            "access_scope": refresh_payload.get("access_scope"),
        }

        new_access_token = token_manager.generate_access_token(user_data)

        # Return success response
        return api_response(
            success=True,
            message="Access token refreshed successfully",
            data={
                "access_token": new_access_token,
                "expires_in": f"{token_manager.web_access_token_expiry_minutes * 60} seconds",
            },
            status_code=200,
        )

    except frappe.ValidationError as e:
        frappe.log_error(f"Validation error in refresh_access_token API: {str(e)}")
        return api_response(
            success=False,
            message="Access Token Generation Failed",
            data=None,
            status_code=400,
        )

    except Exception as e:
        frappe.log_error(f"Error in refresh_access_token API: {str(e)}")
        return api_response(
            success=False,
            message="Access Token Generation Failed: Internal server error",
            data=None,
            status_code=500,
        )


@frappe.whitelist()
@require_auth
def get_user_requests():
    """
    Example API that gets requests filtered by user and organization
    """
    try:
        token_data = frappe.local.jwt_payload

        username = token_data.get("username")
        org_id = token_data.get("organization", {}).get("id")
        # return token_data

        # Build filters using token data
        filters = {"requested_by": username}
        if org_id:
            filters["organization"] = org_id

        # Frappe automatically applies RBAC permissions on top of these filters
        requests = frappe.get_list(
            "Request", filters=filters, fields=["name", "subject", "status", "creation"]
        )

        return api_response(success=True, data={"requests": requests}, status_code=200)

    except Exception as e:
        frappe.log_error(f"Error fetching requests: {str(e)}")
        return api_response(
            success=False, message="Error fetching requests", status_code=500
        )


@frappe.whitelist(allow_guest=True)
@require_auth
def get_organization_patients():
    """
    Another example - get patients for user's organization
    """
    try:
        token_data = frappe.local.jwt_payload
        org_id = token_data.get("organization", {}).get("id")

        # Fast organization filtering from token
        patients = frappe.get_list(
            "Patient",
            filters={"organization": org_id},
            fields=["name", "patient_name", "mobile"],
        )

        return api_response(success=True, data={"patients": patients}, status_code=200)

    except Exception as e:
        frappe.log_error(f"Error fetching patients: {str(e)}")
        return api_response(
            success=False, message="Error fetching patients", status_code=500
        )
