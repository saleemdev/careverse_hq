import frappe
from careverse_hq.api.facility_onboarding_v2 import create_new_facility_v2, fetch_facility_details, get_public_facility_owner_types
from healthpro_erp.healthpro_erp.decorators.permissions import auth_required
from .facility_onboarding import create_new_facility, get_designations_list_v1, get_designations_list_v2, get_facility_departments, trigger_hwr_update, update_existing_facility, get_designations_list, get_full_facility_data, create_facility_update_hfr, \
    facility_send_otp, initial_facility_search, get_companies, add_company, add_department, get_departments, \
    add_service_point_v1, get_service_points_v1,remove_service_point,edit_service_point_v1,get_location_service_points,get_ward_types_v1, get_facility_admin_kyc
from .utils import require_permission

from .regions import add_region,edit_region,remove_region,get_regions


@frappe.whitelist(methods=["GET"])
@auth_required()
def facility_search(**kwargs):

    return initial_facility_search(**kwargs)


@frappe.whitelist(methods=["POST"])
@auth_required()
def facility_confirmation(**kwargs):
    return facility_send_otp(**kwargs)


@frappe.whitelist(methods=["POST"])
@auth_required()
def facility_otp_verification(**payload):

    return get_full_facility_data(**payload)

@frappe.whitelist(methods=["GET"])
@auth_required()
def get_facility_details_v2(**kwargs):
    return fetch_facility_details(**kwargs)



@frappe.whitelist(methods=["POST"])
@auth_required()
def create_facility(**kwargs):
    return create_new_facility(**kwargs)

@frappe.whitelist(methods=["POST"])
@auth_required()
def create_facility_v2(**kwargs):
    return create_new_facility_v2(**kwargs)

@frappe.whitelist(methods=["PUT"])
@auth_required()
def update_facility(**kwargs):
    return update_existing_facility(**kwargs)


@frappe.whitelist(methods=["POST"])
@auth_required()
def create_company(**payload):
    return add_company(**payload)



@frappe.whitelist(methods=["GET"])
@auth_required()
def fetch_companies(organization_name=None, company_type=None):
    return get_companies(organization_name=organization_name, company_type=company_type)



@frappe.whitelist(methods=["POST"])
@auth_required()
def create_department(**payload):
    return add_department(**payload)



@frappe.whitelist(methods=["GET"])
@auth_required()
def fetch_departments(company_name=None, facility=None):
    return get_departments(company_name=company_name, facility=facility)

@frappe.whitelist(methods=["GET"])
@auth_required()
def fetch_facility_departments(facility=None):
    return get_facility_departments(facility=facility)


@frappe.whitelist(methods=["POST"])
@auth_required()
def create_service_point(**payload):
    return add_service_point_v1(**payload)

@frappe.whitelist(methods=["PUT"])
@auth_required()
def edit_service_point(**payload):
    return edit_service_point_v1(**payload)

@frappe.whitelist()
@auth_required()
def delete_service_point(**payload):
    return remove_service_point(**payload)




@frappe.whitelist(methods=["GET"])
@auth_required()
def fetch_service_points(**kwargs):
    return get_service_points_v1(**kwargs)

@frappe.whitelist(methods=["GET"])
@auth_required()
def fetch_location_service_points():
    return get_location_service_points()

@frappe.whitelist(methods=["GET"])
@auth_required()
def fetch_get_ward_types():
    return get_ward_types_v1()



@frappe.whitelist(methods=["GET"])
def fetch_designations():
    return get_designations_list()

@frappe.whitelist(methods=["GET"])
def fetch_designations_v1(**kwargs):
    return get_designations_list_v1(**kwargs)

@frappe.whitelist(methods=["GET"])
def fetch_designations_v2(**kwargs):
    return get_designations_list_v2(**kwargs)

@frappe.whitelist(methods=["GET"])
def fetch_public_facility_owner_types():
    return get_public_facility_owner_types()



@frappe.whitelist(methods=["POST"])
@auth_required()
def create_region(**kwargs):
    return add_region(**kwargs)

@frappe.whitelist(methods=["PUT","POST"])
@auth_required()
def edit_region(**kwargs):
    return edit_region(**kwargs)

@frappe.whitelist(methods=["DELETE"])
@auth_required()
def delete_region(**kwargs):
    return remove_region(**kwargs)

@frappe.whitelist(methods=["GET"])
@auth_required()
def fetch_regions(**kwargs):
    return get_regions(**kwargs)

@frappe.whitelist(methods=["GET"])
@auth_required()
def hwr_update(**kwargs):
    return trigger_hwr_update(**kwargs)

@frappe.whitelist(methods=["GET"])
@auth_required()
def kyc_facility_admin(**kwargs):
    return get_facility_admin_kyc(**kwargs)