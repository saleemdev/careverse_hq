import frappe
from frappe import _
from frappe.utils import cint
from frappe.exceptions import ValidationError, PermissionError
import json
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

def _validate_request_data(params: dict, required_fields: list[str] = None) -> None:
    """
    Validate request params. Raises frappe.ValidationError on failure.
    - Checks required fields exist.
    """
    required_fields = required_fields or []
    
    # Check required fields
    for field in required_fields:
        if not params.get(field):
            frappe.throw(f"Missing required field: {field}", frappe.ValidationError)
 
def _build_aggregation_filter(params, filter_for="subcounty"):
    filters = []

    if params.get("from_date"):
        filters.append(["creation", ">=", params["from_date"]])

    if params.get("to_date"):
        filters.append(["creation", "<=", params["to_date"]])

    if params.get("status") is not None and params["status"] != "": # docstatus can be 0, 1, 2
        filters.append(["docstatus", "=", params["status"]])

    if params.get("workflow_state"):
        filters.append(["workflow_state", "=", params["workflow_state"]])

    if params.get("county_id"):
        filters.append(["county", "=", params["county_id"]])
        
    if filter_for == "subcounty":
        if params.get("search"):
            filters.append(["sub_county", "like", f"%{params['search']}%"])
            
    if filter_for == "county":
        if params.get("search"):
            filters.append(["county", "like", f"%{params['search']}%"])
        
    return filters      


# ===== Data Access Functions =====

@auth_required()
def _get_county_aggregation(filters):
    
    county_aggregation = frappe.get_list(
        "Health Automation Device Request",
        filters=filters,
        fields=[
            "county as county_id",
            "county as county_name",
            "COUNT(DISTINCT name) as total_requisitions",
            # emulate CASE WHEN by using SUM(IF(...))
            "CAST(SUM(IF(docstatus = 1, 1, 0)) AS UNSIGNED) as approved",
            "CAST(SUM(IF(docstatus = 0, 1, 0)) AS UNSIGNED) as pending",
            "CAST(SUM(IF(docstatus = 2, 1, 0)) AS UNSIGNED) as rejected",
        ],
        group_by="county",
        order_by="county"
    )
    
    return county_aggregation

@auth_required()
def _get_subcounty_aggregation(filters, start, page_size):

    subcounty_aggregation = frappe.get_list(
        "Health Automation Device Request",
        filters=filters,
        fields=[
            "sub_county as sub_county_id",
            "sub_county as sub_county_name",
            "COUNT(DISTINCT name) as total_requisitions",
            "CAST(SUM(quantity) AS UNSIGNED) as total_devices_requested",
            "COUNT(DISTINCT health_facility) as requested_facilities",
            # emulate CASE WHEN by using SUM(IF(...))
            "CAST(SUM(IF(docstatus = 1, 1, 0)) AS UNSIGNED) as approved",
            "CAST(SUM(IF(docstatus = 0, 1, 0)) AS UNSIGNED) as pending",
            "CAST(SUM(IF(docstatus = 2, 1, 0)) AS UNSIGNED) as rejected",
        ],
        group_by="sub_county",
        order_by="sub_county",
        start=start,
        page_length=page_size
    )
    
    requested_items_summary = frappe.get_list(
        "Health Automation Device Request",
        filters=filters,
        fields=[
            "device_requested as item_id",
            "device_requested as item_name",
            "CAST(SUM(quantity) AS UNSIGNED) as total_requested",
        ],
        group_by="device_requested"
    )
    
    total_count_summary = frappe.get_list(
        "Health Automation Device Request",
        filters=filters,
        fields=[
            "COUNT(name) as total_requisitions",
            "COUNT(distinct sub_county) as total_subcounties",
        ]
    )
    total_count_summary = total_count_summary[0] if total_count_summary else {"total_requisitions": 0, "total_subcounties": 0}
    
    return {
        "sub_counties": subcounty_aggregation,
        "items_summary": requested_items_summary,
        "total_requisitions": total_count_summary.get("total_requisitions"),
        "total_sub_counties": total_count_summary.get("total_subcounties")
    }


# ===== Data Access Functions =====

