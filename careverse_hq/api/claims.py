"""
Facility Claims API

Serves claims sent for a facility (Facility Claim doctype).
Returns summary, total count, and paginated records.
Uses Facility Claim doctype when available; falls back to mock when not.
"""

from __future__ import annotations

import frappe
from typing import Optional, List, Dict, Any
from frappe.utils import getdate
from .response import api_response
from .dashboard_utils import resolve_health_facility_reference, _count

def _normalize_optional_string(value: Optional[str]) -> Optional[str]:
    """Normalize optional string params from HTTP (strip, treat empty/undefined as None)."""
    if value is None or isinstance(value, (dict, list)):
        return None
    s = str(value).strip()
    if not s or s.lower() in ("undefined", "null", "none"):
        return None
    return s


def _mask_patient_name(name: Optional[str]) -> str:
    """Mask patient name: show first 2 chars per word + '***' e.g. 'John Doe' -> 'Jo*** Do***'."""
    if name is None or not str(name).strip():
        return "—"
    return " ".join(
        (part[:2] + "***") if len(part) >= 2 else (part[0] + "***") if part else ""
        for part in str(name).strip().split()
    ).strip() or "—"


def _mask_client_id(client_id: Optional[str]) -> str:
    """Mask client/CR number: first 4 chars + '****' + '-XX' (last 2 after hyphen) e.g. 'CR6582321887300-0' -> 'CR65****-00'."""
    if client_id is None or not str(client_id).strip():
        return "—"
    s = str(client_id).strip()
    if len(s) <= 4:
        return "****"
    first = s[:4]
    suffix = ""
    if "-" in s:
        after = s.split("-", 1)[1]
        suffix = "-" + after[-2:] if len(after) >= 2 else "-*"
    return f"{first}****{suffix}"


def _mask_claim_items(items: List[Dict[str, Any]]) -> None:
    """Apply patient name and client ID masking to claim items in-place."""
    for item in items:
        if "client_name" in item:
            item["client_name"] = _mask_patient_name(item.get("client_name"))
        if "client" in item:
            item["client"] = _mask_client_id(item.get("client"))


# Fields returned for list/summary (align with Facility Claim doctype)
FACILITY_CLAIM_LIST_FIELDS = [
    "name", "claim_id", "client", "client_name", "claim_status", "claim_upstream_error_group", "claim_upstream_response",
    "scheme_id", "insurer", "diagnoses", "interventions",
    "date_start", "date_end", "claim_subtype", "claim_type", "use", "claim_amount",
    "facility", "facility_name", "county", "sub_county", "creation", "modified",
]


def _mock_claim_record(
    name: str,
    claim_id: str,
    client: str,
    client_name: str,
    claim_status: str,
    scheme_id: str,
    insurer: str,
    diagnoses: str,
    interventions: str,
    date_start: str,
    date_end: str,
    claim_subtype: str,
    claim_type: str,
    claim_amount: float,
    facility: str,
    facility_name: str,
    county: str,
    sub_county: str,
    creation: str,
    modified: str,
    use: str = "claim",
    claim_upstream_error_group: Optional[str] = None,
    claim_upstream_response: Optional[str] = None,
) -> Dict[str, Any]:
    """Build a single claim record dict (matches Facility Claim doctype shape). Values come from API/DB only."""
    return {
        "name": name,
        "claim_id": claim_id,
        "client": client,
        "client_name": client_name,
        "claim_status": claim_status,
        "claim_upstream_error_group": claim_upstream_error_group,
        "claim_upstream_response": claim_upstream_response,
        "scheme_id": scheme_id,
        "insurer": insurer,
        "diagnoses": diagnoses,
        "interventions": interventions,
        "date_start": date_start,
        "date_end": date_end,
        "claim_subtype": claim_subtype,
        "claim_type": claim_type,
        "use": use,
        "claim_amount": claim_amount,
        "facility": facility,
        "facility_name": facility_name,
        "county": county,
        "sub_county": sub_county,
        "creation": creation,
        "modified": modified,
    }


