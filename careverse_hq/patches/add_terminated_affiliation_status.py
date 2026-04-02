from __future__ import annotations

import frappe


CANONICAL_TERMINATED_AFFILIATION_STATUS = "Terminated"
LEGACY_TERMINATED_AFFILIATION_STATUS = "Inactive"
TARGET_STATUS_FIELDS = (
    ("Facility Affiliation", "affiliation_status"),
    ("Professional Affiliation", "affiliation_status"),
)
TERMINATION_METADATA_FIELDS = (
    "termination_date",
    "terminated_by",
    "termination_reason",
)


def _append_option(doctype: str, fieldname: str, option: str) -> None:
    updated = False
    for meta_doctype in ("DocField", "Custom Field"):
        filters = {"fieldname": fieldname}
        filters["parent" if meta_doctype == "DocField" else "dt"] = doctype
        field_name = frappe.db.get_value(
            meta_doctype,
            filters,
            "name",
        )
        if not field_name:
            continue

        current_options = frappe.db.get_value(meta_doctype, field_name, "options") or ""
        option_rows = [row.strip() for row in current_options.splitlines() if row.strip()]
        if option in option_rows:
            continue

        option_rows.append(option)
        frappe.db.set_value(
            meta_doctype,
            field_name,
            "options",
            "\n".join(option_rows),
            update_modified=False,
        )
        updated = True

    if updated:
        frappe.clear_cache(doctype=doctype)


def _has_termination_metadata(row) -> bool:
    return any((row.get(field) or "") for field in TERMINATION_METADATA_FIELDS)


def execute():
    for doctype, fieldname in TARGET_STATUS_FIELDS:
        _append_option(doctype, fieldname, CANONICAL_TERMINATED_AFFILIATION_STATUS)

    meta = frappe.get_meta("Facility Affiliation")
    available_metadata_fields = [
        fieldname
        for fieldname in TERMINATION_METADATA_FIELDS
        if meta.has_field(fieldname)
    ]
    if not available_metadata_fields:
        frappe.db.commit()
        return

    affiliations = frappe.get_all(
        "Facility Affiliation",
        filters={"affiliation_status": LEGACY_TERMINATED_AFFILIATION_STATUS},
        fields=["name", "affiliation_status", *available_metadata_fields],
        limit_page_length=0,
    )
    affiliation_names = [
        row.name
        for row in affiliations
        if _has_termination_metadata(row)
    ]
    if not affiliation_names:
        frappe.db.commit()
        return

    for affiliation_name in affiliation_names:
        frappe.db.set_value(
            "Facility Affiliation",
            affiliation_name,
            "affiliation_status",
            CANONICAL_TERMINATED_AFFILIATION_STATUS,
            update_modified=False,
        )

    if frappe.db.exists("DocType", "Professional Affiliation"):
        professional_affiliations = frappe.get_all(
            "Professional Affiliation",
            filters={
                "affiliation_status": LEGACY_TERMINATED_AFFILIATION_STATUS,
                "facility_affiliation": ["in", affiliation_names],
            },
            fields=["name"],
            limit_page_length=0,
        )
        for row in professional_affiliations:
            frappe.db.set_value(
                "Professional Affiliation",
                row.name,
                "affiliation_status",
                CANONICAL_TERMINATED_AFFILIATION_STATUS,
                update_modified=False,
            )

    frappe.db.commit()
