"""
RMA Vendor API Endpoints
Vendor-specific endpoints for managing Return Merchandise Authorization tickets
Uses existing authentication and sanitization decorators
"""

import frappe
from frappe import _
from healthpro_erp.healthpro_erp.decorators.permissions import auth_required
from .utils import api_response, sanitize_request
from frappe.utils import now, add_to_date, get_datetime, cstr
from datetime import datetime






@frappe.whitelist(methods=["GET"])
@auth_required()
@sanitize_request
def vendor_rma_list(**kwargs):
    """
    Fetch paginated list of RMA tickets assigned to vendor's supplier(s)
    
    Supports two modes:
    1. Auto-detect supplier from user (Portal Users/Contact link)
    2. Filter by supplier_name with User Permission check
    
    Query Parameters:
    - supplier_name: str (optional) - Specific supplier to filter by
    - page: int (default: 1)
    - per_page: int (default: 20, max: 100)
    - status: str (filter by status)
    - search: str (search in equipment or health facility)
    - date_of_fault: date (filter by specific date)
    - date_of_fault_from: date (filter from date)
    - date_of_fault_to: date (filter to date)
    - health_facility: str (filter by facility)
    - priority: str (filter by priority)
    """
    try:
        # Merge parameters
        params = {**frappe.form_dict, **kwargs}
        token = frappe.local.jwt_payload
        # Get current user
        user_email = token.get('user_id')
        
        # Determine which supplier(s) to filter by
        supplier_filter = None
        
        # Option 1: Supplier specified in request (with permission check)
        if params.get("supplier_name"):
            supplier_name = params.get("supplier_name")
            
            # Check if user has permission for this supplier
            has_permission, error_msg = check_supplier_permission(user_email, supplier_name)
            
            if not has_permission:
                return api_response(
                    success=False,
                    message=error_msg or f"You do not have permission to access supplier '{supplier_name}'",
                    status_code=403
                )
            
            supplier_filter = supplier_name
        
        # Option 2: Auto-detect supplier from user linkage
        else:
            supplier = get_user_supplier(user_email)
            
            if supplier:
                # User is linked to a specific supplier
                supplier_filter = supplier
            else:
                # Check if user has supplier permissions (multiple suppliers)
                permitted_suppliers = get_user_permitted_suppliers(user_email)
                
                if permitted_suppliers is None:
                    # No restrictions - can see all suppliers
                    # Don't set supplier_filter
                    pass
                elif len(permitted_suppliers) == 0:
                    # No supplier access at all
                    return api_response(
                        success=False,
                        message="No supplier associated with this user. Please contact administrator.",
                        status_code=403
                    )
                elif len(permitted_suppliers) == 1:
                    # Single supplier permission
                    supplier_filter = permitted_suppliers[0]
                else:
                    # Multiple supplier permissions - will filter in query
                    supplier_filter = permitted_suppliers
        
        # Pagination
        page = int(params.get("page", 1))
        per_page = min(int(params.get("per_page", 20)), 100)  # Max 100
        offset = (page - 1) * per_page
        
        # Build filters
        filters = {}
        
        # Add supplier filter
        if supplier_filter:
            if isinstance(supplier_filter, list):
                # Multiple suppliers
                filters["supplier_name"] = ["in", supplier_filter]
            else:
                # Single supplier
                filters["supplier_name"] = supplier_filter
        
        # Add status filter
        if params.get("status"):
            filters["status"] = params.get("status")
        
        # Add health facility filter
        if params.get("health_facility"):
            filters["health_facility"] = params.get("health_facility")
        
        # Add priority filter
        if params.get("priority"):
            filters["priority"] = params.get("priority")
        
        # Add date filter
        if params.get("date_of_fault"):
            filters["date_of_fault"] = params.get("date_of_fault")
        
        # Fetch RMA records with permission filtering
        rma_records = frappe.get_list(
            "Return Merchandise Authorization",
            filters=filters,
            fields=[
                "name as rma_id",
                "health_facility",
                "equipment as equipment_name",
                "serial_number",
                "supplier_name",
                "status",
                "priority",
                "date_of_fault as dateoffault",
                "expected_sla",
                "creation as created",
                "modified"
            ],
            order_by="modified desc",
            start=offset,
            page_length=per_page,
        )
        
        # Apply search manually if provided
        search_value = params.get("search")
        if search_value:
            search_value = search_value.lower()
            rma_records = [
                r for r in rma_records
                if search_value in (r.get("equipment_name") or "").lower()
                or search_value in (r.get("health_facility") or "").lower()
                or search_value in (r.get("serial_number") or "").lower()
            ]
        
        # Get total count for pagination
        all_records = frappe.get_list(
            "Return Merchandise Authorization",
            filters=filters,
            fields=["equipment", "health_facility", "serial_number"],
            limit_page_length=0,
        )
        
        # Apply search to count
        if search_value:
            all_records = [
                r for r in all_records
                if search_value in (r.get("equipment") or "").lower()
                or search_value in (r.get("health_facility") or "").lower()
                or search_value in (r.get("serial_number") or "").lower()
            ]
        
        total_count = len(all_records)
        
        # Calculate pagination metadata
        pagination = {
            "current_page": page,
            "per_page": per_page,
            "total_count": total_count
        }
        
        return api_response(
            success=True,
            data=rma_records,
            pagination=pagination,
            status_code=200
        )
        
    except Exception as e:
        frappe.log_error(title="Vendor RMA List Error", message=frappe.get_traceback())
        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )
