from dataclasses import fields

import requests
import frappe
from .hie_settings import HIE
from .encryption import SecureTransportManager
from requests import HTTPError, RequestException
from frappe.exceptions import ValidationError, PermissionError, UniqueValidationError
from .utils import api_response, verify_otp, mask_phone, mask_name, send_otp
from frappe.email.doctype.email_template.email_template import get_email_template
from .jwt_token_management import get_token_manager
from healthpro_erp.healthpro_erp.decorators.permissions import auth_required, AuthError


def add_region(**kwargs):
    kwargs.pop("cmd", None)
    required_fields = [
        "organization",
        "region_name",
    ]
    for field in required_fields:
        if field not in kwargs or not kwargs[field]:
            return api_response(
                success=False,
                message=f"`{field}` is required",
                status_code=400,
            )

    # load the parent organization
    try:
        organization = frappe.get_doc(
            "Healthcare Organization", {"name": kwargs.get("organization")}
        )
    except frappe.DoesNotExistError:
        return api_response(
            success=False,
            message=f"The provided parent organization does not exist!",
            status_code=400,
        )

    # 1. check if region already exist (using unique_identifier)
    import hashlib

    composite = f"{kwargs.get('organization')}_{kwargs.get('region_name')}"
    unique_id = hashlib.md5(composite.encode()).hexdigest()

    region_exists = frappe.db.exists(
        "Healthcare Organization Region",
        {"unique_identifier": unique_id},
    )
    if region_exists:
        return api_response(
            success=False,
            message=f"The provided Region already exists for this organization!",
            status_code=400,
        )

    # Create a new region document
    try:
        h_region = frappe.new_doc("Healthcare Organization Region")
        h_region.region_name = kwargs.get("region_name")
        h_region.parent_organization = organization.get("name")
        h_region.insert()
        frappe.db.commit()

        response = {
            "region": h_region.get("name"),
            "region_name": h_region.get("region_name"),
            "parent_organization": h_region.get("parent_organization"),
            "company": h_region.get("company"),
        }
        return api_response(success=True, status_code=200, data=response)
    except Exception as e:
        frappe.log_error(
            "An error occured while creating region!", "Error: {}".format(str(e))
        )
        return api_response(
            success=False,
            status_code=500,
            data="An error occured while creating region!",
        )


def add_region_v1(**kwargs):
    kwargs.pop("cmd", None)
    required_fields = [
        "organization",
        "region_name",
    ]
    for field in required_fields:
        if field not in kwargs or not kwargs[field]:
            return {
                "success": False,
                "message": "`{}` is required".format(field),
                "status_code": 400,
            }

    # load the parent organization
    try:
        organization = frappe.get_doc(
            "Healthcare Organization", {"name": kwargs.get("organization")}
        )
    except frappe.DoesNotExistError:
        return {
            "success": False,
            "message": "The provided parent organization does not exist!",
            "status_code": 400,
        }

    # 1. check if region already exist (using unique_identifier)
    import hashlib

    composite = f"{kwargs.get('organization')}_{kwargs.get('region_name')}"
    unique_id = hashlib.md5(composite.encode()).hexdigest()

    region_exists = frappe.db.exists(
        "Healthcare Organization Region",
        {"unique_identifier": unique_id},
    )
    if region_exists:
        return {
            "success": False,
            "message": "The provided Region already exists for this organization!",
            "status_code": 400,
        }

    # Create a new region document
    try:
        h_region = frappe.new_doc("Healthcare Organization Region")
        h_region.region_name = kwargs.get("region_name")
        h_region.parent_organization = organization.get("name")
        h_region.insert()

        response = {
            "region": h_region.get("name"),
            "region_name": h_region.get("region_name"),
            "parent_organization": h_region.get("parent_organization"),
            "company": h_region.get("company"),
        }
        return {"success": True, "status_code": 200, "data": response}
    except Exception as e:
        frappe.log_error(
            "An error occured while creating region!", "Error: {}".format(e)
        )
        return {"success": False, "status_code": 500, "message": str(e)}