def _get_all_mock_claims_list() -> List[Dict[str, Any]]:
    """Return the full unfiltered mock claims list (for filtering and for distinct filter options)."""
    return [
        _mock_claim_record(
            name="d2b091be-7645-47c3-b355-f7266194c52d",
            claim_id="d2b091be-7645-47c3-b355-f7266194c52d",
            client="CR6582321887350-5",
            client_name="MUTUGI None BRANDON",
            claim_status="approved",
            scheme_id="CAT-SHA-001",
            insurer="SOCIAL HEALTH AUTHORITY",
            diagnoses="Amoebiasis, unspecified",
            interventions="Consultation, Laboratory Investigation, Prescription, drug administration and dispensing",
            date_start="2025-09-29",
            date_end="2025-09-29",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-09-29 16:44:11.408391",
            modified="2026-01-20 02:29:51.830554",
        ),
        _mock_claim_record(
            name="a1b2c3d4-5678-90ab-cdef-111111111111",
            claim_id="a1b2c3d4-5678-90ab-cdef-111111111111",
            client="CR6582321887351-1",
            client_name="WANJIKU MARY JANE",
            claim_status="pending",
            scheme_id="CAT-SHA-001",
            insurer="SOCIAL HEALTH AUTHORITY",
            diagnoses="Acute upper respiratory infection",
            interventions="Consultation, Prescription",
            date_start="2025-10-01",
            date_end="2025-10-01",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=450.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-10-01 09:00:00.000000",
            modified="2025-10-01 09:00:00.000000",
        ),
        _mock_claim_record(
            name="e5f6g7h8-1234-5678-90ab-222222222222",
            claim_id="e5f6g7h8-1234-5678-90ab-222222222222",
            client="CR6582321887352-2",
            client_name="OTIENO DAVID PETER",
            claim_status="rejected",
            scheme_id="CAT-SHA-002",
            insurer="NHIF",
            diagnoses="Hypertension",
            interventions="Consultation, Laboratory Investigation",
            date_start="2025-09-28",
            date_end="2025-09-28",
            claim_subtype="ip",
            claim_type="institutional",
            claim_amount=1200.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-09-28 14:30:00.000000",
            modified="2025-09-30 10:00:00.000000",
        ),
        # Extra records for pagination and filter testing
        _mock_claim_record(
            name="b2c3d4e5-6789-01ab-cdef-333333333333",
            claim_id="b2c3d4e5-6789-01ab-cdef-333333333333",
            client="CR6582321887353-3",
            client_name="AKINYI JANE ROSE",
            claim_status="approved",
            scheme_id="CAT-SHA-001",
            insurer="SOCIAL HEALTH AUTHORITY",
            diagnoses="Uncomplicated hypertension",
            interventions="Consultation, Prescription",
            date_start="2025-10-05",
            date_end="2025-10-05",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=350.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-10-05 11:00:00.000000",
            modified="2025-10-06 09:00:00.000000",
        ),
        _mock_claim_record(
            name="c3d4e5f6-7890-12bc-def0-444444444444",
            claim_id="c3d4e5f6-7890-12bc-def0-444444444444",
            client="CR6582321887354-4",
            client_name="KIPCHUMBA JOSEPH",
            claim_status="pending",
            scheme_id="CAT-SHA-002",
            insurer="NHIF",
            diagnoses="Type 2 diabetes mellitus",
            interventions="Consultation, Laboratory Investigation, Prescription",
            date_start="2025-10-10",
            date_end="2025-10-10",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=890.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-10-10 08:30:00.000000",
            modified="2025-10-10 08:30:00.000000",
        ),
        _mock_claim_record(
            name="d4e5f6g7-8901-23cd-ef01-555555555555",
            claim_id="d4e5f6g7-8901-23cd-ef01-555555555555",
            client="CR6582321887355-5",
            client_name="NJERI MARY WAMBUI",
            claim_status="rejected",
            scheme_id="CAT-SHA-001",
            insurer="SOCIAL HEALTH AUTHORITY",
            diagnoses="Acute pharyngitis",
            interventions="Consultation",
            date_start="2025-10-08",
            date_end="2025-10-08",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=150.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-10-08 14:00:00.000000",
            modified="2025-10-09 11:00:00.000000",
        ),
        # Records 7–20 for pagination and information flow testing
        _mock_claim_record(
            name="e5f6g7h8-9012-34de-f012-666666666666",
            claim_id="e5f6g7h8-9012-34de-f012-666666666666",
            client="CR6582321887356-6",
            client_name="KAMAU JAMES MWANGI",
            claim_status="approved",
            scheme_id="CAT-SHA-001",
            insurer="SOCIAL HEALTH AUTHORITY",
            diagnoses="Malaria, unspecified",
            interventions="Consultation, Laboratory Investigation, Prescription",
            date_start="2025-09-15",
            date_end="2025-09-15",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=620.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-09-15 10:20:00.000000",
            modified="2025-09-16 08:00:00.000000",
        ),
        _mock_claim_record(
            name="f6g7h8i9-0123-45ef-0123-777777777777",
            claim_id="f6g7h8i9-0123-45ef-0123-777777777777",
            client="CR6582321887357-7",
            client_name="ODHIAMBO LUCY ACHIENG",
            claim_status="pending",
            scheme_id="CAT-SHA-002",
            insurer="NHIF",
            diagnoses="Urinary tract infection",
            interventions="Consultation, Laboratory Investigation",
            date_start="2025-10-12",
            date_end="2025-10-12",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=380.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-10-12 09:15:00.000000",
            modified="2025-10-12 09:15:00.000000",
        ),
        _mock_claim_record(
            name="a7b8c9d0-1234-56f0-1234-888888888888",
            claim_id="a7b8c9d0-1234-56f0-1234-888888888888",
            client="CR6582321887358-8",
            client_name="KORIR PETER KIPCHUMBA",
            claim_status="rejected",
            scheme_id="CAT-SHA-001",
            insurer="SOCIAL HEALTH AUTHORITY",
            diagnoses="Acute bronchitis",
            interventions="Consultation, Prescription",
            date_start="2025-09-22",
            date_end="2025-09-22",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=280.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-09-22 14:30:00.000000",
            modified="2025-09-24 10:00:00.000000",
        ),
        _mock_claim_record(
            name="b8c9d0e1-2345-67g1-2345-999999999999",
            claim_id="b8c9d0e1-2345-67g1-2345-999999999999",
            client="CR6582321887359-9",
            client_name="WAMBUI GRACE NJERI",
            claim_status="approved",
            scheme_id="CAT-SHA-001",
            insurer="SOCIAL HEALTH AUTHORITY",
            diagnoses="Dermatitis, unspecified",
            interventions="Consultation, Prescription, drug administration and dispensing",
            date_start="2025-10-03",
            date_end="2025-10-03",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=195.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-10-03 11:45:00.000000",
            modified="2025-10-04 09:00:00.000000",
        ),
        _mock_claim_record(
            name="c9d0e1f2-3456-78h2-3456-aaaaaaaaaaaa",
            claim_id="c9d0e1f2-3456-78h2-3456-aaaaaaaaaaaa",
            client="CR6582321887360-0",
            client_name="OMONDI JOHN OKOTH",
            claim_status="pending",
            scheme_id="CAT-SHA-002",
            insurer="NHIF",
            diagnoses="Gastritis",
            interventions="Consultation, Laboratory Investigation, Prescription",
            date_start="2025-10-14",
            date_end="2025-10-14",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=540.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-10-14 08:00:00.000000",
            modified="2025-10-14 08:00:00.000000",
        ),
        _mock_claim_record(
            name="d0e1f2g3-4567-89i3-4567-bbbbbbbbbbbb",
            claim_id="d0e1f2g3-4567-89i3-4567-bbbbbbbbbbbb",
            client="CR6582321887361-1",
            client_name="CHEPKORIR SARAH JEPTOO",
            claim_status="approved",
            scheme_id="CAT-SHA-001",
            insurer="SOCIAL HEALTH AUTHORITY",
            diagnoses="Acute conjunctivitis",
            interventions="Consultation, Prescription",
            date_start="2025-09-18",
            date_end="2025-09-18",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=120.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-09-18 15:20:00.000000",
            modified="2025-09-19 08:30:00.000000",
        ),
        _mock_claim_record(
            name="e1f2g3h4-5678-90j4-5678-cccccccccccc",
            claim_id="e1f2g3h4-5678-90j4-5678-cccccccccccc",
            client="CR6582321887362-2",
            client_name="KIPTO DENIS KIBET",
            claim_status="rejected",
            scheme_id="CAT-SHA-002",
            insurer="NHIF",
            diagnoses="Low back pain",
            interventions="Consultation, Prescription",
            date_start="2025-10-01",
            date_end="2025-10-01",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=410.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-10-01 13:00:00.000000",
            modified="2025-10-03 11:00:00.000000",
        ),
        _mock_claim_record(
            name="f2g3h4i5-6789-01k5-6789-dddddddddddd",
            claim_id="f2g3h4i5-6789-01k5-6789-dddddddddddd",
            client="CR6582321887363-3",
            client_name="ATIENO MERCY ADHIAMBO",
            claim_status="pending",
            scheme_id="CAT-SHA-001",
            insurer="SOCIAL HEALTH AUTHORITY",
            diagnoses="Upper respiratory infection, unspecified",
            interventions="Consultation, Prescription",
            date_start="2025-10-16",
            date_end="2025-10-16",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=250.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-10-16 10:30:00.000000",
            modified="2025-10-16 10:30:00.000000",
        ),
        _mock_claim_record(
            name="g3h4i5j6-7890-12l6-7890-eeeeeeeeeeee",
            claim_id="g3h4i5j6-7890-12l6-7890-eeeeeeeeeeee",
            client="CR6582321887364-4",
            client_name="MUTUA DANIEL KIVUVA",
            claim_status="approved",
            scheme_id="CAT-SHA-001",
            insurer="SOCIAL HEALTH AUTHORITY",
            diagnoses="Intestinal helminthiasis",
            interventions="Consultation, Laboratory Investigation, Prescription",
            date_start="2025-09-25",
            date_end="2025-09-25",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=470.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-09-25 09:00:00.000000",
            modified="2025-09-26 14:00:00.000000",
        ),
        _mock_claim_record(
            name="h4i5j6k7-8901-23m7-8901-ffffffffffff",
            claim_id="h4i5j6k7-8901-23m7-8901-ffffffffffff",
            client="CR6582321887365-5",
            client_name="NYAMBURA CATHERINE WANJIKU",
            claim_status="rejected",
            scheme_id="CAT-SHA-002",
            insurer="NHIF",
            diagnoses="Migraine",
            interventions="Consultation, Prescription",
            date_start="2025-10-07",
            date_end="2025-10-07",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=320.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-10-07 11:15:00.000000",
            modified="2025-10-08 09:00:00.000000",
        ),
        _mock_claim_record(
            name="i5j6k7l8-9012-34n8-9012-000000000001",
            claim_id="i5j6k7l8-9012-34n8-9012-000000000001",
            client="CR6582321887366-6",
            client_name="OUMA BENARD OTIENO",
            claim_status="approved",
            scheme_id="CAT-SHA-001",
            insurer="SOCIAL HEALTH AUTHORITY",
            diagnoses="Acute tonsillitis",
            interventions="Consultation, Prescription, drug administration and dispensing",
            date_start="2025-09-30",
            date_end="2025-09-30",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=180.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-09-30 16:45:00.000000",
            modified="2025-10-01 08:00:00.000000",
        ),
        _mock_claim_record(
            name="j6k7l8m9-0123-45o9-0123-000000000002",
            claim_id="j6k7l8m9-0123-45o9-0123-000000000002",
            client="CR6582321887367-7",
            client_name="ADHIAMBO ROSE AKOTH",
            claim_status="pending",
            scheme_id="CAT-SHA-001",
            insurer="SOCIAL HEALTH AUTHORITY",
            diagnoses="Anaemia, unspecified",
            interventions="Consultation, Laboratory Investigation, Prescription",
            date_start="2025-10-18",
            date_end="2025-10-18",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=760.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-10-18 08:20:00.000000",
            modified="2025-10-18 08:20:00.000000",
        ),
        _mock_claim_record(
            name="k7l8m9n0-1234-56p0-1234-000000000003",
            claim_id="k7l8m9n0-1234-56p0-1234-000000000003",
            client="CR6582321887368-8",
            client_name="KIMELI EZRA KIPTO",
            claim_status="approved",
            scheme_id="CAT-SHA-002",
            insurer="NHIF",
            diagnoses="Superficial injury of knee",
            interventions="Consultation, Prescription",
            date_start="2025-10-11",
            date_end="2025-10-11",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=290.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-10-11 14:00:00.000000",
            modified="2025-10-12 10:00:00.000000",
        ),
        _mock_claim_record(
            name="l8m9n0o1-2345-67q1-2345-000000000004",
            claim_id="l8m9n0o1-2345-67q1-2345-000000000004",
            client="CR6582321887369-9",
            client_name="WANJIRU ESTHER NYOKABI",
            claim_status="rejected",
            scheme_id="CAT-SHA-001",
            insurer="SOCIAL HEALTH AUTHORITY",
            diagnoses="Dyspepsia",
            interventions="Consultation",
            date_start="2025-09-12",
            date_end="2025-09-12",
            claim_subtype="op",
            claim_type="institutional",
            claim_amount=95.0,
            facility="FID-14-116984-2",
            facility_name="KIAMURINGA DISPENSARY",
            county="EMBU",
            sub_county="MBEERE SOUTH",
            creation="2025-09-12 12:30:00.000000",
            modified="2025-09-13 09:00:00.000000",
        ),
    ]


