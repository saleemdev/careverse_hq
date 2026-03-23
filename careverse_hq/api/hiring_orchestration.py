"""
Hiring Orchestration API

Terminal hiring step: calls create_single_affiliation to create Facility Affiliation
after offer acceptance. Never bypasses the shared affiliation creation path.

Authority boundary:
- Admin Central requests affiliation (this module).
- Candidate app confirms affiliation (Pending -> Active).
- Existing confirmation workflow creates Employee.

Idempotency:
- Key format: hire_aff_req:{job_offer_id}:{hp_name}:{fid}
- Replay returns existing affiliation_id with idempotent_replay=true.
- Deduplication window: 30 days (configurable).
"""

import hashlib
import json

import frappe
from frappe.utils import now_datetime, add_days

from .single_affiliation import create_single_affiliation
from .utils import api_response

_IDEMPOTENT_ACTIVE_STATUSES = ("Created", "Hired", "Rejected", "Expired", "Closed")


# ---------------------------------------------------------------------------
# Complete Hire (Terminal Step)
# ---------------------------------------------------------------------------

@frappe.whitelist()
def complete_hire(job_offer_id, employment_details=None):
    """
    Terminal hiring action: create Facility Affiliation via shared API.

    Args:
        job_offer_id: Name of the Job Offer document
        employment_details: Dict with fid, employment_type, designation, start_date, end_date

    Non-bypass rules enforced:
    - hp_name must be resolved on the Job Applicant
    - hwr_cache_key is NOT permitted at this stage
    - Affiliation is created only via create_single_affiliation
    - Employee is NOT created here (candidate app authority)
    """
    if not job_offer_id:
        return api_response(
            success=False,
            message="job_offer_id is required",
            status_code=400,
        )
    if frappe.session.user == "Guest":
        return api_response(
            success=False,
            message="Authentication required",
            status_code=401,
        )

    employment_details = _parse_employment_details(employment_details)
    if not employment_details:
        return api_response(
            success=False,
            message="employment_details is required with fid, employment_type, designation, start_date",
            status_code=400,
        )

    # Validate Job Offer exists and is in accepted state
    if not frappe.db.exists("Job Offer", job_offer_id):
        return api_response(
            success=False,
            message=f"Job Offer '{job_offer_id}' not found",
            status_code=404,
        )

    offer = frappe.get_doc("Job Offer", job_offer_id)
    try:
        offer.check_permission("write")
    except frappe.PermissionError:
        return api_response(
            success=False,
            message="You do not have permission to complete hire for this Job Offer.",
            status_code=403,
        )

    # Validate offer status (HRMS uses 'Accepted' status)
    if offer.status not in ("Accepted",):
        return api_response(
            success=False,
            message=f"Job Offer must be in 'Accepted' status. Current: '{offer.status}'",
            status_code=400,
        )

    # Resolve hp_name from Job Applicant
    hp_name = _resolve_hp_name(offer)
    if not hp_name:
        return api_response(
            success=False,
            message="Cannot complete hire: hp_name (Health Professional) is not resolved on the Job Applicant. "
                    "Link the candidate to a Health Professional before completing the hire.",
            status_code=400,
        )

    fid = employment_details.get("fid")
    if not fid:
        return api_response(
            success=False,
            message="employment_details.fid (facility ID) is required",
            status_code=400,
        )

    # --- Idempotency check ---
    idempotency_key = f"hire_aff_req:{job_offer_id}:{hp_name}:{fid}"
    existing = _check_idempotency(idempotency_key)
    if existing:
        return api_response(
            success=True,
            data={
                "facility_affiliation": existing.facility_affiliation,
                "idempotent_replay": True,
                "idempotency_key": idempotency_key,
                "health_professional": hp_name,
            },
            message="Affiliation request already exists (idempotent replay).",
        )

    # --- Call shared Add Single Affiliation API ---
    request_hash = _compute_request_hash(job_offer_id, hp_name, employment_details)

    try:
        # Call the shared API path — never bypass with direct insert
        result = create_single_affiliation(
            hp_name=hp_name,
            employment_details=employment_details,
        )
    except Exception as e:
        _log_idempotency(
            idempotency_key, job_offer_id, hp_name, fid,
            request_hash=request_hash,
            status="Failed",
            error_message=str(e),
        )
        frappe.log_error("complete_hire failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=f"Affiliation creation failed: {str(e)}",
            status_code=500,
        )

    # Parse the response from create_single_affiliation
    # The shared API sets frappe.local.response directly via api_response()
    response_data = frappe.local.response
    if response_data.get("status") != "success":
        error_msg = response_data.get("message", "Affiliation creation failed")
        _log_idempotency(
            idempotency_key, job_offer_id, hp_name, fid,
            request_hash=request_hash,
            status="Failed",
            error_message=error_msg,
        )
        # Response is already set by create_single_affiliation
        return

    affiliation_data = response_data.get("data", {})
    affiliation_name = affiliation_data.get("facility_affiliation")

    # --- Persist idempotency log ---
    _log_idempotency(
        idempotency_key, job_offer_id, hp_name, fid,
        request_hash=request_hash,
        facility_affiliation=affiliation_name,
        status="Created",
    )

    # --- Persist linkage on Job Offer (custom fields) ---
    _persist_hiring_linkage(offer, affiliation_name, hp_name, idempotency_key)

    # --- Audit log ---
    frappe.log_error(
        title="Hiring Orchestration: Affiliation Created",
        message=json.dumps({
            "job_offer": job_offer_id,
            "hp_name": hp_name,
            "facility_affiliation": affiliation_name,
            "idempotency_key": idempotency_key,
            "actor": frappe.session.user,
            "timestamp": str(now_datetime()),
        }),
    )

    return api_response(
        success=True,
        data={
            "facility_affiliation": affiliation_name,
            "health_professional": hp_name,
            "idempotency_key": idempotency_key,
            "idempotent_replay": False,
            "job_offer": job_offer_id,
        },
        message="Affiliation request created successfully. Awaiting candidate confirmation.",
    )