@auth_required()
def _get_county_aggregation_v1(filters):
    """
    Get county aggregation by fetching raw data and aggregating in Python.
    Avoids SQL aggregate functions that are restricted in AWS RDS.
    """
    from collections import defaultdict
    
    # Fetch raw data without complex SQL aggregations
    raw_data = frappe.get_list(
        "Health Automation Device Request",
        filters=filters,
        fields=[
            "name",
            "county",
            "docstatus"
        ],
        order_by="county"
    )
    
    # Validate we have data with required fields
    for row in raw_data:
        if not row.get('county'):
            frappe.throw("County field is required but found empty/null value", frappe.ValidationError)
    
    # Aggregate in Python
    county_map = defaultdict(lambda: {
        "requisition_names": set(),
        "approved": 0,
        "pending": 0,
        "rejected": 0
    })
    
    for row in raw_data:
        county = row['county']
        county_map[county]['requisition_names'].add(row['name'])
        
        if row['docstatus'] == 1:
            county_map[county]['approved'] += 1
        elif row['docstatus'] == 0:
            county_map[county]['pending'] += 1
        elif row['docstatus'] == 2:
            county_map[county]['rejected'] += 1
    
    # Convert to list format matching original structure
    county_aggregation = []
    for county, data in sorted(county_map.items()):
        county_aggregation.append({
            "county_id": county,
            "county_name": county,
            "total_requisitions": len(data['requisition_names']),
            "approved": data['approved'],
            "pending": data['pending'],
            "rejected": data['rejected']
        })
    
    return county_aggregation


@auth_required()
def _get_subcounty_aggregation_v1(filters, start, page_size):
    """
    Get subcounty aggregation by fetching raw data and aggregating in Python.
    Avoids SQL aggregate functions that are restricted in AWS RDS.
    """
    from collections import defaultdict
    
    # Fetch raw data without complex SQL aggregations
    raw_data = frappe.get_list(
        "Health Automation Device Request",
        filters=filters,
        fields=[
            "name",
            "sub_county",
            "quantity",
            "health_facility",
            "docstatus",
            "device_requested"
        ],
        order_by="sub_county"
    )
    
    # Validate required fields
    for row in raw_data:
        if not row.get('sub_county'):
            frappe.throw("Sub-county field is required but found empty/null value", frappe.ValidationError)
        if row.get('quantity') is None:
            frappe.throw("Quantity field is required but found null value", frappe.ValidationError)
        if not row.get('device_requested'):
            frappe.throw("Device requested field is required but found empty/null value", frappe.ValidationError)
    
    # Aggregate by sub-county
    subcounty_map = defaultdict(lambda: {
        "requisition_names": set(),
        "facilities": set(),
        "total_quantity": 0,
        "approved": 0,
        "pending": 0,
        "rejected": 0
    })
    
    # Aggregate by device/item
    items_map = defaultdict(int)
    
    # Track unique sub-counties
    unique_subcounties = set()
    
    for row in raw_data:
        sub_county = row['sub_county']
        unique_subcounties.add(sub_county)
        
        # Sub-county aggregation
        subcounty_map[sub_county]['requisition_names'].add(row['name'])
        subcounty_map[sub_county]['facilities'].add(row['health_facility'])
        subcounty_map[sub_county]['total_quantity'] += int(row.get('quantity', 0))
        
        if row['docstatus'] == 1:
            subcounty_map[sub_county]['approved'] += 1
        elif row['docstatus'] == 0:
            subcounty_map[sub_county]['pending'] += 1
        elif row['docstatus'] == 2:
            subcounty_map[sub_county]['rejected'] += 1
        
        # Items aggregation
        items_map[row['device_requested']] += int(row.get('quantity', 0))
    
    # Convert sub-county map to list format
    subcounty_list = []
    for sub_county, data in sorted(subcounty_map.items()):
        subcounty_list.append({
            "sub_county_id": sub_county,
            "sub_county_name": sub_county,
            "total_requisitions": len(data['requisition_names']),
            "total_devices_requested": data['total_quantity'],
            "requested_facilities": len(data['facilities']),
            "approved": data['approved'],
            "pending": data['pending'],
            "rejected": data['rejected']
        })
    
    # Apply pagination to sub-county list
    total_subcounties = len(subcounty_list)
    paginated_subcounties = subcounty_list[start:start + page_size]
    
    # Convert items map to list format
    items_summary = []
    for device, total_qty in sorted(items_map.items()):
        items_summary.append({
            "item_id": device,
            "item_name": device,
            "total_requested": total_qty
        })
    
    # Calculate totals
    total_requisitions = len(raw_data)
    
    return {
        "sub_counties": paginated_subcounties,
        "items_summary": items_summary,
        "total_requisitions": total_requisitions,
        "total_sub_counties": total_subcounties
    }