@frappe.whitelist(methods=["GET"])
@auth_required()
@sanitize_request
def vendor_rma_details(**kwargs):
    """
    Fetch detailed information for a specific RMA ticket
    Checks user permissions for the supplier
    
    Query Parameters:
    - rma_id: str (required) - RMA ticket identifier
    """
    try:
        params = {**frappe.form_dict, **kwargs}
        rma_id = params.get("rma_id")
        
        if not rma_id:
            return api_response(
                success=False,
                message="rma_id is required",
                status_code=400
            )
        
        token = frappe.local.jwt_payload
        # Get current user
        user_email = token.get('user_id')
        
        # Check if RMA exists
        if not frappe.db.exists("Return Merchandise Authorization", rma_id):
            return api_response(
                success=False,
                message=f"RMA {rma_id} not found",
                status_code=404
            )
        
        # Get RMA document
        rma = frappe.get_doc("Return Merchandise Authorization", rma_id)
        
        # Check permission using multiple methods
        has_access = False
        access_method = None
        
        # Method 1: Check if user is linked to this supplier
        user_supplier = get_user_supplier(user_email)
        if user_supplier and user_supplier == rma.supplier_name:
            has_access = True
            access_method = "user_supplier_link"
        
        # Method 2: Check User Permission for this supplier
        if not has_access:
            permitted_suppliers = get_user_permitted_suppliers(user_email)
            if permitted_suppliers is None:
                # No restrictions - full access
                has_access = True
                access_method = "unrestricted"
            elif rma.supplier_name in permitted_suppliers:
                has_access = True
                access_method = "user_permission"
        
        # Deny access if no permission found
        if not has_access:
            return api_response(
                success=False,
                message="You do not have permission to view this RMA ticket",
                status_code=403
            )
        
        # Get supporting evidence URL
        evidence = ""
        if rma.supporting_evidence:
            evidence = frappe.utils.get_url(rma.supporting_evidence)
        
        # Get Health Facility Details
        facility_details = {}
        if rma.health_facility:
            facilities = frappe.get_list(
                "Health Facility",
                filters={"hie_id": rma.health_facility},  # Changed to hie_id
                fields=["hie_id", "facility_name", "facility_type", "county", "sub_county", "address"],
                limit=1
            )
            
            if facilities:
                f = facilities[0]
                facility_details = {
                    "facility_id": f.get("hie_id"),  # Using hie_id as facility_id
                    "facility_name": f.get("facility_name"),
                    "facility_type": f.get("facility_type"),
                    "county": f.get("county"),
                    "sub_county": f.get("sub_county"),
                    "registration_number":f.get("registration_number"),
                    "address": f.get("address")
                }
            else:
                # Fallback if facility not found
                facility_details = {
                    "facility_id": rma.health_facility,
                    "facility_name": None,
                    "facility_type": None,
                    "county": None,
                    "sub_county": None,
                    "address": None
                }
        
        # Build response data with all fields including vendor fields
        response_data = {
            "fault_details": {
                "rma_id": rma.name,
                "serial_number": rma.serial_number,
                "device_name": rma.equipment,
                "reported_date": cstr(rma.creation),
                "date_of_fault": cstr(rma.date_of_fault) if rma.date_of_fault else None,
                "nature_of_fault": rma.nature_of_fault,
                "priority": rma.priority,
                "expected_sla": rma.expected_sla,
                "impact_of_operations": rma.impact_of_operations,
                "supporting_evidence": evidence
            },
            "facility_details": facility_details,
            "supplier_details": {
                "supplier_name": rma.supplier_name,
                "acknowledged_by": rma.acknowledged_by,
                "vendor_sla": rma.vendor_sla,
                "vendor_remarks": rma.vendor_remarks,
                "mark_as_resolved": rma.mark_as_resolved,
                "sla_deadline": cstr(rma.sla_deadline) if rma.sla_deadline else None,
                "return_reason": rma.return_reason
            },
            "status": rma.status,
            "created": cstr(rma.creation),
            "modified": cstr(rma.modified)
        }
        
        return api_response(
            message="Fetch RMA Details succesfully",
            success=True,
            data=response_data,
            status_code=200
        )
        
    except Exception as e:
        frappe.log_error(title="Vendor RMA Details Error", message=frappe.get_traceback())
        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )

@frappe.whitelist(methods=["PUT"])
@auth_required()
@sanitize_request
def mark_as_acknowledged(**kwargs):
    """
    Acknowledge an RMA ticket and commit to an SLA
    Checks user permissions before allowing action
    
    Request Body:
    - rma_id: str (required) - RMA ticket identifier
    - acknowledged_by: str (required) - User email/ID acknowledging the ticket
    - vendor_sla: str (required) - SLA commitment (from Registry Dictionary)
    - vendor_remarks: str (required) - Vendor comments and planned action
    """
    try:
        params = {**frappe.form_dict, **kwargs}
        
        token = frappe.local.jwt_payload
        # Get current user
        user_email = token.get('user_id')
        acknowledged_by=user_email
        # Get and validate required fields
        rma_id = params.get("rma_id")
        # acknowledged_by = params.get("acknowledged_by")
        vendor_sla = params.get("vendor_sla")
        vendor_remarks = params.get("vendor_remarks")
        
        # Validate required fields
        if not all([rma_id, acknowledged_by, vendor_sla, vendor_remarks]):
            return api_response(
                success=False,
                message="All fields are required: rma_id, acknowledged_by, vendor_sla, vendor_remarks",
                status_code=400
            )
        
        # Get current user

        # Check if RMA exists
        if not frappe.db.exists("Return Merchandise Authorization", rma_id):
            return api_response(
                success=False,
                message=f"RMA ticket {rma_id} not found",
                status_code=404
            )

        # Check READ permission using get_list (respects Role Permission Manager)
        rma_list = frappe.get_list(
            "Return Merchandise Authorization",
            filters={"name": rma_id},
            fields=["name"],
            limit=1
        )

        if not rma_list:
            return api_response(
                success=False,
                message="You do not have permission to access this RMA ticket",
                status_code=403
            )

        # Get full RMA document for editing
        rma = frappe.get_doc("Return Merchandise Authorization", rma_id)

        # Check if user has WRITE permission (respects Role Permission Manager)
        if not frappe.has_permission("Return Merchandise Authorization", "write", doc=rma):
            return api_response(
                success=False,
                message="You do not have permission to acknowledge this RMA ticket",
                status_code=403
            )

        # Additional supplier-based access check
        has_access, error_msg = check_rma_access(user_email, rma)
        if not has_access:
            return api_response(
                success=False,
                message=error_msg or "You do not have permission to acknowledge this RMA ticket",
                status_code=403
            )

        # Check if already acknowledged
        if rma.acknowledged_by:
            return api_response(
                success=False,
                message="This RMA ticket has already been acknowledged",
                status_code=409
            )
        
        # Calculate SLA deadline
        sla_deadline = calculate_sla_deadline(vendor_sla)
        
        # Update RMA document
        rma.acknowledged_by = acknowledged_by
        rma.vendor_sla = vendor_sla
        rma.vendor_remarks = vendor_remarks
        rma.sla_deadline = sla_deadline
        
        # Update status to "In Progress"
        in_progress_status = frappe.db.get_value(
            "Registry Dictionary Concept",
            {"concept_name": "In Progress"},
            "name"
        )
        if in_progress_status:
            rma.status = in_progress_status
        else:
            rma.status = "In Progress"

        rma.save()
        frappe.db.commit()
        
        return api_response(
            success=True,
            data={
                "rma_id": rma.name,
                "status": rma.status,
                "acknowledged_by": rma.acknowledged_by,
                "vendor_sla": rma.vendor_sla,
                "sla_deadline": cstr(rma.sla_deadline),
                "vendor_remarks": rma.vendor_remarks,
                "modified": cstr(rma.modified),
                
            },
            message="RMA ticket acknowledged successfully",
            status_code=200
        )
        
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(title="Mark Acknowledged Error", message=frappe.get_traceback())
        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )


@frappe.whitelist(methods=["PUT"])
@auth_required()
@sanitize_request
def mark_as_resolved(**kwargs):
    """
    Mark an RMA ticket as resolved after completing repairs
    
    Request Body:
    - rma_id: str (required) - RMA ticket identifier
    - vendor_remarks: str (required) - Resolution details and actions taken
    - mark_as_resolved: bool (required) - Must be true
    """
    try:
        params = {**frappe.form_dict, **kwargs}
        
        # Get request data
        rma_id = params.get("rma_id")
        vendor_remarks = params.get("vendor_remarks")
        mark_as_resolved = params.get("mark_as_resolved")
        
        # Validate required fields
        if not rma_id or not vendor_remarks:
            return api_response(
                success=False,
                message="rma_id and vendor_remarks are required",
                status_code=400
            )
        
        # Convert mark_as_resolved to boolean
        if isinstance(mark_as_resolved, str):
            mark_as_resolved = mark_as_resolved.lower() in ['true', '1', 'yes']
        
        if not mark_as_resolved:
            return api_response(
                success=False,
                message="mark_as_resolved must be set to true",
                status_code=400
            )
        
        token = frappe.local.jwt_payload
        # Get current user
        user_email = token.get('user_id')
        
        # Check if RMA exists
        if not frappe.db.exists("Return Merchandise Authorization", rma_id):
            return api_response(
                success=False,
                message=f"RMA ticket {rma_id} not found",
                status_code=404
            )

        # Check READ permission using get_list (respects Role Permission Manager)
        rma_list = frappe.get_list(
            "Return Merchandise Authorization",
            filters={"name": rma_id},
            fields=["name"],
            limit=1
        )

        if not rma_list:
            return api_response(
                success=False,
                message="You do not have permission to access this RMA ticket",
                status_code=403
            )

        # Get full RMA document for editing
        rma = frappe.get_doc("Return Merchandise Authorization", rma_id)

        # Check if user has WRITE permission (respects Role Permission Manager)
        if not frappe.has_permission("Return Merchandise Authorization", "write", doc=rma):
            return api_response(
                success=False,
                message="You do not have permission to update this RMA ticket",
                status_code=403
            )

        # Additional supplier-based access check
        has_access, error_msg = check_rma_access(user_email, rma)
        if not has_access:
            return api_response(
                success=False,
                message=error_msg or "You do not have permission to update this RMA ticket",
                status_code=403
            )

        # Check if already resolved
        if rma.mark_as_resolved:
            return api_response(
                success=False,
                message="This RMA ticket has already been marked as resolved",
                status_code=409
            )
        
        # Update RMA document
        rma.vendor_remarks = vendor_remarks
        rma.mark_as_resolved = 1
        rma.status = "Resolved"
        
        # Update status to "Resolved by Vendor"
        resolved_status = frappe.db.get_value(
            "Registry Dictionary Concept",
            {"concept_name": "Resolved by Vendor"},
            "name"
        )
        if resolved_status:
            rma.status = resolved_status
        else:
            rma.status = "Resolved by Vendor"

        rma.save()
        frappe.db.commit()
        
        return api_response(
            success=True,
            data={
                "rma_id": rma.name,
                "status": rma.status,
                "mark_as_resolved": rma.mark_as_resolved,
                "vendor_remarks": rma.vendor_remarks,
                "modified": cstr(rma.modified),
                
            },
            message="RMA ticket marked as resolved successfully",
            status_code=200
        )
        
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(title="Mark Resolved Error", message=frappe.get_traceback())
        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )


@frappe.whitelist(methods=["PUT"])
@auth_required()
@sanitize_request
def update_vendor_rma(**kwargs):
    """
    Update RMA ticket with vendor remarks or handle returns
    
    Request Body:
    - rma_id: str (required) - RMA ticket identifier
    - vendor_remarks: str (optional) - Updated vendor remarks
    - vendor_sla: str (optional) - Updated vendor SLA
    - status: str (optional) - Updated status (must be valid transition)
    - return_reason: str (optional) - Reason for return or reopening
    """
    try:
        params = {**frappe.form_dict, **kwargs}
        
        # Get request data
        rma_id = params.get("rma_id")
        
        if not rma_id:
            return api_response(
                success=False,
                message="rma_id is required",
                status_code=400
            )
        
        token = frappe.local.jwt_payload
        # Get current user
        user_email = token.get('user_id')

        # Check if RMA exists
        if not frappe.db.exists("Return Merchandise Authorization", rma_id):
            return api_response(
                success=False,
                message=f"RMA ticket {rma_id} not found",
                status_code=404
            )

        # Check READ permission using get_list (respects Role Permission Manager)
        rma_list = frappe.get_list(
            "Return Merchandise Authorization",
            filters={"name": rma_id},
            fields=["name"],
            limit=1
        )

        if not rma_list:
            # RMA exists but user doesn't have read permission
            return api_response(
                success=False,
                message="You do not have permission to access this RMA ticket",
                status_code=403
            )

        # Get full RMA document for editing
        rma = frappe.get_doc("Return Merchandise Authorization", rma_id)

        # Check if user has WRITE permission (respects Role Permission Manager)
        if not frappe.has_permission("Return Merchandise Authorization", "write", doc=rma):
            return api_response(
                success=False,
                message="You do not have permission to update this RMA ticket",
                status_code=403
            )

        # Additional supplier-based access check
        has_access, error_msg = check_rma_access(user_email, rma)
        if not has_access:
            return api_response(
                success=False,
                message=error_msg or "You do not have permission to update this RMA ticket",
                status_code=403
            )

        # Track updated fields
        updated_fields = []

        # Update vendor remarks if provided
        if params.get("vendor_remarks"):
            rma.vendor_remarks = params.get("vendor_remarks")
            updated_fields.append("vendor_remarks")
        
        # Update vendor SLA if provided
        if params.get("vendor_sla"):
            rma.vendor_sla = params.get("vendor_sla")
            # Recalculate SLA deadline
            rma.sla_deadline = calculate_sla_deadline(params.get("vendor_sla"))
            updated_fields.append("vendor_sla")
        
        # Update status if provided
        if params.get("status"):
            new_status = params.get("status")
            # Validate status transition
            if is_valid_status_transition(rma.status, new_status):
                rma.status = new_status
                updated_fields.append("status")
            else:
                return api_response(
                    success=False,
                    message=f"Invalid status transition from {rma.status} to {new_status}",
                    status_code=409
                )
        
        # Update return reason if provided
        if params.get("return_reason"):
            rma.return_reason = params.get("return_reason")
            updated_fields.append("return_reason")
        
        if not updated_fields:
            return api_response(
                success=False,
                message="No valid fields to update",
                status_code=400
            )
        
        rma.save()
        frappe.db.commit()
        
        return api_response(
            success=True,
            data={
                "rma_id": rma.name,
                "status": rma.status,
                "return_reason": rma.return_reason,
                "vendor_remarks": rma.vendor_remarks,
                "vendor_sla": rma.vendor_sla,
                "sla_deadline": cstr(rma.sla_deadline) if rma.sla_deadline else None,
                "modified": cstr(rma.modified),
                "updated_fields": updated_fields
            },
            message="RMA ticket updated successfully",
            status_code=200
        )
        
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(title="Update Vendor RMA Error", message=frappe.get_traceback())
        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )


# ============================================================================
# Helper Functions
# ============================================================================

def check_rma_access(user_email, rma_doc):
    """
    Check if user has access to an RMA ticket based on supplier permissions
    
    Args:
        user_email: str - User email
        rma_doc: Document - RMA document object
    
    Returns:
        tuple: (bool, str) - (has_access, error_message)
    """
    try:
        # Method 1: Check if user is linked to this supplier
        user_supplier = get_user_supplier(user_email)
        if user_supplier and user_supplier == rma_doc.supplier_name:
            return True, None
        
        # Method 2: Check User Permission for this supplier
        permitted_suppliers = get_user_permitted_suppliers(user_email)
        
        if permitted_suppliers is None:
            # No restrictions - full access
            return True, None
        elif rma_doc.supplier_name in permitted_suppliers:
            return True, None
        else:
            return False, "You do not have permission to access this RMA ticket"
    
    except Exception as e:
        frappe.log_error(f"Check RMA Access Error: {str(e)}", "RMA Vendor API")
        return False, "Error checking permissions"


def check_supplier_permission(user_email, supplier_name):
    """
    Check if user has permission to access a specific supplier
    
    Args:
        user_email: str - User email
        supplier_name: str - Supplier name to check
    
    Returns:
        tuple: (bool, str) - (has_permission, message)
    """
    try:
        # Check if user has User Permission for this supplier
        has_permission = frappe.db.exists(
            "User Permission",
            {
                "user": user_email,
                "allow": "Supplier",
                "for_value": supplier_name
            }
        )
        
        if has_permission:
            return True, None
        
        # If no specific permission found, check if user has unrestricted access
        # (no User Permissions set for Supplier at all)
        any_supplier_permissions = frappe.db.exists(
            "User Permission",
            {
                "user": user_email,
                "allow": "Supplier"
            }
        )
        
        if not any_supplier_permissions:
            # No supplier restrictions set for this user - they can access all
            return True, None
        
        # User has supplier restrictions but not for this specific supplier
        return False, f"You do not have permission to access supplier '{supplier_name}'"
        
    except Exception as e:
        frappe.log_error(f"Check Supplier Permission Error: {str(e)}", "RMA Vendor API")
        return False, "Error checking permissions"


def get_user_permitted_suppliers(user_email):
    """
    Get all suppliers the user has permission to access
    
    Args:
        user_email: str - User email
    
    Returns:
        list: List of supplier names, or None if unrestricted
    """
    try:
        # Check if user has any supplier permissions
        permissions = frappe.get_all(
            "User Permission",
            filters={
                "user": user_email,
                "allow": "Supplier"
            },
            fields=["for_value"]
        )
        
        if not permissions:
            # No restrictions - user can access all suppliers
            return None
        
        # Return list of permitted suppliers
        return [p.for_value for p in permissions]
        
    except Exception as e:
        frappe.log_error(f"Get User Permitted Suppliers Error: {str(e)}", "RMA Vendor API")
        return []


