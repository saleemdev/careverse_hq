"""
Add Job Opening.health_facility custom field and backfill facility/location linkage.

This patch is best-effort and idempotent:
- Creates optional Link field Job Opening.health_facility -> Health Facility.
- Backfills health_facility from existing location values when deterministically resolvable.
- Ensures Branch records exist for referenced location strings when location is Link -> Branch.
"""

from __future__ import annotations

import frappe

from careverse_hq.api.dashboard_utils import resolve_health_facility_reference
from careverse_hq.api.location_sync import ensure_branch_for_facility


def execute():
    _ensure_health_facility_custom_field()
    _backfill_job_opening_facility_context()
    frappe.db.commit()


def _ensure_health_facility_custom_field():
    doctype = "Job Opening"
    fieldname = "health_facility"
    cf_name = f"{doctype}-{fieldname}"

    if frappe.db.exists("Custom Field", cf_name):
        return

    cf = frappe.new_doc("Custom Field")
    cf.dt = doctype
    cf.fieldname = fieldname
    cf.fieldtype = "Link"
    cf.options = "Health Facility"
    cf.label = "Health Facility"
    cf.insert_after = "location"
    cf.description = "Optional canonical facility reference for link-safe location mapping"
    cf.allow_on_submit = 0
    cf.read_only = 0
    cf.hidden = 0
    cf.flags.ignore_permissions = True
    cf.insert()


def _backfill_job_opening_facility_context():
    meta = frappe.get_meta("Job Opening")
    if not meta.has_field("health_facility"):
        return

    location_link_doctype = _location_link_doctype(meta)

    rows = frappe.get_all(
        "Job Opening",
        fields=["name", "location", "health_facility"],
        limit_page_length=0,
    )

    for row in rows:
        name = row.get("name")
        location = (row.get("location") or "").strip()
        health_facility = (row.get("health_facility") or "").strip()

        update_values = {}

        if not health_facility and location:
            resolved_facility = _resolve_facility_from_location(location, location_link_doctype)
            if resolved_facility:
                update_values["health_facility"] = resolved_facility

        if location and location_link_doctype == "Branch" and not frappe.db.exists("Branch", location):
            replacement_branch = ensure_branch_for_facility(location)
            if replacement_branch:
                update_values["location"] = replacement_branch
            else:
                created = _create_branch_from_label(location)
                if created:
                    update_values["location"] = created

        if update_values:
            frappe.db.set_value("Job Opening", name, update_values, update_modified=False)


def _location_link_doctype(job_opening_meta):
    if not job_opening_meta.has_field("location"):
        return None
    field = job_opening_meta.get_field("location")
    if not field or field.fieldtype != "Link":
        return None
    return (field.options or "").strip() or None


def _resolve_facility_from_location(location_value, location_link_doctype):
    if not location_value:
        return None

    if location_link_doctype == "Branch":
        return _facility_from_branch(location_value)
    if location_link_doctype == "Location":
        return _facility_from_location(location_value)

    resolved = resolve_health_facility_reference(location_value)
    return (resolved.get("facility_docname") or "").strip() or None


def _facility_from_branch(branch_name):
    if not frappe.db.exists("Branch", branch_name):
        return None

    branch_meta = frappe.get_meta("Branch")
    if branch_meta.has_field("custom_health_facility"):
        linked = frappe.db.get_value("Branch", branch_name, "custom_health_facility")
        if linked:
            resolved = resolve_health_facility_reference(linked)
            docname = (resolved.get("facility_docname") or "").strip()
            if docname:
                return docname

    branch_label = branch_name
    if branch_meta.has_field("branch"):
        branch_label = frappe.db.get_value("Branch", branch_name, "branch") or branch_name

    resolved = resolve_health_facility_reference(branch_label)
    return (resolved.get("facility_docname") or "").strip() or None


def _facility_from_location(location_name):
    if not frappe.db.exists("Location", location_name):
        return None

    location_meta = frappe.get_meta("Location")
    if not location_meta.has_field("custom_health_facility"):
        return None

    linked = frappe.db.get_value("Location", location_name, "custom_health_facility")
    if not linked:
        return None

    resolved = resolve_health_facility_reference(linked)
    return (resolved.get("facility_docname") or "").strip() or None


def _create_branch_from_label(label):
    branch_meta = frappe.get_meta("Branch")
    branch_field = "branch" if branch_meta.has_field("branch") else None

    payload = {"doctype": "Branch"}
    if branch_field:
        payload[branch_field] = label

    try:
        doc = frappe.get_doc(payload)
        doc.flags.ignore_permissions = True
        doc.insert()
        return doc.name
    except Exception:
        if branch_field:
            existing = frappe.db.get_value("Branch", {branch_field: label}, "name")
            if existing:
                return existing
        if frappe.db.exists("Branch", label):
            return label
        return None
