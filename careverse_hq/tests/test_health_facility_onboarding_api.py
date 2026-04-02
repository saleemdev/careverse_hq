import unittest
import uuid
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import frappe
from frappe import _dict
from frappe.tests.utils import FrappeTestCase

from careverse_hq.api import facility_onboarding_v2 as onboarding_api


def _suffix() -> str:
    return uuid.uuid4().hex[:8].upper()


def _make_mock_frappe(user="facility-owner@example.com"):
    does_not_exist = type("FakeDoesNotExistError", (Exception,), {})
    return SimpleNamespace(
        session={"user": user},
        DoesNotExistError=does_not_exist,
    )


class TestFetchFacilityDetails(unittest.TestCase):
    def test_rejects_already_onboarded_facility(self):
        fake_frappe = _make_mock_frappe()

        with (
            patch.object(onboarding_api, "frappe", fake_frappe),
            patch.object(onboarding_api, "fetch_facility_local", return_value={"success": True}),
            patch.object(onboarding_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = onboarding_api.fetch_facility_details(facility_id="FAC-001")

        self.assertFalse(response["success"])
        self.assertEqual(response["status_code"], 400)
        self.assertIn("already been onboarded", response["message"])

    def test_rejects_when_registry_owner_id_is_missing(self):
        fake_frappe = _make_mock_frappe()

        with (
            patch.object(onboarding_api, "frappe", fake_frappe),
            patch.object(onboarding_api, "fetch_facility_local", return_value={"success": False}),
            patch.object(
                onboarding_api,
                "fetch_facility_hwr_fr",
                return_value={"facility_fid": "FAC-002", "facility_name": "Test Facility"},
            ),
            patch.object(onboarding_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = onboarding_api.fetch_facility_details(facility_id="FAC-002")

        self.assertFalse(response["success"])
        self.assertEqual(response["status_code"], 400)
        self.assertIn("Owner ID Number not set", response["message"])

    def test_returns_api_error_when_registry_fetch_raises(self):
        fake_frappe = _make_mock_frappe()

        with (
            patch.object(onboarding_api, "frappe", fake_frappe),
            patch.object(onboarding_api, "fetch_facility_local", return_value={"success": False}),
            patch.object(onboarding_api, "fetch_facility_hwr_fr", side_effect=RuntimeError("registry down")),
            patch.object(onboarding_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = onboarding_api.fetch_facility_details(facility_id="FAC-002A")

        self.assertFalse(response["success"])
        self.assertEqual(response["status_code"], 500)
        self.assertIn("registry down", response["message"])

    def test_rejects_when_logged_in_owner_does_not_match_registry_owner(self):
        fake_frappe = _make_mock_frappe()

        with (
            patch.object(onboarding_api, "frappe", fake_frappe),
            patch.object(onboarding_api, "fetch_facility_local", return_value={"success": False}),
            patch.object(
                onboarding_api,
                "fetch_facility_hwr_fr",
                return_value={
                    "facility_fid": "FAC-003",
                    "facility_name": "Mismatch Facility",
                    "owner_id_number": "11111111",
                },
            ),
            patch.object(
                onboarding_api,
                "_get_healthcare_user",
                return_value={"identification_number": "99999999"},
            ),
            patch.object(onboarding_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = onboarding_api.fetch_facility_details(facility_id="FAC-003")

        self.assertFalse(response["success"])
        self.assertEqual(response["status_code"], 500)
        self.assertIn("different Administrator", response["message"])

    def test_returns_facility_and_admin_details_for_matching_owner(self):
        fake_frappe = _make_mock_frappe()
        healthcare_user = {
            "first_name": "Ada",
            "middle_name": "K",
            "last_name": "Owens",
            "identification_number": "12345678",
            "phone_number": "+254700000001",
            "email": "facility-owner@example.com",
            "gender": "Female",
            "date_of_birth": "1990-01-01",
            "identification_type": "National ID",
        }

        with (
            patch.object(onboarding_api, "frappe", fake_frappe),
            patch.object(onboarding_api, "fetch_facility_local", return_value={"success": False}),
            patch.object(
                onboarding_api,
                "fetch_facility_hwr_fr",
                return_value={
                    "facility_fid": "FAC-004",
                    "facility_name": "Matching Facility",
                    "owner_id_number": "12345678",
                },
            ),
            patch.object(onboarding_api, "_get_healthcare_user", return_value=healthcare_user),
            patch.object(onboarding_api, "api_response", side_effect=lambda **kw: kw),
        ):
            response = onboarding_api.fetch_facility_details(facility_id="FAC-004")

        self.assertTrue(response["success"])
        self.assertEqual(response["status_code"], 200)
        self.assertEqual(response["data"]["facility_details"]["facility_fid"], "FAC-004")
        self.assertEqual(response["data"]["admin_details"]["id_number"], "12345678")
        self.assertEqual(response["data"]["admin_details"]["email"], "facility-owner@example.com")


class TestCreateNewFacilityV2(FrappeTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.test_company = cls._ensure_company()

    @staticmethod
    def _ensure_company():
        company_name = "_Test Careverse Health Facility Company"
        if frappe.db.exists("Company", company_name):
            return company_name

        return frappe.get_doc(
            {
                "doctype": "Company",
                "company_name": company_name,
                "abbr": "_TCHFC",
                "default_currency": "KES",
                "country": "Kenya",
                "custom_company_type": "Health Facility",
                "custom_licensing_status": "Active",
                "custom_regulating_body": "KMPDC",
                "custom_regulator_code": f"TCHFC-{_suffix()}",
                "custom_expiration_date": "2030-12-31",
            }
        ).insert(ignore_permissions=True).name

    def setUp(self):
        super().setUp()
        frappe.local.response = _dict({})
        frappe.flags.skip_region_company_creation = True
        self.user_email = f"facility-owner-{_suffix().lower()}@example.com"
        self._create_user(self.user_email)
        self.org_user = self._create_org_user(self.user_email)
        self.private_org = self._create_organization(f"Private Org {_suffix()}")
        self.private_region = self._create_region(self.private_org, f"Private Region {_suffix()}")
        self.public_org = self._create_organization(f"County {_suffix()}")
        self.public_region = self._create_region(self.public_org, f"Sub County {_suffix()}")
        frappe.set_user(self.user_email)

    def tearDown(self):
        if hasattr(frappe.flags, "skip_region_company_creation"):
            del frappe.flags.skip_region_company_creation
        frappe.set_user("Administrator")
        super().tearDown()

    def _create_user(self, email):
        if frappe.db.exists("User", email):
            return frappe.get_doc("User", email)

        return frappe.get_doc(
            {
                "doctype": "User",
                "email": email,
                "first_name": "Facility",
                "last_name": "Owner",
                "enabled": 1,
                "send_welcome_email": 0,
                "user_type": "System User",
                "new_password": "test-password",
            }
        ).insert(ignore_permissions=True)

    def _create_org_user(self, email):
        return frappe.get_doc(
            {
                "doctype": "Healthcare Organization User",
                "first_name": "Facility",
                "last_name": "Owner",
                "identification_type": "National ID",
                "identification_number": f"ID-{_suffix()}",
                "phone_number": "+254700000001",
                "email": email,
                "user": email,
                "user_identity_hash": f"hash-{_suffix()}",
            }
        ).insert(ignore_permissions=True)

    def _create_organization(self, organization_name):
        return frappe.get_doc(
            {
                "doctype": "Healthcare Organization",
                "organization_name": organization_name,
                "company": self.test_company,
            }
        ).insert(ignore_permissions=True)

    def _create_region(self, organization, region_name):
        return frappe.get_doc(
            {
                "doctype": "Healthcare Organization Region",
                "region_name": region_name,
                "parent_organization": organization.name,
                "company": self.test_company,
            }
        ).insert(ignore_permissions=True)

    def _build_payload(self, *, facility_id=None, owner_type="Private", region=None, county=None, sub_county=None):
        token = _suffix()
        facility_id = facility_id or f"HF-{token}"
        return {
            "facility_id": facility_id,
            "facility_details": {
                "facility_fid": facility_id,
                "facility_name": f"Facility {token}",
                "facility_type": "Hospital",
                "registration_number": f"REG-{token}",
                "facility_category": "General",
                "facility_level": "Level 4",
                "facility_code": f"MFL-{token}",
                "operational_status": "Operational",
            },
            "admin_details": {
                "first_name": "Facility",
                "middle_name": "Test",
                "last_name": "Owner",
                "id_number": self.org_user.identification_number,
                "phone_number": "+254700000001",
                "email": self.user_email,
                "gender": "Female",
                "date_of_birth": "1990-01-01",
                "identification_type": "National ID",
            },
            "license_details": {
                "current_license_number": f"LIC-{token}",
                "current_license_type": "Operating",
                "current_license_expiry_date": "2030-12-31",
                "regulatory_body": "KMPDC",
                "license_renewal_duration": 12,
                "current_renewal_date": "2025-01-01",
            },
            "additional_details": {
                "organization_owner_type": owner_type,
                "organization_owner": "Owner Entity",
                "organization_owner_kra_pin": f"KRA{token}",
                "physical_address": "Nairobi",
                "email_address": "facility@example.com",
                "number_of_beds": 12,
                "latitude": "1.2345",
                "longitude": "36.9876",
                "county": county or "Nairobi County",
                "sub_county": sub_county or "Westlands",
                "ward": "Parklands",
                "constituency": "Westlands",
                "maximum_bed_allocation": 20,
                "open_whole_day": 1,
                "open_public_holiday": 1,
                "open_weekends": 1,
                "open_late_night": 0,
                "owner_board_registration_number": "BRN-001",
                "region": region,
            },
            "contacts": [
                {"contact_name": "Reception", "phone_number": "+254711000001"},
                {"contact_name": "Accounts", "phone_number": "+254711000002"},
            ],
            "banks": [
                {
                    "bank_name": "Test Bank",
                    "branch_name": "CBD",
                    "account_name": "Facility Main",
                    "account_number": "1234567890",
                    "purpose": "Operations",
                }
            ],
        }

    def test_create_private_facility_creates_records_and_permissions(self):
        payload = self._build_payload(region=self.private_region.name)

        with (
            patch.object(onboarding_api, "get_public_facility_owner_types", return_value=["COUNTY GOVERNMENT"]),
            patch.object(onboarding_api.frappe, "enqueue") as enqueue_mock,
            patch.object(onboarding_api, "create_user_permissions_bulk") as permission_mock,
        ):
            onboarding_api.create_new_facility_v2(**payload)

        self.assertEqual(frappe.local.response.http_status_code, 201)
        facility = frappe.get_doc("Health Facility", payload["facility_id"])
        department = frappe.get_doc("Department", facility.department)
        org_user = frappe.get_doc("Healthcare Organization User", self.org_user.name)

        self.assertEqual(facility.healthcare_organization, self.private_org.name)
        self.assertEqual(facility.healthcare_organization_region, self.private_region.name)
        self.assertEqual(facility.department, department.name)
        self.assertEqual(department.custom_health_facility, facility.name)
        self.assertEqual(len(facility.contacts), 2)
        self.assertEqual(len(facility.banks), 1)
        self.assertEqual(org_user.organization, self.private_org.name)
        self.assertEqual(org_user.organization_region, self.private_region.name)
        self.assertEqual(enqueue_mock.call_count, 2)
        permission_mock.assert_called_once_with(
            user=self.user_email,
            permissions=[
                {"doctype": "Healthcare Organization", "values": [self.private_org.name]},
                {"doctype": "Healthcare Organization Region", "values": [self.private_region.name]},
                {"doctype": "Health Facility", "values": [facility.name]},
                {"doctype": "Department", "values": [department.name]},
            ],
        )

    def test_create_private_facility_requires_region(self):
        payload = self._build_payload(region=None)

        with patch.object(onboarding_api, "get_public_facility_owner_types", return_value=["COUNTY GOVERNMENT"]):
            onboarding_api.create_new_facility_v2(**payload)

        self.assertEqual(frappe.local.response.http_status_code, 404)
        self.assertIn("Region", frappe.local.response.get("message", ""))
        self.assertFalse(frappe.db.exists("Health Facility", payload["facility_id"]))

    def test_create_public_facility_maps_county_and_sub_county(self):
        payload = self._build_payload(
            owner_type="County Government",
            region=None,
            county=self.public_org.organization_name,
            sub_county=self.public_region.region_name,
        )

        with (
            patch.object(onboarding_api, "get_public_facility_owner_types", return_value=["COUNTY GOVERNMENT"]),
            patch.object(onboarding_api.frappe, "enqueue"),
            patch.object(onboarding_api, "create_user_permissions_bulk"),
        ):
            onboarding_api.create_new_facility_v2(**payload)

        self.assertEqual(frappe.local.response.http_status_code, 201)
        facility = frappe.get_doc("Health Facility", payload["facility_id"])
        self.assertEqual(facility.healthcare_organization, self.public_org.name)
        self.assertEqual(facility.healthcare_organization_region, self.public_region.name)

    def test_rejects_duplicate_facility_id(self):
        payload = self._build_payload(region=self.private_region.name)

        with (
            patch.object(onboarding_api, "get_public_facility_owner_types", return_value=["COUNTY GOVERNMENT"]),
            patch.object(onboarding_api.frappe, "enqueue"),
            patch.object(onboarding_api, "create_user_permissions_bulk"),
        ):
            onboarding_api.create_new_facility_v2(**payload)
            frappe.local.response = _dict({})
            onboarding_api.create_new_facility_v2(**payload)

        self.assertEqual(frappe.local.response.http_status_code, 409)
        self.assertIn("already onboarded", frappe.local.response.get("message", ""))
