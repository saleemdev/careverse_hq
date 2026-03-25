"""
Recruitment Desk API

Private (authenticated) endpoints for the Recruitment Desk module in Admin Central.
Serves Job Openings, Candidate Pipeline, and Candidate Profile views.
"""

import frappe

from .facility_affiliation_status import get_facility_affiliation_status
from .utils import api_response


_ALLOWED_SORT_ORDERS = {"asc", "desc"}
_JOB_OPENING_SORT_FIELDS = {
    "creation",
    "modified",
    "job_title",
    "designation",
    "status",
    "posted_on",
    "closes_on",
}
_JOB_OPENING_MUTABLE_FIELDS = {
    "job_title",
    "designation",
    "company",
    "location",
    "employment_type",
    "description",
    "status",
    "posted_on",
    "closes_on",
    "lower_range",
    "upper_range",
    "currency",
    "salary_per",
    "publish",
}
_JOB_OPENING_BOOLEAN_FIELDS = {"publish"}
_JOB_OPENING_LINK_FIELD_DOCTYPES = {
    "employment_type": "Employment Type",
    "location": "Location",
}
_JOB_APPLICANT_SORT_FIELDS = {
    "creation",
    "modified",
    "applicant_name",
    "status",
    "designation",
    "job_title",
}


# ---------------------------------------------------------------------------
# Job Openings (PRV-02 / PRV-03)
# ---------------------------------------------------------------------------

@frappe.whitelist()
def get_job_openings(
    page=1, page_size=20, status=None, search=None,
    sort_field="creation", sort_order="desc",
):
    """
    List Job Openings for the Recruitment Desk.
    Respects User Permissions (company/facility scoped).
    """
    page = max(1, int(page or 1))
    page_size = min(100, max(1, int(page_size or 20)))

    safe_sort_field, safe_sort_order = _sanitize_sort(
        sort_field,
        sort_order,
        allowed_fields=_JOB_OPENING_SORT_FIELDS,
        default_field="creation",
        default_order="desc",
    )

    filters = {}
    if status:
        filters["status"] = status

    or_filters = None
    if search:
        safe = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        or_filters = [
            ["job_title", "like", f"%{safe}%"],
            ["designation", "like", f"%{safe}%"],
        ]

    fields = [
        "name", "job_title", "designation", "company", "location",
        "status", "employment_type", "description",
        "posted_on", "closes_on", "creation", "modified",
        "lower_range", "upper_range", "currency", "salary_per",
    ]

    # Add publish field if it exists
    if frappe.get_meta("Job Opening").has_field("publish"):
        fields.append("publish")

    total = _count_records_with_or_filters(
        doctype="Job Opening",
        filters=filters,
        or_filters=or_filters,
    )

    jobs = frappe.get_list(
        "Job Opening",
        filters=filters,
        or_filters=or_filters,
        fields=fields,
        order_by=f"{safe_sort_field} {safe_sort_order}",
        start=(page - 1) * page_size,
        page_length=page_size,
    )

    return api_response(
        success=True,
        data={"jobs": jobs},
        pagination={
            "current_page": page,
            "per_page": page_size,
            "total_count": total,
        },
    )


@frappe.whitelist()
def get_job_opening_detail(name):
    """Get full Job Opening detail for PRV-03 view."""
    if not name or not frappe.db.exists("Job Opening", name):
        return api_response(success=False, message="Job Opening not found", status_code=404)

    job = frappe.get_doc("Job Opening", name)
    try:
        job.check_permission("read")
    except frappe.PermissionError:
        return api_response(success=False, message="You do not have permission to view this Job Opening", status_code=403)

    # Count linked applicants with permission-aware query
    applicant_count = _count_records_with_or_filters(
        doctype="Job Applicant",
        filters={"job_title": name},
    )

    data = {
        "name": job.name,
        "job_title": job.job_title,
        "designation": job.designation,
        "company": job.company,
        "location": job.location,
        "status": job.status,
        "employment_type": job.employment_type,
        "description": job.description,
        "posted_on": job.posted_on,
        "closes_on": job.closes_on,
        "lower_range": job.lower_range,
        "upper_range": job.upper_range,
        "currency": job.currency,
        "salary_per": job.salary_per,
        "creation": job.creation,
        "modified": job.modified,
        "applicant_count": applicant_count,
    }

    if hasattr(job, "publish"):
        data["publish"] = job.publish

    return api_response(success=True, data=data)


