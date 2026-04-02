import unittest
from datetime import date
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from careverse_hq.api import affiliations as affiliations_api
from careverse_hq.api.facility_affiliation_status import (
    CANONICAL_TERMINATED_AFFILIATION_STATUS,
    is_terminated_facility_affiliation_status,
    normalize_facility_affiliation_status,
)


class FakeMeta:
    def __init__(self, fields):
        self._fields = set(fields or [])

    def has_field(self, fieldname):
        return fieldname in self._fields

    def get_field(self, fieldname):
        return SimpleNamespace(fieldtype="Data", options="")


class FakeRow(dict):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.meta = FakeMeta({"affiliation_status"})

    def __getattr__(self, item):
        if item in self:
            return self[item]
        raise AttributeError(item)

    def __setattr__(self, key, value):
        if key == "meta":
            object.__setattr__(self, key, value)
            return
        self[key] = value


class FakeDoc:
    def __init__(self, **kwargs):
        fields = kwargs.pop("_fields", kwargs.keys())
        self.data = dict(kwargs)
        self.meta = FakeMeta(fields)
        self.save = MagicMock()
        self.add_comment = MagicMock()

    def get(self, key, default=None):
        return self.data.get(key, default)

    def set(self, key, value):
        self.data[key] = value

    def __getattr__(self, item):
        if item in self.data:
            return self.data[item]
        raise AttributeError(item)

    def __setattr__(self, key, value):
        if key in {"data", "meta", "save", "add_comment"}:
            object.__setattr__(self, key, value)
            return
        self.data[key] = value


class TestFacilityAffiliationStatusHelpers(unittest.TestCase):
    def test_normalize_legacy_inactive_to_terminated(self):
        self.assertEqual(
            normalize_facility_affiliation_status("Inactive"),
            CANONICAL_TERMINATED_AFFILIATION_STATUS,
        )
        self.assertTrue(is_terminated_facility_affiliation_status("Inactive"))
        self.assertTrue(
            is_terminated_facility_affiliation_status(
                CANONICAL_TERMINATED_AFFILIATION_STATUS
            )
        )


class TestTerminateAffiliation(unittest.TestCase):
    def setUp(self):
        self.affiliation_doc = FakeDoc(
            name="AFF-001",
            affiliation_status="Active",
            employee="EMP-001",
            health_professional="HP-001",
            health_professional_name="Jane Doe",
            requested_by="facility.admin@example.com",
            user="worker@example.com",
            _fields={
                "affiliation_status",
                "termination_reason",
                "termination_date",
                "terminated_by",
                "termination_documents",
                "end_date",
                "employee",
                "health_professional",
                "health_professional_name",
                "requested_by",
                "user",
            },
        )
        self.hp_row = FakeRow(
            facility_affiliation="AFF-001",
            affiliation_status="Active",
        )
        self.hp_doc = FakeDoc(
            name="HP-001",
            professional_affiliations=[self.hp_row],
            _fields={"professional_affiliations"},
        )
        self.employee_doc = FakeDoc(
            name="EMP-001",
            status="Active",
            _fields={"status", "relieving_date", "date_of_leaving"},
        )

        fake_db = SimpleNamespace(
            exists=MagicMock(side_effect=self._exists),
            set_value=MagicMock(),
            commit=MagicMock(),
        )
        self.fake_frappe = SimpleNamespace(
            session=SimpleNamespace(user="central.admin@example.com"),
            db=fake_db,
            get_doc=MagicMock(side_effect=self._get_doc),
            log_error=MagicMock(),
            get_traceback=MagicMock(return_value="traceback"),
            PermissionError=type("PermissionError", (Exception,), {}),
        )

    def _get_doc(self, doctype, name):
        mapping = {
            ("Facility Affiliation", "AFF-001"): self.affiliation_doc,
            ("Health Professional", "HP-001"): self.hp_doc,
            ("Employee", "EMP-001"): self.employee_doc,
        }
        return mapping[(doctype, name)]

    def _exists(self, doctype, name=None):
        if isinstance(name, str):
            return (doctype, name) in {
                ("Facility Affiliation", "AFF-001"),
                ("Health Professional", "HP-001"),
                ("Employee", "EMP-001"),
            }
        return doctype == "Facility Affiliation"

    def test_terminate_affiliation_uses_canonical_terminated_status(self):
        with (
            patch("careverse_hq.api.affiliations.frappe", self.fake_frappe),
            patch("careverse_hq.api.affiliations.api_response", side_effect=lambda **kw: kw),
            patch("careverse_hq.api.affiliations._verify_termination_otp", return_value=None),
            patch("careverse_hq.api.affiliations._ensure_terminated_status_metadata"),
            patch("careverse_hq.api.affiliations._dispatch_termination_notifications") as notify_mock,
            patch("careverse_hq.api.affiliations._enqueue_termination_c360_sync") as sync_mock,
            patch("careverse_hq.api.affiliations.today", return_value="2026-04-01"),
            patch("careverse_hq.api.affiliations.getdate", return_value=date(2026, 4, 1)),
        ):
            response = affiliations_api.terminate_affiliation(
                affiliation_id="AFF-001",
                termination_reason="End of contract",
                termination_documents=["FILE-001"],
                otp_code="12345",
                otp_id="OTP-001",
            )

        self.assertTrue(response["success"])
        self.assertEqual(
            response["data"]["status"],
            CANONICAL_TERMINATED_AFFILIATION_STATUS,
        )
        self.assertEqual(
            self.affiliation_doc.affiliation_status,
            CANONICAL_TERMINATED_AFFILIATION_STATUS,
        )
        self.assertEqual(
            self.hp_row["affiliation_status"],
            CANONICAL_TERMINATED_AFFILIATION_STATUS,
        )
        self.assertEqual(response["data"]["employee_status"], "Left")
        self.fake_frappe.db.set_value.assert_called_once()
        notify_mock.assert_called_once_with(self.affiliation_doc, "End of contract")
        sync_mock.assert_called_once()

    def test_legacy_inactive_status_returns_already_terminated(self):
        self.affiliation_doc.affiliation_status = "Inactive"

        with (
            patch("careverse_hq.api.affiliations.frappe", self.fake_frappe),
            patch("careverse_hq.api.affiliations.api_response", side_effect=lambda **kw: kw),
            patch("careverse_hq.api.affiliations.today", return_value="2026-04-01"),
        ):
            response = affiliations_api.terminate_affiliation(
                affiliation_id="AFF-001",
                termination_reason="Already processed",
            )

        self.assertTrue(response["success"])
        self.assertEqual(
            response["data"]["status"],
            CANONICAL_TERMINATED_AFFILIATION_STATUS,
        )
