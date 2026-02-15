"""
Simple facility detail endpoint - NO external dependencies
"""
import frappe

@frappe.whitelist()
def get_facility_detail(facility_id):
    """
    Get facility details by ID
    Uses standard Frappe authentication - no custom tokens needed
    """
    try:
        # Query the facility
        facility = frappe.get_doc("Health Facility", facility_id)
        
        # Get banks
        banks = frappe.get_all(
            "Health Facility Banks",
            filters={"parent": facility_id},
            fields=["bank_name", "branch_name", "account_name", "account_number"]
        )
        
        # Get contacts
        contacts = frappe.get_all(
            "Health Facilities Contacts",
            filters={"parent": facility_id},
            fields=["contact_name", "phone_number", "email", "designation"]
        )
        
        # Get services
        services = frappe.get_all(
            "Available Services",
            filters={"parent": facility_id, "is_available": 1},
            fields=["available_services", "description"]
        )
        
        # Return clean response
        return {
            "success": True,
            "data": {
                "facility_details": {
                    "facility_id": facility.hie_id,
                    "facility_name": facility.facility_name,
                    "facility_mfl": facility.facility_mfl,
                    "facility_type": facility.facility_type,
                    "kephl_level": facility.kephl_level,
                    "category": facility.category,
                    "industry": getattr(facility, "industry", None),
                    "operational_status": getattr(facility, "operational_status", "N/A"),
                    "phone": facility.phone,
                    "email": facility.email,
                    "website": getattr(facility, "website", None),
                    "facility_admin": facility.facility_administrator,
                    "facility_owner": facility.facility_owner,
                    "board_registration_number": getattr(facility, "board_registration_number", None),
                    "registration_number": getattr(facility, "registration_number", None),
                    "bed_capacity": getattr(facility, "bed_capacity", None),
                    "maximum_bed_allocation": getattr(facility, "maximum_bed_allocation", None),
                    "open_whole_day": getattr(facility, "open_whole_day", None),
                    "open_public_holiday": getattr(facility, "open_public_holiday", None),
                    "open_weekends": getattr(facility, "open_weekends", None),
                    "open_late_night": getattr(facility, "open_late_night", None),
                    "constituency": getattr(facility, "constituency", None),
                    "latitude": getattr(facility, "latitude", None),
                    "longitude": getattr(facility, "longitude", None),
                    "address": {
                        "county": facility.county,
                        "sub_county": facility.sub_county,
                        "ward": facility.ward,
                    },
                    "banks": banks,
                    "contacts": contacts,
                },
                "healthcare_organization": {
                    "organization_name": facility.healthcare_organization
                },
                "facility_available_services": services
            }
        }
        
    except frappe.DoesNotExistError:
        return {
            "success": False,
            "message": f"Facility {facility_id} not found"
        }
    except Exception as e:
        frappe.log_error(f"Error fetching facility {facility_id}: {str(e)}")
        return {
            "success": False,
            "message": "Error fetching facility details"
        }
