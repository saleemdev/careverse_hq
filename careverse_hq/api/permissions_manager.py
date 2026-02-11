import frappe
import json
from frappe import _
from frappe.utils import now
from typing import List, Dict, Any

def _create_user_permissions(
    user: str,
    permissions: List[Dict[str, Any]],
    apply_to_all_doctypes: bool = True,
    is_default: bool = False
) -> Dict[str, int]:
    """
    Bulk-create User Permission records for `user`.

    Args:
    ======
    - user: email
    - permissions: [
          {"doctype": "Region", "values": ["East Region", "West Region"]},
          {"doctype": "Facility", "values": ["Fac A", "Fac B"]}
      ]
    - apply_to_all_doctypes: maps to User Permission.apply_to_all_doc_types
    - is_default: maps to User Permission.is_default

    Returns summary:
    =================
    {
        "total_processed": <int>,
        "success_count": <int>,
        "failed_count": <int>,
        "skipped_count": <int>
    }
    
    Adds Logs:
    =========
    {
        "summary": {
            "total_processed": 3,
            "success_count": 1,
            "failed_count": 1,
            "skipped_count": 1
        },
        "success": [
            {
            "user": "umair.qau586@gmail.com",
            "allow_doctype": "Healthcare Organization Region",
            "allow_value": "HOR-25-00048",
            "name": "q4rdtbn3gi"
            }
        ],
        "failed": [
            {
            "user": "umair.qau586@gmail.com",
            "allow_doctype": "Facility",
            "allow_value": "Facility A",
            "error": "DocType 'Facility' does not exist"
            }
        ],
        "skipped": [
            {
            "user": "umair.qau586@gmail.com",
            "allow_doctype": "Healthcare Organization Region",
            "allow_value": "HOR-25-00047",
            "reason": "Permission already exists"
            }
        ]
    }
    
    Usage Example:
    ===============
    create_user_permissions_bulk(
        user="umair.qau586@gmail.com",
        permissions=[
            {
                "doctype": "Healthcare Organization Region",
                "values": ["HOR-25-00047", "HOR-25-00048"]
            },
            {
                "doctype": "Facility",
                "values": ["Facility A", "Facility B", "Facility C"]
            },
            {
                "doctype": "Organization",
                "values": ["ABC Corporation"]
            }
        ],
    )

    IMPORTANT: Call this function asynchronously (e.g. frappe.enqueue).
    """
    try:
        if not user:
            frappe.throw(_("Parameter 'user' is required"), frappe.ValidationError)

        if not permissions or not isinstance(permissions, list):
            frappe.throw(_("Parameter 'permissions' must be a non-empty list"), frappe.ValidationError)

        # Validate user exists
        user_exists = frappe.db.exists("User", user) or frappe.db.get_value("User", {"email": user}, "name")
        if not user_exists:
            # fail early for missing user (fail immediately if not found)
            err = _("User {0} does not exist").format(user)
            # Log and raise
            frappe.log_error(title="User Permission Bulk Creation - Invalid User", message=err)
            frappe.throw(err, frappe.DoesNotExistError)

        # Normalise user name (use canonical name if email was given)
        canonical_user = user_exists if isinstance(user_exists, str) else user

        # Prepare results containers
        full_details = {"summary": {}, "success": [], "failed": [], "skipped": []}
        total_processed = 0
        success_count = 0
        failed_count = 0
        skipped_count = 0

        # Iterate permissions
        for perm_obj in permissions:
            # We'll increment inside loop per value
            total_processed += 0  
            # Validate permission object
            if not perm_obj or not isinstance(perm_obj, dict):
                # Record failure for the object as a whole
                failed_count += 1
                full_details["failed"].append({
                    "user": canonical_user,
                    "allow_doctype": None,
                    "allow_value": None,
                    "error": "Invalid permission object (expected dict with keys 'doctype' and 'values')"
                })
                continue

            doctype = perm_obj.get("doctype")
            values = perm_obj.get("values")

            # Required fields check
            if not doctype or not values:
                # missing required keys
                failed_count += 1
                full_details["failed"].append({
                    "user": canonical_user,
                    "allow_doctype": doctype,
                    "allow_value": values,
                    "error": "Permission object missing 'doctype' or 'values'"
                })
                continue

            if not isinstance(values, (list, tuple)) or len(values) == 0:
                # Invalid values list
                failed_count += 1
                full_details["failed"].append({
                    "user": canonical_user,
                    "allow_doctype": doctype,
                    "allow_value": values,
                    "error": "'values' must be a non-empty list"
                })
                continue

            # Check that doctype itself exists
            if not frappe.db.exists("DocType", doctype):
                
                for v in values:
                    total_processed += 1
                    failed_count += 1
                    full_details["failed"].append({
                        "user": canonical_user,
                        "allow_doctype": doctype,
                        "allow_value": v,
                        "error": _("DocType '{0}' does not exist").format(doctype)
                    })
                continue

            # Process each value for this doctype
            for for_value in values:
                total_processed += 1
                try:
                    # Duplicate check
                    existing = frappe.get_all(
                        "User Permission",
                        filters={
                            "user": canonical_user,
                            "allow": doctype,
                            "for_value": for_value
                        },
                        fields=["name"],
                        limit=1
                    )
                    if existing:
                        skipped_count += 1
                        full_details["skipped"].append({
                            "user": canonical_user,
                            "allow_doctype": doctype,
                            "allow_value": for_value,
                            "reason": "Permission already exists"
                        })
                        continue

                    # Validate the 'for_value' exists in the target DocType
                    if not frappe.db.exists(doctype, for_value):
                        failed_count += 1
                        full_details["failed"].append({
                            "user": canonical_user,
                            "allow_doctype": doctype,
                            "allow_value": for_value,
                            "error": _("'{0}' does not exist in DocType '{1}'").format(for_value, doctype)
                        })
                        continue

                    # Create the User Permission doc
                    up = frappe.get_doc({
                        "doctype": "User Permission",
                        "user": canonical_user,
                        "allow": doctype,
                        "for_value": for_value,
                        "apply_to_all_doctypes": 1 if apply_to_all_doctypes else 0,
                        "is_default": 1 if is_default else 0
                    })

                    # Insert ignoring permissions
                    up.insert(ignore_permissions=True)
                    
                    success_count += 1
                    full_details["success"].append({
                        "user": canonical_user,
                        "allow_doctype": doctype,
                        "allow_value": for_value,
                        "name": up.name
                    })

                except Exception as exc:
                    # Log individual failure and continue
                    failed_count += 1
                    msg = str(exc)
                    # Prefer human friendly message if frappe exception has message
                    try:
                        # If exc is a ValidationError or similar, get readable message
                        msg = getattr(exc, "message", msg)
                    except Exception:
                        pass

                    full_details["failed"].append({
                        "user": canonical_user,
                        "allow_doctype": doctype,
                        "allow_value": for_value,
                        "error": msg
                    })
                    # Continue processing

        frappe.db.commit()
        summary = {
            "total_processed": total_processed,
            "success_count": success_count,
            "failed_count": failed_count,
            "skipped_count": skipped_count
        }
        full_details["summary"] = summary
        
        # After processing, log full details
        try:
            frappe.log_error(
                title="User Permission Bulk Creation",
                message=json.dumps(full_details, indent=2, default=str)
            )
        except Exception:
            # If logging itself fails, fallback to simple log
            frappe.log_error("Failed to log user permission bulk creation details")

        # Return summary
        return summary
        
    except Exception as e:
        frappe.log_error(
            "User Permission Bulk Creation Failed: {}", frappe.get_traceback())


def create_user_permissions_bulk(
    user: str,
    permissions: List[Dict[str, Any]],
    apply_to_all_doctypes: bool = True,
    is_default: bool = False
) -> Dict[str, int]:
    
    frappe.enqueue(
        method="careverse_hq.api.permissions_manager._create_user_permissions",
        queue="default",
        timeout=300,
        user=user,
        permissions=permissions,
        apply_to_all_doctypes = apply_to_all_doctypes,
        is_default = is_default,
        job_name= "user_permissions_bulk_creation_{0}_{1}".format(user, frappe.utils.now())
    )