"""
Insert 55 sample Facility Claim records for testing.
Includes records for KENYATTA NATIONAL HOSPITAL and other facilities.
Run once after Facility Claim doctype is installed: bench --site <site> migrate
Or manually: bench --site <site> execute careverse_hq.patches.insert_facility_claim_samples.execute
"""
from __future__ import annotations

import frappe
from datetime import date, timedelta
import uuid


def _claim_id() -> str:
    return str(uuid.uuid4())


def _health_facility_docname(facility_id: str) -> str | None:
    """Resolve Health Facility by name or hie_id; return doc name for Link field."""
    if not facility_id:
        return None
    name = frappe.db.get_value("Health Facility", facility_id, "name")
    if name:
        return name
    name = frappe.db.get_value("Health Facility", {"hie_id": facility_id}, "name")
    return name


# Facility presets: (facility_id, facility_name, county, sub_county)
FACILITIES = [
    ("KNH-001", "KENYATTA NATIONAL HOSPITAL", "NAIROBI", "WESTLANDS"),
    ("FID-14-116984-2", "KIAMURINGA DISPENSARY", "EMBU", "MBEERE SOUTH"),
    ("MTRH-001", "MOI TEACHING AND REFERRAL HOSPITAL", "UASIN GISHU", "SOY"),
]

INSURERS = ["SOCIAL HEALTH AUTHORITY", "NHIF", "AAR INSURANCE", "JUBILEE HEALTH"]
SCHEMES = ["CAT-SHA-001", "CAT-SHA-002", "NHIF-SCHEME-01"]
STATUSES = ["approved", "pending", "rejected"]
DIAGNOSES = [
    "Amoebiasis, unspecified",
    "Acute upper respiratory infection",
    "Hypertension",
    "Type 2 diabetes mellitus",
    "Malaria, unspecified",
    "Uncomplicated hypertension",
    "Acute pharyngitis",
    "Urinary tract infection",
    "Acute bronchitis",
    "Dermatitis, unspecified",
    "Gastritis",
    "Acute conjunctivitis",
    "Low back pain",
    "Intestinal helminthiasis",
    "Migraine",
    "Acute tonsillitis",
    "Anaemia, unspecified",
    "Superficial injury of knee",
    "Dyspepsia",
    "Pneumonia, unspecified",
]
INTERVENTIONS = [
    "Consultation",
    "Consultation, Prescription",
    "Consultation, Laboratory Investigation",
    "Consultation, Laboratory Investigation, Prescription",
    "Consultation, Laboratory Investigation, Prescription, drug administration and dispensing",
]

# Kenyan names for client_name (surname first or given first)
CLIENT_NAMES = [
    "MUTUGI BRANDON", "WANJIKU MARY JANE", "OTIENO DAVID PETER", "AKINYI JANE ROSE",
    "KIPCHUMBA JOSEPH", "NJERI MARY WAMBUI", "KAMAU JAMES MWANGI", "ODHIAMBO LUCY ACHIENG",
    "KORIR PETER KIPCHUMBA", "WAMBUI GRACE NJERI", "OMONDI JOHN OKOTH", "CHEPKORIR SARAH JEPTOO",
    "KIPTO DENIS KIBET", "ATIENO MERCY ADHIAMBO", "MUTUA DANIEL KIVUVA", "NYAMBURA CATHERINE WANJIKU",
    "OUMA BENARD OTIENO", "ADHIAMBO ROSE AKOTH", "KIMELI EZRA KIPTO", "WANJIRU ESTHER NYOKABI",
    "ODHIAMBO MICHAEL", "WAMBUA JOSPHINE", "KIPCHUMBA LUCY", "NJOROGE PETER", "AKOTH MERCY",
    "ONYANGO JAMES", "WANJIKU GRACE", "KIBET DANIEL", "CHEBET ROSE", "OTIENO JANE",
    "MWANGI JOSEPH", "ADHIAMBO JOHN", "NYOKABI MARY", "KIPTO SARAH", "ACHIENG LUCY",
    "MUTHONI ANNE", "KAMAU PETER", "WANJIRU JOSEPH", "ODHIAMBO CATHERINE", "KORIR DANIEL",
    "NJERI GRACE", "MUTUA LUCY", "KIBET MERCY", "OUMA ROSE", "WAMBUI JANE",
    "KIPCHUMBA PETER", "AKINYI MARY", "CHEPKORIR LUCY", "NYAMBURA JOSEPH", "BENARD SARAH",
    "JEPTOO DANIEL", "KIVUVA ANNE", "MWANGI CATHERINE", "OKOTH GRACE",
]


def _make_claims() -> list[dict]:
    claims = []
    base_date = date(2025, 9, 1)
    for i in range(55):
        facility_idx = 0 if i < 18 else (1 if i < 40 else 2)  # 18 KNH, 22 Kiamuringa, 15 MTRH
        fid, fname, county, sub_county = FACILITIES[facility_idx]
        facility_docname = _health_facility_docname(fid)
        if not facility_docname:
            continue  # skip if no Health Facility found for this id
        day_offset = (i * 3) % 90
        d = base_date + timedelta(days=day_offset)
        status = STATUSES[i % 3]
        claim_id = _claim_id()
        claims.append({
            "claim_id": claim_id,
            "client": f"CR65823218873{i:02d}-{i % 10}",
            "client_name": CLIENT_NAMES[i % len(CLIENT_NAMES)],
            "claim_status": status,
            "scheme_id": SCHEMES[i % len(SCHEMES)],
            "insurer": INSURERS[i % len(INSURERS)],
            "diagnoses": DIAGNOSES[i % len(DIAGNOSES)],
            "interventions": INTERVENTIONS[i % len(INTERVENTIONS)],
            "date_start": d.isoformat(),
            "date_end": d.isoformat(),
            "claim_subtype": "ip" if i % 5 == 0 else "op",
            "claim_type": "institutional",
            "use": "claim",
            "claim_amount": round((100 + (i * 47) % 1200), 2),
            "facility": facility_docname,
            "facility_name": fname,
            "county": county,
            "sub_county": sub_county,
        })
    return claims


def execute():
    if not frappe.db.table_exists("Facility Claim"):
        frappe.log_error("Facility Claim doctype not found. Run migrate first.", "insert_facility_claim_samples")
        return
    if not frappe.db.table_exists("Health Facility"):
        frappe.log_error("Health Facility doctype not found. Facility Claim links to Health Facility.", "insert_facility_claim_samples")
        return
    existing = frappe.db.count("Facility Claim")
    if existing >= 50:
        print(f"Facility Claim already has {existing} records. Skipping insert.")
        return
    claims = _make_claims()
    if not claims:
        print("No Facility Claim records inserted: no Health Facility found for KNH-001, FID-14-116984-2, or MTRH-001. Create those Health Facilities (or set hie_id) and re-run.")
        return
    frappe.db.begin()
    try:
        for data in claims:
            if frappe.db.exists("Facility Claim", data["claim_id"]):
                continue
            doc = frappe.new_doc("Facility Claim")
            doc.update(data)
            doc.flags.ignore_permissions = True
            doc.flags.ignore_mandatory = True
            doc.insert()
        frappe.db.commit()
        print(f"Inserted Facility Claim sample records. Total: {frappe.db.count('Facility Claim')}")
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(frappe.get_traceback(), "insert_facility_claim_samples")
        raise
