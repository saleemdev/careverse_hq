import json
import frappe
from frappe import _
import math
from frappe.utils import get_datetime
from careverse_hq.api.facilities import api_response
from healthpro_erp.healthpro_erp.decorators.permissions import auth_required
from datetime import datetime
from typing import Dict, Optional, Any


@frappe.whitelist()
@auth_required()
def generate_assets_from_purchase_order(**kwargs):
    """
    API endpoint to generate Health Automation Devices from Purchase Receipt items.
    
    Args:
        purchase_receipt (str): Name of the Purchase Receipt document
        
    Returns:
        dict: API response with success status and created devices
    """
    kwargs.pop("cmd", None)
    
    # Validate required field
    purchase_receipt = kwargs.get('purchase_receipt', None)
    if not purchase_receipt:
        return api_response(
            success=False,
            message="purchase_receipt is required!",
            status_code=400,
        )
    
    # Call the internal function
    return _generate_assets(purchase_receipt)


def _generate_assets(purchase_receipt,new_state = None):
    """
    Internal function to generate devices from Purchase Receipt.
    
    Args:
        purchase_receipt (str): Name of the Purchase Receipt document
        
    Returns:
        dict: Response with success status and created devices
    """
    # Try to load the provided Purchase Receipt
    try:
        pr = frappe.get_doc("Purchase Receipt", purchase_receipt)
    except frappe.PermissionError:
        return api_response(
            success=False,
            message="Permission denied to access this record",
            status_code=403,
        )
    except frappe.DoesNotExistError:
        return api_response(
            success=False,
            message="Purchase receipt not found",
            status_code=404,
        )
    except Exception as e:
        frappe.log_error(
            title="Error Fetching Purchase Receipt",
            message=f"PR: {purchase_receipt}\nError: {frappe.get_traceback()}"
        )
        return api_response(
            success=False,
            message="An error occurred while fetching Purchase Receipt!",
            status_code=500,
        )
    # check if we are on the correct workflow state
    if new_state:
        workflow_state = new_state
    else: 
        workflow_state = pr.get('workflow_state')
    
    
    if not workflow_state == "Received by Facility":
        return api_response(
            success=False,
            message="Status invalid. Verify that the facility has confirmed the purchase order.",
            status_code=400,
        )
    
    # Check if devices were already created for this Purchase Receipt
    custom_devices_created = pr.get('custom_devices_created')
    if custom_devices_created:
        return api_response(
            success=False,
            message="Items for this purchase receipt have already been created!",
            status_code=400,
        )
    
    # Check item details
    item_list = pr.get("custom_item_details", [])
    if not item_list:
        return api_response(
            success=False,
            message="No items found to add",
            status_code=400,
        )
    
    # Get requisition to retrieve health facility
    requisitions = frappe.get_all(
        "Health Automation Device Request",
        filters={"purchase_order": pr.get("custom_purchase_order")},
        limit=1,
        pluck="health_facility"
    )

    if not requisitions:
        return api_response(
            success=False,
            message="No requisition found for this purchase order",
            status_code=400,
        )
    
    # Load Health Facility
    try:
        h_facility = frappe.get_doc("Health Facility", requisitions[0])
    except frappe.DoesNotExistError:
        return api_response(
            success=False,
            message="Health facility does not exist",
            status_code=404,
        )
    except Exception as e:
        frappe.log_error(
            title="Error Loading Health Facility",
            message=f"Facility: {requisitions[0]}\nError: {frappe.get_traceback()}"
        )
        return api_response(
            success=False,
            message="Error loading health facility",
            status_code=500,
        )
    
    # Log operation start
    frappe.log_error(
        title="Device Generation Started",
        message=f"PR: {purchase_receipt}\nFacility: {h_facility.name}\nItems: {len(item_list)}"
    )
    
    # Create devices within a transaction
    created_devices = []
    skipped_items = []
    
    try:
        for idx, item in enumerate(item_list):
            device_serial = item.get("device_serial")
            
            # Skip items without required fields
            if not device_serial or not item.get("device_type"):
                skipped_items.append({
                    "index": idx + 1,
                    "reason": "Missing device_serial or device_type"
                })
                continue
            
            # Check for duplicate device serial
            existing = frappe.db.exists(
                "Health Automation Device",
                {"device_serial": device_serial}
            )
            if existing:
                skipped_items.append({
                    "index": idx + 1,
                    "device_serial": device_serial,
                    "reason": "Device serial already exists"
                })
                continue
            
            # Prepare device data
            item_data = {
                "device_serial": device_serial,
                "device_serial_2": item.get("device_serial_2"),
                "sim_serial": item.get("sim_serial"),
                "device_type": item.get("device_type"),
                "device_name": item.get("note"),
                "health_facility": h_facility.get("name"),
                "health_facility_name": h_facility.get("facility_name"),
                "county": h_facility.get("county"),
                "health_department": h_facility.get("department"),
                "subcounty": h_facility.get("sub_county"),
                "asset_type": "Movable",
                "order_number": pr.get("custom_purchase_order"),
            }
            
            # Create the device
            device = save_automation_device(item_data)
            if device:
                created_devices.append({
                    "name": device.name,
                    "device_serial": device.device_serial,
                    "device_type": device.device_type
                })
        
        # If no devices were created, rollback and return error
        if not created_devices:
            frappe.db.rollback()
            return api_response(
                success=False,
                message="No valid devices could be created",
                data={"skipped_items": skipped_items},
                status_code=400,
            )
        
         
        frappe.db.set_value(
            "Purchase Receipt",
            purchase_receipt,
            "custom_devices_created",
            1,
            update_modified=False 
        )
        
        # Commit the transaction
        frappe.db.commit()
        
        # Log success
        frappe.log_error(
            title="Device Generation Completed",
            message=f"PR: {purchase_receipt}\nCreated: {len(created_devices)}\nSkipped: {len(skipped_items)}"
        )
        
        response_data = {
            "devices_created": created_devices,
            "total_created": len(created_devices),
        }
        
        if skipped_items:
            response_data["skipped_items"] = skipped_items
            response_data["total_skipped"] = len(skipped_items)
        
        return api_response(
            success=True,
            message=f"Successfully created {len(created_devices)} device(s)",
            data=response_data,
            status_code=200,
        )
        
    except Exception as e:
        # Rollback on any error
        frappe.db.rollback()
        frappe.log_error(
            title="Device Generation Failed",
            message=f"PR: {purchase_receipt}\nError: {frappe.get_traceback()}"
        )
        return api_response(
            success=False,
            message="Failed to create devices. Transaction rolled back.",
            status_code=500,
        )

