"""
Bulk Health Worker Onboarding API

This module saves bulk upload records in HQ and hands them off to
healthpro_erp for all post-save processing.
"""

from .utils import *
import frappe
from datetime import datetime
import json
from .dashboard_utils import resolve_health_facility_reference, _count


@frappe.whitelist()
def get_facilities():
    """
    Return a simple list of Health Facilities for the Bulk Upload facility selector.
    frappe.get_list respects User Permissions automatically.
    """
    try:
        facilities = frappe.get_list(
            "Health Facility",
            fields=["hie_id", "facility_name"],
            order_by="facility_name asc",
            limit_page_length=0,
        )
        return api_response(success=True, data=facilities, status_code=200)
    except Exception as e:
        frappe.log_error("get_facilities failed", frappe.get_traceback())
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def upload_bulk_health_workers(**kwargs):
    """
    API 1: Save bulk health worker records into the Bulk Health Worker Upload
    doctype and hand off processing to healthpro_erp.

    Args:
        facility_fid (str): Health Facility ID (required)
        requested_by (str): User requesting the upload (required for guest users)
        records (str/list): JSON array or JSON string array of worker records

    Returns:
        API response with job_id
    """
    try:
        facility_fid = kwargs.get("facility_fid")
        records_input = kwargs.get("records")
        requested_by = kwargs.get("requested_by")

        # Validate facility_fid
        if not facility_fid:
            return api_response(
                success=False,
                message="facility_fid is required",
                status_code=400,
            )

        # Validate requested_by for guest users
        if frappe.session.user == "Guest":
            if not requested_by:
                return api_response(
                    success=False,
                    message="requested_by parameter is required for guest users",
                    status_code=400,
                )
        else:
            # Use logged-in user
            requested_by = frappe.session.user

        # Verify facility exists AND user has permission to access it
        facility_matches = frappe.get_list(
            "Health Facility",
            filters={"hie_id": facility_fid},
            fields=["name"],
            limit_page_length=1,
        )
        if not facility_matches:
            return api_response(
                success=False,
                message=f"Facility with FID '{facility_fid}' not found or access denied",
                status_code=404,
            )
        facility_name = facility_matches[0].name

        # Parse records (HQ accepts JSON list or a JSON-stringified list)
        records = _parse_records_input(records_input)

        if not records:
            return api_response(
                success=False,
                message="No valid records found in input",
                status_code=400,
            )
        if not all(isinstance(record, dict) for record in records):
            return api_response(
                success=False,
                message="records must be a list of objects",
                status_code=400,
            )

        uploaded_at = datetime.now()

        # Save the upload in HQ, then hand the saved job off to healthpro_erp.
        parent_doc = frappe.new_doc("Bulk Health Worker Upload")
        parent_doc.facility = facility_name
        parent_doc.uploaded_by = requested_by or frappe.session.user
        parent_doc.upload_date = uploaded_at
        parent_doc.status = "Queued"

        # Create child records
        for idx, record in enumerate(records, start=1):
            child = parent_doc.append("items", {})
            child.row_number = idx
            child.identification_type = record.get("identification_type", "")
            child.identification_number = record.get("identification_number", "")
            child.registration_number = record.get("registration_number", "")
            child.regulator = record.get("regulator", "")
            child.fid = facility_fid
            child.employment_type = record.get("employment_type", "")
            child.designation = record.get("designation", "")
            child.start_date = record.get("start_date")
            child.end_date = record.get("end_date")
            child.requested_by = requested_by
            child.verification_status = "Pending"
            child.onboarding_status = "Pending"

        parent_doc.insert()

        frappe.enqueue(
            method="healthpro_erp.api.bulk_health_worker_onboarding.process_bulk_upload",
            queue="long",
            timeout=3600,
            job_name=f"bulk_hw_upload_{parent_doc.name}",
            enqueue_after_commit=True,
            upload_id=parent_doc.name,
        )

        frappe.db.commit()

        return api_response(
            success=True,
            data={"job_id": parent_doc.name, "total_records": len(records)},
            message="Bulk upload queued successfully",
            status_code=202,
        )

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error("upload_bulk_health_workers failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=f"Failed to upload bulk records: {str(e)}",
            status_code=500,
        )


def _is_legacy_uploaded_job_reader(job_doc):
    """
    Legacy compatibility:
    some older jobs may have owner metadata set to Administrator while
    uploaded_by is the actual requesting user.
    """
    current_user = frappe.session.user
    if not current_user or current_user == "Guest":
        return False

    if not frappe.has_permission("Bulk Health Worker Upload", "read"):
        return False

    return (job_doc.get("uploaded_by") or "") == current_user