@frappe.whitelist()
def toggle_job_publish(name=None):
    """Toggle the publish state of a Job Opening."""
    if frappe.session.user == "Guest":
        return api_response(success=False, message="Authentication required", status_code=401)

    if not name or not frappe.db.exists("Job Opening", name):
        return api_response(success=False, message="Job Opening not found", status_code=404)

    job = frappe.get_doc("Job Opening", name)
    try:
        job.check_permission("write")
    except frappe.PermissionError:
        return api_response(success=False, message="You do not have permission to modify this Job Opening", status_code=403)

    meta = frappe.get_meta("Job Opening")
    if not meta.has_field("publish"):
        return api_response(success=False, message="'publish' field not found on Job Opening", status_code=400)

    current = job.publish or 0
    new_value = 0 if current else 1
    job.publish = new_value
    job.save()

    return api_response(
        success=True,
        data={"name": name, "publish": new_value},
        message=f"Job Opening {'published' if new_value else 'unpublished'}",
    )


@frappe.whitelist()
def create_job_opening(payload=None):
    """Create a Job Opening from Recruitment Desk (React UI)."""
    if frappe.session.user == "Guest":
        return api_response(success=False, message="Authentication required", status_code=401)

    if not frappe.has_permission("Job Opening", "create"):
        return api_response(success=False, message="You do not have permission to create Job Openings", status_code=403)

    data = _parse_payload(payload)
    if not data:
        return api_response(success=False, message="payload is required", status_code=400)

    doc = frappe.new_doc("Job Opening")
    _apply_job_opening_payload(doc, data)

    try:
        doc.insert()
    except frappe.PermissionError:
        return api_response(success=False, message="You do not have permission to create Job Openings", status_code=403)
    except Exception as exc:
        frappe.log_error("create_job_opening failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=_extract_exception_message(exc, fallback="Failed to create job opening"),
            status_code=400,
        )

    return api_response(
        success=True,
        data={"name": doc.name},
        message="Job Opening created successfully",
    )


@frappe.whitelist()
def update_job_opening(name=None, payload=None):
    """Update a Job Opening from Recruitment Desk (React UI)."""
    if frappe.session.user == "Guest":
        return api_response(success=False, message="Authentication required", status_code=401)

    if not name or not frappe.db.exists("Job Opening", name):
        return api_response(success=False, message="Job Opening not found", status_code=404)

    data = _parse_payload(payload)
    if not data:
        return api_response(success=False, message="payload is required", status_code=400)

    doc = frappe.get_doc("Job Opening", name)
    try:
        doc.check_permission("write")
    except frappe.PermissionError:
        return api_response(success=False, message="You do not have permission to modify this Job Opening", status_code=403)

    _apply_job_opening_payload(doc, data)

    try:
        doc.save()
    except frappe.PermissionError:
        return api_response(success=False, message="You do not have permission to modify this Job Opening", status_code=403)
    except Exception as exc:
        frappe.log_error("update_job_opening failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=_extract_exception_message(exc, fallback="Failed to update job opening"),
            status_code=400,
        )

    return api_response(
        success=True,
        data={"name": doc.name},
        message="Job Opening updated successfully",
    )


# ---------------------------------------------------------------------------
# Candidate Pipeline (PRV-01 / PRV-04)
# ---------------------------------------------------------------------------

@frappe.whitelist()
def get_candidate_pipeline(
    page=1, page_size=20, status=None, job_opening=None, search=None,
    sort_field="creation", sort_order="desc",
):
    """
    List Job Applicants for the Candidate Pipeline view (PRV-01).
    """
    page = max(1, int(page or 1))
    page_size = min(100, max(1, int(page_size or 20)))

    safe_sort_field, safe_sort_order = _sanitize_sort(
        sort_field,
        sort_order,
        allowed_fields=_JOB_APPLICANT_SORT_FIELDS,
        default_field="creation",
        default_order="desc",
    )

    filters = {}
    if status:
        filters["status"] = status
    if job_opening:
        filters["job_title"] = job_opening

    or_filters = None
    if search:
        safe = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        or_filters = [
            ["applicant_name", "like", f"%{safe}%"],
            ["email_id", "like", f"%{safe}%"],
        ]

    fields = [
        "name", "applicant_name", "email_id",
        "job_title", "designation", "status", "source",
        "creation", "modified",
    ]

    phone_field = _get_job_applicant_phone_field()
    if phone_field:
        fields.append(phone_field)

    # Add health_professional if the field exists (custom field)
    if frappe.get_meta("Job Applicant").has_field("health_professional"):
        fields.append("health_professional")

    total = _count_records_with_or_filters(
        doctype="Job Applicant",
        filters=filters,
        or_filters=or_filters,
    )

    applicants = frappe.get_list(
        "Job Applicant",
        filters=filters,
        or_filters=or_filters,
        fields=fields,
        order_by=f"{safe_sort_field} {safe_sort_order}",
        start=(page - 1) * page_size,
        page_length=page_size,
    )

    if phone_field:
        for applicant in applicants:
            applicant["phone"] = applicant.get(phone_field)

    return api_response(
        success=True,
        data={"applicants": applicants},
        pagination={
            "current_page": page,
            "per_page": page_size,
            "total_count": total,
        },
    )