# ---------------------------------------------------------------------------
# Reconciliation: check affiliation/employee outcomes
# ---------------------------------------------------------------------------

@frappe.whitelist()
def check_hire_status(job_offer_id):
    """
    Check the current status of a hiring flow by looking at affiliation
    and employee outcomes.

    Returns current state: Awaiting Confirmation, Hired, Rejected, Expired, Timed Out
    """
    if not job_offer_id:
        return api_response(
            success=False,
            message="job_offer_id is required",
            status_code=400,
        )
    if frappe.session.user == "Guest":
        return api_response(
            success=False,
            message="Authentication required",
            status_code=401,
        )

    if not frappe.db.exists("Job Offer", job_offer_id):
        return api_response(
            success=False,
            message=f"Job Offer '{job_offer_id}' not found",
            status_code=404,
        )

    offer = frappe.get_doc("Job Offer", job_offer_id)
    try:
        offer.check_permission("read")
    except frappe.PermissionError:
        return api_response(
            success=False,
            message="You do not have permission to view this Job Offer",
            status_code=403,
        )

    # Find idempotency log for this offer
    logs = frappe.get_list(
        "Hiring Idempotency Log",
        filters={"job_offer": job_offer_id},
        fields=["name", "status", "facility_affiliation", "hp_name", "facility", "request_timestamp"],
        order_by="creation DESC",
        limit_page_length=1,
    )

    if not logs:
        return api_response(
            success=True,
            data={"status": "No Affiliation Request", "job_offer": job_offer_id},
        )

    log = logs[0]
    affiliation_name = log.facility_affiliation

    if not affiliation_name or not frappe.db.exists("Facility Affiliation", affiliation_name):
        if log.status in ("Failed",):
            status = "Affiliation Request Failed"
        elif log.status in ("Expired",):
            status = "Confirmation Timed Out"
        elif log.status in ("Rejected",):
            status = "Candidate Rejected Affiliation"
        elif log.status in ("Hired",):
            status = "Hired"
        else:
            status = "Affiliation Missing"
        return api_response(
            success=True,
            data={"status": status, "job_offer": job_offer_id},
        )

    affiliation = frappe.get_doc("Facility Affiliation", affiliation_name)
    try:
        affiliation.check_permission("read")
    except frappe.PermissionError:
        return api_response(
            success=False,
            message="You do not have permission to view this Facility Affiliation",
            status_code=403,
        )
    aff_status = affiliation.status

    # Check if Employee was created through the confirmation workflow
    employee_exists = frappe.db.exists(
        "Employee",
        {"health_professional": log.hp_name, "status": "Active"},
    )

    # Map affiliation status to hiring outcome
    if aff_status == "Active" and employee_exists:
        hire_status = "Hired"
    elif aff_status == "Active":
        hire_status = "Active - Awaiting Employee Creation"
    elif aff_status in ("Pending",):
        hire_status = "Awaiting Candidate Confirmation"
    elif aff_status in ("Rejected",):
        hire_status = "Candidate Rejected Affiliation"
    elif aff_status in ("Expired",):
        hire_status = "Confirmation Timed Out"
    elif aff_status in ("Inactive",):
        hire_status = "Affiliation Deactivated"
    else:
        hire_status = f"Unknown ({aff_status})"

    return api_response(
        success=True,
        data={
            "status": hire_status,
            "job_offer": job_offer_id,
            "facility_affiliation": affiliation_name,
            "affiliation_status": aff_status,
            "employee_exists": bool(employee_exists),
            "hp_name": log.hp_name,
        },
    )


