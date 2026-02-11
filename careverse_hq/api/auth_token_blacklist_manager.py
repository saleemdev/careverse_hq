import json
import time
from datetime import datetime, timedelta
import frappe
from frappe import _
from .redis_connection import RedisConnection
from .encryption import SecureTransportManager


class TokenBlacklistManager:
    """
    Manages JWT token blacklisting using Redis for high-performance lookups.
    Handles token revocation, validation, and automatic cleanup.
    """

    def __init__(self):
        """Initialize blacklist manager with Redis connection"""
        try:

            self.redis_conn = RedisConnection.get_instance()
            self.redis_client = self.redis_conn.get_client()
            self.crypto_service = SecureTransportManager()

            # Clock skew buffer to handle time differences between servers
            self.CLOCK_SKEW_BUFFER = 30  # seconds

            # Test Redis connection
            self._test_redis_connection()

        except Exception as e:
            frappe.log_error(f"Failed to initialize TokenBlacklistManager: {str(e)}")
            frappe.throw("Blacklist service unavailable - cannot authenticate users")

    def _test_redis_connection(self):
        """Test Redis connection and fail fast if unavailable"""
        try:
            # Simple ping test
            test_key = f"blacklist:health_check:{int(time.time())}"
            self.redis_conn.set_value(test_key, "ok", expires_in_sec=5)
            self.redis_conn.delete_value(test_key)
        except Exception as e:
            frappe.log_error(f"Redis connection test failed: {str(e)}")
            raise frappe.ValidationError("Redis - Blacklist service unavailable")

    def _extract_jti_from_encrypted_token(self, encrypted_token):
        """
        Extract JTI from encrypted token without full validation

        Args:
            encrypted_token (str): Encrypted JWT token

        Returns:
            str: JTI value or None if extraction fails
        """
        try:
            # Decrypt token
            decrypted_token = self.crypto_service.rsa_decrypt(encrypted_token).get(
                "data"
            )
            if not decrypted_token:
                return None  # why none?

            # Decode JWT without verification (just to extract JTI)
            import jwt

            unverified_payload = jwt.decode(
                decrypted_token,
                options={"verify_signature": False, "verify_exp": False},
            )

            return unverified_payload.get("jti")

        except Exception as e:
            frappe.log_error(f"Failed to extract JTI from encrypted token: {str(e)}")
            return None

    def _extract_email_from_encrypted_token(self, encrypted_token):
        """
        Extract JTI from encrypted token without full validation

        Args:
            encrypted_token (str): Encrypted JWT token

        Returns:
            str: JTI value or None if extraction fails
        """
        try:
            # Decrypt token
            decrypted_token = self.crypto_service.rsa_decrypt(encrypted_token).get(
                "data"
            )
            if not decrypted_token:
                return None  # why none?

            # Decode JWT without verification (just to extract JTI)
            import jwt

            unverified_payload = jwt.decode(
                decrypted_token,
                options={"verify_signature": False, "verify_exp": False},
            )

            return unverified_payload.get("email")

        except Exception as e:
            frappe.log_error(f"Failed to extract email from encrypted token: {str(e)}")
            return None

    def revoke_token(self, encrypted_token, reason="manual", revoked_by=None):
        """
        Revoke a single token by adding it to blacklist

        Args:
            encrypted_token (str): Encrypted JWT token to revoke
            reason (str): Reason for revocation (logout, password_change, admin_action, etc.)
            revoked_by (str): User ID who initiated the revocation

        Returns:
            dict: Success/failure status
        """
        try:
            # Extract JTI from encrypted token
            jti = self._extract_jti_from_encrypted_token(encrypted_token)
            if not jti:
                return {
                    "success": False,
                    "message": "Invalid token - cannot extract JTI",
                }

            # Get token expiry time for TTL calculation
            token_exp = self._get_token_expiry(encrypted_token)
            if not token_exp:
                # If we can't get expiry, use a default TTL
                expires_in_sec = 1 * 3600  # 24 hours default
            else:
                current_time = int(time.time())
                expires_in_sec = max(
                    (token_exp - current_time) + self.CLOCK_SKEW_BUFFER,
                    self.CLOCK_SKEW_BUFFER,
                )

            # Create blacklist entry with metadata
            blacklist_data = {
                "revoked_at": datetime.now().isoformat(),
                "reason": reason,
                "revoked_by": revoked_by,
                "jti": jti,
                "user_email": self._extract_email_from_encrypted_token(encrypted_token),
            }

            # Store in Redis with automatic expiry
            redis_key = f"blacklist:{jti}"
            self.redis_conn.set_value(
                redis_key, json.dumps(blacklist_data), expires_in_sec=expires_in_sec
            )

            frappe.log_error(
                f"Token revoked: JTI={jti}, reason={reason}, expires_in={expires_in_sec}s"
            )

            return {
                "success": True,
                "message": "Token revoked successfully",
                "jti": jti,
            }

        except Exception as e:
            frappe.log_error(f"Error revoking token: {str(e)}")
            return {
                "success": False,
                "message": "Failed to revoke token - blacklist service error",
            }

    def revoke_multiple_tokens(
        self, encrypted_tokens, reason="bulk_revocation", revoked_by=None
    ):
        """
        Revoke multiple tokens efficiently using Redis pipeline

        Args:
            encrypted_tokens (list): List of encrypted JWT tokens to revoke
            reason (str): Reason for revocation
            revoked_by (str): User ID who initiated the revocation

        Returns:
            dict: Results summary
        """
        try:
            successful_revocations = []
            failed_revocations = []

            # Use Redis pipeline for batch operations
            pipeline = self.redis_client.pipeline()

            for encrypted_token in encrypted_tokens:
                jti = self._extract_jti_from_encrypted_token(encrypted_token)
                if not jti:
                    failed_revocations.append(
                        {"token": encrypted_token[:20] + "...", "error": "Invalid JTI"}
                    )
                    continue

                # Calculate expiry
                token_exp = self._get_token_expiry(encrypted_token)
                current_time = int(time.time())
                expires_in_sec = max(
                    (
                        (token_exp - current_time) + self.CLOCK_SKEW_BUFFER
                        if token_exp
                        else 24 * 3600
                    ),
                    self.CLOCK_SKEW_BUFFER,
                )

                # Prepare blacklist data
                blacklist_data = {
                    "revoked_at": datetime.now().isoformat(),
                    "reason": reason,
                    "revoked_by": revoked_by,
                    "jti": jti,
                }

                # Add to pipeline
                redis_key = f"blacklist:{jti}"
                pipeline.setex(redis_key, expires_in_sec, json.dumps(blacklist_data))
                successful_revocations.append(jti)

            # Execute pipeline
            pipeline.execute()

            frappe.log_error(
                f"Bulk token revocation: {len(successful_revocations)} successful, {len(failed_revocations)} failed"
            )

            return {
                "success": True,
                "message": f"Revoked {len(successful_revocations)} tokens",
                "successful_count": len(successful_revocations),
                "failed_count": len(failed_revocations),
                "failed_tokens": failed_revocations,
            }

        except Exception as e:
            frappe.log_error(f"Error in bulk token revocation: {str(e)}")
            return {
                "success": False,
                "message": "Bulk revocation failed - blacklist service error",
            }

    def is_token_revoked(self, encrypted_token):
        """
        Check if a token has been revoked (blacklisted)

        Args:
            encrypted_token (str): Encrypted JWT token to check

        Returns:
            dict: Status with revocation details
        """
        try:
            # Extract JTI from encrypted token
            jti = self._extract_jti_from_encrypted_token(encrypted_token)
            if not jti:
                # If we can't extract JTI, treat as invalid token
                return {
                    "is_revoked": True,
                    "reason": "Invalid token format",
                    "success": False,
                }

            # Check Redis blacklist
            redis_key = f"blacklist:{jti}"
            blacklist_entry = self.redis_conn.get_value(redis_key)

            if blacklist_entry:
                try:
                    blacklist_data = json.loads(blacklist_entry)
                    return {
                        "is_revoked": True,
                        "reason": blacklist_data.get("reason", "unknown"),
                        "revoked_at": blacklist_data.get("revoked_at"),
                        "revoked_by": blacklist_data.get("revoked_by"),
                        "success": True,
                    }
                except json.JSONDecodeError:
                    # Fallback for simple string entries
                    return {
                        "is_revoked": True,
                        "reason": "Token revoked",
                        "success": True,
                    }

            return {"is_revoked": False, "success": True}

        except Exception as e:
            frappe.log_error(f"Error checking token revocation: {str(e)}")
            # Fail secure - if we can't check blacklist, deny access
            return {
                "is_revoked": True,
                "reason": "Blacklist service unavailable",
                "success": False,
            }

    def revoke_user_tokens(self, user_id, reason="user_action", revoked_by=None):
        """
        Revoke all tokens for a specific user
        Note: This requires maintaining a user->tokens mapping or scanning approach

        Args:
            user_id (str): User ID whose tokens should be revoked
            reason (str): Reason for revocation
            revoked_by (str): Who initiated the revocation

        Returns:
            dict: Revocation status
        """
        try:
            # This is a simplified implementation
            # In practice, you might need to maintain user->token mappings
            # or implement a token versioning system

            # For now, we'll create a user-level revocation entry
            # that can be checked during token validation
            user_revocation_key = f"user_revoked:{user_id}"
            revocation_data = {
                "revoked_at": datetime.now().isoformat(),
                "reason": reason,
                "revoked_by": revoked_by,
            }

            # Set with a long TTL (tokens typically don't live longer than 24 hours)
            self.redis_conn.set_value(
                user_revocation_key,
                json.dumps(revocation_data),
                expires_in_sec=24 * 3600,  # 24 hours
            )

            frappe.log_error(
                f"All tokens revoked for user: {user_id}, reason: {reason}"
            )

            return {
                "success": True,
                "message": f"All tokens revoked for user {user_id}",
                "user_id": user_id,
            }

        except Exception as e:
            frappe.log_error(f"Error revoking user tokens: {str(e)}")
            return {"success": False, "message": "Failed to revoke user tokens"}

    def is_user_revoked(self, user_id):
        """
        Check if all tokens for a user have been revoked

        Args:
            user_id (str): User ID to check

        Returns:
            dict: Revocation status
        """
        try:
            user_revocation_key = f"user_revoked:{user_id}"
            revocation_entry = self.redis_conn.get_value(user_revocation_key)

            if revocation_entry:
                try:
                    revocation_data = json.loads(revocation_entry)
                    return {
                        "is_revoked": True,
                        "reason": revocation_data.get("reason", "unknown"),
                        "revoked_at": revocation_data.get("revoked_at"),
                        "success": True,
                    }
                except json.JSONDecodeError:
                    return {
                        "is_revoked": True,
                        "reason": "User tokens revoked",
                        "success": True,
                    }

            return {"is_revoked": False, "success": True}

        except Exception as e:
            frappe.log_error(f"Error checking user revocation: {str(e)}")
            # Fail secure
            return {
                "is_revoked": True,
                "reason": "Blacklist service unavailable",
                "success": False,
            }

    def _get_token_expiry(self, encrypted_token):
        """
        Extract expiry time from encrypted token

        Args:
            encrypted_token (str): Encrypted JWT token

        Returns:
            int: Token expiry timestamp or None
        """
        try:
            decrypted_token = self.crypto_service.rsa_decrypt(encrypted_token).get(
                "data"
            )
            if not decrypted_token:
                return None

            import jwt

            unverified_payload = jwt.decode(
                decrypted_token,
                options={"verify_signature": False, "verify_exp": False},
            )

            return unverified_payload.get("exp")

        except Exception as e:
            frappe.log_error(f"Failed to extract token expiry: {str(e)}")
            return None

    def get_blacklist_stats(self):
        """
        Get statistics about blacklisted tokens (for monitoring/debugging)

        Returns:
            dict: Blacklist statistics
        """
        try:
            # Count blacklisted tokens (this is expensive for large datasets)
            pattern = "blacklist:*"
            keys = self.redis_client.keys(pattern)

            # Count user revocations
            user_pattern = "user_revoked:*"
            user_keys = self.redis_conn.redis_client.keys(user_pattern)

            return {
                "success": True,
                "total_blacklisted_tokens": len(keys),
                "total_revoked_users": len(user_keys),
                "redis_healthy": True,
            }

        except Exception as e:
            frappe.log_error(f"Error getting blacklist stats: {str(e)}")
            return {
                "success": False,
                "message": "Failed to get blacklist statistics",
                "redis_healthy": False,
            }

    def get_user_blacklisted_tokens(self, user_email):
        """
        Get all blacklisted tokens for a specific user

        Args:
            user_email (str): Email of the user to search for

        Returns:
            dict: List of blacklisted tokens for the user
        """
        try:
            user_tokens = []

            # Scan all blacklist keys (expensive operation - use sparingly)
            pattern = "blacklist:*"
            keys = self.redis_conn.redis_client.keys(pattern)

            # Filter by user email
            for key in keys:
                try:
                    blacklist_entry = self.redis_conn.get_value(
                        key.decode() if isinstance(key, bytes) else key
                    )
                    if blacklist_entry:
                        blacklist_data = json.loads(blacklist_entry)
                        if blacklist_data.get("user_email") == user_email:
                            user_tokens.append(
                                {
                                    "jti": blacklist_data.get("jti"),
                                    "revoked_at": blacklist_data.get("revoked_at"),
                                    "reason": blacklist_data.get("reason"),
                                    "revoked_by": blacklist_data.get("revoked_by"),
                                    "redis_key": (
                                        key.decode() if isinstance(key, bytes) else key
                                    ),
                                }
                            )
                except (json.JSONDecodeError, Exception) as e:
                    # Skip malformed entries
                    frappe.log_error(
                        f"Skipping malformed blacklist entry {key}: {str(e)}"
                    )
                    continue

            return {
                "success": True,
                "user_email": user_email,
                "blacklisted_tokens": user_tokens,
                "total_count": len(user_tokens),
            }

        except Exception as e:
            frappe.log_error(f"Error getting user blacklisted tokens: {str(e)}")
            return {
                "success": False,
                "message": "Failed to get user blacklisted tokens",
                "user_email": user_email,
            }