@frappe.whitelist()
def get_candidate_detail(name):
    """
    Get full Candidate Profile detail for PRV-04 view.
    Includes linked Job Offers, Interview records, and hiring status.
    """
    if not name or not frappe.db.exists("Job Applicant", name):
        return api_response(success=False, message="Candidate not found", status_code=404)

    applicant = frappe.get_doc("Job Applicant", name)
    try:
        applicant.check_permission("read")
    except frappe.PermissionError:
        return api_response(success=False, message="You do not have permission to view this candidate", status_code=403)

    data = {
        "name": applicant.name,
        "applicant_name": applicant.applicant_name,
        "email_id": applicant.email_id,
        "phone": _get_job_applicant_phone_value(applicant),
        "job_title": applicant.job_title,
        "designation": applicant.designation,
        "status": applicant.status,
        "source": applicant.source,
        "cover_letter": getattr(applicant, "cover_letter", None),
        "resume_link": getattr(applicant, "resume_link", None),
        "creation": applicant.creation,
        "modified": applicant.modified,
    }

    # HP linkage
    if hasattr(applicant, "health_professional"):
        data["health_professional"] = applicant.health_professional

    # Linked Job Offers
    offers = frappe.get_list(
        "Job Offer",
        filters={"job_applicant": name},
        fields=["name", "status", "offer_date", "designation", "creation"],
        order_by="creation DESC",
    )
    data["job_offers"] = offers

    # Linked Interviews
    interviews = frappe.get_list(
        "Interview",
        filters={"job_applicant": name},
        fields=["name", "status", "scheduled_on", "interview_round", "creation"],
        order_by="creation DESC",
    )
    data["interviews"] = interviews

    # Hiring status from idempotency log
    if offers:
        latest_offer = offers[0]
        hiring_logs = frappe.get_list(
            "Hiring Idempotency Log",
            filters={"job_offer": latest_offer.name},
            fields=["name", "status", "facility_affiliation", "request_timestamp"],
            order_by="creation DESC",
            limit_page_length=1,
        )
        if hiring_logs:
            log = hiring_logs[0]
            data["hiring_log"] = {
                "status": log.status,
                "facility_affiliation": log.facility_affiliation,
                "request_timestamp": log.request_timestamp,
            }

            # Add affiliation status only if caller can read the linked affiliation.
            if log.facility_affiliation and frappe.db.exists("Facility Affiliation", log.facility_affiliation):
                try:
                    affiliation = frappe.get_doc("Facility Affiliation", log.facility_affiliation)
                    affiliation.check_permission("read")
                    data["hiring_log"]["affiliation_status"] = get_facility_affiliation_status(affiliation)
                except frappe.PermissionError:
                    pass

    return api_response(success=True, data=data)


# ---------------------------------------------------------------------------
# Pipeline stage counts (for PRV-01 summary bar)
# ---------------------------------------------------------------------------

@frappe.whitelist()
def get_pipeline_summary(job_opening=None):
    """
    Return count of applicants by status for the pipeline summary bar.
    """
    filters = {}
    if job_opening:
        filters["job_title"] = job_opening

    # HRMS Job Applicant statuses
    statuses = ["Open", "Replied", "Accepted", "Rejected", "Hold"]
    summary = {}

    for status in statuses:
        status_filters = dict(filters)
        status_filters["status"] = status
        summary[status.lower()] = _count_records_with_or_filters(
            doctype="Job Applicant",
            filters=status_filters,
        )

    summary["total"] = sum(summary.values())

    return api_response(success=True, data=summary)


