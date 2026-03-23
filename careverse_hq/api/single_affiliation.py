"""
Single Facility Affiliation API

Provides endpoints for searching health professionals (local DB + HWR)
and creating individual facility affiliations from the admin panel.

Security model:
- @frappe.whitelist() enforces session auth (cookie-based, same as all admin APIs)
- frappe.get_list() respects User Permissions (facility-scoped)
- Facility Affiliation doc.save() enforces DocType-level permissions
- HWR data is cached server-side — never exposed to the client
"""

import frappe
from frappe import _
from frappe.utils import getdate
from .utils import api_response
from healthpro_erp.api.utils import fetch_hwr_practitioner


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

@frappe.whitelist()
def search_health_professional(search_term=None, search_mode="auto", search_by="national_id"):
    """
    Search for health professionals with optional source selection.
    - auto: local first, then HWR fallback
    - local: local only
    - hwr: HWR only
    - search_by: national_id | alien_id | registration_number

    Returns:
        api_response with results list, source indicator.
        HWR results include a server-side `cache_key` instead of raw HWR data.
    """
    if not search_term or not search_term.strip():
        return api_response(
            success=False,
            message="Search term is required",
            status_code=400,
        )

    search_term = search_term.strip()
    mode = (search_mode or "auto").strip().lower()
    search_key = (search_by or "national_id").strip().lower()
    if mode not in {"auto", "local", "hwr"}:
        return api_response(
            success=False,
            message="Invalid search_mode. Allowed values: auto, local, hwr",
            status_code=400,
        )
    if search_key not in {"national_id", "alien_id", "registration_number"}:
        return api_response(
            success=False,
            message="Invalid search_by. Allowed values: national_id, alien_id, registration_number",
            status_code=400,
        )

    # Sanitize LIKE wildcards to prevent unintended pattern matching
    safe_term = search_term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")

    # Step 1: Search local Health Professional doctype (auto/local modes)
    if mode in {"auto", "local"}:
        local_results = _search_local_health_professionals(safe_term, search_key)
        if local_results:
            return api_response(
                success=True,
                data={"results": local_results, "source": "local"},
                status_code=200,
            )

    # Step 2: HWR lookup (auto/hwr modes)
    hwr_error = None
    if mode in {"auto", "hwr"}:
        hwr_results, hwr_error = _search_hwr(search_term, search_key)

        if hwr_results:
            # Cross-check: if HWR result already exists locally, return as local
            cross_checked = _cross_check_hwr_with_local(hwr_results)
            if cross_checked["local_matches"]:
                return api_response(
                    success=True,
                    data={
                        "results": cross_checked["local_matches"],
                        "source": "local",
                    },
                    status_code=200,
                )

            return api_response(
                success=True,
                data={"results": cross_checked["hwr_results"], "source": "hwr"},
                status_code=200,
            )

    if hwr_error:
        return api_response(
            success=False,
            message=f"HWR lookup failed: {hwr_error}",
            status_code=502,
        )

    by_label = {
        "national_id": "National ID",
        "alien_id": "Alien ID",
        "registration_number": "Registration Number",
    }.get(search_key, "selected identifier")
    if mode == "local":
        no_results_message = f"No health professionals found in the local database for {by_label} '{search_term}'."
    elif mode == "hwr":
        no_results_message = f"No health professionals found in Health Worker Registry for {by_label} '{search_term}'."
    else:
        no_results_message = f"No health professionals found for {by_label} '{search_term}'."

    return api_response(
        success=True,
        data={"results": [], "source": "none"},
        message=no_results_message,
        status_code=200,
    )


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

