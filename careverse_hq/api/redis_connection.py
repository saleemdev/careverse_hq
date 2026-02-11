from redis import Redis
import frappe
import json
import pickle
from typing import Any, Optional, Union, Dict, List


class RedisConnection:
    _instance = None

    @staticmethod
    def get_instance():
        if RedisConnection._instance is None:
            RedisConnection()
        return RedisConnection._instance

    def __init__(self):
        if RedisConnection._instance is not None:
            raise Exception("RedisConnection is a singleton class!")
        else:
            try:
                # First try to get Redis configuration from HealthPro Backend Settings
                redis_conf = {}
                try:
                    settings = frappe.get_single("HealthPro Backend Settings")
                    if settings:
                        redis_conf = {
                            "host": settings.redis_host or "localhost",
                            "port": settings.redis_port or 6379,
                        }
                        frappe.log_error(
                            f"INFO: Redis host from settings: {settings.redis_host} has been initiated.",
                            "Redis Configuration",
                        )
                except Exception as e:
                    frappe.logger().debug(
                        f"Could not load Redis settings from HealthPro Backend Settings: {str(e)}"
                    )

                # If HealthPro Backend Settings are not available, try Frappe's cache config
                if not redis_conf:
                    if hasattr(frappe.conf, "redis_cache") and isinstance(
                        frappe.conf.redis_cache, dict
                    ):
                        redis_conf = frappe.conf.redis_cache
                    elif hasattr(frappe.conf, "redis_queue") and isinstance(
                        frappe.conf.redis_queue, dict
                    ):
                        redis_conf = frappe.conf.redis_queue

                if not redis_conf:
                    # Fallback to site config
                    site_config = frappe.get_site_config()
                    if isinstance(site_config, dict):
                        redis_conf = site_config.get("redis_connection", {})

                # Ensure we have a dict, even if empty
                if not isinstance(redis_conf, dict):
                    redis_conf = {}

                self.client = Redis(
                    host=redis_conf.get("host", "localhost"),
                    port=redis_conf.get(
                        "port", 6379
                    ),  # Using standard Redis port as fallback
                    db=redis_conf.get("db", 0),
                    password=redis_conf.get("password", None),
                    decode_responses=False,  # CRITICAL: Must be False to handle binary data
                    socket_timeout=5,
                    retry_on_timeout=True,
                )
            except Exception as e:
                # If anything fails, use default Redis connection
                self.client = Redis(
                    host="localhost",
                    port=6379,
                    db=0,
                    decode_responses=False,  # CRITICAL: Must be False to handle binary data
                    socket_timeout=5,
                    retry_on_timeout=True,
                )
                frappe.logger().error(
                    f"Redis connection error: {str(e)}, using default connection"
                )

            RedisConnection._instance = self

    def get_client(self):
        return self.client

    def set_value(
        self, key: str, value: Any, expires_in_sec: Optional[int] = None
    ) -> bool:
        """
        Set a value in Redis cache with optional expiration time.

        Stores data as JSON strings for compatibility across environments.
        This ensures data can be read consistently on both local and production.

        Args:
            key: The cache key
            value: The value to cache (will be JSON serialized)
            expires_in_sec: Optional TTL in seconds

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Always serialize as JSON for consistency
            if isinstance(value, (dict, list, int, float, bool)):
                serialized_value = json.dumps(value)
            elif isinstance(value, str):
                # Store strings as-is (they're already JSON-compatible)
                serialized_value = value
            else:
                # For other types, convert to string
                serialized_value = str(value)

            # Since decode_responses=False, we need to encode strings to bytes
            if isinstance(serialized_value, str):
                serialized_value = serialized_value.encode("utf-8")

            return bool(self.client.set(key, serialized_value, ex=expires_in_sec))
        except Exception as e:
            frappe.logger().error(f"Cache set error for key {key}: {str(e)}")
            return False

    def get_value(self, key: str, default: Any = None) -> Any:
        """
        Get a value from Redis cache.

        Handles multiple serialization formats:
        1. Pickled binary data (Frappe's default)
        2. JSON strings (our custom format)
        3. Plain UTF-8 strings

        Args:
            key: The cache key
            default: Value to return if key doesn't exist

        Returns:
            The cached value or default if not found
        """
        try:
            value = self.client.get(key)
            if value is None:
                return default

            # All values from Redis will be bytes since decode_responses=False
            if isinstance(value, bytes):
                # Strategy 1: Try to unpickle (Frappe's default serialization)
                if value and value[0:1] == b"\x80":  # Pickle protocol marker
                    try:
                        return pickle.loads(value)
                    except (pickle.UnpicklingError, EOFError, AttributeError) as e:
                        frappe.logger().debug(f"Failed to unpickle key {key}: {str(e)}")
                        # Fall through to try other methods

                # Strategy 2: Try to decode as UTF-8 string
                try:
                    value_str = value.decode("utf-8")

                    # Strategy 3: Try to parse as JSON
                    try:
                        return json.loads(value_str)
                    except json.JSONDecodeError:
                        # It's a plain string
                        return value_str

                except UnicodeDecodeError:
                    # If can't decode as UTF-8, return raw bytes
                    frappe.logger().warning(
                        f"Redis key {key} contains binary data that is neither pickle nor UTF-8"
                    )
                    return value

            # If it's already a string (shouldn't happen with decode_responses=False)
            return value

        except Exception as e:
            frappe.logger().error(f"Cache get error for key {key}: {str(e)}")
            return default

    def get_value_original(self, key: str, default: Any = None) -> Any:
        """Get a value from Redis cache.
        Args:
            key: The cache key
            default: Value to return if key doesn't exist
        Returns:
            The cached value or default if not found
        """
        try:
            value = self.client.get(key)
            if value is None:
                return default

            # Try to parse JSON for complex types
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        except Exception as e:
            frappe.logger().error(f"Cache get error: {str(e)}")
            return default

    def hset(self, name: str, key: str, value: Any) -> bool:
        """
        Set a hash field in Redis cache.

        Args:
            name: The hash name
            key: Field name
            value: Field value (will be JSON serialized)

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Serialize value as JSON
            if isinstance(value, (dict, list, int, float, bool)):
                serialized_value = json.dumps(value)
            elif isinstance(value, str):
                serialized_value = value
            else:
                serialized_value = str(value)

            # Encode to bytes
            if isinstance(serialized_value, str):
                serialized_value = serialized_value.encode("utf-8")

            return bool(self.client.hset(name, key, serialized_value))
        except Exception as e:
            frappe.logger().error(f"Cache hset error for {name}.{key}: {str(e)}")
            return False

    def hget(self, name: str, key: str, default: Any = None) -> Any:
        """
        Get a hash field from Redis cache.

        Handles multiple serialization formats (pickle, JSON, plain strings).

        Args:
            name: The hash name
            key: Field name
            default: Value to return if field doesn't exist

        Returns:
            The field value or default if not found
        """
        try:
            value = self.client.hget(name, key)
            if value is None:
                return default

            # Handle bytes (since decode_responses=False)
            if isinstance(value, bytes):
                # Try unpickle first
                if value and value[0:1] == b"\x80":
                    try:
                        return pickle.loads(value)
                    except (pickle.UnpicklingError, EOFError, AttributeError):
                        pass

                # Try UTF-8 decode
                try:
                    value_str = value.decode("utf-8")
                    # Try JSON parse
                    try:
                        return json.loads(value_str)
                    except json.JSONDecodeError:
                        return value_str
                except UnicodeDecodeError:
                    return value

            return value
        except Exception as e:
            frappe.logger().error(f"Cache hget error for {name}.{key}: {str(e)}")
            return default

    def delete_value(self, key: str) -> bool:
        """Delete a value from Redis cache.
        Args:
            key: The cache key to delete
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            return bool(self.client.delete(key))
        except Exception as e:
            frappe.logger().error(f"Cache delete error: {str(e)}")
            return False

    def delete_keys_by_pattern(self, pattern: str) -> int:
        """Delete all keys matching the given pattern.
        Args:
            pattern: Pattern to match keys (e.g., "user:*")
        Returns:
            int: Number of keys deleted
        """
        try:
            keys = self.client.keys(pattern)
            if keys:
                return self.client.delete(*keys)
            return 0
        except Exception as e:
            frappe.logger().error(f"Cache pattern delete error: {str(e)}")
            return 0

    def check_redis_ttl(self):
        """Check TTL for a test key in Redis.
        Returns:
            dict: Information about the test key
        """
        redis_client = RedisConnection.get_instance().get_client()
        key = "persistent_test_key"

        if not redis_client.exists(key):
            redis_client.setex(key, 60, "test_value")
            return {"status": "created", "key": key}

        if redis_client.exists(key):
            value = redis_client.get(key)
            ttl = redis_client.ttl(key)
            return {"status": "exists", "key": key, "value": value, "ttl": ttl}
        return {"status": "expired", "key": key}

    def inspect_redis_cache(self):
        """
        Inspect all keys in Redis cache.

        Handles multiple serialization formats (pickle, JSON, plain strings).

        Returns:
            dict: Information about all Redis keys
        """
        redis_client = RedisConnection.get_instance().get_client()
        all_keys = redis_client.keys("*")
        results = {"total_keys": len(all_keys), "keys": []}

        for key in all_keys:
            # Decode key if it's bytes
            if isinstance(key, bytes):
                try:
                    key_str = key.decode("utf-8")
                except UnicodeDecodeError:
                    key_str = f"<binary_key: {key.hex()}>"
            else:
                key_str = key

            key_type = redis_client.type(key)
            # Decode key_type if it's bytes
            if isinstance(key_type, bytes):
                key_type = key_type.decode("utf-8")

            ttl = redis_client.ttl(key)
            key_info = {"key": key_str, "type": key_type, "ttl": ttl}

            if key_type == "string":
                value = redis_client.get(key)

                # Handle different serialization formats
                if isinstance(value, bytes):
                    # Check if it's pickled
                    if value and value[0:1] == b"\x80":
                        try:
                            unpickled = pickle.loads(value)
                            key_info["value"] = str(unpickled)[:200]  # Limit length
                            key_info["value_type"] = "pickle"
                            key_info["serialization"] = "pickle"
                        except Exception as e:
                            key_info["value"] = f"<pickle_error: {str(e)}>"
                            key_info["value_type"] = "pickle_error"
                            key_info["serialization"] = "pickle"
                    else:
                        # Try UTF-8 decode
                        try:
                            value_str = value.decode("utf-8")
                            # Try JSON parse
                            try:
                                parsed = json.loads(value_str)
                                key_info["value"] = parsed
                                key_info["value_type"] = "json"
                                key_info["serialization"] = "json"
                            except json.JSONDecodeError:
                                key_info["value"] = value_str[:200]  # Limit length
                                key_info["value_type"] = "string"
                                key_info["serialization"] = "utf-8"
                        except UnicodeDecodeError:
                            key_info["value"] = f"<binary: {value[:50].hex()}...>"
                            key_info["value_type"] = "binary"
                            key_info["serialization"] = "binary"
                else:
                    # Already a string (shouldn't happen with decode_responses=False)
                    key_info["value"] = str(value)[:200]
                    key_info["value_type"] = "string"
                    key_info["serialization"] = "string"

            elif key_type == "hash":
                hash_data = redis_client.hgetall(key)
                # Decode hash keys and values
                decoded_hash = {}
                for hkey, hval in hash_data.items():
                    if isinstance(hkey, bytes):
                        hkey = hkey.decode("utf-8", errors="replace")
                    if isinstance(hval, bytes):
                        try:
                            hval = hval.decode("utf-8")
                        except UnicodeDecodeError:
                            hval = f"<binary: {hval[:20].hex()}...>"
                    decoded_hash[hkey] = hval
                key_info["value"] = decoded_hash
                key_info["value_type"] = "hash"

            elif key_type == "list":
                list_data = redis_client.lrange(key, 0, -1)
                decoded_list = []
                for item in list_data:
                    if isinstance(item, bytes):
                        try:
                            decoded_list.append(item.decode("utf-8"))
                        except UnicodeDecodeError:
                            decoded_list.append(f"<binary: {item[:20].hex()}...>")
                    else:
                        decoded_list.append(item)
                key_info["value"] = decoded_list
                key_info["value_type"] = "list"

            elif key_type == "set":
                set_data = redis_client.smembers(key)
                decoded_set = []
                for item in set_data:
                    if isinstance(item, bytes):
                        try:
                            decoded_set.append(item.decode("utf-8"))
                        except UnicodeDecodeError:
                            decoded_set.append(f"<binary: {item[:20].hex()}...>")
                    else:
                        decoded_set.append(item)
                key_info["value"] = decoded_set
                key_info["value_type"] = "set"

            results["keys"].append(key_info)

        return results


@frappe.whitelist(allow_guest=True)
def inspect_redis_cache():
    """
    API endpoint to inspect all keys in Redis cache.
    Also logs Redis connection details.
    """
    try:
        redis_connection = RedisConnection.get_instance()
        redis_client = redis_connection.get_client()

        # Get Redis connection details
        connection_info = {
            "host": redis_client.connection_pool.connection_kwargs.get(
                "host", "unknown"
            ),
            "port": redis_client.connection_pool.connection_kwargs.get(
                "port", "unknown"
            ),
            "db": redis_client.connection_pool.connection_kwargs.get("db", "unknown"),
            "password_set": bool(
                redis_client.connection_pool.connection_kwargs.get("password")
            ),
            "socket_timeout": redis_client.connection_pool.connection_kwargs.get(
                "socket_timeout", "unknown"
            ),
            "retry_on_timeout": redis_client.connection_pool.connection_kwargs.get(
                "retry_on_timeout", "unknown"
            ),
        }

        # Try to ping Redis
        ping_result = None
        try:
            ping_result = redis_client.ping()
        except Exception as e:
            ping_result = f"Failed: {str(e)}"

        # Get all keys and their info
        results = redis_connection.inspect_redis_cache()

        # Add connection info to results
        results["connection_info"] = connection_info
        results["ping_result"] = ping_result

        return results
    except Exception as e:
        frappe.log_error(f"Error inspecting Redis cache: {str(e)}", "Redis API Error")
        return {
            "success": False,
            "message": f"Failed to inspect Redis cache: {str(e)}",
            "error": str(e),
            "traceback": frappe.get_traceback(),
        }


@frappe.whitelist(allow_guest=True)
def check_redis_ttl():
    """
    API endpoint to check Redis TTL functionality with a test key.
    Also logs Redis connection details.
    """
    try:
        redis_connection = RedisConnection.get_instance()
        redis_client = redis_connection.get_client()

        # Get Redis connection details
        connection_info = {
            "host": redis_client.connection_pool.connection_kwargs.get(
                "host", "unknown"
            ),
            "port": redis_client.connection_pool.connection_kwargs.get(
                "port", "unknown"
            ),
            "db": redis_client.connection_pool.connection_kwargs.get("db", "unknown"),
            "password_set": bool(
                redis_client.connection_pool.connection_kwargs.get("password")
            ),
            "socket_timeout": redis_client.connection_pool.connection_kwargs.get(
                "socket_timeout", "unknown"
            ),
            "retry_on_timeout": redis_client.connection_pool.connection_kwargs.get(
                "retry_on_timeout", "unknown"
            ),
        }

        # Try to ping Redis
        ping_result = None
        try:
            ping_result = redis_client.ping()
        except Exception as e:
            ping_result = f"Failed: {str(e)}"

        # Check TTL functionality
        result = redis_connection.check_redis_ttl()

        return {
            "success": True,
            "connection_info": connection_info,
            "ping_result": ping_result,
            "redis_status": result,
        }
    except Exception as e:
        frappe.log_error(f"Error checking Redis TTL: {str(e)}", "Redis API Error")
        return {
            "success": False,
            "message": f"Failed to check Redis TTL: {str(e)}",
            "error": str(e),
        }


@frappe.whitelist(allow_guest=True)
def clear_redis():
    """Clear all Redis data"""
    redis_conn = RedisConnection.get_instance()
    redis_client = redis_conn.get_client()
    redis_client.flushdb()
    return {"message": "Redis cleared"}