@frappe.whitelist()
def get_job_opening_form_options():
    """
    Return select options for Job Opening form link fields.
    """
    employment_types = _get_link_options("Employment Type", limit=500)
    locations = _get_link_options("Location", limit=500)

    return api_response(
        success=True,
        data={
            "employment_types": employment_types,
            "locations": locations,
        },
    )


# ---------------------------------------------------------------------------
# HP Resolution (BRD §9.2 Identity Mapping Contract)
# ---------------------------------------------------------------------------

@frappe.whitelist()
def search_hp_for_applicant(search_term=None, search_mode="auto", search_by="registration_number"):
    """
    Search for Health Professionals to link to a Job Applicant.
    Reuses the shared search_health_professional logic from single_affiliation.

    Resolution order per BRD §9.2:
    1. Direct link if already present
    2. Deterministic match by registration number
    3. Manual compliance resolution (recruiter picks)
    """
    from .single_affiliation import search_health_professional
    return search_health_professional(
        search_term=search_term,
        search_mode=search_mode,
        search_by=search_by,
    )


@frappe.whitelist()
def link_applicant_to_health_professional(job_applicant=None, hp_name=None):
    """
    Link a Job Applicant to a Health Professional (BRD §9.2).

    Validates:
    - Job Applicant exists
    - Health Professional exists and is active
    - Sets health_professional custom field on Job Applicant
    - Creates audit log entry
    """
    if frappe.session.user == "Guest":
        return api_response(success=False, message="Authentication required", status_code=401)

    if not job_applicant or not hp_name:
        return api_response(
            success=False,
            message="Both job_applicant and hp_name are required",
            status_code=400,
        )

    if not frappe.db.exists("Job Applicant", job_applicant):
        return api_response(
            success=False,
            message=f"Job Applicant '{job_applicant}' not found",
            status_code=404,
        )

    if not frappe.db.exists("Health Professional", hp_name):
        return api_response(
            success=False,
            message=f"Health Professional '{hp_name}' not found",
            status_code=404,
        )

    applicant = frappe.get_doc("Job Applicant", job_applicant)
    try:
        applicant.check_permission("write")
    except frappe.PermissionError:
        return api_response(success=False, message="You do not have permission to update this candidate", status_code=403)

    try:
        hp = frappe.get_doc("Health Professional", hp_name)
        hp.check_permission("read")
    except frappe.PermissionError:
        return api_response(
            success=False,
            message="You do not have permission to read this Health Professional",
            status_code=403,
        )

    # Validate HP is active
    hp_status = hp.status
    if hp_status and hp_status not in ("Active", "active"):
        return api_response(
            success=False,
            message=f"Health Professional '{hp_name}' is not active (status: {hp_status})",
            status_code=400,
        )

    # Check custom field exists
    if not frappe.get_meta("Job Applicant").has_field("health_professional"):
        return api_response(
            success=False,
            message="Custom field 'health_professional' not found on Job Applicant. Run migrate first.",
            status_code=500,
        )

    # Set the link with document-level permission checks
    applicant.health_professional = hp_name
    applicant.save()

    # Audit log
    try:
        frappe.get_doc({
            "doctype": "Comment",
            "comment_type": "Info",
            "reference_doctype": "Job Applicant",
            "reference_name": job_applicant,
            "content": f"Health Professional linked: {hp_name} by {frappe.session.user}",
        }).insert()
    except frappe.PermissionError:
        frappe.logger("hiring").warning(
            "Skipped audit Comment insert due to Comment create permission restrictions for user %s",
            frappe.session.user,
        )

    # Get HP details for response
    hp_data = {
        "name": hp.name,
        "full_name": hp.full_name,
        "registration_number": hp.registration_number,
        "status": hp.status,
    }

    return api_response(
        success=True,
        data={
            "job_applicant": job_applicant,
            "health_professional": hp_name,
            "hp_details": hp_data,
        },
        message=f"Health Professional '{hp_name}' linked to Job Applicant '{job_applicant}'",
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _sanitize_sort(sort_field, sort_order, allowed_fields, default_field, default_order):
    """Whitelist sort parameters to avoid order_by injection and invalid fields."""
    safe_field = (sort_field or default_field).strip()
    safe_order = (sort_order or default_order).strip().lower()

    if safe_field not in allowed_fields:
        safe_field = default_field

    if safe_order not in _ALLOWED_SORT_ORDERS:
        safe_order = default_order

    return safe_field, safe_order


def _count_records_with_or_filters(doctype, filters=None, or_filters=None):
    """Count records with permission-aware SQL aggregation."""
    result = frappe.get_list(
        doctype,
        filters=filters or {},
        or_filters=or_filters,
        fields=[{"COUNT": "*", "as": "count"}],
        limit_page_length=1,
    )
    if not result:
        return 0
    return int(result[0].get("count") or 0)


def _parse_payload(payload):
    """Normalize payload from frappe.call/querystring contexts."""
    if payload is None:
        return None
    if isinstance(payload, str):
        payload = payload.strip()
        if not payload:
            return None
        try:
            payload = frappe.parse_json(payload)
        except Exception:
            return None
    return dict(payload) if isinstance(payload, dict) else None


def _apply_job_opening_payload(doc, payload):
    """Apply validated editable fields to a Job Opening document."""
    meta = frappe.get_meta("Job Opening")

    for fieldname, value in payload.items():
        if fieldname not in _JOB_OPENING_MUTABLE_FIELDS:
            continue
        if not meta.has_field(fieldname):
            continue

        if isinstance(value, str):
            value = value.strip()
            if value == "":
                value = None

        if fieldname in _JOB_OPENING_BOOLEAN_FIELDS:
            if isinstance(value, str):
                value = 1 if value.lower() in {"1", "true", "yes", "on"} else 0
            else:
                value = 1 if value else 0

        link_doctype = _JOB_OPENING_LINK_FIELD_DOCTYPES.get(fieldname)
        if link_doctype and isinstance(value, str):
            value = _normalize_link_option(link_doctype, value)

        doc.set(fieldname, value)


def _normalize_link_option(link_doctype, value):
    if not value:
        return value
    candidate = value.strip()
    if not candidate:
        return candidate

    try:
        exact = frappe.get_list(
            link_doctype,
            filters={"name": candidate},
            pluck="name",
            limit_page_length=1,
        )
    except (frappe.PermissionError, frappe.ValidationError, frappe.DoesNotExistError):
        return candidate

    if exact:
        return exact[0]

    options_map = _get_link_option_map(link_doctype)
    normalized_key = _normalize_option_key(candidate)
    return options_map.get(normalized_key, candidate)


def _normalize_option_key(value):
    return " ".join(value.replace("-", " ").replace("_", " ").split()).lower()


def _get_link_option_map(link_doctype, limit=500):
    cache = getattr(frappe.local, "_recruitment_link_option_map", None)
    if cache is None:
        cache = {}
        frappe.local._recruitment_link_option_map = cache

    cache_key = f"{link_doctype}:{limit}"
    if cache_key in cache:
        return cache[cache_key]

    options = _get_link_options(link_doctype, limit=limit)
    mapped = {}
    for option in options:
        key = _normalize_option_key(option)
        if key and key not in mapped:
            mapped[key] = option

    cache[cache_key] = mapped
    return mapped


def _get_link_options(link_doctype, limit=500):
    try:
        rows = frappe.get_list(
            link_doctype,
            fields=["name"],
            order_by="name ASC",
            limit_page_length=limit,
        )
    except (frappe.PermissionError, frappe.ValidationError, frappe.DoesNotExistError):
        return []

    options = []
    for row in rows:
        name = row.get("name") if isinstance(row, dict) else getattr(row, "name", None)
        if name:
            options.append(name)
    return options


def _get_job_applicant_phone_field():
    meta = frappe.get_meta("Job Applicant")
    for fieldname in ("phone_number", "phone"):
        if meta.has_field(fieldname):
            return fieldname
    return None


def _get_job_applicant_phone_value(applicant):
    for fieldname in ("phone_number", "phone"):
        value = getattr(applicant, fieldname, None)
        if value:
            return value
    return None


def _extract_exception_message(exc, fallback):
    message = str(exc).strip() if exc else ""
    if message:
        return message

    message_log = getattr(frappe.local, "message_log", None)
    if isinstance(message_log, list):
        for entry in reversed(message_log):
            if isinstance(entry, dict):
                text = (entry.get("message") or "").strip()
            else:
                text = str(entry).strip()
            if text:
                return text

    return fallback
