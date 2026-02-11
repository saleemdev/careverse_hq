import frappe
from frappe import _
from frappe.utils import now_datetime
import io
import csv
from healthpro_erp.healthpro_erp.decorators.permissions import auth_required
from .utils import sanitize_request,api_response




@frappe.whitelist()
@sanitize_request
@auth_required()
def export_facility_affiliations_csv(**kwargs):
    """
    Export Facility Affiliation records to CSV.
    Supports filters:
    - ?limit=10 (number of records)
    - ?order=asc|desc
    - ?name=<specific record ID>
    - ?affiliation_status=Active
    - ?facility_id=<facility ID> (filters by specific facility)
    """
    # Permission check
    if not frappe.has_permission("Facility Affiliation", "read"):
        frappe.throw(_("Not permitted"), frappe.PermissionError)
    
    # Params
    limit = int(kwargs.get("limit", 100))
    order = kwargs.get("order", "desc").lower()
    facility_id = kwargs.get("facility_id")
    
    # Reserved params
    reserved = {"limit", "order", "cmd", "facility_id"}
    filters = {k: v for k, v in kwargs.items() if k not in reserved}
    
    # Add facility filter if provided
    if facility_id:
        # Verify facility exists
        if not frappe.db.exists("Health Facility", facility_id):

            api_response(
            success=False,
            message= f"Facility '{facility_id}' not found",
            status_code=404   )
            return
        
        filters["health_facility"] = facility_id
    
    # Fields from Facility Affiliation
    fields = [
        "name", "health_professional", "health_facility",
        "role", "affiliation_status"
    ]
    
    # Column headers for CSV
    headers = [
        "Name", "License Number", "Facility", "KEPHL Level",
        "Sub-County", "Consent Status"
    ]
    
    # Fetch affiliation records
    records = frappe.get_list(
        "Facility Affiliation",
        fields=fields,
        filters=filters,
        order_by=f"creation {order}",
        limit_page_length=limit,
    )
    
    if not records:
        # Custom message for facility-specific query
        if facility_id:
            facility_name = frappe.db.get_value("Health Facility", facility_id, "facility_name")
            message = f"No affiliations found for facility '{facility_name or facility_id}'"
        else:
            message = "No facility affiliation records found"
        

        
        api_response(
            success=False,
            message= message,
            status_code=404
        )
        return
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write headers
    writer.writerow(headers)
    
    # Collect data rows
    for record in records:
        facility = frappe.db.get_value(
            "Health Facility",
            record.get("health_facility"),
            ["facility_name", "kephl_level", "sub_county"],
            as_dict=True
        ) or {}
        
        professional = frappe.db.get_value(
            "Health Professional",
            record.get("health_professional"),
            ["first_name", "license_id"],
            as_dict=True
        ) or {}
        
        row = [
            professional.get("first_name") or "",
            professional.get("license_id") or "",
            facility.get("facility_name") or "",
            facility.get("kephl_level") or "",
            facility.get("sub_county") or "",
            record.get("affiliation_status") or ""
        ]
        writer.writerow(row)
    
    # Get CSV content as bytes
    csv_content = output.getvalue()
    output.close()
    
    # Filename with timestamp (include facility ID if specified)
    if facility_id:
        filename = f"facility_affiliations_{facility_id}_{now_datetime().strftime('%Y%m%d_%H%M%S')}.csv"
    else:
        filename = f"facility_affiliations_{now_datetime().strftime('%Y%m%d_%H%M%S')}.csv"
    
    # Stream file back
    frappe.local.response.filename = filename
    frappe.local.response.filecontent = csv_content.encode('utf-8')
    frappe.local.response.type = "download"
    return


