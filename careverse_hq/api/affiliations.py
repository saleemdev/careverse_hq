"""
Affiliation lifecycle APIs.

Implements central-admin unaffiliation (termination) workflow using
Frappe session authentication.
"""

from __future__ import annotations

import json
import base64
import time
from typing import Any, List, Optional

import frappe
import pyotp
from frappe import _
from frappe.core.doctype.sms_settings.sms_settings import send_sms
from frappe.utils import cint, getdate, today
from frappe.utils.file_manager import save_file
from frappe.twofactor import get_otpsecret_for_, get_rendered_otp_message

from .facility_affiliation_status import (
    CANONICAL_TERMINATED_AFFILIATION_STATUS,
    is_terminated_facility_affiliation_status,
)
from .response import api_response

TERMINATION_OTP_TTL_SECONDS = 300
TERMINATION_OTP_MAX_ATTEMPTS = 5
TERMINATION_OTP_DIGITS = 5
TERMINATION_OTP_RESEND_COOLDOWN_SECONDS = 30
TERMINATION_NOTIFICATION_TYPE = "Affiliation Termination"
TERMINATION_NOTIFICATION_TITLE = "Affiliation Termination"
TERMINATION_NOTIFICATION_SUBJECT = "Affiliation Termination Notice"


def _parse_documents(value: Optional[Any]) -> List[str]:
    """Accept list, JSON string, or comma-separated string."""
    if value in (None, ""):
        return []

    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]

    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return []

        if raw.startswith("["):
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return [str(item).strip() for item in parsed if str(item).strip()]
            except Exception:
                pass

        return [item.strip() for item in raw.split(",") if item.strip()]

    return []


def _set_if_field(doc, fieldname: str, value: Any) -> None:
    """Safely assign values to optional custom fields."""
    if doc.meta.has_field(fieldname):
        doc.set(fieldname, value)


def _set_termination_documents_safe(doc, documents: List[str]) -> None:
    """
    Persist termination document references only when field type supports string/json.
    Skip silently for unsupported field types (e.g. Table) to avoid runtime failures.
    """
    if not doc.meta.has_field("termination_documents"):
        return

    df = doc.meta.get_field("termination_documents")
    fieldtype = (getattr(df, "fieldtype", "") or "").strip()
    if fieldtype in {"Data", "Small Text", "Text", "Long Text", "Code", "JSON", ""}:
        current_docs = _parse_documents(doc.get("termination_documents"))
        next_docs = current_docs[:]
        for ref in documents or []:
            if ref and ref not in next_docs:
                next_docs.append(ref)
        doc.set("termination_documents", json.dumps(next_docs))


def _append_termination_document_reference(affiliation_doc, reference: str) -> None:
    """Append a reference string into termination_documents where supported."""
    if not reference:
        return

    if not affiliation_doc.meta.has_field("termination_documents"):
        return

    df = affiliation_doc.meta.get_field("termination_documents")
    fieldtype = (getattr(df, "fieldtype", "") or "").strip()
    if fieldtype not in {"Data", "Small Text", "Text", "Long Text", "Code", "JSON", ""}:
        return

    current_raw = affiliation_doc.get("termination_documents") or ""
    current_list = _parse_documents(current_raw)
    if reference not in current_list:
        current_list.append(reference)
    affiliation_doc.set("termination_documents", json.dumps(current_list))


def _safe_file_name(file_name: Optional[str]) -> str:
    raw = (file_name or "").strip()
    if raw:
        return raw
    return f"attachment-{int(time.time())}.bin"


def _otp_cache_key(otp_id: str) -> str:
    return f"careverse_hq:termination_otp:{otp_id}"


def _otp_cooldown_key(user: str, affiliation_id: str) -> str:
    return f"careverse_hq:termination_otp:cooldown:{user}:{affiliation_id}"


def _mask_phone(phone: str) -> str:
    phone = (phone or "").strip()
    if len(phone) < 7:
        return "***"
    return f"{phone[:4]}******{phone[-3:]}"


def _normalize_phone(phone: str) -> str:
    # Preserve user-provided international/local format; only trim spacing.
    return (phone or "").strip().replace(" ", "")


def _get_user_mobile(user: str) -> str:
    """OTP destination is always the currently logged-in user's mobile."""
    user_mobile = _normalize_phone(frappe.db.get_value("User", user, "mobile_no") or "")
    return user_mobile


