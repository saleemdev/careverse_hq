"""
Session-authenticated health facility onboarding APIs for Admin Central.

This flow is intended for the React frontend, which authenticates with the
standard Frappe session cookie and CSRF token rather than token headers.
"""

from __future__ import annotations

import json
import time
from typing import Any, Dict, List, Optional

import frappe
import pyotp
from frappe import _
from frappe.core.doctype.sms_settings.sms_settings import send_sms
from frappe.twofactor import get_otpsecret_for_, get_rendered_otp_message

from .response import api_response
from .permissions_manager import create_user_permissions_bulk

FACILITY_ONBOARDING_OTP_TTL_SECONDS = 300
FACILITY_ONBOARDING_OTP_MAX_ATTEMPTS = 5
FACILITY_ONBOARDING_OTP_DIGITS = 5
FACILITY_ONBOARDING_OTP_RESEND_COOLDOWN_SECONDS = 30
FACILITY_ONBOARDING_VERIFICATION_TTL_SECONDS = 900
FACILITY_ONBOARDING_SUBMIT_LOCK_TTL_SECONDS = 60


def _otp_cache_key(otp_id: str) -> str:
    return f"careverse_hq:facility_onboarding:otp:{otp_id}"


def _cooldown_key(user: str, facility_id: str) -> str:
    return f"careverse_hq:facility_onboarding:cooldown:{user}:{facility_id}"


def _verification_cache_key(user: str, facility_id: str) -> str:
    return f"careverse_hq:facility_onboarding:verified:{user}:{facility_id}"


def _submit_lock_key(user: str, facility_id: str) -> str:
    return f"careverse_hq:facility_onboarding:submit_lock:{user}:{facility_id}"


def _seconds_remaining(expires_at: Any) -> int:
    try:
        remaining = int(expires_at) - int(time.time())
    except Exception:
        return 0
    return max(0, remaining)


def _parse_json_field(value: Any, *, fallback: Any) -> Any:
    if value is None:
        return fallback
    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return fallback
        try:
            return json.loads(raw)
        except Exception:
            return fallback
    return value


def _require_authenticated_user() -> Optional[str]:
    user = frappe.session.user
    if not user or user == "Guest":
        return None
    return user


def _get_healthcare_user(user: str):
    return frappe.get_doc("Healthcare Organization User", {"user": user})


def _fetch_registry_facility(**kwargs):
    from .facility_onboarding_v2 import fetch_facility_hwr_fr

    response = fetch_facility_hwr_fr(**kwargs)
    if response is not None:
        return response

    local_response = getattr(getattr(frappe, "local", None), "response", None)
    if isinstance(local_response, dict) and local_response.get("status") == "error":
        return {
            "status": "error",
            "message": local_response.get("message") or _("Facility registry request failed."),
            "status_code": local_response.get("http_status_code") or 502,
            "details": local_response.get("details"),
        }
    return response


def _unexpected_registry_response():
    return api_response(
        success=False,
        message=_("The Health Facility Registry returned an unexpected response. Please try again shortly."),
        status_code=502,
        details={
            "source": "hfr",
            "source_label": "Health Facility Registry",
            "kind": "unexpected_payload",
            "status_code": 502,
            "technical_message": "Facility registry response payload was not a JSON object.",
        },
    )


def _create_facility_record(**kwargs):
    from .facility_onboarding_v2 import create_new_facility_v2

    return create_new_facility_v2(**kwargs)


def _get_public_owner_types() -> List[str]:
    from .facility_onboarding_v2 import get_public_facility_owner_types

    owner_types = get_public_facility_owner_types()
    return owner_types if isinstance(owner_types, list) else []


def _normalize_lookup_args(kwargs: Dict[str, Any]) -> Dict[str, str]:
    lookup_fields = ("facility_id", "registration_number")
    normalized: Dict[str, str] = {}
    for field in lookup_fields:
        value = kwargs.get(field)
        if value is None:
            continue
        text = str(value).strip()
        if text:
            normalized[field] = text
    return normalized


def _pick_first(*values: Any) -> Any:
    for value in values:
        if value not in (None, ""):
            return value
    return None


