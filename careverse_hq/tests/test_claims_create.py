"""
Tests for create_facility_claim API (Facility Claim for KENYATTA NATIONAL HOSPITAL).
Run with: bench --site <site> run-tests --module careverse_hq.tests.test_claims_create

Successful creates are committed so you can see the new Facility Claim records in the UI.
"""
import unittest
import uuid

import frappe

from careverse_hq.api.claims import create_facility_claim


def _knh_facility_docname():
    """Resolve Health Facility docname for KENYATTA NATIONAL HOSPITAL (KNH-001)."""
    name = frappe.db.get_value("Health Facility", "KNH-001", "name")
    if name:
        return name
    return frappe.db.get_value("Health Facility", {"facility_name": "KENYATTA NATIONAL HOSPITAL"}, "name")


class TestCreateFacilityClaimKNH(unittest.TestCase):
    """Five tests for create_facility_claim targeting KENYATTA NATIONAL HOSPITAL."""

    def test_1_create_success_for_kenyatta_national_hospital(self):
        """Create a Facility Claim for KENYATTA NATIONAL HOSPITAL; expect 201 and data.name, data.claim_id."""
        claim_id = f"test-knh-{uuid.uuid4().hex[:12]}"
        facility = _knh_facility_docname()
        kwargs = {
            "claim_id": claim_id,
            "client": "CR-TEST-001",
            "client_name": "Test Patient",
            "claim_status": "pending",
            "date_start": "2025-10-01",
            "date_end": "2025-10-01",
            "claim_amount": 500.0,
            "use": "claim",
        }
        if facility:
            kwargs["facility"] = facility
        out = create_facility_claim(**kwargs)
        self.assertEqual(frappe.local.response.http_status_code, 201, out)
        self.assertEqual(out.get("status"), "success", out)
        self.assertIn("data", out)
        self.assertEqual(out["data"].get("claim_id"), claim_id)
        self.assertEqual(out["data"].get("name"), claim_id)
        frappe.db.commit()

    def test_2_duplicate_claim_id_rejected(self):
        """Create same claim_id twice; second call must return 409 and must not create duplicate."""
        claim_id = f"test-knh-dup-{uuid.uuid4().hex[:12]}"
        facility = _knh_facility_docname()
        kwargs = {"claim_id": claim_id, "claim_status": "pending", "date_start": "2025-10-01", "date_end": "2025-10-01"}
        if facility:
            kwargs["facility"] = facility
        first = create_facility_claim(**kwargs)
        self.assertEqual(frappe.local.response.http_status_code, 201, first)
        self.assertEqual(first.get("status"), "success")
        frappe.db.commit()
        second = create_facility_claim(**kwargs)
        self.assertEqual(frappe.local.response.http_status_code, 409, second)
        self.assertEqual(second.get("status"), "error")
        self.assertIn("already exists", second.get("message", ""))
        self.assertIn("Duplicate", second.get("message", ""))
        count = frappe.db.count("Facility Claim", {"claim_id": claim_id})
        self.assertEqual(count, 1, "Duplicate must not be inserted")

    def test_3_missing_claim_id_returns_400(self):
        """Call without claim_id; expect 400 and message that claim_id is required."""
        kwargs = {"client": "CR-TEST", "claim_status": "pending"}
        out = create_facility_claim(**kwargs)
        self.assertEqual(frappe.local.response.http_status_code, 400, out)
        self.assertEqual(out.get("status"), "error")
        self.assertIn("claim_id", out.get("message", "").lower())
        self.assertIn("required", out.get("message", "").lower())

    def test_4_empty_claim_id_returns_400(self):
        """Call with claim_id='' or whitespace; expect 400."""
        out = create_facility_claim(claim_id="")
        self.assertEqual(frappe.local.response.http_status_code, 400, out)
        self.assertEqual(out.get("status"), "error")
        self.assertIn("claim_id", out.get("message", "").lower())

    def test_5_create_success_with_full_payload_for_knh(self):
        """Create a Facility Claim with full payload (error group, response, diagnoses, etc.) for KNH."""
        claim_id = f"test-knh-full-{uuid.uuid4().hex[:12]}"
        facility = _knh_facility_docname()
        kwargs = {
            "claim_id": claim_id,
            "client": "CR6582321887399-9",
            "client_name": "Wanjiku Test",
            "claim_status": "rejected",
            "claim_upstream_error_group": "Invalid diagnosis code",
            "claim_upstream_response": "REJ_001",
            "scheme_id": "CAT-SHA-001",
            "insurer": "NHIF",
            "diagnoses": "Hypertension",
            "interventions": "Consultation, Prescription",
            "date_start": "2025-09-15",
            "date_end": "2025-09-16",
            "claim_subtype": "op",
            "claim_type": "institutional",
            "use": "claim",
            "claim_amount": 1200.0,
        }
        if facility:
            kwargs["facility"] = facility
        out = create_facility_claim(**kwargs)
        self.assertEqual(frappe.local.response.http_status_code, 201, out)
        self.assertEqual(out.get("status"), "success")
        self.assertEqual(out["data"].get("claim_id"), claim_id)
        doc = frappe.get_doc("Facility Claim", claim_id)
        self.assertEqual(doc.claim_upstream_error_group, "Invalid diagnosis code")
        self.assertEqual(doc.claim_upstream_response, "REJ_001")
        self.assertEqual(doc.insurer, "NHIF")
        frappe.db.commit()
