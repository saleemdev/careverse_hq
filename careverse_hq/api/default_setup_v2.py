"""
Default Setup APIs for HealthPro ERP - Version 2
Handles one-time setup operations like syncing counties and sub-counties

Version 2 Changes:
- Loads county/subcounty data from local JSON file (faster, more reliable)
- Falls back to KMHFR API if JSON file not found
- Modified batch processing to use pre-loaded subcounty data (no API calls in workers)
- Future: Will add synchronous company creation to eliminate lock contention
"""

import frappe
import requests
import json
import os
from datetime import datetime
from .utils import api_response


# ============================================================================
# PUBLIC API - County and Sub-County Sync
# ============================================================================


@frappe.whitelist()
def fix_county_companies_group_flag():
    """
    Utility function to update all county companies to be group companies.
    This is required for creating child region companies.

    Run this if you get "Parent Company must be a group company" errors.

    Returns:
        dict: API response with count of companies updated
    """
    try:
        # Get all companies that are linked to Healthcare Organizations (county companies)
        county_companies = frappe.db.sql(
            """
            SELECT DISTINCT c.name, c.company_name, c.is_group
            FROM `tabCompany` c
            INNER JOIN `tabHealthcare Organization` ho ON ho.company = c.name
            WHERE c.is_group = 0 OR c.is_group IS NULL
            """,
            as_dict=True,
        )

        updated_count = 0
        for company in county_companies:
            frappe.db.set_value("Company", company.name, "is_group", 1)
            updated_count += 1

            frappe.log_error(
                title=f"Company Updated - {company.company_name}",
                message=f"Updated company '{company.name}' to be a group company (is_group=1)",
            )

        frappe.db.commit()

        return api_response(
            success=True,
            message=f"Updated {updated_count} county companies to be group companies",
            data={"updated_count": updated_count},
            status_code=200,
        )

    except Exception as e:
        frappe.log_error(
            title="Fix County Companies Error",
            message=f"Error updating county companies: {str(e)}\n{frappe.get_traceback()}",
        )
        return api_response(
            success=False,
            message=f"Error updating county companies: {str(e)}",
            status_code=500,
        )


@frappe.whitelist()
def sync_counties_and_subcounties(**kwargs):
    """
    Fetch counties from local JSON file (or KMHFR API as fallback) and create
    Company and Healthcare Organization records for counties and sub-counties.

    Supports flexible, granular creation:
    - All counties (batch processing)
    - Single county (with or without subcounties)
    - Single subcounty (auto-creates parent county if needed)
    - Single county + single subcounty

    API Usage:
        GET Request (Query Parameters):
            /api/method/careverse_hq.api.default_setup_v2.sync_counties_and_subcounties?subcounty_name=WESTLANDS
            /api/method/careverse_hq.api.default_setup_v2.sync_counties_and_subcounties?county_name=NAIROBI&create_subcounties=true

        POST Request (JSON Body):
            POST /api/method/careverse_hq.api.default_setup_v2.sync_counties_and_subcounties
            Body: {"subcounty_name": "WESTLANDS"}
            Body: {"county_name": "NAIROBI", "create_subcounties": true}

    Args:
        batch_size (int): Number of counties to process per batch (default: 5)
        use_api_fallback (bool): If True, force API usage instead of JSON (default: False)
        county_name (str): Optional - specific county to process (e.g., "NAIROBI")
        subcounty_name (str): Optional - specific subcounty to process (e.g., "WESTLANDS")
        create_subcounties (bool): Whether to create subcounties for the county (default: True)

    Returns:
        dict: API response with sync results or session ID for batch processing
    """
    try:
        # Extract parameters from kwargs (works with both GET query params and POST body)
        batch_size = kwargs.get("batch_size", 5)
        use_api_fallback = kwargs.get("use_api_fallback", False)
        county_name = kwargs.get("county_name", None)
        subcounty_name = kwargs.get("subcounty_name", None)
        create_subcounties = kwargs.get("create_subcounties", True)

        # DEBUG: Log received parameters
        frappe.log_error(
            title="County Sync - Received Parameters",
            message=f"kwargs={kwargs}\n\n"
            f"batch_size={batch_size} (type: {type(batch_size)})\n"
            f"use_api_fallback={use_api_fallback} (type: {type(use_api_fallback)})\n"
            f"county_name={county_name} (type: {type(county_name)})\n"
            f"subcounty_name={subcounty_name} (type: {type(subcounty_name)})\n"
            f"create_subcounties={create_subcounties} (type: {type(create_subcounties)})",
        )

        # Convert batch_size to int if passed as string
        if isinstance(batch_size, str):
            batch_size = int(batch_size)

        # Convert use_api_fallback to bool if passed as string
        if isinstance(use_api_fallback, str):
            use_api_fallback = use_api_fallback.lower() in ("true", "1", "yes")

        # Convert create_subcounties to bool if passed as string
        if isinstance(create_subcounties, str):
            create_subcounties = create_subcounties.lower() in ("true", "1", "yes")

        # Convert names to uppercase for matching (handle None, empty string, whitespace)
        if county_name and isinstance(county_name, str) and county_name.strip():
            county_name = county_name.upper().strip()
        else:
            county_name = None

        if (
            subcounty_name
            and isinstance(subcounty_name, str)
            and subcounty_name.strip()
        ):
            subcounty_name = subcounty_name.upper().strip()
        else:
            subcounty_name = None

        # DEBUG: Log after conversion
        frappe.log_error(
            title="County Sync - After Conversion",
            message=f"batch_size={batch_size}\n"
            f"use_api_fallback={use_api_fallback}\n"
            f"county_name={county_name}\n"
            f"subcounty_name={subcounty_name}\n"
            f"create_subcounties={create_subcounties}",
        )

        # Try to load counties from JSON first, fallback to API if needed
        counties, data_source = _load_counties_with_fallback(use_api_fallback)

        if not counties:
            return api_response(
                success=False,
                message="No counties loaded from JSON or API",
                status_code=404,
            )

        # Scenario 3 & 4: Process single subcounty
        if subcounty_name:
            return _process_single_subcounty(
                subcounty_name, county_name, counties, data_source
            )

        # Scenario 2: Process single county
        if county_name:
            return _process_single_county_sync(
                county_name, counties, data_source, create_subcounties
            )

        # Scenario 1: Process all counties (batch processing - existing behavior)
        return _process_all_counties_batch(counties, data_source, batch_size)

    except Exception as e:
        frappe.log_error(
            title="County Sync Queue Error (V2)",
            message=f"Failed to queue county sync: {str(e)}\n{frappe.get_traceback()}",
        )
        return api_response(
            success=False, message=f"Failed to queue sync: {str(e)}", status_code=500
        )


