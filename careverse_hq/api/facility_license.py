# Copyright (c) 2025, Tiberbu and contributors
# For license information, please see license.txt


import frappe
from frappe import _
from frappe.utils.data import add_days, getdate, nowdate
from werkzeug.utils import secure_filename
from frappe.exceptions import ValidationError, PermissionError, DoesNotExistError
from healthpro_erp.healthpro_erp.decorators.permissions import auth_required, AuthError
from .utils import api_response, upload_file, sync_data_to_c360


def _post_license_application_to_c360(license_doc):
    regulatory_body = frappe.get_doc("Regulatory Body", license_doc.regulatory_body)
    health_facility = frappe.get_doc("Health Facility", license_doc.health_facility)
    
    if license_doc.application_type == "Renewal":
        old_license = frappe.get_doc("License Record", license_doc.linked_license)
        linked_license = license_doc.linked_license
        amended_from = old_license.license_number
    else:
        linked_license = None
        amended_from = None
    
    compliance_docs = []
    for doc in license_doc.compliance_documents:
        compliance_docs.append(
            {
                "document_type": doc.document_type,
                "document_file": doc.document_file
            }
        )        
    payload = {
        "health_facility": health_facility.registration_number,
        "application_type": license_doc.application_type,
        "license_type": license_doc.license_type,
        "is_paid": license_doc.license_fee_paid,
        "license_application_id": license_doc.name,
        "license_fee": license_doc.license_fee,
        "remarks": license_doc.remarks,
        "regulatory_body": regulatory_body.abbreviation, 
        "linked_license": linked_license, # required if application_type: renewal
        "payment_reference": license_doc.payment_reference,
        "mpesa_checkout_request_id": license_doc.mpesa_checkout_request_id,
        "conditions": license_doc.conditions,
        "amended_from": amended_from, # null if application_type: new
        "compliance_documents": compliance_docs,
        "debug_mode": 1
    }
    
    frappe.enqueue(
        method="careverse_hq.api.utils.sync_data_to_c360",
        queue="long",
        timeout=1800,  # 30 minutes
        payload=payload,
        api_reference="Post License Application to C360",
        api_uri="/v1/C360/create-facility-license-application",
        job_name=f"c360_post_license_application_{license_doc.name}_{frappe.utils.now()}",
    )
    
    
def validate_department_belongs_to_facility(department_id, health_facility_id):
    """
    Validate that a department belongs to the specified health facility.

    Args:
        department_id (str): Department ID to validate
        health_facility_id (str): Health Facility ID that should own the department

    Returns:
        tuple: (is_valid, error_message)
            - is_valid (bool): True if validation passes, False otherwise
            - error_message (str): Error message if validation fails, None otherwise
    """
    if not department_id:
        return True, None

    if not frappe.db.exists("Department", department_id):
        return False, f"Department '{department_id}' does not exist"

    dept_facility = frappe.db.get_value(
        "Department", department_id, "custom_health_facility"
    )

    # Check if department has no health facility assigned
    if not dept_facility:
        return (
            False,
            f"Department '{department_id}' does not have a Health Facility assigned",
        )

    if dept_facility != health_facility_id:
        return (
            False,
            f"Department '{department_id}' does not belong to Health Facility '{health_facility_id}'.",
        )

    return True, None


def validate_service_point_belongs_to_facility(service_point_id, health_facility_id):
    """
    Validate that a service point belongs to the specified health facility.

    Args:
        service_point_id (str): Service Point ID to validate
        health_facility_id (str): Health Facility ID that should own the service point

    Returns:
        tuple: (is_valid, error_message)
            - is_valid (bool): True if validation passes, False otherwise
            - error_message (str): Error message if validation fails, None otherwise
    """
    if not service_point_id:
        return True, None

    if not frappe.db.exists("Service Points", service_point_id):
        return False, f"Service Point '{service_point_id}' does not exist"

    sp_facility = frappe.db.get_value(
        "Service Points", service_point_id, "health_facility"
    )

    # Check if service point has no health facility assigned
    if not sp_facility:
        return (
            False,
            f"Service Point '{service_point_id}' does not have a Health Facility assigned",
        )

    if sp_facility != health_facility_id:
        return (
            False,
            f"Service Point '{service_point_id}' does not belong to Health Facility '{health_facility_id}'.",
        )

    return True, None