def _ensure_select_option(doctype: str, fieldname: str, option: str) -> Optional[str]:
    """Ensure an option exists in DocField/Custom Field metadata."""
    for meta_doctype in ("DocField", "Custom Field"):
        filters = {"fieldname": fieldname}
        filters["parent" if meta_doctype == "DocField" else "dt"] = doctype
        field_name = frappe.db.get_value(
            meta_doctype,
            filters,
            "name",
        )
        if not field_name:
            continue

        current_options = frappe.db.get_value(meta_doctype, field_name, "options") or ""
        option_rows = [row.strip() for row in current_options.splitlines() if row.strip()]
        if option in option_rows:
            return "\n".join(option_rows)

        option_rows.append(option)
        next_options = "\n".join(option_rows)
        frappe.db.set_value(
            meta_doctype,
            field_name,
            "options",
            next_options,
            update_modified=False,
        )
        frappe.clear_cache(doctype=doctype)
        return next_options

    return None


def _ensure_terminated_status_metadata(affiliation_doc=None, hp_doc=None) -> None:
    """Allow Terminated in runtime metadata before saving affected docs."""
    facility_options = _ensure_select_option(
        "Facility Affiliation",
        "affiliation_status",
        CANONICAL_TERMINATED_AFFILIATION_STATUS,
    )
    if (
        affiliation_doc
        and facility_options
        and affiliation_doc.meta.has_field("affiliation_status")
    ):
        affiliation_doc.meta.get_field("affiliation_status").options = facility_options

    professional_options = _ensure_select_option(
        "Professional Affiliation",
        "affiliation_status",
        CANONICAL_TERMINATED_AFFILIATION_STATUS,
    )
    if not professional_options or not hp_doc:
        return

    for row in hp_doc.get("professional_affiliations") or []:
        if row.meta.has_field("affiliation_status"):
            row.meta.get_field("affiliation_status").options = professional_options


def _build_termination_document_payloads(documents: List[str]) -> List[dict[str, str]]:
    payload = []
    for index, reference in enumerate(documents or [], start=1):
        ref = (reference or "").strip()
        if not ref:
            continue
        payload.append(
            {
                "document_id": ref,
                "document_category": "Facility Affiliation",
                "document_type": "Termination Supporting Document",
                "document_number": str(index),
                "attachment": ref,
            }
        )
    return payload


def _get_facility_name(affiliation_doc) -> str:
    facility_name = frappe.db.get_value(
        "Health Facility",
        affiliation_doc.get("health_facility"),
        "facility_name",
    )
    return facility_name or affiliation_doc.get("health_facility") or "the facility"


def _build_termination_notification_content(
    facility_name: str,
    termination_reason: str,
    *,
    health_professional_name: Optional[str] = None,
    for_admin: bool = False,
) -> str:
    if for_admin:
        subject_name = health_professional_name or "The health professional"
        return (
            f"{subject_name} was unaffiliated from {facility_name}. "
            f"Reason: {termination_reason}"
        )
    return f"You have been unaffiliated from {facility_name}. Reason: {termination_reason}"


def _create_web_notification_safe(
    recipient_user: Optional[str],
    title: str,
    content: str,
) -> None:
    recipient = (recipient_user or "").strip()
    if not recipient:
        return

    try:
        from healthpro_erp.healthpro_erp.doctype.webapp_notification.webapp_notification import (
            _create_notification,
        )
    except Exception:
        frappe.log_error(
            frappe.get_traceback(),
            "Termination Notification Import Error",
        )
        return

    try:
        _create_notification(
            recipient_user=recipient,
            sender_user=frappe.session.user,
            sender_type="User",
            notification_type=TERMINATION_NOTIFICATION_TYPE,
            priority="High",
            is_actionable="Informational",
            title=title,
            content=content,
        )
    except Exception:
        frappe.log_error(
            frappe.get_traceback(),
            f"Termination Web Notification Error ({recipient})",
        )


