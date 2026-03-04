"""
User Management API for CareVerse HQ
Handles user creation, password reset, and user management operations
"""

import frappe
from frappe import _
import secrets
import string
from typing import Dict, Any, Optional
from careverse_hq.api.utils import api_response
from careverse_hq.api.permissions_manager import _create_user_permissions
from careverse_hq.api import admin_user_management


def generate_temp_password(length=12):
    """
    Generate a secure temporary password

    Args:
        length (int): Length of password (default: 12)

    Returns:
        str: Generated password
    """
    alphabet = string.ascii_letters + string.digits + string.punctuation
    # Ensure at least one of each type
    password = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice(string.punctuation)
    ]
    # Fill the rest randomly
    password += [secrets.choice(alphabet) for _ in range(length - 4)]
    # Shuffle to make it more random
    secrets.SystemRandom().shuffle(password)
    return ''.join(password)


@frappe.whitelist()
def create_team_user(**kwargs):
    """
    Create a new team user (e.g., Assistant, County Executive) with auto-generated password

    Args:
        first_name (str): User's first name (required)
        last_name (str): User's last name (required)
        email (str): User's email address (required)
        phone (str): User's phone number (optional)
        role (str): Role name (required, e.g., 'Assistant')
        county (str): Department/County name (required)
        health_facilities (list): List of specific health facility names (optional)

    Returns:
        dict: API response with user details and temporary password
    """
    payload = {
        "first_name": kwargs.get("first_name"),
        "last_name": kwargs.get("last_name"),
        "email": kwargs.get("email"),
        "phone": kwargs.get("phone"),
        "roles": [kwargs.get("role")] if kwargs.get("role") else [],
        "scopes": [],
    }
    actor_company_permissions = frappe.get_all(
        "User Permission",
        filters={"user": frappe.session.user, "allow": "Company"},
        fields=["for_value", "is_default"],
        order_by="is_default desc, creation asc",
        limit=1,
    )
    if actor_company_permissions:
        payload["scopes"].append(
            {
                "allow": "Company",
                "for_value": actor_company_permissions[0].get("for_value"),
                "apply_to_all_doctypes": 1,
                "is_default": 0,
            }
        )

    result = admin_user_management.create_user(payload=payload, delivery_mode="email_and_display")
    if not result.get("success"):
        err = result.get("error", {}) or {}
        return api_response(success=False, message=err.get("message", "Failed to create user"), status_code=frappe.local.response.http_status_code or 400)

    data = (result.get("data") or {})
    user = (data.get("user") or {})
    scopes = user.get("scopes") or []
    companies = [s["for_value"] for s in scopes if s.get("allow") == "Company"]
    roles = user.get("roles") or []
    return api_response(
        success=True,
        data={
            "user": {
                "name": user.get("name"),
                "email": user.get("email"),
                "first_name": user.get("first_name"),
                "last_name": user.get("last_name"),
                "phone": user.get("phone"),
                "role": roles[0] if roles else None,
                "county": companies[0] if companies else None,
                "enabled": user.get("enabled"),
            },
            "temp_password": data.get("temp_password"),
        },
        message="User created successfully",
        status_code=201,
    )


@frappe.whitelist()
def reset_user_password(**kwargs):
    """
    Reset user password and send new temporary password via email

    Args:
        user_email (str): Email of the user whose password to reset

    Returns:
        dict: API response with new temporary password
    """
    user_email = kwargs.get("user_email")
    result = admin_user_management.reset_user_password(user_id=user_email, delivery_mode="email_and_display")
    if not result.get("success"):
        err = result.get("error", {}) or {}
        return api_response(success=False, message=err.get("message", "Failed to reset password"), status_code=frappe.local.response.http_status_code or 400)

    data = result.get("data") or {}
    return api_response(
        success=True,
        data={
            "email": user_email,
            "temp_password": data.get("temp_password"),
        },
        message="Password reset successfully",
        status_code=200,
    )


