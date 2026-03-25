"""
Hiring Reconciliation

Updates linked Hiring Idempotency Log entries from Facility Affiliation
status changes without requiring DocType hooks on external apps.

Authority boundary preserved:
- This module only READS affiliation status and UPDATES hiring logs.
- It does NOT change affiliation status or create employees.
"""

import frappe

from .facility_affiliation_status import get_facility_affiliation_status


_AFFILIATION_TO_LOG_STATUS = {
    "Active": "Hired",
    "Rejected": "Rejected",
    "Expired": "Expired",
    "Inactive": "Closed",
}


def _reconcile_affiliation_logs(affiliation_name, affiliation_status):
    """Apply status reconciliation for Created logs linked to one affiliation."""
    new_log_status = _AFFILIATION_TO_LOG_STATUS.get(affiliation_status)
    if not affiliation_name or not new_log_status:
        return 0

    logs = frappe.get_list(
        "Hiring Idempotency Log",
        filters={
            "facility_affiliation": affiliation_name,
            "status": "Created",
        },
        fields=["name"],
    )
    if not logs:
        return 0

    updated = 0
    for log in logs:
        log_doc = frappe.get_doc("Hiring Idempotency Log", log.name)
        log_doc.status = new_log_status
        log_doc.save()
        updated += 1

        try:
            frappe.get_doc({
                "doctype": "Comment",
                "comment_type": "Info",
                "reference_doctype": "Hiring Idempotency Log",
                "reference_name": log.name,
                "content": (
                    f"Auto-reconciled: Affiliation {affiliation_name} "
                    f"changed to '{affiliation_status}', hiring log set to '{new_log_status}'"
                ),
            }).insert()
        except frappe.PermissionError:
            frappe.logger("hiring").warning(
                "Skipped reconciliation Comment insert due to Comment create permission restrictions."
            )

        frappe.logger("hiring").info(
            f"Hiring reconciliation: {log.name} -> {new_log_status} "
            f"(affiliation {affiliation_name} -> {affiliation_status})"
        )

    return updated


def reconcile_hiring_on_affiliation_update(doc, method=None):
    """
    Backward-compatible callback for manual/legacy hook usage.
    """
    affiliation_name = doc.name
    affiliation_status = get_facility_affiliation_status(doc)
    return _reconcile_affiliation_logs(affiliation_name, affiliation_status)


def reconcile_pending_hiring_logs(batch_size=500):
    """
    Scheduler-safe reconciliation that avoids cross-app DocType hooks.
    """
    batch_size = max(1, int(batch_size or 500))
    pending_logs = frappe.get_list(
        "Hiring Idempotency Log",
        filters={
            "status": "Created",
            "facility_affiliation": ["!=", ""],
        },
        fields=["facility_affiliation"],
        limit_page_length=batch_size,
    )
    affiliations = {
        row.facility_affiliation for row in pending_logs if row.facility_affiliation
    }

    updated_logs = 0
    scanned_affiliations = 0
    for affiliation_name in affiliations:
        if not frappe.db.exists("Facility Affiliation", affiliation_name):
            continue
        scanned_affiliations += 1
        affiliation_status = get_facility_affiliation_status(affiliation_name)
        updated_logs += _reconcile_affiliation_logs(
            affiliation_name, affiliation_status
        )

    if updated_logs:
        frappe.db.commit()

    return {
        "scanned_affiliations": scanned_affiliations,
        "updated_logs": updated_logs,
    }