def _get_job_with_read_access(job_id):
    normalized_job_id = (str(job_id or "")).strip()
    if not normalized_job_id:
        return None, 400, "job_id is required"

    try:
        job = frappe.get_doc("Bulk Health Worker Upload", normalized_job_id)
    except frappe.DoesNotExistError:
        return None, 404, "Job not found"

    try:
        job.check_permission("read")
    except frappe.PermissionError:
        if not _is_legacy_uploaded_job_reader(job):
            return None, 403, "Job not found or access denied"

    return job, None, None


@frappe.whitelist()
def get_bulk_records_by_facility(**kwargs):
    """
    API 2: Get all bulk upload records for a specific facility

    Args:
        facility_fid (str): Health Facility ID (required)
        verification_status (str): Filter by verification status (optional)
        onboarding_status (str): Filter by onboarding status (optional)
        page (int): Page number (default: 1)
        per_page (int): Records per page (default: 20)

    Returns:
        Paginated list of records with summary metrics
    """
    try:
        facility_fid = kwargs.get("facility_fid")
        verification_status = kwargs.get("verification_status")
        onboarding_status = kwargs.get("onboarding_status")
        page = int(kwargs.get("page", 1))
        per_page = int(kwargs.get("per_page", 20))

        if not facility_fid:
            return api_response(
                success=False,
                message="facility_fid is required",
                status_code=400,
            )

        # Get facility name
        facility_name = frappe.db.get_value(
            "Health Facility", {"hie_id": facility_fid}, "name"
        )

        if not facility_name:
            return api_response(
                success=False,
                message=f"Facility with FID '{facility_fid}' does not exist",
                status_code=404,
            )

        # Get all job IDs for this facility
        job_ids = frappe.get_list(
            "Bulk Health Worker Upload",
            filters={"facility": facility_name},
            pluck="name",
            limit_page_length=0,
        )

        if not job_ids:
            # No jobs found for this facility
            return api_response(
                success=True,
                data={"records": [], "summary": {}},
                pagination={
                    "current_page": page,
                    "per_page": per_page,
                    "total_count": 0,
                },
                status_code=200,
            )

        # Build filters for child items
        filters = {"parent": ["in", job_ids]}

        if verification_status:
            filters["verification_status"] = verification_status

        if onboarding_status:
            filters["onboarding_status"] = onboarding_status

        # Get total count
        total_count = _count("Bulk Health Worker Upload Item", filters=filters)

        # Calculate offset
        offset = (page - 1) * per_page

        # Get records
        records = frappe.get_list(
            "Bulk Health Worker Upload Item",
            filters=filters,
            fields=[
                "name",
                "parent",
                "row_number",
                "registration_number",
                "fid",
                "employment_type",
                "designation",
                "start_date",
                "end_date",
                "requested_by",
                "verification_status",
                "verification_error",
                "onboarding_status",
                "onboarding_error",
                "health_professional_id",
                "facility_affiliation_id",
            ],
            order_by="parent desc, row_number asc",
            limit_start=offset,
            limit_page_length=per_page,
        )

        # Calculate summary metrics
        summary = _calculate_summary_metrics(facility_name=facility_name)

        return api_response(
            success=True,
            data={"records": records, "summary": summary},
            pagination={
                "current_page": page,
                "per_page": per_page,
                "total_count": total_count,
            },
            status_code=200,
        )

    except Exception as e:
        frappe.log_error("get_bulk_records_by_facility failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=f"Failed to fetch records: {str(e)}",
            status_code=500,
        )