def edit_region(**kwargs):
    kwargs.pop("cmd", None)
    required_fields = ["region_id", "new_name"]
    for field in required_fields:
        if field not in kwargs or not kwargs[field]:
            return api_response(
                success=False,
                message=f"`{field}` is required",
                status_code=400,
            )
    new_name = kwargs.get("new_name")
    try:
        # load the region
        try:
            r = frappe.get_doc(
                "Healthcare Organization Region", kwargs.get("region_id")
            )
        except frappe.DoesNotExistError:
            return api_response(
                success=False,
                message=f"The provided Region does not exist!",
                status_code=400,
            )

        try:
            Current_organization = frappe.get_doc(
                "Healthcare Organization", r.get("parent_organization")
            )
        except frappe.DoesNotExistError:
            return api_response(
                success=False,
                message=f"The provided parent organization does not exist!",
                status_code=400,
            )

        parent_organization_name = Current_organization.get("organization_name")
        new_company_name = "{} - {}".format(parent_organization_name, new_name)

        # check if the new company name already exist
        new_company_name_exists = frappe.db.exists("Company", new_company_name)
        if new_company_name_exists:
            return api_response(
                success=False,
                message=f"The provided update region name already Exists!",
                status_code=400,
            )

        r.set("region_name", new_name)
        r.save()

        # now update the company
        try:
            # Rename the document
            frappe.rename_doc(
                doctype="Company",
                old=r.get("company"),
                new=new_company_name,
                force=True,
                merge=False,
            )

            frappe.db.commit()

        except Exception as e:
            frappe.db.rollback()
            frappe.log_error("Company Rename Error", frappe.get_traceback())
        response = {
            "messate": "Updated successfully",
        }
        return api_response(success=True, status_code=200, data=response)

    except Exception as e:
        frappe.log_error("There was an error updating service type", str(e))
        return api_response(
            success=False,
            message="There was an error updating service type!",
            status_code=500,
        )


def remove_region(**kwargs):
    kwargs.pop("cmd", None)
    required_fields = [
        "region_id",
    ]
    for field in required_fields:
        if field not in kwargs or not kwargs[field]:
            return api_response(
                success=False,
                message=f"`{field}` is required",
                status_code=400,
            )

    # 1. check if region already exist
    try:
        region = frappe.get_doc(
            "Healthcare Organization Region",
            kwargs.get("region_id"),
        )
    except Exception as e:
        frappe.log_error("Region load error", str(e))
        return api_response(
            success=False,
            message="The region id provided does not exist",
            status_code=400,
        )

    # delete the Region
    try:
        frappe.delete_doc("Healthcare Organization Region", region.get("name"))
    except ValidationError as ve:
        frappe.db.rollback()
        return api_response(success=False, message=str(ve), status_code=400)
    except AuthError as ae:
        return api_response(
            success=False, message=ae.message, status_code=ae.status_code
        )
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error("Region Deletion Error", frappe.get_traceback())
        return api_response(
            success=False,
            message="Failed to delete the regiont due to an internal error.",
            status_code=500,
        )

    response = {
        "message": "Successfully deleted the Region",
    }
    return api_response(success=True, status_code=200, data=response)


def get_regions(**kwargs):
    try:
        filters = {}
        if kwargs.get("organization"):
            filters["parent_organization"] = kwargs.get("organization")

        regions = frappe.get_list(
            "Healthcare Organization Region",
            filters=filters,
            fields=[
                "name",
                "region_name",
                "parent_organization",
                "company",
            ],
        )

        return api_response(success=True, data=regions, status_code=200)

    except Exception as e:
        frappe.log_error(str(e), "Fetch Regions Error")
        return api_response(
            success=False,
            message=f"Failed to fetch Regions: {str(e)}",
            status_code=500,
        )
