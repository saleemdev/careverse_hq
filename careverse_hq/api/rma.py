import frappe
from frappe import _
from healthpro_erp.healthpro_erp.decorators.permissions import auth_required
from .utils import api_response, sanitize_request
from .document_uploads import upload_custom_document
import json
from werkzeug.utils import secure_filename
from frappe.utils import now, add_to_date, get_datetime, cstr


@frappe.whitelist(methods=["GET"])
@auth_required()
@sanitize_request
def rma_list(**kwargs):
    """
    Fetch paginated list of RMAs with filters.
    Filters:
        - status
        - date_of_fault
        - search (equipment, supplier_name, serial_number)
    """
    try:
        # Merge params
        params = {**frappe.form_dict, **kwargs}

        # Pagination
        page = int(params.get("page", 1))
        per_page = int(params.get("per_page", 20))
        offset = (page - 1) * per_page

        # Allowed exact-match filters
        filters = {}
        if params.get("status"):
            filters["status"] = params.get("status")
        if params.get("date_of_fault"):
            filters["date_of_fault"] = params.get("date_of_fault")

        # Base filters for get_list
        # (we will append search condition after fetching)
        base_filters = filters.copy()

        # Fetch permission-filtered data first
        rma_records = frappe.get_list(
            "Return Merchandise Authorization",
            filters=base_filters,
            fields=[
                "name as rma_id",
                "serial_number",
                "equipment as equipment_name",
                "supplier_name",
                "date_of_fault as dateoffault",
                "status",
            ],
            order_by="creation desc",
            start=offset,
            page_length=per_page,
        )

        # Apply search manually after permission-checked fetch
        search_value = params.get("search")
        if search_value:
            search_value = search_value.lower()
            rma_records = [
                r for r in rma_records
                if search_value in (r.get("equipment_name") or "").lower()
                or search_value in (r.get("supplier_name") or "").lower()
                or search_value in (r.get("serial_number") or "").lower()
            ]

        # Count total matching items
        # Fetch all matching items again (small dataset due to permission filtering)
        all_records = frappe.get_list(
            "Return Merchandise Authorization",
            filters=base_filters,
            fields=["equipment", "supplier_name", "serial_number"],
            limit_page_length=0,
        )

        if search_value:
            all_records = [
                r for r in all_records
                if search_value in (r.get("equipment") or "").lower()
                or search_value in (r.get("supplier_name") or "").lower()
                or search_value in (r.get("serial_number") or "").lower()
            ]

        total_count = len(all_records)

        # Pagination metadata
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
        frappe.log_error(title="RMA List Error", message=frappe.get_traceback())

        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )


@frappe.whitelist(methods=["GET"])
@auth_required()
@sanitize_request
def rma_details(**kwargs):
    """
    Fetch detailed information for a specific RMA
    Query param: rma_id
    """
    try:
        rma_id = kwargs.get("rma_id") or frappe.form_dict.get("rma_id")
        
        if not rma_id:
            return api_response(
                success=False,
                message="rma_id is required",
                status_code=400
            )
        
        # Check if RMA exists
        if not frappe.db.exists("Return Merchandise Authorization", rma_id):
            return api_response(
                success=False,
                message=f"RMA {rma_id} not found",
                status_code=404
            )
        
        # Fetch RMA document
        rma = frappe.get_doc("Return Merchandise Authorization", rma_id)
        # rma = frappe.get_list(
        #     "Return Merchandise Authorization",
        #     filters={"name": rma_id},
        #     fields=["*"],  # Get all fields
        #     limit=1
        # )
        
        # Get Health Automation Device details
        device_details = None
        if rma.serial_number:
          try:
            device_details = frappe.get_doc("Health Automation Device", rma.serial_number)
          except frappe.DoesNotExistError:
            device_details = None

        
        # Get equipment type from device
        equipment_type = device_details.device_type if device_details.device_type else None
        
        # Get Item details (device_name is linked to Item)
        asset_category = None
        try:
            item_doc = frappe.get_doc("Item", device_details.device_name)
            
            # Get Asset Category Name from Asset Category doctype
            if item_doc.asset_category:
                asset_category_doc = frappe.get_doc("Asset Category", item_doc.asset_category)
                asset_category = asset_category_doc.asset_category_name
        except Exception:
            pass  # Item or Asset Category not found, continue without it
        
        # Get purchase details from Purchase Receipt
        purchase_price = None
        date_purchased = None
        
        # Search for Purchase Receipt Item that contains this item (device_name)
        purchase_receipts = frappe.get_all(
            "Purchase Receipt Item",
            filters={"item_code": device_details.device_name},
            fields=["parent", "rate"],
            order_by="creation desc",
            limit=1
        )
        
        if purchase_receipts:
            # Get the Purchase Receipt document
            pr_name = purchase_receipts[0].parent
            purchase_price = purchase_receipts[0].rate
            
            # Get posting_date from Purchase Receipt
            pr = frappe.get_doc("Purchase Receipt", pr_name)
            date_purchased = pr.posting_date
        
        # Get status, priority, and SLA - return as stored
        status_name = rma.status
        priority_name = rma.priority
        expected_sla_name = rma.expected_sla
        
        # Prepare evidence list
        
        evidence = ""
        if rma.supporting_evidence:
            evidence=frappe.utils.get_url(rma.supporting_evidence)

        # Build fault_details - include all fields
        fault_details = {
            "date_of_fault": rma.date_of_fault,
            "priority_level": priority_name,
            "expected_sla": expected_sla_name,
            "nature_of_fault": rma.nature_of_fault,
            "impact_of_operations": rma.impact_of_operations
        }
        
        # Build response - include all fields even if null
        response_data = {
            "rma_id": rma.name,
            "serial_number": rma.serial_number,
            "equipment_name": rma.equipment,
            "supplier_name": rma.supplier_name,
            "equipment_type": equipment_type,
            "asset_category": asset_category,
            "asset_purchase_price": purchase_price,
            "date_purchased": date_purchased,
            "fault_details": fault_details,
            "supporting_evidence": evidence,
            "expected_sla":rma.expected_sla,
            "acknowledged_by":rma.acknowledged_by,
            "vendor_sla":rma.vendor_sla,
            "vendor_remarks":rma.vendor_remarks,
            "status": status_name,

        }
        
        return api_response(
            success=True,
            data=response_data,
            status_code=200
        )
        
    except Exception as e:
        frappe.log_error(title="RMA Details Error", message=frappe.get_traceback())
        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )




@frappe.whitelist(methods=["POST"])
@auth_required()
def create_rma(**kwargs):
    """
    Create a new RMA record
    Required fields: health_facility, serial_number, date_of_fault, priority, expected_sla
    Optional fields: nature_of_fault, impact_of_operations, supporting_evidence (file upload)

    Notes:
    - supplier_name is auto-populated from the Purchase Order linked to the device
    - Status is automatically set to 'Pending'
    - Creation is blocked if:
      - Device is decommissioned
      - An existing RMA exists with status other than 'Resolved By Vendor' or 'Resolved'
      - No Purchase Order is linked to the device
    """
    try:
        # Get data from kwargs or form_dict
        data = kwargs or frappe.form_dict
        
        # Validate required fields (supplier_name is auto-populated from Purchase Order)
        required_fields = {
            "health_facility": "Health Facility",
            "serial_number": "Serial Number",
            "date_of_fault": "Date of Fault",
            "priority": "Priority Level",
            "expected_sla": "Expected SLA"
        }
        
        missing_fields = []
        for field, label in required_fields.items():
            if not data.get(field):
                missing_fields.append(label)
        
        if missing_fields:
            return api_response(
                success=False,
                message=f"Missing required fields: {', '.join(missing_fields)}",
                status_code=400
            )
        
        # Validate serial number exists in Health Automation Device
        serial_number = data.get("serial_number")
        if not frappe.db.exists("Health Automation Device", serial_number):
            return api_response(
                success=False,
                message=f"Health Automation Device with serial number '{serial_number}' not found",
                status_code=404
            )
        
        # Get device details to auto-populate health facility
        device = frappe.get_doc("Health Automation Device", serial_number)

        # Check if device is decommissioned
        if device.status == "Decommissioned":
            return api_response(
                success=False,
                message=f"Cannot create RMA for decommissioned device. Serial number '{serial_number}' has been decommissioned.",
                status_code=400
            )

        # Check for existing RMA with same serial number that is not resolved
        # Only allow new RMA if existing RMA status is "Resolved By Vendor" or "Resolved"
        existing_rmas = frappe.get_all(
            "Return Merchandise Authorization",
            filters={"serial_number": serial_number},
            fields=["name", "status"]
        )

        if existing_rmas:
            for rma_record in existing_rmas:
                status_name = rma_record.status or ""
                # Allow creation only if status is "Resolved By Vendor" or "Resolved" or Closed
                if status_name not in ["Resolved By Vendor", "Resolved by Vendor","resolved by vendor","resolved","Resolved","Closed","closed"]:
                    return api_response(
                        success=False,
                        message=f"An active RMA already exists for serial number '{serial_number}' with status '{status_name}'. Please resolve the existing RMA (ID: {rma_record.name}) before creating a new one.",
                        status_code=409
                    )

        # Auto-populate supplier from Purchase Order linked to device
        supplier_name = None
        if device.order_number:
            # Get supplier from Purchase Order
            supplier_name = frappe.db.get_value("Purchase Order", device.order_number, "supplier")

        if not supplier_name:
            return api_response(
                success=False,
                message=f"Could not determine supplier for device '{serial_number}'. No Purchase Order linked to this device or Purchase Order has no supplier.",
                status_code=400
            )

        # Validate supplier exists
        if not frappe.db.exists("Supplier", supplier_name):
            return api_response(
                success=False,
                message=f"Supplier '{supplier_name}' from Purchase Order not found in system.",
                status_code=404
            )
        
        # Get health facility from device or require it
        health_facility = data.get("health_facility") or device.health_facility
        if not health_facility:
            return api_response(
                success=False,
                message="Health facility is required. Please provide health_facility in the request.",
                status_code=400
            )
        
        # Create new RMA document
        rma = frappe.new_doc("Return Merchandise Authorization")
        rma.serial_number = serial_number
        rma.supplier_name = supplier_name
        rma.date_of_fault = data.get("date_of_fault")
        rma.health_facility = health_facility
        rma.priority = data.get("priority")
        rma.expected_sla = data.get("expected_sla")
        
        # Set status to "Pending" automatically
        # Find the "Pending" status in Registry Dictionary Concept
        pending_status = frappe.db.get_value(
            "Registry Dictionary Concept",
            {"concept_name": "Pending"},
            "name"
        )
        if pending_status:
            rma.status = pending_status
        else:
            # If "Pending" doesn't exist, just set it as text
            rma.status = data.get("status", "Pending")
        
        # Optional fields
        if data.get("nature_of_fault"):
            rma.nature_of_fault = data.get("nature_of_fault")
        
        if data.get("impact_of_operations"):
            rma.impact_of_operations = data.get("impact_of_operations")
        
        if data.get("supplier_sla"):
            rma.supplier_sla = data.get("supplier_sla")
        
        # Insert the RMA document first to get the name
        rma.insert()
        rma_id = rma.name
        
        # Handle file upload for supporting_evidence
        uploaded_file_url = None
        files = frappe.request.files
        if files and len(files) > 0:
            # Get the first file (supporting_evidence)
            file_key = list(files.keys())[0]
            file_obj = files[file_key]
            
            # Validate file
            
            filename = secure_filename(file_obj.filename)
            
            # Check allowed extensions
            ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf", "csv", "xlsx", "docx", "xls", "doc"}
            if '.' not in filename or filename.rsplit('.', 1)[1].lower() not in ALLOWED_EXTENSIONS:
                frappe.db.rollback()
                return api_response(
                    success=False,
                    message=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
                    status_code=400
                )
            
            # Check file size (5MB limit)
            file_stream = file_obj.stream
            file_stream.seek(0, 2)
            size = file_stream.tell()
            file_stream.seek(0)
            
            MAX_FILE_SIZE_MB = 5
            if size > MAX_FILE_SIZE_MB * 1024 * 1024:
                frappe.db.rollback()
                return api_response(
                    success=False,
                    message=f"File exceeds size limit of {MAX_FILE_SIZE_MB}MB",
                    status_code=400
                )
            
            # Read file content
            file_content = file_stream.read()
            
            # Create File document
            file_doc = frappe.get_doc({
                "doctype": "File",
                "attached_to_doctype": "Return Merchandise Authorization",
                "attached_to_name": rma_id,
                "file_name": filename,
                "is_private": 0,
                "content": file_content,
            })
            file_doc.save()
            
            uploaded_file_url = file_doc.file_url
            
            # Update RMA with file URL
            rma.supporting_evidence = uploaded_file_url
            rma.save()
        
        frappe.db.commit()
        
        # Prepare response
        response_data = {
            "rma_id": rma_id,
            "serial_number": rma.serial_number,
            "status": rma.status,
            "message": "RMA created successfully"
        }
        
        if uploaded_file_url:
            response_data["supporting_evidence"] = frappe.utils.get_url(uploaded_file_url)
        
        return api_response(
            success=True,
            data=response_data,
            status_code=201
        )
        
    except Exception as e:
        frappe.db.rollback()
        
        frappe.log_error(title="Create RMA  Error", message=frappe.get_traceback())
        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )


@frappe.whitelist(methods=["PUT", "PATCH"])
@auth_required()
def update_rma(**kwargs):
    """
    Update an existing RMA record
    Required field: rma_id
    Updatable fields: date_of_fault, nature_of_fault, status, priority, 
                     expected_sla, supplier_sla, impact_of_operations, supporting_evidence (file upload)
    """
    try:
        # Get data from kwargs or form_dict
        data = kwargs or frappe.form_dict
        rma_id = data.get("rma_id")
        
        if not rma_id:
            return api_response(
                success=False,
                message="rma_id is required",
                status_code=400
            )
        
        # Check if RMA exists
        if not frappe.db.exists("Return Merchandise Authorization", rma_id):
            return api_response(
                success=False,
                message=f"RMA '{rma_id}' not found",
                status_code=404
            )
        
        # Get RMA document
        rma = frappe.get_doc("Return Merchandise Authorization", rma_id)
        
        # Update allowed fields
        updatable_fields = {
            "date_of_fault": "Date of Fault",
            "nature_of_fault": "Nature of Fault",
            "status": "Status",
            "priority": "Priority",
            "expected_sla": "Expected SLA",
            "supplier_sla": "Supplier SLA",
            "impact_of_operations": "Impact of Operations"
        }
        
        updated_fields = []
        for field, label in updatable_fields.items():
            if field in data and data.get(field) is not None:
                setattr(rma, field, data.get(field))
                updated_fields.append(label)
        
        # Handle file upload for supporting_evidence
        uploaded_file_url = None
        files = frappe.request.files
        if files and len(files) > 0:
            # Get the first file (supporting_evidence)
            file_key = list(files.keys())[0]
            file_obj = files[file_key]
            
            # Validate file
            
            filename = secure_filename(file_obj.filename)
            
            # Check allowed extensions
            ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf", "csv", "xlsx", "docx", "xls", "doc"}
            if '.' not in filename or filename.rsplit('.', 1)[1].lower() not in ALLOWED_EXTENSIONS:
                return api_response(
                    success=False,
                    message=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
                    status_code=400
                )
            
            # Check file size (5MB limit)
            file_stream = file_obj.stream
            file_stream.seek(0, 2)
            size = file_stream.tell()
            file_stream.seek(0)
            
            MAX_FILE_SIZE_MB = 5
            if size > MAX_FILE_SIZE_MB * 1024 * 1024:
                return api_response(
                    success=False,
                    message=f"File exceeds size limit of {MAX_FILE_SIZE_MB}MB",
                    status_code=400
                )
            
            # Read file content
            file_content = file_stream.read()
            
            # Create File document
            file_doc = frappe.get_doc({
                "doctype": "File",
                "attached_to_doctype": "Return Merchandise Authorization",
                "attached_to_name": rma_id,
                "file_name": filename,
                "is_private": 0,
                "content": file_content,
            })
            file_doc.save()
            
            uploaded_file_url = file_doc.file_url
            
            # Update RMA with new file URL
            rma.supporting_evidence = uploaded_file_url
            updated_fields.append("Supporting Evidence")
        
        if not updated_fields:
            return api_response(
                success=False,
                message="No valid fields to update",
                status_code=400
            )
        
        rma.save()
        frappe.db.commit()
        
        # Prepare response
        response_data = {
            "rma_id": rma.name,
            "updated_fields": updated_fields,
            "message": "RMA updated successfully"
        }
        
        if uploaded_file_url:
            response_data["supporting_evidence"] = frappe.utils.get_url(uploaded_file_url)
        
        return api_response(
            success=True,
            data=response_data,
            status_code=200
        )
        
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(title="Create RMA  Error", message=frappe.get_traceback())
        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )


@frappe.whitelist(methods=["PUT"])
@auth_required()
def update_rma(**kwargs):
    """
    Update an existing RMA record.
    Allowed fields to update: nature_of_fault, impact_of_operations, expected_sla, supporting_evidence (file upload)
    """
    try:
        data = kwargs or frappe.form_dict

        # RMA ID is required
        rma_id = data.get("rma_id")
        if not rma_id:
            return api_response(success=False, message="Missing RMA ID", status_code=400)

        if not frappe.db.exists("Return Merchandise Authorization", rma_id):
            return api_response(success=False, message=f"RMA '{rma_id}' not found", status_code=404)

        # Get RMA document
        rma = frappe.get_doc("Return Merchandise Authorization", rma_id)

        # Update allowed fields
        if data.get("nature_of_fault"):
            rma.nature_of_fault = data.get("nature_of_fault")

        if data.get("impact_of_operations"):
            rma.impact_of_operations = data.get("impact_of_operations")

        if data.get("expected_sla"):
            rma.expected_sla = data.get("expected_sla")

        # Handle file upload
        uploaded_file_url = None
        files = frappe.request.files
        if files and len(files) > 0:
            # Get the first file
            file_key = list(files.keys())[0]
            file_obj = files[file_key]


            filename = secure_filename(file_obj.filename)

            # Validate file extension
            ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf", "csv", "xlsx", "docx", "xls", "doc"}
            if '.' not in filename or filename.rsplit('.', 1)[1].lower() not in ALLOWED_EXTENSIONS:
                frappe.db.rollback()
                return api_response(
                    success=False,
                    message=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
                    status_code=400
                )

            # Validate file size
            file_stream = file_obj.stream
            file_stream.seek(0, 2)
            size = file_stream.tell()
            file_stream.seek(0)
            MAX_FILE_SIZE_MB = 5
            if size > MAX_FILE_SIZE_MB * 1024 * 1024:
                frappe.db.rollback()
                return api_response(
                    success=False,
                    message=f"File exceeds size limit of {MAX_FILE_SIZE_MB}MB",
                    status_code=400
                )

            # Read file content
            file_content = file_stream.read()

            # Create File document
            file_doc = frappe.get_doc({
                "doctype": "File",
                "attached_to_doctype": "Return Merchandise Authorization",
                "attached_to_name": rma_id,
                "file_name": filename,
                "is_private": 0,
                "content": file_content,
            })
            file_doc.save()
            uploaded_file_url = file_doc.file_url

            # Update RMA with file URL
            rma.supporting_evidence = uploaded_file_url

        rma.save()
        frappe.db.commit()

        response_data = {
            "rma_id": rma.name,
            "serial_number": rma.serial_number,
            "status": rma.status,
            "message": "RMA updated successfully"
        }

        if uploaded_file_url:
            response_data["supporting_evidence"] = frappe.utils.get_url(uploaded_file_url)

        return api_response(success=True, data=response_data, status_code=200)

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(title="Update RMA  Error", message=frappe.get_traceback())
        return api_response(success=False, message=str(e), status_code=500)

