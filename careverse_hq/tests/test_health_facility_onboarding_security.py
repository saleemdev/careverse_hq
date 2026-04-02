import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from careverse_hq.api import facility_onboarding_v2 as onboarding_api


def _fake_does_not_exist():
    return type("FakeDoesNotExistError", (Exception,), {})


def _make_mock_frappe(*, user=None):
    does_not_exist = _fake_does_not_exist()
    return SimpleNamespace(
        session={"user": user} if user else {},
        DoesNotExistError=does_not_exist,
        db=SimpleNamespace(),
        log_error=MagicMock(),
    )


class TestFacilityOnboardingSecurity(unittest.TestCase):
    def test_fetch_facility_details_requires_authenticated_user(self):
        fake_frappe = _make_mock_frappe(user=None)

        with (
            patch.object(onboarding_api, "frappe", fake_frappe),
            patch.object(onboarding_api, "fetch_facility_local", return_value={"success": False}),
            patch.object(
                onboarding_api,
                "fetch_facility_hwr_fr",
                return_value={
                    "facility_fid": "FAC-100",
                    "facility_name": "Unauthenticated Facility",
                    "owner_id_number": "12345678",
                },
            ),
            patch.object(onboarding_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = onboarding_api.fetch_facility_details(facility_id="FAC-100")

        self.assertFalse(response["success"])
        self.assertEqual(response["status_code"], 401)
        self.assertIn("logged in", response["message"])

    def test_fetch_facility_details_requires_existing_healthcare_user(self):
        fake_frappe = _make_mock_frappe(user="owner@example.com")

        with (
            patch.object(onboarding_api, "frappe", fake_frappe),
            patch.object(onboarding_api, "fetch_facility_local", return_value={"success": False}),
            patch.object(
                onboarding_api,
                "fetch_facility_hwr_fr",
                return_value={
                    "facility_fid": "FAC-101",
                    "facility_name": "Missing HOU Facility",
                    "owner_id_number": "12345678",
                },
            ),
            patch.object(
                onboarding_api,
                "_get_healthcare_user",
                side_effect=fake_frappe.DoesNotExistError("missing"),
            ),
            patch.object(onboarding_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = onboarding_api.fetch_facility_details(facility_id="FAC-101")

        self.assertFalse(response["success"])
        self.assertEqual(response["status_code"], 400)
        self.assertIn("register your account", response["message"])

    def test_fetch_facility_hwr_fr_does_not_log_authorization_header_or_token(self):
        fake_frappe = _make_mock_frappe(user="owner@example.com")
        fake_frappe.db.get_singles_dict = MagicMock(
            return_value=SimpleNamespace(
                hie_url="https://registry.example.com",
                hfr_fetch_url="/facility/search",
            )
        )

        response = MagicMock()
        response.raise_for_status.return_value = None
        response.json.return_value = {"message": {"facility_fid": "FAC-102"}}

        with (
            patch.object(onboarding_api, "frappe", fake_frappe),
            patch.object(onboarding_api._hie, "generate_jwt_token", return_value="super-secret-token"),
            patch.object(onboarding_api.requests, "get", return_value=response),
        ):
            payload = onboarding_api.fetch_facility_hwr_fr(facility_id="FAC-102")

        log_messages = " ".join(
            str(call.kwargs.get("message", "")) for call in fake_frappe.log_error.call_args_list
        )

        self.assertEqual(payload["facility_fid"], "FAC-102")
        self.assertNotIn("Authorization", log_messages)
        self.assertNotIn("Bearer", log_messages)
        self.assertNotIn("super-secret-token", log_messages)