def _send_mobile_termination_notification_safe(
    registration_number: Optional[str],
    facility_name: str,
    termination_reason: str,
    affiliation_name: str,
) -> None:
    registration_id = (registration_number or "").strip()
    if not registration_id:
        return

    fcm_token = frappe.db.get_value(
        "Notification Subscription",
        {"puid": registration_id},
        "fcm_token",
    )
    if not fcm_token:
        return

    try:
        from healthpro_erp.api.healthpro_mobile_app.mobile_notifications import (
            send_firebase_notification,
        )
    except Exception:
        frappe.log_error(
            frappe.get_traceback(),
            "Termination Mobile Notification Import Error",
        )
        return

    try:
        send_firebase_notification(
            subject=TERMINATION_NOTIFICATION_SUBJECT,
            fcm_token=fcm_token,
            title=TERMINATION_NOTIFICATION_TITLE,
            body=_build_termination_notification_content(
                facility_name,
                termination_reason,
            ),
            data={
                "affiliation_id": affiliation_name,
                "affiliation_status": CANONICAL_TERMINATED_AFFILIATION_STATUS,
            },
        )
    except Exception:
        frappe.log_error(
            frappe.get_traceback(),
            f"Termination Mobile Notification Error ({registration_id})",
        )


def _dispatch_termination_notifications(affiliation_doc, termination_reason: str) -> None:
    facility_name = _get_facility_name(affiliation_doc)
    hp_name = affiliation_doc.get("health_professional_name") or "Health Professional"

    health_professional = None
    health_professional_name = (affiliation_doc.get("health_professional") or "").strip()
    if health_professional_name and frappe.db.exists(
        "Health Professional",
        health_professional_name,
    ):
        try:
            health_professional = frappe.get_doc(
                "Health Professional",
                health_professional_name,
            )
        except Exception:
            frappe.log_error(
                frappe.get_traceback(),
                f"Termination Health Professional Load Error ({health_professional_name})",
            )

    health_professional_user = (
        (health_professional.get("user") if health_professional else None)
        or affiliation_doc.get("user")
    )
    if health_professional_user:
        _create_web_notification_safe(
            health_professional_user,
            TERMINATION_NOTIFICATION_TITLE,
            _build_termination_notification_content(
                facility_name,
                termination_reason,
            ),
        )

    _send_mobile_termination_notification_safe(
        health_professional.get("registration_number") if health_professional else None,
        facility_name,
        termination_reason,
        affiliation_doc.name,
    )

    admin_recipients = {
        user
        for user in {
            affiliation_doc.get("requested_by"),
            affiliation_doc.get("terminated_by"),
            frappe.session.user,
        }
        if (user or "").strip()
    }
    admin_recipients.discard(health_professional_user)

    admin_content = _build_termination_notification_content(
        facility_name,
        termination_reason,
        health_professional_name=hp_name,
        for_admin=True,
    )
    for recipient in admin_recipients:
        _create_web_notification_safe(
            recipient,
            TERMINATION_NOTIFICATION_TITLE,
            admin_content,
        )


def _enqueue_termination_c360_sync(
    affiliation_doc,
    termination_reason: str,
    termination_date,
    documents: List[str],
) -> None:
    try:
        from healthpro_erp.api.health_worker_onboarding_apis import (
            update_sync_affiliation_to_c360,
        )
    except Exception:
        frappe.log_error(
            frappe.get_traceback(),
            "Termination C360 Sync Import Error",
        )
        return

    try:
        frappe.enqueue(
            update_sync_affiliation_to_c360,
            queue="default",
            timeout=300,
            facility_affiliation_doc=affiliation_doc,
            update_fields={
                "affiliation_status": CANONICAL_TERMINATED_AFFILIATION_STATUS,
                "termination_reason": termination_reason,
                "termination_date": termination_date.isoformat(),
                "terminated_by": frappe.session.user,
                "termination_documents": _build_termination_document_payloads(documents),
            },
            is_async=True,
        )
    except Exception:
        frappe.log_error(
            frappe.get_traceback(),
            f"Termination C360 Sync Queue Error ({affiliation_doc.name})",
        )


