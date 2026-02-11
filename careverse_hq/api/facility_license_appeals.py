import frappe, re, datetime
from typing import Any, Dict
from frappe.utils.data import nowdate
from careverse_hq.api.utils import (
    api_response, sanitize_request, upload_file, send_custom_email
)
from healthpro_erp.healthpro_erp.decorators.permissions import auth_required, AuthError

# ===== Helper Functions =====

def _post_license_appeal_to_c360(appeal_doc):
    """
    Enqueue async job to post license appeal to C360 system.

    Args:
        appeal_doc: License Appeal document

    Raises:
        frappe.ValidationError: If required data is missing
    """
    if not appeal_doc.license_number:
        frappe.throw(
            "Cannot sync to C360: License appeal does not have a license number",
            frappe.ValidationError
        )

    # Find the health facility by license number
    facility_name = frappe.db.get_value(
        "Health Facility",
        {"license_number": appeal_doc.license_number},
        "name"
    )
    if not facility_name:
        frappe.throw(
            f"Health Facility with license number '{appeal_doc.license_number}' does not exist",
            frappe.ValidationError
        )

    appealing_facility = frappe.get_doc("Health Facility", facility_name)

    # Build supporting documents list
    supporting_docs = [
        {
            "document_type": doc.document_type,
            "document_file": doc.document_file
        }
        for doc in (appeal_doc.supporting_documents or [])
    ]

    payload = {
            #  "license": appeal_doc.license_number,
        # "license": appeal_doc.license,
        "license_number": appeal_doc.license_number,
        "appeal_reason": appeal_doc.appeal_reason,
        "status": appeal_doc.status,
        "supporting_documents": supporting_docs,
        "licensing_body": appealing_facility.regulatory_body or "KMPDC",
        "facility_fid": appealing_facility.hie_id or "",
        "facility_code": appealing_facility.facility_mfl or "",
        "appeal_id": appeal_doc.name or "",
        "debug_mode": 1
    }

    frappe.enqueue(
        method="careverse_hq.api.utils.sync_data_to_c360",
        queue="long",
        timeout=1800,
        payload=payload,
        api_reference="Post License Appeal to C360",
        api_uri="/v1/C360/create-license-appeal",
        # api_uri="/api/method/compliance_360.api.license_management.facility_license_appeal_request.create_license_appeal_request",
        job_name=f"c360_post_license_appeal_{appeal_doc.name}_{frappe.utils.now()}",
    )

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
        
def _send_appeal_email(data):

    license_id = data.get("license_id")
    appeal_id = data.get("appeal_id")
    decision = data.get("decision")
    review_decision = data.get("review_decision")
    reviewed_by = data.get("reviewed_by")
    review_date = data.get("review_date")
    license_status = data.get("license_status")
    
    reviewer_name = frappe.db.get_value("User", reviewed_by, "full_name")
    
    license = frappe.db.get_value("License Record", license_id, ["license_number", "health_facility"], as_dict=True)
    license_number = license.get("license_number")
    facility_id = license.get("health_facility")
    
    health_facility = frappe.db.get_value("Health Facility", facility_id, ["administrators_email_address", "administrators_first_name", "administrators_last_name"], as_dict=True)
    facility_admin_name = health_facility.get("administrators_first_name") + " " + health_facility.get("administrators_last_name")
    facility_admin_email = health_facility.get("administrators_email_address")
    
    # Send email
    args = {
        "subject": f"License Appeal Review: License# {license_number}",
        "license_id": license_id,
        "license_number": license_number,
        "appeal_id": appeal_id,
        "decision": decision,
        "review_decision": review_decision,
        "reviewed_by": reviewed_by,
        "reviewer_name": reviewer_name,
        "review_date": review_date,
        "license_status": license_status,
        "facility_admin_name": facility_admin_name
    }
    
    send_custom_email(
        template_name="appeal_review",
        template_args=args,
        recipient=facility_admin_email,
        sender="healthpro@kenya-hie.health"
    )
    
    
# ===== Data Access Functions =====