@frappe.whitelist(methods=["POST"])
@auth_required()
def create_facility_license(**kwargs):
    """
    Create a new License Record record.

    Args:
        **kwargs: License information including:
            - health_facility (str, required): Health Facility ID
            - license_type (str, required): License Type (Registry Dictionary Concept)
            - application_type (str, required): Renewal | New
            - linked_license (str, optional): Expired license id. Required if application_type = Renewal
            - service_point (str, optional): Service Point ID
            - regulatory_body (str, optional): Regulatory Body ID
            - license_fee (float, optional): License fee amount
            - compliance_documents (list, optional): Attached license documents
            - services (list, optional): List of services allowed by license type

    Returns:
            dict: API response with created license data or error message
    """
    # Remove Frappe command parameter
    kwargs.pop("cmd", None)

    try:
        # Validate required fields
        required_fields = [
            ("health_facility", "Health Facility"),
            ("license_type", "License Type ID"),
            ("license_type_name", "License Type Name"),
            ("application_type", "Application Type"),
        ]

        missing_fields = []
        for field_name, display_name in required_fields:
            if not kwargs.get(field_name):
                missing_fields.append(f"{display_name} ('{field_name}')")

        if missing_fields:
            return api_response(
                success=False,
                message=f"Missing required fields: {', '.join(missing_fields)}",
                status_code=400,
            )

        application_type = kwargs.get("application_type")
        linked_license = kwargs.get("linked_license")
        if application_type not in ["New", "Renewal"]:
            return api_response(
                success=False,
                message=f"Application type ('application_type') can be 'New' or 'Renewal' only.",
                status_code=404,
            )

        linked_license_doc = None
        if application_type == "Renewal":
            # Validate Linked License and it's status
            if not linked_license:
                return api_response(
                    success=False,
                    message="Missing required fields: Linked license ('linked_license')",
                    status_code=404,
                )
            try:
                linked_license_doc = frappe.get_doc("License Record", linked_license)
            except frappe.DoesNotExistError:
                return api_response(
                    success=False,
                    message=f"Linked License '{linked_license}' does not exist",
                    status_code=404,
                )

            if linked_license_doc.status != "Expired":
                return api_response(
                    success=False,
                    message=f"Linked License '{linked_license}' is not expired yet. Only expired licenses can be renewed.",
                    status_code=404,
                )
            linked_license_doc.status = "Pending Renewal"

        # Validate that health facility exists
        if not frappe.db.exists("Health Facility", kwargs.get("health_facility")):
            return api_response(
                success=False,
                message=f"Health Facility '{kwargs.get('health_facility')}' does not exist",
                status_code=404,
            )

        # Validate regulatory body if provided
        if kwargs.get("regulatory_body"):
            if not frappe.db.exists("Regulatory Body", kwargs.get("regulatory_body")):
                return api_response(
                    success=False,
                    message=f"Regulatory Body '{kwargs.get('regulatory_body')}' does not exist",
                    status_code=404,
                )

        # Validate service point if provided and ensure it belongs to the health facility
        if kwargs.get("service_point"):
            is_valid, error_msg = validate_service_point_belongs_to_facility(
                kwargs.get("service_point"), kwargs.get("health_facility")
            )
            if not is_valid:
                return api_response(success=False, message=error_msg, status_code=400)

        if kwargs.get("services"):
            # confirm services is a list
            if not isinstance(kwargs.get("services"), list):
                return api_response(
                    success=False,
                    message="Services ('services') must be a list/array",
                    status_code=400,
                )

        # Create the license using the doctype class method
        from healthpro_erp.healthpro_erp.doctype.license_record.license_record import (
            LicenseRecord,
        )

        if linked_license_doc:
            linked_license_doc.save()
        license_doc = LicenseRecord.create_license(kwargs)

        # services
        if kwargs.get("services"):
            for service in kwargs.get("services"):
                license_doc.append(
                    "services",
                    {
                        "available_services": service.get("service"),
                        "is_available": service.get("is_available"),
                    },
                )

        # Upload documents
        files = frappe.request.files
        if files and len(files) > 0:
            for file_key in list(files.keys()):
                document_type, document_file = upload_file(
                    frappe.request.files, "License Record", license_doc.name, file_key
                )
                license_doc.append(
                    "compliance_documents",
                    {"document_type": document_type, "document_file": document_file},
                )

        license_doc.save()
        frappe.db.commit()
        _post_license_application_to_c360(license_doc)
        
        # Prepare response data
        response_data = {
            "license_id": license_doc.name,
            "health_facility": license_doc.health_facility,
            "application_type": license_doc.application_type,
            "license_type": license_doc.license_type,
            "license_type_name": license_doc.license_type_name,
            "status": license_doc.status,
            "license_fee": license_doc.license_fee,
            "license_fee_paid": license_doc.license_fee_paid,
            "creation": license_doc.creation,
        }

        return api_response(
            success=True,
            message=f"License Record '{license_doc.name}' created successfully",
            data=response_data,
            status_code=201,
        )

    except ValidationError as ve:
        frappe.db.rollback()
        return api_response(success=False, message=str(ve), status_code=400)

    except PermissionError as pe:
        frappe.db.rollback()
        return api_response(
            success=False,
            message="You do not have permission to create License Record records",
            status_code=403,
        )

    except AuthError as ae:
        return api_response(
            success=False, message=ae.message, status_code=ae.status_code
        )

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error("License Record Creation Failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=f"Failed to create License Record: {str(e)}",
            status_code=500,
        )


@frappe.whitelist(methods=["GET"])
@auth_required()
def get_facility_license(**kwargs):
    """
    Retrieve a License Record record by ID.

    Args:
            license_id (str, required): The ID of the license to retrieve

    Returns:
            dict: API response with license data or error message
    """
    kwargs.pop("cmd", None)

    try:
        license_id = kwargs.get("license_id")

        if not license_id:
            return api_response(
                success=False,
                message="Missing required field: License ID ('license_id')",
                status_code=400,
            )

        license_data = frappe.get_doc("License Record", license_id)

        # Check if license exists and user has permission to view it
        if not license_data:
            if frappe.db.exists("License Record", license_id):
                return api_response(
                    success=False,
                    message="You do not have permission to view this License Record",
                    status_code=403,
                )
            else:
                return api_response(
                    success=False,
                    message=f"License Record '{license_id}' not found",
                    status_code=404,
                )

        # Documents list
        documents_list = [
            {
                "document_type": doc.get("document_type"),
                "document_file": doc.get("document_file"),
            }
            for doc in license_data.get("compliance_documents")
        ]

        services_list = [
            {
                "service": service.get("available_services"),
                "is_available": service.get("is_available"),
            }
            for service in license_data.get("services")
        ]

        additional_information = [
            {
                "request_id": info.get("name"),
                "title": info.get("title"),
                "request_comment": info.get("request_comment"),
                "status": info.get("status"),
                "response": info.get("response"),
                "requested_on": info.get("requested_on"),
                "provided_on": info.get("provided_on"),
            }
            for info in license_data.get("additional_information")
        ]

        license_appeals = frappe.get_list(
            "License Appeal",
            filters={"license": license_data.get("name")},
            fields=[
                "name as appeal_id",
                "appeal_reason",
                "creation as appeal_date",
                "status",
                "review_decision",
                "reviewed_by",
                "review_date",
            ],
        )

        # Prepare response data
        response_data = {
            "license_id": license_data.get("name"),
            "health_facility": license_data.get("health_facility"),
            "license_type": license_data.get("license_type"),
            "license_type_name": license_data.get("license_type_name"),
            "license_number": license_data.get("license_number"),
            "regulatory_body": license_data.get("regulatory_body"),
            "issue_date": license_data.get("issue_date"),
            "expiry_date": license_data.get("expiry_date"),
            "status": license_data.get("status"),
            "license_denial_comment":license_data.get("license_denial_comment"),
            "license_denial_comment_author":license_data.get("license_denial_comment_author"),
            "license_denial_comment_creation":license_data.get("license_denial_comment_creation"),
            "request_info_comment":license_data.get("conditions"),
            "request_info_author":license_data.get("conditions_author"),
            "request_info_creation":license_data.get("conditions_creation"),
            "license_fee": license_data.get("license_fee"),
            "license_fee_paid": license_data.get("license_fee_paid"),
            "payment_reference": license_data.get("payment_reference"),
            "mpesa_checkout_request_id": license_data.get("mpesa_checkout_request_id"),
            "application_type": license_data.get("application_type"),
            "services": services_list,
            "compliance_documents": documents_list,
            "additional_information": additional_information,
            "appeals": license_appeals,
            "creation": license_data.get("creation"),
            "modified": license_data.get("modified"),
        }

        return api_response(success=True, data=response_data, status_code=200)

    except PermissionError:
        return api_response(
            success=False,
            message="You do not have permission to view this License Record",
            status_code=403,
        )

    except AuthError as ae:
        return api_response(
            success=False, message=ae.message, status_code=ae.status_code
        )

    except Exception as e:
        frappe.log_error("License Record Retrieval Failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=f"Failed to retrieve License Record: {str(e)}",
            status_code=500,
        )


