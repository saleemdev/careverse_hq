"""
Location Sync — Health Facility ↔ ERPNext Location

Maps Health Facilities to ERPNext Location records so that ERPNext Asset
can use the native `location` field for movements and tracking.

Custom field required on Location doctype:
  custom_health_facility (Link to Health Facility, unique)
"""

import frappe
from frappe import _
from typing import Optional, List
from .dashboard_utils import validate_user_facilities


def sync_facility_to_location(doc, method=None):
    """Create or update ERPNext Location from Health Facility.

    Called as a doc_event hook on Health Facility.on_update,
    or directly with a facility doc/name string.

    Args:
        doc: Health Facility document or facility name string
        method: Frappe hook method name (ignored)

    Returns:
        str: Location name
    """
    if isinstance(doc, str):
        facility = frappe.get_doc("Health Facility", doc)
    else:
        facility = doc

    facility_name = facility.name
    display_name = facility.facility_name or facility_name

    existing = frappe.db.get_value(
        "Location",
        {"custom_health_facility": facility_name},
        "name",
    )

    if existing:
        # Update display name if changed
        current_name = frappe.db.get_value("Location", existing, "location_name")
        if current_name != display_name:
            frappe.db.set_value(
                "Location", existing, "location_name", display_name, update_modified=False
            )
        return existing
    else:
        loc = frappe.get_doc(
            {
                "doctype": "Location",
                "location_name": display_name,
                "custom_health_facility": facility_name,
                "is_group": 0,
            }
        )
        loc.insert(ignore_permissions=True)
        return loc.name


def get_location_for_facility(facility_ref: str) -> Optional[str]:
    """Resolve Health Facility reference to Location name.

    Handles both hie_id and docname references.

    Args:
        facility_ref: Health Facility docname or hie_id

    Returns:
        Location name or None
    """
    if not facility_ref:
        return None

    # Try direct match on custom_health_facility
    loc = frappe.db.get_value(
        "Location", {"custom_health_facility": facility_ref}, "name"
    )
    if loc:
        return loc

    # Try resolving hie_id → docname first
    facility_docname = frappe.db.get_value(
        "Health Facility", {"hie_id": facility_ref}, "name"
    )
    if facility_docname:
        loc = frappe.db.get_value(
            "Location", {"custom_health_facility": facility_docname}, "name"
        )
        if loc:
            return loc

    return None


def get_facility_for_location(location_name: str) -> Optional[str]:
    """Reverse lookup: Location → Health Facility hie_id.

    Args:
        location_name: ERPNext Location docname

    Returns:
        Health Facility hie_id or None
    """
    if not location_name:
        return None

    facility_docname = frappe.db.get_value(
        "Location", location_name, "custom_health_facility"
    )
    if facility_docname:
        return frappe.db.get_value("Health Facility", facility_docname, "hie_id")
    return None


def get_facility_name_for_location(location_name: str) -> Optional[str]:
    """Reverse lookup: Location → Health Facility facility_name.

    Args:
        location_name: ERPNext Location docname

    Returns:
        Facility display name or None
    """
    if not location_name:
        return None

    facility_docname = frappe.db.get_value(
        "Location", location_name, "custom_health_facility"
    )
    if facility_docname:
        return frappe.db.get_value(
            "Health Facility", facility_docname, "facility_name"
        )
    return None


@frappe.whitelist()
def sync_all_facilities():
    """Batch sync: create Location records for all Health Facilities.

    Intended for one-time migration. Safe to re-run (idempotent).
    """
    facilities = frappe.get_all(
        "Health Facility", fields=["name"], limit_page_length=0
    )
    created = 0
    updated = 0
    for f in facilities:
        existing = frappe.db.get_value(
            "Location", {"custom_health_facility": f.name}, "name"
        )
        sync_facility_to_location(f.name)
        if existing:
            updated += 1
        else:
            created += 1

    frappe.db.commit()
    return {"created": created, "updated": updated, "total": len(facilities)}


def get_locations_for_user_facilities(facility_hie_ids: List[str]) -> List[str]:
    """Given facility hie_ids, return corresponding Location names.

    Validates user access via validate_user_facilities() first.

    Args:
        facility_hie_ids: List of Health Facility hie_ids

    Returns:
        List of Location docnames the user has access to
    """
    if not facility_hie_ids:
        return []

    valid_ids = validate_user_facilities(facility_hie_ids)
    if not valid_ids:
        return []

    facility_names = frappe.get_list(
        "Health Facility",
        filters={"hie_id": ["in", valid_ids]},
        pluck="name",
        limit_page_length=0,
    )
    if not facility_names:
        return []

    return frappe.get_list(
        "Location",
        filters={"custom_health_facility": ["in", facility_names]},
        pluck="name",
        limit_page_length=0,
    )