def save_automation_device(data):
    """
    Create and save a Health Automation Device.
    
    Args:
        data (dict): Device data including device_serial, device_name, device_type, etc.
        
    Returns:
        Document: Created device document or None on failure
        
    Raises:
        frappe.ValidationError: If validation fails
        frappe.PermissionError: If user lacks permissions
    """
    try:
        # Validate required fields
        required_fields = ["device_serial", "device_name", "device_type"]
        
        for field in required_fields:
            if not data.get(field):
                raise frappe.ValidationError(f"{field} is required")
        
        # Create the document
        device = frappe.get_doc({
            "doctype": "Health Automation Device",
            **data
        })
        
        # Validate and insert
        device.insert()
        
        # Optionally submit if workflow requires it
        # device.submit()
        
        return device
        
    except frappe.ValidationError as e:
        frappe.log_error(
            title="Device Validation Error",
            message=f"Device Serial: {data.get('device_serial')}\nError: {str(e)}"
        )
        raise
        
    except frappe.PermissionError as e:
        frappe.log_error(
            title="Device Permission Error",
            message=f"User: {frappe.session.user}\nError: {str(e)}"
        )
        raise
        
    except Exception as e:
        frappe.log_error(
            title="Device Creation Error",
            message=f"Device Serial: {data.get('device_serial')}\nError: {frappe.get_traceback()}"
        )
        raise

def auto_generate_assets(doc, method):
    """
    Hook to auto-generate devices when Purchase Receipt workflow state changes
    """
    # Check if workflow_state has changed to "Received by Facility"
    if doc.has_value_changed('workflow_state') and doc.workflow_state == "Received by Facility":
        doc_name = doc.name
        
        if doc.get('custom_devices_created'):
            frappe.log_error(
                title="{}: Device Creation Skipped".format(doc_name),
                message="Devices already created for {}".format(doc_name)
            )
            return
        
        frappe.log_error(
            title="{}: Creation of Devices initialized".format(doc_name),
            message="Creating items for {} initialized".format(doc_name)
        )

        frappe.enqueue(
            "careverse_hq.api.asset_management._generate_assets",
            queue="long",
            timeout=None,
            is_async=True,
            job_name="{}: Device Creation".format(doc_name),
            purchase_receipt = doc_name,
            new_state = doc.workflow_state
        )


@frappe.whitelist()
@auth_required()
def get_assets_metrics(**kwargs):
    kwargs.pop('cmd',None)

    # Validate required field
    facility = kwargs.get('facility_id', None)
    organization = kwargs.get('org_id', None)
    region = kwargs.get('region_id', None)
    
    provided = [f for f in [facility, organization, region] if f]

    if len(provided) != 1:
        return api_response(
            success=False,
            message="Please provide either: facility_id, org_id, or region_id",
            status_code=400,
        )
    
    if organization:
        #load the organization to get the facilities ids
        # Get requisition to retrieve health facility
        facilities = frappe.get_all(
            "Health Facility",
            filters={"healthcare_organization": organization},
            pluck="name"
        )
    
    if region:
        #load the organization to get the facilities ids
        # Get requisition to retrieve health facility
        facilities = frappe.get_all(
            "Health Facility",
            filters={"healthcare_organization_region": region},
            pluck="name"
        )
    
    if facility:
        facilities=[facility]

    status_counts = frappe.get_all(
        "Health Automation Device",
        filters={
            "health_facility": ["in", facilities]
        },
        fields=["status", "count(*) as count"],
        group_by="status"
    )
    

    # Convert to a dictionary for easy access
    counts = {item["status"]: item["count"] for item in status_counts}

    data = {
        "total_assets": sum(counts.values()),
        "assigned_assets": counts.get("Assigned", 0),
        "available_assets": counts.get("Unassigned", 0),
        "decommissioned_assets": counts.get("Decommissioned", 0)
    }

    return api_response(
            success=True,
            message="Asset metrics retrieved successfully.",
            data=data,
            status_code=200,
        )


@frappe.whitelist()
@auth_required()
def get_assets(**kwargs):
    """
    Retrieves a paginated list of assets belonging to a facility, organization, or region.
    Supports searching, filtering, and sorting.
    """
    kwargs.pop('cmd', None)
    
    try:
        # Validate scope (facility, org, or region)
        scope_result = _validate_scope(kwargs)
        if not scope_result['valid']:
            return scope_result['response']
        
        facilities = scope_result['facilities']
        
        # Parse and validate query parameters
        params_result = _parse_query_params(kwargs)
        if not params_result['valid']:
            return params_result['response']
        
        params = params_result['params']
        
        # Build filters for database query
        filters = {"health_facility": ["in", facilities]}
        
        if params['status']:
            filters["status"] = params['status'].capitalize()
        
        if params['asset_type']:
            filters["asset_type"] = params['asset_type'].capitalize()
            
        
        # Handle search - Frappe 15 compatible
        or_filters = []
        if params['search']:
            search_term = f"%{params['search']}%"
            or_filters = [
                ["device_serial", "like", search_term],
                ["device_serial_2", "like", search_term],
                ["device_name", "like", search_term]
            ]
        
        # Get total count for pagination
        total_items = frappe.db.count(
            "Health Automation Device",
            filters=filters
        )
        
        # Apply search filter separately for count if needed
        if or_filters:
            total_items = len(frappe.get_all(
                "Health Automation Device",
                filters=filters,
                or_filters=or_filters,
                pluck="name"
            ))
        
        # Calculate pagination
        total_pages = math.ceil(total_items / params['limit']) if total_items > 0 else 1
        start = (params['page'] - 1) * params['limit']
        
        # Fetch assets with pagination
        assets = frappe.get_all(
            "Health Automation Device",
            filters=filters,
            or_filters=or_filters if or_filters else None,
            fields=[
                "name as id",
                "device_serial as serial_number",
                "device_name",
                "device_type as category",
                "status",
                "order_number",
                "assigned_to_employee",
                "service_point",
                "health_department",
                "health_facility",
                "creation as created_at",
                "modified as updated_at"

             ],
            start=start,
            page_length=params['limit'],
            order_by="creation desc"
        )
        
        # Format response data
        items = _format_assets(assets)
        
        # Build response
        return api_response(
            success=True,
            message="Assets retrieved successfully.",
            status_code=200,
            data={
                "items": items,
                "pagination": {
                    "page": params['page'],
                    "limit": params['limit'],
                    "total_items": total_items,
                    "total_pages": total_pages
                }
            }
        )
    
    except frappe.PermissionError:
        return api_response(
            success=False,
            message="You do not have permission to view assets.",
            status_code=403,
        )
    
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Get Assets API Error"))
        return api_response(
            success=False,
            message="An unexpected error occurred while retrieving assets.",
            status_code=500,
        )


def _validate_scope(kwargs):
    """Validate and get facilities based on scope (facility, org, or region)"""
    facility = kwargs.get('facility_id')
    organization = kwargs.get('org_id')
    region = kwargs.get('region_id')
    
    provided = [f for f in [facility, organization, region] if f]

    if len(provided) != 1:
        return {
            'valid': False,
            'response': api_response(
                success=False,
                message="Please provide exactly one of: facility_id, org_id, or region_id",
                status_code=400,
            )
        }
    
    facilities = []
    
    if organization:
        if not frappe.db.exists("Healthcare Organization", organization):
            return {
                'valid': False,
                'response': api_response(
                    success=False,
                    message=f"Organization with ID '{organization}' not found.",
                    status_code=404,
                )
            }
        
        facilities = frappe.get_all(
            "Health Facility",
            filters={"healthcare_organization": organization},
            pluck="name"
        )
    
    elif region:
        if not frappe.db.exists("Healthcare Organization Region", region):
            return {
                'valid': False,
                'response': api_response(
                    success=False,
                    message=f"Region with ID '{region}' not found.",
                    status_code=404,
                )
            }
        
        facilities = frappe.get_all(
            "Health Facility",
            filters={"healthcare_organization_region": region},
            pluck="name"
        )
    
    elif facility:
        if not frappe.db.exists("Health Facility", facility):
            return {
                'valid': False,
                'response': api_response(
                    success=False,
                    message=f"Facility with ID '{facility}' not found.",
                    status_code=404,
                )
            }
        
        facilities = [facility]
    
    return {'valid': True, 'facilities': facilities}


def _parse_query_params(kwargs):
    """Parse and validate query parameters"""
    # Parse pagination parameters
    try:
        page = int(kwargs.get('page', 1))
        limit = int(kwargs.get('limit', 20))
    except (ValueError, TypeError):
        return {
            'valid': False,
            'response': api_response(
                success=False,
                message="Invalid pagination parameters.",
                status_code=422,
                details={
                    "page": "Must be a positive integer.",
                    "limit": "Must be an integer between 1 and 100."
                }
            )
        }
    
    # Validate pagination parameters
    if page < 1:
        return {
            'valid': False,
            'response': api_response(
                success=False,
                message="Invalid pagination parameters.",
                status_code=422,
                details={"page": "Must be a positive integer."}
            )
        }
    
    if limit < 1:
        return {
            'valid': False,
            'response': api_response(
                success=False,
                message="Invalid pagination parameters.",
                status_code=422,
                details={"limit": "Must be greater than 1."}
            )
        }
    
    # Validate status filter
    status = kwargs.get('status')
    valid_statuses = ['assigned', 'unassigned', 'decommissioned']
    if status and status.lower() not in valid_statuses:
        return {
            'valid': False,
            'response': api_response(
                success=False,
                message=f"Invalid query parameter: status must be one of 'assigned', 'unassigned', or 'decommissioned'.",
                status_code=400
            )
        }
    
    # Validate asset_type filter
    asset_type = kwargs.get('asset_type')
    valid_asset_types = ['equipment', 'fixed', 'movable', 'intangible']
    if asset_type and asset_type.lower() not in valid_asset_types:
        return {
            'valid': False,
            'response': api_response(
                success=False,
                message=f"Invalid query parameter: asset_type must be one of {', '.join(valid_asset_types)}.",
                status_code=400
            )
        }
    
    
    return {
        'valid': True,
        'params': {
            'page': page,
            'limit': limit,
            'status': status,
            'asset_type': asset_type,
            'search': kwargs.get('search')
        }
    }


def _format_assets(assets):
    """Format assets for API response"""
    items = []
    
    for asset in assets:
        assignment = _build_assignment(asset)
        supplier_doc = frappe.get_doc("Purchase Order", asset['order_number'])
        health_facility_doc = load_doctype("Health Facility",asset['health_facility'], ["name", "facility_name"])
        if health_facility_doc.get('success'):
                asset['health_facility'] = health_facility_doc.get('data')
            

        item = {
            "id": asset['id'],
            "serial_number": asset['serial_number'],
            "asset_name": asset['device_name'],
            "category": asset['category'],
            "health_facility": asset['health_facility'],
            "status": asset['status'],
            "supplier": supplier_doc.get('supplier'),
            "assignment":assignment,
            "created_at": asset['created_at'].isoformat() if asset.get('created_at') else None,
            "updated_at": asset['updated_at'].isoformat() if asset.get('updated_at') else None
        }
        items.append(item)
    
    return items