@frappe.whitelist(methods=["PUT"])
@auth_required()
@sanitize_request
def mark_as_verified(**kwargs):
    """
    Mark an RMA ticket as verified by vendor
    Request Body:
    - rma_id: str (required) - RMA ticket identifier
    """
    try:
        params = {**frappe.form_dict, **kwargs}
        
        # Get request data
        rma_id = params.get("rma_id")
        
        # Validate required fields
        if not rma_id:
            return api_response(
                success=False,
                message="rma_id is required",
                status_code=400
            )
        
        # Check if RMA exists and user has permission using get_list
        rma_list = frappe.get_list(
            "Return Merchandise Authorization",
            filters={"name": rma_id},
            fields=["name", "status"],
            limit=1
        )
        
        if not rma_list:
            return api_response(
                success=False,
                message=f"RMA ticket {rma_id} not found or access denied",
                status_code=404
            )
        
        rma_data = rma_list[0]
        
        # Check if already verified (case insensitive check)
        if rma_data.status and "verified" in rma_data.status.lower():
            return api_response(
                success=False,
                message="This RMA ticket has already been verified",
                status_code=409
            )
        
        # Look up "Verified" status from Registry Dictionary Concept (case insensitive)
        # Since autoname="field:concept_name", the name IS the concept_name
        concepts = frappe.get_all(
            "Registry Dictionary Concept",
            fields=["name"],
            limit_page_length=0
        )
        
        verified_status = None
        for concept in concepts:
            if concept.name.lower() == "verified":
                verified_status = concept.name
                break
        
        if not verified_status:
            # Fallback to "Verified" if not found in registry
            verified_status = "Verified"
        
        # Update only the status field
        frappe.db.set_value(
            "Return Merchandise Authorization",
            rma_id,
            "status",
            verified_status
        )
        
        frappe.db.commit()
        
        return api_response(
            success=True,
            data={
                "rma_id": rma_id,
                "status": verified_status,
                "modified": cstr(frappe.utils.now()),
            },
            message="RMA ticket marked as verified successfully",
            status_code=200
        )
        
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(title="Mark Verified Error", message=frappe.get_traceback())
        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )
        
@frappe.whitelist(methods=["PUT"])
@auth_required()
@sanitize_request
def return_to_vendor(**kwargs):
    """
    Return RMA to vendor with reason
    Request Body:
    - rma_id: str (required) - RMA ticket identifier
    - return_reason: str (required) - Reason for returning to vendor
    """
    try:
        params = {**frappe.form_dict, **kwargs}
        
        # Get request data
        rma_id = params.get("rma_id")
        return_reason = params.get("return_reason")
        
        # Validate required fields
        if not rma_id or not return_reason:
            return api_response(
                success=False,
                message="rma_id and return_reason are required",
                status_code=400
            )
        
        # Check if RMA exists and user has permission using get_list
        rma_list = frappe.get_list(
            "Return Merchandise Authorization",
            filters={"name": rma_id},
            fields=["name", "status"],
            limit=1
        )
        
        if not rma_list:
            return api_response(
                success=False,
                message=f"RMA ticket {rma_id} not found or access denied",
                status_code=404
            )
        
        rma_data = rma_list[0]
        
        # Check if already returned to vendor (case insensitive check)
        if rma_data.status and "return to vendor" in rma_data.status.lower():
            return api_response(
                success=False,
                message="This RMA ticket has already been returned to vendor",
                status_code=409
            )
        
        # Look up "Return to vendor" status from Registry Dictionary Concept (case insensitive)
        concepts = frappe.get_all(
            "Registry Dictionary Concept",
            fields=["name"],
            limit_page_length=0
        )
        
        return_status = None
        resolved_as_false=False
        for concept in concepts:
            if concept.name.lower() == "return to vendor":
                return_status = concept.name
                break
        
        if not return_status:
            # Fallback to "Return to vendor" if not found in registry
            return_status = "Return to vendor"
        
        # Update status and return_reason fields
        frappe.db.set_value(
            "Return Merchandise Authorization",
            rma_id,
            {
                "mark_as_resolved":resolved_as_false,
                "status": return_status,
                "return_reason": return_reason
            }
        )
        
        frappe.db.commit()
        
        return api_response(
            success=True,
            data={
                "rma_id": rma_id,
                "status": return_status,
                "return_reason": return_reason,
                "modified": cstr(frappe.utils.now()),
            },
            message="RMA ticket returned to vendor successfully",
            status_code=200
        )
        
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(title="Return to Vendor Error", message=frappe.get_traceback())
        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )