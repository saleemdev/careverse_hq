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

        # Get contacts (only has contact_name and phone_number fields)
        contacts = frappe.get_all(
            "Health Facilities Contacts",
            filters={"parent": facility_id},
            fields=["contact_name", "phone_number"]
        )

        # Get services (only has available_services field, no description)
        services = frappe.get_all(
            "Available Services",
            filters={"parent": facility_id, "is_available": 1},
            fields=["available_services"]
        )
        
        # Return clean response
        return {
            "success": True,
            "data": {
                "facility_details": {
                    "facility_id": facility.hie_id,
                    "facility_name": facility.facility_name,
                    "facility_mfl": facility.facility_mfl or None,
                    "facility_type": facility.facility_type or None,
                    "kephl_level": facility.kephl_level,
                    "category": facility.category or None,
                    "industry": facility.industry or None,
                    "operational_status": facility.operational_status or "N/A",
                    "phone": facility.phone or None,
                    "email": facility.email or None,
                    "website": facility.website or None,
                    "facility_admin": facility.facility_administrator or None,
                    "facility_owner": facility.facility_owner or None,
                    "board_registration_number": facility.board_registration_number or None,
                    "registration_number": facility.registration_number or None,
                    "bed_capacity": facility.number_of_beds or None,
                    "maximum_bed_allocation": facility.maximum_bed_allocation or None,
                    "open_whole_day": facility.open_whole_day or None,
                    "open_public_holiday": facility.open_public_holiday or None,
                    "open_weekends": facility.open_weekends or None,
                    "open_late_night": facility.open_late_night or None,
                    "constituency": facility.constituency or None,
                    "latitude": facility.latitude or None,
                    "longitude": facility.longitude or None,
                    "address": {
                        "county": facility.county,
                        "sub_county": facility.sub_county or None,
                        "ward": facility.ward or None,
                    },
                    "banks": banks,
                    "contacts": contacts,
                },
                "healthcare_organization": {
                    "organization_name": facility.healthcare_organization or None
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