def _build_assignment(asset):
    """Build assignment object for an asset"""
    assignment = {}
    
    if asset.get('service_point'):
        sp_doc = frappe.get_doc("Service Points", asset['service_point'])
        assignment['service_point'] = {
            "id": sp_doc.name,
            "name": sp_doc.service_point_name or sp_doc.name
        }
    
    if asset.get('health_department'):
        dept_doc = frappe.get_doc("Department", asset['health_department'])
        assignment['department'] = {
            "id": dept_doc.name,
            "name": dept_doc.department_name or dept_doc.name
        }
    
    if asset.get('assigned_to_employee'):
        hp_doc = frappe.get_doc("Employee", asset['assigned_to_employee'])
        assignment['health_professional'] = {
            "id": hp_doc.name,
            "name": ("{} {}".format(hp_doc.first_name,hp_doc.last_name)) or hp_doc.name
        }
    
    return assignment if assignment else None

@frappe.whitelist()
#@auth_required()
def asset_unassignment(**kwargs):
    """
    Main endpoint for asset un assignment operations.
    Unassigns a Health Automation Device to service points, departments, or health professionals.
    """
    kwargs.pop('cmd', None)

    # Validate required field
    asset = kwargs.get('asset')
    if not asset:
        return api_response(
            success=False,
            message="Asset is required!",
            status_code=400,
        )
    
    return _unassign_asset(**kwargs)

def _unassign_asset(**kwargs) -> Dict[str, Any]:
    """
    Core logic for assigning assets to various entities.
    Handles service points, departments, and health professionals.
    """
    # Extract parameters
    service_point_id = kwargs.get('service_point_id')
    department_id = kwargs.get('department_id')
    health_professional_id = kwargs.get('health_professional_id')
    asset = kwargs.get('asset')
    action = kwargs.get('action', "Unassign")
    
    # Validate at least one assignment target is provided
    if not any([service_point_id, department_id, health_professional_id]):
        return api_response(
            success=False,
            message="Please provide at least one of: service_point_id, department_id, or health_professional_id",
            status_code=400,
        )
    
    # Load the device
    device_result = load_doctype("Health Automation Device", asset)
    if not device_result.get('success'):
        return api_response(
            success=False,
            message=device_result.get('message'),
            status_code=device_result.get('status_code',400),
        ) 
    if isinstance(device_result, dict) and not device_result.get('success', True):
        return device_result
    
    ha = device_result.get("data",{})
    
    # Get current assignments
    current_service_point = ha.get('service_point')
    current_department = ha.get('health_department')
    current_assigned_to_employee = ha.get('assigned_to_employee')

    

    resutls_errors = []
    assignment ={}
    # Process each assignment type
    try:
        # Service Point Assignment
        if service_point_id:
            if current_service_point != service_point_id and action == "Unassign":
                return {
                    "success":False,
                    "message":"The provided service point is not assigned to this device",
                    "status_code":400,
                }
            result = create_assignment(
                    asset, action, 'Service Point', service_point_id
                )
            if result:
                if not result.get('success'):
                    resutls_errors.append(result.get('message'))
                else:
                    assignment['service_point']=service_point_id
        
        # Department Assignment
        if department_id:
            if current_department != department_id and action == "Unassign":
                return {
                    "success":False,
                    "message":"The provided department is not assigned to this device",
                    "status_code":400,
                }
            # Perform assignment
            result = create_assignment(
                    asset, action, 'Department', department_id
                )
            if result:
                if not result.get('success'):
                    resutls_errors.append(result.get('message'))
                else:
                    assignment['department']=department_id
        
        # Health Professional Assignment
        if health_professional_id:
            if current_assigned_to_employee != health_professional_id and action == "Unassign":
                return {
                    "success":False,
                    "message":"The provided health professional is not assigned to this device",
                    "status_code":400,
                }
            result = create_assignment(
                    asset, action, 'Employee', health_professional_id
                )
            if result:
                if not result.get('success'):
                    resutls_errors.append(result.get('message'))
                else:
                    assignment['health_professional']=health_professional_id
        
        if resutls_errors:
            frappe.db.rollback()
            separator = ','
            message = separator.join(str(n) for n in resutls_errors)
            return api_response(
                success=False,
                message=message,
                status_code=400,
            )
        
        # Update device service point field
        d = frappe.get_doc("Health Automation Device", asset)
        try:
            if service_point_id:
                d.service_point = None
            if health_professional_id:
                d.assigned_to_employee = None
                d.employee_name = None
            if department_id:
                d.health_department = None
            
            # If no assignments left, set status to Unassigned
            if not d.service_point and not d.assigned_to_employee and not d.health_department:
                d.status = "Unassigned"
            else:
                d.status = "Assigned"

            d.save()
            
            data = {
                "asset_id": asset,
                "status": "Unassign",
                "unassigned_from": assignment,
                "unassigned_by": frappe.utils.get_fullname(),
                "unassigned_at": datetime.now()
            }
            frappe.db.commit()
            return api_response(
                success=True,
                message="Asset unassigned successfully.",
                data=data,
                status_code=200,
            )
        
        except Exception as e:
            frappe.log_error(title="Assigning Asset Error",message="Error: ".format(str(e)))
            frappe.db.rollback()
            return api_response(
                success=False,
                message="An error occured while assigning the asset",
                status_code=500,
            )
        
        
        
        
    except Exception as e:
        frappe.log_error(
            title="Asset Assignment Error",
            message=f"Asset: {asset}\nError: {frappe.get_traceback()}"
        )
        return api_response(
            success=False,
            message="An error occurred during asset assignment",
            status_code=500,
        )