def _create_license_appeal(data):
    """
    Create a new license appeal for a suspended license.

    Args:
        data: Dict containing license_id, license_number, license_body, appeal_reason

    Returns:
        Dict with appeal details on success

    Raises:
        frappe.ValidationError: If validation fails
    """
    # license_id = data.get("license_id")
    license_number = data.get("license_number")
    appeal_reason = data.get("appeal_reason")

    # Validate license exists using license_number as the identifier
    license_name = frappe.db.get_value(
        "License Record",
        {"license_number": license_number},
        "name"
    )
    if not license_name:
        frappe.log_error(
            title="Create License Appeal Error",
            message=f"License Record with license_number '{license_number}' not found"
        )
        frappe.throw(
            "Cannot create License Appeal because License Record is not found",
            frappe.ValidationError
        )

    # Check for existing pending appeal
    existing_pending_appeal = frappe.db.get_value(
        "License Appeal",
        {"license": license_name, "status": "Pending"},
        "name"
    )
    if existing_pending_appeal:
        frappe.throw(
            f"License Record '{license_name}' already has a pending appeal.",
            frappe.ValidationError
        )

    # Validate license is in Suspended state
    license_doc = frappe.get_doc("License Record", license_name)
    if license_doc.status != "Suspended":
        frappe.throw(
            f"License Record '{license_name}' is not in 'Suspended' state. "
            "Only suspended licenses can be appealed.",
            frappe.ValidationError
        )

    # Create new appeal
    license_appeal = frappe.new_doc("License Appeal")
    license_appeal.license = license_name
    license_appeal.license_number = license_number
    license_appeal.appeal_reason = appeal_reason
    license_appeal.insert()

    # Handle file uploads if present
    files = getattr(frappe.request, 'files', None)
    if files:
        for file_key in files.keys():
            document_type, document_file = upload_file(
                files, "License Appeal", license_appeal.name, file_key
            )
            license_appeal.append("supporting_documents", {
                "document_type": document_type,
                "document_file": document_file
            })
        license_appeal.save()

    # Update license status
    license_doc.status = "Appealed"
    license_doc.save()
    frappe.db.commit()

    # Build response
    documents_list = [
        {
            "document_type": doc.get("document_type"),
            "document_file": doc.get("document_file")
        }
        for doc in license_appeal.get("supporting_documents") or []
    ]

    # Sync to C360 (async)
    _post_license_appeal_to_c360(license_appeal)

    return {
        "license_number": license_number,
        "appeal_id": license_appeal.name,
        "appeal_reason": appeal_reason,
        "appeal_date": license_appeal.creation,
        "license_status": "Appealed",
        "supporting_documents": documents_list
    }
    
    
def _review_license_appeal(data):
    """
    Process a license appeal review decision.

    Args:
        data: Dict containing license_id, appeal_id, appeal_status, comments, details_requested

    Returns:
        Dict with review details

    Raises:
        frappe.ValidationError: If validation fails
    """
    license_id = data.get("license_id")
    appeal_id = data.get("appeal_id")
    decision = data.get("appeal_status")
    review_decision = data.get("comments")
    details_requested = data.get("details_requested")

    # Validate license access
    accessible_license = frappe.get_list(
        "License Record",
        filters={"license_number": license_id},
        fields=["name"],
        ignore_permissions=False,
    )
    if not accessible_license:
        if frappe.db.exists("License Record", {"license_number": license_id}):
            frappe.throw(
                "You do not have permission to review this License Record",
                frappe.ValidationError
            )
        else:
            frappe.throw(
                f"License Record '{license_id}' not found",
                frappe.ValidationError
            )

    license_name = accessible_license[0].name

    # Validate appeal access
    accessible_appeal = frappe.get_list(
        "License Appeal",
        filters={"name": appeal_id},
        fields=["name"],
        ignore_permissions=False,
    )
    if not accessible_appeal:
        if frappe.db.exists("License Appeal", appeal_id):
            frappe.throw(
                "You do not have permission to review this License Appeal",
                frappe.ValidationError
            )
        else:
            frappe.throw(
                f"License Appeal '{appeal_id}' not found",
                frappe.ValidationError
            )

    appeal_doc = frappe.get_doc("License Appeal", appeal_id)
    license_doc = frappe.get_doc("License Record", license_name)

    # Validate appeal state
    if appeal_doc.status != "Pending":
        frappe.throw(
            f"License Appeal '{appeal_id}' is not in 'Pending' state. "
            "Only pending appeals can be reviewed",
            frappe.ValidationError
        )

    if appeal_doc.license != license_name:
        frappe.throw(
            f"License Appeal '{appeal_id}' and License Record '{license_id}' are not linked",
            frappe.ValidationError
        )

    # Update appeal document
    appeal_doc.status = decision
    appeal_doc.review_decision = review_decision
    appeal_doc.review_date = datetime.date.today()

    # Determine license status based on decision
    license_status_map = {
        "Rejected": "Suspended",
        "Approved": "Under Review",
        "Additional Information Requested": "Appealed"  # Keep current status
    }
    license_status = license_status_map.get(decision, license_doc.status)

    # Handle additional information request
    if decision == "Additional Information Requested":
        health_facility = frappe.get_doc("Health Facility", license_doc.health_facility)
        facility_admin_email = health_facility.get("administrators_email_address")
        facility_admin_name = (
            f"{health_facility.get('administrators_first_name')} "
            f"{health_facility.get('administrators_last_name')}"
        )

        for request in details_requested or []:
            appeal_doc.append("additional_information", {
                "title": request.get("title"),
                "request_comment": request.get("request_comment"),
                "requested_on": nowdate(),
                "status": "Requested"
            })

        titles = ", ".join([item["title"] for item in details_requested or []])
        _send_additional_details_request(
            user=facility_admin_name,
            recipient_email=facility_admin_email,
            license_number=appeal_doc.license_number,
            facility_name=health_facility.facility_name,
            details_requested=titles
        )

    license_doc.status = license_status
    appeal_doc.save()
    license_doc.save()
    frappe.db.commit()

    response = {
        "license_id": license_id,
        "appeal_id": appeal_id,
        "decision": decision,
        "review_decision": review_decision,
        "review_date": appeal_doc.review_date,
        "license_status": license_status
    }

    # Send review notification email (except for additional info requests)
    if decision != "Additional Information Requested":
        frappe.enqueue(
            method="careverse_hq.api.facility_license_appeals._send_appeal_email",
            queue="default",
            timeout=300,
            data=response,
            job_name=f"facility_admin_appeal_review_email_{appeal_id}_{frappe.utils.now()}",
        )

    return response