# ---------------------------------------------------------------------------
# Share Public Link generation
# ---------------------------------------------------------------------------

@frappe.whitelist()
def get_public_job_links(job_opening_id=None):
    """
    Generate shareable public URLs for the jobs board.

    Returns:
    - jobs_list_url: canonical /jobs URL
    - job_detail_url: canonical /jobs/<slug> URL (if job_opening_id provided)
    """
    base_url = _get_site_base_url()
    jobs_list_url = f"{base_url}/jobs"

    result = {"jobs_list_url": jobs_list_url}

    if job_opening_id:
        if not frappe.db.exists("Job Opening", job_opening_id):
            return api_response(
                success=False,
                message=f"Job Opening '{job_opening_id}' not found",
                status_code=404,
            )

        job = frappe.get_doc("Job Opening", job_opening_id)
        try:
            job.check_permission("read")
        except frappe.PermissionError:
            return api_response(
                success=False,
                message="You do not have permission to view this Job Opening",
                status_code=403,
            )
        slug = _make_job_slug(job)
        result["job_detail_url"] = f"{base_url}/jobs/{slug}"
        result["job_opening"] = job_opening_id
        result["slug"] = slug

    return api_response(success=True, data=result)


# ---------------------------------------------------------------------------
# Timeout handler (called from scheduler)
# ---------------------------------------------------------------------------

def check_expired_hiring_affiliations(sla_days=7):
    """
    Scheduler task: find hiring affiliations past SLA and mark as timed out.
    Called from hooks scheduler_events.
    """
    cutoff = add_days(now_datetime(), -sla_days)

    pending_logs = frappe.get_list(
        "Hiring Idempotency Log",
        filters={
            "status": "Created",
            "request_timestamp": ["<=", cutoff],
        },
        fields=["name", "facility_affiliation", "job_offer", "hp_name"],
    )

    for log in pending_logs:
        if not log.facility_affiliation:
            continue

        if not frappe.db.exists("Facility Affiliation", log.facility_affiliation):
            continue

        aff_status = frappe.db.get_value(
            "Facility Affiliation", log.facility_affiliation, "status"
        )

        # Only expire if still Pending
        if aff_status in ("Pending",):
            log_doc = frappe.get_doc("Hiring Idempotency Log", log.name)
            log_doc.status = "Expired"
            log_doc.save()
            frappe.log_error(
                title="Hiring SLA Breach: Confirmation Timed Out",
                message=json.dumps({
                    "job_offer": log.job_offer,
                    "hp_name": log.hp_name,
                    "facility_affiliation": log.facility_affiliation,
                    "sla_days": sla_days,
                    "timestamp": str(now_datetime()),
                }),
            )

    if pending_logs:
        frappe.db.commit()


# ---------------------------------------------------------------------------
# Reminder scheduler (called from hooks)
# ---------------------------------------------------------------------------

def send_hiring_confirmation_reminders():
    """
    Send reminders for pending hiring affiliations at 24h, 72h, and 24h before expiry.
    Uses frappe.sendmail to notify the recruiter who initiated the hire.
    """
    now = now_datetime()
    pending_logs = frappe.get_list(
        "Hiring Idempotency Log",
        filters={"status": "Created"},
        fields=["name", "facility_affiliation", "job_offer", "hp_name", "request_timestamp", "actor"],
    )

    sla_days = 7
    reminder_labels = {24: "24-hour", 72: "72-hour", 144: "Final (24h before expiry)"}

    for log in pending_logs:
        if not log.request_timestamp:
            continue

        hours_elapsed = (now - log.request_timestamp).total_seconds() / 3600
        hours_remaining = (sla_days * 24) - hours_elapsed

        # Reminder windows: 24h, 72h, 144h (24h before 7-day expiry)
        reminder_windows = [24, 72, 144]
        for window in reminder_windows:
            if window - 1 <= hours_elapsed <= window + 1:
                # Resolve recruiter email from the actor (user who initiated)
                recipient = log.actor or frappe.session.user
                if not recipient or recipient == "Administrator":
                    break

                # Get candidate name from Job Offer
                candidate_name = ""
                if log.job_offer:
                    candidate_name = frappe.db.get_value(
                        "Job Offer", log.job_offer, "applicant_name"
                    ) or ""

                label = reminder_labels.get(window, f"{window}h")
                subject = f"Hiring Reminder ({label}): {candidate_name or log.hp_name} — Awaiting Candidate Confirmation"

                message_body = f"""
                <h3>Hiring Confirmation Reminder</h3>
                <p>A hiring affiliation request is still awaiting candidate confirmation.</p>
                <table style="border-collapse:collapse;margin:12px 0;">
                    <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Job Offer</td><td>{log.job_offer or '—'}</td></tr>
                    <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Candidate</td><td>{candidate_name or '—'}</td></tr>
                    <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Health Professional</td><td>{log.hp_name or '—'}</td></tr>
                    <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Affiliation</td><td>{log.facility_affiliation or '—'}</td></tr>
                    <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Time Elapsed</td><td>{round(hours_elapsed, 1)} hours</td></tr>
                    <tr><td style="padding:4px 12px 4px 0;font-weight:600;">Time Remaining</td><td>{round(max(0, hours_remaining), 1)} hours</td></tr>
                </table>
                <p>Please follow up with the candidate or take action in the Recruitment Desk.</p>
                """

                try:
                    frappe.sendmail(
                        recipients=[recipient],
                        subject=subject,
                        message=message_body,
                        reference_doctype="Job Offer",
                        reference_name=log.job_offer,
                        now=True,
                    )
                except Exception:
                    frappe.log_error(
                        title=f"Hiring Reminder Email Failed ({window}h)",
                        message=frappe.get_traceback(),
                    )
                break


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _parse_employment_details(employment_details):
    """Parse employment_details from request kwargs."""
    if not employment_details:
        return None
    if isinstance(employment_details, str):
        try:
            employment_details = json.loads(employment_details)
        except (json.JSONDecodeError, TypeError):
            return None
    if not isinstance(employment_details, dict):
        return None
    return dict(employment_details) if employment_details else None


