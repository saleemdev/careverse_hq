import frappe
from .utils import sanitize_request,api_response
from healthpro_erp.healthpro_erp.decorators.permissions import auth_required







@frappe.whitelist()
@sanitize_request
@auth_required()
def fetch_user_profile_with_org():
    """
    Fetch the logged-in user's profile and organization details.
    Returns user info (name, contact, roles) along with organization
    and facility details.
    """

    try:
        token_data = frappe.local.jwt_payload
        user_id = token_data.get("user_id")

        if not user_id:
            return api_response(
                success=False,
                message="Missing user_id in token",
                status_code=400
            )

     
        # 1. Fetch User Profile

        users = frappe.get_list(
            "User",
            fields=["first_name", "last_name", "phone", "email", "user_image", "role_profile_name"],
            filters={"email": user_id},
            limit=1
        )

        if not users:
            return api_response(
                success=False,
                message=f"User with email '{user_id}' not found",
                status_code=404
            )

        user = users[0]

        roles = frappe.get_all(
            "Has Role",
            filters={"parent": user_id},
            fields=["role"]
        )

        user_profile = {
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "phone": user.get("phone"),
            "email": user.get("email"),
            "user_image": user.get("user_image"),
            "role_profile": user.get("role_profile_name"),
            "roles": [r["role"] for r in roles]
        }

      
        # 2. Fetch Organization Info
    
        org_user = frappe.get_list(
            "Healthcare Organization User",
            filters={"email": user_id},
            fields=["organization", "first_name", "last_name", "phone_number", "email", "role"],
            limit=1
        )

        organization_info = {}
        if org_user:
            org_user = org_user[0]

            org = frappe.get_list(
                "Healthcare Organization",
                filters={"name": org_user["organization"]},
                fields=["organization_name", "head_office", "address", "company"],
                limit=1
            )
            org = org[0] if org else {}

            facility = frappe.get_list(
                "Health Facility",
                filters={"healthcare_organization": org_user["organization"]},
                fields=[
                    "facility_name",
                    "administrators_first_name",
                    "administrators_last_name",
                    "designation",
                    "administrators_phone_number",
                    "administrators_email_address",
                    "address",
                    "email_invitation"
                ],
                limit=1
            )
            facility = facility[0] if facility else {}

            organization_info = {
                "organization_logo": None,  # add when logo field is available
                "organization_name": org.get("organization_name"),
                "head_office": org.get("head_office"),
                "address": org.get("address"),
                "facility_admin_full_name": f"{facility.get('administrators_first_name', '')} {facility.get('administrators_last_name', '')}".strip(),
                "facility_admin_designation": facility.get("designation"),
                "facility_admin_phone_number": facility.get("administrators_phone_number"),
                "facility_admin_email_address": facility.get("administrators_email_address"),
                "point_of_contact_full_name": f"{org_user.get('first_name', '')} {org_user.get('last_name', '')}".strip(),
                "point_of_contact_designation": org_user.get("role"),
                "point_of_contact_phone_number": org_user.get("phone_number"),
                "point_of_contact_email_address": org_user.get("email"),
                "confirmation_email_notice": facility.get("email_invitation"),
            }

     
        response = {
            "user_profile": user_profile,
            "organization": organization_info
        }

        return api_response(
            success=True,
            message="Fetched user profile and organization successfully",
            data=response,
            status_code=200
        )

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "fetch_user_profile_with_org error")
        return api_response(
            success=False,
            message=f"An error occurred: {str(e)}",
            status_code=500
        )
        
        
# ------------------------
# UPDATE  USER PROFILE
#-------------------------


@frappe.whitelist(methods=["PUT"])
@sanitize_request
@auth_required()
def update_user_profile(**kwargs):
    """
    Update the logged-in user's profile details.
    Editable fields: first_name, last_name, phone, email
    """

    try:
        token_data = frappe.local.jwt_payload
        user_id = token_data.get("user_id")

        if not user_id:
            return api_response(
                success=False,
                message="Missing user_id in token",
                status_code=400
            )

        # Allowed fields for update
        allowed_fields = ["first_name", "last_name", "phone", "email"]
        updates = {field: kwargs.get(field) for field in allowed_fields if kwargs.get(field)}

        if not updates:
            return api_response(
                success=False,
                message="No valid fields provided for update",
                status_code=400
            )

        # Update the User document
        user_doc = frappe.get_doc("User", user_id)
        for field, value in updates.items():
            setattr(user_doc, field, value)

        user_doc.save(ignore_permissions=True)
        frappe.db.commit()

        # Return updated profile
        updated_profile = {
            "first_name": user_doc.first_name,
            "last_name": user_doc.last_name,
            "phone": user_doc.phone,
            # "email": user_doc.email,
            # "user_image": user_doc.user_image,
            # "role_profile": user_doc.role_profile_name
        }

        return api_response(
            success=True,
            message="User profile updated successfully",
            data=updated_profile,
            status_code=200
        )

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "update_user_profile error")
        return api_response(
            success=False,
            message=f"An error occurred: {str(e)}",
            status_code=500
        )
