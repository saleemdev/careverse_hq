import uuid

import frappe
from frappe import _dict
from frappe.tests.utils import FrappeTestCase

from careverse_hq.api import shift_management as shift_api


class TestShiftManagementIntegration(FrappeTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.non_admin_user = cls._ensure_non_admin_user()

    @classmethod
    def _ensure_non_admin_user(cls) -> str:
        email = f"shift-viewer-{uuid.uuid4().hex[:8]}@example.com"
        if frappe.db.exists("User", email):
            return email

        frappe.get_doc(
            {
                "doctype": "User",
                "email": email,
                "first_name": "Shift",
                "last_name": "Viewer",
                "enabled": 1,
                "send_welcome_email": 0,
                "user_type": "System User",
                "new_password": "test-password",
            }
        ).insert(ignore_permissions=True)
        return email

    def setUp(self):
        super().setUp()
        frappe.set_user("Administrator")
        frappe.local.response = _dict({})

    def tearDown(self):
        frappe.set_user("Administrator")
        super().tearDown()

    def test_dashboard_rejects_non_admin_user(self):
        frappe.set_user(self.non_admin_user)

        response = shift_api.get_shift_dashboard(date_from="2026-04-01", date_to="2026-04-30")

        self.assertEqual(frappe.local.response.http_status_code, 403, response)
        self.assertEqual(response.get("status"), "error", response)
        self.assertIn("Permission denied", response.get("message", ""))

    def test_dashboard_returns_aggregate_shape_for_admin(self):
        response = shift_api.get_shift_dashboard(date_from="2026-04-01", date_to="2026-04-30")

        self.assertEqual(frappe.local.response.http_status_code, 200, response)
        self.assertEqual(response.get("status"), "success", response)
        aggregates = response.get("data", {}).get("status_aggregates", {})
        for fieldname in (
            "total_assignments",
            "active_assignments",
            "inactive_assignments",
            "employees_with_shifts",
            "attendance_records",
            "late_entries",
            "missing_checkouts",
        ):
            self.assertIn(fieldname, aggregates)

    def test_shift_assignments_returns_empty_for_unresolvable_requested_facility(self):
        response = shift_api.get_shift_assignments(
            facilities="NO-SUCH-HF-001",
            page=1,
            page_size=5,
            date_from="2026-04-01",
            date_to="2026-04-30",
        )

        self.assertEqual(frappe.local.response.http_status_code, 200, response)
        self.assertEqual(response.get("status"), "success", response)
        payload = response.get("data", {})
        self.assertEqual(payload.get("items"), [])
        self.assertEqual(payload.get("total_count"), 0)
        self.assertEqual(payload.get("page"), 1)
        self.assertEqual(payload.get("page_size"), 5)

    def test_attendance_visibility_returns_empty_for_unresolvable_requested_facility(self):
        response = shift_api.get_attendance_visibility(
            facilities="NO-SUCH-HF-ATT-001",
            page=1,
            page_size=7,
            date_from="2026-04-01",
            date_to="2026-04-30",
        )

        self.assertEqual(frappe.local.response.http_status_code, 200, response)
        self.assertEqual(response.get("status"), "success", response)
        payload = response.get("data", {})
        self.assertEqual(payload.get("items"), [])
        self.assertEqual(payload.get("total_count"), 0)
        self.assertEqual(payload.get("page"), 1)
        self.assertEqual(payload.get("page_size"), 7)

    def test_create_shift_assignment_requires_required_fields(self):
        response = shift_api.create_shift_assignment(
            employee=None,
            shift_type=None,
            start_date=None,
        )

        self.assertEqual(frappe.local.response.http_status_code, 400, response)
        self.assertEqual(response.get("status"), "error", response)
        self.assertIn("required", response.get("message", "").lower())

    def test_reassign_shift_assignment_requires_required_fields(self):
        response = shift_api.reassign_shift_assignment(
            source_shift=None,
            target_employee=None,
            target_date=None,
        )

        self.assertEqual(frappe.local.response.http_status_code, 400, response)
        self.assertEqual(response.get("status"), "error", response)
        self.assertIn("required", response.get("message", "").lower())

    def test_create_shift_type_requires_required_fields(self):
        response = shift_api.create_shift_type(
            name="",
            start_time="08:00",
            end_time="17:00",
        )

        self.assertEqual(frappe.local.response.http_status_code, 400, response)
        self.assertEqual(response.get("status"), "error", response)
        self.assertIn("required", response.get("message", "").lower())
