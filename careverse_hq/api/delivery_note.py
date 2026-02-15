import frappe, bleach, re
from frappe import _, _dict
from frappe.utils import nowdate, cint, flt, now_datetime
from frappe.exceptions import ValidationError, PermissionError, UniqueValidationError
from collections import defaultdict, Counter
from typing import Any, Dict
from .purchase_order import _update_linked_device_requests
from .utils import api_response, handle_workflow, get_uploaded_documents, sanitize_request
from healthpro_erp.healthpro_erp.decorators.permissions import auth_required, AuthError


# ===== Helper Functions =====

def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except Exception:
        return default

def _paginate(start: int, page_size: int, total: int) -> Dict[str, Any]:
    return {
        "current_page": int(start // page_size) + 1,
        "per_page": page_size,
        "total_count": total,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }
    
def _build_pagination_params(params, page_size_field = "limit", curr_page_field = "page"):
    curr_page = max(1, _safe_int(params.get(curr_page_field), 1))
    page_size = min(100, _safe_int(params.get(page_size_field), 10))
    offset = (curr_page - 1) * page_size
    return page_size, offset

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
        field_value = params.get(field)
        if isinstance(field_value, str):
            field_value = field_value.strip()
        if field_value is None or field_value == "":
            missing_fields.append(f"{display_name} ('{field}')")

    if missing_fields:
        message = "Missing required fields: " + ", ".join(missing_fields)
        frappe.throw(message, frappe.ValidationError)

def _build_delivery_notes_filter(params):
    filters = []

    status_map = {
        "dispatched": ["Dispatched by Vendor", "Dispatched by County"],
        "delivered": ["Received by County", "Received by Facility"],
    }

    filter = params.get("filter")
    if filter in status_map:
        filters.append(["workflow_state", "in", status_map[filter]])
    elif filter == "draft":
        filters.append(["workflow_state", "=", "Draft"])
    elif filter == "all":
        filters.append(["workflow_state", "!=", "Draft"])
    else:
        filters.append(["workflow_state", "=", filter])

    if params.get("from_date"):
        filters.append(["posting_date", ">=", params.get("from_date")])

    if params.get("to_date"):
        filters.append(["posting_date", "<=", params.get("to_date")])

    if params.get("purchase_order"):
        filters.append(["custom_purchase_order", "=", params.get("purchase_order")])
    
    if params.get("county"):
        filters.append(["company", "=", params.get("county")])
        
    if params.get("search"):
        filters.append(["name", "=", params.get("search")])

    return filters


def _format_duplicate_entry_validation_msg(error_msg):
    m = re.search(r"Duplicate entry '([^']+)' for key '([^']+)'", error_msg)
    if m:
        dup_value, dup_field = m.groups()
        field_label = dup_field.replace("_", " ").title()
        msg = f"The value '{dup_value}' is already used in '{field_label}'. Please provide a unique value."
        return msg
    return error_msg
                
def _has_purchase_receipt(po_id):
    return frappe.db.exists("Purchase Receipt Item", {"purchase_order": po_id})

def _get_valid_purchase_order(po_id):
    try:
        return frappe.get_doc("Purchase Order", po_id)
    except frappe.DoesNotExistError:
        return None
    
def _get_valid_purchase_receipt(pr_id):
    try:
        return frappe.get_doc("Purchase Receipt", pr_id)
    except frappe.DoesNotExistError:
        return None
    
def _validate_criteria_for_purchase_receipt_generation(po):
    po_id = po.name
    
    # Validate PO
    if po.workflow_state == "Submitted":
        frappe.throw(_(f"Purchase Order '{po_id}' is not acknowledged yet.", frappe.ValidationError))
    
    if po.workflow_state == "Fulfilled":
        frappe.throw(_(f"Purchase Order '{po_id}' is already fulfilled.", frappe.ValidationError))
    
    # Check if any related Purchase Receipt is still in Draft
    draft_pr = frappe.get_list(
        "Purchase Receipt",
        filters={
            "workflow_state": "Draft",
            "purchase_order": po_id
        },
        pluck="name"
    )
    
    if draft_pr:
        frappe.throw(
            _(f"Purchase Order '{po_id}' has a Delivery Note '{draft_pr[0]}' already in 'Draft' state. You need to submit that first."),
            exc=frappe.ValidationError
        )

def _validate_criteria_for_purchase_receipt_updation(po):
    po_id = po.name
    
    # Validate PO
    if po.workflow_state == "Submitted":
        frappe.throw(_(f"Purchase Order '{po_id}' is not acknowledged yet.", frappe.ValidationError))
    
    if po.workflow_state == "Fulfilled":
        frappe.throw(_(f"Purchase Order '{po_id}' is already fulfilled.", frappe.ValidationError))
        
def _get_po_items_grouped(po):
    item_map = {}
    for item in po.items:        
        if item.item_code in item_map:
            # Add qty if already exists
            item_map[item.item_code]["qty"] += int(item.qty)
        else:
            # Store item with initial qty
            item_map[item.item_code] = {
                "item_type": item.item_group, "item_name": item.item_name,
                "item_code": item.item_code, "qty": int(item.qty),
                "parent": item.parent, "rate": item.rate, "uom": item.uom, "warehouse": item.warehouse
            }

    return item_map
    
def _get_delivered_po_items_grouped(po_id: str):
    
    pr_ids = frappe.get_list(
        "Purchase Receipt",
        filters={
            "purchase_order": po_id,
            "docstatus": 1
        },
        fields=[
            "name"
        ],
        group_by="name"
    )
    purchase_receipts = [frappe.get_doc("Purchase Receipt", pr_id.name) for pr_id in pr_ids]
    
    item_map = {}
    for pr in purchase_receipts:
        for item in pr.items:
            pr_item = item.as_dict()
            qty = int(pr_item.qty)
            if pr_item.item_code in item_map:
                item_map[pr_item.item_code]["qty"] += qty
            else:
                item_map[pr_item.item_code] = {
                    "item_type": pr_item.item_group, "item_name": pr_item.item_name,
                    "item_code": pr_item.item_code, "qty": qty
                }

    return item_map

def _get_delivered_items_detail(po_id: str):
    """
    Fetch aggregated delivered items for a given Purchase Order.
    Only considers submitted/non-draft Purchase Receipts.
    """
    pr_ids = frappe.get_list(
        "Purchase Receipt",
        filters={
            "purchase_order": po_id,
            "docstatus": 1
        },
        fields=[
            "name"
        ],
        group_by="name"
    )
    purchase_receipts = [frappe.get_doc("Purchase Receipt", pr_id.name) for pr_id in pr_ids]
    
    # Ensure qty is int (frappe.db.sql may return Decimal)
    total_delivered_items = 0
    item_map = {}
    for pr in purchase_receipts:
        for item in pr.items:
            pr_item = item.as_dict()
            qty = int(pr_item.qty)
            if pr_item.item_code in item_map:
                item_map[pr_item.item_code]["qty"] += qty
            else:
                item_map[pr_item.item_code] = {
                    "item_type": pr_item.item_group, "item_name": pr_item.item_name,
                    "item_code": pr_item.item_code, "qty": qty
                }
            total_delivered_items += qty
    delivered_items_detail = list(item_map.values())

    return total_delivered_items, delivered_items_detail


def _group_incoming_items(incoming_items, is_draft = 0):
    items_grouped = defaultdict(list)
    for item in incoming_items:
        item_code = item.get("item_code")
        if not item_code:
            frappe.throw(_(f"{item_code} do not have 'item_code'"), frappe.ValidationError)
        if not is_draft and (not item.get("serial") or not item.get("sim_serial") or not item.get("device_type")):
            frappe.throw(_(f"{item_code} do not have 'item_code' or 'serial' or 'sim_serial' or 'device_type'"), frappe.ValidationError)

        items_grouped[item_code].append(item)
    return items_grouped

def _validate_incoming_quantity_against_po(po_id, po_item_map, items_grouped, delivered_po_items_grouped):
    is_fully_fulfilled = True
    fresh_items_count = 0
    
    for item_code, entries in items_grouped.items():
        if item_code not in po_item_map:
            frappe.throw(_(f"Item '{item_code}' not found in Purchase Order '{po_id}'", frappe.ValidationError))
            
        is_fresh_item = False
        delivered_qty = 0
        
        qty = len(entries)
        ordered_qty = cint(po_item_map[item_code]["qty"])
                           
        if delivered_po_items_grouped and item_code in delivered_po_items_grouped:
            delivered_qty = delivered_po_items_grouped[item_code]["qty"]
        else:
            is_fresh_item = True
            fresh_items_count += 1
            
        if is_fresh_item:
            if qty > ordered_qty:
                frappe.throw(_(
                    f"Item '{item_code}' has {qty} quantity, "
                    f"but only {ordered_qty} oredered in PO '{po_id}'",
                    frappe.ValidationError
                ))
        else:
            if qty + delivered_qty > ordered_qty:
                frappe.throw(_(
                    f"Item '{item_code}' has {delivered_qty} quantity delivered already, current delivery note has {qty} quantity which makes the total quantity {delivered_qty + qty}, "
                    f"but only {ordered_qty} ordered in PO '{po_id}'",
                    frappe.ValidationError
                ))
                
        if is_fresh_item:
            if qty < ordered_qty:
                is_fully_fulfilled = False
        else:
            if qty + delivered_qty < ordered_qty:
                is_fully_fulfilled = False
    
    if delivered_po_items_grouped:
        for item_code, entry in delivered_po_items_grouped.items():
            ordered_qty = cint(po_item_map[item_code]["qty"])
            if item_code not in items_grouped and entry["qty"] < ordered_qty:
                is_fully_fulfilled = False
                
    if fresh_items_count + len(delivered_po_items_grouped) < len(po_item_map):
        is_fully_fulfilled = False
                
    return is_fully_fulfilled
        
def _set_purchase_receipt_items_and_details(pr, po_item_map, items_grouped):
    total_qty = total_amount = 0
    # Set PR Items
    for item_code, item_list in items_grouped.items():
        
        po_item = po_item_map[item_code]
        po_id = po_item["parent"]
        quantity = len(item_list)
        rate = po_item["rate"]
        uom = po_item["uom"]
        amount = quantity * rate
        total_qty += quantity
        total_amount += amount
        warehouse = None

        # Validate and assign warehouse
        if po_item["warehouse"]:
            wh = frappe.get_value("Warehouse", po_item["warehouse"], ["name", "is_group"])
            if wh and not wh[1]:  # is_group == 0
                warehouse = wh[0]
        
        pr.append("items", {
            "item_code": item_code,
            "qty": quantity,
            "rate": rate,
            "uom": uom,
            "amount": amount,
            "purchase_order": po_id,
            "warehouse": warehouse
        })
        
        # Set PR Items Detail
        for item in item_list:
            part = item.get("part", "")
            note = item.get("note", "")
            serial = item.get("serial", "")
            serial2 = item.get("serial2", "")
            sim_serial = item.get("sim_serial", "")
            device_type = item.get("device_type", "")

            pr.append("custom_item_details", {
                "device_requested": item_code,
                "device_serial": serial,
                "device_serial_2": serial2,
                "sim_serial": sim_serial,
                "device_type": device_type,
                "part": part,
                "note": note
            })
    
    pr.total_qty = total_qty
    pr.total = total_amount
    return pr

def _get_po_item_quantity_sum(po_id):
    return frappe.db.sql("""
        SELECT SUM(qty) 
        FROM `tabPurchase Order Item` 
        WHERE parent = %s
    """, (po_id,), as_list=1)[0][0] or 0
    
def _get_primary_address(link_doctype, link_name):
    
    address_rows = frappe.get_list(
        "Address",                     
        filters={
            "link_doctype": link_doctype,
            "link_name": link_name,
        },
        fields=[
            "name",
            "address_line1",
            "address_line2",
            "city",
            "county",
            "state",
            "country",
            "pincode",
            "email_id",
            "phone",
            "fax",
        ],
        limit=1,
    )

    address_info = address_rows[0] if address_rows else None

    if address_info:
        return {
            "address_line1": address_info['address_line1'],
            "address_line2": address_info['address_line2'],
            "city": address_info['city'],
            "county": address_info['county'],
            "state": address_info['state'],
            "country": address_info['country'],
            "pincode": address_info['pincode'],
            "email_id": address_info['email_id'],
            "phone": address_info['phone'],
            "fax": address_info['fax'],
        }
    return None

def _get_purchase_order_item_details(po):

    # Dictionary to accumulate quantities per item_code
    item_map = {}
    total_qty = 0

    for item in po.items:
        if item.item_code in item_map:
            # add up quantity if already exists
            item_map[item.item_code]["qty"] += int(item.qty)
        else:
            # first occurrence, create new entry
            item_map[item.item_code] = {
                "item_code": item.item_code,
                "item_name": item.item_name,
                "item_type": item.item_group,
                "qty": int(item.qty),
            }
        total_qty += int(item.qty)

    # return as list of dicts
    return total_qty, list(item_map.values())


# ===== Data Access Functions =====

@auth_required()
def _create_delivery_note(data):
    
    po_id = data.get("po_id")
    is_draft = data.get("is_draft")
    incoming_items = data.get("items", [])

    should_submit_purchase_receipt = not is_draft
    
    # Fetch Purchase Order
    po = _get_valid_purchase_order(po_id)
    if not po:
        return {
            "success": False,
            "message": f"Purchase Order '{po_id}' not found",
            "status_code": 404,
        }
    
    _validate_criteria_for_purchase_receipt_generation(po)
    
    # === Start transaction ===
    frappe.db.savepoint("delivery_note_creation")
    
    # Create Delivery Note
    pr = frappe.new_doc("Purchase Receipt")
    pr.custom_purchase_order = po.name
    pr.supplier = po.supplier
    pr.company = po.company
    pr.posting_date = nowdate()
    pr.set_missing_values()
    pr.calculate_taxes_and_totals()
    
    # Process Purchase Receipt Items & Items Details
    
    # Map PO Items by item_code
    po_item_map = _get_po_items_grouped(po)
    
    # Group incoming items by item_code
    items_grouped = _group_incoming_items(incoming_items, is_draft)

    # Group already delivered items by item_code
    delivered_po_items_grouped = _get_delivered_po_items_grouped(po_id)
    
    # Validate incoming quantity vs PO qty
    is_fully_fulfilled = _validate_incoming_quantity_against_po(po_id, po_item_map, items_grouped, delivered_po_items_grouped)
    
    # Set PR Items & PR Items Detail
    pr = _set_purchase_receipt_items_and_details(pr, po_item_map, items_grouped)

    # Save and submit PR
    if should_submit_purchase_receipt:
        pr.save()
        pr.submit()
        
        # Update PO status
        po.reload()
        workflow_action = "Fulfill" if is_fully_fulfilled else "Partial"
        handle_workflow(po, workflow_action)
        po.save()
        
        # Update requisition status
        if workflow_action == "Fulfill":
            _update_linked_device_requests(po_id)
    else:
        pr.save()
    
    frappe.db.commit()
    
    return {
        "success": True,
        "data": {
            "id": pr.name
        }
    }

@auth_required()
def _update_delivery_note_items_and_detail(data):
    
    dn_id = data.get("dn_id")
    is_draft = data.get("is_draft")
    incoming_items = data.get("items", [])
            
    should_submit_purchase_receipt = not is_draft
            
    # Fetch Purchase Receipt
    pr = _get_valid_purchase_receipt(dn_id)
    if not pr:
        return {
            "success": False,
            "message": f"Delivery Note '{dn_id}' not found",
            "status_code": 404,
        }
        
    if pr.workflow_state != "Draft":
        return {
            "success": False,
            "message": f"Purchase Receipt '{dn_id}' is already  in '{pr.workflow_state}' state",
            "status_code": 400,
        }
        
    # Fetch Purchase Order
    po_id = next((item.purchase_order for item in pr.items if item.purchase_order), None)
    po = _get_valid_purchase_order(po_id)
    if not po:
        return {
            "success": False,
            "message": f"Purchase Order '{po_id}' not found for this delivery note '{dn_id}'",
            "status_code": 404,
        }
        
    _validate_criteria_for_purchase_receipt_updation(po)
        
    # === Start transaction ===
    frappe.db.savepoint("delivery_note_updation")
    
    # Process Purchase Receipt Items Details & Update Delivery Note
    
    pr.posting_date = nowdate()
    
    # Map PO Items by item_code
    po_item_map = _get_po_items_grouped(po)
    
    # Group incoming items by item_code
    items_grouped = _group_incoming_items(incoming_items, is_draft)
    
    # Group already delivered items by item_code
    delivered_po_items_grouped = _get_delivered_po_items_grouped(po_id)
    
    # Validate incoming quantity vs PO qty
    is_fully_fulfilled = _validate_incoming_quantity_against_po(po_id, po_item_map, items_grouped, delivered_po_items_grouped)
    
    # Set PR Items & PR Items Detail
    pr.items.clear()
    pr.custom_item_details.clear()
    pr = _set_purchase_receipt_items_and_details(pr, po_item_map, items_grouped)

    # Save and submit PR        
    if should_submit_purchase_receipt:
        pr.save()
        pr.submit()
        
        # Update PO status
        po.reload()
        workflow_action = "Fulfill" if is_fully_fulfilled else "Partial"
        handle_workflow(po, workflow_action)
        po.save()
        
        # Update requisition status
        if workflow_action == "Fulfill":
            _update_linked_device_requests(po_id)
    else:
        pr.save()
        
    frappe.db.commit()
    
    return {
        "success": True,
        "data": {
            "id": pr.name
        }
    }
        
@auth_required()
def _get_delivery_notes_list(filters, start, page_size):
    
    # Fetch receipts
    receipts = frappe.get_list(
        "Purchase Receipt",
        filters=filters,
        fields=[
            "name as note_id",
            "posting_date as date_of_dispatch",
            "company as county",
            "workflow_state as status",
        ],
        order_by="posting_date desc",
        page_length=page_size,
        start=start
    )

    if not receipts:
        return {"delivery_notes_list": receipts, "total_delivery_notes": 0}

    # Aggregate item quantities per receipt
    receipt_details = [frappe.get_doc("Purchase Receipt", receipt.note_id) for receipt in receipts]
    
    item_map = {}
    for detail in receipt_details:
        for item in detail.items:
            pr_item = item.as_dict()
            qty = int(pr_item.qty)
            if detail.name in item_map:
                item_map[detail.name] += qty
            else:
                item_map[detail.name] = qty

    # Merge into receipts
    for r in receipts:
        r["total_items"] = int(item_map.get(r["note_id"], 0))

    # Total count
    total_count = frappe.db.count("Purchase Receipt", filters=filters)
    
    return {
        "delivery_notes_list": receipts,
        "total_delivery_notes": total_count
    }
        
@auth_required()
@sanitize_request
def _get_delivery_note_detail(note_id):
    
    # Get Purchase Receipt
    try:
        pr = frappe.get_doc("Purchase Receipt", note_id)
    except frappe.DoesNotExistError:
        return {
            "success": False,
            "message": f"Delivery Note not found.",
            "status_code": 404,
        }
    
    # Verify Purchase Order for Purchase Receipt   
    po_id = next((item.purchase_order for item in pr.items if item.purchase_order), None)
    if not po_id:
        return {
            "success": False,
            "message": f"No linked Purchase Order found for this Delivery Note.",
            "status_code": 404,
        }
    try:
        po = frappe.get_doc("Purchase Order", po_id)
    except frappe.DoesNotExistError:
        return {
            "success": False,
            "message": f"Purchase Order not found.",
            "status_code": 404,
        }
    
    # Format the Ordere Items details & Delivered Items details
    total_ordered_items, po_items_detail = _get_purchase_order_item_details(po)
    total_delivered_items, delivered_items_detail = _get_delivered_items_detail(po_id)
    
    # Get Purchase Receipt Attachments
    attachments = get_uploaded_documents("Purchase Receipt", note_id)
    
    # Format County & Supplier address
    county_address = _get_primary_address("Company", pr.company)
    supplier_address = _get_primary_address("Supplier", pr.supplier)
    
    # Prepare Delivery Note Items data with device details
    item_list = Counter()
    items_detail = []
    total_qty = 0
    if pr.custom_item_details:
        for row in pr.custom_item_details:
            item_list[row.device_requested] += 1
                
            items_detail.append(
                {
                    "item_code": row.device_requested,
                    "serial": row.device_serial,
                    "serial2": row.device_serial_2,
                    "sim_serial": row.sim_serial,
                    "device_type": row.device_type,
                    "part": row.part,
                    "note": row.note,
                }
            )
            total_qty += 1
        
    return {
        "success": True,
        "data": {
            "note_id":              pr.name,
            "po_id":                po_id,
            "posting_date":         pr.posting_date,
            "supplier":             pr.supplier,
            "supplier_address":     supplier_address,
            "county":               pr.company,
            "county_address":       county_address,            
            "status":               pr.workflow_state,
            "total_ordered_items":  total_ordered_items,
            "total_items":          total_qty,
            "total_delivered_items": total_delivered_items,
            "items_list":           item_list,
            "items_detail":         items_detail,
            "po_items_detail":      po_items_detail,
            "delivered_items_detail": delivered_items_detail,
            "attachment":           attachments
        }
    }
    
@auth_required()
def _handle_delivery_note_workflow(note_id):
    
    # Get Purchase Receipt
    try:
        pr = frappe.get_doc("Purchase Receipt", note_id, fieldname="name")
    except frappe.DoesNotExistError:
        return {
            "success": False,
            "message": f"Delivery Note '{note_id}' not found.",
            "status_code": 404,
        }
        
    if pr.workflow_state == "Draft":
        return {
            "success": False,
            "message": f"Delivery note '{note_id} is in 'Draft' state. Needs to be dispatched by vendor.",
            "status_code": 400,
        }

    # === Start transaction ===
    frappe.db.savepoint("delivery_note_state_updation")
    
    # Update delivery note workflow state
    handle_workflow(pr, "Approve")
    
    # Update requisition workflow state
    po = _get_valid_purchase_order(pr.custom_purchase_order)
    if po and po.workflow_state == "Fulfilled":
        _update_linked_device_requests(pr.custom_purchase_order)
    
    return {
        "success": True
    }
    
    
# ===== API Functions =====

@frappe.whitelist(methods=['POST'])
def create_delivery_note(**kwargs):
    """
    Create Delivery Note from given items for a specific Purchase Order.
    Args:
        data (dict): {
            "po_id": str,
            "is_draft": str,
            "items": [{"item_code": str, "serial": str, "serial2": str, "sim_serial": str, "device_type": str, "part": str, "note": str}]
        }
    Returns:
        dict: API response with success status and delivery note name
    """
    
    try:
        expected_data = ["po_id", "is_draft", "items"]
        required_data = [("po_id", "Purchase Order ID"), ("is_draft", "Draft Status"), ("items", "Items List")]

        request_data = _read_query_params(kwargs, expected_data)
        _validate_request_data(request_data, required_data)
        if not isinstance(request_data.get("items"), list):
            frappe.throw(_("Items ('items') must be a list."), frappe.ValidationError)    
        if request_data.get("is_draft") not in [1, 0]:
            frappe.throw(_("Invalid Draft Status ('is_draft') value. Use 1 or 0."), frappe.ValidationError)
          
        delivery_note_creation = _create_delivery_note(request_data)
        if not delivery_note_creation.get("success"):
            return api_response(success=False, message=delivery_note_creation.get("message"), status_code=delivery_note_creation.get("status_code"))
            
        delivery_note = delivery_note_creation.get("data")
        
        return api_response(
            success=True,
            message=f"Delivery Note '{delivery_note['id']}' created successfully",
            data={"delivery_note": delivery_note["id"]},
            status_code=201
        )
        
    except PermissionError as pe:
        return api_response(success=False, message=str(pe), status_code=403)

    except ValidationError as ve:
        frappe.db.rollback()
        frappe.log_error(frappe.get_traceback(), "Delivery Note Creation Failed")
        msg = str(ve)
        if isinstance(ve, UniqueValidationError):
            msg = _format_duplicate_entry_validation_msg(msg)
                
        return api_response(success=False, message=msg, status_code=400)

    except AuthError as ae:
        return api_response(success=False, message=ae.message, status_code=ae.status_code)
    
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(frappe.get_traceback(), "Delivery Note Creation Failed")
        return api_response(success=False, message="Failed to create Delivery Note", status_code=500)
    

@frappe.whitelist(methods=['PUT'])
def update_delivery_note_items_and_detail(**kwargs):
    """
    Update Delivery Note from given device details.
    Args:
        data (dict): {
            "po_id": str,
            "is_draft": str,
            "items": [{"item_code": str, "serial": str, "serial2": str, "sim_serial": str, "device_type": str, "part": str, "note": str}]
        }
    Returns:
        dict: API response with success status and delivery note name
    """
    
    try:
        
        expected_data = ["dn_id", "is_draft", "items"]
        required_data = [("dn_id", "Delivery Note ID"), ("is_draft", "Draft Status"), ("items", "Items List")]
        
        request_data = _read_query_params(kwargs, expected_data)
        _validate_request_data(request_data, required_data)
        if not isinstance(request_data.get("items"), list):
            frappe.throw(_("Items ('items') must be a list."), frappe.ValidationError)    
        if request_data.get("is_draft") not in [1, 0]:
            frappe.throw(_("Invalid Draft Status ('is_draft') value. Use 1 or 0."), frappe.ValidationError)
            
        delivery_note_creation = _update_delivery_note_items_and_detail(request_data)
        if not delivery_note_creation.get("success"):
            return api_response(success=False, message=delivery_note_creation.get("message"), status_code=delivery_note_creation.get("status_code"))
            
        delivery_note = delivery_note_creation.get("data")
        
        return api_response(
            success=True,
            message=f"Delivery Note '{delivery_note['id']}' updated successfully",
            data={"delivery_note": {delivery_note["id"]}},
            status_code=201
        )
    
    except PermissionError as pe:
        return api_response(success=False, message=str(pe), status_code=403)

    except ValidationError as ve:
        frappe.db.rollback()
        frappe.log_error(frappe.get_traceback(), "Delivery Note Updation Failed")
        msg = str(ve)
        if isinstance(ve, UniqueValidationError):
            msg = _format_duplicate_entry_validation_msg(msg)

        return api_response(success=False, message=msg, status_code=400)

    except AuthError as ae:
        return api_response(success=False, message=ae.message, status_code=ae.status_code)
    
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(frappe.get_traceback(), "Delivery Note Updation Failed")
        return api_response(success=False, message="Failed to update Delivery Note", status_code=500)
      
        
@frappe.whitelist(methods=["GET"])
@sanitize_request
def fetch_all_delivery_notes(**kwargs):
    """
    List delivery notes (Purchase Receipts).

    Args:
        filter (str): One of  'all' | 'dispatched' | 'delivered' | 'draft'
        from_date (str): Optional filter start date (YYYY-MM-DD).
        to_date (str): Optional filter end date (YYYY-MM-DD).
        limit  (int): page size   (default 10)
        page   (int): page number (default 1)

    Returns:
        api_response(...) with:
          data        → list[dict]  Note ID, Date Of Dispatch, County, Total Items, Status
          pagination  → { total_count, per_page, current_page, total_pages }
          
        "data": [
            {
                "note_id": "MAT-PRE-2025-00024",
                "date_of_dispatch": "2025-08-25",
                "county": "Tiberbu",
                "status": "Dispatched by Vendor",
                "total_items": 21
            }
        ]
    """
    try:
        expected_data = ["filter", "from_date", "to_date", "purchase_order", "county", "search", "limit", "page"]
        required_data = [("filter", "Filter")]
        
        request_data = _read_query_params(kwargs, expected_data)
        _validate_request_data(request_data, required_data)
        page_size, start = _build_pagination_params(request_data)
        delivery_notes_filters = _build_delivery_notes_filter(request_data)
         
        delivery_notes_response = _get_delivery_notes_list(delivery_notes_filters, start, page_size)
        
        # Return Result
        return api_response(
            success=True,
            data=delivery_notes_response.get("delivery_notes_list"),
            status_code=200,
            pagination=_paginate(start, page_size, delivery_notes_response.get("total_delivery_notes"))
        )
        
    except PermissionError as pe:
        frappe.db.rollback()
        api_response(success=False, message=str(pe), status_code=403)

    except ValidationError as ve:
        frappe.db.rollback()
        return api_response(success=False, message=str(ve), status_code=400)

    except AuthError as ae:
        return api_response(success=False, message=ae.message, status_code=ae.status_code)
    
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(frappe.get_traceback(),
                         "Fetch Delivery Notes API Error")
        return api_response(
            success=False,
            message=_("Failed to fetch delivery notes."),
            status_code=500
        )


@frappe.whitelist(methods=["GET"])
@sanitize_request
def fetch_delivery_note(note_id: str = None):
    """
    Return the full detail of a single delivery note record (stored as Purchase Receipt).

    Args:
        note_id (str): required

    Returns:
        Complete note detail with items detail.
        "data": {
            "note_id": "MAT-PRE-2025-00024",
            "po_id": "PUR-ORD-2025-00026",
            "posting_date": "2025-08-25",
            "supplier": "Safaricom",
            "supplier_address": null,
            "county": "Tiberbu",
            "county_address": null,
            "status": "Dispatched by Vendor",
            "total_ordered_items": 25,
            "total_items": 21,
            "total_delivered_items": 25,
            "items_list": {
                "Laptop": 12,
                "PHONE": 4,
                "TABLET": 5
            },
            "items_detail": [
                {
                    "item_code": "Laptop",
                    "serial": "SN00123456789012010098711140",
                    "serial2": "SN00123456789012010098711140",
                    "sim_serial": "SN00123456789012010098711140",
                    "device_type": "Products",
                    "part": "PART-1234",
                    "note": "This is a note for the item"
                }
            ],
            "po_items_detail": [
                {
                    "item_code": "Laptop",
                    "item_name": "LAPTOP",
                    "item_type": "Products",
                    "qty": 15
                }
            ],
            "delivered_items_detail": [
                {
                    "item_code": "TABLET",
                    "item_name": "TABLET",
                    "item_type": "Products",
                    "qty": 5
                }
            ],
            "attachment": []
        }
    """
    try:
        required_data = [("note_id", "Delivery Note ID")]
        _validate_request_data({"note_id": note_id}, required_data)
        
        delivery_note_info = _get_delivery_note_detail(note_id)
        if not delivery_note_info.get("success"):
            return api_response(success=False, message=delivery_note_info.get("message"), status_code=delivery_note_info.get("status_code"))
            
        delivery_note_detail = delivery_note_info.get("data")
        
        
        # Prepare response
        data = {
            "note_id":              delivery_note_detail["note_id"],
            "po_id":                delivery_note_detail["po_id"],
            "posting_date":         delivery_note_detail["posting_date"],
            "supplier":             delivery_note_detail["supplier"],
            "supplier_address":     delivery_note_detail["supplier_address"],
            "county":               delivery_note_detail["county"],
            "county_address":       delivery_note_detail["county_address"],            
            "status":               delivery_note_detail["status"],
            "total_ordered_items":  delivery_note_detail["total_ordered_items"],
            "total_items":          delivery_note_detail["total_items"],
            "total_delivered_items": delivery_note_detail["total_delivered_items"],
            "items_list":           delivery_note_detail["items_list"],
            "items_detail":         delivery_note_detail["items_detail"],
            "po_items_detail":      delivery_note_detail["po_items_detail"],
            "delivered_items_detail": delivery_note_detail["delivered_items_detail"],
            "attachment":           delivery_note_detail["attachment"]
        }

        return api_response(success=True, data=data, status_code=200)

        
    except PermissionError as pe:
        return api_response(success=False, message=str(pe), status_code=403)
    
    except ValidationError as ve:
        return api_response(success=False, message=str(ve), status_code=400)

    except AuthError as ae:
        return api_response(success=False, message=ae.message, status_code=ae.status_code)
    
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Fetch Delivery Note API Error")
        return api_response(
            success=False,
            message="Failed to fetch delivery note due to an unexpected error.",
            status_code=500,
        )


@frappe.whitelist(methods=["PUT"])
def delivery_notes_workflow_states_handler(note_id: str = None):
    """
    Delivery Notes workflow states handler.
    """
    try:
        required_data = [("note_id", "Delivery Note ID")]
        request_data = {"note_id": note_id}
        _validate_request_data(request_data, required_data)
    
        workflow_info = _handle_delivery_note_workflow(note_id)
        if not workflow_info.get("success"):
            return api_response(success=False, message=workflow_info.get("message"), status_code=workflow_info.get("status_code"))
        
        return api_response(
                success=True,
                message="Delivery note acknowledged successfully.",
                data={
                    "note_id": note_id
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
        frappe.log_error(frappe.get_traceback(), "Deliver Note Acknowledgment Error")
        return api_response(
            success=False,
            message="Failed to acknowledge Delivery Note due to an internal error.",
            status_code=500
        )