# ============================================================================
# SCENARIO HANDLERS - Flexible County/Subcounty Processing
# ============================================================================


def _process_all_counties_batch(counties, data_source, batch_size):
    """
    Scenario 1: Process all counties in batches (existing behavior)

    Args:
        counties (list): List of all counties with nested subcounties
        data_source (str): Source of data (JSON or API)
        batch_size (int): Number of counties per batch

    Returns:
        dict: API response with batch processing details
    """
    # Split into batches
    batches = [
        counties[i : i + batch_size] for i in range(0, len(counties), batch_size)
    ]

    # Create a sync session ID for tracking
    sync_session_id = frappe.generate_hash(length=10)

    # Enqueue a job for each batch
    for batch_index, batch in enumerate(batches):
        frappe.enqueue(
            method="careverse_hq.api.default_setup_v2._process_county_batch",
            queue="long",
            timeout=1800,  # 30 minutes per batch
            is_async=True,
            batch_index=batch_index,
            total_batches=len(batches),
            counties_batch=batch,
            sync_session_id=sync_session_id,
        )

    return api_response(
        success=True,
        message=f"County sync queued: {len(batches)} batches processing {len(counties)} counties (Source: {data_source})",
        data={
            "sync_session_id": sync_session_id,
            "total_counties": len(counties),
            "total_batches": len(batches),
            "batch_size": batch_size,
            "data_source": data_source,
        },
        status_code=202,
    )


