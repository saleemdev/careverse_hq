import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from careverse_hq.api import shift_management as shift_api


def _make_mock_frappe(
    *,
    roles=None,
    can_manage_shift_assignment=True,
    can_create_shift_type=True,
    user="admin@example.com",
):
    permission_error = type("FakePermissionError", (Exception,), {})
    validation_error = type("FakeValidationError", (Exception,), {})

    def _throw(message, exception=Exception):
        raise exception(message)

    return SimpleNamespace(
        session=SimpleNamespace(user=user),
        PermissionError=permission_error,
        ValidationError=validation_error,
        get_roles=lambda _user: list(roles or []),
        has_permission=lambda doctype, ptype=None: (
            (doctype == "Shift Assignment" and can_manage_shift_assignment)
            or (doctype == "Shift Type" and can_create_shift_type)
        ),
        throw=_throw,
        log_error=MagicMock(),
        get_traceback=lambda: "traceback",
        db=SimpleNamespace(
            get_value=MagicMock(return_value=None),
            exists=MagicMock(return_value=False),
        ),
    )


class TestShiftManagementApi(unittest.TestCase):
    def test_get_shift_dashboard_requires_admin_role(self):
        fake_frappe = _make_mock_frappe(roles=[])

        with (
            patch.object(shift_api, "frappe", fake_frappe),
            patch.object(shift_api, "_", side_effect=lambda message: message),
            patch.object(shift_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = shift_api.get_shift_dashboard()

        self.assertFalse(response["success"])
        self.assertEqual(response["status_code"], 403)
        self.assertIn("Permission denied", response["message"])

    def test_get_shift_assignments_fails_closed_when_requested_facilities_not_allowed(self):
        fake_frappe = _make_mock_frappe(roles=["System Manager"])

        with (
            patch.object(shift_api, "frappe", fake_frappe),
            patch.object(shift_api, "_", side_effect=lambda message: message),
            patch.object(shift_api, "validate_user_facilities", return_value=[]),
            patch.object(shift_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = shift_api.get_shift_assignments(
                facilities="FAC-OUT-1",
                page=2,
                page_size=15,
                date_from="2026-04-01",
                date_to="2026-04-30",
            )

        self.assertTrue(response["success"])
        payload = response["data"]
        self.assertEqual(payload["items"], [])
        self.assertEqual(payload["total_count"], 0)
        self.assertEqual(payload["page"], 2)
        self.assertEqual(payload["page_size"], 15)

    def test_get_shift_filter_options_fails_closed_for_invalid_requested_facilities(self):
        fake_frappe = _make_mock_frappe(roles=["System Manager"])

        with (
            patch.object(shift_api, "frappe", fake_frappe),
            patch.object(shift_api, "_", side_effect=lambda message: message),
            patch.object(shift_api, "validate_user_facilities", return_value=[]),
            patch.object(shift_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = shift_api.get_shift_filter_options(facilities="FAC-OUT-1,FAC-OUT-2")

        self.assertTrue(response["success"])
        payload = response["data"]
        self.assertEqual(payload["facilities"], [])
        self.assertEqual(payload["employees"], [])
        self.assertEqual(payload["shift_types"], [])
        self.assertEqual(payload["shift_status_options"], shift_api.SHIFT_STATUS_OPTIONS)
        self.assertEqual(payload["attendance_status_options"], shift_api.ATTENDANCE_STATUS_OPTIONS)

    def test_create_shift_assignment_requires_core_fields(self):
        fake_frappe = _make_mock_frappe(roles=["System Manager"], can_manage_shift_assignment=True)

        with (
            patch.object(shift_api, "frappe", fake_frappe),
            patch.object(shift_api, "_", side_effect=lambda message: message),
            patch.object(shift_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = shift_api.create_shift_assignment(
                employee=None,
                shift_type="Day Shift",
                start_date="2026-04-05",
            )

        self.assertFalse(response["success"])
        self.assertEqual(response["status_code"], 400)
        self.assertIn("required", response["message"])

    def test_create_shift_assignment_rejects_employee_outside_scope(self):
        fake_frappe = _make_mock_frappe(roles=["System Manager"], can_manage_shift_assignment=True)

        with (
            patch.object(shift_api, "frappe", fake_frappe),
            patch.object(shift_api, "_", side_effect=lambda message: message),
            patch.object(shift_api, "_resolve_facility_scope", return_value=(["FAC-001"], False)),
            patch.object(shift_api, "_get_scoped_employee_rows", return_value=[]),
            patch.object(shift_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = shift_api.create_shift_assignment(
                employee="EMP-001",
                shift_type="Day Shift",
                start_date="2026-04-05",
            )

        self.assertFalse(response["success"])
        self.assertEqual(response["status_code"], 403)
        self.assertIn("Permission denied", response["message"])

    def test_reassign_shift_assignment_requires_required_fields(self):
        fake_frappe = _make_mock_frappe(roles=["System Manager"], can_manage_shift_assignment=True)

        with (
            patch.object(shift_api, "frappe", fake_frappe),
            patch.object(shift_api, "_", side_effect=lambda message: message),
            patch.object(shift_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = shift_api.reassign_shift_assignment(
                source_shift=None,
                target_employee="EMP-002",
                target_date="2026-04-05",
            )

        self.assertFalse(response["success"])
        self.assertEqual(response["status_code"], 400)
        self.assertIn("required", response["message"])

    def test_create_shift_type_requires_required_fields(self):
        fake_frappe = _make_mock_frappe(
            roles=["System Manager"],
            can_manage_shift_assignment=True,
            can_create_shift_type=True,
        )

        with (
            patch.object(shift_api, "frappe", fake_frappe),
            patch.object(shift_api, "_", side_effect=lambda message: message),
            patch.object(shift_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = shift_api.create_shift_type(
                name="",
                start_time="08:00",
                end_time="17:00",
            )

        self.assertFalse(response["success"])
        self.assertEqual(response["status_code"], 400)
        self.assertIn("required", response["message"])

    def test_create_shift_type_requires_shift_type_create_permission(self):
        fake_frappe = _make_mock_frappe(
            roles=["System Manager"],
            can_manage_shift_assignment=True,
            can_create_shift_type=False,
        )

        with (
            patch.object(shift_api, "frappe", fake_frappe),
            patch.object(shift_api, "_", side_effect=lambda message: message),
            patch.object(shift_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = shift_api.create_shift_type(
                name="Day Shift",
                start_time="08:00",
                end_time="17:00",
            )

        self.assertFalse(response["success"])
        self.assertEqual(response["status_code"], 403)
        self.assertIn("Permission denied", response["message"])


if __name__ == "__main__":
    unittest.main()
