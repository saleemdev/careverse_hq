import frappe
from frappe import _
import json
from typing import Dict, List, Optional, Tuple

class PermissionManagement:
    def __init__(self):
        self.permission_doctype = "DocPerm"
        self.role_doctype = "Role"
        self.user_doctype = "User"

    def create(self) -> Tuple[Dict, int]:
        """Create a new permission"""
        try:
            data = json.loads(frappe.request.data)
            
            # Validate required fields
            required_fields = ["role", "doctype", "permlevel"]
            for field in required_fields:
                if not data.get(field):
                    return {"message": f"{field} is required"}, 400

            # Check if permission already exists
            if frappe.db.exists(self.permission_doctype, {
                "role": data["role"],
                "parent": data["doctype"],
                "permlevel": data["permlevel"]
            }):
                return {"message": "Permission already exists"}, 409

            # Create permission using Frappe's document API
            perm = frappe.get_doc({
                "doctype": self.permission_doctype,
                "role": data["role"],
                "parent": data["doctype"],
                "parenttype": "DocType",
                "parentfield": "permissions",
                "permlevel": data.get("permlevel", 0),
                "read": data.get("read", 0),
                "write": data.get("write", 0),
                "create": data.get("create", 0),
                "delete": data.get("delete", 0),
                "submit": data.get("submit", 0),
                "cancel": data.get("cancel", 0),
                "amend": data.get("amend", 0),
                "print": data.get("print", 0),
                "email": data.get("email", 0),
                "report": data.get("report", 0),
                "import": data.get("import", 0),
                "export": data.get("export", 0),
                "share": data.get("share", 0)
            })
            
            perm.insert(ignore_permissions=True)
            frappe.db.commit()

            return {
                "message": "Permission created successfully",
                "permission": perm.as_dict()
            }, 201

        except Exception as e:
            frappe.log_error(f"Error creating permission: {str(e)}", "Permission Creation Error")
            return {"message": f"Error creating permission: {str(e)}"}, 500

    def get_all(self) -> Tuple[Dict, int]:
        """Get all permissions"""
        try:
            permissions = frappe.get_all(
                self.permission_doctype,
                fields=["name", "role", "parent", "permlevel", "read", "write", 
                       "create", "delete", "submit", "cancel", "amend", "print", 
                       "email", "report", "import", "export", "share"],
                order_by="parent, role"
            )
            
            return {
                "message": "Permissions fetched successfully",
                "permissions": permissions
            }, 200
            
        except Exception as e:
            frappe.log_error(
                message=f"Error fetching permissions: {str(e)}\nTraceback: {frappe.get_traceback()}",
                title="Permission Fetch Error"
            )
            return {"message": f"Error fetching permissions: {str(e)}"}, 500

    def get(self, perm_name: str) -> Tuple[Dict, int]:
        """Get permission details"""
        try:
            if not frappe.db.exists(self.permission_doctype, perm_name):
                return {"message": "Permission not found"}, 404

            perm = frappe.get_doc(self.permission_doctype, perm_name)
            return perm.as_dict(), 200
        except Exception as e:
            frappe.log_error(f"Error fetching permission: {str(e)}")
            return {"message": "Error fetching permission"}, 500

    def update(self, perm_name: str) -> Tuple[Dict, int]:
        """Update permission"""
        try:
            if not frappe.db.exists(self.permission_doctype, perm_name):
                return {"message": "Permission not found"}, 404

            data = json.loads(frappe.request.data)
            perm = frappe.get_doc(self.permission_doctype, perm_name)

            # Update permission fields
            updateable_fields = [
                "read", "write", "create", "delete", "submit", "cancel",
                "amend", "print", "email", "report", "import",
                "export", "share", "permlevel"
            ]

            for field in updateable_fields:
                if field in data:
                    setattr(perm, field, data[field])

            perm.save(ignore_permissions=True)
            frappe.db.commit()

            return {
                "message": "Permission updated successfully",
                "permission": perm.as_dict()
            }, 200

        except Exception as e:
            frappe.log_error(f"Error updating permission: {str(e)}")
            return {"message": "Error updating permission"}, 500

    def delete(self, perm_name: str) -> Tuple[Dict, int]:
        """Delete permission"""
        try:
            if not frappe.db.exists(self.permission_doctype, perm_name):
                return {"message": "Permission not found"}, 404

            frappe.delete_doc(self.permission_doctype, perm_name, force=True)
            frappe.db.commit()

            return {"message": "Permission deleted successfully"}, 200

        except Exception as e:
            frappe.log_error(f"Error deleting permission: {str(e)}")
            return {"message": "Error deleting permission"}, 500

    def get_user_roles(self, user_id: str) -> Tuple[List[Dict], int]:
        """Get user's roles"""
        try:
            if not frappe.db.exists(self.user_doctype, user_id):
                return {"message": "User not found"}, 404

            roles = frappe.get_all(
                "Has Role",
                filters={"parent": user_id, "parenttype": "User"},
                fields=["role"],
                order_by="role"
            )
            return roles, 200

        except Exception as e:
            frappe.log_error(f"Error fetching user roles: {str(e)}")
            return {"message": "Error fetching user roles"}, 500

    def assign_user_roles(self, user_id: str) -> Tuple[Dict, int]:
        """Assign roles to user"""
        try:
            if not frappe.db.exists(self.user_doctype, user_id):
                return {"message": "User not found"}, 404

            data = json.loads(frappe.request.data)
            roles = data.get("roles", [])

            if not roles:
                return {"message": "No roles provided"}, 400

            user = frappe.get_doc(self.user_doctype, user_id)

            # Remove existing roles if replace=True
            if data.get("replace", False):
                user.roles = []

            # Add new roles
            for role_name in roles:
                if not frappe.db.exists(self.role_doctype, role_name):
                    return {"message": f"Role {role_name} does not exist"}, 400
                user.append("roles", {"role": role_name})

            user.save(ignore_permissions=True)
            frappe.db.commit()

            return {"message": "Roles assigned successfully"}, 200

        except Exception as e:
            frappe.log_error(f"Error assigning roles: {str(e)}")
            return {"message": "Error assigning roles"}, 500

    def remove_user_roles(self, user_id: str) -> Tuple[Dict, int]:
        """Remove roles from user"""
        try:
            if not frappe.db.exists(self.user_doctype, user_id):
                return {"message": "User not found"}, 404

            data = json.loads(frappe.request.data)
            roles = data.get("roles", [])

            if not roles:
                return {"message": "No roles provided"}, 400

            user = frappe.get_doc(self.user_doctype, user_id)
            
            # Remove specified roles
            user.roles = [r for r in user.roles if r.role not in roles]
            user.save(ignore_permissions=True)
            frappe.db.commit()

            return {"message": "Roles removed successfully"}, 200

        except Exception as e:
            frappe.log_error(f"Error removing roles: {str(e)}")
            return {"message": "Error removing roles"}, 500

    def get_user_permissions(self, user_id: str) -> Tuple[List[Dict], int]:
        """Get user's permissions"""
        try:
            if not frappe.db.exists(self.user_doctype, user_id):
                return {"message": "User not found"}, 404

            # Get user's roles
            user_roles = frappe.get_roles(user_id)

            # Get permissions for these roles
            permissions = frappe.get_all(
                self.permission_doctype,
                filters={"role": ["in", user_roles]},
                fields=["*"],
                order_by="parent, role"
            )

            return permissions, 200

        except Exception as e:
            frappe.log_error(f"Error fetching user permissions: {str(e)}")
            return {"message": "Error fetching user permissions"}, 500

    def assign_user_permissions(self, user_id: str) -> Tuple[Dict, int]:
        """Assign direct permissions to user"""
        try:
            if not frappe.db.exists(self.user_doctype, user_id):
                return {"message": "User not found"}, 404

            data = json.loads(frappe.request.data)
            doctype = data.get("doctype")
            values = data.get("values", [])

            if not doctype or not values:
                return {"message": "Doctype and values are required"}, 400

            for value in values:
                frappe.add_permission(doctype, value, user_id)

            frappe.db.commit()

            return {"message": "Permissions assigned successfully"}, 200

        except Exception as e:
            frappe.log_error(f"Error assigning permissions: {str(e)}")
            return {"message": "Error assigning permissions"}, 500

    def remove_user_permissions(self, user_id: str) -> Tuple[Dict, int]:
        """Remove direct permissions from user"""
        try:
            if not frappe.db.exists(self.user_doctype, user_id):
                return {"message": "User not found"}, 404

            data = json.loads(frappe.request.data)
            doctype = data.get("doctype")
            values = data.get("values", [])

            if not doctype or not values:
                return {"message": "Doctype and values are required"}, 400

            for value in values:
                frappe.delete_permission(doctype, value, user_id)

            frappe.db.commit()

            return {"message": "Permissions removed successfully"}, 200

        except Exception as e:
            frappe.log_error(f"Error removing permissions: {str(e)}")
            return {"message": "Error removing permissions"}, 500

    def get_role_permissions(self, role_name: str) -> Tuple[Dict, int]:
        """Get permissions for a specific role"""
        try:
            if not frappe.db.exists(self.role_doctype, role_name):
                return {"message": "Role not found"}, 404

            permissions = frappe.get_all(
                self.permission_doctype,
                filters={"role": role_name},
                fields=["name", "role", "parent", "permlevel", "read", "write", 
                       "create", "delete", "submit", "cancel", "amend", "print", 
                       "email", "report", "import", "export", "share"],
                order_by="parent"
            )
            
            return {
                "message": "Role permissions fetched successfully",
                "permissions": permissions
            }, 200

        except Exception as e:
            frappe.log_error(
                message=f"Error fetching role permissions: {str(e)}\nTraceback: {frappe.get_traceback()}",
                title="Role Permission Fetch Error"
            )
            return {"message": f"Error fetching role permissions: {str(e)}"}, 500

def has_permission(doc, ptype, user):
    """Check if user has permission for permission management"""
    if not user:
        return False
        
    # System Manager has full access
    if "System Manager" in frappe.get_roles(user):
        return True
        
    # For other roles, only allow read access
    if ptype == "read":
        return True
        
    return False 

# Create an instance of PermissionManagement
permission_management = PermissionManagement()

# Expose methods at module level
@frappe.whitelist()
def create():
    return permission_management.create()

@frappe.whitelist()
def get_all():
    return permission_management.get_all()

@frappe.whitelist()
def get(permission_name=None, perm_name=None):
    """Get permission details - supports both permission_name and perm_name parameters"""
    # Use permission_name parameter if perm_name is not provided
    perm_identifier = perm_name or permission_name
    if not perm_identifier:
        return {"message": "Permission name is required"}, 400
    return permission_management.get(perm_identifier)

@frappe.whitelist()
def update(perm_name: str):
    return permission_management.update(perm_name)

@frappe.whitelist()
def delete(perm_name: str):
    return permission_management.delete(perm_name)

@frappe.whitelist()
def get_user_roles(user_id: str):
    return permission_management.get_user_roles(user_id)

@frappe.whitelist()
def assign_user_roles(user_id: str):
    return permission_management.assign_user_roles(user_id)

@frappe.whitelist()
def remove_user_roles(user_id: str):
    return permission_management.remove_user_roles(user_id)

@frappe.whitelist()
def get_user_permissions(user=None, user_id=None):
    """Get user permissions - supports both user and user_id parameters"""
    # Use user parameter if user_id is not provided
    user_identifier = user_id or user
    if not user_identifier:
        return {"message": "User ID is required"}, 400
    return permission_management.get_user_permissions(user_identifier)

@frappe.whitelist()
def assign_user_permissions(user_id: str):
    return permission_management.assign_user_permissions(user_id)

@frappe.whitelist()
def remove_user_permissions(user_id: str):
    return permission_management.remove_user_permissions(user_id)

@frappe.whitelist()
def get_role_permissions(role_name: str):
    return permission_management.get_role_permissions(role_name) 