# ===== API Functions =====

@frappe.whitelist(methods=["GET"])
@sanitize_request
def get_subcounty_requisition_aggregation(**kwargs):
    """
    Get aggregation of device requisitions by sub-county.

    Args:
        from_date (str): Optional filter start date (YYYY-MM-DD).
        to_date (str): Optional filter end date (YYYY-MM-DD).
        status (str): Optional filter for request action status.
        workflow_state (str): Optional filter for request workflow status.
        limit (int): Filter for pagination.
        page (int): Filter for pagination.
    
    Returns:
        dict: Total requisitions, Total sub-counties, Summary by sub-county, Summary by item, Pagination
        "data": {
            "sub_counties": [
                {
                    "sub_county_id": "Kabete",
                    "sub_county_name": "Kabete",
                    "total_requisitions": 5,
                    "total_devices_requested": 34,
                    "requested_facilities": 4,
                    "approved": 2,
                    "pending": 3,
                    "rejected": 0
                }
            ],
            "items_summary": [
                {
                    "item_id": "TABLET",
                    "item_name": "TABLET",
                    "total_requested": 5
                }
            ],
            "total_requisitions": 10,
            "total_sub_counties": 3
        }
    """
    try:
        expected_data = ["from_date", "to_date", "status", "workflow_state", "county_id", "search", "limit", "page"]
        
        request_data = _read_query_params(kwargs, expected_data)
        page_size, start = _build_pagination_params(request_data)
        subcounty_filters = _build_aggregation_filter(request_data)
        
        aggregation_response = _get_subcounty_aggregation_v1(subcounty_filters, start, page_size)
        
        # Return Combined Result
        return api_response(
            success=True,
            data={
                "sub_counties": aggregation_response.get("sub_counties"),
                "items_summary": aggregation_response.get("items_summary"),
                "total_requisitions": aggregation_response.get("total_requisitions"),
                "total_sub_counties": aggregation_response.get("total_sub_counties")
            },
            status_code=200,
            pagination=_paginate(start, page_size, aggregation_response.get("total_sub_counties"))
        )


    except PermissionError as pe:
        return api_response(success=False, message=str(pe), status_code=403)
    
    except ValidationError as ve:
        return api_response(success=False, message=str(ve), status_code=400)

    except AuthError as ae:
        return api_response(success=False, message=ae.message, status_code=ae.status_code)
    
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Sub-County Requisitions Aggragation API Error")
        return api_response(
            success=False,
            message="Failed to fetch subcounty requisitions aggregation.",
            status_code=500
        )
    
    
@frappe.whitelist(methods=["GET"])
@sanitize_request
def get_county_requisition_aggregation(**kwargs):
    """
    Get aggregation of device requisitions by county.

    Args:
        from_date (str): Optional filter start date (YYYY-MM-DD).
        to_date (str): Optional filter end date (YYYY-MM-DD).
        status (str): Optional filter for request action status.
        workflow_state (str): Optional filter for request workflow status.

    Returns:
        dict array: API response with requisition count and status breakdown by county.
        "data": [
            {
                "county_id": "Kabete",
                "county_name": "Kabete",
                "total_requisitions": 3,
                "approved": 1,
                "pending": 2,
                "rejected": 0
            }
        ]
    """
    try:
        expected_data = ["from_date", "to_date", "status", "workflow_state"]
        
        request_data = _read_query_params(kwargs, expected_data)
        county_filters = _build_aggregation_filter(request_data)
        
        county_aggregation = _get_county_aggregation_v1(county_filters)
        
        # Return Result
        return api_response(
            success=True,
            data=county_aggregation,
            status_code=200
        )


    except PermissionError as pe:
        return api_response(success=False, message=str(pe), status_code=403)
    
    except ValidationError as ve:
        return api_response(success=False, message=str(ve), status_code=400)

    except AuthError as ae:
        return api_response(success=False, message=ae.message, status_code=ae.status_code)
    
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "County Requisitions Aggragation API Error")
        return api_response(
            success=False,
            message="Failed to fetch county requisitions aggregation.",
            status_code=500
        )