@frappe.whitelist(methods=["PUT", "POST"])
# @auth_required()
def update_facility_license(**kwargs):
    """
    Update an existing License Record record.

    Args:
            license_id (str, required): The ID of the license to update
            **kwargs: Fields to update (same as create_facility_license)

    Returns:
            dict: API response with updated license data or error message
    """
    kwargs.pop("cmd", None)

    try:
        license_id = kwargs.get("license_id")

        if not license_id:
            return api_response(
                success=False,
                message="Missing required field: License ID ('license_id')",
                status_code=400,
            )

        accessible_licenses = frappe.get_list(
            "License Record",
            filters={"name": license_id},
            fields=["name"],
            ignore_permissions=False,
        )

        # Check if license exists and user has permission to view it
        if not accessible_licenses:
            if frappe.db.exists("License Record", license_id):
                return api_response(
                    success=False,
                    message="You do not have permission to update this License Record",
                    status_code=403,
                )
            else:
                return api_response(
                    success=False,
                    message=f"License Record '{license_id}' not found",
                    status_code=404,
                )

        linked_license_doc = None
        license_doc = frappe.get_doc("License Record", license_id)
        if license_doc.application_type == "Renewal":
            linked_license = license_doc.linked_license
            try:
                linked_license_doc = frappe.get_doc("License Record", linked_license)
                if kwargs.get("status") == "Active":
                    linked_license_doc.status = "Renewed"
            except frappe.DoesNotExistError:
                pass

        # Check if document is in draft state (docstatus=0)
        if license_doc.docstatus != 0:
            status_map = {0: "Draft", 1: "Submitted", 2: "Cancelled"}
            return api_response(
                success=False,
                message=f"Cannot update License Record in {status_map.get(license_doc.docstatus, 'Unknown')} state. Only Draft records can be updated.",
                status_code=400,
            )

        # Update fields
        updatable_fields = {
            "status": "status",
            "license_number": "license_number",
            "start_date": "issue_date",
            "end_date": "expiry_date",
            "license_document": "license_document",
            "comments": "remarks",
        }

        for field in updatable_fields:
            if field in kwargs and kwargs.get(field) is not None:
                setattr(license_doc, updatable_fields.get(field), kwargs.get(field))

        # Save the document
        if linked_license_doc:
            linked_license_doc.save()
        license_doc.save()
        frappe.db.commit()

        # Prepare response data
        response_data = {
            "license_id": license_doc.name,
            "status": license_doc.status,
            "modified": license_doc.modified,
        }

        return api_response(
            success=True,
            message=f"License Record '{license_doc.name}' updated successfully",
            data=response_data,
            status_code=200,
        )

    except ValidationError as ve:
        frappe.db.rollback()
        return api_response(success=False, message=str(ve), status_code=400)

    except PermissionError:
        frappe.db.rollback()
        return api_response(
            success=False,
            message="You do not have permission to update this License Record",
            status_code=403,
        )

    except AuthError as ae:
        return api_response(
            success=False, message=ae.message, status_code=ae.status_code
        )

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error("License Record Update Failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=f"Failed to update License Record: {str(e)}",
            status_code=500,
        )
    
def normalize_license_kwargs(response_data):
    """
    Normalize different response formats into a consistent structure
    
    Handles:
    1. Denied (simple): {"license_application_id": "LR-3823", "application_status": "denied", "denial_comment": "..."}
    2. Denied (nested): {"license_application_id": "LR-3823", "application_status": "denied", "comment": {"denial_comment": "...", "created_by": "...", "creation": "..."}}
    3. Info Requested (simple): {"license_application_id": "LR-3823", "application_status": "info_requested", "request_info_comment": "..."}
    4. Info Requested (nested): {"license_application_id": "LR-3823", "application_status": "info_requested", "comment": {"request_info_comment": "...", "created_by": "...", "creation": "..."}}
    5. Issued (simple only): {"license_application_id": "LR-3823", "application_status": "issued"}
    
    Note: Denied and info_requested follow the same methodology with both simple and nested formats.
          Issued status only uses simple format with no nested comments.
    """
    normalized = {}

    # Map application_status to license id
    if "license_application_id" in response_data:
        normalized["license_id"] = response_data["license_application_id"]
    
    # Copy license application ID
    if "license_application_id" in response_data:
        normalized["license_application_id"] = response_data["license_application_id"]
    
    # Map application_status to status
    if "application_status" in response_data:
        normalized["status"] = response_data["application_status"]
    
    # Handle DENIED status - comment can be at root or nested
    if response_data.get("application_status") in ["denied",'Denied']:
        normalized["status"] = "Denied"
        if "denial_comment" in response_data:
            # Format 1: Direct denial_comment at root level
            normalized["license_denial_comment"] = response_data["denial_comment"]
        
        elif "comment" in response_data and isinstance(response_data["comment"], dict):
            # Format 2: Nested comment object
            comment_obj = response_data["comment"]
            
            if "denial_comment" in comment_obj:
                normalized["license_denial_comment"] = comment_obj["denial_comment"]
            
            if "created_by" in comment_obj:
                normalized["license_denial_comment_author"] = comment_obj["created_by"]
            
            if "creation" in comment_obj:
                normalized["license_denial_comment_creation"] = comment_obj["creation"]
    
    # Handle INFO REQUESTED status - same methodology as denial
    if response_data.get("application_status") in ["info_requested","info requested","Info Requested"]:
        normalized["status"] = "Info Requested"
        if "request_info_comment" in response_data:
            # Format 1: Direct request_info_comment at root level
            normalized["conditions"] = response_data["request_info_comment"]
        
        elif "comment" in response_data and isinstance(response_data["comment"], dict):
            # Format 2: Nested comment object (same as denial format)
            comment_obj = response_data["comment"]
            
            if "request_info_comment" in comment_obj:
                normalized["conditions"] = comment_obj["request_info_comment"]
            
            if "created_by" in comment_obj:
                normalized["conditions_author"] = comment_obj["created_by"]
            
            if "creation" in comment_obj:
                normalized["conditions_creation"] = comment_obj["creation"]
    
    
    return normalized


