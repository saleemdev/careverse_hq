"""
Public Jobs API

Guest-accessible endpoints for the public jobs board (/jobs).
Enforces a strict public field whitelist — no internal notes,
compliance artifacts, or PII beyond applicant-provided profile.
"""

import re
from urllib.parse import urlparse

import frappe
from frappe.utils import getdate, validate_email_address

from .dashboard_utils import resolve_health_facility_reference
from .utils import api_response


# ---------------------------------------------------------------------------
# Public field whitelist (FR-24: no restricted data leak)
# ---------------------------------------------------------------------------

_PUBLIC_JOB_FIELDS = [
    "name",
    "job_title",
    "designation",
    "company",
    "department",
    "location",
    "health_facility",
    "description",
    "status",
    "publish",
    "posted_on",
    "closes_on",
    "employment_type",
    "salary_per",
    "lower_range",
    "upper_range",
    "currency",
    "creation",
]

_PUBLIC_JOB_LIST_FIELDS = [
    "name",
    "job_title",
    "designation",
    "company",
    "department",
    "location",
    "health_facility",
    "status",
    "employment_type",
    "posted_on",
    "closes_on",
    "lower_range",
    "upper_range",
    "currency",
    "salary_per",
    "creation",
]

_MAX_SEARCH_LENGTH = 120
_MAX_NAME_LENGTH = 140
_MAX_EMAIL_LENGTH = 254
_MAX_PHONE_LENGTH = 32
_MAX_COVER_LETTER_LENGTH = 5000
_MAX_URL_LENGTH = 2048
_PHONE_PATTERN = re.compile(r"^\+?[0-9][0-9\s().-]{5,31}$")
_STANDARD_FIELDS = {
    "name",
    "owner",
    "creation",
    "modified",
    "modified_by",
    "idx",
    "docstatus",
    "parent",
    "parenttype",
    "parentfield",
}


# ---------------------------------------------------------------------------
# List endpoint
# ---------------------------------------------------------------------------

@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_public_jobs(
    search=None,
    location=None,
    health_facility=None,
    employment_type=None,
    designation=None,
    company=None,
    page=1,
    page_size=20,
):
    """
    Public jobs list for /jobs page.

    Filters: search (title/designation/location/facility), location, health_facility,
    employment_type, designation, company.
    Pagination: page + page_size (max 50).
    Only returns open, published jobs.
    """
    page = max(1, int(page or 1))
    page_size = min(50, max(1, int(page_size or 20)))
    search = _clean_text(search, _MAX_SEARCH_LENGTH)
    location = _clean_text(location, 140)
    health_facility = _clean_text(health_facility, 140)
    employment_type = _clean_text(employment_type, 80)
    designation = _clean_text(designation, 140)
    company = _clean_text(company, 140)

    meta = frappe.get_meta("Job Opening")
    has_health_facility_field = meta.has_field("health_facility")

    filters = {"status": "Open"}

    # Only show published jobs (HRMS uses 'publish' check field)
    if frappe.get_meta("Job Opening").has_field("publish"):
        filters["publish"] = 1

    if location and _meta_has_field(meta, "location"):
        filters["location"] = location

    if health_facility and has_health_facility_field:
        resolved = resolve_health_facility_reference(health_facility)
        facility_docname = (resolved.get("facility_docname") or "").strip()
        filters["health_facility"] = facility_docname or health_facility

    if employment_type and _meta_has_field(meta, "employment_type"):
        filters["employment_type"] = employment_type

    if designation and _meta_has_field(meta, "designation"):
        filters["designation"] = designation

    if company and _meta_has_field(meta, "company"):
        filters["company"] = company

    or_filters = _build_public_search_filters(
        search,
        has_health_facility_field=has_health_facility_field,
    )

    try:
        total_count = _count_with_or_filters(filters, or_filters or [])

        list_fields = _existing_public_fields(meta, _PUBLIC_JOB_LIST_FIELDS)
        if not list_fields:
            list_fields = ["name"]

        jobs = frappe.get_list(
            "Job Opening",
            filters=filters,
            or_filters=or_filters,
            fields=list_fields,
            order_by=_public_jobs_order_by(meta),
            start=(page - 1) * page_size,
            page_length=page_size,
            ignore_permissions=True,
        )
        _add_health_facility_context(jobs)

        # Sanitize: strip any fields that slipped through
        sanitized = [_sanitize_job_list_item(j) for j in jobs]

    except Exception:
        frappe.log_error("get_public_jobs failed", frappe.get_traceback())
        return api_response(
            success=False,
            message="Failed to load jobs",
            status_code=500,
        )

    return api_response(
        success=True,
        data={"jobs": sanitized},
        pagination={
            "current_page": page,
            "per_page": page_size,
            "total_count": total_count,
        },
    )


