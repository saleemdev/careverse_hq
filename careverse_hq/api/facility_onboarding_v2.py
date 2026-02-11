import base64
import json

import requests
import frappe
from .hie_settings import HIE
from .encryption import SecureTransportManager
from .utils import (
    api_response,
)

from careverse_hq.api.permissions_manager import create_user_permissions_bulk

_hie = HIE()
_cryptoService = SecureTransportManager()


def _get_healthcare_user(user):
    healthcare_user = frappe.get_doc(
        "Healthcare Organization User", {"user": user},
    )
    return healthcare_user


@frappe.whitelist(methods=["GET"])
def fetch_facility_hwr_fr(**kwargs):
    """
    Fetch facility details from the HFR API.

    Steps:
    1. Retrieve API credentials (`hfr_base_url`) from HealthPro Settings.
    2. Generate an API token using the `generate_jwt_token()` function.
    3. Build the request payload with `facility_name`, `registration_number`, or `facility_code`.
    4. Make a GET request to the HFR API with the payload.
    5. Handle errors (e.g., HTTP errors, request exceptions) and log them.
    6. Return the facility data or an appropriate error response.

    """
    # Fetch API credentials
    settings = frappe.db.get_singles_dict("HealthPro Backend Settings")
    hfr_url = settings.hie_url + settings.hfr_fetch_url

    api_key = _hie.generate_jwt_token()
    if not api_key:
        return api_response(
            success=False,
            message="Failed to generate HFR API token. Please check your credentials.",
            status_code=400,
        )
    payload = {}

    # Build search payload
    if kwargs.get("facility_name"):
        payload["facility-name"] = kwargs.get("facility_name")
    if kwargs.get("registration_number"):
        payload["registration-number"] = kwargs.get("registration_number")
    if kwargs.get("facility_code"):
        payload["facility-code"] = kwargs.get("facility_code")
    if kwargs.get("facility_id"):
        payload["facility-fid"] = kwargs.get("facility_id")

    if not payload:
        return api_response(
            success=False,
            message="You must provide facility_name, registration_number, facility_id or facility_code.",
            status_code=400,
        )

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    try:
        frappe.log_error(title="hwr request data",message=f"url {hfr_url} headers: {headers} Payload: {payload}")
        resp = requests.get(hfr_url, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        frappe.log_error("hwr response",data)
        

        # Process successful response
        message = data.get("message",None)
        return message
    
    except Exception as e:
        frappe.log_error(message=f"Error: {e}", title=f"Fetching Facility {payload} Failed")
        return api_response(
            success=False,
            message= f"An error occured while fetching the facility {e}",
            status_code=500,
        )
    
def fetch_facility_local(**kwargs):
    """
    Fetch facility details from the Healht facility doctype.

    Steps:
    1. Load facility from the health facility doctype.
    2. Handle errors (e.g., HTTP errors, request exceptions) and log them.
    2. Return the facility data or an appropriate error response.

    """
    
    payload = {}

    # Build search payload
    if kwargs.get("facility_name"):
        payload["facility_name"] = kwargs.get("facility_name")
    if kwargs.get("registration_number"):
        payload["registration_number"] = kwargs.get("registration_number")
    if kwargs.get("facility_code"):
        payload["facility_code"] = kwargs.get("facility_code")
    if kwargs.get("facility_id"):
        payload["facility_mfl"] = kwargs.get("facility_id")

    if not payload:
        return api_response(
            success=False,
            message="You must provide facility_name, registration_number, facility_id or facility_code.",
            status_code=400,
        )

    try:
        resp = frappe.get_doc('Health Facility',payload)
        return {
            "success":True,
            "message": "Facility Found",
            "data":resp,
            "status_code":200,
        }
    except frappe.DoesNotExistError as e:
        return {
            "success":False,
            "message": "No facilities found matching the search criteria.",
            "status_code":404,
        }
    except frappe.PermissionError as e:
        return {
            "success":False,
            "message": "You do not have enough permissinons to assess Health facility doctype.",
            "status_code":404,
        }
    except Exception as e:
        return api_response(
            success=False,
            message="An error occured while retreiving Facility",
            status_code=500,
        )


def fetch_facility_details(**kwargs):
    """
    Steps:
    1. check if facility is already onboarded
    1. Call `fetch_facility` to retrieve facility data from the HFR API.
    2. Return the full facility data in the response.
    3. Check all the required fields are available
    

    """
    kwargs.pop("cmd", None)

    #check if facility is onboarded
    facility_data = fetch_facility_local(**kwargs)
        
    if facility_data.get('success'):
        #return facility already Onboarded error
        return api_response(
            success=False,
            message="This facility has already been onboarded",
            status_code=400,
        )

    try:  
        facility_data = fetch_facility_hwr_fr(**kwargs)
        frappe.log_error(title="fetch facility data result",message=facility_data)
    except Exception as e:
        return api_response(
            success=False,
            message=f"An error occured: {str(e)}",
            status_code=500,
        )

    
    #check if admin is set on the response
    owner_id_number = facility_data.get('owner_id_number')
    if owner_id_number is None or owner_id_number == '':
        return api_response(
            success=False,
            message="Owner ID Number not set. Kindly contact the regulator to update this information",
            status_code=400,
        )
        
    logged_in_user = frappe.session.get('user')
    if not logged_in_user:
        return api_response(
            success=False,
            message="You need to be logged in",
            status_code=401,
        )
        
    try:
        user = _get_healthcare_user(logged_in_user)
    except frappe.DoesNotExistError as e:
        return api_response(
            success=False,
            message="Your account is not found kindly register your account",
            status_code=400,
        )
    except Exception as e:
        return api_response(
            success=False,
            message="An error occured while trying to fetch your account",
            status_code=500,
        )

    #Get identificaiton number from the logged in use
    identification_number = user.get('identification_number',None)
    #compare the facility admin reg no with the current logged in user number
    if not owner_id_number == identification_number:
        return api_response(
            success=False,
            message="Sorry the facility is assigned to a different Administrator. Kindly contact the regulator to update the information!",
            status_code=500,
        )
    
    data = {
        "facility_details":facility_data,
        "admin_details":{
            "first_name": user.get('first_name', None),
            "middle_name": user.get('middle_name', None), 
            "last_name": user.get('last_name', None),
            "id_number": user.get('identification_number', None),
            "phone_number": user.get('phone_number', None),
            "email": user.get('email', None),
            "gender": user.get('gender', None),
            "date_of_birth": user.get('date_of_birth', None),
            "identification_type": user.get('identification_type', None),
            
        }
    }
    
    return api_response(success=True, data=data, status_code=200)

    
def create_new_facility_v2(**kwargs):
    """
    Create a facility record in the ERP database and sync it with HFR.
    """

    kwargs.pop("cmd", None)

    required_fields = [
        "facility_id",
        "facility_details",
        "admin_details",
        "license_details",
        "additional_details"
    ]

    for field in required_fields:
        if field not in kwargs or not kwargs[field]:
            return api_response(
                success=False,
                message=f"`{field}` is required",
                status_code=400,
            )

    facility_id = kwargs.get("facility_id")
    facility_details = kwargs.get("facility_details", {})
    license_details = kwargs.get("license_details", {})
    additional_details = kwargs.get("additional_details", {})
    
    # Check if facility already exists
    existing = frappe.get_all(
        "Health Facility",
        filters={"name": facility_id},
        pluck="name",
        limit_page_length=1,
    )
    if existing:
        return api_response(
            success=False,
            message="This facility is already onboarded",
            status_code=409,
        )
    
    #get the settings file
    public_owner_types = get_public_facility_owner_types()
    
    #check onwnership type
    ownership_type = additional_details.get('organization_owner_type')
    is_public = (ownership_type or "").upper() in public_owner_types
    
    if is_public:
        # Get organization
        organization_name = additional_details.get('county',None)
        if not organization_name:
            return api_response(
                success=False,
                message="Organization is Missing",
                status_code=400,
            )
        try:
            Organization = frappe.get_doc("Healthcare Organization", {'organization_name': organization_name}, ignore_permissions=True)
        except frappe.DoesNotExistError:
            return api_response(
                success=False,
                message="Organization is not found",
                status_code=400,
            )
        except Exception:
            return api_response(
                success=False,
                message="An error occurred while getting the Organization",
                status_code=500,
            )
        
        # Get Region
        region_name = additional_details.get('sub_county',None)
        if not region_name:
            return api_response(
                success=False,
                message="Region is missing",
                status_code=400,
            )

        try:
            Region = frappe.get_doc("Healthcare Organization Region", {'region_name': region_name}, ignore_permissions=True)
        except frappe.DoesNotExistError:
            return api_response(
                success=False,
                message="Region is not found",
                status_code=400,
            )
        except Exception:
            return api_response(
                success=False,
                message="An error occurred while getting the Region",
                status_code=500,
            )
        
        #check if region has company
        if not Region.get('company'):
            return api_response(
                success=False,
                message="Company is missing on region. Kindly contanct the administrator for assistance",
                status_code=500,
            )
    else:
        #check if we have region
        region_id = additional_details.get('region')
        if not region_id:
            return api_response(
                success=False,
                message=f"Missing required filed. Region!",
                status_code=404,
            )
        try:
            Region = frappe.get_doc("Healthcare Organization Region", {'name': region_id}, ignore_permissions=True)
        except frappe.DoesNotExistError:
            return api_response(
                success=False,
                message="Region is not found",
                status_code=400,
            )
        except Exception as e:
            frappe.error_log(f'Error fetching region {region_id}',f"Error: {e}")
            return api_response(
                success=False,
                message="An error occurred while getting the Region",
                status_code=500,
            )
        organization_id = Region.get('parent_organization')
        if not organization_id:
            return api_response(
                success=False,
                message="Organization is Missing",
                status_code=400,
            )
        try:
            Organization = frappe.get_doc("Healthcare Organization", {'name': organization_id}, ignore_permissions=True)
        except frappe.DoesNotExistError:
            return api_response(
                success=False,
                message="Organization is not found",
                status_code=400,
            )
        except Exception:
            return api_response(
                success=False,
                message="An error occurred while getting the Organization",
                status_code=500,
            )

    # Handle Department creation
    facility_fid = facility_details.get('facility_fid',None)
    if not facility_fid:
        return api_response(
            success=False,
            message=f"Facility ID is missing for this facility!",
            status_code=404,
        )
    
    try:
        department = frappe.get_doc(
            "Department", {"department_name": facility_fid}, ignore_permissions=True
        )
    except frappe.DoesNotExistError:
        department = frappe.new_doc("Department")
        department.name = facility_fid
        department.department_name = facility_fid
        department.company = Region.get("company")
        department.custom_is_health_facility = True
        department.is_group = True
        department.insert(ignore_permissions=True)
            

    department_name = department.get("name", None)
    
    db_fields = {
        "hie_id": facility_fid,
        "facility_name": facility_details.get("facility_name"),
        "facility_type":facility_details.get("facility_type"),
        "facility_owner_type":additional_details.get("organization_owner_type"),
        "facility_owner": additional_details.get("organization_owner"),
        "registration_number": facility_details.get("registration_number"),
        "category": facility_details.get("facility_category"),
        "kephl_level": facility_details.get("facility_level"),
        "address": additional_details.get("physical_address"),
        "email": additional_details.get("email_address"),
        "number_of_beds": additional_details.get("number_of_beds"),
        "latitude": additional_details.get("latitude"),
        "longitude": additional_details.get("longitude"),
        "county": additional_details.get("county"),
        "sub_county": additional_details.get("sub_county"),
        
        "ward": additional_details.get("ward"),
        "license_number": license_details.get("current_license_number"),
        "license_type": license_details.get("current_license_type"),
        "license_expiry": license_details.get("current_license_expiry_date"),
        
        
        "kra_pin": additional_details.get("organization_owner_kra_pin"),
        "facility_mfl": facility_details.get("facility_code"),
        "regulatory_body": license_details.get("regulatory_body"),
        "operational_status": facility_details.get("operational_status"),
        "license_renewal_duration": license_details.get("license_renewal_duration"),
        "current_license_renewal_date": license_details.get("current_renewal_date"),
        "constituency": additional_details.get("constituency"),
        "maximum_bed_allocation": additional_details.get("maximum_bed_allocation"),
        "open_whole_day": additional_details.get("open_whole_day"),
        "open_public_holiday": additional_details.get("open_public_holiday"),
        "open_weekends": additional_details.get("open_weekends"),
        "open_late_night": additional_details.get("open_late_night"),
        "administrator_board_registration_number": additional_details.get("owner_board_registration_number"),
    }

    db_fields['healthcare_organization']= Organization.get('name')
    db_fields['healthcare_organization_region']= Region.get('name')
    if  Organization.get('company'):
        db_fields['organization_company']= Organization.get('company')
    if  Region.get('company'):
        db_fields['region_company']= Region.get('company')
    
    if  Region.get('company'):
        db_fields['region_company']= Region.get('company')
        

    if department_name:
        db_fields['department']= department_name
       
    
    # Handle admin details
    admin_details = kwargs.get('admin_details')
    if admin_details:
        db_fields["facility_administrator"] = (
            admin_details.get("first_name", "")
            + " "
            + admin_details.get("last_name", "")
        )
        db_fields["designation"] = admin_details.get("designation", None)
        db_fields["administrators_first_name"] = admin_details.get("first_name")
        db_fields["administrators_middle_name"] = admin_details.get("middle_name")
        db_fields["administrators_last_name"] = admin_details.get("last_name")
        db_fields["administrators_id_no"] = admin_details.get("id_number")
        db_fields["administrators_phone_number"] = admin_details.get("phone_number")
        db_fields["administrators_email_address"] = admin_details.get("email")
        db_fields["administrators_id_type"] = admin_details.get("identification_type")
        db_fields["administrators_gender"] = admin_details.get("gender")
        db_fields["administrators_date_of_birth"] = admin_details.get("date_of_birth")

    doc = frappe.get_doc({"doctype": "Health Facility", **db_fields})

    # Handle contacts child table
    contacts = kwargs.get("contacts", [])
    if contacts and isinstance(contacts, list):
        for contact in contacts:
            if contact.get("contact_name") and contact.get("phone_number"):
                doc.append("contacts", {
                    "contact_name": contact.get("contact_name"),
                    "phone_number": contact.get("phone_number"),
                })

    # Handle banks child table
    banks = kwargs.get("banks", [])
    if banks and isinstance(banks, list):
        for bank in banks:
            if bank.get("bank_name") and bank.get("account_number"):
                doc.append("banks", {
                    "bank_name": bank.get("bank_name"),
                    "branch_name": bank.get("branch_name", ""),
                    "account_name": bank.get("account_name", ""),
                    "account_number": bank.get("account_number"),
                    "purpose": bank.get("purpose", ""),
                })

    # Save the document
    doc.insert(ignore_permissions=True)
    health_facility = doc.as_dict()

    # Update department
    dept = frappe.get_doc("Department", department_name)
    dept.custom_health_facility = health_facility.get("name")
    dept.save(ignore_permissions=True)

    response = {
        "facility": {
            "facility_name": health_facility.get("facility_name"),
            "facility_administrator": health_facility.get("facility_administrator"),
            "registration_number": health_facility.get("registration_number"),
            "facility_type": health_facility.get("facility_type"),
            "facility_owner_type": health_facility.get("facility_owner_type"),
            "healthcare_organization": health_facility.get("healthcare_organization"),
            "healthcare_organization_region": health_facility.get("healthcare_organization_region"),
            "department": health_facility.get("department"),
            "hie_id": health_facility.get("hie_id"),
            "kephl_level": health_facility.get("kephl_level"),
            "county": health_facility.get("county"),
            "sub_county": health_facility.get("sub_county"),
            "administrators_id_no": health_facility.get("administrators_id_no"),
            "administrators_email_address": health_facility.get("administrators_email_address"),
        }
    }

    if admin_details:
        user_name = frappe.session.get('user')
        user = _get_healthcare_user(user_name)
        
        org_user = frappe.get_doc("Healthcare Organization User", {'user': user_name}, ignore_permissions=True)
        org_user.organization = Organization.get('name')
        org_user.save(ignore_permissions=True)

    # Commit transaction
    frappe.db.commit()
    
    permissions_data = {
        "user": user_name,
        "permissions": [
            {"doctype": "Healthcare Organization", "values": [Organization.get('name')]},
            {"doctype": "Health Facility", "values": [health_facility.name]},
            {"doctype": "Department", "values": [health_facility.department]},
        ],
    }

    create_user_permissions_bulk(**permissions_data)

    #update extra details
    frappe.enqueue(
        method="careverse_hq.api.facility_onboarding_v2.update_facility_extra_information",
        queue="long",
        timeout=600,
        facility_id = facility_fid
    )

    #update hwr asynchronously
    frappe.enqueue(
        method="careverse_hq.api.facility_onboarding_v2.trigger_hwr_update",
        queue="long",
        timeout=600,
        **kwargs
    )

    return api_response(
        success=True,
        data=response,
        status_code=201,
    )

@frappe.whitelist(methods=['PUT'])
def trigger_hwr_update(**kwargs):
    """
    Trigger an update on hwr
    """
    frappe.log_error(
                f"Start Updating facility ({kwargs.get('facility_id')}) on FWR", f"data: {kwargs}"
            )
    try:
        kwargs.pop("cmd", None)
        
        # facility ID is required to identify the facility
        facility_fid = kwargs.get("facility_id") or kwargs.get("facility_details", {}).get("facility_fid")
        if not facility_fid:
            return api_response(
                success=False,
                message="Facility ID is required",
                status_code=400,
            )
       

        settings = frappe.get_single("HealthPro Backend Settings")

        url = "{}{}".format(
            settings.get("hie_url", None),
            settings.get("trigger_hwr_update_url", None)
        )
        
        headers = {"Content-Type": "application/json"}
        token = generate_token()

        if token:
            headers["Authorization"] = f"Basic {token}"
        try:
            response = requests.put(url, json=kwargs, headers=headers, timeout=10)
            result = response
            # Flatten and decode
            flat = [chr(i) for sublist in result for i in sublist]
            token_str = "".join(flat)
            frappe.log_error(
                f"Successfully updated facility ({facility_fid}) on FWR", "API Response: {}".format(token_str)
            )
            api_resp = json.loads(token_str)
            
            update_status = api_resp.get("message", {}).get("success", None)
            if update_status in [True, "true"]:
                return api_response(
                    success=True,
                    message="Facility updated successfully on HWR",
                    status_code=200,
                )
            else:
                frappe.error_log(f"Facility ({facility_fid}) Failed to update on HWR",api_resp)
                return api_response(
                    success=False,
                    message=api_resp.get("message", {}).get("error"),
                    status_code=400,
                )
        except Exception as e:
            frappe.error_log(f"Failed to update Facility ({facility_fid}) on HWR", str(e))
            return api_response(
                success=False,
                message="Failed to update Facility on HWR",
                status_code=400,
            )

    except Exception as e:
        frappe.log_error(f"HWR Health Facility ({facility_fid}) update failed", str(e))
        return api_response(
            success=False,
            message=f"Failed to update HWR facility: {str(e)}",
            status_code=500,
        )


def generate_token():
    settings = frappe.get_single("Healthpro Settings")
    username = settings.get("hie_username", None)
    password = settings.get_password("hie_password", None)
    token_string = f"{username}:{password}"

    token = base64.b64encode(token_string.encode("utf-8")).decode("utf-8")
    return token

def update_facility_extra_information(facility_id):
    """
    Updates facility extra information from HFR data.
    
    Args:
        facility_id: The ID of the facility to update
        
    Raises:
        frappe.ValidationError: If facility not found in HFR
    """

    frappe.log_error(f"Started Updating Extra facility ({facility_id}) details", "Update process started")

    # Fetch facility from HFR
    facility = fetch_facility_hwr_fr(facility_id=facility_id)
    
    if facility.get("error"):
        frappe.log_error("HFR Error", facility)
        frappe.throw("Facility not found in HFR")
    
    # Get the Health Facility document (must exist)
    if not frappe.db.exists("Health Facility", facility_id):
        frappe.throw(f"Health Facility {facility_id} does not exist in the system")
    
    doc = frappe.get_doc("Health Facility", facility_id)
    
    # Update simple fields (use set instead of append)
    field_mappings = {
        "website": "website",
        "license_fee_paid": "license_fee_paid",
        "license_issuance": "current_license_issuance_date",
        "approved": "approved",
        "standing": "standing",
        "reason": "reason",
        "suspension_date": "suspension_date",
        "suspension_reason": "suspension_reason",
        "earliest_reistatement_date": "earliest_reistatement_date",
        "reinstatement_recommendations": "reinstatement_recommendations",
        "accuracy": "accuracy",
        "pcn": "pcn",
        "altitude": "altitude",
        "number_of_cots": "number_of_cots",
        "administrator_current_license_number": "owner_current_license_number",
    }
    
    for doc_field, facility_field in field_mappings.items():
        setattr(doc, doc_field, facility.get(facility_field, ""))
    
    # Clear existing child tables before appending
    doc.level_history = []
    doc.facility_available_services = []
    doc.facility_admission_types = []
    doc.bed_capacity_distribution = []
    
    # Handle level history
    _update_level_history(doc, facility.get("level_history", []))
    
    # Handle available services
    _update_available_services(doc, facility.get("available_services", []))
    
    # Handle admission types
    _update_admission_types(doc, facility.get("admission_types", []))
    
    # Handle bed capacity distribution
    _update_bed_capacity(doc, facility.get("bed_capacity_distribution", []))
    
    try:
        # Save the document
        doc.save(ignore_permissions=True)
        frappe.db.commit()

        frappe.log_error(f"Updated facility details {facility_id}", f"details: {doc}")
    except Exception as e:
        frappe.log_error(f"failed to update facility {facility_id} details", f"Error: {str(e)}")
    
    


def _ensure_concept_exists(concept_name):
    """
    Ensures a Registry Dictionary Concept exists, creates if not.
    
    Args:
        concept_name: Name of the concept to check/create
    """
    if not concept_name:
        return
        
    if not frappe.db.exists("Registry Dictionary Concept", concept_name):
        concept = frappe.get_doc({
            "doctype": "Registry Dictionary Concept",
            "concept_name": concept_name,
        })
        concept.insert(ignore_permissions=True)


def _update_level_history(doc, level_histories):
    """Updates level history child table."""
    if not isinstance(level_histories, list):
        return
        
    for history in level_histories:
        level = history.get("level")
        start_date = history.get("effective_start_date")
        
        if level and start_date:
            _ensure_concept_exists(level)
            doc.append("level_history", {
                "level": level,
                "effective_start_date": start_date,
                "effective_end_date": history.get("effective_end_date"),
            })


def _update_available_services(doc, available_services):
    """Updates available services child table."""
    if not isinstance(available_services, list):
        return
        
    for service in available_services:
        service_name = service.get("name")
        
        if service_name:
            _ensure_concept_exists(service_name)
            doc.append("facility_available_services", {
                "available_services": service_name,
                "is_available": service.get("is_available"),
            })


def _update_admission_types(doc, admission_types):
    """Updates admission types child table."""
    if not isinstance(admission_types, list):
        return
        
    for item in admission_types:
        admission_type = item.get("admission_types")
        
        if admission_type:
            _ensure_concept_exists(admission_type)
            doc.append("facility_admission_types", {
                "admission_types": admission_type,
            })


def _update_bed_capacity(doc, bed_capacity_distribution):
    """Updates bed capacity distribution child table."""
    if not isinstance(bed_capacity_distribution, list):
        return
        
    for item in bed_capacity_distribution:
        bed_type = item.get("type")
        
        if bed_type:
            _ensure_concept_exists(bed_type)
            doc.append("bed_capacity_distribution", {
                "type": bed_type,
                "capacity": item.get("capacity"),
            })

def get_public_facility_owner_types():
    #get the settings file
    try:
        settings = frappe.get_single('HealthPro Backend Settings')
        settings_public_owner_types = settings.get('public_organization_owner_types',[])
        public_owner_types = [line.strip().upper() for line in settings_public_owner_types.splitlines() if line.strip()]

        return public_owner_types
    
    except Exception as e:
        frappe.log_error("Fetching Public facility types failed",f"Error: {str(e)}")
        return api_response(
                success=False,
                message="An error occured while trying to fetch Owner types", 
                status_code=500
            )
    
    