@frappe.whitelist()
def create_single_affiliation(**kwargs):
    """
    Create a single facility affiliation.

    Two paths:
    - Existing HP (hp_name provided): creates affiliation record only
    - New HP from HWR (hwr_cache_key provided): creates HP + affiliation

    Args:
        hp_name: Name of existing Health Professional doc (for local HP)
        hwr_cache_key: Server-side cache key for HWR data (for new HP from HWR)
        employment_details: Dict with fid, employment_type, designation, start_date, end_date
    """
    hp_name = kwargs.get("hp_name")
    hwr_cache_key = kwargs.get("hwr_cache_key")
    employment_details = dict(kwargs.get("employment_details") or {})

    if not employment_details:
        return api_response(
            success=False,
            message="Employment details are required",
            status_code=400,
        )

    required_fields = ["fid", "employment_type", "designation", "start_date"]
    missing = [f for f in required_fields if not employment_details.get(f)]
    if missing:
        return api_response(
            success=False,
            message=f"Missing required fields: {', '.join(missing)}",
            status_code=400,
        )

    if not hp_name and not hwr_cache_key:
        return api_response(
            success=False,
            message="Either hp_name or hwr_cache_key is required",
            status_code=400,
        )

    # Date integrity check
    start_date_raw = employment_details.get("start_date")
    end_date_raw = employment_details.get("end_date")
    try:
        start_date = getdate(start_date_raw)
    except Exception:
        return api_response(
            success=False,
            message="Invalid start_date format. Expected YYYY-MM-DD.",
            status_code=400,
        )

    if end_date_raw:
        try:
            end_date = getdate(end_date_raw)
        except Exception:
            return api_response(
                success=False,
                message="Invalid end_date format. Expected YYYY-MM-DD.",
                status_code=400,
            )

        if end_date < start_date:
            return api_response(
                success=False,
                message="End date cannot be before start date.",
                status_code=400,
            )

    try:
        if hp_name:
            return _create_affiliation_for_existing_hp(hp_name, employment_details)
        else:
            return _create_affiliation_for_hwr_hp(hwr_cache_key, employment_details)
    except Exception as e:
        frappe.log_error(
            "create_single_affiliation failed", frappe.get_traceback()
        )
        return api_response(
            success=False,
            message=f"Failed to create affiliation: {str(e)}",
            status_code=500,
        )


# ---------------------------------------------------------------------------
# Internal: Local search
# ---------------------------------------------------------------------------

def _search_local_health_professionals(safe_term, search_by, limit=20):
    """Search local Health Professional doctype by selected identifier type."""
    fields = [
        "name",
        "full_name",
        "registration_number",
        "external_reference_id",
        "professional_cadre",
        "professional_specialty",
        "gender",
        "official_phone",
        "official_email",
        "status",
    ]

    if search_by == "registration_number":
        results = frappe.get_list(
            "Health Professional",
            or_filters=[
                ["registration_number", "like", f"%{safe_term}%"],
                ["external_reference_id", "like", f"%{safe_term}%"],
            ],
            fields=fields,
            limit_page_length=limit,
            order_by="full_name asc",
        )
    else:
        id_type_candidates = _get_local_id_type_candidates(search_by)
        results = frappe.get_list(
            "Health Professional",
            filters=[
                ["identification_number", "like", f"%{safe_term}%"],
                ["identification_type", "in", id_type_candidates],
            ],
            fields=fields,
            limit_page_length=limit,
            order_by="full_name asc",
        )

    return [
        {
            "name": r.name,
            "full_name": r.full_name,
            "registration_number": r.registration_number,
            "external_reference_id": r.external_reference_id,
            "cadre": r.professional_cadre,
            "specialty": r.professional_specialty,
            "gender": r.gender,
            "phone": r.official_phone,
            "email": r.official_email,
            "status": r.status,
            "source": "local",
        }
        for r in results
    ]


# ---------------------------------------------------------------------------
# Internal: HWR search
# ---------------------------------------------------------------------------

_HWR_CACHE_TTL = 600  # 10 minutes


def _search_hwr(search_term, search_by):
    """
    Search HWR using the search term.
    Determines the most likely lookup strategy based on the input pattern.
    """
    if search_by == "registration_number":
        result, error = _try_hwr_by_registration(search_term)
    elif search_by == "alien_id":
        result, error = _try_hwr_by_identification_types(
            search_term, ["Alien ID", "Passport"]
        )
    else:
        result, error = _try_hwr_by_identification_types(search_term, ["National ID"])

    if result:
        return [result], None
    return [], error


def _try_hwr_by_identification_types(search_term, identification_types):
    """Try HWR lookup as identification_number for specific identification types."""
    errors = []
    for id_type in identification_types:
        try:
            hwr_data, error = fetch_hwr_practitioner(
                identification_type=id_type,
                identification_number=search_term,
            )
            if hwr_data and not error and hwr_data.get("status") != "error":
                return _normalize_and_cache_hwr(hwr_data), None
            if error and error.get("message"):
                errors.append(f"{id_type}: {error.get('message')}")
        except Exception as exc:
            errors.append(f"{id_type}: {str(exc)}")
            continue
    return None, "; ".join(errors) if errors else None