def _extract_cr_person(cr_payload: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(cr_payload, dict):
        return {}
    if isinstance(cr_payload.get("data"), dict):
        return cr_payload["data"]
    return cr_payload


def _build_admin_details(healthcare_user) -> Dict[str, Any]:
    return {
        "first_name": _pick_first(healthcare_user.get("first_name"), healthcare_user.get("administrators_first_name")),
        "middle_name": _pick_first(healthcare_user.get("middle_name"), healthcare_user.get("administrators_middle_name")),
        "last_name": _pick_first(healthcare_user.get("last_name"), healthcare_user.get("administrators_last_name")),
        "id_number": _pick_first(healthcare_user.get("identification_number"), healthcare_user.get("id_number")),
        "phone_number": _pick_first(healthcare_user.get("phone_number"), healthcare_user.get("administrators_phone_number")),
        "email": healthcare_user.get("email"),
        "gender": healthcare_user.get("gender"),
        "date_of_birth": healthcare_user.get("date_of_birth"),
        "identification_type": _pick_first(healthcare_user.get("identification_type"), healthcare_user.get("administrators_id_type")),
    }


def _build_facility_payload_components(facility: Dict[str, Any], healthcare_user) -> Dict[str, Dict[str, Any]]:
    facility_id = _pick_first(facility.get("facility_fid"), facility.get("facility_id"), facility.get("hie_id"))
    facility_code = _pick_first(facility.get("facility_code"), facility.get("facility_mfl"))

    facility_details = {
        "facility_fid": facility_id,
        "facility_name": facility.get("facility_name"),
        "facility_type": facility.get("facility_type"),
        "registration_number": facility.get("registration_number"),
        "facility_category": _pick_first(facility.get("facility_category"), facility.get("category")),
        "facility_level": _pick_first(facility.get("facility_level"), facility.get("kephl_level")),
        "facility_code": facility_code,
        "operational_status": facility.get("operational_status"),
    }

    license_details = {
        "current_license_number": _pick_first(
            facility.get("current_license_number"),
            facility.get("license_number"),
        ),
        "current_license_type": _pick_first(
            facility.get("current_license_type"),
            facility.get("license_type"),
        ),
        "current_license_expiry_date": _pick_first(
            facility.get("current_license_expiry_date"),
            facility.get("license_expiry"),
        ),
        "regulatory_body": facility.get("regulatory_body"),
        "license_renewal_duration": facility.get("license_renewal_duration"),
        "current_renewal_date": _pick_first(
            facility.get("current_renewal_date"),
            facility.get("current_license_renewal_date"),
        ),
    }

    additional_defaults = {
        "organization_owner_type": _pick_first(
            facility.get("facility_owner_type"),
            facility.get("organization_owner_type"),
        ),
        "organization_owner": _pick_first(
            facility.get("facility_owner"),
            facility.get("organization_owner"),
        ),
        "organization_owner_kra_pin": _pick_first(
            facility.get("kra_pin"),
            facility.get("organization_owner_kra_pin"),
        ),
        "physical_address": _pick_first(facility.get("physical_address"), facility.get("address")),
        "email_address": _pick_first(facility.get("official_email"), facility.get("email")),
        "number_of_beds": facility.get("number_of_beds"),
        "latitude": facility.get("latitude"),
        "longitude": facility.get("longitude"),
        "county": facility.get("county"),
        "sub_county": facility.get("sub_county"),
        "ward": facility.get("ward"),
        "constituency": facility.get("constituency"),
        "maximum_bed_allocation": facility.get("maximum_bed_allocation"),
        "open_whole_day": facility.get("open_whole_day"),
        "open_public_holiday": facility.get("open_public_holiday"),
        "open_weekends": facility.get("open_weekends"),
        "open_late_night": facility.get("open_late_night"),
        "owner_board_registration_number": _pick_first(
            facility.get("owner_board_registration_number"),
            facility.get("administrator_board_registration_number"),
        ),
        "owner_current_license_number": _pick_first(
            facility.get("owner_current_license_number"),
            facility.get("administrator_current_license_number"),
        ),
    }

    return {
        "facility_details": facility_details,
        "license_details": license_details,
        "additional_defaults": additional_defaults,
        "admin_details": _build_admin_details(healthcare_user),
    }


def _build_facility_preview(facility: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "facility_id": _pick_first(facility.get("facility_fid"), facility.get("facility_id"), facility.get("hie_id")),
        "facility_name": facility.get("facility_name"),
        "facility_code": _pick_first(facility.get("facility_code"), facility.get("facility_mfl")),
        "registration_number": facility.get("registration_number"),
        "facility_type": facility.get("facility_type"),
        "facility_level": _pick_first(facility.get("facility_level"), facility.get("kephl_level")),
        "operational_status": facility.get("operational_status"),
        "county": facility.get("county"),
        "sub_county": facility.get("sub_county"),
        "facility_owner_type": _pick_first(
            facility.get("facility_owner_type"),
            facility.get("organization_owner_type"),
        ),
        "facility_owner": _pick_first(
            facility.get("facility_owner"),
            facility.get("organization_owner"),
        ),
    }


def _find_existing_facility(facility: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    search_pairs = [
        ("hie_id", _pick_first(facility.get("facility_fid"), facility.get("facility_id"), facility.get("hie_id"))),
        ("registration_number", facility.get("registration_number")),
        ("facility_mfl", _pick_first(facility.get("facility_code"), facility.get("facility_mfl"))),
    ]
    for fieldname, value in search_pairs:
        if not value:
            continue
        existing = frappe.db.sql(
            f"""
            SELECT name
            FROM `tabHealth Facility`
            WHERE `{fieldname}` = %(value)s
            LIMIT 1
            """,
            values={"value": value},
            as_dict=True,
        )
        if existing:
            return {"exists": True}
    return None


def _evaluate_lookup_result(user: str, facility: Dict[str, Any]) -> Dict[str, Any]:
    try:
        healthcare_user = _get_healthcare_user(user)
        user_id_number = str(healthcare_user.get("identification_number") or "").strip()
        user_full_name = " ".join(
            filter(
                None,
                [
                    healthcare_user.get("first_name"),
                    healthcare_user.get("middle_name"),
                    healthcare_user.get("last_name"),
                ],
            )
        )
    except frappe.DoesNotExistError:
        healthcare_user = None
        user_id_number = ""
        user_full_name = ""

    owner_id_number = str(facility.get("owner_id_number") or "").strip()
    existing = _find_existing_facility(facility)
    owner_id_present = bool(owner_id_number)
    owner_match = bool(healthcare_user and owner_id_present and owner_id_number == user_id_number)

    message = None
    if existing:
        message = _(
            "This facility is already onboarded in the system. Please confirm the FID or registration number before trying again."
        )
    elif not healthcare_user:
        message = _("Your account is not linked to a healthcare organization user profile.")
    elif not owner_id_present:
        message = _("Owner ID Number is not set for this facility. Please contact the regulator.")
    elif not owner_match:
        message = _(
            "This facility is assigned to a different owner in the registry. Please contact the regulator to update the facility owner details."
        )

    return {
        "facility_preview": _build_facility_preview(facility),
        "already_onboarded": existing,
        "owner_match": {
            "matched": owner_match,
            "identification_number": user_id_number or None,
            "identification_type": healthcare_user.get("identification_type") if healthcare_user else None,
            "full_name": user_full_name or None,
        },
        "owner_id_present": owner_id_present,
        "can_start_verification": bool(healthcare_user and owner_id_present and owner_match and not existing),
        "message": message,
    }


def _normalize_phone(phone: str) -> str:
    return (phone or "").strip().replace(" ", "")


def _mask_phone(phone: str) -> str:
    digits = _normalize_phone(phone)
    if len(digits) < 7:
        return "***"
    return f"{digits[:4]}******{digits[-3:]}"


def _mask_email(email: str) -> str:
    raw = (email or "").strip()
    if "@" not in raw:
        return "***"
    local_part, domain = raw.split("@", 1)
    if len(local_part) <= 2:
        return f"{local_part[:1]}***@{domain}"
    return f"{local_part[:1]}***{local_part[-1:]}@{domain}"


def _get_contact_for_delivery(cr_person: Dict[str, Any], requested_mode: str) -> tuple[Optional[str], Optional[str], Optional[str]]:
    phone = _normalize_phone(str(cr_person.get("phone") or ""))
    email = str(cr_person.get("email") or "").strip()

    mode = (requested_mode or "").strip().lower()
    if mode not in {"sms", "email"}:
        mode = "sms" if phone else "email"

    if mode == "sms":
        if not phone:
            return None, None, _("No phone number was found in Client Registry for OTP delivery.")
        return "sms", phone, None

    if not email:
        return None, None, _("No email address was found in Client Registry for OTP delivery.")
    return "email", email, None


def _mask_destination(mode: str, destination: str) -> str:
    if mode == "email":
        return _mask_email(destination)
    return _mask_phone(destination)


def _send_owner_otp(mode: str, destination: str, otp_value: str) -> None:
    if mode == "email":
        frappe.sendmail(
            recipients=[destination],
            subject="Health Facility Onboarding OTP",
            message=(
                "<p>Your health facility onboarding verification code is "
                f"<strong>{otp_value}</strong>.</p>"
                f"<p>This code expires in {FACILITY_ONBOARDING_OTP_TTL_SECONDS // 60} minutes.</p>"
            ),
            delayed=False,
        )
        return

    send_sms([destination], get_rendered_otp_message(otp_value), success_msg=False)


def _load_otp_session(otp_id: str) -> tuple[Optional[Dict[str, Any]], Optional[str]]:
    raw = frappe.cache().get_value(_otp_cache_key(otp_id))
    if not raw:
        return None, _("OTP session expired. Please request a new code.")

    try:
        payload = json.loads(raw)
    except Exception:
        frappe.cache().delete_value(_otp_cache_key(otp_id))
        return None, _("Invalid OTP session. Please request a new code.")

    return payload, None


def _cache_verification(user: str, facility_id: str, payload: Dict[str, Any]) -> None:
    frappe.cache().set_value(
        _verification_cache_key(user, facility_id),
        json.dumps(payload),
        expires_in_sec=FACILITY_ONBOARDING_VERIFICATION_TTL_SECONDS,
    )


def _load_verification(user: str, facility_id: str) -> Optional[Dict[str, Any]]:
    raw = frappe.cache().get_value(_verification_cache_key(user, facility_id))
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        frappe.cache().delete_value(_verification_cache_key(user, facility_id))
        return None


def _grant_post_onboarding_access(user: str, facility_docname: str) -> None:
    facility = frappe.get_doc("Health Facility", facility_docname)
    roles = set(frappe.get_roles(user))
    if "Facility Admin" not in roles:
        user_doc = frappe.get_doc("User", user)
        user_doc.add_roles("Facility Admin")
        user_doc.save(ignore_permissions=True)

    company_name = _pick_first(facility.get("organization_company"), facility.get("region_company"))
    if company_name:
        create_user_permissions_bulk(
            user=user,
            permissions=[{"doctype": "Company", "values": [company_name]}],
        )

    frappe.clear_cache(user=user)


def _get_user_company_names(user: str) -> List[str]:
    companies = frappe.get_all(
        "User Permission",
        filters={"user": user, "allow": "Company"},
        pluck="for_value",
        limit_page_length=0,
    )
    return [company for company in companies if company]


def _build_onboarding_organization_context(user: str, healthcare_user=None) -> Dict[str, Any]:
    if healthcare_user is None:
        try:
            healthcare_user = _get_healthcare_user(user)
        except frappe.DoesNotExistError:
            healthcare_user = None

    company_names = _get_user_company_names(user)
    organization_name = healthcare_user.get("organization") if healthcare_user else None
    organization_region = healthcare_user.get("organization_region") if healthcare_user else None

    organization = None
    if organization_name:
        organization = frappe.db.get_value(
            "Healthcare Organization",
            organization_name,
            ["name", "organization_name", "company"],
            as_dict=True,
        )

    region_filters: Dict[str, Any] = {}
    if organization and organization.get("name"):
        region_filters["parent_organization"] = organization.get("name")
    elif company_names:
        region_filters["company"] = ["in", company_names]

    regions = []
    if region_filters:
        regions = frappe.get_all(
            "Healthcare Organization Region",
            filters=region_filters,
            fields=["name", "region_name", "parent_organization", "company"],
            order_by="region_name asc",
        )

    region_name = None
    if organization_region:
        region_name = frappe.db.get_value(
            "Healthcare Organization Region",
            organization_region,
            "region_name",
        )

    default_region = organization_region or (regions[0].get("name") if len(regions) == 1 else None)

    return {
        "organization": organization,
        "organization_region": organization_region or None,
        "organization_region_name": region_name or None,
        "regions": regions,
        "company_names": company_names,
        "default_region": default_region,
    }


def _resolve_onboarding_target_context(additional_details: Dict[str, Any]) -> tuple[Optional[Dict[str, Any]], Optional[str]]:
    public_owner_types = {value.strip().upper() for value in _get_public_owner_types() if value}
    ownership_type = str(additional_details.get("organization_owner_type") or "").strip().upper()
    is_public = ownership_type in public_owner_types

    if is_public:
        organization_name = str(additional_details.get("county") or "").strip()
        region_name = str(additional_details.get("sub_county") or "").strip()
        if not organization_name:
            return None, _("Organization county is missing from the registry data.")
        if not region_name:
            return None, _("Organization region is missing from the registry data.")

        try:
            organization = frappe.get_doc(
                "Healthcare Organization",
                {"organization_name": organization_name},
                ignore_permissions=True,
            )
        except frappe.DoesNotExistError:
            return None, _("The target organization for this facility could not be found.")

        try:
            region = frappe.get_doc(
                "Healthcare Organization Region",
                {"region_name": region_name},
                ignore_permissions=True,
            )
        except frappe.DoesNotExistError:
            return None, _("The target organization region for this facility could not be found.")

        if region.get("parent_organization") and region.get("parent_organization") != organization.get("name"):
            return None, _("The registry county and sub-county do not map to the same organization.")
    else:
        region_id = str(additional_details.get("region") or "").strip()
        if not region_id:
            return None, _("Select the organization region that should own this facility.")

        try:
            region = frappe.get_doc(
                "Healthcare Organization Region",
                {"name": region_id},
                ignore_permissions=True,
            )
        except frappe.DoesNotExistError:
            return None, _("The selected organization region could not be found.")

        organization_id = region.get("parent_organization")
        if not organization_id:
            return None, _("The selected organization region is not linked to an organization.")

        try:
            organization = frappe.get_doc(
                "Healthcare Organization",
                {"name": organization_id},
                ignore_permissions=True,
            )
        except frappe.DoesNotExistError:
            return None, _("The selected organization could not be found.")

    return {
        "is_public": is_public,
        "organization": {
            "name": organization.get("name"),
            "organization_name": organization.get("organization_name"),
            "company": organization.get("company"),
        },
        "region": {
            "name": region.get("name"),
            "region_name": region.get("region_name"),
            "company": region.get("company"),
            "parent_organization": region.get("parent_organization"),
        },
    }, None


def _validate_target_context_for_user(user: str, healthcare_user, target_context: Dict[str, Any]) -> Optional[str]:
    organization_context = _build_onboarding_organization_context(user, healthcare_user)
    current_organization = organization_context.get("organization") or {}
    target_organization = target_context.get("organization") or {}
    target_region = target_context.get("region") or {}

    if current_organization.get("name") and target_organization.get("name") != current_organization.get("name"):
        return _(
            "This facility maps to {0}, but your onboarding access is scoped to {1}."
        ).format(
            target_organization.get("organization_name") or _("another organization"),
            current_organization.get("organization_name") or _("your current organization"),
        )

    allowed_companies = set(organization_context.get("company_names") or [])
    target_company = _pick_first(target_region.get("company"), target_organization.get("company"))
    if not current_organization.get("name") and allowed_companies and target_company not in allowed_companies:
        return _("This facility maps outside the companies your account can manage.")

    if not target_context.get("is_public"):
        allowed_regions = {region.get("name") for region in organization_context.get("regions") or []}
        if allowed_regions and target_region.get("name") not in allowed_regions:
            return _("Select an organization region within your current organization.")

    return None


@frappe.whitelist(methods=["GET"])
def get_reference_data():
    user = _require_authenticated_user()
    if not user:
        return api_response(success=False, message=_("Authentication required."), status_code=401)

    try:
        try:
            healthcare_user = _get_healthcare_user(user)
        except frappe.DoesNotExistError:
            healthcare_user = None
        organization_context = _build_onboarding_organization_context(user, healthcare_user)
        return api_response(
            success=True,
            data={
                "regions": organization_context.get("regions") or [],
                "public_owner_types": _get_public_owner_types(),
                "organization_context": {
                    "organization_id": organization_context.get("organization", {}).get("name") if organization_context.get("organization") else None,
                    "organization_name": organization_context.get("organization", {}).get("organization_name") if organization_context.get("organization") else None,
                    "company_names": organization_context.get("company_names") or [],
                    "organization_region": organization_context.get("organization_region"),
                    "organization_region_name": organization_context.get("organization_region_name"),
                    "default_region": organization_context.get("default_region"),
                },
            },
            status_code=200,
        )
    except Exception:
        frappe.log_error(frappe.get_traceback(), "Facility Onboarding Reference Data Error")
        return api_response(
            success=False,
            message=_("Unable to load onboarding reference data."),
            status_code=500,
        )


@frappe.whitelist(methods=["POST"])
def lookup_facility(**kwargs):
    user = _require_authenticated_user()
    if not user:
        return api_response(success=False, message=_("Authentication required."), status_code=401)

    kwargs.pop("cmd", None)
    facility_id = str(kwargs.get("facility_id") or "").strip()
    registration_number = str(kwargs.get("registration_number") or "").strip()

    if bool(facility_id) == bool(registration_number):
        return api_response(
            success=False,
            message=_("Provide either FID or registration number."),
            status_code=400,
        )

    lookup = {"facility_id": facility_id} if facility_id else {"registration_number": registration_number}
    facility = _fetch_registry_facility(**lookup)
    if isinstance(facility, dict) and facility.get("status") == "error":
        return facility

    if not isinstance(facility, dict):
        return _unexpected_registry_response()

    return api_response(
        success=True,
        data=_evaluate_lookup_result(user, facility),
        status_code=200,
    )


@frappe.whitelist(methods=["POST"])
def start_owner_verification(**kwargs):
    user = _require_authenticated_user()
    if not user:
        return api_response(success=False, message=_("Authentication required."), status_code=401)

    kwargs.pop("cmd", None)
    lookup = _normalize_lookup_args(kwargs)
    if len(lookup) != 1:
        return api_response(
            success=False,
            message=_("Provide either FID or registration number."),
            status_code=400,
        )

    requested_mode = str(kwargs.get("delivery_mode") or "").strip().lower()

    try:
        healthcare_user = _get_healthcare_user(user)
    except frappe.DoesNotExistError:
        return api_response(
            success=False,
            message=_("Your account is not linked to a healthcare organization user profile."),
            status_code=400,
        )
    except Exception:
        frappe.log_error(frappe.get_traceback(), "Facility Onboarding Owner Fetch Error")
        return api_response(
            success=False,
            message=_("Unable to load your account profile."),
            status_code=500,
        )

    facility = _fetch_registry_facility(**lookup)
    if isinstance(facility, dict) and facility.get("status") == "error":
        return facility

    if not isinstance(facility, dict):
        return _unexpected_registry_response()

    evaluation = _evaluate_lookup_result(user, facility)
    if evaluation.get("already_onboarded"):
        return api_response(
            success=False,
            message=_(
                "This facility is already onboarded in the system. Please confirm the FID or registration number before trying again."
            ),
            data={"already_onboarded": evaluation.get("already_onboarded")},
            status_code=409,
        )

    owner_id_number = str(facility.get("owner_id_number") or "").strip()
    if not owner_id_number:
        return api_response(
            success=False,
            message=_("Owner ID Number is not set for this facility. Please contact the regulator."),
            status_code=400,
        )

    user_id_number = str(healthcare_user.get("identification_number") or "").strip()
    if owner_id_number != user_id_number:
        return api_response(
            success=False,
            message=_(
                "This facility is assigned to a different owner in the registry. Please contact the regulator to update the facility owner details."
            ),
            status_code=403,
        )

    from healthpro_erp.api.utils import fetch_client_registry_user

    cr_payload, cr_error = fetch_client_registry_user(
        identification_type=healthcare_user.get("identification_type"),
        identification_number=user_id_number,
    )
    if cr_error:
        return api_response(
            success=False,
            message=cr_error.get("message") or _("Unable to load owner contact information."),
            status_code=int(cr_error.get("status_code") or 500),
        )

    cr_person = _extract_cr_person(cr_payload or {})
    delivery_mode, destination, delivery_error = _get_contact_for_delivery(cr_person, requested_mode)
    if delivery_error:
        return api_response(success=False, message=delivery_error, status_code=400)

    facility_id = _pick_first(facility.get("facility_fid"), facility.get("facility_id"), facility.get("hie_id"))
    cooldown_key = _cooldown_key(user, facility_id)
    if frappe.cache().get_value(cooldown_key):
        return api_response(
            success=False,
            message=_("Please wait before requesting another OTP."),
            status_code=429,
        )

    otp_secret = get_otpsecret_for_(user)
    token = int(time.time())
    hotp = pyotp.HOTP(otp_secret, digits=FACILITY_ONBOARDING_OTP_DIGITS)
    otp_value = hotp.at(token)

    try:
        _send_owner_otp(delivery_mode, destination, otp_value)
    except Exception as exc:
        frappe.log_error(frappe.get_traceback(), "Facility Onboarding OTP Send Error")
        return api_response(
            success=False,
            message=_("Failed to send OTP. {0}").format(str(exc)),
            status_code=500,
        )

    issued_at = int(time.time())
    expires_at = issued_at + FACILITY_ONBOARDING_OTP_TTL_SECONDS
    payload = {
        "user": user,
        "facility_id": facility_id,
        "delivery_mode": delivery_mode,
        "destination": destination,
        "otp_secret": otp_secret,
        "token": token,
        "attempts": 0,
        "facility": facility,
        "admin_details": _build_admin_details(healthcare_user),
        "issued_at": issued_at,
        "expires_at": expires_at,
    }
    otp_id = frappe.generate_hash(length=20)
    cache = frappe.cache()
    cache.set_value(
        _otp_cache_key(otp_id),
        json.dumps(payload),
        expires_in_sec=FACILITY_ONBOARDING_OTP_TTL_SECONDS,
    )
    cache.set_value(
        cooldown_key,
        "1",
        expires_in_sec=FACILITY_ONBOARDING_OTP_RESEND_COOLDOWN_SECONDS,
    )

    return api_response(
        success=True,
        message=_("OTP sent successfully."),
        data={
            "facility_preview": evaluation.get("facility_preview"),
            "otp_session": {
                "otp_id": otp_id,
                "channel": delivery_mode,
                "masked_destination": _mask_destination(delivery_mode, destination),
                "expires_in_seconds": _seconds_remaining(expires_at),
                "expires_at": expires_at,
                "resend_cooldown_seconds": FACILITY_ONBOARDING_OTP_RESEND_COOLDOWN_SECONDS,
            },
            "owner_match": evaluation.get("owner_match"),
        },
        status_code=200,
    )


@frappe.whitelist(methods=["POST"])
def verify_owner_otp(facility_id: Optional[str] = None, otp_id: Optional[str] = None, otp_code: Optional[str] = None):
    user = _require_authenticated_user()
    if not user:
        return api_response(success=False, message=_("Authentication required."), status_code=401)

    facility_id = str(facility_id or "").strip()
    otp_id = str(otp_id or "").strip()
    otp_code = str(otp_code or "").strip()

    if not facility_id or not otp_id or not otp_code:
        return api_response(
            success=False,
            message=_("facility_id, otp_id, and otp_code are required."),
            status_code=400,
        )

    payload, error = _load_otp_session(otp_id)
    if error:
        return api_response(success=False, message=error, status_code=403)

    if payload.get("user") != user:
        return api_response(success=False, message=_("OTP session does not belong to the current user."), status_code=403)

    if payload.get("facility_id") != facility_id:
        return api_response(success=False, message=_("OTP session does not match the selected facility."), status_code=403)

    otp_seconds_remaining = _seconds_remaining(payload.get("expires_at"))
    if otp_seconds_remaining <= 0:
        frappe.cache().delete_value(_otp_cache_key(otp_id))
        return api_response(
            success=False,
            message=_("OTP session expired. Please request a new code."),
            status_code=403,
        )

    attempts = int(payload.get("attempts") or 0)
    if attempts >= FACILITY_ONBOARDING_OTP_MAX_ATTEMPTS:
        frappe.cache().delete_value(_otp_cache_key(otp_id))
        return api_response(
            success=False,
            message=_("Maximum OTP attempts reached. Please request a new code."),
            status_code=403,
        )

    try:
        hotp = pyotp.HOTP(payload.get("otp_secret"), digits=FACILITY_ONBOARDING_OTP_DIGITS)
        is_valid = hotp.verify(otp_code, int(payload.get("token") or 0))
    except Exception:
        is_valid = False

    if not is_valid:
        payload["attempts"] = attempts + 1
        remaining = FACILITY_ONBOARDING_OTP_MAX_ATTEMPTS - payload["attempts"]
        if remaining <= 0:
            frappe.cache().delete_value(_otp_cache_key(otp_id))
            return api_response(
                success=False,
                message=_("OTP is invalid. Maximum attempts reached. Please request a new code."),
                status_code=403,
            )

        frappe.cache().set_value(
            _otp_cache_key(otp_id),
            json.dumps(payload),
            expires_in_sec=otp_seconds_remaining,
        )
        return api_response(
            success=False,
            message=_("OTP is invalid. {0} attempt(s) left.").format(remaining),
            status_code=403,
        )

    frappe.cache().delete_value(_otp_cache_key(otp_id))
    components = _build_facility_payload_components(payload.get("facility") or {}, payload.get("admin_details") or {})
    verified_at = int(time.time())
    verification_expires_at = verified_at + FACILITY_ONBOARDING_VERIFICATION_TTL_SECONDS
    verification_payload = {
        "facility_id": facility_id,
        "facility": payload.get("facility") or {},
        "facility_details": components["facility_details"],
        "license_details": components["license_details"],
        "additional_defaults": components["additional_defaults"],
        "admin_details": payload.get("admin_details") or {},
        "verified_at": verified_at,
        "expires_at": verification_expires_at,
    }
    _cache_verification(user, facility_id, verification_payload)

    return api_response(
        success=True,
        message=_("Owner verified successfully."),
        data={
            "facility_details": components["facility_details"],
            "admin_details": payload.get("admin_details") or {},
            "license_details": components["license_details"],
            "additional_defaults": components["additional_defaults"],
            "verification": {
                "expires_in_seconds": _seconds_remaining(verification_expires_at),
                "expires_at": verification_expires_at,
            },
        },
        status_code=200,
    )


@frappe.whitelist(methods=["POST"])
def complete_onboarding(
    facility_id: Optional[str] = None,
    additional_details: Optional[Any] = None,
    contacts: Optional[Any] = None,
    banks: Optional[Any] = None,
):
    user = _require_authenticated_user()
    if not user:
        return api_response(success=False, message=_("Authentication required."), status_code=401)

    facility_id = str(facility_id or "").strip()
    if not facility_id:
        return api_response(success=False, message=_("facility_id is required."), status_code=400)

    try:
        healthcare_user = _get_healthcare_user(user)
    except frappe.DoesNotExistError:
        return api_response(
            success=False,
            message=_("Your account is not linked to a healthcare organization user profile."),
            status_code=400,
        )

    verification_payload = _load_verification(user, facility_id)
    if not verification_payload:
        return api_response(
            success=False,
            message=_("Owner verification expired. Please verify ownership again."),
            status_code=403,
        )
    if _seconds_remaining(verification_payload.get("expires_at")) <= 0:
        frappe.cache().delete_value(_verification_cache_key(user, facility_id))
        return api_response(
            success=False,
            message=_("Owner verification expired. Please verify ownership again."),
            status_code=403,
        )

    cache = frappe.cache()
    lock_key = _submit_lock_key(user, facility_id)
    if cache.get_value(lock_key):
        return api_response(
            success=False,
            message=_("Another onboarding submission is already in progress."),
            status_code=409,
        )

    cache.set_value(lock_key, "1", expires_in_sec=FACILITY_ONBOARDING_SUBMIT_LOCK_TTL_SECONDS)

    try:
        facility = _fetch_registry_facility(facility_id=facility_id)
        if isinstance(facility, dict) and facility.get("status") == "error":
            return facility

        if not isinstance(facility, dict):
            return _unexpected_registry_response()

        existing = _find_existing_facility(facility)
        if existing:
            return api_response(
                success=False,
                message=_(
                    "This facility is already onboarded in the system. Please confirm the FID or registration number before trying again."
                ),
                data={"already_onboarded": existing},
                status_code=409,
            )

        refreshed_components = _build_facility_payload_components(facility, verification_payload.get("admin_details") or {})
        submitted_additional = _parse_json_field(additional_details, fallback={}) or {}
        submitted_contacts = _parse_json_field(contacts, fallback=[]) or []
        submitted_banks = _parse_json_field(banks, fallback=[]) or []

        merged_additional = dict(refreshed_components["additional_defaults"])
        for fieldname in (
            "physical_address",
            "email_address",
            "number_of_beds",
            "latitude",
            "longitude",
            "county",
            "sub_county",
            "ward",
            "constituency",
            "maximum_bed_allocation",
            "open_whole_day",
            "open_public_holiday",
            "open_weekends",
            "open_late_night",
            "region",
        ):
            if fieldname in submitted_additional:
                merged_additional[fieldname] = submitted_additional.get(fieldname)

        target_context, target_error = _resolve_onboarding_target_context(merged_additional)
        if target_error:
            return api_response(
                success=False,
                message=target_error,
                status_code=400,
            )

        target_validation_error = _validate_target_context_for_user(user, healthcare_user, target_context or {})
        if target_validation_error:
            return api_response(
                success=False,
                message=target_validation_error,
                status_code=403,
            )

        create_result = _create_facility_record(
            facility_id=facility_id,
            facility_details=refreshed_components["facility_details"],
            admin_details=verification_payload.get("admin_details") or refreshed_components["admin_details"],
            license_details=refreshed_components["license_details"],
            additional_details=merged_additional,
            contacts=submitted_contacts if isinstance(submitted_contacts, list) else [],
            banks=submitted_banks if isinstance(submitted_banks, list) else [],
        )

        if create_result.get("status") == "error":
            return create_result

        created_docname = facility_id
        _grant_post_onboarding_access(user, created_docname)
        cache.delete_value(_verification_cache_key(user, facility_id))

        facility_doc = frappe.get_doc("Health Facility", created_docname)
        return api_response(
            success=True,
            message=_("Facility onboarded successfully."),
            data={
                "facility_docname": facility_doc.name,
                "facility_name": facility_doc.facility_name,
                "facility_hie_id": facility_doc.hie_id,
                "organization": facility_doc.healthcare_organization,
                "region": facility_doc.healthcare_organization_region,
                "department": facility_doc.department,
            },
            status_code=201,
        )
    except Exception:
        frappe.log_error(frappe.get_traceback(), "Facility Onboarding Completion Error")
        return api_response(
            success=False,
            message=_("An unexpected error occurred while onboarding the facility."),
            status_code=500,
        )
    finally:
        cache.delete_value(lock_key)