def _process_single_county_sync(county_name, counties, data_source, create_subcounties):
    """
    Scenario 2: Process single county (ASYNC at API level, SYNC inside background job)

    - API Level: Enqueues background job and returns 202 immediately
    - Background Job: Processes county sequentially with synchronous company creation

    Args:
        county_name (str): County name (uppercase)
        counties (list): List of all counties with nested subcounties
        data_source (str): Source of data (JSON or API)
        create_subcounties (bool): Whether to create subcounties

    Returns:
        dict: API response with sync_session_id (202 status)
    """
    # Find the county in the data
    county_data = None
    for county in counties:
        if county.get("name") == county_name:
            county_data = county
            break

    if not county_data:
        return api_response(
            success=False,
            message=f"County '{county_name}' not found in {data_source}",
            status_code=404,
        )

    # If create_subcounties=False, remove subcounties from county data
    if not create_subcounties:
        county_data = {
            "id": county_data.get("id"),
            "name": county_data.get("name"),
            "subcounties": [],  # Empty list - no subcounties will be created
        }

    # Create a sync session ID for tracking
    sync_session_id = frappe.generate_hash(length=10)

    # Enqueue background job to process the county (ALWAYS async at API level)
    frappe.enqueue(
        method="careverse_hq.api.default_setup_v2._process_county_batch",
        queue="long",
        timeout=1800,  # 30 minutes
        is_async=True,
        batch_index=0,
        total_batches=1,
        counties_batch=[county_data],  # Single county batch
        sync_session_id=sync_session_id,
    )

    subcounties_count = len(county_data.get("subcounties", []))

    return api_response(
        success=True,
        message=f"County '{county_name}' sync queued (Source: {data_source}). {'Subcounties will be created.' if create_subcounties else 'Subcounties will be skipped.'}",
        data={
            "county_name": county_name,
            "data_source": data_source,
            "sync_session_id": sync_session_id,
            "subcounties_count": subcounties_count,
            "create_subcounties": create_subcounties,
        },
        status_code=202,  # ALWAYS 202 (async)
    )


def _process_single_subcounty(subcounty_name, county_name, counties, data_source):
    """
    Scenario 3 & 4: Process single subcounty (ASYNC at API level, SYNC inside background job)

    - API Level: Enqueues background job and returns 202 immediately
    - Background Job: Processes county + subcounty sequentially with synchronous company creation

    Args:
        subcounty_name (str): Subcounty name (uppercase)
        county_name (str): Optional county name (uppercase) for validation
        counties (list): List of all counties with nested subcounties
        data_source (str): Source of data (JSON or API)

    Returns:
        dict: API response with sync_session_id (202 status)
    """
    # Find the subcounty and its parent county
    parent_county = None
    subcounty_found = False
    subcounty_data = None

    for county in counties:
        for subcounty in county.get("subcounties", []):
            if subcounty.get("name") == subcounty_name:
                subcounty_found = True
                subcounty_data = subcounty
                parent_county = county

                # If county_name provided, validate it matches
                if county_name and county.get("name") != county_name:
                    return api_response(
                        success=False,
                        message=f"Subcounty '{subcounty_name}' belongs to '{county.get('name')}', not '{county_name}'",
                        status_code=400,
                    )
                break
        if subcounty_found:
            break

    if not subcounty_found:
        return api_response(
            success=False,
            message=f"Subcounty '{subcounty_name}' not found in {data_source}",
            status_code=404,
        )

    parent_county_name = parent_county.get("name")

    # Create a modified county data with only the requested subcounty
    single_subcounty_county_data = {
        "id": parent_county.get("id"),
        "name": parent_county_name,
        "subcounties": [subcounty_data],  # Only the requested subcounty
    }

    # Create a sync session ID for tracking
    sync_session_id = frappe.generate_hash(length=10)

    # Enqueue background job to process the county + subcounty (ALWAYS async at API level)
    frappe.enqueue(
        method="careverse_hq.api.default_setup_v2._process_county_batch",
        queue="long",
        timeout=1800,  # 30 minutes
        is_async=True,
        batch_index=0,
        total_batches=1,
        counties_batch=[
            single_subcounty_county_data
        ],  # Single county with single subcounty
        sync_session_id=sync_session_id,
    )

    return api_response(
        success=True,
        message=f"Subcounty '{subcounty_name}' sync queued (Parent: {parent_county_name}, Source: {data_source})",
        data={
            "subcounty_name": subcounty_name,
            "parent_county": parent_county_name,
            "data_source": data_source,
            "sync_session_id": sync_session_id,
        },
        status_code=202,  # ALWAYS 202 (async)
    )


# ============================================================================
# DATA LOADING - JSON with API Fallback
# ============================================================================