def _try_hwr_by_registration(search_term):
    """
    Try HWR lookup using registry identifiers.
    Uses the same fetch_hwr_practitioner contract as HP sync flow.
    """
    errors = []
    lookup_strategies = [
        # Match HP sync behavior: prefer regulator registration_number first.
        ("registration_number", {"registration_number": search_term}),
        ("id", {"id": search_term}),
    ]

    for label, params in lookup_strategies:
        try:
            hwr_data, error = fetch_hwr_practitioner(**params)
            if hwr_data and not error and hwr_data.get("status") != "error":
                return _normalize_and_cache_hwr(hwr_data), None
            if error and error.get("message"):
                error_message = error.get("message")
                if "Use registration_number parameter to enable search from regulator" in error_message:
                    error_message = (
                        "Regulator registration lookup is not supported by this endpoint. "
                        "Use National ID or Alien ID, or provide a practitioner ID (e.g. PUID-...)."
                    )
                errors.append(f"{label}: {error_message}")
        except Exception as exc:
            errors.append(f"{label}: {str(exc)}")

    return None, "; ".join(errors) if errors else None


def _get_local_id_type_candidates(search_by):
    """Map UI search identifier to possible local identification_type values."""
    if search_by == "national_id":
        return ["National ID", "national_id", "NATIONAL ID", "National Id"]
    if search_by == "alien_id":
        return ["Alien ID", "Alien Id", "ALIEN ID", "Passport", "passport"]
    return []


def _get_onboarding_helpers():
    """
    Import onboarding helpers lazily so search APIs are not blocked by
    unrelated onboarding import issues.
    """
    from .health_worker_onboarding import (
        _create_facility_affiliation_record_internal,
        append_professional_affiliation_record,
    )

    return _create_facility_affiliation_record_internal, append_professional_affiliation_record


def _normalize_and_cache_hwr(hwr_data):
    """
    Normalize HWR response for the frontend and cache full data server-side.
    The client receives a cache_key instead of raw HWR data.
    """
    membership = hwr_data.get("membership", {})
    contacts = hwr_data.get("contacts", {})

    # Cache full HWR data server-side
    cache_key = f"hwr_single_aff:{frappe.generate_hash(length=20)}"
    frappe.cache.set_value(cache_key, hwr_data, expires_in_sec=_HWR_CACHE_TTL)

    return {
        "full_name": membership.get("full_name", ""),
        "registration_number": membership.get("id", ""),
        "external_reference_id": membership.get("external_reference_id", ""),
        "cadre": membership.get("licensing_body", ""),
        "specialty": membership.get("specialty", ""),
        "gender": membership.get("gender", ""),
        "phone": _mask_phone(contacts.get("phone", "")),
        "email": _mask_email(contacts.get("email", "")),
        "status": membership.get("status", ""),
        "source": "hwr",
        "cache_key": cache_key,  # Client uses this to reference the HWR data
    }


def _mask_phone(phone):
    """Mask phone number for display, e.g. 0721***468"""
    if not phone or len(phone) < 6:
        return phone or ""
    return phone[:4] + "***" + phone[-3:]


def _mask_email(email):
    """Mask email for display, e.g. wa***@yahoo.com"""
    if not email or "@" not in email:
        return email or ""
    local, domain = email.split("@", 1)
    if len(local) <= 2:
        return f"{local}***@{domain}"
    return f"{local[:2]}***@{domain}"


# ---------------------------------------------------------------------------
# Internal: Cross-check HWR vs local
# ---------------------------------------------------------------------------

_HP_FIELDS = [
    "name", "full_name", "registration_number",
    "external_reference_id", "professional_cadre",
    "professional_specialty", "gender",
    "official_phone", "official_email", "status",
]


def _cross_check_hwr_with_local(hwr_results):
    """
    Check if HWR results already exist as local Health Professionals.
    Returns dict with local_matches and remaining hwr_results.
    """
    local_matches = []
    remaining_hwr = []

    for result in hwr_results:
        reg_number = result.get("registration_number", "")
        ext_ref = result.get("external_reference_id", "")

        local_hp = None
        if reg_number:
            local_hp = frappe.get_list(
                "Health Professional",
                filters={"registration_number": reg_number},
                fields=_HP_FIELDS,
                limit_page_length=1,
            )

        if not local_hp and ext_ref:
            local_hp = frappe.get_list(
                "Health Professional",
                filters={"external_reference_id": ext_ref},
                fields=_HP_FIELDS,
                limit_page_length=1,
            )

        if local_hp:
            hp = local_hp[0]
            local_matches.append({
                "name": hp.name,
                "full_name": hp.full_name,
                "registration_number": hp.registration_number,
                "external_reference_id": hp.external_reference_id,
                "cadre": hp.professional_cadre,
                "specialty": hp.professional_specialty,
                "gender": hp.gender,
                "phone": hp.official_phone,
                "email": hp.official_email,
                "status": hp.status,
                "source": "local",
            })
        else:
            remaining_hwr.append(result)

    return {"local_matches": local_matches, "hwr_results": remaining_hwr}