def _get_mock_claims(
    facilities: Optional[List[str]] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    insurer: Optional[str] = None,
    use: Optional[str] = None,
    claim_upstream_error_group: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[List[Dict[str, Any]], int, Dict[str, Any]]:
    """
    Mock data for UI review. Uses _get_all_mock_claims_list() then applies filters.
    Returns (items, total_count, summary_dict).
    """
    all_mock = _get_all_mock_claims_list()
    # Optional filter by status
    if status:
        status_lower = status.strip().lower()
        all_mock = [r for r in all_mock if (r.get("claim_status") or "").lower() == status_lower]
    # Optional filter by facility
    if facilities:
        facility_set = {f.strip() for f in facilities if f and f.strip()}
        if facility_set:
            all_mock = [r for r in all_mock if (r.get("facility") or "") in facility_set]
    # Optional filter by month (date_start in range)
    if date_from or date_to:
        d_from = getdate(date_from) if date_from else None
        d_to = getdate(date_to) if date_to else None
        def in_range(r: Dict[str, Any]) -> bool:
            ds = r.get("date_start")
            if not ds:
                return True
            try:
                d = getdate(ds)
                if d_from and d < d_from:
                    return False
                if d_to and d > d_to:
                    return False
                return True
            except Exception:
                return True
        all_mock = [r for r in all_mock if in_range(r)]
    # Optional filter by insurer
    if insurer:
        ins = insurer.strip().lower()
        all_mock = [r for r in all_mock if (r.get("insurer") or "").strip().lower() == ins]
    # Optional filter by use
    if use:
        u = use.strip().lower()
        all_mock = [r for r in all_mock if (r.get("use") or "claim").strip().lower() == u]
    # Optional filter by claim_upstream_error_group
    if claim_upstream_error_group:
        eg = claim_upstream_error_group.strip().lower()
        all_mock = [r for r in all_mock if (r.get("claim_upstream_error_group") or "").strip().lower() == eg]
    total_count = len(all_mock)
    items = all_mock[offset : offset + limit]
    # Summary: by_status counts, by_status_amount, total amount
    by_status: Dict[str, int] = {}
    by_status_amount: Dict[str, float] = {}
    total_amount = 0.0
    for r in all_mock:
        s = (r.get("claim_status") or "unknown").lower()
        by_status[s] = by_status.get(s, 0) + 1
        amt = float(r.get("claim_amount") or 0)
        by_status_amount[s] = by_status_amount.get(s, 0.0) + amt
        total_amount += amt
    summary = {
        "total_count": total_count,
        "by_status": by_status,
        "by_status_amount": {k: round(v, 2) for k, v in by_status_amount.items()},
        "total_amount": round(total_amount, 2),
    }
    return items, total_count, summary


def _use_mock_claims() -> bool:
    """Use mock data only when Facility Claim doctype is missing (or site_config claims_use_mock=1)."""
    if not frappe.db.table_exists("Facility Claim"):
        return True
    return bool(frappe.conf.get("claims_use_mock"))


def _get_real_claims(
    facilities: Optional[List[str]] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    insurer: Optional[str] = None,
    use: Optional[str] = None,
    claim_upstream_error_group: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[List[Dict[str, Any]], int, Dict[str, Any]]:
    """
    Query Facility Claim doctype. Returns (items, total_count, summary).
    """
    filters = {}
    if facilities:
        filters["facility"] = ["in", facilities]
    if status:
        filters["claim_status"] = status
    if date_from or date_to:
        d_from = getdate(date_from) if date_from else None
        d_to = getdate(date_to) if date_to else None
        if d_from and d_to:
            filters["date_start"] = ["between", [d_from, d_to]]
        elif d_from:
            filters["date_start"] = [">=", d_from]
        elif d_to:
            filters["date_start"] = ["<=", d_to]
    if insurer:
        filters["insurer"] = insurer.strip()
    if use:
        filters["use"] = use.strip()
    if claim_upstream_error_group:
        filters["claim_upstream_error_group"] = claim_upstream_error_group.strip()

    total_count = _count("Facility Claim", filters=filters)
    # Use get_list (not get_all) so Frappe's Role Permissions + User Permissions
    # naturally scope data: company users see their tenant, oversight users see all.
    items = frappe.get_list(
        "Facility Claim",
        filters=filters,
        fields=FACILITY_CLAIM_LIST_FIELDS,
        order_by="modified desc",
        limit_start=offset,
        limit_page_length=limit,
    )

    # Build summary: by_status counts, by_status_amount, total amount (same filters as list)
    summary_filters = dict(filters)
    status_counts = {}
    for row in frappe.get_list(
        "Facility Claim",
        filters=summary_filters,
        fields=["claim_status"],
        limit_page_length=0,
    ):
        s = (row.get("claim_status") or "unknown").lower()
        status_counts[s] = status_counts.get(s, 0) + 1

    # Amount per status: GROUP BY claim_status, SUM(claim_amount)
    by_status_amount: Dict[str, float] = {}
    amt_query = """SELECT claim_status, SUM(claim_amount) AS total FROM `tabFacility Claim` WHERE 1=1"""
    amt_params: Dict[str, Any] = {}
    if facilities:
        amt_query += " AND facility IN %(facilities)s"
        amt_params["facilities"] = facilities
    if status:
        amt_query += " AND claim_status = %(status)s"
        amt_params["status"] = status
    if date_from or date_to:
        d_from = getdate(date_from) if date_from else None
        d_to = getdate(date_to) if date_to else None
        if d_from and d_to:
            amt_query += " AND date_start BETWEEN %(date_from)s AND %(date_to)s"
            amt_params["date_from"] = d_from
            amt_params["date_to"] = d_to
        elif d_from:
            amt_query += " AND date_start >= %(date_from)s"
            amt_params["date_from"] = d_from
        elif d_to:
            amt_query += " AND date_start <= %(date_to)s"
            amt_params["date_to"] = d_to
    if insurer:
        amt_query += " AND insurer = %(insurer)s"
        amt_params["insurer"] = insurer.strip()
    if use:
        amt_query += " AND use = %(use)s"
        amt_params["use"] = use.strip()
    if claim_upstream_error_group:
        amt_query += " AND claim_upstream_error_group = %(claim_upstream_error_group)s"
        amt_params["claim_upstream_error_group"] = claim_upstream_error_group.strip()
    amt_query += " GROUP BY claim_status"
    amt_rows = frappe.db.sql(amt_query, amt_params, as_dict=True)
    for row in amt_rows:
        s = (row.get("claim_status") or "unknown").lower()
        val = row.get("total")
        if val is not None:
            by_status_amount[s] = round(float(val), 2)

    total_amount = 0.0
    sum_query = """SELECT SUM(claim_amount) AS total FROM `tabFacility Claim` WHERE 1=1"""
    sum_params = {}
    if facilities:
        sum_query += " AND facility IN %(facilities)s"
        sum_params["facilities"] = facilities
    if status:
        sum_query += " AND claim_status = %(status)s"
        sum_params["status"] = status
    if date_from or date_to:
        d_from = getdate(date_from) if date_from else None
        d_to = getdate(date_to) if date_to else None
        if d_from and d_to:
            sum_query += " AND date_start BETWEEN %(date_from)s AND %(date_to)s"
            sum_params["date_from"] = d_from
            sum_params["date_to"] = d_to
        elif d_from:
            sum_query += " AND date_start >= %(date_from)s"
            sum_params["date_from"] = d_from
        elif d_to:
            sum_query += " AND date_start <= %(date_to)s"
            sum_params["date_to"] = d_to
    if insurer:
        sum_query += " AND insurer = %(insurer)s"
        sum_params["insurer"] = insurer.strip()
    if use:
        sum_query += " AND use = %(use)s"
        sum_params["use"] = use.strip()
    if claim_upstream_error_group:
        sum_query += " AND claim_upstream_error_group = %(claim_upstream_error_group)s"
        sum_params["claim_upstream_error_group"] = claim_upstream_error_group.strip()
    sum_row = frappe.db.sql(sum_query, sum_params, as_dict=True)
    if sum_row and sum_row[0].get("total") is not None:
        total_amount = float(sum_row[0]["total"])
    summary = {
        "total_count": total_count,
        "by_status": status_counts,
        "by_status_amount": by_status_amount,
        "total_amount": round(total_amount, 2),
    }
    return items, total_count, summary


@frappe.whitelist()
def get_claims_filter_options() -> Dict[str, Any]:
    """
    Return distinct insurers and uses from Facility Claim data for filter dropdowns.
    Uses real DB when available; uses mock data list when using mock claims.
    """
    try:
        if _use_mock_claims():
            data = _get_all_mock_claims_list()
            insurers = sorted(
                {str(r.get("insurer", "")).strip() for r in data if (r.get("insurer") or "").strip()}
            )
            uses = sorted(
                {str(r.get("use") or "claim").strip() for r in data if (r.get("use") or "claim").strip()}
            )
        else:
            insurers = [
                row[0]
                for row in frappe.db.sql(
                    """SELECT DISTINCT insurer FROM `tabFacility Claim`
                       WHERE insurer IS NOT NULL AND TRIM(insurer) != ''
                       ORDER BY insurer""",
                    as_list=True,
                )
            ]
            uses = [
                row[0]
                for row in frappe.db.sql(
                    """SELECT DISTINCT COALESCE(NULLIF(TRIM(use), ''), 'claim') AS use
                       FROM `tabFacility Claim`
                       ORDER BY use""",
                    as_list=True,
                )
            ]
            uses = sorted(set(uses))
        return api_response(
            success=True,
            data={"insurers": insurers, "uses": uses},
        )
    except Exception:
        frappe.log_error(frappe.get_traceback(), "Get Claims Filter Options API Error")
        return api_response(success=False, message="Unable to load filter options. Please try again.", status_code=500)


@frappe.whitelist()
def get_facility_claims(
    facilities: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    insurer: Optional[str] = None,
    use: Optional[str] = None,
    claim_upstream_error_group: Optional[str] = None,
):
    """
    Get facility claims: summary, total count, and paginated records.

    Args:
        facilities: Comma-separated facility IDs (e.g. FR code or docname).
        page: Page number (1-based).
        page_size: Items per page.
        status: Optional filter by claim_status (e.g. approved, pending, rejected).
        date_from: Optional filter start (YYYY-MM-DD), e.g. first day of month.
        date_to: Optional filter end (YYYY-MM-DD), e.g. last day of month.
        insurer: Optional filter by insurer.
        use: Optional filter by use (e.g. claim, preauth).
        claim_upstream_error_group: Optional filter by claim upstream error group.

    Returns:
        {
            "summary": { "total_count", "by_status", "by_status_amount", "total_amount" },
            "total_count": int,
            "page": int,
            "page_size": int,
            "items": [ { claim_id, client_name, claim_status, ... } ]
        }
    """
    try:
        page = max(1, int(page))
        page_size = max(1, min(1000, int(page_size)))
        offset = (page - 1) * page_size

        facility_list = None
        if facilities and isinstance(facilities, str):
            raw = [f.strip() for f in facilities.split(",") if f.strip()]
            if raw:
                # Resolve to Health Facility docnames (facility is a Link to Health Facility)
                docnames = set()
                for ref in raw:
                    resolved = resolve_health_facility_reference(ref)
                    if resolved.get("facility_docname"):
                        docnames.add(resolved["facility_docname"])
                    else:
                        docnames.add(ref)  # use as-is if already a docname
                facility_list = list(docnames)
        # If facility_list is empty/None, don't filter - return all data user has permission to see
        # (avoid filtering by empty list which returns no results)

        date_from_n = _normalize_optional_string(date_from)
        date_to_n = _normalize_optional_string(date_to)
        insurer_n = _normalize_optional_string(insurer)
        use_n = _normalize_optional_string(use)
        error_group_n = _normalize_optional_string(claim_upstream_error_group)

        if _use_mock_claims():
            items, total_count, summary = _get_mock_claims(
                facilities=facility_list,
                status=status,
                date_from=date_from_n,
                date_to=date_to_n,
                insurer=insurer_n,
                use=use_n,
                claim_upstream_error_group=error_group_n,
                limit=page_size,
                offset=offset,
            )
        else:
            items, total_count, summary = _get_real_claims(
                facilities=facility_list or None,
                status=status,
                date_from=date_from_n,
                date_to=date_to_n,
                insurer=insurer_n,
                use=use_n,
                claim_upstream_error_group=error_group_n,
                limit=page_size,
                offset=offset,
            )

        _mask_claim_items(items)

        return api_response(
            success=True,
            data={
                "summary": summary,
                "total_count": total_count,
                "page": page,
                "page_size": page_size,
                "items": items,
            },
        )
    except frappe.PermissionError:
        return api_response(success=False, message="You do not have permission to view these claims. Please contact your administrator.", status_code=403)
    except Exception:
        frappe.log_error(frappe.get_traceback(), "Get Facility Claims API Error")
        return api_response(success=False, message="Unable to load claims data. Please try again or contact support.", status_code=500)


def _facility_claim_allowed_fieldnames() -> set:
    """Return set of Facility Claim field names that are allowed for create/update (no section/column breaks)."""
    meta = frappe.get_meta("Facility Claim")
    skip_types = {"Section Break", "Column Break"}
    return {f.fieldname for f in meta.fields if f.fieldtype not in skip_types}


@frappe.whitelist(methods=["POST"])
def create_facility_claim(**kwargs) -> Dict[str, Any]:
    """
    Create a Facility Claim document. Accepts kwargs for claim fields.
    Does not insert if a claim with the same claim_id already exists (no duplicates).

    Returns:
        success=True, data={ name, claim_id } on create;
        success=False, message=... on duplicate or error.
    """
    kwargs.pop("cmd", None)

    if not frappe.db.table_exists("Facility Claim"):
        return api_response(success=False, message="Facility Claim doctype is not available.", status_code=503)

    claim_id = kwargs.get("claim_id")
    if not claim_id or not str(claim_id).strip():
        return api_response(success=False, message="claim_id is required.", status_code=400)

    claim_id = str(claim_id).strip()

    if frappe.db.exists("Facility Claim", claim_id):
        return api_response(
            success=False,
            message=f"A Facility Claim with claim_id '{claim_id}' already exists. Duplicate claims are not allowed.",
            status_code=409,
        )

    allowed = _facility_claim_allowed_fieldnames()
    payload = {k: v for k, v in kwargs.items() if k in allowed}

    try:
        doc = frappe.new_doc("Facility Claim")
        doc.update(payload)
        doc.flags.ignore_permissions = False
        doc.insert()
        return api_response(
            success=True,
            data={"name": doc.name, "claim_id": doc.claim_id},
            message="Facility Claim created.",
            status_code=201,
        )
    except frappe.PermissionError:
        return api_response(success=False, message="You do not have permission to create claims.", status_code=403)
    except Exception:
        frappe.log_error(frappe.get_traceback(), "Create Facility Claim API Error")
        return api_response(success=False, message="Unable to create claim. Please try again or contact support.", status_code=500)


@frappe.whitelist()
def get_facility_claim_filter_options(
    facilities: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Get distinct filter options for Insurer, Use, and Error Group.
    These are used to populate dropdown filters in the Claims list UI.

    Args:
        facilities: Optional comma-separated facility IDs to scope the options.

    Returns:
        {
            "insurers": ["NHIF", "SOCIAL HEALTH AUTHORITY", ...],
            "uses": ["claim", "preauthorization", ...],
            "error_groups": ["Invalid diagnosis code", ...]
        }
    """
    if not frappe.db.table_exists("Facility Claim"):
        return api_response(success=False, message="Facility Claim doctype is not available.", status_code=503)

    try:
        # Resolve facility filter to docnames
        facility_filter = None
        if facilities and isinstance(facilities, str):
            raw = [f.strip() for f in facilities.split(",") if f.strip()]
            if raw:
                docnames = set()
                for ref in raw:
                    resolved = resolve_health_facility_reference(ref)
                    if resolved.get("facility_docname"):
                        docnames.add(resolved["facility_docname"])
                    else:
                        docnames.add(ref)
                facility_filter = ["in", list(docnames)]

        common_filters = {}
        if facility_filter:
            common_filters["facility"] = facility_filter

        # Use get_list so User Permissions scope the filter options to the user's tenant
        insurer_rows = frappe.get_list(
            "Facility Claim",
            filters=common_filters,
            distinct=True,
            pluck="insurer",
            limit_page_length=0,
        )
        insurers = sorted([i for i in insurer_rows if i])

        use_rows = frappe.get_list(
            "Facility Claim",
            filters=common_filters,
            distinct=True,
            pluck="use",
            limit_page_length=0,
        )
        uses = sorted([u for u in use_rows if u])

        error_group_rows = frappe.get_list(
            "Facility Claim",
            filters=common_filters,
            distinct=True,
            pluck="claim_upstream_error_group",
            limit_page_length=0,
        )
        error_groups = sorted([e for e in error_group_rows if e])

        return api_response(
            success=True,
            data={
                "insurers": insurers,
                "uses": uses,
                "error_groups": error_groups,
            },
        )
    except Exception:
        frappe.log_error(frappe.get_traceback(), "Get Facility Claim Filter Options API Error")
        return api_response(success=False, message="Unable to load filter options. Please try again.", status_code=500)