# ===== API Functions =====

@frappe.whitelist(methods=['POST'])
def create_license_appeal(**kwargs):
    """
    Create license appeal if license suspended.
    Args:
        data (dict): {
            "license_id": "LR-00001",
            "appeal_reason": "We have now obtained the required fire safety certificates and completed all emergency exit signage installations. Supporting documents attached.",
            "supporting_documents": [
                "/files/fire_safety_cert_updated.pdf",
                "/files/emergency_exit_photos.pdf"
            ]
        }
    Returns:
        dict: API response with success status and appeal info
        {
            "success": true,
            "message": "Appeal submitted successfully",
            "data": {
                "license_id": "LR-00001",
                "appeal_id": "APP-00001",
                "appeal_reason": "We have now obtained the required fire safety certificates...",
                "appeal_date": "2024-02-01",
                "status": "Appealed",
                "supporting_documents": [
                    "/files/fire_safety_cert_updated.pdf",
                    "/files/emergency_exit_photos.pdf"
                ]
            },
            "status_code": 200
        }
    """
    try:
        # "license_id",
        #  ("license_id", "License ID"),
        expected_data = [ "license_number","licensing_body","facility_fid","appeal_id" , "appeal_reason"]
        required_data = [
           ("licensing_body", "Licensing Body"), ("license_number", "License Number"), ("appeal_reason", "Appeal Reason")
        ]

        request_data = _read_query_params(kwargs, expected_data)
        
        _validate_request_data(request_data, required_data)
        # return request_data
        
        appeal_creation = _create_license_appeal(request_data)
        
       
        return api_response(
            success=True,
            data=appeal_creation,
            status_code=201
        )

    except PermissionError as pe:
        frappe.db.rollback()
        return api_response(success=False, message=str(pe), status_code=403)

    except frappe.ValidationError as ve:
        frappe.db.rollback()
        frappe.log_error("License Appeal Creation Failed", frappe.get_traceback())                
        return api_response(success=False, message=str(ve), status_code=400)

    except AuthError as ae:
        return api_response(success=False, message=ae.message, status_code=ae.status_code)

    except Exception as e:
        frappe.db.rollback()        
        frappe.log_error("License Appeal Creation Failed", frappe.get_traceback())
        return api_response(success=False, message="Failed to create License Appeal", status_code=500)


VALID_APPEAL_STATUSES = ["Approved", "Rejected","Pending" "Additional Information Requested"]


