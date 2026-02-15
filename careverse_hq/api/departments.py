import frappe, re
from typing import Any, Dict
from .utils import api_response, sanitize_request
from healthpro_erp.healthpro_erp.decorators.permissions import auth_required, AuthError

# ===== Helper Functions =====

def _format_duplicate_entry_validation_msg(error_msg):
    m = re.search(r"Duplicate entry '([^']+)' for key '([^']+)'", error_msg)
    if m:
        dup_value, dup_field = m.groups()
        field_label = dup_field.replace("_", " ").title()
        msg = "Department already exist with primary field '{}'. Please provide a unique value as department name.".format(dup_value)
        return msg
    return error_msg

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

def _build_department_filter(params):
    filters = []

    if params.get("department_name"):
        filters.append(["department_name", "like", "%{}%".format(params["department_name"])])

    if params.get("facility_id"):
        filters.append(["parent_department", "like", "%{}%".format(params["facility_id"])])

    return filters
   
# ===== Data Access Functions =====

@auth_required()
def _create_department(data):
    
    department_name = data.get("department_name")
    facility_id = data.get("facility_id")
    
    # Make sure Health Facility exists
    try:
        health_facility = frappe.get_doc("Health Facility", facility_id)
    except frappe.DoesNotExistError as de:
        raise frappe.ValidationError(
            "No Health Facility found with facility id: '{}'".format(facility_id)
        )
    
    # Make sure Health Facility is configured as Department
    facility_department = frappe.db.get_list(
        "Department",
        filters={"name": ["like", "%{}%".format(facility_id)]},
        fields=["name", "company"],
        limit=1,
    )

    if not facility_department:
        raise frappe.ValidationError(
            "Health Facility '{}' is not configured as Department".format(facility_id)
        )
    parent_department = facility_department[0].name
    company = facility_department[0].company
        
    # Create Department
    department_doc = frappe.new_doc("Department")
    department_doc.department_name = department_name
    department_doc.parent_department = parent_department
    department_doc.company = company
    try:
        department_doc.insert()
    except frappe.DuplicateEntryError as de:
        raise frappe.ValidationError(
            _format_duplicate_entry_validation_msg(str(de))
        )
    
    return department_doc

@auth_required()
def _update_department(data):
    
    department_id = data.get("department_id")
    department_name = data.get("department_name", None)
    facility_id = data.get("facility_id", None)
    
    # Make sure Department exists
    try:
        department = frappe.get_doc("Department", department_id)
    except frappe.DoesNotExistError as de:
        raise frappe.ValidationError(
            "No Department found with id: '{}'".format(department_id)
        )
    
    # Set Department data to update
    if department_name:
        department.department_name = department_name
        
    if facility_id:    
        # Make sure Health Facility exists
        try:
            health_facility = frappe.get_doc("Health Facility", facility_id)
        except frappe.DoesNotExistError as de:
            raise frappe.ValidationError(
                "No Health Facility found with facility id: '{}'".format(facility_id)
            )
    
        # Make sure Health Facility is configured as Department
        facility_department = frappe.db.get_list(
            "Department",
            filters={"name": ["like", "%{}%".format(facility_id)]},
            fields=["name", "company"],
            limit=1,
        )

        if not facility_department:
            raise frappe.ValidationError(
                "Health Facility '{}' is not configured as Department".format(facility_id)
            )
        parent_department = facility_department[0].name
        company = facility_department[0].company
        
        department.parent_department = parent_department
        department.company = company
        
    # Update Department
    department.save()
    
    return department

@auth_required()
def _fetch_departments(department_filters, start, page_size):
    
    # Filter out the Departments, which are Health Facilities
    department_filters.append(
        ["custom_is_health_facility", "=", "0"]
    )
    
    # Fetch departments
    departments = frappe.get_list(
        "Department",
        filters=department_filters,
        fields=[
            "name as department_id",
            "department_name",
            "parent_department",
            "company"
        ],
        order_by="creation desc",
        page_length=page_size,
        start=start
    )
    
    if not departments:
        return {"department_list": departments, "total_departments": 0}
    
    # Total count
    department_count = frappe.db.count("Department", filters=department_filters)

    return {
        "department_list": departments,
        "total_departments": department_count
    }
    
@auth_required()
def _delete_department(data):
    
    department_id = data.get("department_id")
    
    try:
        department = frappe.get_doc("Department", department_id)
        department.delete()
    except frappe.DoesNotExistError:
        raise frappe.ValidationError(
            "No Department found with id: '{}'".format(department_id)
        )
    
    return department_id

# ===== API Functions =====

