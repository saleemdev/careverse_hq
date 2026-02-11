import frappe
from frappe.exceptions import ValidationError, PermissionError
from frappe.utils import nowdate
from .utils import api_response, handle_workflow
from healthpro_erp.healthpro_erp.decorators.permissions import auth_required, AuthError

# ========== Helper Functions ==========

def _read_query_params(kwargs: dict, expected_fields: list[str]) -> dict:
    """
    Extract and normalize common query params from API kwargs
    by extracting expected fields.
    """
    params = {}

    for field in expected_fields:
        params[field] = kwargs.get(field)

    return params

def _validate_request_data(
    params: dict, required_fields: list[tuple[str, str]]
) -> None:
    """
    Validate request params. Raises frappe.ValidationError on failure.
    
    Args:
        params (dict): Request parameters.
        required_fields (list[tuple[str, str]]): 
            List of (field_name, display_name) tuples for validation.

    Raises:
        frappe.ValidationError: If any required field is missing or falsy.
    """
    required_fields = required_fields or []

    missing_fields = []
    for field, display_name in required_fields:
        if not params.get(field):
            missing_fields.append(f"{display_name} ('{field}')")

    if missing_fields:
        message = "Missing required fields: " + ", ".join(missing_fields)
        frappe.throw(message, frappe.ValidationError)
        
def _get_valid_purchase_order(po_id):
    try:
        return frappe.get_doc("Purchase Order", po_id)
    except frappe.DoesNotExistError:
        return None


def _acknowledge_po(po, vendor_acknowledged, acknowledgment_date, estimated_date, vendor_notes, acknowledged_by):
    po.db_set("custom_is_vendor_acknowledged", vendor_acknowledged)
    po.db_set("custom_vendor_acknowledge_date", acknowledgment_date)
    po.db_set("custom_delivery_estimated_date", estimated_date)
    po.db_set("custom_additional_notes", vendor_notes)
    po.db_set("custom_acknowledged_by", acknowledged_by)
    handle_workflow(po, "Acknowledge")
    po.add_comment("Comment", "PO acknowledged by vendor.")


def _update_linked_device_requests(po_id):
    """
    Update workflow state to 'Vendor Processing' for all Health Automation Device Requests
    linked to the given Purchase Order via Delivery Schedule > Original Requests table.
    """
    updated_request_ids = set()

    # Get the Delivery Schedule linked to this Purchase Order
    device_requests = frappe.get_list(
        "Health Automation Device Request",
        filters={"purchase_order": po_id},
        fields=["name"]
    )
    
    # Iterate over Health Automation Device Requests
    for device_request in device_requests:
        req_id = device_request.get("name")

        # Update workflow state
        doc = frappe.get_doc("Health Automation Device Request", req_id)
        handle_workflow(doc, "Approve")
        updated_request_ids.add(req_id)

    return list(updated_request_ids)

# ===== Data Access Functions =====
@auth_required()
def _acknowledge_purchase_order(data):
    
    # Extract data
    po_id = data.get("po_id")
    vendor_acknowledged = 1
    vendor_acknowledgment_date = nowdate()
    estimated_delivery_date = data.get("estimated_delivery_date")
    vendor_notes = data.get("notes")
    acknowledged_by = frappe.session.user

    # Fetch Purchase Order
    po = _get_valid_purchase_order(po_id)
    if not po:
        return {
            "success": False,
            "message": f"Purchase Order with ID '{po_id}' not found.",
            "status_code": 404,
        }

    # Check if already acknowledged
    if po.workflow_state != "Submitted":
        return {
            "success": False,
            "message": f"Purchase Order '{po_id}' has already been acknowledged and currently is in '{po.workflow_state}' state.",
            "status_code": 400,
        }

    # === Start transaction ===
    frappe.db.savepoint("purchase_order_acknowledgement")
    
    # Acknowledge Purchase Order
    _acknowledge_po(po, vendor_acknowledged, vendor_acknowledgment_date, estimated_delivery_date, vendor_notes, acknowledged_by)

    # Update all linked Health Automation Device Requests
    updated_requests = _update_linked_device_requests(po.name)

    frappe.db.commit()
    
    return {
        "success": True,
        "data": {
            "po_id": po_id,
            "acknowledgment_date": vendor_acknowledgment_date,
            "estimated_delivery_date": estimated_delivery_date,
            "updated_device_requests": updated_requests,
            "notes": vendor_notes,
            "acknowledged_by": acknowledged_by
        }
    }

# ===== API Functions =====

@frappe.whitelist(methods=["PUT"])
def acknowledge_purchase_order(**kwargs):
    """
    Acknowledge Purchase Order by vendor.

    Flow:
    - Extract and validate input data
    - Validate po_id is valid and not acknowledged already
    - Update Purchase Order
    - Update all linked Health Automation Device Requests to "Vendor Processing"
    - Return API response with confirmation
    """
    try: 
        expected_data = ["po_id", "estimated_delivery_date", "notes"]
        required_data = [("po_id", "Purchase Order ID"), ("estimated_delivery_date", "Estimated Delivery Date")]
        
        request_data = _read_query_params(kwargs, expected_data)
        _validate_request_data(request_data, required_data)
        
        purchase_order_acknowledgement = _acknowledge_purchase_order(request_data)
        if not purchase_order_acknowledgement.get("success"):
            return api_response(success=False, message=purchase_order_acknowledgement.get("message"), status_code=purchase_order_acknowledgement.get("status_code"))
            
        purchase_order = purchase_order_acknowledgement.get("data")
            
        return api_response(
            success=True,
            message="Purchase Order acknowledged successfully.",
            data={
                "po_id": purchase_order["po_id"],
                "status": "Acknowledged",
                "acknowledgment_date": purchase_order["acknowledgment_date"],
                "estimated_delivery_date": purchase_order["estimated_delivery_date"],
                "updated_device_requests": purchase_order["updated_device_requests"],
                "notes": purchase_order["notes"],
                "acknowledged_by": purchase_order["acknowledged_by"]
            },
            status_code=200
        )
        
    except PermissionError as pe:
        frappe.db.rollback()
        return api_response(success=False, message=str(pe), status_code=403)

    except ValidationError as ve:
        frappe.db.rollback()
        return api_response(success=False, message=str(ve), status_code=400)
    
    except AuthError as ae:
        return api_response(success=False, message=ae.message, status_code=ae.status_code)
    
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(frappe.get_traceback(), "PO Acknowledgment Error")
        return api_response(
            success=False,
            message="Failed to acknowledge Purchase Order due to an internal error.",
            status_code=500
        )