@frappe.whitelist()
@auth_required()
def asset_assignment(**kwargs):
    """
    Main endpoint for asset assignment operations.
    Assigns a Health Automation Device to service points, departments, or health professionals.
    """
    kwargs.pop('cmd', None)

    # Validate required field
    asset = kwargs.get('asset')
    if not asset:
        return api_response(
            success=False,
            message="Asset is required!",
            status_code=400,
        )
    
    return _assign_asset(**kwargs)


def _assign_asset(**kwargs) -> Dict[str, Any]:
    """
    Core logic for assigning assets to various entities.
    Handles service points, departments, and health professionals.
    """
    # Extract parameters
    service_point_id = kwargs.get('service_point_id')
    department_id = kwargs.get('department_id')
    health_professional_id = kwargs.get('health_professional_id')
    asset = kwargs.get('asset')
    action = kwargs.get('action', "Assign")
    
    # Validate at least one assignment target is provided
    if not any([service_point_id, department_id, health_professional_id]):
        return api_response(
            success=False,
            message="Please provide at least one of: service_point_id, department_id, or health_professional_id",
            status_code=400,
        )
    
    # Load the device
    device_result = load_doctype("Health Automation Device", asset)
    if not device_result.get('success'):
        return api_response(
            success=False,
            message=device_result.get('message'),
            status_code=device_result.get('status_code',400),
        ) 
    if isinstance(device_result, dict) and not device_result.get('success', True):
        return device_result
    
    ha = device_result.get("data",{})
    
    # Get current assignments
    current_service_point = ha.get('service_point')
    current_department = ha.get('health_department')
    current_assigned_to_employee = ha.get('assigned_to_employee')

    resutls_errors = []
    assignment ={}
    # Process each assignment type
    try:
        # Service Point Assignment
        if service_point_id:
            result = _assign_to_service_point(
                ha, asset, service_point_id, current_service_point, action
            )
            if result:
                if not result.get('success'):
                    resutls_errors.append(result.get('message'))
                else:
                    assignment['service_point']=result.get('data',{}).get('assignment_id')
        
        # Department Assignment
        if department_id:
            result = _assign_to_department(
                ha, asset, department_id, current_department, action
            )
            if result:
                if not result.get('success'):
                    resutls_errors.append(result.get('message'))
                else:
                    assignment['department']=result.get('data',{}).get('assignment_id')
        
        # Health Professional Assignment
        if health_professional_id:
            result = _assign_to_health_professional(
                ha, asset, health_professional_id, current_assigned_to_employee, action
            )
            if result:
                if not result.get('success'):
                    resutls_errors.append(result.get('message'))
                else:
                    assignment['health_professional']=result.get('data',{}).get('assignment_id')
        
        if resutls_errors:
            frappe.db.rollback()
            separator = ','
            message = separator.join(str(n) for n in resutls_errors)
            return api_response(
                success=False,
                message=message,
                status_code=400,
            )
        
        # Update device service point field
        d =frappe.get_doc("Health Automation Device", asset)
        try:
            if service_point_id:
                d.service_point = service_point_id
            if health_professional_id:
                d.assigned_to_employee = health_professional_id
            if department_id:
                d.health_department = department_id
            d.status = "Assigned"

            d.save()
            
            data={
                "asset_id":asset,
                "status":"Assign",
                "assigned_to":assignment,
                "assigned_by":frappe.utils.get_fullname(),
                "assigned_at":datetime.now()
            }
            frappe.db.commit()
            return api_response(
                success=True,
                message="Asset assigned successfully.",
                data=data,
                status_code=200,
            )
        
        except Exception as e:
            frappe.log_error(title="Assigning Asset Error",message="Error: ".format(str(e)))
            frappe.db.rollback()
            return api_response(
                success=False,
                message="An error occured while assigning the asset",
                status_code=500,
            )
        
        
        
        
    except Exception as e:
        frappe.log_error(
            title="Asset Assignment Error",
            message=f"Asset: {asset}\nError: {frappe.get_traceback()}"
        )
        return api_response(
            success=False,
            message="An error occurred during asset assignment",
            status_code=500,
        )


def _assign_to_service_point(
    device: Any,
    asset: str,
    service_point_id: str,
    current_service_point: Optional[str],
    action: str
) -> Optional[Dict[str, Any]]:
    """Handle service point assignment with validation."""
    
    # Check if already assigned
    if current_service_point == service_point_id and action == "Assign":
        return {
            "success":True,
            "message":"The provided service point is already assigned to this device",
            "data":{"assignment_id":service_point_id},
            "status_code":200,
        }
    
    # Load service point
    sp_result = load_doctype("Service Points", service_point_id)
    if isinstance(sp_result, dict) and not sp_result.get('success', True):
        return sp_result
    
    sp = sp_result.get('data',{})
    
    # Validate health facility match
    service_point_health_facility = sp.get('health_facility')
    device_health_facility = device.get('health_facility')

    if not service_point_health_facility or not device_health_facility:
        return {
            "success":False,
            "message":"Health facility must exist in both the Service Point and the Device",
            "status_code":400,
        }
    
    if service_point_health_facility != device_health_facility:
        return {
            "success":False,
            "message":"Health facility mismatch between Service Point and Device",
            "status_code":400,
        }
    
    # Perform assignment
    assignment_result = create_assignment(
        asset, action, 'Service Point', service_point_id
    )
    
    
    return {
        "success":True,
        "message":f"Device {action.lower()}ed to Service Point successfully",
        "data":{"assignment_id": service_point_id},
        "status_code":200,
    }