@frappe.whitelist(methods=["PUT", "POST"])
def update_facility_license_c360(**kwargs):
    """
    Update an existing License Record record.

    Args:
            license_id (str, required): The ID of the license to update
            **kwargs: Fields to update (same as create_facility_license)

    Returns:
            dict: API response with updated license data or error message
    """
    kwargs.pop("cmd", None)
    kwargs = normalize_license_kwargs(kwargs)

    try:
        license_id = kwargs.get("license_id")

        if not license_id:
            return api_response(
                success=False,
                message="Missing required field: License ID ('license_id')",
                status_code=400,
            )

        accessible_licenses = frappe.get_list(
            "License Record",
            filters={"name": license_id},
            fields=["name"],
            ignore_permissions=False,
        )

        # Check if license exists and user has permission to view it
        if not accessible_licenses:
            if frappe.db.exists("License Record", license_id):
                return api_response(
                    success=False,
                    message="You do not have permission to update this License Record",
                    status_code=403,
                )
            else:
                return api_response(
                    success=False,
                    message=f"License Record '{license_id}' not found",
                    status_code=404,
                )

        linked_license_doc = None
        license_doc = frappe.get_doc("License Record", license_id)
        if license_doc.application_type == "Renewal":
            linked_license = license_doc.linked_license
            try:
                linked_license_doc = frappe.get_doc("License Record", linked_license)
                if kwargs.get("status") == "Active":
                    linked_license_doc.status = "Renewed"
            except frappe.DoesNotExistError:
                pass

        # Check if document is in draft state (docstatus=0)
        if license_doc.docstatus != 0:
            status_map = {0: "Draft", 1: "Submitted", 2: "Cancelled"}
            return api_response(
                success=False,
                message=f"Cannot update License Record in {status_map.get(license_doc.docstatus, 'Unknown')} state. Only Draft records can be updated.",
                status_code=400,
            )
        

        # Update fields
        updatable_fields = {
            "status": "status",
            "license_number": "license_number",
            "start_date": "issue_date",
            "end_date": "expiry_date",
            "license_document": "license_document",
            "license_denial_comment":"license_denial_comment",
            "license_denial_comment_author":"license_denial_comment_author",
            "license_denial_comment_creation":"license_denial_comment_creation",
            "conditions":"conditions",
            "conditions_author":"conditions_author",
            "conditions_creation":"conditions_creation",
            "comments": "remarks",
        }

        for field in updatable_fields:
            if field in kwargs and kwargs.get(field) is not None:
                setattr(license_doc, updatable_fields.get(field), kwargs.get(field))

        # Save the document
        if linked_license_doc:
            linked_license_doc.save()
        license_doc.save()
        frappe.db.commit()

        # Prepare response data
        response_data = {
            "license_id": license_doc.name,
            "status": license_doc.status,
            "modified": license_doc.modified,
        }

        return api_response(
            success=True,
            message=f"License Record '{license_doc.name}' updated successfully",
            data=response_data,
            status_code=200,
        )

    except ValidationError as ve:
        frappe.db.rollback()
        return api_response(success=False, message=str(ve), status_code=400)

    except PermissionError:
        frappe.db.rollback()
        return api_response(
            success=False,
            message="You do not have permission to update this License Record",
            status_code=403,
        )

    except AuthError as ae:
        return api_response(
            success=False, message=ae.message, status_code=ae.status_code
        )

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error("License Record Update Failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=f"Failed to update License Record: {str(e)}",
            status_code=500,
        )


@frappe.whitelist(methods=["DELETE", "POST"])
@auth_required()
def delete_facility_license(**kwargs):
    """
    Delete a License Record record.

    Args:
            license_id (str, required): The ID of the license to delete

    Returns:
            dict: API response confirming deletion or error message
    """
    kwargs.pop("cmd", None)

    try:
        license_id = kwargs.get("license_id")

        if not license_id:
            return api_response(
                success=False,
                message="Missing required field: License ID ('license_id')",
                status_code=400,
            )

        # First check if user has permission to access this license
        accessible_licenses = frappe.get_list(
            "License Record",
            filters={"name": license_id},
            fields=["name", "license_number"],
            ignore_permissions=False,
        )

        # Check if license exists and user has permission to view it
        if not accessible_licenses:
            if frappe.db.exists("License Record", license_id):
                return api_response(
                    success=False,
                    message="You do not have permission to delete this License Record",
                    status_code=403,
                )
            else:
                return api_response(
                    success=False,
                    message=f"License Record '{license_id}' not found",
                    status_code=404,
                )

        license_number = accessible_licenses[0].get("license_number")

        license_doc = frappe.get_doc("License Record", license_id)

        # Only draft (docstatus=0) or cancelled (docstatus=2) documents can be deleted
        if license_doc.docstatus == 1:
            return api_response(
                success=False,
                message="Cannot delete a Submitted License Record. Please cancel it first before deleting.",
                status_code=400,
            )

        license_doc.delete()
        frappe.db.commit()

        return api_response(
            success=True,
            message=f"License Record '{license_id}' of License Number: {license_number} deleted successfully",
            status_code=200,
        )

    except PermissionError:
        frappe.db.rollback()
        return api_response(
            success=False,
            message="You do not have permission to perform delete operations on License Records",
            status_code=403,
        )

    except AuthError as ae:
        return api_response(
            success=False, message=ae.message, status_code=ae.status_code
        )

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error("License Record Deletion Failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=f"Failed to delete License Record: {str(e)}",
            status_code=500,
        )