def _validate_details_requested(details_requested):
    """
    Validate the details_requested field structure.

    Args:
        details_requested: List of detail request objects

    Raises:
        frappe.ValidationError: If validation fails
    """
    if not details_requested:
        frappe.throw(
            "Missing required field: Details Requested ('details_requested')",
            frappe.ValidationError
        )

    if not isinstance(details_requested, list):
        frappe.throw(
            "Details Requested ('details_requested') must be a list/array",
            frappe.ValidationError
        )

    for idx, item in enumerate(details_requested):
        if not isinstance(item, dict):
            frappe.throw(
                f"Item {idx + 1} in 'details_requested' must be an object",
                frappe.ValidationError
            )
        if "title" not in item or "request_comment" not in item:
            frappe.throw(
                f"Item {idx + 1} in 'details_requested' must have 'title' and 'request_comment' keys",
                frappe.ValidationError
            )


@frappe.whitelist(methods=['PUT'])
def review_license_appeal(**kwargs):
    """
    Review a license appeal.

    Args:
        license_id (str): The license number
        appeal_id (str): The appeal ID
        appeal_status (str): Decision - "Approved", "Rejected", or "Additional Information Requested"
        comments (str, optional): Review comments
        details_requested (list, optional): Required when appeal_status is "Additional Information Requested"
            Each item must have "title" and "request_comment" keys

    Returns:
        dict: API response with success status and appeal info
    """
    try:
        expected_data = ["license_id", "appeal_id", "appeal_status", "comments", "details_requested"]
        required_data = [
            ("license_id", "License ID"),
            ("appeal_id", "Appeal ID"),
            ("appeal_status", "Appeal Status")
        ]

        request_data = _read_query_params(kwargs, expected_data)
        _validate_request_data(request_data, required_data)

        appeal_status = request_data.get("appeal_status")
        if appeal_status not in VALID_APPEAL_STATUSES:
            frappe.throw(
                f"Appeal Status ('appeal_status') must be one of: {', '.join(VALID_APPEAL_STATUSES)}",
                frappe.ValidationError
            )

        if appeal_status == "Additional Information Requested":
            _validate_details_requested(kwargs.get("details_requested"))
            request_data["details_requested"] = kwargs.get("details_requested")

        appeal_review = _review_license_appeal(request_data)

        return api_response(
            success=True,
            data=appeal_review,
            status_code=201
        )

    except PermissionError as pe:
        frappe.db.rollback()
        return api_response(success=False, message=str(pe), status_code=403)

    except frappe.ValidationError as ve:
        frappe.db.rollback()
        frappe.log_error("License Review Failed", frappe.get_traceback())
        return api_response(success=False, message=str(ve), status_code=400)

    except AuthError as ae:
        return api_response(success=False, message=ae.message, status_code=ae.status_code)

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error("License Review Failed", frappe.get_traceback())
        return api_response(success=False, message="Failed to review License Appeal", status_code=500)

@frappe.whitelist()
@auth_required()
def request_additional_license_appeal_details(**kwargs):
    """
    Endpoint to request additional details for a license Appeal record.
    
    Args:
        appeal_id (str): The ID of the appeal record
        details_requested (array): Details being requested from the facility 
    Returns:
        dict: API response confirming the request or error message

    """
    kwargs.pop("cmd", None)

    try:
        appeal_id = kwargs.get("appeal_id")
        details_requested = kwargs.get("details_requested")

        if not appeal_id:
            return api_response(
                success=False,
                message="Missing required fields: 'appeal_id'",
                status_code=400,
            )
    
        if not details_requested:
            return api_response(
                success=False,
                message="Missing required fields: 'details_requested'",
                status_code=400,
            )
        
        #confrm details_requested is a list that has title and request_comment as object keys 
        if not isinstance(details_requested, list):
            return api_response(
                success=False,
                message="'details_requested' must be a list/array",
                status_code=400,
            )
        
        for request in details_requested:
            if not isinstance(request, dict) or "title" not in request or "request_comment" not in request:
                return api_response(
                    success=False,
                    message="Each item in 'details_requested' must be an object with 'title' and 'request_comment' keys",
                    status_code=400,
                )

        # Check if apeal exists
        if not frappe.db.exists("License Appeal", appeal_id):
            return api_response(
                success=False,
                message=f"License Appeal does not exist",
                status_code=404,
            )
        
        appeal_doc = frappe.get_doc("License Appeal", appeal_id)
        license_doc =health_facility = frappe.get_doc("License Record", appeal_doc.license) 
        health_facility = frappe.get_doc("Health Facility", license_doc.health_facility)
        facility_admin_email = health_facility.get("administrators_email_address")
        facility_admin_name = f"{health_facility.get('administrators_first_name')} {health_facility.get('administrators_last_name')}"
       
        #save the details requested in the License Appeal child table
        for request in  details_requested:
            appeal_doc.append("additional_information", {
                "title": request.get("title"),
                "request_comment": request.get("request_comment"),
                "requested_on": nowdate(),
                "status": "Requested"
            })
        appeal_doc.save()
        frappe.db.commit()

        titles = ", ".join([item["title"] for item in details_requested])
        # Send email to facility admin
        _send_additional_details_request(
            user=facility_admin_name,
            recipient_email=facility_admin_email,
            license_number=appeal_doc.license_number,
            facility_name=health_facility.facility_name,
            details_requested=titles
        )

        return api_response(
            success=True,
            message=f"Additional details request ({titles}) sent successfully",
            status_code=200,
        )

    except Exception as e:
        frappe.log_error("Request Additional License Appeal Details Failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=f"Failed to request additional License Appeal details: {str(e)}",
            status_code=500,
        )
  

