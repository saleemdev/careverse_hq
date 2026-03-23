"""
Hiring Reconciliation via doc_events

Listens for Facility Affiliation status changes and updates linked
Hiring Idempotency Log entries in real-time, replacing polling-based
scheduler for immediate reconciliation.

Authority boundary preserved:
- This module only READS affiliation status and UPDATES hiring logs.
- It does NOT change affiliation status or create employees.
"""

import frappe


def reconcile_hiring_on_affiliation_update(doc, method=None):
    """
    doc_events handler: Facility Affiliation.on_update

    When a Facility Affiliation status changes, find any linked
    Hiring Idempotency Log and update its status accordingly.
    """
    affiliation_name = doc.name
    new_status = doc.status

    if not new_status:
        return

    # Find linked hiring logs
    logs = frappe.get_list(
        "Hiring Idempotency Log",
        filters={
            "facility_affiliation": affiliation_name,
            "status": "Created",
        },
        fields=["name", "job_offer", "hp_name"],
    )

    if not logs:
        return

    # Map affiliation status to hiring log status
    status_map = {
        "Active": "Hired",
        "Rejected": "Rejected",
        "Expired": "Expired",
        "Inactive": "Closed",
    }

    new_log_status = status_map.get(new_status)
    if not new_log_status:
        # Still Pending or other intermediate — no action
        return

    for log in logs:
        log_doc = frappe.get_doc("Hiring Idempotency Log", log.name)
        log_doc.status = new_log_status
        log_doc.save()

        try:
            frappe.get_doc({
                "doctype": "Comment",
                "comment_type": "Info",
                "reference_doctype": "Hiring Idempotency Log",
                "reference_name": log.name,
                "content": (
                    f"Auto-reconciled: Affiliation {affiliation_name} "
                    f"changed to '{new_status}', hiring log set to '{new_log_status}'"
                ),
            }).insert()
        except frappe.PermissionError:
            frappe.logger("hiring").warning(
                "Skipped reconciliation Comment insert due to Comment create permission restrictions."
            )

        frappe.logger("hiring").info(
            f"Hiring reconciliation: {log.name} -> {new_log_status} "
            f"(affiliation {affiliation_name} -> {new_status})"
        )
