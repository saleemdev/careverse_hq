import json
import frappe
import requests

from .hie_settings import HIE
from .utils import api_response
from healthpro_erp.api.utils import sanitize_request
from healthpro_erp.healthpro_erp.decorators.permissions import auth_required

_hie = HIE()

@frappe.whitelist()
@sanitize_request
@auth_required()
def fetch_facility_list(**kwargs):
    try:
        # Merge with optional query params
        query_filters = {}
        if kwargs.get("facility_type"):
            query_filters["facility_type"] = kwargs.get("facility_type")
        if kwargs.get("category"):
            query_filters["category"] = kwargs.get("category")
        if kwargs.get("search"):
            query_filters["facility_name"] = ["like", f"%{kwargs.get('search')}%"]
        if kwargs.get("kephl_level"):
             query_filters["kephl_level"] = kwargs.get("kephl_level")

        final_filters = {**query_filters}

        # Pagination
        page_length = min(int(kwargs.get("limit", 20)), 100)
        page_number = max(int(kwargs.get("page", 1)), 1)
        start = (page_number - 1) * page_length

        facilities = frappe.get_list(
            "Health Facility",
            fields=[
                "hie_id", "facility_name", "facility_mfl","facility_type","kephl_level",
                "facility_type", "category", "healthcare_organization",
                "county", "creation", "modified"
            ],
            filters=final_filters,
            order_by="creation desc",
            start=start,
            page_length=page_length
        )

        total_count = frappe.db.count("Health Facility", filters=final_filters)
       
        if total_count == 0:
            return api_response(
            success=True, 
            message="No facilities found matching your criteria",
            data=[],
            pagination={
            "current_page": page_number,
            "per_page": 100,
            "page_size": page_length,
            "total_count": 0,
            "total_pages": 0,
            },
            status_code=200
            )
        formatted = []
        for f in facilities:
            org_name = frappe.db.get_value(
                "Healthcare Organization", f.get("healthcare_organization"), "organization_name"
            ) or ""
            formatted.append({
                "facility_id": f.get("hie_id"),
                "facility_name": f.get("facility_name"),
                "facility_mfl": f.get("facility_mfl"),
                "facility_type": f.get("facility_type"),
                "category": f.get("category"),
                "healthcare_organization": org_name,
                "region": f.get("county"),
                  "kephl_level": f.get("kephl_level"),
                "created_at": f.get("creation"),
                "updated_at": f.get("modified")
            })

        pagination = {
            "current_page": page_number,
            "per_page":100,
            "page_size": page_length,
            "total_count": total_count,
            "total_pages": (total_count + page_length - 1) // page_length,
         
        }

        return api_response(success=True, message="Facilities retrieved successfully",data=formatted,
                            pagination=pagination, 
                            status_code=200)
    except frappe.PermissionError:
            # User doesn't have permission to access this facility
            return api_response(
                success=False, message="Access denied to this facility", status_code=403
            )
 
    except Exception as e:
        frappe.log_error(title="Fetch Facilities Error",message=str(e))
        return api_response(success=False, message="Error fetching facilities", status_code=500)