@frappe.whitelist()
def get_bulk_records_by_job(**kwargs):
    """
    API 3: Get all records for a specific bulk upload job

    Args:
        job_id (str): Bulk upload job ID (required)
        verification_status (str): Filter by verification status (optional)
        onboarding_status (str): Filter by onboarding status (optional)
        page (int): Page number (default: 1)
        per_page (int): Records per page (default: 20)

    Returns:
        Paginated list of records with summary metrics
    """
    try:
        job_id = kwargs.get("job_id")
        verification_status = kwargs.get("verification_status")
        onboarding_status = kwargs.get("onboarding_status")
        page = int(kwargs.get("page", 1))
        per_page = int(kwargs.get("per_page", 20))

        if not job_id:
            return api_response(
                success=False,
                message="job_id is required",
                status_code=400,
            )

        job, error_code, error_message = _get_job_with_read_access(job_id)
        if error_code:
            return api_response(
                success=False,
                message=error_message,
                status_code=error_code,
            )

        # Build filters
        filters = {"parent": job.name}

        if verification_status:
            filters["verification_status"] = verification_status

        if onboarding_status:
            filters["onboarding_status"] = onboarding_status

        # Get total count
        total_count = _count("Bulk Health Worker Upload Item", filters=filters)

        # Calculate offset
        offset = (page - 1) * per_page

        # Get records
        records = frappe.get_list(
            "Bulk Health Worker Upload Item",
            filters=filters,
            fields=[
                "name",
                "parent",
                "row_number",
                "registration_number",
                "fid",
                "employment_type",
                "designation",
                "start_date",
                "end_date",
                "requested_by",
                "verification_status",
                "verification_error",
                "onboarding_status",
                "onboarding_error",
                "health_professional_id",
                "facility_affiliation_id",
            ],
            order_by="row_number asc",
            limit_start=offset,
            limit_page_length=per_page,
        )

        # Calculate summary metrics
        summary = _calculate_summary_metrics(job_id=job.name)

        return api_response(
            success=True,
            data={"records": records, "summary": summary},
            pagination={
                "current_page": page,
                "per_page": per_page,
                "total_count": total_count,
            },
            status_code=200,
        )

    except Exception as e:
        frappe.log_error("get_bulk_records_by_job failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=f"Failed to fetch records: {str(e)}",
            status_code=500,
        )


@frappe.whitelist()
def get_bulk_upload_jobs(**kwargs):
    """
    API 4: Get list of all bulk upload jobs with progress metrics

    This endpoint provides an efficient way to list all bulk upload jobs
    with aggregated item counts, avoiding N+1 query problems.
    Permissions: Auto-filtered by User Permissions (Company-based).

    Args:
        status (str): Optional filter by job status (Queued, Processing, Completed, Failed)
        page (int): Page number (default: 1)
        per_page (int): Records per page (default: 100)

    Returns:
        List of jobs with:
        - Basic job info (name, facility, uploaded_by, dates, status)
        - Facility details (facility_name, facility_id)
        - Progress metrics (total_records, verified, created, failed, pending)
    """
    try:
        status = kwargs.get("status")
        page = int(kwargs.get("page", 1))
        per_page = int(kwargs.get("per_page", 100))

        # Build filters - ONLY user-driven (no hardcoded facility filters)
        filters = {}
        if status and status.lower() != "all":
            filters["status"] = status

        # Calculate offset
        offset = (page - 1) * per_page

        # Get total count (frappe auto-applies User Permissions)
        total_count = _count("Bulk Health Worker Upload", filters=filters)

        # Fetch jobs using frappe.get_list (auto-applies User Permissions)
        jobs = frappe.get_list(
            "Bulk Health Worker Upload",
            filters=filters,
            fields=[
                "name",
                "facility",
                "uploaded_by",
                "upload_date",
                "status",
                "started_at",
                "completed_at"
            ],
            order_by="creation desc",
            limit_start=offset,
            limit_page_length=per_page
        )

        if not jobs:
            return api_response(
                success=True,
                data={"jobs": [], "total_count": 0},
                pagination={
                    "current_page": page,
                    "per_page": per_page,
                    "total_count": 0
                },
                status_code=200
            )

        # Batch fetch facility details (avoid N+1)
        facility_ids = [job.get("facility") for job in jobs if job.get("facility")]
        facility_map = {}

        if facility_ids:
            facilities_data = frappe.get_list(
                "Health Facility",
                filters={"name": ["in", facility_ids]},
                fields=["name", "facility_name", "hie_id"],
                limit_page_length=0
            )

            # Fallback: some rows may store HIE IDs in the facility field.
            if len(facilities_data) < len(facility_ids):
                facilities_by_hie = frappe.get_list(
                    "Health Facility",
                    filters={"hie_id": ["in", facility_ids]},
                    fields=["name", "facility_name", "hie_id"],
                    limit_page_length=0
                )
                facilities_data.extend(facilities_by_hie)

            for facility in facilities_data:
                if facility.get("name"):
                    facility_map[facility["name"]] = facility
                if facility.get("hie_id"):
                    facility_map[facility["hie_id"]] = facility

        # Enrich jobs with facility details and item counts
        for job in jobs:
            facility_id = job.get("facility")
            facility = facility_map.get(facility_id)

            # Add facility details
            if facility:
                job["facility_name"] = facility.get("facility_name", "") or facility_id or ""
                job["facility_id"] = facility.get("hie_id", "") or facility_id or ""
            else:
                resolved = resolve_health_facility_reference(facility_id)
                job["facility_name"] = resolved.get("facility_name") or facility_id or ""
                job["facility_id"] = resolved.get("facility_id") or facility_id or ""

            # Calculate item counts using SQL aggregation (single query per job)
            # Pattern from dashboard.py lines 261-306
            counts_query = """
                SELECT
                    COUNT(*) as total_records,
                    SUM(CASE WHEN verification_status = 'Verified' THEN 1 ELSE 0 END) as verified,
                    SUM(CASE WHEN onboarding_status = 'Success' THEN 1 ELSE 0 END) as created,
                    SUM(CASE WHEN onboarding_status = 'Failed' THEN 1 ELSE 0 END) as failed,
                    SUM(CASE WHEN onboarding_status = 'Pending' THEN 1 ELSE 0 END) as pending
                FROM `tabBulk Health Worker Upload Item`
                WHERE parent = %s
            """

            counts_result = frappe.db.sql(
                counts_query,
                (job["name"],),
                as_dict=True
            )

            counts = counts_result[0] if counts_result else {
                "total_records": 0,
                "verified": 0,
                "created": 0,
                "failed": 0,
                "pending": 0
            }

            # Add counts to job object
            job["total_records"] = counts.get("total_records", 0)
            job["verified"] = counts.get("verified", 0)
            job["created"] = counts.get("created", 0)
            job["failed"] = counts.get("failed", 0)
            job["pending"] = counts.get("pending", 0)

        return api_response(
            success=True,
            data={"jobs": jobs},
            pagination={
                "current_page": page,
                "per_page": per_page,
                "total_count": total_count
            },
            status_code=200
        )

    except Exception as e:
        frappe.log_error("get_bulk_upload_jobs failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=f"Failed to fetch bulk upload jobs: {str(e)}",
            status_code=500
        )


