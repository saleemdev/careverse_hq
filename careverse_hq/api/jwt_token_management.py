import frappe
import jwt
import uuid
import datetime
from typing import Dict, Any, Optional, Tuple
from careverse_hq.api.redis_connection import RedisConnection
import json


class JWTTokenManager:
    """
    Class for managing JWT tokens with Redis storage
    """

    def __init__(self):
        """Initialize the TokenManager with settings"""
        self.settings = frappe.get_single("HealthPro Backend Settings")
        self.secret_key = self.settings.get_password("jwt_security_hash")

        self.redis = RedisConnection.get_instance()

    def generate_token(
        self,
        token_data: Dict[str, Any],
        token_type: str = "email_verification",
        expiry_hours: int = 24,
    ) -> str:
        """
        Generate a JWT verification token and store it in Redis

        Args:
            token_data: Dictionary containing data to be stored in the token
            token_type: Type of token (default: "email_verification")
            expiry_hours: Token expiry in hours (default: 24)

        Returns:
            str: Generated JWT token
        """
        try:
            # Generate unique token ID
            expiry_hours = int(expiry_hours)
            token_id = str(uuid.uuid4())

            # Set expiry time
            expiry = datetime.datetime.utcnow() + datetime.timedelta(hours=expiry_hours)
            expiry_timestamp = int(expiry.timestamp())

            # Create token payload
            payload = {
                "jti": token_id,
                "type": token_type,
                "exp": expiry_timestamp,
                "iat": int(datetime.datetime.utcnow().timestamp()),
            }

            # Merge user-provided token data
            payload.update(token_data)

            # Generate JWT
            token = jwt.encode(payload, self.secret_key, algorithm="HS256")

            # Store the token data in Redis
            redis_key = f"{token_type}:{token_id}"
            self.redis.set_value(
                key=redis_key,
                value=token_data,
                expires_in_sec=expiry_hours * 3600,  # Convert hours to seconds
            )

            return token

        except Exception as e:
            frappe.log_error(f"Token generation error: {e}", "TokenManager Error")
            return {"error": str(e)}

    def verify_token(
        self, token: str, verify_data: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Verify a JWT token and its Redis entry

        Args:
            token: JWT token to verify
            verify_data: Optional data to compare with token data

        Returns:
            Tuple of (success, message, token_data)
        """
        try:
            # Decode token without verification first to get the token ID
            try:
                unverified_payload = jwt.decode(
                    token, options={"verify_signature": False}
                )
                token_id = unverified_payload.get("jti")
                token_type = unverified_payload.get("type", "email_verification")

                if not token_id:
                    return False, "Invalid token format, no token ID", {}

            except jwt.PyJWTError:
                return False, "Invalid token format", {}

            # Check if token exists in Redis
            redis_key = f"{token_type}:{token_id}"
            frappe.logger().info(f"Looking for token with key: {redis_key}")

            stored_data = self.redis.get_value(redis_key)
            frappe.logger().info(
                f"Retrieved data type: {type(stored_data)}, value: {stored_data}"
            )

            if not stored_data:
                return False, "Token expired or invalid", {}

            # Fully verify the JWT
            try:
                payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            except jwt.ExpiredSignatureError:
                # Delete from Redis if expired
                self.redis.delete_value(redis_key)
                return False, "Token Manager - Token has expired", {}
            except jwt.PyJWTError:
                return False, "Invalid token", {}

            # If verify_data is provided, compare with stored data
            if verify_data:
                for key, value in verify_data.items():
                    if key not in stored_data or stored_data[key] != value:
                        return False, f"Token data mismatch for {key}", {}

            # Token is verified, return success
            return True, "Token verified successfully", stored_data

        except Exception as e:
            frappe.log_error(
                f"Token verification error: {str(e)}", "TokenManager Error"
            )
            return False, f"Verification error: {str(e)}", {}

    def invalidate_token(self, token: str) -> bool:
        """
        Invalidate a token by removing it from Redis

        Args:
            token: JWT token to invalidate

        Returns:
            bool: Success or failure
        """
        try:
            # Decode token without verification to get ID
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            token_id = unverified_payload.get("jti")
            token_type = unverified_payload.get("type", "email_verification")

            if not token_id:
                return False

            # Remove from Redis
            redis_key = f"{token_type}:{token_id}"
            return self.redis.delete_value(redis_key)

        except Exception as e:
            frappe.log_error(
                f"Token invalidation error: {str(e)}", "TokenManager Error"
            )
            return False


# Create an instance function that can be imported
@frappe.whitelist(allow_guest=True)
def get_token_manager() -> JWTTokenManager:
    """Get or create a TokenManager instance"""
    if not hasattr(frappe.local, "token_manager"):
        frappe.local.token_manager = JWTTokenManager()
    return frappe.local.token_manager
