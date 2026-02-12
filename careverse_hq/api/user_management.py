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
    try:
        # Get parameters
        first_name = kwargs.get("first_name")
        last_name = kwargs.get("last_name")
        email = kwargs.get("email")
        phone = kwargs.get("phone")
        role = kwargs.get("role")
        county = kwargs.get("county")
        health_facilities = kwargs.get("health_facilities", [])

        # Validate required fields
        if not first_name:
            return api_response(
                success=False,
                message="First name is required",
                status_code=400
            )

        if not last_name:
            return api_response(
                success=False,
                message="Last name is required",
                status_code=400
            )

        if not email:
            return api_response(
                success=False,
                message="Email is required",
                status_code=400
            )

        if not role:
            return api_response(
                success=False,
                message="Role is required",
                status_code=400
            )

        if not county:
            return api_response(
                success=False,
                message="County is required",
                status_code=400
            )

        # Check if user already exists
        if frappe.db.exists("User", email):
            return api_response(
                success=False,
                message=f"User with email {email} already exists",
                status_code=409
            )

        # Check if role exists
        if not frappe.db.exists("Role", role):
            return api_response(
                success=False,
                message=f"Role '{role}' does not exist",
                status_code=400
            )

        # Check if county/department exists
        if not frappe.db.exists("Department", county):
            return api_response(
                success=False,
                message=f"Department/County '{county}' does not exist",
                status_code=400
            )

        # Generate temporary password
        temp_password = generate_temp_password()

        # Create User account
        user = frappe.get_doc({
            "doctype": "User",
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "phone": phone,
            "new_password": temp_password,
            "enabled": 1,
            "user_type": "System User",
            "send_welcome_email": 0,
            "must_reset_password": 1  # Force password change on first login
        })

        # Add role
        user.append("roles", {"role": role})

        # Insert user
        user.insert(ignore_permissions=True)
        frappe.db.commit()

        # Create User Permissions for county
        permissions = [
            {
                "doctype": "Department",
                "values": [county]
            }
        ]

        # Add specific facility permissions if provided
        if health_facilities and len(health_facilities) > 0:
            permissions.append({
                "doctype": "Health Facility",
                "values": health_facilities
            })

        # Create permissions synchronously for immediate feedback
        _create_user_permissions(
            user=user.email,
            permissions=permissions,
            apply_to_all_doctypes=True,
            is_default=False
        )

        # Send email with login credentials
        try:
            send_user_credentials_email(
                email=email,
                first_name=first_name,
                last_name=last_name,
                temp_password=temp_password,
                role=role,
                county=county
            )
        except Exception as email_error:
            frappe.log_error(
                title="User Credentials Email Failed",
                message=f"Failed to send email to {email}: {str(email_error)}"
            )
            # Don't fail the user creation if email fails

        # Return success response
        return api_response(
            success=True,
            data={
                "user": {
                    "name": user.name,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "phone": user.phone,
                    "role": role,
                    "county": county,
                    "enabled": user.enabled
                },
                "temp_password": temp_password
            },
            message="User created successfully",
            status_code=201
        )

    except frappe.ValidationError as ve:
        frappe.log_error(
            title="User Creation Validation Error",
            message=f"Validation error creating user: {str(ve)}"
        )
        return api_response(
            success=False,
            message=str(ve),
            status_code=400
        )

    except Exception as e:
        frappe.log_error(
            title="User Creation Error",
            message=f"Error creating user: {str(e)}\n{frappe.get_traceback()}"
        )
        return api_response(
            success=False,
            message=f"Error creating user: {str(e)}",
            status_code=500
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
    try:
        user_email = kwargs.get("user_email")

        if not user_email:
            return api_response(
                success=False,
                message="User email is required",
                status_code=400
            )

        # Check if user exists
        if not frappe.db.exists("User", user_email):
            return api_response(
                success=False,
                message=f"User {user_email} does not exist",
                status_code=404
            )

        # Get user
        user = frappe.get_doc("User", user_email)

        # Generate new temporary password
        temp_password = generate_temp_password()

        # Update password
        user.new_password = temp_password
        user.must_reset_password = 1
        user.save(ignore_permissions=True)
        frappe.db.commit()

        # Send email with new password
        try:
            send_password_reset_email(
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                temp_password=temp_password
            )
        except Exception as email_error:
            frappe.log_error(
                title="Password Reset Email Failed",
                message=f"Failed to send email to {user.email}: {str(email_error)}"
            )

        return api_response(
            success=True,
            data={
                "email": user.email,
                "temp_password": temp_password
            },
            message="Password reset successfully",
            status_code=200
        )

    except Exception as e:
        frappe.log_error(
            title="Password Reset Error",
            message=f"Error resetting password: {str(e)}\n{frappe.get_traceback()}"
        )
        return api_response(
            success=False,
            message=f"Error resetting password: {str(e)}",
            status_code=500
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
    try:
        user_email = kwargs.get("user_email")

        if not user_email:
            return api_response(
                success=False,
                message="User email is required",
                status_code=400
            )

        # Check if user exists
        if not frappe.db.exists("User", user_email):
            return api_response(
                success=False,
                message=f"User {user_email} does not exist",
                status_code=404
            )

        # Get user
        user = frappe.get_doc("User", user_email)

        # Update fields if provided
        if "first_name" in kwargs:
            user.first_name = kwargs.get("first_name")

        if "last_name" in kwargs:
            user.last_name = kwargs.get("last_name")

        if "phone" in kwargs:
            user.phone = kwargs.get("phone")

        if "enabled" in kwargs:
            user.enabled = int(kwargs.get("enabled"))

        # Update role if provided
        if "role" in kwargs:
            new_role = kwargs.get("role")
            if frappe.db.exists("Role", new_role):
                # Remove old roles (except system roles)
                system_roles = ["All", "Guest"]
                user.roles = [r for r in user.roles if r.role in system_roles]
                # Add new role
                user.append("roles", {"role": new_role})
            else:
                return api_response(
                    success=False,
                    message=f"Role '{new_role}' does not exist",
                    status_code=400
                )

        user.save(ignore_permissions=True)
        frappe.db.commit()

        return api_response(
            success=True,
            data={
                "user": {
                    "name": user.name,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "phone": user.phone,
                    "enabled": user.enabled
                }
            },
            message="User updated successfully",
            status_code=200
        )

    except Exception as e:
        frappe.log_error(
            title="User Update Error",
            message=f"Error updating user: {str(e)}\n{frappe.get_traceback()}"
        )
        return api_response(
            success=False,
            message=f"Error updating user: {str(e)}",
            status_code=500
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