@frappe.whitelist(methods=["GET"])
@auth_required()
def list_facility_licenses(**kwargs):
    """
    List License Record records with optional filtering.

    Args:
            health_facility (str, optional): Filter by health facility
            license_type (str, optional): Filter by license type
            status (str, optional): Filter by status
            license_number (str, optional): Filter by license number (fuzzy search)
            page (int, optional): Page number for pagination (default: 1)
            page_size (int, optional): Number of records per page (default: 20)

    Returns:
            dict: API response with list of licenses or error message
    """
    kwargs.pop("cmd", None)

    try:
        # Build filters
        filters = {}

        # Exact match filters
        if kwargs.get("health_facility"):
            filters["health_facility"] = kwargs.get("health_facility")

        if kwargs.get("license_type"):
            filters["license_type"] = kwargs.get("license_type")

        if kwargs.get("status"):
            filters["status"] = kwargs.get("status")

        if kwargs.get("expiry_date_from"):
            filters["expiry_date"] = [">=", kwargs.get("expiry_date_from")]

        if kwargs.get("expiry_date_to"):
            filters["expiry_date"] = ["<=", kwargs.get("expiry_date_to")]

        fetch_applications = kwargs.get("fetch_applications", 0)
        if fetch_applications and fetch_applications != "0":
            filters["license_number"] = ["=", ""]
        else:
            filters["license_number"] = ["is", "set"]
            # Fuzzy search for license_number using LIKE
            license_number_filter = kwargs.get("license_number")
            if license_number_filter:
                filters["license_number"] = ["like", f"%{license_number_filter}%"]

        # Pagination
        page = int(kwargs.get("page", 1))
        page_size = int(kwargs.get("page_size", 20))

        # Validate pagination parameters
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 100:
            page_size = 20

        start = (page - 1) * page_size

        # Get licenses using frappe.get_list (respects permissions)
        # Note: frappe.get_list respects User Permissions and Role Permissions
        licenses = frappe.get_list(
            "License Record",
            filters=filters,
            fields=[
                "name as license_id",
                "health_facility",
                "license_type",
                "license_type_name",
                "license_number",
                "application_type",
                "issue_date",
                "expiry_date",
                "status",
                "license_fee",
                "license_fee_paid",
                "payment_reference",
                "creation",
                "modified",
            ],
            order_by="creation desc",
            start=start,
            page_length=page_size,
            ignore_permissions=False,
        )

        total_count = len(
            frappe.get_list(
                "License Record",
                filters=filters,
                ignore_permissions=False,
                limit_page_length=0,
            )
        )

        # Calculate pagination info
        total_pages = (total_count + page_size - 1) // page_size

        pagination = {
            "current_page": page,
            "per_page": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
        }

        return api_response(
            success=True, data=licenses, pagination=pagination, status_code=200
        )

    except AuthError as ae:
        return api_response(
            success=False, message=ae.message, status_code=ae.status_code
        )

    except Exception as e:
        frappe.log_error("License Record List Failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=f"Failed to retrieve License Records: {str(e)}",
            status_code=500,
        )


@frappe.whitelist(methods=["GET"])
@auth_required()
def get_license_statistics(
    date_from=None, date_to=None, status=None, license_type=None, health_facility=None
):
    """
    Get statistics for License Records with permission checks and filters

    Args:
        date_from (str): Filter by creation date from (YYYY-MM-DD)
        date_to (str): Filter by creation date to (YYYY-MM-DD)
        status (str): Filter by specific status
        license_type (str): Filter by specific license type
        health_facility (str): Filter by specific health facility

    Returns:
        dict: Statistics including counts by status, type, and expiry
    """
    # Check if user has read permission for License Record
    if not frappe.has_permission("License Record", "read"):
        frappe.throw(_("Insufficient Permission"), frappe.PermissionError)

    # Build base filters
    filters = build_filters(date_from, date_to, status, license_type, health_facility)

    stats = {
        "total_licenses": get_total_count(filters),
        "by_status": get_status_breakdown(filters),
        "by_license_type": get_license_type_breakdown(filters),
        "by_application_type": get_application_type_breakdown(filters),
        "expiring_soon": get_expiring_soon_count(filters),
        "expired": get_expired_count(filters),
        "active": get_active_count(filters),
        "payment_stats": get_payment_stats(filters),
    }

    return stats


def build_filters(
    date_from=None, date_to=None, status=None, license_type=None, health_facility=None
):
    """
    Build filter dictionary based on provided parameters

    Args:
        date_from (str): Filter by creation date from
        date_to (str): Filter by creation date to
        status (str): Filter by status
        license_type (str): Filter by license type
        health_facility (str): Filter by health facility

    Returns:
        dict: Filter dictionary for Frappe ORM
    """
    filters = {}

    # Date range filter (using creation date)
    if date_from and date_to:
        filters["creation"] = ["between", [getdate(date_from), getdate(date_to)]]
    elif date_from:
        filters["creation"] = [">=", getdate(date_from)]
    elif date_to:
        filters["creation"] = ["<=", getdate(date_to)]

    # Status filter
    if status:
        filters["status"] = status

    # License type filter
    if license_type:
        filters["license_type"] = license_type

    # Health facility filter
    if health_facility:
        filters["health_facility"] = health_facility

    return filters


def get_total_count(filters):
    """Get total number of license records"""
    return frappe.db.count("License Record", filters=filters)


def get_status_breakdown(filters):
    """Get count of licenses by status"""
    # Define all possible statuses
    all_statuses = [
        "Active",
        "Expired",
        "Suspended",
        "Revoked",
        "Pending Renewal",
        "Appealed",
        "Under Review",
        "Info Requested" "Denied",
    ]

    # Initialize with zeros
    status_counts = {status: 0 for status in all_statuses}

    # Get actual counts
    licenses = frappe.get_all(
        "License Record",
        fields=["status", "count(name) as count"],
        filters=filters,
        group_by="status",
    )

    # Update with actual counts
    for row in licenses:
        if row.status:
            status_counts[row.status] = row.count

    return status_counts