def _send_additional_details_request(
    user,
    recipient_email,
    license_number,
    facility_name,
    details_requested,
):
    """
    Send email notification requesting additional details for license appeal.

    Args:
        user: Recipient name
        recipient_email: Recipient email address
        license_number: License number
        facility_name: Name of the health facility
        details_requested: Comma-separated list of requested details
    """
    args = {
        "subject": "License Appeal - Additional Information Requested",
        "user": user,
        "license_number": license_number,
        "facility_name": facility_name,
        "details_requested": details_requested,
    }
    frappe.enqueue(
        method="careverse_hq.api.utils.send_custom_email",
        queue="default",
        timeout=300,
        template_name="HealthPro - License Additional Information Requested",
        template_args=args,
        recipient=recipient_email,
        sender="healthpro@kenya-hie.health",
        job_name=f"License Additional Information Requested: {license_number}",
    )

@frappe.whitelist(methods=["PUT", "POST"])
@auth_required()
def add_requested_additional_information(**kwargs):
    """
    Endpoint to add requested additional information to a License Appeal.
    
    Args:
        appeal_id (str): The ID of the License Appeal
        additional_information (array): Additional information provided by the facility 
    Returns:
        dict: API response confirming the addition or error message

    """
    kwargs.pop("cmd", None)

    try:
        appeal_id = kwargs.get("appeal_id")
        additional_information = kwargs.get("additional_information")

        if not appeal_id:
            return api_response(
                success=False,
                message="Missing required fields: 'appeal_id'",
                status_code=400,
            )
    
        if not additional_information:
            return api_response(
                success=False,
                message="Missing required fields: 'additional_information'",
                status_code=400,
            )
        
        #confrm additional_information is a list
        if not isinstance(additional_information, list):
            return api_response(
                success=False,
                message="'additional_information' must be a list/array",
                status_code=400,
            )

        for request in additional_information:
            if not isinstance(request, dict) or "appeal_id" not in request or "response" not in request:
                return api_response(
                    success=False,
                    message="Each item in 'details_requested' must be an object with 'appeal_id' and 'response' keys",
                    status_code=400,
                )

        # Check if license exists
        if not frappe.db.exists("License Appeal", appeal_id):
            return api_response(
                success=False,
                message=f"License Appeal does not exist",
                status_code=404,
            )
        

        appeal_doc = frappe.get_doc("License Appeal", appeal_id)

        #The additional_information must correspond to requested details 
        #additional_information is expected to be a list of dicts with keys 'requested_detail' and optional 'description'

        requested_details = [item.name for item in appeal_doc.additional_information if item.status == "Requested"]
        for info in additional_information:
            r_details = info.get("appeal_id")
            if r_details not in requested_details:
                return api_response(
                    success=False,
                    message=f"Provided additional information id  '{info.get('appeal_id')}' was not requested.",
                    status_code=400,
                )
        #update the record to mark requested details as provided include the description if provided
        for info in additional_information:
            for item in appeal_doc.additional_information:
                if item.name == info.get("appeal_id") and item.status == "Requested":
                    item.status = "Submitted"
                    item.provided_on = nowdate()
                    if "response" in info and info.get("response") is not None:
                        item.response = info.get("response")

        appeal_doc.save()
        frappe.db.commit()

        return api_response(
            success=True,
            message="Additional information added successfully",
            status_code=200,
        )

    except Exception as e:
        frappe.log_error("Add Requested Additional Information Failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=f"Failed to add additional information: {str(e)}",
            status_code=500,
        )
