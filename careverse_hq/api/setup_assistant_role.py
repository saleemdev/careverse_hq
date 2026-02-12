"""
Script to create the Assistant role with appropriate permissions
Run this from bench console:
bench --site [site-name] console
>>> from careverse_hq.api.setup_assistant_role import setup_assistant_role
>>> setup_assistant_role()
"""

import frappe


def setup_assistant_role():
    """
    Create the Assistant role with appropriate permissions for bulk uploads
    """
    try:
        # Create Assistant role if it doesn't exist
        if not frappe.db.exists("Role", "Assistant"):
            role = frappe.get_doc({
                "doctype": "Role",
                "role_name": "Assistant",
                "desk_access": 1,
                "disabled": 0,
                "is_custom": 1
            })
            role.insert(ignore_permissions=True)
            print(f"✓ Created 'Assistant' role")
        else:
            print("✓ 'Assistant' role already exists")
            role = frappe.get_doc("Role", "Assistant")

        # Define permissions for Assistant role
        permissions_config = [
            {
                "doctype": "Bulk Health Worker Upload",
                "permissions": {
                    "read": 1,
                    "write": 0,
                    "create": 1,
                    "delete": 0,
                    "submit": 0,
                    "cancel": 0,
                    "amend": 0,
                    "export": 0,
                    "import": 0,
                    "print": 1,
                    "email": 0,
                    "report": 0,
                    "share": 0,
                    "if_owner": 1  # Can only read their own uploads
                }
            },
            {
                "doctype": "Bulk Health Worker Upload Item",
                "permissions": {
                    "read": 1,
                    "write": 0,
                    "create": 0,
                    "delete": 0,
                    "submit": 0,
                    "cancel": 0,
                    "amend": 0,
                    "export": 0,
                    "import": 0,
                    "print": 1,
                    "email": 0,
                    "report": 0,
                    "share": 0,
                    "if_owner": 1
                }
            },
            {
                "doctype": "Facility Affiliation",
                "permissions": {
                    "read": 1,
                    "write": 0,
                    "create": 0,
                    "delete": 0,
                    "submit": 0,
                    "cancel": 0,
                    "amend": 0,
                    "export": 0,
                    "import": 0,
                    "print": 1,
                    "email": 0,
                    "report": 0,
                    "share": 0
                }
            },
            {
                "doctype": "Health Professional",
                "permissions": {
                    "read": 1,
                    "write": 0,
                    "create": 0,
                    "delete": 0,
                    "submit": 0,
                    "cancel": 0,
                    "amend": 0,
                    "export": 0,
                    "import": 0,
                    "print": 0,
                    "email": 0,
                    "report": 0,
                    "share": 0
                }
            },
            {
                "doctype": "Health Facility",
                "permissions": {
                    "read": 1,
                    "write": 0,
                    "create": 0,
                    "delete": 0,
                    "submit": 0,
                    "cancel": 0,
                    "amend": 0,
                    "export": 0,
                    "import": 0,
                    "print": 0,
                    "email": 0,
                    "report": 0,
                    "share": 0
                }
            }
        ]

        # Add permissions to each doctype
        for perm_config in permissions_config:
            doctype_name = perm_config["doctype"]
            perms = perm_config["permissions"]

            # Check if doctype exists
            if not frappe.db.exists("DocType", doctype_name):
                print(f"⚠ DocType '{doctype_name}' does not exist, skipping...")
                continue

            # Get the DocType
            dt = frappe.get_doc("DocType", doctype_name)

            # Check if permission already exists for this role
            existing_perm = None
            for p in dt.permissions:
                if p.role == "Assistant":
                    existing_perm = p
                    break

            if existing_perm:
                # Update existing permission
                for key, value in perms.items():
                    if hasattr(existing_perm, key):
                        setattr(existing_perm, key, value)
                print(f"✓ Updated permissions for '{doctype_name}'")
            else:
                # Add new permission
                dt.append("permissions", {
                    "role": "Assistant",
                    "permlevel": 0,
                    **perms
                })
                print(f"✓ Added permissions for '{doctype_name}'")

            # Save the DocType
            dt.save(ignore_permissions=True)

        frappe.db.commit()
        print("\n✅ Assistant role setup completed successfully!")
        print("\nAssistant role can now:")
        print("  • Create and view their own bulk health worker uploads")
        print("  • View facility affiliations (read-only)")
        print("  • View health professionals and facilities (read-only)")
        print("\nUser Permissions (Department/Health Facility) will be applied when users are created.")

        return True

    except Exception as e:
        frappe.log_error(
            title="Assistant Role Setup Error",
            message=f"Error setting up Assistant role: {str(e)}\n{frappe.get_traceback()}"
        )
        print(f"\n❌ Error setting up Assistant role: {str(e)}")
        return False


def verify_county_executive_permissions():
    """
    Verify that County Executive role has the necessary permissions
    """
    try:
        if not frappe.db.exists("Role", "County Executive"):
            print("⚠ 'County Executive' role does not exist")
            return False

        print("\nVerifying County Executive permissions...")

        required_doctypes = [
            "Bulk Health Worker Upload",
            "Bulk Health Worker Upload Item"
        ]

        for doctype_name in required_doctypes:
            if not frappe.db.exists("DocType", doctype_name):
                print(f"⚠ DocType '{doctype_name}' does not exist")
                continue

            dt = frappe.get_doc("DocType", doctype_name)
            has_perm = False

            for p in dt.permissions:
                if p.role == "County Executive":
                    has_perm = True
                    print(f"✓ County Executive has permissions on '{doctype_name}'")
                    break

            if not has_perm:
                print(f"⚠ County Executive missing permissions on '{doctype_name}'")

        return True

    except Exception as e:
        print(f"❌ Error verifying permissions: {str(e)}")
        return False


if __name__ == "__main__":
    setup_assistant_role()
    verify_county_executive_permissions()