def _assign_to_department(
    device: Any,
    asset: str,
    department_id: str,
    current_department: Optional[str],
    action: str
) -> Optional[Dict[str, Any]]:
    """Handle department assignment with validation."""
    
    # Check if already assigned
    if current_department == department_id and action == "Assign":
        return {
            "success":True,
            "message":"The provided department is already assigned to this device",
            "data":{"assignment_id": department_id},
            "status_code":200,
        }
    
    # Load department
    dept_result = load_doctype("Department", department_id)
    if isinstance(dept_result, dict) and not dept_result.get('success', True):
        return dept_result
    
    dept = dept_result.get('data',{})
    
    # Validate health facility match
    department_health_facility = dept.get('custom_health_facility')
    device_health_facility = device.get('health_facility')

    if not department_health_facility or not device_health_facility:
        return {
            "success":False,
            "message":"Health facility must exist in both the Department and the Device",
            "status_code":400,
        }
    
    if department_health_facility != device_health_facility:
        return {
            "success":False,
            "message":"Health facility mismatch between Department and Device",
            "status_code":400,
        }
    
    # Perform assignment
    assignment_result = create_assignment(
        asset, action, 'Department', department_id
    )
    
    return {
        "success":True,
        "message":f"Device {action.lower()}ed to Department successfully",
        "data":{"assignment_id": department_id},
        "status_code":200,
    }


def _assign_to_health_professional(
    device: Any,
    asset: str,
    health_professional_id: str,
    current_assigned_to_employee: Optional[str],
    action: str
) -> Optional[Dict[str, Any]]:
    """Handle health professional assignment with validation."""
    
    # Check if already assigned
    if current_assigned_to_employee == health_professional_id and action == "Assign":
        return {
            "success":True,
            "message":"The provided health professional is already assigned to this device",
            "data":{"assignment_id": health_professional_id},
            "status_code":200,
        }
    
    # Load health professional
    hp_result = load_doctype("Employee", health_professional_id)
    if isinstance(hp_result, dict) and not hp_result.get('success', True):
        return hp_result
    
    hp = hp_result.get('data',{})
    # Perform assignment
    assignment_result = create_assignment(
        asset, action, 'Employee', health_professional_id
    )
    return {
        "success":True,
        "message":f"Device {action.lower()}ed to Health Professional successfully",
        "data":{"assignment_id": health_professional_id},
        "status_code":200,
    }


def load_doctype(doctype: str, doc_id: str, fields: list = None) -> Any:
    """
    Safely load a doctype with comprehensive error handling.
    
    Args:
        doctype: The doctype name
        doc_id: The document ID
        fields: Optional list of fields to fetch. If None, fetches all fields.
        
    Returns:
        Document object or error response dict
    """
    try:
        if fields:
            # Use frappe.get_value to fetch specific fields
            data = frappe.get_value(doctype, doc_id, fields, as_dict=True)
            if not data:
                raise frappe.DoesNotExistError
        else:
            # Fetch full document
            data = frappe.get_doc(doctype, doc_id)
        
        return {
            "success": True,
            "data": data,
        }
    except frappe.PermissionError:
        return {
            "success": False,
            "message": f"Permission denied to access {doctype}",
            "status_code": 403,
        }
    except frappe.DoesNotExistError:
        return {
            "success": False,
            "message": f"{doctype} not found",
            "status_code": 404
        }
    except Exception as e:
        frappe.log_error(
            title=f"Error Fetching {doctype}",
            message=f"{doctype}: {doc_id}\nError: {frappe.get_traceback()}"
        )
        return {
            "success": False,
            "message": f"An error occurred while fetching {doctype}",
            "status_code": 500,
        }
    
def create_assignment(
    asset: str,
    action: str,
    assignment_type: str,
    assignment_id: str
) -> str:
    """
    Create an assignment record in the device allocation history.
    
    Args:
        asset: Device ID
        action: Action type (Assign/Unassign)
        assignment_type: Type of assignment
        assignment_id: ID of the entity being assigned
        
    Returns:
        Name of the created assignment row
    """
    # Get the parent document with permission check
    automation_device = frappe.get_doc('Health Automation Device', asset)
    
    # Prepare assignment data
    assignment_data = {
        "action": action,
        "assignment_type": assignment_type,
        "assignment_id": assignment_id,
        "timestamp_assigned": datetime.now(),
        "assigned_by": frappe.session.user
    }
    
    try:
        # Append to child table
        assignment_row = automation_device.append("device_allocation_history", assignment_data)
    
        # Save with permission check
        automation_device.save()
        return {
            "success":True,
            "data":assignment_row.name,
        }
    except Exception as e:
        return {
            "success":False,
            "message":str(e),
        }
    

@frappe.whitelist()
@auth_required()
def asset_decommission(**kwargs):
    """
    Main endpoint for asset un assignment operations.
    Unassigns a Health Automation Device to service points, departments, or health professionals.
    """
    kwargs.pop('cmd', None)

    # Validate required field
    asset = kwargs.get('asset')
    reason = kwargs.get('reason')
    if not asset or not reason:
        return api_response(
            success=False,
            message="Asset and Reason are required!",
            status_code=400,
        )
    
    return _decommission_asset(**kwargs)

def _decommission_asset(**kwargs) -> Dict[str, Any]:
    """
    Core logic for assigning assets to various entities.
    Handles service points, departments, and health professionals.
    """
    # Extract parameters
    reason = kwargs.get('reason')
    asset = kwargs.get('asset')
    action = kwargs.get('action', "Decommission")
    
   # Load the device
    device_result = load_doctype("Health Automation Device", asset)
    if not device_result.get('success'):
        return api_response(
            success=False,
            message=device_result.get('message'),
            status_code=device_result.get('status_code',400),
        ) 
    if isinstance(device_result, dict) and not device_result.get('success', True):
        return device_result
    
    ha = device_result.get("data",{})
    
    # Get current assignments
    current_status = ha.get('status')
    if current_status == "Decommissioned":
        return api_response(
            success=False,
            message="The device is already decommissioned",
            status_code=400,
        )

    try:
        if ha.employee_name:
                create_assignment(
                    asset, action, 'Employee', None
                )
        if ha.health_department:
            create_assignment(
                asset, action, 'Department', None
            )
            
        if ha.service_point:
            create_assignment(
                asset, action, 'Service Point', None
            )

        try:
            d = frappe.get_doc("Health Automation Device", asset)
            if d.employee_name:
                d.assigned_to_employee = None
                d.employee_name = None
            if d.health_department:
                d.health_department = None
                
            if d.service_point:
                d.service_point = None
            
            d.status = "Decommissioned"
            d.decommission_reason = reason
            
            d.save()
            
            data = {
                "asset_id": asset,
                "status": "Decommissioned",
                "decommissioned_by": frappe.utils.get_fullname(),
                "decommissioned_at": datetime.now()
            }
            frappe.db.commit()
            return api_response(
                success=True,
                message="Asset Decommissioned successfully.",
                data=data,
                status_code=200,
            )
        
        except Exception as e:
            frappe.log_error(title="Decommissioning Asset Error",message="Error: ".format(str(e)))
            frappe.db.rollback()
            return api_response(
                success=False,
                message="An error occured while Decommissioning the asset",
                status_code=500,
            )
        
        
        
        
    except Exception as e:
        frappe.log_error(
            title="Asset Deccomission Error",
            message=f"Asset: {asset}\nError: {frappe.get_traceback()}"
        )
        return api_response(
            success=False,
            message="An error occurred during asset Deccomission",
            status_code=500,
        )
    