def _load_counties_with_fallback(force_api=False):
    """
    Load counties with subcounties from JSON file, fallback to API if needed.

    Args:
        force_api (bool): If True, skip JSON and use API directly

    Returns:
        tuple: (counties_list, data_source_string)
    """
    if force_api:
        frappe.log_error(
            title="County Sync - Forced API Mode",
            message="use_api_fallback=True, fetching from KMHFR API instead of JSON",
        )
        return _fetch_counties_from_api(), "KMHFR API (forced)"

    try:
        # Try loading from JSON first
        counties = _load_counties_from_json()
        frappe.log_error(
            title="County Sync - JSON Load Success",
            message=f"Successfully loaded {len(counties)} counties from JSON file",
        )
        return counties, "Local JSON File"

    except FileNotFoundError:
        frappe.log_error(
            title="County Sync - JSON Not Found, Using API Fallback",
            message="JSON file not found at healthpro_erp/data/kenya_counties_subcounties.json, falling back to KMHFR API",
        )
        return _fetch_counties_from_api(), "KMHFR API (JSON not found)"

    except Exception as e:
        frappe.log_error(
            title="County Sync - JSON Load Error, Using API Fallback",
            message=f"Error loading JSON: {str(e)}\n{frappe.get_traceback()}\nFalling back to KMHFR API",
        )
        return _fetch_counties_from_api(), "KMHFR API (JSON error)"


def _load_counties_from_json():
    """
    Load counties and subcounties from local JSON file.

    Returns:
        list: List of county dictionaries with nested subcounties

    Raises:
        FileNotFoundError: If JSON file doesn't exist
        ValueError: If JSON is invalid or missing required keys
    """
    # Get app path and build file path
    app_path = frappe.get_app_path("healthpro_erp")
    json_file_path = os.path.join(app_path, "data", "kenya_counties_subcounties.json")

    # Check if file exists
    if not os.path.exists(json_file_path):
        raise FileNotFoundError(f"JSON file not found: {json_file_path}")

    # Read and parse JSON
    with open(json_file_path, "r") as f:
        data = json.load(f)

    # Validate structure
    if "counties" not in data:
        raise ValueError("JSON file missing 'counties' key")

    counties = data["counties"]

    if not isinstance(counties, list):
        raise ValueError("'counties' must be a list")

    # Return counties list (each county already has subcounties nested)
    return counties


def _fetch_counties_from_api():
    """
    Fetch counties and subcounties from KMHFR API (fallback method).

    Returns:
        list: List of county dictionaries with nested subcounties
    """
    # Authenticate
    token = authenticate_kmhfr()
    if not token:
        frappe.log_error(
            title="County Sync - API Fallback Failed",
            message="Failed to authenticate with KMHFR API",
        )
        return []

    # Fetch counties
    counties_response = _fetch_counties(token)
    counties = counties_response.get("results", [])

    if not counties:
        frappe.log_error(
            title="County Sync - API Fallback Failed",
            message="No counties returned from KMHFR API",
        )
        return []

    # Fetch subcounties for each county and nest them
    counties_with_subcounties = []
    for county in counties:
        county_id = county.get("id")
        county_name = county.get("name", "").upper()

        # Fetch subcounties for this county
        subcounties_response = _fetch_subcounties(county_id, token)
        subcounties = subcounties_response.get("results", [])

        # Convert subcounty names to uppercase and restructure
        formatted_subcounties = [
            {"id": sc.get("id"), "name": sc.get("name", "").upper()}
            for sc in subcounties
        ]

        # Add county with nested subcounties
        counties_with_subcounties.append(
            {"id": county_id, "name": county_name, "subcounties": formatted_subcounties}
        )

    return counties_with_subcounties


# ============================================================================
# BACKGROUND WORKER - Process County Batch
# ============================================================================


def _process_county_batch(batch_index, total_batches, counties_batch, sync_session_id):
    """
    Background worker: Process a batch of counties (V2 - uses pre-loaded subcounty data)
    Each worker runs independently in parallel

    Args:
        batch_index (int): Index of this batch (0-based)
        total_batches (int): Total number of batches
        counties_batch (list): List of county dictionaries with nested subcounties
        sync_session_id (str): Unique session ID for this sync run
    """
    report = {
        "sync_session_id": sync_session_id,
        "batch_index": batch_index + 1,
        "total_batches": total_batches,
        "counties_in_batch": len(counties_batch),
        "counties_created": 0,
        "counties_skipped": 0,
        "counties_failed": 0,
        "subcounties_created": 0,
        "subcounties_skipped": 0,
        "subcounties_failed": 0,
        "skipped": [],
        "errors": [],
    }

    try:
        # V2: No token needed - subcounties already in county data
        # Process each county in this batch
        for county in counties_batch:
            _process_single_county(county, report)

        # Log this batch's report
        frappe.log_error(
            title=f"County Sync Batch {batch_index + 1}/{total_batches} - Session {sync_session_id}",
            message=json.dumps(report, indent=2),
        )

    except Exception as e:
        frappe.log_error(
            title=f"County Sync Batch {batch_index + 1} Failed - Session {sync_session_id}",
            message=f"Batch processing error: {str(e)}\n{frappe.get_traceback()}",
        )