@frappe.whitelist()
def get_bulk_upload_job_details(job_id):
    """
    Get detailed information about a specific bulk upload job including all child items.
    Permissions: Auto-filtered by User Permissions (Company-based).

    Args:
        job_id (str): Bulk Health Worker Upload document name

    Returns:
        Job details with:
        - Basic job info (name, facility, uploaded_by, dates, status)
        - Facility details (facility_name, facility_id)
        - All child items with their statuses
        - Progress metrics (total, verified, created, failed, pending)
    """
    try:
        job, error_code, error_message = _get_job_with_read_access(job_id)
        if error_code:
            return api_response(
                success=False,
                message=error_message,
                status_code=error_code
            )

        # Get facility details
        facility_name = ""
        facility_id = ""
        if job.facility:
            resolved = resolve_health_facility_reference(job.facility)
            facility_name = resolved.get("facility_name") or job.facility
            facility_id = resolved.get("facility_id") or job.facility

        # Child table rows belong to the parent doc; read from loaded document after
        # parent permission succeeds to avoid child doctype permission mismatches.
        items = []
        for row in (job.get("items") or []):
            items.append(
                {
                    "name": row.name,
                    "row_number": row.row_number,
                    "identification_type": row.identification_type,
                    "identification_number": row.identification_number,
                    "registration_number": row.registration_number,
                    "regulator": row.regulator,
                    "employment_type": row.employment_type,
                    "designation": row.designation,
                    "verification_status": row.verification_status,
                    "verification_error": row.verification_error,
                    "onboarding_status": row.onboarding_status,
                    "onboarding_error": row.onboarding_error,
                }
            )

        # Calculate statistics using SQL aggregation for efficiency
        stats_query = """
            SELECT
                COUNT(*) as total_records,
                SUM(CASE WHEN verification_status = 'Verified' THEN 1 ELSE 0 END) as verified,
                SUM(CASE WHEN verification_status = 'Failed' THEN 1 ELSE 0 END) as verification_failed,
                SUM(CASE WHEN onboarding_status = 'Success' THEN 1 ELSE 0 END) as created,
                SUM(CASE WHEN onboarding_status = 'Failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN verification_status = 'Pending' OR onboarding_status = 'Pending' THEN 1 ELSE 0 END) as pending
            FROM `tabBulk Health Worker Upload Item`
            WHERE parent = %s
        """

        stats_result = frappe.db.sql(stats_query, (job.name,), as_dict=True)
        stats = stats_result[0] if stats_result else {
            "total_records": 0,
            "verified": 0,
            "verification_failed": 0,
            "created": 0,
            "failed": 0,
            "pending": 0
        }

        # Calculate progress percentage
        total = stats.get("total_records", 0)
        verified = stats.get("verified", 0)
        verification_failed = stats.get("verification_failed", 0)
        progress = ((verified + verification_failed) / total * 100) if total > 0 else 0

        # Build response
        job_data = {
            "name": job.name,
            "facility": job.facility,
            "facility_name": facility_name,
            "facility_id": facility_id,
            "uploaded_by": job.uploaded_by,
            "upload_date": job.upload_date,
            "status": job.status,
            "creation": job.creation,
            "started_at": job.started_at,
            "completed_at": job.completed_at,
            "items": items,
            "stats": {
                "total": stats.get("total_records", 0),
                "verified": stats.get("verified", 0),
                "verification_failed": stats.get("verification_failed", 0),
                "created": stats.get("created", 0),
                "failed": stats.get("failed", 0),
                "pending": stats.get("pending", 0),
                "progress": round(progress, 2)
            }
        }

        return api_response(
            success=True,
            data=job_data,
            status_code=200
        )

    except frappe.DoesNotExistError:
        return api_response(
            success=False,
            message="Job not found",
            status_code=404
        )
    except frappe.PermissionError:
        return api_response(
            success=False,
            message="Access denied",
            status_code=403
        )
    except Exception as e:
        frappe.log_error("get_bulk_upload_job_details failed", frappe.get_traceback())
        return api_response(
            success=False,
            message=f"Failed to fetch job details: {str(e)}",
            status_code=500
        )

