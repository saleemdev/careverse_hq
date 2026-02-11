"""
Default Setup APIs for HealthPro ERP
Handles one-time setup operations like syncing counties and sub-counties from KMHFR
"""

import frappe
import requests
import json
from datetime import datetime
from .utils import api_response


# ============================================================================
# PUBLIC API - County and Sub-County Sync
# ============================================================================


@frappe.whitelist()
def sync_counties_and_subcounties(batch_size=5):
    """
    Fetch counties from KMHFR API and enqueue parallel batch jobs to create
    Company and Healthcare Organization records for counties and sub-counties.

    Args:
        batch_size (int): Number of counties to process per batch (default: 5)

    Returns:
        dict: API response with sync session details and 202 status code
    """
    try:
        # Convert batch_size to int if passed as string
        batch_size = int(batch_size)

        # Authenticate and fetch all counties (fast, just API call)
        token = authenticate_kmhfr()
        if not token:
            return api_response(
                success=False,
                message="Failed to authenticate with KMHFR API. Please check HealthPro Backend Settings for KMHFR credentials and review Error Log for details.",
                status_code=500,
            )

        counties_response = _fetch_counties(token)
        counties = counties_response.get("results", [])

        if not counties:
            return api_response(
                success=False,
                message="No counties fetched from KMHFR API",
                status_code=404,
            )

        # Split into batches
        batches = [
            counties[i : i + batch_size] for i in range(0, len(counties), batch_size)
        ]

        # Create a sync session ID for tracking
        sync_session_id = frappe.generate_hash(length=10)

        # Enqueue a job for each batch
        for batch_index, batch in enumerate(batches):
            frappe.enqueue(
                method="careverse_hq.api.default_setup._process_county_batch",
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
            message=f"County sync queued: {len(batches)} batches processing {len(counties)} counties",
            data={
                "sync_session_id": sync_session_id,
                "total_counties": len(counties),
                "total_batches": len(batches),
                "batch_size": batch_size,
            },
            status_code=202,
        )

    except Exception as e:
        frappe.log_error(
            title="County Sync Queue Error",
            message=f"Failed to queue county sync: {str(e)}\n{frappe.get_traceback()}",
        )
        return api_response(
            success=False, message=f"Failed to queue sync: {str(e)}", status_code=500
        )


# ============================================================================
# BACKGROUND WORKER - Process County Batch
# ============================================================================


def _process_county_batch(batch_index, total_batches, counties_batch, sync_session_id):
    """
    Background worker: Process a batch of counties
    Each worker runs independently in parallel

    Args:
        batch_index (int): Index of this batch (0-based)
        total_batches (int): Total number of batches
        counties_batch (list): List of county dictionaries to process
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
        # Get fresh token for this worker
        token = authenticate_kmhfr()
        if not token:
            frappe.log_error(
                title=f"County Sync Batch {batch_index + 1}/{total_batches} - Auth Failed",
                message=f"Failed to authenticate with KMHFR API for batch {batch_index + 1}",
            )
            return

        # Process each county in this batch
        for county in counties_batch:
            _process_single_county(county, token, report)

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


def _process_single_county(county, token, report):
    """
    Process a single county: Create Company, Healthcare Org, and all sub-counties

    Args:
        county (dict): County data from KMHFR API
        token (str): Access token for KMHFR API
        report (dict): Report dictionary to update with results
    """
    county_name = county.get("name")
    county_id = county.get("id")

    # Convert county name to uppercase
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

            # Phase 2: Fetch and create sub-counties for this county
            _process_county_subcounties(county_id, county_name, token, report)
        elif not company_created and not healthcare_org_created:
            # Both already exist - still process sub-counties
            _process_county_subcounties(county_id, county_name, token, report)

    except Exception as e:
        report["counties_failed"] += 1
        report["errors"].append(
            {"type": "County", "name": county_name, "error": str(e)}
        )
        frappe.log_error(
            title=f"County Processing Error: {county_name}",
            message=f"{str(e)}\n{frappe.get_traceback()}",
        )


def _process_county_subcounties(county_id, county_name, token, report):
    """
    Fetch and create sub-counties for a specific county

    Args:
        county_id (str): County UUID
        county_name (str): County name
        token (str): Access token for KMHFR API
        report (dict): Report dictionary to update with results
    """
    try:
        # Fetch sub-counties for this county
        subcounties_response = _fetch_subcounties(county_id, token)
        subcounties = subcounties_response.get("results", [])

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
                # Convert sub-county name to uppercase
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


def _create_subcounty_region(subcounty_name, parent_org_name, report):
    """
    Create Healthcare Organization Region record for a sub-county

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

        # Create Healthcare Organization Region
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
        return True

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
