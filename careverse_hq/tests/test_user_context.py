import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from careverse_hq.api.user_context import get_app_branding, get_user_company_context


def make_fake_frappe(
    *,
    company_permissions,
    exists_side_effect,
    company_doc,
    facilities,
    website_settings=None,
    roles=None,
):
    fake_db = SimpleNamespace(
        exists=MagicMock(side_effect=exists_side_effect),
        get_value=MagicMock(return_value=company_doc),
    )

    return SimpleNamespace(
        session=SimpleNamespace(user="test@example.com"),
        db=fake_db,
        get_all=MagicMock(return_value=company_permissions),
        get_list=MagicMock(return_value=facilities),
        get_roles=MagicMock(return_value=roles or []),
        get_website_settings=MagicMock(side_effect=lambda key: (website_settings or {}).get(key)),
        log_error=MagicMock(),
        get_traceback=MagicMock(return_value="traceback"),
        PermissionError=Exception,
    )


def fake_is_oversight(return_value):
    """Return a mock for AdminCentralSettings.is_oversight_user."""
    return MagicMock(return_value=return_value)


class TestUserCompanyContext(unittest.TestCase):
    def assert_context_response(self, result, mock_api_response):
        if result is not None:
            return result
        self.assertIsNotNone(mock_api_response.call_args)
        return mock_api_response.call_args.kwargs

    def test_company_permission_gives_company_mode(self):
        fake_frappe = make_fake_frappe(
            company_permissions=[{"for_value": "ACME", "is_default": 1}],
            exists_side_effect=lambda doctype, filters=None: doctype == "Company",
            company_doc={
                "name": "ACME",
                "company_name": "ACME County",
                "abbr": "AC",
                "company_logo": None,
                "country": "KE",
                "default_currency": "KES",
            },
            facilities=[{"hie_id": "HF-1", "facility_name": "Main"}],
        )

        with (
            patch("careverse_hq.api.user_context.frappe", fake_frappe),
            patch("careverse_hq.branding.frappe", fake_frappe),
            patch("careverse_hq.branding.get_app_logo", return_value="/files/f360-brand.svg"),
            patch("careverse_hq.api.user_context.api_response", side_effect=lambda **kw: kw) as mock_resp,
            patch(
                "careverse_hq.careverse_hq.doctype.admin_central_settings.admin_central_settings.AdminCentralSettings.is_oversight_user",
                return_value=False,
            ),
        ):
            result = get_user_company_context()
            response = self.assert_context_response(result, mock_resp)

        self.assertEqual(response["data"]["access_mode"], "company")
        self.assertTrue(response["data"]["has_company_permission"])
        self.assertEqual(response["data"]["company"]["name"], "ACME")
        self.assertEqual(response["data"]["brand"]["app_name"], "CareVerse HQ")
        self.assertEqual(response["data"]["brand"]["logo"], "/files/f360-brand.svg")

    def test_oversight_user_without_company_gets_oversight_mode(self):
        fake_frappe = make_fake_frappe(
            company_permissions=[],
            exists_side_effect=lambda doctype, filters=None: False,
            company_doc=None,
            facilities=[],
        )

        with (
            patch("careverse_hq.api.user_context.frappe", fake_frappe),
            patch("careverse_hq.branding.frappe", fake_frappe),
            patch("careverse_hq.branding.get_app_logo", return_value=None),
            patch("careverse_hq.api.user_context.api_response", side_effect=lambda **kw: kw) as mock_resp,
            patch(
                "careverse_hq.careverse_hq.doctype.admin_central_settings.admin_central_settings.AdminCentralSettings.is_oversight_user",
                return_value=True,
            ),
        ):
            result = get_user_company_context()
            response = self.assert_context_response(result, mock_resp)

        self.assertEqual(response["data"]["access_mode"], "oversight")
        self.assertTrue(response["data"]["is_oversight_user"])
        self.assertFalse(response["data"]["has_company_permission"])
        self.assertIsNone(response["data"]["company"])

    def test_company_permission_takes_precedence_over_oversight_role(self):
        fake_frappe = make_fake_frappe(
            company_permissions=[{"for_value": "ACME", "is_default": 1}],
            exists_side_effect=lambda doctype, filters=None: doctype == "Company",
            company_doc={
                "name": "ACME",
                "company_name": "ACME County",
                "abbr": "AC",
                "company_logo": None,
                "country": "KE",
                "default_currency": "KES",
            },
            facilities=[],
        )

        with (
            patch("careverse_hq.api.user_context.frappe", fake_frappe),
            patch("careverse_hq.branding.frappe", fake_frappe),
            patch("careverse_hq.branding.get_app_logo", return_value=None),
            patch("careverse_hq.api.user_context.api_response", side_effect=lambda **kw: kw) as mock_resp,
            patch(
                "careverse_hq.careverse_hq.doctype.admin_central_settings.admin_central_settings.AdminCentralSettings.is_oversight_user",
                return_value=True,
            ),
        ):
            result = get_user_company_context()
            response = self.assert_context_response(result, mock_resp)

        self.assertEqual(response["data"]["access_mode"], "company")
        self.assertTrue(response["data"]["is_oversight_user"])
        self.assertTrue(response["data"]["has_company_permission"])

    def test_user_with_neither_gets_none(self):
        fake_frappe = make_fake_frappe(
            company_permissions=[],
            exists_side_effect=lambda doctype, filters=None: False,
            company_doc=None,
            facilities=[],
        )

        with (
            patch("careverse_hq.api.user_context.frappe", fake_frappe),
            patch("careverse_hq.branding.frappe", fake_frappe),
            patch("careverse_hq.branding.get_app_logo", return_value=None),
            patch("careverse_hq.api.user_context.api_response", side_effect=lambda **kw: kw) as mock_resp,
            patch(
                "careverse_hq.careverse_hq.doctype.admin_central_settings.admin_central_settings.AdminCentralSettings.is_oversight_user",
                return_value=False,
            ),
        ):
            result = get_user_company_context()
            response = self.assert_context_response(result, mock_resp)

        self.assertEqual(response["data"]["access_mode"], "none")
        self.assertFalse(response["data"]["is_oversight_user"])
        self.assertFalse(response["data"]["has_company_permission"])
        self.assertEqual(response["data"]["facilities"], [])

    def test_public_branding_uses_website_settings_and_logo(self):
        fake_frappe = make_fake_frappe(
            company_permissions=[],
            exists_side_effect=lambda doctype, filters=None: False,
            company_doc=None,
            facilities=[],
            website_settings={"app_name": "CareVerse HQ"},
        )

        with (
            patch("careverse_hq.api.user_context.frappe", fake_frappe),
            patch("careverse_hq.branding.frappe", fake_frappe),
            patch("careverse_hq.branding.get_app_logo", return_value="/files/careverse-logo.svg"),
            patch("careverse_hq.api.user_context.api_response", side_effect=lambda **kw: kw) as mock_resp,
        ):
            result = get_app_branding()
            response = self.assert_context_response(result, mock_resp)

        self.assertTrue(response["success"])
        self.assertEqual(response["data"]["app_name"], "CareVerse HQ")
        self.assertEqual(response["data"]["logo"], "/files/careverse-logo.svg")