def _verify_termination_otp(user: str, affiliation_id: str, otp_id: str, otp_code: str) -> Optional[str]:
    if not otp_id:
        return "OTP session is required."
    if not otp_code:
        return "OTP code is required."

    cache = frappe.cache()
    raw = cache.get_value(_otp_cache_key(otp_id))
    if not raw:
        return "OTP session expired. Please request a new code."

    try:
        payload = json.loads(raw)
    except Exception:
        cache.delete_value(_otp_cache_key(otp_id))
        return "Invalid OTP session. Please request a new code."

    if payload.get("user") != user:
        return "OTP session does not belong to current user."

    if payload.get("affiliation_id") != affiliation_id:
        return "OTP session does not match selected affiliation."

    attempts = cint(payload.get("attempts") or 0)
    if attempts >= TERMINATION_OTP_MAX_ATTEMPTS:
        cache.delete_value(_otp_cache_key(otp_id))
        return "Maximum OTP attempts reached. Please request a new code."

    otp_secret = (payload.get("otp_secret") or "").strip()
    token = cint(payload.get("token") or 0)
    is_valid = False
    try:
        hotp = pyotp.HOTP(otp_secret, digits=TERMINATION_OTP_DIGITS)
        is_valid = hotp.verify(str(otp_code).strip(), token)
    except Exception:
        is_valid = False

    if not is_valid:
        payload["attempts"] = attempts + 1
        cache.set_value(
            _otp_cache_key(otp_id),
            json.dumps(payload),
            expires_in_sec=TERMINATION_OTP_TTL_SECONDS,
        )
        remaining = TERMINATION_OTP_MAX_ATTEMPTS - payload["attempts"]
        if remaining <= 0:
            cache.delete_value(_otp_cache_key(otp_id))
            return "OTP is invalid. Maximum attempts reached. Please request a new code."
        return f"OTP is invalid. {remaining} attempt(s) left."

    cache.delete_value(_otp_cache_key(otp_id))
    return None


@frappe.whitelist(methods=["POST", "GET"], allow_guest=True)
def request_termination_otp(affiliation_id: Optional[str] = None):
    """Send SMS OTP to logged-in user's mobile number for termination confirmation."""
    try:
        if not frappe.session.user or frappe.session.user == "Guest":
            return api_response(
                success=False,
                message="Authentication required.",
                status_code=401,
            )

        affiliation_id = (affiliation_id or "").strip()
        if not affiliation_id:
            return api_response(
                success=False,
                message="affiliation_id is required.",
                status_code=400,
            )

        if not frappe.db.exists("Facility Affiliation", affiliation_id):
            return api_response(
                success=False,
                message="Affiliation not found.",
                status_code=404,
            )

        affiliation_doc = frappe.get_doc("Facility Affiliation", affiliation_id)
        affiliation_doc.check_permission("write")

        current_status = (affiliation_doc.get("affiliation_status") or "").strip()
        if current_status not in {"Active", "Confirmed"}:
            return api_response(
                success=False,
                message=f"Affiliation cannot be terminated from status '{current_status or 'Unknown'}'.",
                status_code=409,
            )

        mobile = _get_user_mobile(frappe.session.user)
        if not mobile:
            return api_response(
                success=False,
                message="No OTP phone found for current user. Please update User.mobile_no.",
                status_code=400,
            )

        cooldown_key = _otp_cooldown_key(frappe.session.user, affiliation_id)
        cooldown_active = frappe.cache().get_value(cooldown_key)
        if cooldown_active:
            return api_response(
                success=False,
                message=f"Please wait {TERMINATION_OTP_RESEND_COOLDOWN_SECONDS} seconds before requesting another OTP.",
                status_code=429,
            )

        sms_gateway_url = frappe.db.get_single_value("SMS Settings", "sms_gateway_url")
        if not sms_gateway_url:
            return api_response(
                success=False,
                message="SMS Settings are not configured. Please configure SMS gateway first.",
                status_code=400,
            )

        otp_secret = get_otpsecret_for_(frappe.session.user)
        token = int(time.time())
        hotp = pyotp.HOTP(otp_secret, digits=TERMINATION_OTP_DIGITS)
        otp_value = hotp.at(token)
        otp_message = get_rendered_otp_message(otp_value)

        # Explicit SMS dispatch via SMS Settings for clearer runtime behavior.
        try:
            send_sms([mobile], otp_message, success_msg=False)
        except Exception as sms_err:
            frappe.log_error(
                frappe.get_traceback(),
                "Request Termination OTP SMS Send Error",
            )
            return api_response(
                success=False,
                message=f"Failed to send OTP. {str(sms_err)}",
                status_code=500,
            )

        otp_id = frappe.generate_hash(length=20)
        payload = {
            "user": frappe.session.user,
            "affiliation_id": affiliation_id,
            "otp_secret": otp_secret,
            "token": token,
            "attempts": 0,
        }
        frappe.cache().set_value(
            _otp_cache_key(otp_id),
            json.dumps(payload),
            expires_in_sec=TERMINATION_OTP_TTL_SECONDS,
        )
        frappe.cache().set_value(
            cooldown_key,
            "1",
            expires_in_sec=TERMINATION_OTP_RESEND_COOLDOWN_SECONDS,
        )

        return api_response(
            success=True,
            message="OTP sent successfully.",
            data={
                "otp_id": otp_id,
                "channel": "sms",
                "masked_destination": _mask_phone(mobile),
                "destination_source": "user_mobile",
                "expires_in_seconds": TERMINATION_OTP_TTL_SECONDS,
            },
            status_code=200,
        )
    except frappe.PermissionError:
        return api_response(
            success=False,
            message="You do not have permission to terminate this affiliation.",
            status_code=403,
        )
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Request Termination OTP API Error")
        return api_response(
            success=False,
            message=f"Failed to send OTP. {str(e)}",
            status_code=500,
        )