def _resolve_hp_name(offer):
    """
    Resolve hp_name from the Job Applicant linked to this Job Offer.
    Expects a custom field 'health_professional' on Job Applicant.
    """
    applicant_name = offer.job_applicant
    if not applicant_name:
        return None

    hp_name = frappe.db.get_value(
        "Job Applicant", applicant_name, "health_professional"
    )
    return hp_name if hp_name else None


def _check_idempotency(idempotency_key):
    """Check if an idempotent request already exists within the dedup window."""
    dedup_days = 30
    cutoff = add_days(now_datetime(), -dedup_days)

    existing = frappe.get_list(
        "Hiring Idempotency Log",
        filters={
            "idempotency_key": idempotency_key,
            "status": ["in", _IDEMPOTENT_ACTIVE_STATUSES],
            "creation": [">=", cutoff],
        },
        fields=["name", "facility_affiliation"],
        limit_page_length=1,
    )

    if existing and existing[0].facility_affiliation:
        return existing[0]
    return None


def _log_idempotency(
    idempotency_key, job_offer, hp_name, fid,
    request_hash=None, facility_affiliation=None,
    status="Created", error_message=None,
):
    """Create or update idempotency log entry."""
    try:
        if frappe.db.exists("Hiring Idempotency Log", idempotency_key):
            doc = frappe.get_doc("Hiring Idempotency Log", idempotency_key)
            doc.facility_affiliation = facility_affiliation
            doc.status = status
            doc.error_message = error_message
            doc.save()
        else:
            doc = frappe.new_doc("Hiring Idempotency Log")
            doc.idempotency_key = idempotency_key
            doc.job_offer = job_offer
            doc.hp_name = hp_name
            doc.facility = fid
            doc.facility_affiliation = facility_affiliation
            doc.request_hash = request_hash
            doc.status = status
            doc.error_message = error_message
            doc.actor = frappe.session.user
            doc.request_timestamp = now_datetime()
            doc.insert()
    except Exception:
        frappe.log_error(
            "Hiring idempotency log failed", frappe.get_traceback()
        )


def _persist_hiring_linkage(offer, affiliation_name, hp_name, idempotency_key):
    """
    Store affiliation reference on Job Offer for traceability.
    """
    try:
        # Store on Job Offer if custom fields exist
        if frappe.get_meta("Job Offer").has_field("facility_affiliation"):
            offer.facility_affiliation = affiliation_name
        if frappe.get_meta("Job Offer").has_field("health_professional"):
            offer.health_professional = hp_name
        if frappe.get_meta("Job Offer").has_field("hiring_idempotency_key"):
            offer.hiring_idempotency_key = idempotency_key
        offer.save()
    except Exception:
        frappe.log_error(
            "persist_hiring_linkage failed", frappe.get_traceback()
        )


def _compute_request_hash(job_offer_id, hp_name, employment_details):
    """Compute a hash of the request payload for audit purposes."""
    payload = json.dumps(
        {"job_offer": job_offer_id, "hp_name": hp_name, "employment_details": employment_details},
        sort_keys=True,
    )
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


def _make_job_slug(job):
    """Generate a URL-safe slug for a Job Opening."""
    import re
    title = job.job_title or job.designation or job.name
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return f"{slug}-{job.name}"


def _get_site_base_url():
    """Get the canonical base URL for the site."""
    return frappe.utils.get_url().rstrip("/")
