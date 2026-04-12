import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from careverse_hq.api import dashboard as dashboard_api


class TestHealthProfessionalLicenseOverview(unittest.TestCase):
    def test_overview_counts_only_linked_health_professionals_with_license_dates(self):
        def get_list_side_effect(doctype, **kwargs):
            if doctype == "Employee":
                self.assertEqual(kwargs["group_by"], "custom_health_professional")
                return [
                    {"custom_health_professional": "HP-001", "employee_count": 2},
                    {"custom_health_professional": "HP-002", "employee_count": 1},
                    {"custom_health_professional": "HP-003", "employee_count": 3},
                    {"custom_health_professional": "HP-004", "employee_count": 1},
                ]

            if doctype == "Health Professional":
                self.assertEqual(kwargs["filters"]["license_end"], ["is", "set"])
                names = set(kwargs["filters"]["name"][1])
                self.assertEqual(names, {"HP-001", "HP-002", "HP-003", "HP-004"})
                return [
                    {
                        "name": "HP-001",
                        "license_end": "2026-05-01",
                    },
                    {
                        "name": "HP-002",
                        "license_end": "2026-04-01",
                    },
                    {
                        "name": "HP-004",
                        "license_end": "2026-05-20",
                    },
                ]

            raise AssertionError(f"Unexpected doctype queried: {doctype}")

        fake_frappe = SimpleNamespace(
            get_list=MagicMock(side_effect=get_list_side_effect),
            log_error=MagicMock(),
            get_traceback=MagicMock(return_value="traceback"),
        )

        with (
            patch("careverse_hq.api.dashboard.frappe", fake_frappe),
            patch("careverse_hq.api.dashboard.api_response", side_effect=lambda **kw: kw),
            patch("careverse_hq.api.dashboard.today", return_value="2026-04-12"),
        ):
            response = dashboard_api.get_health_professional_license_overview()

        self.assertTrue(response["success"])
        data = response["data"]
        self.assertEqual(data["total_health_professional_employees"], 7)
        self.assertEqual(data["total_considered"], 4)
        self.assertEqual(data["licensed_not_expired"], 3)
        self.assertEqual(data["licensed_expired"], 1)
        self.assertEqual(data["licenses_expiring_soon"], 3)
        self.assertEqual(data["excluded_missing_license_data"], 3)
        self.assertEqual(data["compliance_rate"], 75.0)
        self.assertEqual(fake_frappe.get_list.call_count, 2)

    def test_overview_returns_empty_shape_when_no_linked_health_professionals_exist(self):
        fake_frappe = SimpleNamespace(
            get_list=MagicMock(return_value=[]),
            log_error=MagicMock(),
            get_traceback=MagicMock(return_value="traceback"),
        )

        with (
            patch("careverse_hq.api.dashboard.frappe", fake_frappe),
            patch("careverse_hq.api.dashboard.api_response", side_effect=lambda **kw: kw),
        ):
            response = dashboard_api.get_health_professional_license_overview()

        self.assertTrue(response["success"])
        self.assertEqual(
            response["data"],
            {
                "total_health_professional_employees": 0,
                "total_considered": 0,
                "licensed_not_expired": 0,
                "licensed_expired": 0,
                "licenses_expiring_soon": 0,
                "excluded_missing_license_data": 0,
                "compliance_rate": 0.0,
            },
        )


class TestDashboardCompanyOverview(unittest.TestCase):
    def test_company_overview_includes_facilities_and_asset_portfolio_value(self):
        count_map = {
            ("Employee", (("status", "Active"),)): 11,
            ("Department", None): 4,
            ("Health Facility", None): 7,
            ("Health Automation Device", None): 19,
            ("Asset", None): 13,
            ("Facility Affiliation", (("affiliation_status", "Active"),)): 23,
            ("Facility Affiliation", (("affiliation_status", "Pending"),)): 5,
        }

        def count_side_effect(doctype, filters=None):
            key = (doctype, tuple(sorted(filters.items())) if filters else None)
            return count_map[key]

        fake_frappe = SimpleNamespace(
            db=SimpleNamespace(
                exists=MagicMock(side_effect=lambda doctype, name=None: doctype == "DocType" and name == "Asset")
            ),
            log_error=MagicMock(),
            get_traceback=MagicMock(return_value="traceback"),
        )

        with (
            patch("careverse_hq.api.dashboard.frappe", fake_frappe),
            patch("careverse_hq.api.dashboard._count", side_effect=count_side_effect),
            patch("careverse_hq.api.dashboard._get_permission_safe_sum", return_value=2450000.5),
            patch("careverse_hq.api.dashboard.api_response", side_effect=lambda **kw: kw),
        ):
            response = dashboard_api.get_company_overview()

        self.assertTrue(response["success"])
        self.assertEqual(response["data"]["total_facilities"], 7)
        self.assertEqual(response["data"]["asset_records_total"], 13)
        self.assertEqual(response["data"]["total_asset_value"], 2450000.5)


if __name__ == "__main__":
    unittest.main()