# ============================================================================
# HELPER FUNCTIONS - KMHFR API Integration
# ============================================================================


@frappe.whitelist()
def authenticate_kmhfr():
    """
    Authenticate with KMHFR API and get access token

    Returns:
        str: Access token or None if authentication fails
    """
    try:
        settings = frappe.get_single("HealthPro Backend Settings")
        base_url = (
            settings.get("kmhfr_api_base_url") or "https://api.kmhfr.health.go.ke"
        )
        username = settings.get("kmhfr_auth_username")
        password = settings.get_password("kmhfr_auth_password")
        kmhfr_basic_auth_username = settings.get("kmhfr_basic_auth_username")
        kmhfr_basic_auth_password = settings.get_password("kmhfr_basic_auth_password")

        if not username or not password:
            frappe.log_error(
                title="KMHFR Auth Error",
                message="KMHFR username or password not configured in HealthPro Backend Settings",
            )
            return None

        if not kmhfr_basic_auth_username or not kmhfr_basic_auth_password:
            frappe.log_error(
                title="KMHFR Auth Error",
                message="KMHFR Basic Auth credentials not configured in HealthPro Backend Settings",
            )
            return None

        url = f"{base_url}/o/token/"
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
        }

        # Add Authorization header using Basic Auth
        auth = (kmhfr_basic_auth_username, kmhfr_basic_auth_password)

        data = {
            "grant_type": "password",
            "username": username,
            "password": password,
            "scope": "read",
        }

        response = requests.post(url, headers=headers, data=data, timeout=30, auth=auth)
        if response.status_code != 200:
            frappe.log_error(
                title="KMHFR Auth HTTP Error",
                message=f"HTTP {response.status_code} error during authentication\nURL: {url}\nBasic Auth Username: {kmhfr_basic_auth_username}\nRequest Headers: {headers}\nRequest Data: {data}\nResponse: {response.text}",
            )
            return None

        response_data = response.json()

        access_token = response_data.get("access_token")

        if not access_token:
            frappe.log_error(
                title="KMHFR Auth Error",
                message=f"No access token in response: {json.dumps(response_data, indent=2)}",
            )
            return None

        return access_token

    except requests.exceptions.HTTPError as http_err:
        frappe.log_error(
            title="KMHFR Auth HTTP Error",
            message=f"HTTP error during authentication: {http_err}\nStatus Code: {http_err.response.status_code if http_err.response else 'N/A'}\nResponse: {http_err.response.text if http_err.response else 'N/A'}",
        )
        return None

    except requests.exceptions.Timeout:
        frappe.log_error(
            title="KMHFR Auth Timeout",
            message="Authentication request timed out after 30 seconds",
        )
        return None

    except Exception as e:
        frappe.log_error(
            title="KMHFR Auth Error",
            message=f"Unexpected error during authentication: {str(e)}\n{frappe.get_traceback()}",
        )
        return None


def _fetch_counties(token):
    """
    Fetch all counties from KMHFR API

    Args:
        token (str): Access token for KMHFR API

    Returns:
        dict: Response data with counties in 'results' array
    """
    try:
        settings = frappe.get_single("HealthPro Backend Settings")
        base_url = (
            settings.get("kmhfr_api_base_url") or "https://api.kmhfr.health.go.ke"
        )

        url = f"{base_url}/api/common/counties"
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}

        params = {"page_size": 50, "format": "json"}

        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        return response.json()

    except Exception as e:
        frappe.log_error(
            title="KMHFR Fetch Counties Error",
            message=f"Error fetching counties: {str(e)}\n{frappe.get_traceback()}",
        )
        return {"results": []}


def _fetch_subcounties(county_id, token, retry_count=0):
    """
    Fetch sub-counties for a specific county from KMHFR API

    Args:
        county_id (str): County UUID
        token (str): Access token for KMHFR API
        retry_count (int): Number of retries attempted

    Returns:
        dict: Response data with sub-counties in 'results' array
    """
    try:
        settings = frappe.get_single("HealthPro Backend Settings")
        base_url = (
            settings.get("kmhfr_api_base_url") or "https://api.kmhfr.health.go.ke"
        )

        url = f"{base_url}/api/common/sub_counties"
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}

        params = {"page_size": 400, "format": "json", "county": county_id}

        response = requests.get(url, headers=headers, params=params, timeout=30)

        # Handle token expiry (401 or 500)
        if response.status_code in [401, 500] and retry_count == 0:
            # Refresh token and retry once
            new_token = authenticate_kmhfr()
            if new_token:
                return _fetch_subcounties(county_id, new_token, retry_count=1)

        response.raise_for_status()
        return response.json()

    except Exception as e:
        frappe.log_error(
            title=f"KMHFR Fetch Sub-Counties Error - County {county_id}",
            message=f"Error fetching sub-counties: {str(e)}\n{frappe.get_traceback()}",
        )
        return {"results": []}


