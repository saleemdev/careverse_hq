"""
Add custom fields required by the hiring workflow:

1. Job Applicant.health_professional — Link to Health Professional (BRD §9.2)
2. Job Offer.facility_affiliation — Traceability to created affiliation (BRD §9.1)
3. Job Offer.health_professional — Resolved HP reference
4. Job Offer.hiring_idempotency_key — Idempotency key for audit trail

Run via: bench --site <site> migrate
"""
from __future__ import annotations

import frappe


CUSTOM_FIELDS = {
    "Job Applicant": [
        {
            "fieldname": "health_professional",
            "fieldtype": "Link",
            "options": "Health Professional",
            "label": "Health Professional",
            "insert_after": "job_title",
            "description": "Resolved Health Professional identity for hiring workflow",
        },
    ],
    "Job Offer": [
        {
            "fieldname": "facility_affiliation",
            "fieldtype": "Data",
            "label": "Facility Affiliation",
            "insert_after": "job_applicant",
            "read_only": 1,
            "description": "Facility Affiliation created by hiring orchestration",
        },
        {
            "fieldname": "health_professional",
            "fieldtype": "Data",
            "label": "Health Professional",
            "insert_after": "facility_affiliation",
            "read_only": 1,
            "description": "Resolved HP name used at hiring terminal step",
        },
        {
            "fieldname": "hiring_idempotency_key",
            "fieldtype": "Data",
            "label": "Hiring Idempotency Key",
            "insert_after": "health_professional",
            "read_only": 1,
            "hidden": 1,
            "description": "Idempotency key for the hiring affiliation request",
        },
    ],
}


def execute():
    for doctype, fields in CUSTOM_FIELDS.items():
        for field_def in fields:
            fieldname = field_def["fieldname"]
            cf_name = f"{doctype}-{fieldname}"

            if frappe.db.exists("Custom Field", cf_name):
                continue

            cf = frappe.new_doc("Custom Field")
            cf.dt = doctype
            for key, value in field_def.items():
                cf.set(key, value)
            cf.flags.ignore_permissions = True
            cf.insert()

    frappe.db.commit()