@frappe.whitelist(methods=['POST'])
def create_department(**kwargs):
    """
    Create Department using request payload.
    Args:
        data (dict): {
            "department_name": str,
            "facility_id": str
        }
    Returns:
        dict: API response with success status and department name and id
        {
            "status": "success",
            "data": {
                "department_id": "abc123 - N",
                "department_name": "abc123",
                "parent_department": "231 - N",
                "company": "Nairobi"
            },
            "message": "Department 'abc123' created successfully"
        }
    """
    try:
        expected_data = ["department_name", "facility_id"]
        required_data = [("department_name", "Department Name"), ("facility_id", "Facility ID")]

        request_data = _read_query_params(kwargs, expected_data)
        _validate_request_data(request_data, required_data)
        
        department_creation = _create_department(request_data)

        return api_response(
            success=True,
            message="Department '{}' created successfully".format(department_creation.department_name),
            data={
                "department_id": department_creation.name,
                "department_name": department_creation.department_name,
                "parent_department": department_creation.parent_department,
                "company": department_creation.company
            },
            status_code=201
        )
        
    except PermissionError as pe:
        return api_response(success=False, message=str(pe), status_code=403)

    except frappe.ValidationError as ve:
        frappe.log_error(frappe.get_traceback(), "Department Creation Failed")                
        return api_response(success=False, message=str(ve), status_code=400)

    except AuthError as ae:
        return api_response(success=False, message=ae.message, status_code=ae.status_code)
    
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Department Creation Failed")
        return api_response(success=False, message="Failed to create Department", status_code=500)

@frappe.whitelist(methods=['PUT'])
def update_department(**kwargs):
    """
    Update Department using request payload.
    Args:
        data (dict): {
            "department_id": str,
            "department_name": str,
            "facility_id": str
        }
    Returns:
        dict: API response with success status and department name and id
        {
            "status": "success",
            "data": {
                "department_id": "abc - N",
                "department_name": "abc4561",
                "parent_department": "435 - K",
                "company": "Kabete"
            },
            "message": "Department 'abc - N' updated successfully"
        }
    """
    try:
        expected_data = ["department_id", "department_name", "facility_id"]
        required_data = [("department_id", "Department ID")]

        request_data = _read_query_params(kwargs, expected_data)
        _validate_request_data(request_data, required_data)
        
        department_updation = _update_department(request_data)
        
        return api_response(
            success=True,
            message="Department '{}' updated successfully".format(department_updation.name),
            data={
                "department_id": department_updation.name,
                "department_name": department_updation.department_name,
                "parent_department": department_updation.parent_department,
                "company": department_updation.company
            },
            status_code=200
        )
        
    except PermissionError as pe:
        return api_response(success=False, message=str(pe), status_code=403)

    except frappe.ValidationError as ve:
        frappe.log_error(frappe.get_traceback(), "Department Updation Failed")                
        return api_response(success=False, message=str(ve), status_code=400)

    except AuthError as ae:
        return api_response(success=False, message=ae.message, status_code=ae.status_code)
    
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Department Updation Failed")
        return api_response(success=False, message="Failed to update Department", status_code=500)

@frappe.whitelist(methods=['GET'])
@sanitize_request
def fetch_departments(**kwargs):
    """
    Fetch Department list. It will fetch only internal Departments which are not Facilities.
    Args:
        department_name (str): Optional filter on department name.
        facility_id (str): Optional filter on parent department.
        limit  (int): page size   (default 10)
        page   (int): page number (default 1)
    Returns:
        dict: API response with success status and department list
        {
            "status": "success",
            "data": [
                {
                    "department_id": "abc - N",
                    "department_name": "abc4561",
                    "parent_department": "435 - K",
                    "company": "Kabete"
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
        expected_data = ["department_name", "facility_id", "limit", "page"]

        request_data = _read_query_params(kwargs, expected_data)
        page_size, start = _build_pagination_params(request_data)
        department_filters = _build_department_filter(request_data)
        
        departments_response = _fetch_departments(department_filters, start, page_size)
        
        return api_response(
            success=True,
            data=departments_response.get("department_list"),
            status_code=200,
            pagination=_paginate(start, page_size, departments_response.get("total_departments"))
        )
        
    except PermissionError as pe:
        return api_response(success=False, message=str(pe), status_code=403)

    except frappe.ValidationError as ve:
        frappe.log_error(frappe.get_traceback(), "Department fetch Failed")                
        return api_response(success=False, message=str(ve), status_code=400)

    except AuthError as ae:
        return api_response(success=False, message=ae.message, status_code=ae.status_code)
    
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Department fetch Failed")
        return api_response(success=False, message="Failed to fetch Department", status_code=500)

@frappe.whitelist(methods=['DELETE'])
def delete_department(**kwargs):
    """
    Delete Department using department id.
    Args:
        data (dict): {
            "department_id": str
        }
    Returns:
        dict: API response with success status and id
        {
            "status": "success",
            "data": {
                "department_id": "abc123 - N"
            },
            "message": "Department 'abc123 - N' deleted successfully"
        }
    """
    try:
        expected_data = ["department_id"]
        required_data = [("department_id", "Department ID")]

        request_data = _read_query_params(kwargs, expected_data)
        _validate_request_data(request_data, required_data)
        
        department_id = _delete_department(request_data)
        
        return api_response(
            success=True,
            message="Department '{}' deleted successfully".format(department_id),
            data={
                "department_id": department_id
            },
            status_code=200
        )
        
    except PermissionError as pe:
        return api_response(success=False, message=str(pe), status_code=403)

    except frappe.ValidationError as ve:
        frappe.log_error(frappe.get_traceback(), "Department deletion Failed")                
        return api_response(success=False, message=str(ve), status_code=400)

    except AuthError as ae:
        return api_response(success=False, message=ae.message, status_code=ae.status_code)
    
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Department deletion Failed")
        return api_response(success=False, message="Failed to delete Department", status_code=500)