import frappe
from frappe import _
import json
from typing import Dict, List, Optional, Tuple

class RoleManagement:
    def __init__(self):
        self.role_doctype = "Role"
        self.user_role_doctype = "Has Role"

    def create(self) -> Tuple[Dict, int]:
        """Create a new role"""
        try:
            data = json.loads(frappe.request.data)
            
            # Validate required fields
            if not data.get("role_name"):
                return {"message": "Role name is required"}, 400

            # Check if role already exists
            if frappe.db.exists("Role", data["role_name"]):
                return {"message": "Role already exists"}, 409

            # Create role using Frappe's role creation method
            role = frappe.get_doc({
                "doctype": "Role",
                "role_name": data["role_name"],
                "desk_access": data.get("desk_access", 1),
                "disabled": data.get("disabled", 0),
                "is_custom": 1
            })
            
            # Insert the role first
            role.insert(ignore_permissions=True)
            
            # Add permissions if provided
            if data.get("permissions"):
                for perm in data["permissions"]:
                    if not perm.get("role"):
                        continue
                    # Create permission rule
                    frappe.get_doc({
                        "doctype": "DocPerm",
                        "parent": perm.get("role"),  # The doctype to which we're giving permission
                        "parenttype": "DocType",
                        "role": data["role_name"],
                        "permlevel": 0,
                        "read": perm.get("read", 0),
                        "write": perm.get("write", 0),
                        "create": perm.get("write", 0),
                        "delete": perm.get("write", 0),
                        "submit": perm.get("write", 0),
                        "cancel": perm.get("write", 0),
                        "amend": perm.get("write", 0)
                    }).insert(ignore_permissions=True)
            
            frappe.db.commit()

            return {
                "message": "Role created successfully",
                "role": {
                    "role_name": role.role_name,
                    "desk_access": role.desk_access,
                    "disabled": role.disabled,
                    "is_custom": role.is_custom
                }
            }, 201

        except Exception as e:
            frappe.log_error(f"Error creating role: {str(e)}", "Role Creation Error")
            return {"message": f"Error creating role: {str(e)}"}, 500

    def get_all(self) -> Tuple[List[Dict], int]:
        """Get all roles"""
        try:
            roles = frappe.get_all(
                self.role_doctype,
                fields=["name", "role_name", "desk_access", "disabled", "is_custom"],
                order_by="role_name"
            )
            return roles, 200
        except Exception as e:
            frappe.log_error(f"Error fetching roles: {str(e)}")
            return {"message": "Error fetching roles"}, 500

    def get(self, role_name: str) -> Tuple[Dict, int]:
        """Get role details"""
        try:
            if not frappe.db.exists(self.role_doctype, role_name):
                return {"message": "Role not found"}, 404

            role = frappe.get_doc(self.role_doctype, role_name)
            return role.as_dict(), 200
        except Exception as e:
            frappe.log_error(f"Error fetching role: {str(e)}")
            return {"message": "Error fetching role"}, 500

    def update(self, role_name: str) -> Tuple[Dict, int]:
        """Update an existing role"""
        try:
            if not role_name:
                return {"message": "Role name is required"}, 400

            if not frappe.db.exists("Role", role_name):
                return {"message": "Role not found"}, 404

            data = json.loads(frappe.request.data)
            
            # Update role fields
            role = frappe.get_doc("Role", role_name)
            if "desk_access" in data:
                role.desk_access = data["desk_access"]
            if "disabled" in data:
                role.disabled = data["disabled"]
            role.save(ignore_permissions=True)

            # Update permissions if provided
            if data.get("permissions"):
                # First, remove existing permissions
                existing_permissions = frappe.get_all(
                    "DocPerm",
                    filters={"role": role_name},
                    fields=["name"]
                )
                for perm in existing_permissions:
                    frappe.delete_doc("DocPerm", perm.name, ignore_permissions=True)
                
                # Add new permissions
                for perm in data["permissions"]:
                    if not perm.get("role"):
                        continue
                    # Create permission rule
                    frappe.get_doc({
                        "doctype": "DocPerm",
                        "parent": perm.get("role"),
                        "parenttype": "DocType",
                        "role": role_name,
                        "permlevel": 0,
                        "read": perm.get("read", 0),
                        "write": perm.get("write", 0),
                        "create": perm.get("write", 0),
                        "delete": perm.get("write", 0),
                        "submit": perm.get("write", 0),
                        "cancel": perm.get("write", 0),
                        "amend": perm.get("write", 0)
                    }).insert(ignore_permissions=True)

            frappe.db.commit()

            return {
                "message": "Role updated successfully",
                "role": {
                    "role_name": role.role_name,
                    "desk_access": role.desk_access,
                    "disabled": role.disabled
                }
            }, 200

        except Exception as e:
            frappe.log_error(f"Error updating role: {str(e)}", "Role Update Error")
            return {"message": f"Error updating role: {str(e)}"}, 500

    def delete(self, role_name: str) -> Tuple[Dict, int]:
        """Delete role"""
        try:
            if not frappe.db.exists(self.role_doctype, role_name):
                return {"message": "Role not found"}, 404

            # Check if role is system role
            role = frappe.get_doc(self.role_doctype, role_name)
            if not role.is_custom:
                return {"message": "Cannot delete system role"}, 403

            frappe.delete_doc(self.role_doctype, role_name, force=True)
            frappe.db.commit()

            return {"message": "Role deleted successfully"}, 200

        except Exception as e:
            frappe.log_error(f"Error deleting role: {str(e)}")
            return {"message": "Error deleting role"}, 500

    def get_users(self, role_name: str) -> Tuple[List[Dict], int]:
        """Get users with this role"""
        try:
            if not frappe.db.exists(self.role_doctype, role_name):
                return {"message": "Role not found"}, 404

            users = frappe.get_all(
                self.user_role_doctype,
                filters={"role": role_name},
                fields=["parent", "parenttype"],
                pluck="parent"
            )

            user_details = frappe.get_all(
                "User",
                filters={"name": ["in", users]},
                fields=["name", "first_name", "last_name", "email", "enabled"]
            )

            return user_details, 200

        except Exception as e:
            frappe.log_error(f"Error fetching users for role: {str(e)}")
            return {"message": "Error fetching users"}, 500

    def assign_users(self, role_name: str) -> Tuple[Dict, int]:
        """Assign role to users"""
        try:
            if not frappe.db.exists(self.role_doctype, role_name):
                return {"message": "Role not found"}, 404

            data = json.loads(frappe.request.data)
            user_names = data.get("users", [])

            if not user_names:
                return {"message": "No users provided"}, 400

            # Validate users exist
            existing_users = frappe.get_all(
                "User",
                filters={"name": ["in", user_names]},
                pluck="name"
            )

            if len(existing_users) != len(user_names):
                return {"message": "Some users do not exist"}, 400

            # Assign role to users
            for user_name in user_names:
                if not frappe.db.exists(self.user_role_doctype, {"parent": user_name, "role": role_name}):
                    user = frappe.get_doc("User", user_name)
                    user.append("roles", {"role": role_name})
                    user.save(ignore_permissions=True)

            frappe.db.commit()

            return {"message": "Role assigned successfully"}, 200

        except Exception as e:
            frappe.log_error(f"Error assigning role to users: {str(e)}")
            return {"message": "Error assigning role"}, 500

    def remove_users(self, role_name: str) -> Tuple[Dict, int]:
        """Remove role from users"""
        try:
            if not frappe.db.exists(self.role_doctype, role_name):
                return {"message": "Role not found"}, 404

            data = json.loads(frappe.request.data)
            user_names = data.get("users", [])

            if not user_names:
                return {"message": "No users provided"}, 400

            # Remove role from users
            for user_name in user_names:
                if frappe.db.exists(self.user_role_doctype, {"parent": user_name, "role": role_name}):
                    user = frappe.get_doc("User", user_name)
                    for role in user.roles:
                        if role.role == role_name:
                            user.roles.remove(role)
                    user.save(ignore_permissions=True)

            frappe.db.commit()

            return {"message": "Role removed successfully"}, 200

        except Exception as e:
            frappe.log_error(f"Error removing role from users: {str(e)}")
            return {"message": "Error removing role"}, 500

def has_role_permission(doc, ptype, user):
    """Check if user has permission for role management"""
    if not user:
        return False
        
    # System Manager has full access
    if "System Manager" in frappe.get_roles(user):
        return True
        
    # For other roles, only allow read access
    if ptype == "read":
        return True
        
    return False 