"""
Hiring Idempotency Log

Tracks affiliation creation requests from the hiring orchestration flow.
Prevents duplicate Facility Affiliation creation on retries.
Keyed by: hire_aff_req:{job_offer_id}:{hp_name}:{fid}
"""

import frappe
from frappe.model.document import Document


class HiringIdempotencyLog(Document):
    pass
