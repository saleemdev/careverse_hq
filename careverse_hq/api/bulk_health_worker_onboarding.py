"""
Bulk Health Worker Onboarding API

This module handles bulk upload and processing of health worker onboarding records.
Supports CSV and JSON input formats.
"""

from .utils import *
import frappe
from frappe import _
from datetime import datetime
import csv
import io
import json


@frappe.whitelist()
def upload_bulk_health_workers(**kwargs):
    """
    API 1: Upload bulk health worker records (CSV or JSON)

    Args:
        facility_fid (str): Health Facility ID (required)
        requested_by (str): User requesting the upload (required for guest users)
        records (str/list): CSV string or JSON array of worker records

    Expected CSV columns (mandatory):
        - identification_type (required)
        - identification_number (required)
        - employment_type (required)
        - designation (required)
        - start_date (required)
        - end_date (required)

    Expected CSV columns (optional):
        - registration_number (optional - saved but not used in HWR verification)
        - regulator (optional - saved but not used in HWR verification)

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

        # Check if facility exists
        if not frappe.db.exists("Health Facility", {"hie_id": facility_fid}):
            return api_response(
                success=False,
                message=f"Facility with FID '{facility_fid}' does not exist",
                status_code=404,
            )

        # Get facility name
        facility_name = frappe.db.get_value(
            "Health Facility", {"hie_id": facility_fid}, "name"
        )

        # Parse records (CSV or JSON)
        records = _parse_records_input(records_input)

        if not records:
            return api_response(
                success=False,
                message="No valid records found in input",
                status_code=400,
            )

        # Validate all records before creating job
        validation_errors = []
        for idx, record in enumerate(records, start=1):
            errors = _validate_record(record, idx)
            validation_errors.extend(errors)

        if validation_errors:
            # Create detailed error message
            error_summary = "; ".join(validation_errors[:3])  # Show first 3 errors
            if len(validation_errors) > 3:
                error_summary += f" ... and {len(validation_errors) - 3} more error(s)"

            return api_response(
                success=False,
                message=f"Validation failed: {error_summary}",
                data={
                    "errors": validation_errors,
                    "total_errors": len(validation_errors),
                },
                status_code=400,
            )

        # Create parent record
        parent_doc = frappe.new_doc("Bulk Health Worker Upload")
        parent_doc.facility = facility_name
        parent_doc.uploaded_by = frappe.session.user
        parent_doc.upload_date = datetime.now()
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
        frappe.db.commit()

        # Enqueue background job
        # Note: 'job_id' is a reserved parameter in frappe.enqueue, so we use 'upload_id' instead
        frappe.enqueue(
            method="careverse_hq.api.bulk_health_worker_onboarding.process_bulk_upload",
            queue="long",
            timeout=3600,  # 1 hour
            job_name=f"bulk_hw_upload_{parent_doc.name}",
            enqueue_after_commit=True,
            upload_id=parent_doc.name,  # Renamed from job_id to avoid conflict
        )

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
        job_ids = frappe.db.get_all(
            "Bulk Health Worker Upload",
            filters={"facility": facility_name},
            pluck="name",
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
        total_count = frappe.db.count("Bulk Health Worker Upload Item", filters=filters)

        # Calculate offset
        offset = (page - 1) * per_page

        # Get records
        records = frappe.db.get_all(
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
            order_by="parent desc, `row_number` asc",  # Escaped because row_number is a SQL reserved keyword
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

        # Check if job exists
        if not frappe.db.exists("Bulk Health Worker Upload", job_id):
            return api_response(
                success=False,
                message=f"Job '{job_id}' does not exist",
                status_code=404,
            )

        # Build filters
        filters = {"parent": job_id}

        if verification_status:
            filters["verification_status"] = verification_status

        if onboarding_status:
            filters["onboarding_status"] = onboarding_status

        # Get total count
        total_count = frappe.db.count("Bulk Health Worker Upload Item", filters=filters)

        # Calculate offset
        offset = (page - 1) * per_page

        # Get records
        records = frappe.db.get_all(
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
            order_by="`row_number` asc",  # Escaped because row_number is a SQL reserved keyword
            limit_start=offset,
            limit_page_length=per_page,
        )

        # Calculate summary metrics
        summary = _calculate_summary_metrics(job_id=job_id)

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


# ============================================================================
# BACKGROUND PROCESSING FUNCTION
# ============================================================================


def process_bulk_upload(upload_id):
    """
    Background job to process bulk health worker upload

    This function:
    1. Fetches all pending records for the job
    2. For each record:
       - Verifies with HWR
       - Creates Health Professional (if verified)
       - Creates Facility Affiliation
       - Updates record status
       - Commits after each record
    3. Updates parent job status when complete

    Args:
        upload_id (str): Bulk Health Worker Upload document name
    """
    frappe.log_error(
        "Bulk Upload Job Started",
        f"Processing bulk upload job {upload_id}",
    )
    try:
        # Get parent document
        frappe.log_error(
            "Bulk Upload Job Processing",
            f"Processing bulk upload job {upload_id}",
        )
        parent_doc = frappe.get_doc("Bulk Health Worker Upload", upload_id)

        # Update status to Processing
        # IMPORTANT: Use db.set_value instead of save() to avoid reloading child table
        frappe.db.set_value(
            "Bulk Health Worker Upload",
            upload_id,
            {
                "status": "Processing",
                "started_at": datetime.now(),
            },
        )
        frappe.db.commit()

        # Get all child records
        child_records = frappe.get_all(
            "Bulk Health Worker Upload Item",
            filters={"parent": upload_id},
            fields=[
                "name",
                "identification_type",
                "identification_number",
                "registration_number",
                "regulator",
                "fid",
                "employment_type",
                "designation",
                "start_date",
                "end_date",
                "requested_by",
            ],
            order_by="`row_number` asc",  # Escaped because row_number is a SQL reserved keyword
        )

        # Process each record sequentially
        for record in child_records:
            _process_single_record(record, parent_doc.facility)

        # Update parent status to Completed
        # IMPORTANT: Use db.set_value instead of save() to avoid reloading child table
        # which would overwrite the child records we just updated
        frappe.db.set_value(
            "Bulk Health Worker Upload",
            upload_id,
            {
                "status": "Completed",
                "completed_at": datetime.now(),
            },
        )
        frappe.db.commit()

        frappe.log_error(
            "Bulk Upload Job Completed",
            f"Bulk upload job {upload_id} completed successfully",
        )

    except Exception:
        frappe.log_error(
            f"process_bulk_upload failed for job {upload_id}",
            frappe.get_traceback(),
        )

        # Update parent status to Failed
        try:
            # IMPORTANT: Use db.set_value instead of save() to avoid reloading child table
            frappe.db.set_value(
                "Bulk Health Worker Upload",
                upload_id,
                {
                    "status": "Failed",
                    "completed_at": datetime.now(),
                },
            )
            frappe.db.commit()
        except:
            pass


def _process_single_record(record, facility_name):
    """
    Process a single bulk upload record

    Args:
        record (dict): Child record data
        facility_name (str): Health Facility document name
    """
    try:
        frappe.log_error(
            "Bulk Upload Single Record",
            f"Processing single record: {record['name']}",
        )
        child_doc = frappe.get_doc("Bulk Health Worker Upload Item", record["name"])

        # Skip records that are already successfully processed
        if child_doc.onboarding_status == "Success":
            frappe.log_error(
                "Bulk Upload Skip Record",
                f"Skipping already processed record: {record['name']}",
            )
            return

        # Step 1: Verify with HWR
        hwr_data, error = _verify_with_hwr(
            record["identification_type"], record["identification_number"]
        )
        frappe.log_error(
            "Bulk Upload Verification Result",
            f"Verification result for {record['name']}: hwr_data={hwr_data}, error={error}",
        )

        if error or not hwr_data:
            child_doc.verification_status = "Failed"
            child_doc.verification_error = (
                error.get("message", "Unknown error") if error else "No data returned"
            )
            child_doc.onboarding_status = "Failed"
            child_doc.save(ignore_permissions=True)
            frappe.db.commit()
            return

        # Verification successful
        frappe.log_error(
            "Bulk Upload Step: Setting verification_status to Verified",
            f"Record {record['name']}: Setting verification_status to Verified",
        )
        child_doc.verification_status = "Verified"
        child_doc.save(ignore_permissions=True)
        frappe.log_error(
            "Bulk Upload Step: Saved verification status, committing",
            f"Record {record['name']}: Saved verification status, committing...",
        )
        frappe.db.commit()
        frappe.log_error(
            "Bulk Upload Step: Committed. Proceeding to create HP",
            f"Record {record['name']}: Committed. Proceeding to create HP...",
        )

        # Step 2: Create Health Professional
        hp_name = _create_health_professional(hwr_data)

        if not hp_name:
            child_doc.onboarding_status = "Failed"
            child_doc.onboarding_error = "Failed to create Health Professional record"
            child_doc.save(ignore_permissions=True)
            frappe.db.commit()
            return

        child_doc.health_professional_id = hp_name
        child_doc.save(ignore_permissions=True)
        frappe.db.commit()

        # Step 3: Create Facility Affiliation
        employment_details = {
            "fid": facility_name,  # Use facility name, not FID
            "employment_type": record.get("employment_type"),
            "designation": record.get("designation"),
            "start_date": record.get("start_date"),
            "end_date": record.get("end_date"),
        }

        # Pass requested_by directly to the internal function (no need to set_user in background jobs)
        affiliation_result = _create_facility_affiliation(
            hp_name, employment_details, requested_by=record.get("requested_by")
        )

        if affiliation_result.get("error"):
            child_doc.onboarding_status = "Failed"
            child_doc.onboarding_error = affiliation_result.get(
                "message", "Unknown error"
            )
            child_doc.save(ignore_permissions=True)
            frappe.db.commit()
            return

        # Success
        child_doc.onboarding_status = "Success"
        child_doc.facility_affiliation_id = affiliation_result.get("name")
        child_doc.save(ignore_permissions=True)
        frappe.db.commit()

    except Exception as e:
        frappe.log_error(
            f"_process_single_record failed for {record['name']}",
            frappe.get_traceback(),
        )
        try:
            child_doc = frappe.get_doc("Bulk Health Worker Upload Item", record["name"])
            child_doc.onboarding_status = "Failed"
            child_doc.onboarding_error = str(e)
            child_doc.save(ignore_permissions=True)
            frappe.db.commit()
        except:
            pass


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


def _parse_records_input(records_input):
    """
    Parse CSV or JSON input into list of record dictionaries

    Args:
        records_input: CSV string or JSON array

    Returns:
        list: List of record dictionaries
    """
    # CSV parsing expectations:
    # - CSV has header row
    # - Mandatory columns: identification_type, identification_number, employment_type, designation, start_date, end_date
    # - Optional columns: registration_number, regulator

    if not records_input:
        return []

    # Try to parse as JSON first
    if isinstance(records_input, list):
        return records_input

    if isinstance(records_input, str):
        # Try JSON
        try:
            parsed = json.loads(records_input)
            if isinstance(parsed, list):
                return parsed
        except:
            pass

        # Try CSV
        try:
            csv_file = io.StringIO(records_input)
            reader = csv.DictReader(csv_file)
            records = []
            for row in reader:
                # Clean up the row data
                cleaned_row = {
                    k.strip(): v.strip() if v else None for k, v in row.items()
                }
                records.append(cleaned_row)
            return records
        except Exception as e:
            frappe.log_error(
                "Bulk Upload CSV Parse Error",
                f"CSV parsing error: {str(e)}",
            )
            return []

    return []


def _validate_record(record, row_number):
    """
    Validate a single record

    Args:
        record (dict): Record data
        row_number (int): Row number for error messages

    Returns:
        list: List of error messages (empty if valid)
    """
    errors = []

    # Check mandatory fields
    mandatory_fields = [
        "identification_type",
        "identification_number",
        "employment_type",
        "designation",
        "start_date",
        # "end_date",
    ]

    for field in mandatory_fields:
        if not record.get(field):
            errors.append(f"Row {row_number}: Missing required field '{field}'")

    # Validate employment_type against allowed values
    if record.get("employment_type"):
        allowed_employment_types = [
            "Full-time Employee",
            "Part-time Employee",
            "Consultant",
            "Locum/Temporary",
            "Volunteer",
            "Intern/Resident",
            "Contracted",
        ]

        employment_type = record.get("employment_type").strip()

        if employment_type not in allowed_employment_types:
            errors.append(
                f"Row {row_number}: Invalid employment_type '{employment_type}'. "
                f"Allowed values: {', '.join(allowed_employment_types)}"
            )

    # Validate regulator against allowed values (optional field)
    if record.get("regulator"):
        regulator = record.get("regulator").strip()

        allowed_regulators = {
            "KMPDC": "Kenya Medical Practitioners and Dentists Council",
            "NCK": "Nursing Council of Kenya",
            "PPB": "Pharmacy and Poisons Board",
            "COC": "Clinical Officers Council",
        }

        # Check if the regulator matches either an abbreviation or full name (case-insensitive)
        valid_abbreviations = list(allowed_regulators.keys())
        valid_full_names = list(allowed_regulators.values())

        # Case-insensitive comparison
        is_valid = False
        for abbr in valid_abbreviations:
            if regulator.upper() == abbr.upper():
                is_valid = True
                break

        if not is_valid:
            for full_name in valid_full_names:
                if regulator.lower() == full_name.lower():
                    is_valid = True
                    break

        if not is_valid:
            errors.append(
                f"Row {row_number}: Invalid regulator '{regulator}'. "
                f"Allowed abbreviations: {', '.join(valid_abbreviations)} "
                f"or their full names: {', '.join(valid_full_names)}"
            )

    return errors


def _verify_with_hwr(identification_type, identification_number):
    """
    Verify health worker with HWR API

    Args:
        identification_type (str): Type of identification (e.g., 'National ID')
        identification_number (str): Identification number

    Returns:
        tuple: (hwr_data, error)
    """
    from .utils import fetch_hwr_practitioner

    try:
        # Call HWR API using identification details
        hwr_data, error = fetch_hwr_practitioner(
            identification_type=identification_type,
            identification_number=identification_number,
        )
        return hwr_data, error
    except Exception as e:
        frappe.log_error(
            "Bulk Upload HWR Error",
            f"HWR verification error: {str(e)}\n\nFull Traceback:\n{frappe.get_traceback()}",
        )
        return None, {"message": str(e), "status_code": 500}


def _create_health_professional(hwr_data):
    """
    Create Health Professional record from HWR data

    Args:
        hwr_data (dict): HWR practitioner data

    Returns:
        str: Health Professional document name, or None if failed
    """
    try:
        frappe.log_error(
            "Bulk Upload HP Creation",
            f"Creating Health Professional from HWR data: {hwr_data}",
        )
        hp_doc = frappe.new_doc("Health Professional")
        hp_name = hp_doc.create_hp_from_hwr_data(hwr_data)
        return hp_name
    except Exception as e:
        frappe.log_error(
            "Bulk Upload HP Creation Error",
            f"Health Professional creation error: {str(e)}\n\nFull Traceback:\n{frappe.get_traceback()}",
        )
        return None


def _create_facility_affiliation(hp_name, employment_details, requested_by=None):
    """
    Create Facility Affiliation record (for background job use).

    Uses the internal function without auth decorator to avoid HTTP request context issues.

    Args:
        hp_name (str): Health Professional document name
        employment_details (dict): Employment details
        requested_by (str): User who requested the affiliation (for background jobs)

    Returns:
        dict: Result with 'success' or 'error' key
    """
    from .health_worker_onboarding import _create_facility_affiliation_record_internal

    try:
        # Use internal function to bypass auth decorator (no HTTP context in background jobs)
        result = _create_facility_affiliation_record_internal(
            hp_name,
            employment_details,
            requested_by=requested_by,
            ignore_permissions=True,  # Background jobs need to bypass permission checks
        )
        return result
    except Exception as e:
        traceback_str = frappe.get_traceback()
        frappe.log_error(
            "Bulk Upload Affiliation Error",
            f"hp_name={hp_name}\nemployment_details={employment_details}\nrequested_by={requested_by}\n\nError: {str(e)}\n\nTraceback:\n{traceback_str}",
        )
        return {"error": True, "message": str(e)}


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
        job_ids = frappe.db.get_all(
            "Bulk Health Worker Upload",
            filters={"facility": facility_name},
            pluck="name",
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
    all_records = frappe.db.get_all(
        "Bulk Health Worker Upload Item",
        filters=filters,
        fields=["verification_status", "onboarding_status"],
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
