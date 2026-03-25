"""
Helpers for reading Facility Affiliation status safely across schema variants.
"""

from functools import lru_cache

import frappe


@lru_cache(maxsize=1)
def get_facility_affiliation_status_field():
    """
    Return the canonical status field for Facility Affiliation.

    Newer schemas use `affiliation_status`; some deployments may still
    expose `status`.
    """
    meta = frappe.get_meta("Facility Affiliation")
    if meta.has_field("affiliation_status"):
        return "affiliation_status"
    if meta.has_field("status"):
        return "status"
    return None


def get_facility_affiliation_status(doc_or_name):
    """
    Resolve status from a Facility Affiliation doc object or docname.
    """
    status_field = get_facility_affiliation_status_field()
    if not status_field:
        return None

    if isinstance(doc_or_name, str):
        return frappe.db.get_value("Facility Affiliation", doc_or_name, status_field)

    if hasattr(doc_or_name, "get"):
        return doc_or_name.get(status_field)

    return getattr(doc_or_name, status_field, None)