# ============================================================================
# HELPER FUNCTIONS - County Processing
# ============================================================================


def _process_single_county(county, report):
    """
    Process a single county: Create Company, Healthcare Org, and all sub-counties (V2)

    Args:
        county (dict): County data with nested subcounties
        report (dict): Report dictionary to update with results
    """
    county_name = county.get("name")
    county_id = county.get("id")
    subcounties = county.get("subcounties", [])

    # Convert county name to uppercase (should already be uppercase from JSON/API)
    if county_name:
        county_name = county_name.upper()

    if not county_name or not county_id:
        report["counties_failed"] += 1
        report["errors"].append(
            {
                "type": "County",
                "name": county_name or "Unknown",
                "error": "Missing county name or ID",
            }
        )
        return

    try:
        # Phase 1: Create Company + Healthcare Organization
        company_created = _create_county_company(county_name, report)
        healthcare_org_created = _create_county_healthcare_org(county_name, report)

        if company_created and healthcare_org_created:
            report["counties_created"] += 1

            # Phase 2: Process sub-counties (already in county data, no API fetch)
            _process_county_subcounties(county_name, subcounties, report)
        elif not company_created and not healthcare_org_created:
            # Both already exist - still process sub-counties
            _process_county_subcounties(county_name, subcounties, report)

    except Exception as e:
        report["counties_failed"] += 1
        report["errors"].append(
            {"type": "County", "name": county_name, "error": str(e)}
        )
        frappe.log_error(
            title=f"County Processing Error: {county_name}",
            message=f"{str(e)}\n{frappe.get_traceback()}",
        )


def _process_county_subcounties(county_name, subcounties, report):
    """
    Process sub-counties for a specific county (V2 - uses pre-loaded data)

    Args:
        county_name (str): County name
        subcounties (list): List of subcounty dictionaries (already loaded)
        report (dict): Report dictionary to update with results
    """
    try:
        # V2: subcounties already provided - no API fetch needed

        # Get the Healthcare Organization for this county
        healthcare_org_name = frappe.db.get_value(
            "Healthcare Organization", {"organization_name": county_name}, "name"
        )

        if not healthcare_org_name:
            frappe.log_error(
                title=f"Sub-County Processing Error - County {county_name}",
                message=f"Healthcare Organization not found for county {county_name}",
            )
            return

        # Create Healthcare Organization Region for each sub-county
        for subcounty in subcounties:
            subcounty_name = subcounty.get("name")
            if subcounty_name:
                # Convert sub-county name to uppercase (should already be uppercase)
                subcounty_name = subcounty_name.upper()
                _create_subcounty_region(subcounty_name, healthcare_org_name, report)

    except Exception as e:
        frappe.log_error(
            title=f"Sub-County Processing Error - County {county_name}",
            message=f"Error processing sub-counties: {str(e)}\n{frappe.get_traceback()}",
        )


# ============================================================================
# HELPER FUNCTIONS - Record Creation
# ============================================================================


def _generate_county_company_abbreviation(county_name):
    """
    Generate unique abbreviation for county company.
    Format: First 3-5 letters of county name (uppercase)
    Example: "NAIROBI" → "NAI", "TANA RIVER" → "TANRI"
    If duplicate, adds incremental suffix: "NAI-001", "NAI-002", etc.

    Args:
        county_name (str): Name of the county

    Returns:
        str: Unique abbreviation
    """
    # Remove common words and clean the name
    county_clean = county_name.strip().upper()

    # For multi-word counties, take first 2-3 letters of each word
    words = county_clean.split()
    if len(words) > 1:
        # Multi-word: Take first 2-3 letters of each word
        # "TANA RIVER" → "TANRI" (3 + 2)
        # "WEST POKOT" → "WESPOK" (3 + 3)
        if len(words) == 2:
            base_abbr = f"{words[0][:3]}{words[1][:2]}"
        else:
            # 3+ words: Take first 2 letters of each
            base_abbr = "".join(word[:2] for word in words)
    else:
        # Single word: Take first 3-5 letters
        # "NAIROBI" → "NAI"
        # "MOMBASA" → "MOM"
        base_abbr = county_clean[:3]

    # Ensure it's uppercase and max 5 characters for base
    base_abbr = base_abbr[:5].upper()

    # Check if base abbreviation is available
    if not frappe.db.exists("Company", {"abbr": base_abbr}):
        return base_abbr

    # If duplicate, add incremental suffix: -001, -002, etc.
    counter = 1
    while True:
        new_abbr = f"{base_abbr}-{counter:03d}"  # Format as 001, 002, etc.
        if not frappe.db.exists("Company", {"abbr": new_abbr}):
            return new_abbr
        counter += 1

        # Safety check to prevent infinite loop
        if counter > 999:
            frappe.throw(f"Unable to generate unique abbreviation for {county_name}")