@frappe.whitelist(methods=["POST", "GET"], allow_guest=True)
def terminate_affiliation(
    affiliation_id: Optional[str] = None,
    termination_reason: Optional[str] = None,
    termination_documents: Optional[Any] = None,
    otp_code: Optional[str] = None,
    otp_id: Optional[str] = None,
):
    """
    Terminate an active/confirmed affiliation and deactivate linked employee.

    Auth model: Frappe session + CSRF (no bearer/x-access-token headers).
    """
    try:
        if not frappe.session.user or frappe.session.user == "Guest":
            return api_response(
                success=False,
                message="Authentication required.",
                status_code=401,
            )

        affiliation_id = (affiliation_id or "").strip()
        termination_reason = (termination_reason or "").strip()
        documents = _parse_documents(termination_documents)
        otp_code = (otp_code or "").strip()
        otp_id = (otp_id or "").strip()

        if not affiliation_id:
            return api_response(
                success=False,
                message="affiliation_id is required.",
                status_code=400,
            )

        if not termination_reason:
            return api_response(
                success=False,
                message="termination_reason is required.",
                status_code=400,
            )

        if not frappe.db.exists("Facility Affiliation", affiliation_id):
            return api_response(
                success=False,
                message="Affiliation not found.",
                status_code=404,
            )

        affiliation_doc = frappe.get_doc("Facility Affiliation", affiliation_id)
        current_status = (affiliation_doc.get("affiliation_status") or "").strip()
        allowed_statuses = {"Active", "Confirmed"}

        if is_terminated_facility_affiliation_status(current_status):
            return api_response(
                success=True,
                message="Affiliation is already terminated.",
                data={
                    "affiliation_id": affiliation_doc.name,
                    "status": CANONICAL_TERMINATED_AFFILIATION_STATUS,
                    "termination_date": str(affiliation_doc.get("termination_date") or today()),
                    "terminated_by": affiliation_doc.get("terminated_by") or frappe.session.user,
                    "employee_id": affiliation_doc.get("employee"),
                    "employee_status": "Left",
                },
                status_code=200,
            )

        if current_status not in allowed_statuses:
            return api_response(
                success=False,
                message=f"Affiliation cannot be terminated. Current status: '{current_status or 'Unknown'}'.",
                status_code=409,
            )

        otp_error = _verify_termination_otp(
            user=frappe.session.user,
            affiliation_id=affiliation_id,
            otp_id=otp_id,
            otp_code=otp_code,
        )
        if otp_error:
            return api_response(
                success=False,
                message=otp_error,
                status_code=403,
            )

        today_value = getdate(today())
        hp_doc = None
        hp_name = affiliation_doc.get("health_professional")
        if hp_name and frappe.db.exists("Health Professional", hp_name):
            hp_doc = frappe.get_doc("Health Professional", hp_name)

        _ensure_terminated_status_metadata(
            affiliation_doc=affiliation_doc,
            hp_doc=hp_doc,
        )

        # Core status transition
        affiliation_doc.affiliation_status = CANONICAL_TERMINATED_AFFILIATION_STATUS
        _set_if_field(affiliation_doc, "termination_reason", termination_reason)
        _set_if_field(affiliation_doc, "termination_date", today_value)
        _set_if_field(affiliation_doc, "terminated_by", frappe.session.user)
        _set_termination_documents_safe(affiliation_doc, documents)
        _set_if_field(affiliation_doc, "end_date", today_value)

        affiliation_doc.save()
        try:
            affiliation_doc.add_comment(
                "Comment",
                f"Termination confirmed via OTP by user {frappe.session.user}.",
            )
        except Exception:
            # Comment/audit note should not block core termination workflow.
            pass

        employee_name = affiliation_doc.get("employee")
        employee_status = None

        # Keep employee out of active directory after unaffiliation.
        if employee_name and frappe.db.exists("Employee", employee_name):
            employee_doc = frappe.get_doc("Employee", employee_name)
            employee_updates = {"status": "Left"}
            if employee_doc.meta.has_field("relieving_date"):
                employee_updates["relieving_date"] = today_value
            if employee_doc.meta.has_field("date_of_leaving"):
                employee_updates["date_of_leaving"] = today_value

            # Avoid full Employee save validation/hook side-effects from blocking
            # affiliation termination. We only need an immediate status flip.
            frappe.db.set_value("Employee", employee_name, employee_updates, update_modified=True)
            employee_status = employee_updates["status"]

        # Update Health Professional child affiliation row where possible.
        if hp_doc:
            for row in hp_doc.get("professional_affiliations") or []:
                if row.get("facility_affiliation") == affiliation_doc.name and row.meta.has_field("affiliation_status"):
                    row.affiliation_status = CANONICAL_TERMINATED_AFFILIATION_STATUS
            hp_doc.save()

        _dispatch_termination_notifications(affiliation_doc, termination_reason)
        _enqueue_termination_c360_sync(
            affiliation_doc,
            termination_reason,
            today_value,
            documents,
        )

        frappe.db.commit()

        return api_response(
            success=True,
            message="Affiliation successfully terminated.",
            data={
                "affiliation_id": affiliation_doc.name,
                "status": affiliation_doc.affiliation_status,
                "termination_date": str(today()),
                "terminated_by": frappe.session.user,
                "employee_id": employee_name,
                "employee_status": employee_status,
            },
            status_code=200,
        )
    except frappe.PermissionError:
        return api_response(
            success=False,
            message="You do not have permission to terminate affiliations.",
            status_code=403,
        )
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Terminate Affiliation API Error")
        return api_response(
            success=False,
            message=f"An unexpected error occurred. {str(e)}",
            status_code=500,
        )