@frappe.whitelist()
@auth_required()
def get_single_asset(**kwargs) -> Dict[str, Any]:
    kwargs.pop('cmd', None)

    allowed_filters = ['asset_id', 'device_serial','sim_serial']
    
    # Validate input parameters
    keys = [filter for filter in allowed_filters if filter in kwargs.keys()]
    
    if len(keys) != 1:
        frappe.local.response["http_status_code"] = 400
        frappe.local.response["message"] = f"Exactly one of these parameters is required: {allowed_filters}"
        return
    
    key = keys[0]
    if key == 'asset_id':
        key = 'name'
    value = kwargs[keys[0]]
    # Search local database first
    asset = frappe.get_list("Health Automation Device", filters={key: value}, fields=
                            [
                                "decommission_reason",
                                "sim_serial",
                                "device_serial",
                                "county",
                                "device_name",
                                "modified",
                                "subcounty",
                                "health_facility",
                                "service_point",
                                "assigned_to_employee",
                                "name",
                                "creation",
                                "device_photo",
                                "device_serial_2",
                                "device_description",
                                "health_department",
                                "device_type",
                                "order_number",
                                "status"
                                ], 
                            limit=1)

    if len(asset) < 1:
        frappe.local.response["http_status_code"] = 404
        frappe.local.response["message"] = "Asset not found"
        return
    
    a =  asset[0]
    #set health facility
    healthfacility = load_doctype("Health Facility", a.health_facility,["name","facility_name","facility_type","facility_owner","facility_owner_type","hie_id","registration_number"])
    if healthfacility.get('success'):
        a.health_facility= healthfacility.get('data')

    service_point = load_doctype("Service Points", a.service_point,["name","location_id","service_point_name","number_of_stations","is_ward","ward_gender","ward_type"])
    if service_point.get('success'):    
        a.service_point= service_point.get('data')
    
    assigned_to_employee = load_doctype("Employee", a.assigned_to_employee,["name","employee","first_name","middle_name","last_name","gender","date_of_birth","salutation","cell_number","personal_email","company_email"])
    if assigned_to_employee.get('success'):
        a.assigned_to_employee= assigned_to_employee.get('data')

    department = load_doctype("Department", a.health_department,["name","department_name"])
    if department.get('success'):
        a.health_department= department.get('data')

    return api_response(
        success=True,
        message="Asset fetched successfully.",
        data={
            "id": a.name,
            "device_name": a.device_name,
            "device_type": a.device_type,
            "device_description": a.device_description,
            "device_serial": a.device_serial,
            "device_serial_2": a.device_serial_2,
            "sim_serial": a.sim_serial,
            "health_facility": a.health_facility,
            "county": a.county,
            "subcounty": a.subcounty,
            "service_point": a.service_point,
            "assigned_to_employee": a.assigned_to_employee,
            "health_department": a.health_department,
            "order_number": a.order_number,
            "status": a.status,
            "decommission_reason": a.decommission_reason,   
            "device_photo": a.device_photo,
            "created_at": get_datetime(a.creation).strftime("%Y-%m-%d %H:%M") if a.get('creation') else None,
            "updated_at": get_datetime(a.modified).strftime("%Y-%m-%d %H:%M") if a.get('modified') else None
        },
        status_code=200
    )


