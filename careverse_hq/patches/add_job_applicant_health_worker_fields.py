"""
Add Job Applicant fields for public health worker registration capture.

Fields added:
1. Job Applicant.is_health_worker (Check)
2. Job Applicant.registration_number (Data)
3. Job Applicant.registering_body (Link -> Regulatory Body)
"""

from __future__ import annotations

import frappe


CUSTOM_FIELDS = [
    {
        "fieldname": "is_health_worker",
        "fieldtype": "Check",
        "label": "Health Worker",
        "insert_after": "email_id",
        "description": "Whether the applicant identified as a health worker.",
    },
    {
        "fieldname": "registration_number",
        "fieldtype": "Data",
        "label": "Registration Number",
        "insert_after": "is_health_worker",
        "depends_on": "eval:doc.is_health_worker==1",
        "description": "Professional registration number provided by the applicant.",
    },
    {
        "fieldname": "registering_body",
        "fieldtype": "Link",
        "label": "Registering Body",
        "options": "Regulatory Body",
        "insert_after": "registration_number",
        "depends_on": "eval:doc.is_health_worker==1",
        "description": "Regulatory body selected by the applicant.",
    },
]


def execute():
    doctype = "Job Applicant"

    for field_def in CUSTOM_FIELDS:
        fieldname = field_def["fieldname"]
        custom_field_name = f"{doctype}-{fieldname}"

        if frappe.db.exists("Custom Field", custom_field_name):
            continue

        custom_field = frappe.new_doc("Custom Field")
        custom_field.dt = doctype

        for key, value in field_def.items():
            custom_field.set(key, value)

        custom_field.flags.ignore_permissions = True
        custom_field.insert()

    frappe.db.commit()