def _parse_records_input(records_input):
    """
    Parse the request payload into a list of record dictionaries.

    Args:
        records_input: JSON array or JSON-stringified array

    Returns:
        list: List of record dictionaries
    """
    if not records_input:
        return []

    if isinstance(records_input, list):
        return records_input

    if isinstance(records_input, str):
        try:
            parsed = json.loads(records_input)
            if isinstance(parsed, list):
                return parsed
        except Exception as e:
            frappe.log_error(
                "Bulk Upload JSON Parse Error",
                f"JSON parsing error: {str(e)}",
            )

    return []


def _calculate_summary_metrics(facility_name=None, job_id=None):
    """
    Calculate summary metrics for bulk upload records

    Args:
        facility_name (str): Filter by facility (optional)
        job_id (str): Filter by job ID (optional)

    Returns:
        dict: Summary metrics
    """
    filters = {}

    if facility_name:
        # Get all job IDs for this facility
        job_ids = frappe.get_list(
            "Bulk Health Worker Upload",
            filters={"facility": facility_name},
            pluck="name",
            limit_page_length=0,
        )
        if job_ids:
            filters["parent"] = ["in", job_ids]
        else:
            # No jobs for this facility, return empty metrics
            return {
                "total_records": 0,
                "verification": {"pending": 0, "verified": 0, "failed": 0},
                "onboarding": {"pending": 0, "success": 0, "failed": 0},
            }

    if job_id:
        filters["parent"] = job_id

    # Get all records matching filters
    all_records = frappe.get_list(
        "Bulk Health Worker Upload Item",
        filters=filters,
        fields=["verification_status", "onboarding_status"],
        limit_page_length=0,
    )

    total = len(all_records)

    # Count by verification status
    verification_pending = sum(
        1 for r in all_records if r["verification_status"] == "Pending"
    )
    verification_verified = sum(
        1 for r in all_records if r["verification_status"] == "Verified"
    )
    verification_failed = sum(
        1 for r in all_records if r["verification_status"] == "Failed"
    )

    # Count by onboarding status
    onboarding_pending = sum(
        1 for r in all_records if r["onboarding_status"] == "Pending"
    )
    onboarding_success = sum(
        1 for r in all_records if r["onboarding_status"] == "Success"
    )
    onboarding_failed = sum(
        1 for r in all_records if r["onboarding_status"] == "Failed"
    )

    return {
        "total_records": total,
        "verification": {
            "pending": verification_pending,
            "verified": verification_verified,
            "failed": verification_failed,
        },
        "onboarding": {
            "pending": onboarding_pending,
            "success": onboarding_success,
            "failed": onboarding_failed,
        },
    }