@frappe.whitelist()
def update_user(**kwargs):
    """
    Update user details

    Args:
        user_email (str): Email of the user to update
        first_name (str): Updated first name (optional)
        last_name (str): Updated last name (optional)
        phone (str): Updated phone (optional)
        role (str): Updated role (optional)
        enabled (int): Enable/disable user (optional)

    Returns:
        dict: API response with updated user details
    """
    user_email = kwargs.get("user_email")
    if not user_email:
        return api_response(success=False, message="User email is required", status_code=400)

    if "enabled" in kwargs:
        result = admin_user_management.update_user_status(
            user_id=user_email,
            enabled=int(kwargs.get("enabled")),
            reason=kwargs.get("reason") or "",
        )
        if not result.get("success"):
            err = result.get("error", {}) or {}
            return api_response(success=False, message=err.get("message", "Failed to update user"), status_code=frappe.local.response.http_status_code or 400)

    profile_payload = {}
    for key in ("first_name", "last_name", "phone"):
        if key in kwargs:
            profile_payload[key] = kwargs.get(key)
    if profile_payload:
        result = admin_user_management.update_user_profile(user_id=user_email, payload=profile_payload)
        if not result.get("success"):
            err = result.get("error", {}) or {}
            return api_response(success=False, message=err.get("message", "Failed to update user"), status_code=frappe.local.response.http_status_code or 400)

    if "role" in kwargs and kwargs.get("role"):
        result = admin_user_management.update_user_roles(user_id=user_email, roles=[kwargs.get("role")])
        if not result.get("success"):
            err = result.get("error", {}) or {}
            return api_response(success=False, message=err.get("message", "Failed to update role"), status_code=frappe.local.response.http_status_code or 400)

    detail = admin_user_management.get_user_detail(user_id=user_email)
    user = (detail.get("data") or {}).get("user") or {}
    return api_response(
        success=True,
        data={
            "user": {
                "name": user.get("name"),
                "email": user.get("email"),
                "first_name": user.get("first_name"),
                "last_name": user.get("last_name"),
                "phone": user.get("phone"),
                "enabled": user.get("enabled"),
            }
        },
        message="User updated successfully",
        status_code=200,
    )


def send_user_credentials_email(email, first_name, last_name, temp_password, role, county):
    """
    Send email with login credentials to new user

    Args:
        email (str): User's email
        first_name (str): User's first name
        last_name (str): User's last name
        temp_password (str): Temporary password
        role (str): User's role
        county (str): User's county/department
    """
    site_url = frappe.utils.get_url()
    app_name = frappe.get_value("System Settings", None, "app_name") or "CareVerse HQ"

    # Render email template
    message = frappe.render_template(
        "careverse_hq/templates/emails/user_credentials.html",
        {
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "password": temp_password,
            "role": role,
            "county": county,
            "site_url": site_url,
            "app_name": app_name
        }
    )

    # Send email
    frappe.sendmail(
        recipients=[email],
        subject=f"Welcome to {app_name} - Your Login Credentials",
        message=message,
        delayed=False
    )


def send_password_reset_email(email, first_name, last_name, temp_password):
    """
    Send email with new password after reset

    Args:
        email (str): User's email
        first_name (str): User's first name
        last_name (str): User's last name
        temp_password (str): New temporary password
    """
    site_url = frappe.utils.get_url()
    app_name = frappe.get_value("System Settings", None, "app_name") or "CareVerse HQ"

    # Render email template
    message = frappe.render_template(
        "careverse_hq/templates/emails/user_credentials.html",
        {
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "password": temp_password,
            "site_url": site_url,
            "app_name": app_name,
            "is_reset": True
        }
    )

    # Send email
    frappe.sendmail(
        recipients=[email],
        subject=f"{app_name} - Password Reset",
        message=message,
        delayed=False
    )