@frappe.whitelist()
@auth_required()
def get_asset_assignment_history(**kwargs) -> Dict[str, Any]:
    kwargs.pop('cmd', None)

    # Validate required field
    asset = kwargs.get('asset')
    if not asset:
        return api_response(
            success=False,
            message="Asset is required!",
            status_code=400,
        )

    # Get optional filter parameters
    assignment_type_filter = kwargs.get('assignment_type')
    action_filter = kwargs.get('action')
    
    # Parse pagination parameters
    try:
        page = int(kwargs.get('page', 1))
        limit = int(kwargs.get('limit', 20))
    except (ValueError, TypeError):
        return api_response(
            success=False,
            message="Invalid pagination parameters.",
            status_code=422,
        )
    
    # Validate pagination parameters
    if page < 1:
        return api_response(
            success=False,
            message="Page must be a positive integer.",
            status_code=422,
        )
    
    
    # Validate assignment_type if provided
    valid_assignment_types = ["Employee", "Department", "Service Point"]
    if assignment_type_filter and assignment_type_filter not in valid_assignment_types:
        return api_response(
            success=False,
            message=f"Invalid assignment_type. Must be one of: {', '.join(valid_assignment_types)}",
            status_code=400,
        )
    
    # Validate action if provided
    valid_actions = ["Assign", "Unassign", "Create", "Decommission"]
    if action_filter and action_filter not in valid_actions:
        return api_response(
            success=False,
            message=f"Invalid action. Must be one of: {', '.join(valid_actions)}",
            status_code=400,
        )

    asset_doc = load_doctype("Health Automation Device", asset)
    if not asset_doc.get('success'):
        return api_response(
            success=False,
            message=asset_doc.get('message'),
            status_code=asset_doc.get('status_code', 400),
        ) 
   
    asset_d = asset_doc.get("data", {})
    asset_history = asset_d.get("device_allocation_history", [])
    
    if not asset_history:
        return api_response(
            success=False,
            message="No assignment history found for this asset",
            status_code=404,
        )
    
    # Filter the history based on provided filters
    filtered_history = []
    for h in asset_history:
        # Apply filters if provided
        if assignment_type_filter and h.assignment_type != assignment_type_filter:
            continue
        
        if action_filter and h.action != action_filter:
            continue
        
        filtered_history.append(h)
    
    # Check if filters resulted in no records
    filters_applied = []
    if assignment_type_filter:
        filters_applied.append(f"assignment_type: {assignment_type_filter}")
    if action_filter:
        filters_applied.append(f"action: {action_filter}")
    
    if filters_applied and not filtered_history:
        return api_response(
            success=False,
            message=f"No assignment history found for {', '.join(filters_applied)}",
            status_code=404,
        )
    
    # Calculate pagination
    total_items = len(filtered_history)
    total_pages = math.ceil(total_items / limit) if total_items > 0 else 1
    start = (page - 1) * limit
    end = start + limit
    
    # Paginate the filtered history
    paginated_history = filtered_history[start:end]
    
    # Process the paginated history
    history = []
    for h in paginated_history:
        if h.assignment_type == "Department":
            department = load_doctype("Department", h.assignment_id, ["name", "department_name"])
            if department.get('success'):
                h.assignment_id = department.get('data')
        
        if h.assignment_type == "Service Point":
            service_point = load_doctype("Service Points", h.assignment_id, ["name", "service_point_name"])
            if service_point.get('success'):
                h.assignment_id = service_point.get('data')
        
        if h.assignment_type == "Employee":
            assigned_to_employee = load_doctype("Employee", h.assignment_id, ["name", "employee", "first_name", "middle_name", "last_name"])
            if assigned_to_employee.get('success'):
                h.assignment_id = assigned_to_employee.get('data')

        history.append({
            "id": h.name,
            "action": h.action,
            "assignment_type": h.assignment_type,
            "assignment": h.assignment_id,
            "timestamp_assigned": get_datetime(h.timestamp_assigned).strftime("%Y-%m-%d %H:%M") if h.get('timestamp_assigned') else None,
            "assigned_by": h.assigned_by
        })
    
    return api_response(
        success=True,
        message="Asset assignment history fetched successfully.",
        data={
            "items": history,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_items": total_items,
                "total_pages": total_pages
            }
        },
        status_code=200 
    )


@frappe.whitelist()
@auth_required()
def get_asset_audit_logs(**kwargs):
    kwargs.pop('cmd', None)

    # Validate required field
    asset = kwargs.get('asset')
    if not asset:
        return api_response(
            success=False,
            message="Asset is required!",
            status_code=400,
        )
    
    # Pagination parameters
    page = int(kwargs.get('page', 1))
    page_size = int(kwargs.get('page_size', 20))
    
    # Validate pagination parameters
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 20
    
    try:
        # Get total count
        total_count = frappe.db.count(
            "Version",
            filters={
                "ref_doctype": "Health Automation Device",
                "docname": asset
            }
        )
        
        # Calculate offset
        offset = (page - 1) * page_size
        
        # Fetch versions with pagination
        versions = frappe.get_list(
            "Version",
            filters={
                "ref_doctype": "Health Automation Device",
                "docname": asset
            },
            fields=["name", "owner", "creation", "docname", "data"],
            order_by="creation desc",
            limit_start=offset,
            limit_page_length=page_size
        )
        
        # Parse and format the data field
        formatted_versions = []
        for version in versions:
            # Fetch owner details
            owner_email = version.get("owner")
            owner_details = {
                "email": owner_email,
                "name": owner_email  # Default to email if name not found
            }
            
            # Get user's full name from User doctype
            if owner_email:
                try:
                    user = frappe.get_value(
                        "User",
                        owner_email,
                        ["full_name", "name"],
                        as_dict=True
                    )
                    if user:
                        owner_details = {
                            "email": user.get("name"),
                            "name": user.get("full_name") or user.get("name")
                        }
                except Exception:
                    # If user not found, keep the default
                    pass
            
            formatted_version = {
                "name": version.get("name"),
                "owner": owner_details,
                "creation": version.get("creation"),
                "docname": version.get("docname"),
                "changes": None
            }
            
            # Parse the JSON string in the data field
            if version.get("data"):
                try:
                    parsed_data = json.loads(version.get("data"))
                    formatted_version["changes"] = parsed_data
                except json.JSONDecodeError:
                    formatted_version["changes"] = {"raw_data": version.get("data")}
            
            formatted_versions.append(formatted_version)
        
        # Calculate pagination metadata
        total_pages = (total_count + page_size - 1) // page_size
        
        return api_response(
            success=True,
            message="Asset audit logs fetched successfully.",
            data={
                "logs": formatted_versions,
                "pagination": {
                    "current_page": page,
                    "page_size": page_size,
                    "total_count": total_count,
                    "total_pages": total_pages
                }
            },
            status_code=200
        )
    
    except frappe.PermissionError:
        return api_response(
            success=False,
            message="Permission denied to access this asset.",
            status_code=403,
        )
    except frappe.DoesNotExistError:
        return api_response(
            success=False,
            message="Asset not found.",
            status_code=404,
        )
    except Exception as e:
        frappe.log_error(
            title="Error Fetching Asset for Audit Logs",
            message=f"Asset: {asset}\nError: {frappe.get_traceback()}"
        )
        return api_response(
            success=False,
            message="An error occurred while fetching the asset.",
            status_code=500,
        )