# ---------------------------------------------------------------------------
# Internal: Creation paths
# ---------------------------------------------------------------------------

def _create_affiliation_for_existing_hp(hp_name, employment_details):
    """Create affiliation for a Health Professional that already exists locally."""
    (
        create_facility_affiliation_record_internal,
        append_prof_affiliation_record,
    ) = _get_onboarding_helpers()

    if not frappe.db.exists("Health Professional", hp_name):
        return api_response(
            success=False,
            message=f"Health Professional '{hp_name}' not found",
            status_code=404,
        )

    # _create_facility_affiliation_record_internal handles:
    #   - duplicate affiliation checks (same HP + facility)
    #   - full-time conflict detection
    #   - designation auto-creation
    #   - doc.save() enforces User Permissions
    result = create_facility_affiliation_record_internal(
        hp_name, employment_details
    )

    if isinstance(result, dict) and result.get("error"):
        return api_response(
            success=False,
            message=result.get("message", "Failed to create affiliation"),
            status_code=400,
        )

    affiliation_name = result.get("name") if isinstance(result, dict) else result

    # Append to HP's professional_affiliations child table
    try:
        append_prof_affiliation_record(
            hp_name, employment_details, affiliation_name
        )
    except Exception:
        frappe.log_error(
            "append_professional_affiliation_record failed in single affiliation",
            frappe.get_traceback(),
        )

    frappe.db.commit()

    return api_response(
        success=True,
        data={
            "health_professional": hp_name,
            "facility_affiliation": affiliation_name,
        },
        message="Facility affiliation created successfully. The health professional will be notified to confirm.",
    )


def _create_affiliation_for_hwr_hp(hwr_cache_key, employment_details):
    """
    Retrieve cached HWR data, create HP record, and create the affiliation.
    Calls internal functions directly to avoid api_response side-effect conflicts.
    """
    (
        create_facility_affiliation_record_internal,
        append_prof_affiliation_record,
    ) = _get_onboarding_helpers()

    # Retrieve HWR data from server-side cache
    hwr_data = frappe.cache.get_value(hwr_cache_key)
    if not hwr_data:
        return api_response(
            success=False,
            message="Health worker data has expired. Please search again.",
            status_code=410,
        )

    # Clean up cache after retrieval (single-use)
    frappe.cache.delete_value(hwr_cache_key)

    # Build the data structure expected by onboard_health_professional's internals
    onboarding_data = dict(hwr_data)
    onboarding_data["employment_details"] = employment_details

    # --- Inline the onboarding logic to avoid api_response side-effect conflict ---
    # (onboard_health_professional calls api_response which sets frappe.local.response
    #  as a side-effect, then returns None. If we call it from within another
    #  whitelisted function, Frappe would overwrite the response with our return value.)

    from .health_worker_onboarding import validate_onboarding_data

    validation_result = validate_onboarding_data(onboarding_data)
    if not validation_result["valid"]:
        return api_response(
            success=False,
            message=f"Validation failed: {', '.join(validation_result['errors'][:5])}",
            status_code=400,
        )

    # Create Health Professional record
    hp_doc = frappe.new_doc("Health Professional")
    hp_name = hp_doc.create_hp_from_hwr_data(onboarding_data)

    # Create Facility Affiliation
    result = create_facility_affiliation_record_internal(
        hp_name, employment_details
    )

    if isinstance(result, dict) and result.get("error"):
        return api_response(
            success=False,
            message=result.get("message", "Failed to create affiliation"),
            status_code=400,
        )

    affiliation_name = result.get("name") if isinstance(result, dict) else result

    # Append to HP child table
    try:
        append_prof_affiliation_record(
            hp_name, employment_details, affiliation_name
        )
    except Exception:
        frappe.log_error(
            "append_professional_affiliation_record failed (HWR single affiliation)",
            frappe.get_traceback(),
        )

    frappe.db.commit()

    return api_response(
        success=True,
        data={
            "health_professional": hp_name,
            "facility_affiliation": affiliation_name,
            "is_new_hp": True,
        },
        message="Health professional registered and affiliation created. They will be notified to confirm.",
    )