@frappe.whitelist()
@sanitize_request
@auth_required()
def fetch_facility_details(**kwargs):
    try:
        facility_id = kwargs.get("facility_id")
        if not facility_id:
            return api_response(success=False, message="Facility ID is required", status_code=404)

        
        facility = frappe.get_list(
            "Health Facility",
            fields=[
                "hie_id","facility_name","facility_mfl","facility_type",'county','sub_county','ward','address',
                'facility_owner','facility_administrator','kephl_level','board_registration_number','registration_number',
                "category","healthcare_organization","region","county","sub_county","website",
                "phone","email","bed_capacity","creation","owner","modified_by","docstatus","modified",
                "contacts",
                "administrators_first_name","administrators_last_name","administrators_email_address",
                "administrators_middle_name","administrators_id_no","designation",
                "license_number","license_type","license_issuance","license_expiry","license_fee_paid",
                "industry",
                "maximum_bed_allocation",
                "open_whole_day",
                "open_public_holiday",
                "open_weekends",
                "open_late_night",
                "constituency"
            ],
            filters={"hie_id":facility_id},
            limit=1
        )
         
              
        if not facility:
             return api_response(success=False, message="Facility does not exist", status_code=404)

        # Facility
        f = facility[0]
        modifier=f.get('modified_by')
        owner=f.get('owner')
        
        modified_by=frappe.get_list("User",fields=['full_name'],filters={"name":modifier})
        created_by=frappe.get_list("User",fields=['full_name'],filters={"name":owner})

        facility_metrics = simple_facility_metrics(facility_id)
        

        
        banks = frappe.get_all(
        "Health Facility Banks",
        filters={"parent": facility_id, "parenttype": "Health Facility", "parentfield": "banks"},
        fields=["bank_name", "branch_name","account_name","account_number"]
        )
        
        contacts = frappe.get_all(
       "Health Facilities Contacts",
        filters={"parent": facility_id, "parenttype": "Health Facility", "parentfield": "contacts"},
        fields=["contact_name", "phone_number"]
        )
         
        org_details = None
        if f.get("healthcare_organization"):
            org = frappe.db.get_value(
                "Healthcare Organization",
                f.get("healthcare_organization"),
                ["organization_name","official_phone_number","official_email",'address','company',
                 "registration_number","head_office","company"
                 ],
                as_dict=True
            )
            org_details = org if org else None

        services_offered = frappe.get_all(
            "Available Services",
            filters={"parent": facility_id, "parenttype": "Health Facility", "parentfield": "facility_available_services"},
            fields=["available_services","is_available"]
        )
        if not services_offered:
            # Get the actual document object
            facility_doc = frappe.get_doc("Health Facility", facility_id)
            
            # Get default services
            services_offered_list = frappe.get_all(
                "Registry Dictionary Concept",
                filters={"concept_class": "Service Type"},
                pluck="name"
            )
            
            # Append to child table
            for service in services_offered_list:
                facility_doc.append("facility_available_services", {
                    "available_services": service,
                    "is_available": 0
                })
            
            # Save the document
            facility_doc.save(ignore_permissions=True)
            frappe.db.commit()
            
            # Re-fetch services_offered for response
            services_offered = frappe.get_all(
                "Available Services",
                filters={"parent": facility_id, "parenttype": "Health Facility", "parentfield": "facility_available_services"},
                fields=["available_services", "is_available"]
            )
        


        # Fix for NoneType concatenation error - safely handle None values
        first_name = f.get("administrators_first_name") or ""
        middle_name = f.get("administrators_middle_name") or ""
        last_name = f.get("administrators_last_name") or ""
        
        # Create full name with proper spacing
        name_parts = [part for part in [first_name, middle_name, last_name] if part]
        full_name = " ".join(name_parts) if name_parts else ""
        
        # Safe address concatenation
        ward = f.get("ward") or ""
        sub_county = f.get("sub_county") or ""
        county = f.get("county") or ""
        address = f.get("address") or ""
        
        town = f"{ward}, {sub_county}" if ward and sub_county else (ward or sub_county or "")
        physical_location = f"{address}, {county}" if address and county else (address or county or "")

        #get audit trail
        versions = frappe.get_list(
            "Version",
            filters={
                "ref_doctype": "Health Facility",
                "docname": facility_id
            },
            fields=["name", "owner", "creation", "data"],
            order_by="creation desc",
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
                "owner": owner_details,
                "creation": version.get("creation"),
                "changes": None
            }
            
            # Parse the JSON string in the data field
            if version.get("data"):
                try:
                    parsed_data = json.loads(version.get("data"))
                    formatted_version["changes"] = get_change_description(parsed_data)
                except json.JSONDecodeError:
                    formatted_version["changes"] = {"raw_data": version.get("data")}
            
            formatted_versions.append(formatted_version)


        response_data = {
            "facility_details": {
                "facility_id": f.get("hie_id"),
                "facility_name": f.get("facility_name"),
                "facility_mfl": f.get("facility_mfl"),
                "facility_type": f.get("facility_type"),
                "facility_admin": f.get("facility_administrator"),
                "facility_owner": f.get("facility_owner"),
                "website": f.get("website"),
                "registration_number": f.get("registration_number"),
                "board_registration_number": f.get("board_registration_number"),
                "number_of_medical_staff":facility_metrics.get('number_of_medical_staff'),
                "number_of_support_staff":facility_metrics.get('number_of_support_staff'),
                "number_of_stations":facility_metrics.get('number_of_stations'),
                "number_of_service_points":facility_metrics.get('number_of_service_points'),
                "category": f.get("category"),
                "region": f.get("sub_county"),
                "kephl_level": f.get("kephl_level"),
                "phone": f.get("phone"),
                "email": f.get("email"),
                "industry":f.get("industry"),
                "bed_capacity": f.get("bed_capacity"),
                "operational_status": f.get("operational_status"),
                "latitude": f.get("latitude"),
                "longitude": f.get("longitude"),
                "maximum_bed_allocation":f.get("maximum_bed_allocation",None) ,
                "open_whole_day":f.get("open_whole_day",None),
                "open_public_holiday":f.get("open_public_holiday",None),
                "open_weekends":f.get("open_weekends",None),
                "open_late_night":f.get("open_late_night",None),
                "constituency":f.get("constituency",None), 
 
                "audit_trail": formatted_versions,             

                "admin_contact":{
                "full_name": full_name,
                "email_address":f.get("administrators_email_address"),
                "id_no":f.get("administrators_id_no"),
                "designation":f.get("designation"),
                },
                "contacts": contacts,
                "banks":banks,
                "address": {
                    "county": county, 
                    "sub_county": sub_county, 
                    "ward": ward,
                    "town": town,
                    "address": address,
                    "physical_location": physical_location
                },
               
                "license":{
                    "license_number":f.get("license_number"),
                    "license_type":f.get("license_type"),
                    "license_issuance":f.get("license_issuance"),
                    "license_expiry":f.get("license_expiry"),
                    },
                "baseline_info": {
                    "number_of_rooms": f.get("number_of_rooms"),
                    "number_of_medical_staff": f.get("number_of_medical_staff"),
                    "number_of_support_staff": f.get("number_of_support_staff")
                    
                    },
       
            },
            "healthcare_organization": org_details,
            "facility_available_services":services_offered
        }

        return api_response(success=True,message="Facility details retrieved successfully", data=response_data, status_code=200)

    except frappe.PermissionError:
            # User doesn't have permission to access this facility
            return api_response(
                success=False, message="Access denied to this facility", status_code=403
            )
    except Exception as e:
        frappe.log_error(title= "Fetch Facility Details Error",message=str(e))
        return api_response(success=False, message="Error fetching facility details", status_code=500)

def get_change_description(changes):
    """Generate a human-readable description of what changed"""
    if not changes or not isinstance(changes, dict):
        return "No changes recorded"
    
    descriptions = []
    
    # Check for changed fields
    if "changed" in changes and isinstance(changes["changed"], list):
        for change in changes["changed"]:
            field = change[0]
            old_value = change[1]
            new_value = change[2]
            
            # Format the description
            if old_value and new_value:
                descriptions.append(f"Changed '{field}' from '{old_value}' to '{new_value}'")
            elif new_value:
                descriptions.append(f"Set '{field}' to '{new_value}'")
            elif old_value:
                descriptions.append(f"Cleared '{field}' (was '{old_value}')")
    
    # Check for added rows (child tables)
    if "added" in changes and isinstance(changes["added"], list):
        for added in changes["added"]:
            if isinstance(added, list) and len(added) > 0:
                descriptions.append(f"Added row in '{added[0]}'")
    
    # Check for removed rows
    if "removed" in changes and isinstance(changes["removed"], list):
        for removed in changes["removed"]:
            if isinstance(removed, list) and len(removed) > 0:
                descriptions.append(f"Removed row from '{removed[0]}'")
    
    # Check for row changes (child table updates)
    if "row_changed" in changes and isinstance(changes["row_changed"], list):
        for row_change in changes["row_changed"]:
            if isinstance(row_change, list) and len(row_change) > 0:
                descriptions.append(f"Updated row in '{row_change[0]}'")
    
    return descriptions if descriptions else ["Document updated"]


def simple_facility_metrics(facility_id):
    metrics = {}
    #service_points = frappe.get_list('Service Points',filters={'health_facility':facility_id},fields=["is_active","ward_type","is_ward","ward_gender","number_of_stations","service_type","location_id","name","shifts_available","docstatus","description","number_of_shifts","department","service_point_name"])
    service_points = frappe.get_list('Service Points',filters={'health_facility':facility_id},pluck="number_of_stations")

    
    number_of_stations = 0
    number_of_service_points = 0
    number_of_health_workers=0
    number_of_support_staff = 0

    health_worker_filters = {"custom_health_professional": ["is","set"], "custom_facility_id": facility_id}
    health_worker_list = frappe.get_list(
        "Employee",
        filters=health_worker_filters,
        pluck="custom_health_professional",
        order_by="custom_health_professional asc",
    )
    if health_worker_list:
        number_of_health_workers =len(health_worker_list)

    staff_filters = {"custom_health_professional": ["is","not set"], "custom_facility_id": facility_id}
    staff_list = frappe.get_list(
        "Employee",
        filters=staff_filters,
        pluck="custom_health_professional",
        order_by="custom_health_professional asc",
    )
    if staff_list:
         number_of_support_staff =len(staff_list)

    


    if service_points:
         number_of_stations = sum(service_points)
         number_of_service_points = len(service_points)
    
    metrics['number_of_stations']=number_of_stations
    metrics['number_of_service_points']=number_of_service_points
    metrics["number_of_medical_staff"]=number_of_health_workers
    metrics["number_of_support_staff"]=number_of_support_staff
    
    return metrics