def get_user_supplier(user_email):
    """
    Get the supplier associated with the current user
    
    Args:
        user_email: str - User email
    
    Returns:
        str - Supplier name or None
    """
    try:
        # Option 1: Check Portal Users table in Supplier
        # This is the standard ERPNext way for supplier portal users
        portal_user = frappe.db.get_value(
            "Portal User",
            {"user": user_email},
            ["parent", "parenttype"]
        )
        
        if portal_user and portal_user[1] == "Supplier":
            return portal_user[0]
        
        # Option 2: Check through Contact linked to Supplier
        # Find contacts with this email
        contacts = frappe.get_all(
            "Contact",
            filters={"email_id": user_email},
            fields=["name"]
        )
        
        for contact in contacts:
            # Check if this contact is linked to a supplier via Dynamic Link
            links = frappe.get_all(
                "Dynamic Link",
                filters={
                    "parent": contact.name,
                    "parenttype": "Contact",
                    "link_doctype": "Supplier"
                },
                fields=["link_name"]
            )
            
            if links:
                return links[0].link_name
        
        # Option 3: Check Contact Email child table
        # Some setups use Contact Email child table instead of email_id
        contact_emails = frappe.get_all(
            "Contact Email",
            filters={"email_id": user_email},
            fields=["parent"]
        )
        
        for contact_email in contact_emails:
            # Check if this contact is linked to a supplier
            links = frappe.get_all(
                "Dynamic Link",
                filters={
                    "parent": contact_email.parent,
                    "parenttype": "Contact",
                    "link_doctype": "Supplier"
                },
                fields=["link_name"]
            )
            
            if links:
                return links[0].link_name
        
        # Option 4: Check User document for custom supplier field
        # Uncomment and adjust if you have a custom field linking users to suppliers
        # user_doc = frappe.get_doc("User", user_email)
        # if hasattr(user_doc, 'supplier') and user_doc.supplier:
        #     return user_doc.supplier
        
        # Option 5: Check if supplier_primary_contact email matches
        # This is a fallback option
        suppliers = frappe.get_all(
            "Supplier",
            filters={"email_id": user_email},
            fields=["name"]
        )
        
        if suppliers:
            return suppliers[0].name
        
        return None
        
    except Exception as e:
        frappe.log_error(f"Get User Supplier Error: {str(e)}", "RMA Vendor API")
        return None


def calculate_sla_deadline(vendor_sla):
    """
    Calculate SLA deadline based on vendor_sla value
    
    Args:
        vendor_sla: str - SLA value (e.g., "24 Hours", "48 Hours", "1 Week")
    
    Returns:
        datetime - Calculated deadline
    """
    now_time = get_datetime()
    
    # Get the concept name from Registry Dictionary if it's an ID
    try:
        sla_concept = frappe.db.get_value(
            "Registry Dictionary Concept",
            vendor_sla,
            "concept_name"
        )
        if sla_concept:
            vendor_sla = sla_concept
    except:
        pass
    
    # Map SLA values to time deltas
    sla_mapping = {
        "4 Hours": {"hours": 4},
        "24 Hours": {"hours": 24},
        "48 Hours": {"hours": 48},
        "72 Hours": {"hours": 72},
        "1 Week": {"days": 7},
        "2 Weeks": {"days": 14},
        "1 Month": {"months": 1}
    }
    
    delta = sla_mapping.get(vendor_sla, {"hours": 48})  # Default to 48 hours
    
    return add_to_date(now_time, **delta)


def is_valid_status_transition(current_status, new_status):
    """
    Validate status transitions based on workflow rules
    
    Args:
        current_status: str - Current status (can be Registry Dictionary ID or name)
        new_status: str - New status to transition to
    
    Returns:
        bool - True if transition is valid
    """
    # Get the concept names for comparison
    try:
        current_concept = frappe.db.get_value(
            "Registry Dictionary Concept",
            current_status,
            "concept_name"
        ) or current_status
        
        new_concept = frappe.db.get_value(
            "Registry Dictionary Concept",
            new_status,
            "concept_name"
        ) or new_status
    except:
        current_concept = current_status
        new_concept = new_status
    
    # Normalize to lowercase for comparison
    current_concept_lower = current_concept.lower()
    new_concept_lower = new_concept.lower()
    
    # Define valid status transitions (all lowercase)
    valid_transitions = {
        "pending": ["in progress", "return to vendor"],
        "in progress": ["resolved by vendor", "return to vendor"],
        "resolved by vendor": ["facility verification", "return to vendor"],
        "facility verification": ["closed", "return to vendor"],
        "return to vendor": ["in progress"],
        "closed": []  # Terminal state - no transitions allowed
    }
    
    allowed_next_states = valid_transitions.get(current_concept_lower, [])
    
    # Allow same status (no change)
    return new_concept_lower in allowed_next_states or current_concept_lower == new_concept_lower