# ---------------------------------------------------------------------------
# Detail endpoint
# ---------------------------------------------------------------------------

@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_public_job_detail(job_id=None, slug=None):
    """
    Public job detail for /jobs/<slug> page.

    Accepts either job_id (Job Opening name) or slug.
    Only returns open, published jobs with whitelisted fields.
    """
    if not job_id and not slug:
        return api_response(
            success=False,
            message="job_id or slug is required",
            status_code=400,
        )

    # Resolve by slug (format: <title-slug>-<JO-name>)
    if slug and not job_id:
        job_id = _resolve_job_from_slug(slug)
        if not job_id:
            return api_response(
                success=False,
                message="Job not found",
                status_code=404,
            )

    meta = frappe.get_meta("Job Opening")

    if not frappe.db.exists("Job Opening", job_id):
        return api_response(
            success=False,
            message="Job not found",
            status_code=404,
        )

    job = frappe.get_doc("Job Opening", job_id)

    # Only show open published jobs
    if job.status != "Open":
        return api_response(
            success=False,
            message="This job is no longer available",
            status_code=404,
        )

    if meta.has_field("publish") and not job.publish:
        return api_response(
            success=False,
            message="This job is not published",
            status_code=404,
        )

    detail = _sanitize_job_detail(job)
    _add_health_facility_context([detail])

    # Generate slug for canonical URL
    detail["slug"] = _make_job_slug(job)

    # Related jobs (same designation, exclude current)
    related_fields = [
        "name",
        "job_title",
        "designation",
        "company",
        "department",
        "location",
        "employment_type",
    ]
    if meta.has_field("health_facility"):
        related_fields.append("health_facility")
    related_fields = _existing_public_fields(meta, related_fields)

    related = frappe.get_list(
        "Job Opening",
        filters={
            "status": "Open",
            "designation": job.designation,
            "name": ["!=", job.name],
            **({"publish": 1} if meta.has_field("publish") else {}),
        },
        fields=related_fields,
        order_by="creation DESC",
        page_length=3,
        ignore_permissions=True,
    )
    _add_health_facility_context(related)

    detail["related_jobs"] = [_sanitize_job_list_item(row) for row in related]

    return api_response(success=True, data=detail)


# ---------------------------------------------------------------------------
# Filter options (for search/filter UI)
# ---------------------------------------------------------------------------

@frappe.whitelist(allow_guest=True, methods=["GET"])
def get_job_filter_options():
    """
    Return available filter values for the public jobs search UI.
    Only includes values from currently open, published jobs.
    """
    base_filters = {"status": "Open"}
    if frappe.get_meta("Job Opening").has_field("publish"):
        base_filters["publish"] = 1

    meta = frappe.get_meta("Job Opening")
    locations = []
    if _meta_has_field(meta, "location"):
        locations = frappe.get_list(
            "Job Opening",
            filters=base_filters,
            fields=["location"],
            distinct=True,
            ignore_permissions=True,
        )

    employment_types = []
    if _meta_has_field(meta, "employment_type"):
        employment_types = frappe.get_list(
            "Job Opening",
            filters=base_filters,
            fields=["employment_type"],
            distinct=True,
            ignore_permissions=True,
        )

    designations = []
    if _meta_has_field(meta, "designation"):
        designations = frappe.get_list(
            "Job Opening",
            filters=base_filters,
            fields=["designation"],
            distinct=True,
            ignore_permissions=True,
        )

    companies = []
    if _meta_has_field(meta, "company"):
        companies = frappe.get_list(
            "Job Opening",
            filters=base_filters,
            fields=["company"],
            distinct=True,
            ignore_permissions=True,
        )

    health_facility_values = []
    if meta.has_field("health_facility"):
        health_facility_rows = frappe.get_list(
            "Job Opening",
            filters=base_filters,
            fields=["health_facility"],
            distinct=True,
            ignore_permissions=True,
        )
        health_facility_values = sorted(
            set(
                (row.get("health_facility") if isinstance(row, dict) else getattr(row, "health_facility", None))
                for row in health_facility_rows
                if (row.get("health_facility") if isinstance(row, dict) else getattr(row, "health_facility", None))
            )
        )

    health_facility_labels = _health_facility_labels(health_facility_values)

    return api_response(
        success=True,
        data={
            "locations": sorted(set(l.location for l in locations if l.location)),
            "employment_types": sorted(set(e.employment_type for e in employment_types if e.employment_type)),
            "designations": sorted(set(d.designation for d in designations if d.designation)),
            "companies": sorted(set(c.company for c in companies if c.company)),
            "health_facilities": health_facility_labels,
        },
    )