@frappe.whitelist()
@sanitize_request
@auth_required()
def fetch_facility_employee_list(**kwargs):
    try:
        # Merge with optional query params
        if not kwargs.get("facility_id"):
            return api_response(success=False, message="Facility ID is required", status_code=400)
        
        employees = frappe.get_list(
            "Employee",
            fields=["name","gender","custom_identification_number as identification_number","user_id","date_of_birth","employee_name","employee"],
            filters={"custom_facility_id": kwargs.get("facility_id")},
            order_by="name desc",
        )

        if not employees:
            return api_response(
            success=True, 
            message="No employees found for this facility",
            )

        return api_response(success=True, message="Facilities retrieved successfully",data=employees,status_code=200)
    except frappe.PermissionError:
            # User doesn't have permission to access this facility
            return api_response(
                success=False, message="Access denied to this facility", status_code=403
            )
 
    except Exception as e:
        frappe.log_error(title= "Fetch Facilities Error",message=str(e))
        return api_response(success=False, message="Error fetching facilities", status_code=500)


@frappe.whitelist()
@sanitize_request
@auth_required()
def update_facility_services(**kwargs):
    try:
        facility_id = kwargs.get("facility_id")
        if not facility_id:
            return api_response(success=False, message="Facility ID is required", status_code=404)

        services_offered = kwargs.get("services_offered")
        if not services_offered:
            return api_response(success=False, message="Services offered ID is required", status_code=404)
        
        #if services offered is not an array
        if not isinstance(services_offered, list):
            return api_response(success=False, message="Services offered must be a list", status_code=400)

        
        facility = frappe.get_doc(
            "Health Facility",
            facility_id
        )
        
        if not facility:
             return api_response(success=False, message="Facility does not exist", status_code=404)
        
        try:       
            for service in services_offered:
                service_name = service.get("service_name")
                is_available = service.get("is_available", 0)

                _update_service_availability(facility, service_name, is_available)
            facility.save(ignore_permissions=True)
            frappe.db.commit() 

            #update HFR system in background
            frappe.enqueue(
                            "careverse_hq.api.facilities._update_hwr_facility_services",
                            queue="long",
                            timeout=300,
                            job_name=f"updating facility hwr services-{facility_id}",
                            facility_id=facility_id
                        )

            return api_response(success=True, message="Facility services updated successfully", status_code=200)
        
        except Exception as e:
            frappe.log_error(title ="Update Facility Services Error",message=str(e))
            return api_response(success=False, message="Error updating facility services", status_code=500) 


    except frappe.PermissionError:
            # User doesn't have permission to access this facility
            return api_response(
                success=False, message="Access denied to this facility", status_code=403
            )
    except Exception as e:
        frappe.log_error(title="Fetch Facility Details Error",message=str(e))
        return api_response(success=False, message="Error fetching facility details", status_code=500)
    

def _update_service_availability(facility_doc, service_name, is_available):
    # Check if the service already exists in the child table
    existing_service = next((s for s in facility_doc.facility_available_services if s.available_services == service_name), None)

    if existing_service:
        # Update existing service
        existing_service.is_available = is_available
    else:
        # Add new service
        facility_doc.append("facility_available_services", {
            "available_services": service_name,
            "is_available": is_available
        })


def _update_hwr_facility_services(facility_id):
    # Fetch API credentials
    settings = frappe.db.get_singles_dict("HealthPro Backend Settings")
    
    api_key = _hie.generate_jwt_token()
    if not api_key:
        return api_response(
            success=False,
            message="Failed to generate HFR API token. Please check your credentials.",
            status_code=400,
        )
    
    facility = frappe.get_doc(
            "Health Facility",
            facility_id
        )
    
    facility_services = facility.get("facility_available_services")
    services_payload = []
    
    if facility_services:
        for service in facility_services:
            service_name = service.get("available_services")
            is_offered = True if service.get("is_available") == 1 else False
            services_payload.append({"available_services": service_name, "is_available": is_offered})

    
    payload = {
        "facility_fid":facility_id,
        "update_fields":{
            "available_services":services_payload
        }
    }

    healthpro_settings = frappe.get_single("Healthpro Settings")
    base_url = settings.hie_url
    update_url = settings.hfr_update_url
    url = f"{base_url}{update_url}"
    headers = {'Content-Type': 'application/json'}
    username = healthpro_settings.get('hie_username',None)
    password = healthpro_settings.get_password('hie_password',None)
    
    auth = (username, password)
    resp = requests.put(
            url=url,
            json=payload,
            headers=headers,
            timeout=60,
            auth=auth
        )
    
    resp.raise_for_status()

    try:
        hfr_response = resp.json()
    except ValueError:
        hfr_response = {"raw_response": resp.text}

    return hfr_response



