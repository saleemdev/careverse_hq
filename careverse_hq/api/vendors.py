import frappe, re
from typing import Any, Dict
from .utils import api_response, sanitize_request
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
            missing_fields.append("{display} ('{field}')".format(display=display_name, field=field))

    if missing_fields:
        message = "Missing required fields: " + ", ".join(missing_fields)
        frappe.throw(message, frappe.ValidationError)

def _build_vendor_filter(params):
    filters = []

    if params.get("supplier_name"):
        filters.append(["supplier_name", "like", "%{}%".format(params["supplier_name"])])

    return filters
   
# ===== Data Access Functions =====

@auth_required()
def _fetch_vendors(vendor_filters, start, page_size):
    
    # Fetch departments
    vendors = frappe.get_list(
        "Supplier",
        filters=vendor_filters,
        fields=[
            "name as supplier_id",
            "supplier_name"
        ],
        order_by="creation desc",
        page_length=page_size,
        start=start
    )
    
    if not vendors:
        return {"vendor_list": vendors, "total_vendors": 0}
    
    # Total count
    vendor_count = frappe.db.count("Supplier", filters=vendor_filters)

    return {
        "vendor_list": vendors,
        "total_vendors": vendor_count
    }

# ===== API Functions =====

@frappe.whitelist(methods=['GET'])
@sanitize_request
def fetch_vendors(**kwargs):
    """
    Fetch Vendors list.
    Args:
        supplier_name (str): Optional filter on supplier name.
        limit  (int): page size   (default 10)
        page   (int): page number (default 1)
    Returns:
        dict: API response with success status and department list
        {
            "status": "success",
            "data": [
                {
                    "supplier_id": "Safaricom",
                    "supplier_name": "Safaricom"
                }
            ],
            "pagination": {
                "current_page": 1,
                "per_page": 10,
                "total_count": 1,
                "total_pages": 1
            }
        }
    """
    try:
        expected_data = ["supplier_name"]

        request_data = _read_query_params(kwargs, expected_data)
        page_size, start = _build_pagination_params(request_data)
        vendor_filters = _build_vendor_filter(request_data)
        
        vendor_response = _fetch_vendors(vendor_filters, start, page_size)
        
        return api_response(
            success=True,
            data=vendor_response.get("vendor_list"),
            status_code=200,
            pagination=_paginate(start, page_size, vendor_response.get("total_vendors"))
        )
        
    except PermissionError as pe:
        return api_response(success=False, message=str(pe), status_code=403)

    except frappe.ValidationError as ve:
        frappe.log_error(frappe.get_traceback(), "Vendor fetch Failed")                
        return api_response(success=False, message=str(ve), status_code=400)

    except AuthError as ae:
        return api_response(success=False, message=ae.message, status_code=ae.status_code)
    
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Vendor fetch Failed")
        return api_response(success=False, message="Failed to fetch Vendors", status_code=500)