def get_license_type_breakdown(filters):
    """Get count of licenses by license type using ORM"""
    # Add filter for non-null license_type
    type_filters = filters.copy()
    type_filters["license_type"] = ["is", "set"]

    licenses = frappe.get_all(
        "License Record",
        fields=["license_type", "count(name) as count"],
        filters=type_filters,
        group_by="license_type",
    )

    return {row.license_type: row.count for row in licenses}


def get_application_type_breakdown(filters):
    """Get count by application type (New/Renewal)"""
    # Define all possible application types
    all_application_types = ["New", "Renewal"]

    # Initialize with zeros
    app_type_counts = {app_type: 0 for app_type in all_application_types}

    # Add filter for non-null application_type
    app_filters = filters.copy()
    app_filters["application_type"] = ["is", "set"]

    # Get actual counts
    licenses = frappe.get_all(
        "License Record",
        fields=["application_type", "count(name) as count"],
        filters=app_filters,
        group_by="application_type",
    )

    # Update with actual counts
    for row in licenses:
        if row.application_type:
            app_type_counts[row.application_type] = row.count

    return app_type_counts


def get_expiring_soon_count(filters):
    """Get count of licenses expiring in next 30 days using ORM"""
    settings = frappe.get_single("HealthPro Backend Settings")
    today = nowdate()
    expiring_soon_days = settings.get("expiring_soon_no_of_days") or 30
    future_date = add_days(today, expiring_soon_days)

    # Merge with base filters
    expiry_filters = filters.copy()
    expiry_filters.update(
        {"expiry_date": ["between", [today, future_date]], "status": "Active"}
    )

    return frappe.db.count("License Record", filters=expiry_filters)


def get_expired_count(filters):
    """Get count of expired licenses using ORM"""
    today = nowdate()

    # Merge with base filters
    expired_filters = filters.copy()
    expired_filters.update(
        {"expiry_date": ["<", today], "status": ["not in", ["Expired", "Revoked"]]}
    )

    return frappe.db.count("License Record", filters=expired_filters)


def get_active_count(filters):
    """Get count of active licenses using ORM"""
    # Merge with base filters
    active_filters = filters.copy()
    active_filters["status"] = "Active"

    return frappe.db.count("License Record", filters=active_filters)


def get_payment_stats(filters):
    """Get payment statistics using ORM"""
    # Get all records with permission check
    licenses = frappe.get_all(
        "License Record",
        fields=["name", "license_fee_paid", "license_fee"],
        filters=filters,
    )

    total = len(licenses)
    paid = sum(1 for l in licenses if l.license_fee_paid == 1)
    unpaid = total - paid
    total_fees = sum(l.license_fee or 0 for l in licenses)
    collected_fees = sum(
        l.license_fee or 0 for l in licenses if l.license_fee_paid == 1
    )

    return {
        "total_records": total,
        "paid": paid,
        "unpaid": unpaid,
        "total_fees": total_fees,
        "collected_fees": collected_fees,
    }


@frappe.whitelist()
def license_reminder_scheduler():
    # get expiring days from settings
    settings = frappe.get_single("HealthPro Backend Settings")
    license_expiry_reminder_frequency = (
        settings.get("license_expiry_reminder_frequency") or 30
    )

    expiry_min_days = [int(x) for x in license_expiry_reminder_frequency.split(",")]
    # get the largest number
    max_day = max(expiry_min_days)

    # step one fetch all facilities that are about to expire
    # check if there is a license on draft linked to the expiring one
    # if not send email to the facility admin and regional admins
    # Also load the items that are active but date is less than today and update their status to expired

    expiring_licenses = frappe.get_all(
        "License Record",
        filters={
            "expiry_date": ["<=", add_days(nowdate(), max_day)],
            "status": "Active",
        },
        fields=["name", "license_number", "status", "health_facility", "expiry_date"],
    )

    emails_sent = 0
    for license in expiring_licenses:
        # calculate days remaining
        days_remaining = (getdate(license.expiry_date) - getdate(nowdate())).days

        if days_remaining < 0 and license.status == "Active":
            # update the status to expired
            license_doc = frappe.get_doc("License Record", license.name)
            license_doc.status = "Expired"
            license_doc.save()
            frappe.db.commit()

            # create a draft renewal license
            clone_license_record(source_license_id=license.name)
            continue  # skip expired licenses

        # check if days_remaining matches any frequency value
        if days_remaining not in expiry_min_days:
            continue  # skip if not a notification day

        # check if there is a draft license linked to this one
        draft_license = frappe.get_all(
            "License Record",
            filters={"linked_license": license.name, "docstatus": 0},
            fields=["name"],
        )
        if draft_license:
            continue  # skip if there is a draft license

        # get the health facility
        health_facility_id = license.get("health_facility")
        health_facility = frappe.get_doc("Health Facility", health_facility_id)
        facility_admin_name = f"{health_facility.get('administrators_first_name')} {health_facility.get('administrators_last_name')}"
        facility_name = health_facility.get("facility_name")
        facility_admin_email = health_facility.get("administrators_email_address")

        _send_lisense_expiry_notification(
            user=facility_admin_name,
            recipient_email=facility_admin_email,
            license_number=license.license_number,
            facility_name=facility_name,
            days_remaining=days_remaining,
        )

        emails_sent += 1

    frappe.log_error(
        message=f"License Record Reminder sent: {emails_sent} emails",
        title="License Record Reminder Scheduler",
    )
    return api_response(
        success=True,
        message=f"License expiry reminders processed successfully. {emails_sent} emails sent.",
        status_code=200,
    )


def _send_lisense_expiry_notification(
    user,
    recipient_email,
    license_number,
    facility_name,
    days_remaining,
):

    # Send email
    args = {
        "subject": "Lisence About to Expire",
        "user": user,
        "license_number ": license_number,
        "facility_name": facility_name,
        "facility_name": facility_name,
        "days_remaining ": days_remaining,
    }
    frappe.enqueue(
        method="careverse_hq.api.utils.send_custom_email",
        queue="default",
        timeout=300,
        template_name="HealthPro - License About to Expire",
        template_args=args,
        recipient=recipient_email,
        sender="healthpro@kenya-hie.health",
        job_name=f"License send Expiry Notification: {license_number}",
    )