@frappe.whitelist(methods=["POST"], allow_guest=True)
def upload_termination_attachment(affiliation_id: Optional[str] = None):
    """
    Upload a termination supporting document and attach it to Facility Affiliation.

    Uses session auth check inside method to prevent Guest access while avoiding
    brittle CSRF behavior on some deployed frontends.
    """
    try:
        if not frappe.session.user or frappe.session.user == "Guest":
            return api_response(
                success=False,
                message="Authentication required.",
                status_code=401,
            )

        affiliation_id = (
            affiliation_id
            or frappe.form_dict.get("affiliation_id")
            or frappe.form_dict.get("docname")
            or ""
        ).strip()
        if not affiliation_id:
            return api_response(
                success=False,
                message="affiliation_id is required.",
                status_code=400,
            )

        if not frappe.db.exists("Facility Affiliation", affiliation_id):
            return api_response(
                success=False,
                message="Affiliation not found.",
                status_code=404,
            )

        # Permission check against target document.
        target_doc = frappe.get_doc("Facility Affiliation", affiliation_id)
        target_doc.check_permission("write")

        uploaded = frappe.request.files.get("file")
        if not uploaded:
            return api_response(
                success=False,
                message="No file provided.",
                status_code=400,
            )

        safe_name = _safe_file_name(getattr(uploaded, "filename", None))
        file_content = uploaded.stream.read() if getattr(uploaded, "stream", None) else None
        if not file_content:
            return api_response(
                success=False,
                message="Uploaded file is empty.",
                status_code=400,
            )

        try:
            file_doc = save_file(
                safe_name,
                file_content,
                "Facility Affiliation",
                affiliation_id,
                is_private=1,
            )
            _append_termination_document_reference(
                target_doc, file_doc.file_url or file_doc.file_name or safe_name
            )
            target_doc.save()
            frappe.db.commit()
            file_data = {
                "name": file_doc.name,
                "file_name": file_doc.file_name,
                "file_url": file_doc.file_url,
                "stored_as_reference": False,
            }
        except Exception as save_err:
            # Environment fallback when file-type detection deps (e.g. libmagic) are missing.
            save_err_text = str(save_err).lower()
            if "libmagic" in save_err_text or "expected string or bytes-like object" in save_err_text or "nonetype" in save_err_text:
                affiliation_doc = frappe.get_doc("Facility Affiliation", affiliation_id)
                _append_termination_document_reference(
                    affiliation_doc, f"attachment:{safe_name}"
                )
                affiliation_doc.save()
                frappe.db.commit()
                file_data = {
                    "name": safe_name,
                    "file_name": safe_name,
                    "file_url": "",
                    "stored_as_reference": True,
                }
            else:
                raise

        return api_response(
            success=True,
            message="File uploaded successfully.",
            data=file_data,
            status_code=200,
        )
    except frappe.PermissionError:
        return api_response(
            success=False,
            message="You do not have permission to upload attachments for this affiliation.",
            status_code=403,
        )
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Upload Termination Attachment API Error")
        return api_response(
            success=False,
            message=f"Failed to upload file. {str(e)}",
            status_code=500,
        )