def _create_county_company(county_name, report):
    """
    Create Company record for a county

    Args:
        county_name (str): Name of the county
        report (dict): Report dictionary to update with results

    Returns:
        bool: True if created, False if skipped (already exists)
    """
    try:
        # Check if Company already exists
        if frappe.db.exists("Company", {"company_name": county_name}):
            # Update existing company to ensure it's marked as group company
            company_name = frappe.db.get_value(
                "Company", {"company_name": county_name}, "name"
            )

            # Check if it's already a group company
            is_group = frappe.db.get_value("Company", company_name, "is_group")

            if not is_group:
                # Update to make it a group company (required for child region companies)
                frappe.db.set_value("Company", company_name, "is_group", 1)
                frappe.db.commit()

                frappe.log_error(
                    title=f"Company Updated - {county_name}",
                    message=f"Updated existing company '{company_name}' to be a group company (is_group=1)",
                )

            report["counties_skipped"] += 1
            report["skipped"].append(
                {"type": "Company", "name": county_name, "reason": "Already exists"}
            )
            return False

        # Generate unique abbreviation
        abbr = _generate_county_company_abbreviation(county_name)

        # Create Company
        company_doc = frappe.get_doc(
            {
                "doctype": "Company",
                "company_name": county_name,
                "abbr": abbr,
                "country": "Kenya",
                "default_currency": "KES",
                "is_group": 1,
            }
        )
        company_doc.insert(ignore_permissions=True)
        frappe.db.commit()

        frappe.log_error(
            title=f"County Company Created - {county_name}",
            message=f"✅ SUCCESS: Company '{county_name}' created with abbreviation '{abbr}'",
        )

        return True

    except Exception as e:
        report["counties_failed"] += 1
        report["errors"].append(
            {"type": "Company", "name": county_name, "error": str(e)}
        )
        frappe.log_error(
            title=f"Company Creation Error: {county_name}",
            message=f"Error creating Company: {str(e)}\n{frappe.get_traceback()}",
        )
        return False


def _create_county_healthcare_org(county_name, report):
    """
    Create Healthcare Organization record for a county

    Args:
        county_name (str): Name of the county
        report (dict): Report dictionary to update with results

    Returns:
        bool: True if created, False if skipped (already exists)
    """
    try:
        # Check if Healthcare Organization already exists
        if frappe.db.exists(
            "Healthcare Organization", {"organization_name": county_name}
        ):
            report["counties_skipped"] += 1
            report["skipped"].append(
                {
                    "type": "Healthcare Organization",
                    "name": county_name,
                    "reason": "Already exists",
                }
            )
            return False

        # Get the Company name to link
        company_name = frappe.db.get_value(
            "Company", {"company_name": county_name}, "name"
        )

        if not company_name:
            report["counties_failed"] += 1
            report["errors"].append(
                {
                    "type": "Healthcare Organization",
                    "name": county_name,
                    "error": "Company not found for linking",
                }
            )
            return False

        # Create Healthcare Organization
        healthcare_org_doc = frappe.get_doc(
            {
                "doctype": "Healthcare Organization",
                "organization_name": county_name,
                "company": company_name,
            }
        )
        healthcare_org_doc.insert(ignore_permissions=True)
        frappe.db.commit()

        return True

    except Exception as e:
        report["counties_failed"] += 1
        report["errors"].append(
            {"type": "Healthcare Organization", "name": county_name, "error": str(e)}
        )
        frappe.log_error(
            title=f"Healthcare Organization Creation Error: {county_name}",
            message=f"Error creating Healthcare Organization: {str(e)}\n{frappe.get_traceback()}",
        )
        return False


def _create_region_company_sync(region_name, parent_org_name, report):
    """
    Create company for a region synchronously (same worker, no background job).
    This eliminates lock contention by processing regions sequentially.

    Based on logic from user_registration.create_region_companies_async() but:
    - Runs synchronously (not in background job)
    - Commits immediately after creation
    - Updates report counters

    Args:
        region_name (str): Healthcare Organization Region name
        parent_org_name (str): Parent Healthcare Organization name
        report (dict): Report dictionary to update with results
    """
    try:
        # Get the region document
        region_doc = frappe.get_doc("Healthcare Organization Region", region_name)
        parent_org = frappe.get_doc("Healthcare Organization", parent_org_name)

        if not parent_org.company:
            frappe.log_error(
                title=f"Region Company Creation Error - {region_name}",
                message=f"Parent organization '{parent_org.name}' has no company. Cannot create region company.",
            )
            return

        parent_company = frappe.get_doc("Company", parent_org.company)

        # Create company name
        company_name = f"{parent_company.company_name} - {region_doc.region_name}"

        # Check if company already exists
        if frappe.db.exists("Company", company_name):
            # Link existing company to region
            frappe.db.set_value(
                "Healthcare Organization Region",
                region_name,
                "company",
                company_name,
            )
            frappe.db.commit()
            return

        # Generate abbreviation
        from healthpro_erp.healthpro_erp.doctype.healthcare_organization_region.healthcare_organization_region import (
            _generate_region_company_abbreviation,
        )

        abbr = _generate_region_company_abbreviation(
            parent_company.company_name, region_doc.region_name
        )

        # Create the company
        new_company = frappe.get_doc(
            {
                "doctype": "Company",
                "company_name": company_name,
                "abbr": abbr,
                "country": "Kenya",
                "default_currency": "KES",
                "parent_company": parent_org.company,
                "custom_company_type": "Region",
            }
        )

        new_company.insert(ignore_permissions=True)
        frappe.db.commit()

        # Update region with company name
        frappe.db.set_value(
            "Healthcare Organization Region",
            region_name,
            "company",
            new_company.name,
        )
        frappe.db.commit()

        frappe.log_error(
            title=f"Region Company Created (Sync) - {region_name}",
            message=f"✅ SUCCESS: Company '{company_name}' created synchronously and linked to region '{region_name}'",
        )

    except Exception as e:
        frappe.log_error(
            title=f"Region Company Creation Error (Sync) - {region_name}",
            message=f"Failed to create company for region '{region_name}': {str(e)}\n{frappe.get_traceback()}",
        )


def _create_subcounty_region(subcounty_name, parent_org_name, report):
    """
    Create Healthcare Organization Region record for a sub-county (V2 - with synchronous company creation)

    Args:
        subcounty_name (str): Name of the sub-county
        parent_org_name (str): Name of the parent Healthcare Organization
        report (dict): Report dictionary to update with results

    Returns:
        bool: True if created, False if skipped (already exists)
    """
    try:
        # Check if Healthcare Organization Region already exists
        if frappe.db.exists(
            "Healthcare Organization Region", {"region_name": subcounty_name}
        ):
            report["subcounties_skipped"] += 1
            report["skipped"].append(
                {
                    "type": "Healthcare Organization Region",
                    "name": subcounty_name,
                    "reason": "Already exists",
                }
            )
            return False

        # V2: Set flag to skip async company creation in after_insert hook
        frappe.flags.skip_region_company_creation = True

        try:
            # Create Healthcare Organization Region (after_insert hook will skip enqueueing)
            region_doc = frappe.get_doc(
                {
                    "doctype": "Healthcare Organization Region",
                    "region_name": subcounty_name,
                    "parent_organization": parent_org_name,
                }
            )
            region_doc.insert(ignore_permissions=True)
            frappe.db.commit()

            report["subcounties_created"] += 1

            # V2: Create company synchronously (in the same worker, no background job)
            _create_region_company_sync(region_doc.name, parent_org_name, report)

            return True

        finally:
            # Always clear flag (even if error occurs)
            frappe.flags.skip_region_company_creation = False

    except Exception as e:
        report["subcounties_failed"] += 1
        report["errors"].append(
            {
                "type": "Healthcare Organization Region",
                "name": subcounty_name,
                "error": str(e),
            }
        )
        frappe.log_error(
            title=f"Healthcare Organization Region Creation Error: {subcounty_name}",
            message=f"Error creating Region: {str(e)}\n{frappe.get_traceback()}",
        )
        return False
