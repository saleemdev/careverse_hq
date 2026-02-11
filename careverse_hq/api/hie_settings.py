import frappe, requests, json
import jwt
import datetime


class HIE:
    @frappe.whitelist()
    def get_hie_settings(self):
        """Get HIE connection settings"""
        try:
            settings = frappe.get_single("HealthPro Backend Settings")

            if not settings:
                frappe.throw(
                    "HealthPro Backend Settings not found. Please create settings first."
                )

            password = settings.get_password("hie_password")
            if not password:
                frappe.throw(
                    "HIE password not configured. Please set the password in HealthPro Backend Settings."
                )

            hie_config = {
                "base_url": settings.hie_url,
                "username": settings.hie_username,
                "password": password,
                "public_key": settings.public_key,
                "private_key": settings.private_key,
                "default_agent": settings.default_agent,
            }

            # Validate all required settings exist
            if not all(
                [hie_config["base_url"], hie_config["username"], hie_config["password"]]
            ):
                frappe.throw(
                    "Missing required HIE configuration. Please check all settings are filled."
                )

            return hie_config

        except frappe.AuthenticationError:
            frappe.throw(
                "HIE password not found. Please configure the password in HealthPro Backend Settings."
            )
        except Exception as e:
            frappe.log_error(f"Error fetching HIE settings: {str(e)}")
            frappe.throw("Unable to retrieve HIE configuration")

    def generate_jwt_token(self, key=None, secret=None, expiry_seconds=20000):
        """
        Generate a JWT token with the given key and secret
        """
        hie_config = self.get_hie_settings()
    
        try:
            now = datetime.datetime.now()
            payload = {
                "key": hie_config["username"],
                "exp": now + datetime.timedelta(seconds=expiry_seconds),
            }

            token = jwt.encode(payload, hie_config["password"], algorithm="HS256")
            return token

        except Exception as e:
            frappe.log_error(f"JWT Generation Error: {str(e)}")
            frappe.throw("Failed to generate authentication token")


@frappe.whitelist()
def get_token():
    hie = HIE()
    res = hie.generate_jwt_token()
    return res