def clone_license_record(source_license_id, **override_kwargs):
    """
    Load an existing License Record and create a new renewal linked to the source.

    Args:
        source_license_id (str): The ID of the license record to clone
        **override_kwargs: Optional fields to override from the source license:
            - health_facility (str): Health Facility ID
            - license_type (str): License Type
            - service_point (str): Service Point ID
            - regulatory_body (str): Regulatory Body ID
            - license_fee (float): License fee amount
            - services (list): List of services

    Returns:
        dict: API response with created license data or error message
    """
    try:
        # Load the source license record
        if not frappe.db.exists("License Record", source_license_id):
            return api_response(
                success=False,
                message=f"License Record '{source_license_id}' does not exist",
                status_code=404,
            )

        source_license = frappe.get_doc("License Record", source_license_id)

        # Prepare data for new license by copying from source
        new_license_data = {
            "health_facility": source_license.health_facility,
            "license_type": source_license.license_type,
            "application_type": "Renewal",  # Always set as Renewal
            "linked_license": source_license_id,  # Link to the source license
            "service_point": source_license.service_point,
            "regulatory_body": source_license.regulatory_body,
            "license_fee": source_license.license_fee,
        }

        # Copy services if they exist
        if hasattr(source_license, "services") and source_license.services:
            new_license_data["services"] = [
                {
                    "service": service.service,
                    "service_name": (
                        service.service_name
                        if hasattr(service, "service_name")
                        else None
                    ),
                }
                for service in source_license.services
            ]

        # Copy compliance documents references (not the actual files)
        if (
            hasattr(source_license, "compliance_documents")
            and source_license.compliance_documents
        ):
            new_license_data["compliance_documents"] = [
                {"document_type": doc.document_type, "document_file": doc.document_file}
                for doc in source_license.compliance_documents
            ]

        # Override with any provided kwargs
        new_license_data.update(override_kwargs)

        # Create the new license using the existing function
        return create_facility_license(**new_license_data)

    except Exception as e:
        frappe.log_error("License Record Cloning Failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=f"Failed to clone License Record: {str(e)}",
            status_code=500,
        )


def load_and_create_license(source_license_id):
    """
    Alternative version: Load a license record, optionally modify it, and create new one.

    Args:
        source_license_id (str): The ID of the license record to load
        modifications (dict, optional): Dictionary of fields to modify before creating

    Returns:
        dict: Contains both source data and API response
    """
    try:
        # Load the source license
        if not frappe.db.exists("License Record", source_license_id):
            return {
                "success": False,
                "message": f"License Record '{source_license_id}' does not exist",
                "source_data": None,
                "creation_response": None,
            }

        source_license = frappe.get_doc("License Record", source_license_id)

        # Extract source data
        source_data = {
            "license_id": source_license.name,
            "health_facility": source_license.health_facility,
            "license_type": source_license.license_type,
            "application_type": source_license.application_type,
            "status": source_license.status,
            "license_fee": source_license.license_fee,
            "service_point": source_license.service_point,
            "regulatory_body": source_license.regulatory_body,
        }

        # Prepare new license data
        new_license_data = {
            "health_facility": source_license.health_facility,
            "license_type": source_license.license_type,
            "application_type": "Renewal",
            "linked_license": source_license.name,
            "service_point": source_license.service_point,
            "regulatory_body": source_license.regulatory_body,
            "license_fee": source_license.license_fee,
        }

        # Create the new license
        creation_response = create_facility_license(**new_license_data)

        return {
            "success": True,
            "source_data": source_data,
            "creation_response": creation_response,
        }

    except Exception as e:
        frappe.log_error("Load and Create License Failed", frappe.get_traceback())
        return {
            "success": False,
            "message": f"Failed to load and create license: {str(e)}",
            "source_data": None,
            "creation_response": None,
        }


@frappe.whitelist()
@auth_required()
def request_additional_license_details(**kwargs):
    """
    Endpoint to request additional details for a license record.

    Args:
        license_id (str): The ID of the license record
        details_requested (array): Details being requested from the facility
    Returns:
        dict: API response confirming the request or error message

    """
    kwargs.pop("cmd", None)

    try:
        license_id = kwargs.get("license_id")
        details_requested = kwargs.get("details_requested")

        if not license_id:
            return api_response(
                success=False,
                message="Missing required fields: 'license_id'",
                status_code=400,
            )

        if not details_requested:
            return api_response(
                success=False,
                message="Missing required fields: 'details_requested'",
                status_code=400,
            )

        # confrm details_requested is a list that has title and request_comment as object keys
        if not isinstance(details_requested, list):
            return api_response(
                success=False,
                message="'details_requested' must be a list/array",
                status_code=400,
            )

        for request in details_requested:
            if (
                not isinstance(request, dict)
                or "title" not in request
                or "request_comment" not in request
            ):
                return api_response(
                    success=False,
                    message="Each item in 'details_requested' must be an object with 'title' and 'request_comment' keys",
                    status_code=400,
                )

        # Check if license exists
        if not frappe.db.exists("License Record", license_id):
            return api_response(
                success=False,
                message=f"License Record does not exist",
                status_code=404,
            )

        license_doc = frappe.get_doc("License Record", license_id)
        health_facility = frappe.get_doc("Health Facility", license_doc.health_facility)
        facility_admin_email = health_facility.get("administrators_email_address")
        facility_admin_name = f"{health_facility.get('administrators_first_name')} {health_facility.get('administrators_last_name')}"

        # save the details requested in the license record child table
        for request in details_requested:
            license_doc.append(
                "additional_information",
                {
                    "title": request.get("title"),
                    "request_comment": request.get("request_comment"),
                    "requested_on": nowdate(),
                    "status": "Requested",
                },
            )
        license_doc.save()
        frappe.db.commit()

        titles = ", ".join([item["title"] for item in details_requested])
        # Send email to facility admin
        _send_additional_details_request(
            user=facility_admin_name,
            recipient_email=facility_admin_email,
            license_number=license_doc.license_number,
            facility_name=health_facility.facility_name,
            details_requested=titles,
        )

        return api_response(
            success=True,
            message=f"Additional details request ({titles}) sent successfully",
            status_code=200,
        )

    except Exception as e:
        frappe.log_error(
            "Request Additional License Details Failed", frappe.get_traceback()
        )
        return api_response(
            success=False,
            message=f"Failed to request additional details: {str(e)}",
            status_code=500,
        )


