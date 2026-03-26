"""
Recruitment Desk API

Private (authenticated) endpoints for the Recruitment Desk module in Admin Central.
Serves Job Openings, Candidate Pipeline, and Candidate Profile views.
"""

import frappe

from .dashboard_utils import resolve_health_facility_reference
from .facility_affiliation_status import get_facility_affiliation_status
from .location_sync import ensure_branch_for_facility, get_location_for_facility
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
    "health_facility",
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
    try:
        page = max(1, _coerce_int(page, default=1))
        page_size = min(100, max(1, _coerce_int(page_size, default=20)))
        status = _normalize_optional_text(status)
        search = _normalize_optional_text(search)

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

        meta = frappe.get_meta("Job Opening")
        or_filters = _build_job_opening_search_or_filters(search, meta=meta)

        fields = [
            "name", "job_title", "designation", "company", "location",
            "status", "employment_type", "description",
            "posted_on", "closes_on", "creation", "modified",
            "lower_range", "upper_range", "currency", "salary_per",
        ]

        if meta.has_field("health_facility"):
            fields.append("health_facility")

        # Add publish field if it exists
        if meta.has_field("publish"):
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
        _add_health_facility_context_to_jobs(jobs, meta=meta)

        return api_response(
            success=True,
            data={"jobs": jobs},
            pagination={
                "current_page": page,
                "per_page": page_size,
                "total_count": total,
            },
        )
    except Exception as exc:
        frappe.log_error(frappe.get_traceback(), "get_job_openings failed")
        return api_response(
            success=False,
            message=_extract_exception_message(exc, fallback="Failed to load job openings"),
            status_code=400,
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

    meta = frappe.get_meta("Job Opening")

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

    if meta.has_field("publish"):
        data["publish"] = job.publish
    if meta.has_field("health_facility"):
        data["health_facility"] = getattr(job, "health_facility", None)

    _add_health_facility_context_to_jobs([data], meta=meta)

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

    try:
        _apply_job_opening_payload(doc, data)
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

    try:
        _apply_job_opening_payload(doc, data)
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
    try:
        page = max(1, _coerce_int(page, default=1))
        page_size = min(100, max(1, _coerce_int(page_size, default=20)))
        status = _normalize_optional_text(status)
        job_opening = _normalize_optional_text(job_opening)
        search = _normalize_optional_text(search)

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
    except Exception as exc:
        frappe.log_error(frappe.get_traceback(), "get_candidate_pipeline failed")
        return api_response(
            success=False,
            message=_extract_exception_message(exc, fallback="Failed to load candidate pipeline"),
            status_code=400,
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
    job_opening = _normalize_optional_text(job_opening)
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
    try:
        meta = frappe.get_meta("Job Opening")

        employment_type_link_doctype = _get_link_doctype(meta, "employment_type")
        location_link_doctype = _get_link_doctype(meta, "location")
        currency_link_doctype = _get_link_doctype(meta, "currency")
        health_facility_link_doctype = _get_link_doctype(meta, "health_facility")

        employment_types = _get_link_options(employment_type_link_doctype, limit=500) if employment_type_link_doctype else []
        locations = _get_link_options(location_link_doctype, limit=500) if location_link_doctype else []
        currencies = _get_link_options(currency_link_doctype, limit=500) if currency_link_doctype else []
        health_facilities = (
            _get_health_facility_display_options(limit=500)
            if health_facility_link_doctype == "Health Facility"
            else _get_link_options(health_facility_link_doctype, limit=500) if health_facility_link_doctype else []
        )

        status_options = _get_select_options(meta, "status")
        salary_per_options = _get_select_options(meta, "salary_per")

        return api_response(
            success=True,
            data={
                "employment_types": employment_types,
                "locations": locations,
                "currencies": currencies,
                "currency_options": currencies,
                "health_facilities": health_facilities,
                "status_options": status_options,
                "salary_per_options": salary_per_options,
                "employment_type_link_doctype": employment_type_link_doctype,
                "location_link_doctype": location_link_doctype,
                "currency_link_doctype": currency_link_doctype,
                "health_facility_link_doctype": health_facility_link_doctype,
            },
        )
    except Exception as exc:
        frappe.log_error(frappe.get_traceback(), "get_job_opening_form_options failed")
        return api_response(
            success=False,
            message=_extract_exception_message(exc, fallback="Failed to load job opening form options"),
            status_code=400,
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


@frappe.whitelist()
def update_candidate_status(name=None, status=None):
    """
    Update the status of a Job Applicant (candidate).

    Allowed statuses: Open, Replied, Accepted, Rejected, Hold
    """
    if frappe.session.user == "Guest":
        return api_response(success=False, message="Authentication required", status_code=401)

    if not name or not frappe.db.exists("Job Applicant", name):
        return api_response(
            success=False,
            message=f"Job Applicant '{name}' not found",
            status_code=404,
        )

    status = _normalize_optional_text(status)
    if not status:
        return api_response(
            success=False,
            message="status is required",
            status_code=400,
        )

    # Validate status is allowed
    allowed_statuses = {"Open", "Replied", "Accepted", "Rejected", "Hold"}
    if status not in allowed_statuses:
        return api_response(
            success=False,
            message=f"Invalid status '{status}'. Allowed values: {', '.join(sorted(allowed_statuses))}",
            status_code=400,
        )

    applicant = frappe.get_doc("Job Applicant", name)
    try:
        applicant.check_permission("write")
    except frappe.PermissionError:
        return api_response(
            success=False,
            message="You do not have permission to update this candidate",
            status_code=403,
        )

    try:
        applicant.status = status
        applicant.save()
        frappe.db.commit()
    except Exception as exc:
        frappe.log_error("update_candidate_status failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=_extract_exception_message(exc, fallback="Failed to update candidate status"),
            status_code=400,
        )

    return api_response(
        success=True,
        data={"name": name, "status": status},
        message=f"Candidate status updated to '{status}'",
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _sanitize_sort(sort_field, sort_order, allowed_fields, default_field, default_order):
    """Whitelist sort parameters to avoid order_by injection and invalid fields."""
    safe_field = _normalize_optional_text(sort_field) or default_field
    safe_order_raw = _normalize_optional_text(sort_order) or default_order
    safe_order = str(safe_order_raw).strip().lower()

    if safe_field not in allowed_fields:
        safe_field = default_field

    if safe_order not in _ALLOWED_SORT_ORDERS:
        safe_order = default_order

    return safe_field, safe_order


def _count_records_with_or_filters(doctype, filters=None, or_filters=None):
    """Count records with permission-aware list queries.

    Older Frappe versions can raise ``AttributeError: 'dict' object has no
    attribute 'lower'`` when aggregate dict fields are passed to get_list().
    Use name-only queries for cross-version compatibility.
    """
    base_kwargs = {
        "filters": filters or {},
        "or_filters": or_filters,
        "limit_page_length": 0,
    }
    try:
        names = frappe.get_list(doctype, pluck="name", **base_kwargs)
        return len(names or [])
    except TypeError:
        rows = frappe.get_list(doctype, fields=["name"], **base_kwargs)
        return len(rows or [])


def _coerce_int(value, default):
    candidate = _extract_scalar_value(value)
    if candidate in (None, ""):
        return default
    try:
        return int(candidate)
    except Exception:
        return default


def _extract_scalar_value(value):
    """Extract a scalar from common UI payload shapes."""
    if isinstance(value, dict):
        for key in ("value", "name", "id", "key", "label", "facility_id", "facility_docname"):
            if key in value:
                return _extract_scalar_value(value.get(key))
        return None

    if isinstance(value, (list, tuple)):
        if len(value) == 1:
            return _extract_scalar_value(value[0])
        return None

    return value


def _normalize_optional_text(value):
    candidate = _extract_scalar_value(value)
    if candidate is None:
        return None
    if isinstance(candidate, (dict, list, tuple, set)):
        return None

    text = candidate.strip() if isinstance(candidate, str) else str(candidate).strip()
    if not text:
        return None
    if text.lower() in {"null", "none", "undefined"}:
        return None
    return text


def _coerce_boolean_int(value):
    candidate = _extract_scalar_value(value)
    if isinstance(candidate, bool):
        return 1 if candidate else 0
    if isinstance(candidate, (int, float)):
        return 1 if candidate else 0
    if isinstance(candidate, str):
        return 1 if candidate.strip().lower() in {"1", "true", "yes", "y", "on"} else 0
    return 1 if candidate else 0


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
    normalized_payload = _normalize_job_opening_payload(payload, meta=meta)

    for fieldname, value in normalized_payload.items():
        if fieldname not in _JOB_OPENING_MUTABLE_FIELDS:
            continue
        if not meta.has_field(fieldname):
            continue

        value = _extract_scalar_value(value)

        if fieldname in _JOB_OPENING_BOOLEAN_FIELDS:
            doc.set(fieldname, _coerce_boolean_int(value))
            continue

        if isinstance(value, str):
            value = value.strip()
            if value == "":
                value = None

        if fieldname == "company" and not value:
            # Keep existing company on updates. For create flows, resolve a
            # safe default company from user defaults/permissions.
            existing_company = _normalize_optional_text(getattr(doc, "company", None))
            if existing_company:
                continue
            value = _resolve_current_user_company()

        link_doctype = _get_link_doctype(meta, fieldname)
        if link_doctype:
            link_value = _normalize_optional_text(value)
            value = _normalize_link_option(link_doctype, link_value) if link_value else None

        doc.set(fieldname, value)


def _normalize_job_opening_payload(payload, meta):
    normalized = {}
    for key, value in dict(payload or {}).items():
        normalized[key] = _extract_scalar_value(value)

    facility_ref = _normalize_optional_text(normalized.get("health_facility"))
    if not facility_ref:
        facility_ref = _normalize_optional_text(normalized.get("facility_id"))

    location_link_doctype = _get_link_doctype(meta, "location")

    if facility_ref:
        resolved_facility = _resolve_health_facility_for_link(facility_ref)
        if resolved_facility:
            normalized["health_facility"] = resolved_facility
            branch_or_location = _resolve_location_from_facility_ref(
                resolved_facility,
                location_link_doctype=location_link_doctype,
            )
            if branch_or_location:
                normalized["location"] = branch_or_location

    incoming_location = _normalize_optional_text(normalized.get("location"))
    if "location" in normalized and not incoming_location:
        normalized["location"] = None

    if incoming_location and location_link_doctype:
        resolved_location = _resolve_location_link_value(
            incoming_location,
            location_link_doctype=location_link_doctype,
        )
        if resolved_location:
            normalized["location"] = resolved_location

        if not normalized.get("health_facility"):
            resolved_facility_from_location = _resolve_health_facility_from_location_value(
                normalized.get("location"),
                location_link_doctype=location_link_doctype,
            )
            if resolved_facility_from_location:
                normalized["health_facility"] = resolved_facility_from_location

    return normalized


def _resolve_current_user_company():
    user = _normalize_optional_text(frappe.session.user)
    if not user or user == "Guest":
        return None

    default_company = _normalize_optional_text(frappe.defaults.get_user_default("Company"))
    if default_company and frappe.db.exists("Company", default_company):
        return default_company

    permissions = frappe.get_all(
        "User Permission",
        filters={"user": user, "allow": "Company"},
        fields=["for_value", "is_default"],
        order_by="is_default desc, creation asc",
        limit_page_length=1,
    )
    if not permissions:
        return None

    company = _normalize_optional_text(permissions[0].get("for_value"))
    if company and frappe.db.exists("Company", company):
        return company
    return None


def _resolve_health_facility_for_link(facility_ref):
    facility_ref = _normalize_optional_text(facility_ref)
    if not facility_ref:
        return None

    resolved = resolve_health_facility_reference(facility_ref)
    facility_docname = (resolved.get("facility_docname") or "").strip()
    if facility_docname:
        return facility_docname
    return None


def _resolve_location_from_facility_ref(facility_ref, location_link_doctype):
    facility_ref = _normalize_optional_text(facility_ref)
    if not facility_ref or not location_link_doctype:
        return None

    if location_link_doctype == "Branch":
        return ensure_branch_for_facility(facility_ref)
    if location_link_doctype == "Location":
        return get_location_for_facility(facility_ref)
    return None


def _resolve_location_link_value(value, location_link_doctype):
    value = _normalize_optional_text(value)
    if not value or not location_link_doctype:
        return value

    existing = _normalize_link_option(location_link_doctype, value)
    if existing and frappe.db.exists(location_link_doctype, existing):
        return existing

    if location_link_doctype == "Branch":
        branch = ensure_branch_for_facility(value)
        if branch:
            return branch
    if location_link_doctype == "Location":
        location = get_location_for_facility(value)
        if location:
            return location

    return existing


def _resolve_health_facility_from_location_value(location_value, location_link_doctype):
    location_value = _normalize_optional_text(location_value)
    if not location_value or not location_link_doctype:
        return None

    if location_link_doctype == "Branch":
        return _resolve_health_facility_from_branch(location_value)
    if location_link_doctype == "Location":
        return _resolve_health_facility_from_location(location_value)
    return None


def _resolve_health_facility_from_branch(branch_value):
    branch_value = _normalize_optional_text(branch_value)
    if not branch_value:
        return None

    branch_name = _normalize_link_option("Branch", branch_value) or branch_value

    if not frappe.db.exists("Branch", branch_name):
        return None

    branch_meta = frappe.get_meta("Branch")
    if branch_meta.has_field("custom_health_facility"):
        linked = frappe.db.get_value("Branch", branch_name, "custom_health_facility")
        if linked:
            return _resolve_health_facility_for_link(linked)

    branch_label = branch_name
    if branch_meta.has_field("branch"):
        branch_label = frappe.db.get_value("Branch", branch_name, "branch") or branch_name

    resolved = resolve_health_facility_reference(branch_label)
    return (resolved.get("facility_docname") or "").strip() or None


def _resolve_health_facility_from_location(location_value):
    location_value = _normalize_optional_text(location_value)
    if not location_value:
        return None

    location_name = _normalize_link_option("Location", location_value) or location_value
    if not frappe.db.exists("Location", location_name):
        return None

    location_meta = frappe.get_meta("Location")
    if not location_meta.has_field("custom_health_facility"):
        return None

    linked = frappe.db.get_value("Location", location_name, "custom_health_facility")
    if not linked:
        return None
    return _resolve_health_facility_for_link(linked)


def _normalize_link_option(link_doctype, value):
    candidate = _normalize_optional_text(value)
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
    text = _normalize_optional_text(value)
    if not text:
        return ""
    return " ".join(text.replace("-", " ").replace("_", " ").split()).lower()


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
    if not link_doctype:
        return []

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


def _get_health_facility_display_options(limit=500):
    try:
        rows = frappe.get_list(
            "Health Facility",
            fields=["name", "facility_name", "hie_id"],
            order_by="name ASC",
            limit_page_length=limit,
        )
    except (frappe.PermissionError, frappe.ValidationError, frappe.DoesNotExistError):
        return []

    options = []
    seen = set()
    for row in rows:
        label = (
            (row.get("facility_name") if isinstance(row, dict) else getattr(row, "facility_name", None))
            or (row.get("hie_id") if isinstance(row, dict) else getattr(row, "hie_id", None))
            or (row.get("name") if isinstance(row, dict) else getattr(row, "name", None))
            or ""
        )
        text = str(label).strip()
        if text and text not in seen:
            options.append(text)
            seen.add(text)
    return options


def _get_link_doctype(meta, fieldname):
    if not meta or not meta.has_field(fieldname):
        return None
    field = meta.get_field(fieldname)
    if not field or field.fieldtype != "Link":
        return None
    return (field.options or "").strip() or None


def _get_select_options(meta, fieldname):
    if not meta or not meta.has_field(fieldname):
        return []

    field = meta.get_field(fieldname)
    if not field or field.fieldtype != "Select":
        return []

    options = []
    for line in (field.options or "").splitlines():
        value = (line or "").strip()
        if value:
            options.append(value)
    return options


def _build_job_opening_search_or_filters(search, meta):
    search = _normalize_optional_text(search)
    if not search:
        return None

    safe = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    like_pattern = f"%{safe}%"
    or_filters = [
        ["job_title", "like", like_pattern],
        ["designation", "like", like_pattern],
        ["company", "like", like_pattern],
        ["location", "like", like_pattern],
    ]

    if meta and meta.has_field("health_facility"):
        or_filters.append(["health_facility", "like", like_pattern])
        matched_facilities = _search_health_facility_docnames(safe)
        if matched_facilities:
            or_filters.append(["health_facility", "in", matched_facilities])
            location_link_doctype = _get_link_doctype(meta, "location")
            if location_link_doctype == "Branch":
                matched_branches = _branches_for_health_facilities(matched_facilities)
                if matched_branches:
                    or_filters.append(["location", "in", matched_branches])
            if location_link_doctype == "Location":
                matched_locations = _locations_for_health_facilities(matched_facilities)
                if matched_locations:
                    or_filters.append(["location", "in", matched_locations])

    return or_filters


def _search_health_facility_docnames(search_term):
    if not search_term:
        return []

    try:
        return frappe.get_list(
            "Health Facility",
            or_filters=[
                ["name", "like", f"%{search_term}%"],
                ["hie_id", "like", f"%{search_term}%"],
                ["facility_name", "like", f"%{search_term}%"],
            ],
            pluck="name",
            limit_page_length=200,
        )
    except (frappe.PermissionError, frappe.ValidationError, frappe.DoesNotExistError):
        return []


def _branches_for_health_facilities(facility_docnames):
    if not facility_docnames:
        return []

    try:
        branch_meta = frappe.get_meta("Branch")
    except Exception:
        return []

    if not branch_meta.has_field("custom_health_facility"):
        return []

    try:
        return frappe.get_list(
            "Branch",
            filters={"custom_health_facility": ["in", facility_docnames]},
            pluck="name",
            limit_page_length=500,
        )
    except (frappe.PermissionError, frappe.ValidationError, frappe.DoesNotExistError):
        return []


def _locations_for_health_facilities(facility_docnames):
    if not facility_docnames:
        return []

    try:
        location_meta = frappe.get_meta("Location")
    except Exception:
        return []

    if not location_meta.has_field("custom_health_facility"):
        return []

    try:
        return frappe.get_list(
            "Location",
            filters={"custom_health_facility": ["in", facility_docnames]},
            pluck="name",
            limit_page_length=500,
        )
    except (frappe.PermissionError, frappe.ValidationError, frappe.DoesNotExistError):
        return []


def _add_health_facility_context_to_jobs(rows, meta=None):
    if not rows:
        return
    if meta is None:
        meta = frappe.get_meta("Job Opening")

    location_link_doctype = _get_link_doctype(meta, "location")
    has_health_facility_field = meta.has_field("health_facility")

    for row in rows:
        health_facility = row.get("health_facility") if isinstance(row, dict) else None
        location_value = row.get("location") if isinstance(row, dict) else None

        if not health_facility and has_health_facility_field:
            health_facility = _resolve_health_facility_from_location_value(
                location_value,
                location_link_doctype=location_link_doctype,
            )
            if health_facility:
                row["health_facility"] = health_facility

        if health_facility:
            resolved = resolve_health_facility_reference(health_facility)
            facility_name = (resolved.get("facility_name") or "").strip()
            if facility_name:
                row["health_facility_name"] = facility_name


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
