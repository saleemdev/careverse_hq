"""
Helpers for reading Facility Affiliation status safely across schema variants.
"""

from functools import lru_cache

import frappe


CANONICAL_TERMINATED_AFFILIATION_STATUS = "Terminated"
LEGACY_TERMINATED_AFFILIATION_STATUSES = frozenset(
    {"Inactive", CANONICAL_TERMINATED_AFFILIATION_STATUS}
)


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


def normalize_facility_affiliation_status(status):
    """
    Normalize legacy terminal statuses to the canonical terminated state.
    """
    normalized = (status or "").strip()
    if normalized in LEGACY_TERMINATED_AFFILIATION_STATUSES:
        return CANONICAL_TERMINATED_AFFILIATION_STATUS
    return normalized


def is_terminated_facility_affiliation_status(status):
    """
    Return True when the status represents a terminated affiliation.
    """
    return (
        normalize_facility_affiliation_status(status)
        == CANONICAL_TERMINATED_AFFILIATION_STATUS
    )


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