def _send_additional_details_request(
    user,
    recipient_email,
    license_number,
    facility_name,
    details_requested,
):

    # Send email
    args = {
        "subject": "Lisence About to Expire",
        "user": user,
        "license_number ": license_number,
        "facility_name": facility_name,
        "facility_name": facility_name,
        "details_requested ": details_requested,
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
    Endpoint to add requested additional information to a license record.

    Args:
        license_id (str): The ID of the license record
        additional_information (array): Additional information provided by the facility
    Returns:
        dict: API response confirming the addition or error message

    """
    kwargs.pop("cmd", None)

    try:
        license_id = kwargs.get("license_id")
        additional_information = kwargs.get("additional_information")

        if not license_id:
            return api_response(
                success=False,
                message="Missing required fields: 'license_id'",
                status_code=400,
            )

        if not additional_information:
            return api_response(
                success=False,
                message="Missing required fields: 'additional_information'",
                status_code=400,
            )

        # confrm additional_information is a list
        if not isinstance(additional_information, list):
            return api_response(
                success=False,
                message="'additional_information' must be a list/array",
                status_code=400,
            )

        for request in additional_information:
            if (
                not isinstance(request, dict)
                or "request_id" not in request
                or "response" not in request
            ):
                return api_response(
                    success=False,
                    message="Each item in 'details_requested' must be an object with 'request_id' and 'response' keys",
                    status_code=400,
                )

        # Check if license exists
        if not frappe.db.exists("License Record", license_id):
            return api_response(
                success=False,
                message=f"License Record does not exist",
                status_code=404,
            )

        license_doc = frappe.get_doc("License Record", license_id)

        # The additional_information must correspond to requested details
        # additional_information is expected to be a list of dicts with keys 'requested_detail' and optional 'description'

        requested_details = [
            item.name
            for item in license_doc.additional_information
            if item.status == "Requested"
        ]
        for info in additional_information:
            r_details = info.get("request_id")
            if r_details not in requested_details:
                return api_response(
                    success=False,
                    message=f"Provided additional information id  '{info.get('request_id')}' was not requested.",
                    status_code=400,
                )
        # update the record to mark requested details as provided include the description if provided
        for info in additional_information:
            for item in license_doc.additional_information:
                if item.name == info.get("request_id") and item.status == "Requested":
                    item.status = "Submitted"
                    item.provided_on = nowdate()
                    if "response" in info and info.get("response") is not None:
                        item.response = info.get("response")

        license_doc.save()
        frappe.db.commit()

        return api_response(
            success=True,
            message="Additional information added successfully",
            status_code=200,
        )

    except Exception as e:
        frappe.log_error(
            "Add Requested Additional Information Failed", frappe.get_traceback()
        )
        return api_response(
            success=False,
            message=f"Failed to add additional information: {str(e)}",
            status_code=500,
        )


@frappe.whitelist()
@auth_required()
def update_license_record_status(**kwargs):
    """
    Endpoint to approve or decline a license record.

    Args:
        license_id (str): The ID of the license record
        action (str): "approve" or "decline"
    Returns:
        dict: API response confirming the action or error message

    """
    kwargs.pop("cmd", None)

    try:
        license_id = kwargs.get("license_id")
        status = kwargs.get("status")

        if not license_id:
            return api_response(
                success=False,
                message="Missing required fields: 'license_id'",
                status_code=400,
            )

        if status not in [
            "Active",
            "Expired",
            "Suspended",
            "Revoked",
            "Pending Renewal",
            "Appealed",
            "Under Review",
            "Info Requested" "Denied",
        ]:

            return api_response(
                success=False,
                message="Invalid Status. Must be 'Active','Expired','Suspended','Revoked','Pending Renewal','Appealed','Under Review','Info Requested' or 'Denied'.",
                status_code=400,
            )

        # Check if license exists
        if not frappe.db.exists("License Record", license_id):
            return api_response(
                success=False,
                message=f"License Record does not exist",
                status_code=404,
            )

        license_doc = frappe.get_doc("License Record", license_id)

        license_doc.status = status

        license_doc.save()
        frappe.db.commit()

        return api_response(
            success=True,
            message=f"License Record updated successfully",
            status_code=200,
        )

    except Exception as e:
        frappe.log_error(
            "Approve/Decline License Record Failed", frappe.get_traceback()
        )
        return api_response(
            success=False,
            message=f"Failed to update the status to {status} for License Record: {str(e)}",
            status_code=500,
        )


@frappe.whitelist()
@auth_required()
def submit_license_for_review(**kwargs):
    """
    Endpoint to license record for review.

    Args:
        license_id (str): The ID of the license record
    Returns:
        dict: API response confirming the action or error message

    """
    kwargs.pop("cmd", None)

    try:
        license_id = kwargs.get("license_id")
        status = kwargs.get("status")

        if not license_id:
            return api_response(
                success=False,
                message="Missing required fields: 'license_id'",
                status_code=400,
            )

        # Check if license exists
        if not frappe.db.exists("License Record", license_id):
            return api_response(
                success=False,
                message=f"License Record does not exist",
                status_code=404,
            )

        # license_doc = frappe.get_doc("License Record", license_id)

        # license_doc.status = "Pending Payment"

        # license_doc.save()
        # frappe.db.commit()

        # _post_license_application_to_c360(license_doc)
        
        return api_response(
            success=True,
            message=f"License Record updated successfully",
            status_code=200,
        )

    except Exception as e:
        frappe.log_error(
            "Review submission for License Record Failed", frappe.get_traceback()
        )
        return api_response(
            success=False,
            message=f"Failed Review submission for License Record: {str(e)}",
            status_code=500,
        )