# ---------------------------------------------------------------------------
# Application submission
# ---------------------------------------------------------------------------

@frappe.whitelist(allow_guest=True, methods=["POST"])
def submit_application(
    job_opening,
    applicant_name,
    email_id,
    phone=None,
    cover_letter=None,
    resume_link=None,
    consent_given=None,
    website=None,
):
    """
    Submit a public job application.

    Creates a Job Applicant record. Requires explicit consent capture (FR-3).
    """
    job_opening = _clean_text(job_opening, 140)
    applicant_name = _clean_text(applicant_name)
    email_id = _clean_text(email_id).lower()
    phone = _normalize_phone(phone)
    cover_letter = _clean_text(cover_letter) or None
    resume_link = _clean_text(resume_link) or None
    website = _clean_text(website, 256)

    # Honeypot for basic bot/spam filtering without affecting real users.
    if website:
        return api_response(
            success=True,
            data={"applicant_id": None},
            message="Your application has been submitted successfully.",
        )

    if not job_opening or not applicant_name or not email_id:
        return api_response(
            success=False,
            message="job_opening, applicant_name, and email_id are required",
            status_code=400,
        )

    if not validate_email_address(email_id):
        return api_response(
            success=False,
            message="Please provide a valid email address.",
            status_code=400,
        )

    if len(email_id) > _MAX_EMAIL_LENGTH:
        return api_response(
            success=False,
            message="Email address is too long.",
            status_code=400,
        )

    if len(applicant_name) > _MAX_NAME_LENGTH:
        return api_response(
            success=False,
            message="Full name is too long.",
            status_code=400,
        )

    if cover_letter and len(cover_letter) > _MAX_COVER_LETTER_LENGTH:
        return api_response(
            success=False,
            message="Your note is too long. Please keep it under 5000 characters.",
            status_code=400,
        )

    if resume_link and len(resume_link) > _MAX_URL_LENGTH:
        return api_response(
            success=False,
            message="Resume link is too long.",
            status_code=400,
        )

    if phone and not _is_valid_phone(phone):
        return api_response(
            success=False,
            message="Please provide a valid phone number.",
            status_code=400,
        )

    if resume_link and not _is_http_url(resume_link):
        return api_response(
            success=False,
            message="Resume link must be a valid http or https URL.",
            status_code=400,
        )

    retry_after = _submission_retry_after(job_opening, email_id)
    if retry_after:
        return api_response(
            success=False,
            message="Too many application attempts from this connection. Please try again later.",
            status_code=429,
        )

    if not _is_truthy_flag(consent_given):
        return api_response(
            success=False,
            message="Explicit consent is required before submitting an application. "
                    "Please confirm you agree to the processing of your profile and KYC data.",
            status_code=400,
        )

    # Validate job exists and is open
    if not frappe.db.exists("Job Opening", job_opening):
        return api_response(
            success=False,
            message="Job opening not found",
            status_code=404,
        )

    job = frappe.get_doc("Job Opening", job_opening)
    if job.status != "Open":
        return api_response(
            success=False,
            message="This job is no longer accepting applications",
            status_code=400,
        )
    if job.closes_on and getdate(job.closes_on) < getdate():
        return api_response(
            success=False,
            message="Applications for this role are closed.",
            status_code=400,
        )
    if frappe.get_meta("Job Opening").has_field("publish") and not job.publish:
        return api_response(
            success=False,
            message="This job is not published for public applications",
            status_code=400,
        )

    # Check for duplicate application
    existing = frappe.db.exists(
        "Job Applicant",
        {"job_title": job_opening, "email_id": email_id},
    )
    if existing:
        return api_response(
            success=False,
            message="An application with this email already exists for this position",
            status_code=409,
        )

    try:
        applicant = frappe.new_doc("Job Applicant")
        applicant.applicant_name = applicant_name
        applicant.email_id = email_id
        applicant.job_title = job_opening
        applicant.designation = job.designation
        applicant.status = "Open"

        source = _get_public_application_source()
        if source:
            applicant.source = source

        if phone:
            if frappe.get_meta("Job Applicant").has_field("phone_number"):
                applicant.phone_number = phone
            elif frappe.get_meta("Job Applicant").has_field("phone"):
                applicant.phone = phone
        if cover_letter:
            applicant.cover_letter = cover_letter
        if resume_link:
            applicant.resume_link = resume_link

        # Store consent artifact
        if frappe.get_meta("Job Applicant").has_field("consent_given"):
            applicant.consent_given = 1
        if frappe.get_meta("Job Applicant").has_field("consent_timestamp"):
            applicant.consent_timestamp = frappe.utils.now_datetime()

        applicant.flags.ignore_permissions = True
        applicant.insert()
        frappe.db.commit()

    except Exception as e:
        frappe.log_error("submit_application failed", frappe.get_traceback())
        return api_response(
            success=False,
            message="Failed to submit application. Please try again.",
            status_code=500,
        )

    return api_response(
        success=True,
        data={"applicant_id": applicant.name},
        message="Your application has been submitted successfully.",
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _sanitize_job_list_item(job):
    """Ensure only whitelisted fields are returned."""
    payload = {k: job.get(k) for k in _PUBLIC_JOB_LIST_FIELDS if job.get(k) is not None}
    health_facility_name = job.get("health_facility_name")
    if health_facility_name:
        payload["health_facility_name"] = health_facility_name
    return _strip_salary_fields(payload, job)


def _sanitize_job_detail(job):
    """Build a public-safe job detail payload."""
    detail = {field: getattr(job, field, None) for field in _PUBLIC_JOB_FIELDS if getattr(job, field, None) is not None}

    description = detail.get("description")
    if description:
        detail["description_html"] = frappe.utils.sanitize_html(description)

    return _strip_salary_fields(detail, job)


def _strip_salary_fields(payload, job):
    """Respect HRMS salary publication controls before exposing compensation."""
    if _is_salary_public(job):
        return payload

    for field in ("lower_range", "upper_range", "currency", "salary_per"):
        payload.pop(field, None)

    return payload


def _build_public_search_filters(search, has_health_facility_field=False):
    if not search:
        return None

    safe_search = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    like_pattern = f"%{safe_search}%"
    or_filters = [
        ["job_title", "like", like_pattern],
        ["designation", "like", like_pattern],
        ["location", "like", like_pattern],
        ["company", "like", like_pattern],
    ]

    if has_health_facility_field:
        or_filters.append(["health_facility", "like", like_pattern])
        matched_facilities = _search_health_facility_docnames(safe_search)
        if matched_facilities:
            or_filters.append(["health_facility", "in", matched_facilities])

            location_link_doctype = _job_opening_location_link_doctype()
            if location_link_doctype == "Branch":
                matched_branches = _branches_for_health_facilities(matched_facilities)
                if matched_branches:
                    or_filters.append(["location", "in", matched_branches])
            if location_link_doctype == "Location":
                matched_locations = _locations_for_health_facilities(matched_facilities)
                if matched_locations:
                    or_filters.append(["location", "in", matched_locations])

    return or_filters


def _search_health_facility_docnames(search_text):
    if not search_text:
        return []
    try:
        return frappe.get_list(
            "Health Facility",
            or_filters=[
                ["name", "like", f"%{search_text}%"],
                ["hie_id", "like", f"%{search_text}%"],
                ["facility_name", "like", f"%{search_text}%"],
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


def _job_opening_location_link_doctype():
    meta = frappe.get_meta("Job Opening")
    if not meta.has_field("location"):
        return None
    field = meta.get_field("location")
    if not field or field.fieldtype != "Link":
        return None
    return (field.options or "").strip() or None


def _add_health_facility_context(rows):
    if not rows:
        return

    meta = frappe.get_meta("Job Opening")
    has_health_facility_field = meta.has_field("health_facility")
    location_link_doctype = _job_opening_location_link_doctype()

    for row in rows:
        health_facility = row.get("health_facility")
        location_value = row.get("location")

        if not health_facility and location_value:
            if location_link_doctype == "Branch":
                health_facility = _health_facility_from_branch(location_value)
            elif location_link_doctype == "Location":
                health_facility = _health_facility_from_location(location_value)
            if health_facility and has_health_facility_field:
                row["health_facility"] = health_facility

        if health_facility:
            resolved = resolve_health_facility_reference(health_facility)
            facility_name = (resolved.get("facility_name") or "").strip()
            if facility_name:
                row["health_facility_name"] = facility_name


def _health_facility_from_branch(branch_name):
    if not branch_name or not frappe.db.exists("Branch", branch_name):
        return None
    branch_meta = frappe.get_meta("Branch")
    if branch_meta.has_field("custom_health_facility"):
        linked = frappe.db.get_value("Branch", branch_name, "custom_health_facility")
        if linked:
            resolved = resolve_health_facility_reference(linked)
            return (resolved.get("facility_docname") or "").strip() or None
    return None


def _health_facility_from_location(location_name):
    if not location_name or not frappe.db.exists("Location", location_name):
        return None
    location_meta = frappe.get_meta("Location")
    if location_meta.has_field("custom_health_facility"):
        linked = frappe.db.get_value("Location", location_name, "custom_health_facility")
        if linked:
            resolved = resolve_health_facility_reference(linked)
            return (resolved.get("facility_docname") or "").strip() or None
    return None


def _health_facility_labels(facility_docnames):
    labels = []
    for value in facility_docnames or []:
        resolved = resolve_health_facility_reference(value)
        label = (resolved.get("facility_name") or "").strip()
        if label:
            labels.append(label)
        elif value:
            labels.append(value)
    return sorted(set(labels))


def _is_salary_public(job):
    if not frappe.get_meta("Job Opening").has_field("publish_salary_range"):
        return True
    return bool(getattr(job, "publish_salary_range", 0))


def _make_job_slug(job):
    """Generate a URL-safe slug for a Job Opening."""
    title = job.job_title or job.designation or job.name
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return f"{slug}-{job.name}"


def _resolve_job_from_slug(slug):
    """
    Extract Job Opening name from slug.
    Slug format: <title-slug>-<JO-XXXX> where the last segment is the name.
    """
    if not slug:
        return None

    # Try extracting the job name pattern (e.g., HR-JOB-00001 or JO-00001)
    # The name is appended after the last occurrence of a known prefix pattern
    parts = slug.rsplit("-", 1)
    if len(parts) == 2:
        # Try the full slug as-is first (in case name has no dashes)
        if frappe.db.exists("Job Opening", slug):
            return slug

    # Try common HRMS naming patterns
    import re
    match = re.search(r"((?:HR-JOB|JO|JOB)-\d+)$", slug, re.IGNORECASE)
    if match:
        name = match.group(1).upper()
        if frappe.db.exists("Job Opening", name):
            return name

    route_match = frappe.db.get_value(
        "Job Opening",
        {"route": ["in", [slug, f"jobs/{slug}"]]},
        "name",
    )
    if route_match:
        return route_match

    # Fallback: try each possible split point
    for i in range(len(slug) - 1, 0, -1):
        if slug[i] == "-":
            candidate = slug[i + 1:]
            if frappe.db.exists("Job Opening", candidate):
                return candidate

    return None


def _count_with_or_filters(filters, or_filters):
    """Count records with guest-safe aggregation for the public jobs board."""
    # Keep counting implementation intentionally simple and version-safe:
    # fetch matching names with ignore_permissions and count in Python.
    names = frappe.get_list(
        "Job Opening",
        filters=filters or {},
        or_filters=or_filters,
        pluck="name",
        limit_page_length=0,
        ignore_permissions=True,
    )
    return len(names or [])


def _meta_has_field(meta, fieldname):
    return fieldname in _STANDARD_FIELDS or meta.has_field(fieldname)


def _existing_public_fields(meta, fields):
    return [field for field in fields if _meta_has_field(meta, field)]


def _public_jobs_order_by(meta):
    if _meta_has_field(meta, "posted_on"):
        return "posted_on DESC, creation DESC"
    return "creation DESC"


def _is_truthy_flag(value):
    """Normalize common truthy representations for consent flags."""
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value == 1
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "y", "on"}
    return False


def _get_public_application_source():
    """Pick the best available HRMS applicant source for website submissions."""
    available_sources = set(frappe.get_all("Job Applicant Source", pluck="name"))
    for candidate in ("Website Listing", "Website"):
        if candidate in available_sources:
            return candidate
    return None


def _submission_retry_after(job_opening, email_id):
    """Simple guest-safe throttling for public application submission."""
    ip = getattr(frappe.local, "request_ip", None) or "unknown"
    cache = frappe.cache
    window_seconds = 10 * 60

    # Limit burst traffic from the same IP and same job/email pair.
    scopes = (
        (f"public-job-apply:ip:{ip}", 8),
        (f"public-job-apply:job-email:{job_opening}:{email_id}", 3),
    )

    for key, limit in scopes:
        cache_key = cache.make_key(key)
        if cache.get(cache_key) is None:
            cache.setex(cache_key, window_seconds, 0)

        attempts = cache.incrby(cache_key, 1)
        if attempts > limit:
            return True

    return False


def _is_http_url(value):
    """Allow only absolute http/https URLs."""
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def _clean_text(value, limit=None):
    if value is None:
        return ""
    cleaned = str(value).strip()
    if limit:
        return cleaned[:limit]
    return cleaned


def _normalize_phone(value):
    phone = _clean_text(value, _MAX_PHONE_LENGTH)
    return phone or None


def _is_valid_phone(value):
    return bool(_PHONE_PATTERN.match(value))