@frappe.whitelist(methods=["POST"])
def upload_termination_attachment_base64(
    affiliation_id: Optional[str] = None,
    file_name: Optional[str] = None,
    file_content_base64: Optional[str] = None,
):
    """
    Upload termination attachment via frappe.call JSON payload.

    This avoids multipart/CSRF edge cases in custom frontend builds by relying
    on Frappe's standard RPC save flow.
    """
    try:
        if not frappe.session.user or frappe.session.user == "Guest":
            return api_response(
                success=False,
                message="Authentication required.",
                status_code=401,
            )

        affiliation_id = (affiliation_id or "").strip()
        file_name = _safe_file_name(file_name)
        file_content_base64 = (file_content_base64 or "").strip()

        if not affiliation_id:
            return api_response(
                success=False,
                message="affiliation_id is required.",
                status_code=400,
            )

        if not file_content_base64:
            return api_response(
                success=False,
                message="file_content_base64 is required.",
                status_code=400,
            )

        if not frappe.db.exists("Facility Affiliation", affiliation_id):
            return api_response(
                success=False,
                message="Affiliation not found.",
                status_code=404,
            )

        target_doc = frappe.get_doc("Facility Affiliation", affiliation_id)
        target_doc.check_permission("write")

        # Allow both raw base64 and data URL format.
        if "," in file_content_base64 and "base64" in file_content_base64[:64]:
            file_content_base64 = file_content_base64.split(",", 1)[1]

        try:
            file_bytes = base64.b64decode(file_content_base64)
        except Exception:
            return api_response(
                success=False,
                message="Invalid base64 file content.",
                status_code=400,
            )
        if not file_bytes:
            return api_response(
                success=False,
                message="Uploaded file is empty.",
                status_code=400,
            )

        try:
            file_doc = save_file(
                file_name,
                file_bytes,
                "Facility Affiliation",
                affiliation_id,
                is_private=1,
            )
            _append_termination_document_reference(
                target_doc, file_doc.file_url or file_doc.file_name or file_name
            )
            target_doc.save()
            frappe.db.commit()
            file_data = {
                "name": file_doc.name,
                "file_name": file_doc.file_name,
                "file_url": file_doc.file_url,
                "stored_as_reference": False,
            }
        except Exception as save_err:
            save_err_text = str(save_err).lower()
            if "libmagic" in save_err_text or "expected string or bytes-like object" in save_err_text or "nonetype" in save_err_text:
                _append_termination_document_reference(
                    target_doc, f"attachment:{file_name}"
                )
                target_doc.save()
                frappe.db.commit()
                file_data = {
                    "name": file_name,
                    "file_name": file_name,
                    "file_url": "",
                    "stored_as_reference": True,
                }
            else:
                raise

        return api_response(
            success=True,
            message="File uploaded successfully.",
            data=file_data,
            status_code=200,
        )
    except frappe.PermissionError:
        return api_response(
            success=False,
            message="You do not have permission to upload attachments for this affiliation.",
            status_code=403,
        )
    except Exception as e:
        frappe.log_error(
            frappe.get_traceback(), "Upload Termination Attachment Base64 API Error"
        )
        return api_response(
            success=False,
            message=f"Failed to upload file. {str(e)}",
            status_code=500,
        )
