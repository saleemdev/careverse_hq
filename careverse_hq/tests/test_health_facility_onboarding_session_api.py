import unittest
import sys
from types import SimpleNamespace
from unittest.mock import patch

from careverse_hq.api import health_facility_onboarding as onboarding_api


def _make_mock_frappe(user="owner@example.com"):
    does_not_exist = type("FakeDoesNotExistError", (Exception,), {})
    return SimpleNamespace(
        session=SimpleNamespace(user=user),
        DoesNotExistError=does_not_exist,
        local=SimpleNamespace(response={}),
        db=SimpleNamespace(sql=lambda *args, **kwargs: []),
    )


class TestLookupFacility(unittest.TestCase):
    def test_requires_exactly_one_identifier(self):
        fake_frappe = _make_mock_frappe()

        with (
            patch.object(onboarding_api, "frappe", fake_frappe),
            patch.object(onboarding_api, "_", side_effect=lambda message: message),
            patch.object(onboarding_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = onboarding_api.lookup_facility()

        self.assertFalse(response["success"])
        self.assertEqual(response["status_code"], 400)
        self.assertIn("either FID or registration number", response["message"])

    def test_returns_lookup_result_for_matching_owner(self):
        fake_frappe = _make_mock_frappe()
        facility = {
            "facility_fid": "FID-001",
            "facility_name": "Sample Facility",
            "registration_number": "REG-001",
            "facility_type": "Hospital",
            "facility_level": "Level 4",
            "owner_id_number": "12345678",
        }
        healthcare_user = {
            "first_name": "Asha",
            "last_name": "Otieno",
            "identification_number": "12345678",
            "identification_type": "National ID",
        }

        with (
            patch.object(onboarding_api, "frappe", fake_frappe),
            patch.object(onboarding_api, "_", side_effect=lambda message: message),
            patch.object(onboarding_api, "_fetch_registry_facility", return_value=facility),
            patch.object(onboarding_api, "_get_healthcare_user", return_value=healthcare_user),
            patch.object(onboarding_api, "_find_existing_facility", return_value=None),
            patch.object(onboarding_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = onboarding_api.lookup_facility(facility_id="FID-001")

        self.assertTrue(response["success"])
        self.assertEqual(response["status_code"], 200)
        self.assertEqual(response["data"]["facility_preview"]["facility_id"], "FID-001")
        self.assertTrue(response["data"]["can_start_verification"])
        self.assertTrue(response["data"]["owner_match"]["matched"])

    def test_returns_already_onboarded_state(self):
        fake_frappe = _make_mock_frappe()
        facility = {
            "facility_fid": "FID-002",
            "facility_name": "Existing Facility",
            "registration_number": "REG-002",
            "owner_id_number": "12345678",
        }
        healthcare_user = {
            "first_name": "Asha",
            "last_name": "Otieno",
            "identification_number": "12345678",
            "identification_type": "National ID",
        }

        with (
            patch.object(onboarding_api, "frappe", fake_frappe),
            patch.object(onboarding_api, "_", side_effect=lambda message: message),
            patch.object(onboarding_api, "_fetch_registry_facility", return_value=facility),
            patch.object(onboarding_api, "_get_healthcare_user", return_value=healthcare_user),
            patch.object(
                onboarding_api,
                "_find_existing_facility",
                return_value={"exists": True},
            ),
            patch.object(onboarding_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = onboarding_api.lookup_facility(registration_number="REG-002")

        self.assertTrue(response["success"])
        self.assertFalse(response["data"]["can_start_verification"])
        self.assertTrue(response["data"]["already_onboarded"]["exists"])
        self.assertIn("already onboarded", response["data"]["message"])

    def test_passes_through_registry_error_details(self):
        fake_frappe = _make_mock_frappe()
        registry_error = {
            "status": "error",
            "message": "The Health Facility Registry is temporarily unavailable. Please try again shortly.",
            "status_code": 502,
            "details": {
                "source": "hfr",
                "source_label": "Health Facility Registry",
                "kind": "http_error",
                "status_code": 502,
                "technical_message": "Upstream facility registry returned HTTP 502 Bad Gateway.",
            },
        }

        with (
            patch.object(onboarding_api, "frappe", fake_frappe),
            patch.object(onboarding_api, "_fetch_registry_facility", return_value=registry_error),
        ):
            response = onboarding_api.lookup_facility(facility_id="FID-404")

        self.assertEqual(response["status"], "error")
        self.assertEqual(response["status_code"], 502)
        self.assertIn("temporarily unavailable", response["message"])
        self.assertEqual(response["details"]["source"], "hfr")
        self.assertEqual(
            response["details"]["technical_message"],
            "Upstream facility registry returned HTTP 502 Bad Gateway.",
        )

    def test_returns_mismatch_state_when_registry_owner_differs(self):
        fake_frappe = _make_mock_frappe()
        facility = {
            "facility_fid": "FID-003",
            "facility_name": "Mismatch Facility",
            "registration_number": "REG-003",
            "owner_id_number": "11111111",
        }
        healthcare_user = {
            "first_name": "Asha",
            "last_name": "Otieno",
            "identification_number": "12345678",
            "identification_type": "National ID",
        }

        with (
            patch.object(onboarding_api, "frappe", fake_frappe),
            patch.object(onboarding_api, "_", side_effect=lambda message: message),
            patch.object(onboarding_api, "_fetch_registry_facility", return_value=facility),
            patch.object(onboarding_api, "_get_healthcare_user", return_value=healthcare_user),
            patch.object(onboarding_api, "_find_existing_facility", return_value=None),
            patch.object(onboarding_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = onboarding_api.lookup_facility(facility_id="FID-003")

        self.assertTrue(response["success"])
        self.assertFalse(response["data"]["can_start_verification"])
        self.assertFalse(response["data"]["owner_match"]["matched"])
        self.assertIn("different owner", response["data"]["message"])


class TestStartOwnerVerification(unittest.TestCase):
    def test_requires_exactly_one_identifier(self):
        fake_frappe = _make_mock_frappe()

        with (
            patch.object(onboarding_api, "frappe", fake_frappe),
            patch.object(onboarding_api, "_", side_effect=lambda message: message),
            patch.object(onboarding_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = onboarding_api.start_owner_verification(
                facility_id="FID-001",
                registration_number="REG-001",
            )

        self.assertFalse(response["success"])
        self.assertEqual(response["status_code"], 400)
        self.assertIn("either FID or registration number", response["message"])


class TestOrganizationScopedOnboarding(unittest.TestCase):
    def test_rejects_target_organization_outside_current_user_scope(self):
        target_context = {
            "is_public": True,
            "organization": {
                "name": "ORG-B",
                "organization_name": "County B",
                "company": "COMP-B",
            },
            "region": {
                "name": "REG-B",
                "region_name": "Subcounty B",
                "company": "COMP-B",
            },
        }

        with patch.object(
            onboarding_api,
            "_build_onboarding_organization_context",
            return_value={
                "organization": {
                    "name": "ORG-A",
                    "organization_name": "County A",
                    "company": "COMP-A",
                },
                "company_names": ["COMP-A"],
                "regions": [{"name": "REG-A"}],
            },
        ), patch.object(onboarding_api, "_", side_effect=lambda message: message):
            error = onboarding_api._validate_target_context_for_user(
                "owner@example.com",
                {"organization": "ORG-A"},
                target_context,
            )

        self.assertIsNotNone(error)
        self.assertIn("County B", error)
        self.assertIn("County A", error)

    def test_rejects_private_region_outside_allowed_regions(self):
        target_context = {
            "is_public": False,
            "organization": {
                "name": "ORG-A",
                "organization_name": "County A",
                "company": "COMP-A",
            },
            "region": {
                "name": "REG-B",
                "region_name": "Region B",
                "company": "COMP-A",
            },
        }

        with patch.object(
            onboarding_api,
            "_build_onboarding_organization_context",
            return_value={
                "organization": {
                    "name": "ORG-A",
                    "organization_name": "County A",
                    "company": "COMP-A",
                },
                "company_names": ["COMP-A"],
                "regions": [{"name": "REG-A"}],
            },
        ), patch.object(onboarding_api, "_", side_effect=lambda message: message):
            error = onboarding_api._validate_target_context_for_user(
                "owner@example.com",
                {"organization": "ORG-A"},
                target_context,
            )

        self.assertIsNotNone(error)
        self.assertIn("organization region", error)


class TestRegistryErrorNormalization(unittest.TestCase):
    def test_fetch_registry_facility_uses_frappe_response_error_when_helper_returns_none(self):
        fake_frappe = _make_mock_frappe()
        fake_frappe.local.response = {
            "status": "error",
            "message": "Facility registry service returned HTTP 502 Bad Gateway.",
            "http_status_code": 502,
        }

        with (
            patch.object(onboarding_api, "frappe", fake_frappe),
            patch.object(onboarding_api, "_", side_effect=lambda message: message),
            patch.dict(
                sys.modules,
                {"careverse_hq.api.facility_onboarding_v2": SimpleNamespace(fetch_facility_hwr_fr=lambda **kwargs: None)},
            ),
        ):
            result = onboarding_api._fetch_registry_facility(facility_id="FID-001")

        self.assertEqual(result["status"], "error")
        self.assertEqual(result["status_code"], 502)
        self.assertIn("HTTP 502", result["message"])


class TestDuplicateLookup(unittest.TestCase):
    def test_find_existing_facility_uses_sql_existence_check(self):
        fake_frappe = _make_mock_frappe()

        def _sql(query, values=None, as_dict=False):
            self.assertIn("FROM `tabHealth Facility`", query)
            self.assertEqual(values, {"value": "FID-500"})
            self.assertTrue(as_dict)
            return [{"name": "HF-0001"}]

        fake_frappe.db = SimpleNamespace(sql=_sql)

        with patch.object(onboarding_api, "frappe", fake_frappe):
            result = onboarding_api._find_existing_facility({"facility_fid": "FID-500"})

        self.assertEqual(result, {"exists": True})


if __name__ == "__main__":
    unittest.main()
