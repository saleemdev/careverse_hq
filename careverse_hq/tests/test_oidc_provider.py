"""
End-to-end provider flow tests for careverse_hq.api.oidc_provider.

Covers positive and negative paths for:
- authorize: eligibility gate, managed-app status gate, guest redirect,
             missing client_id, auto-approve (skip_auth / existing token),
             consent render path
- get_token: managed-app status gate, eligibility re-check at token exchange,
             unmanaged client passthrough
"""

from __future__ import annotations

import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch, call


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

class _FrappeResponse(dict):
    """Supports both response["key"] and response.key access patterns used by Frappe."""
    def __getattr__(self, key: str):
        try:
            return self[key]
        except KeyError:
            raise AttributeError(key)

    def __setattr__(self, key: str, value):
        self[key] = value


def _make_frappe(
    *,
    user: str = "health@example.com",
    user_enabled: bool = True,
    hp_exists: bool = True,
    hp_status: str = "active",
    managed_app_status: str = "Active",
    has_managed_app: bool = True,
    skip_authorization: bool = False,
    has_active_token: bool = False,
    has_auth_code: bool = False,
    auth_code_user: str = "health@example.com",
):
    """Build a minimal frappe stub wired for the oidc_provider module."""
    session = SimpleNamespace(user=user)
    response = _FrappeResponse(http_status_code=200, type=None, location=None)
    local = SimpleNamespace(
        response=response,
        flags=SimpleNamespace(oauth_credentials={}),
    )

    hp_doc = SimpleNamespace(name="HP-001", status=hp_status) if hp_exists else None

    def db_exists(doctype, value=None):
        if doctype == "DocType" and value == "OIDC App":
            return True
        if doctype == "DocType" and value == "Health Professional":
            return True
        if doctype == "OAuth Bearer Token" and isinstance(value, dict):
            return has_active_token
        if doctype == "OAuth Authorization Code":
            return has_auth_code
        return False

    def db_get_value(doctype, filters_or_name, field, *args, **kwargs):
        as_dict = kwargs.get("as_dict") or (args and args[0] == True)
        if doctype == "OIDC App":
            if has_managed_app:
                result = SimpleNamespace(
                    name="OIDC-001",
                    app_name="Test App",
                    status=managed_app_status,
                )
                return result if as_dict else managed_app_status
            return None
        if doctype == "User" and field == "enabled":
            return 1 if user_enabled else 0
        if doctype == "Health Professional" and isinstance(filters_or_name, dict):
            if hp_exists:
                return SimpleNamespace(name="HP-001", status=hp_status) if as_dict else hp_status
            return None
        if doctype == "OAuth Client" and field == "skip_authorization":
            return 1 if skip_authorization else 0
        if doctype == "OAuth Authorization Code" and field == "user":
            return auth_code_user
        if doctype == "OAuth Bearer Token" and field == "client":
            return "client-001"
        return None

    db = SimpleNamespace(
        exists=db_exists,
        get_value=db_get_value,
    )

    def generate_hash(length=10):
        return "deadbeef12"[:length]

    stub = SimpleNamespace(
        session=session,
        local=local,
        db=db,
        flags=local.flags,
        form_dict=SimpleNamespace(
            get=lambda key, default=None: {
                "client_id": "client-001",
                "redirect_uri": "https://app.example.com/callback",
                "state": "xyz",
            }.get(key, default)
        ),
        get_request_header=MagicMock(return_value=None),
        generate_hash=generate_hash,
        respond_as_web_page=MagicMock(),
        _=lambda s: s,
        _dict=lambda d=None, **kw: SimpleNamespace(**(d or {}), **kw),
        utils=SimpleNamespace(escape_html=lambda s: s),
        request=SimpleNamespace(
            url="https://hq.example.com/api/method/frappe.integrations.oauth2.authorize?client_id=client-001",
            method="GET",
            headers={},
            get_data=lambda: b"",
        ),
    )
    return stub


# ---------------------------------------------------------------------------
# authorize() tests
# ---------------------------------------------------------------------------

class TestAuthorizeGuestRedirect(unittest.TestCase):
    def test_guest_is_redirected_to_login(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe(user="Guest")
        stub.request = SimpleNamespace(url="https://hq.example.com/authorize?client_id=x")

        with patch.object(provider, "frappe", stub):
            provider.authorize(client_id="client-001")

        self.assertEqual(stub.local.response["type"], "redirect")
        self.assertIn("/login", stub.local.response["location"])
        self.assertIn("redirect-to", stub.local.response["location"])


class TestAuthorizeMissingClientId(unittest.TestCase):
    def test_missing_client_id_renders_error(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe()
        stub.form_dict = SimpleNamespace(get=lambda key, default=None: None)

        with (
            patch.object(provider, "frappe", stub),
            patch.object(provider, "_render_authorize_error") as mock_err,
        ):
            provider.authorize()

        mock_err.assert_called_once()
        args = mock_err.call_args[0]
        self.assertEqual(args[0], "invalid_request")


class TestAuthorizeInactiveApp(unittest.TestCase):
    def test_inactive_managed_app_renders_error(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe(managed_app_status="Disabled")

        with (
            patch.object(provider, "frappe", stub),
            patch.object(provider, "_render_authorize_error") as mock_err,
        ):
            provider.authorize(client_id="client-001")

        mock_err.assert_called_once()
        args = mock_err.call_args[0]
        self.assertEqual(args[0], "invalid_client")


class TestAuthorizeArchivedApp(unittest.TestCase):
    def test_archived_managed_app_renders_error(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe(managed_app_status="Archived")

        with (
            patch.object(provider, "frappe", stub),
            patch.object(provider, "_render_authorize_error") as mock_err,
        ):
            provider.authorize(client_id="client-001")

        mock_err.assert_called_once()
        args = mock_err.call_args[0]
        self.assertEqual(args[0], "invalid_client")


class TestAuthorizeDisabledUser(unittest.TestCase):
    def test_disabled_user_is_denied(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe(user_enabled=False)

        with (
            patch.object(provider, "frappe", stub),
            patch.object(provider, "_render_authorize_error") as mock_err,
        ):
            provider.authorize(client_id="client-001")

        mock_err.assert_called_once()
        args = mock_err.call_args[0]
        self.assertEqual(args[0], "access_denied")


class TestAuthorizeNoHealthProfessional(unittest.TestCase):
    def test_user_without_hp_link_is_denied(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe(hp_exists=False)

        with (
            patch.object(provider, "frappe", stub),
            patch.object(provider, "_render_authorize_error") as mock_err,
        ):
            provider.authorize(client_id="client-001")

        mock_err.assert_called_once()
        args = mock_err.call_args[0]
        self.assertEqual(args[0], "access_denied")


class TestAuthorizeInactiveHealthProfessional(unittest.TestCase):
    def test_inactive_hp_status_is_denied(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe(hp_status="inactive")

        with (
            patch.object(provider, "frappe", stub),
            patch.object(provider, "_render_authorize_error") as mock_err,
        ):
            provider.authorize(client_id="client-001")

        mock_err.assert_called_once()
        args = mock_err.call_args[0]
        self.assertEqual(args[0], "access_denied")


class TestAuthorizeSkipConsent(unittest.TestCase):
    def test_trusted_client_auto_approves(self):
        import careverse_hq.api.oidc_provider as provider
        from oauthlib.common import Request as OAuthRequest

        stub = _make_frappe(skip_authorization=True)
        mock_server = MagicMock()
        mock_server.validate_authorization_request.return_value = (
            ["openid"],
            {"client_id": "client-001"},
        )
        mock_settings = MagicMock()
        mock_settings.skip_authorization = "Never"

        with (
            patch.object(provider, "frappe", stub),
            patch.object(provider, "get_oauth_server", return_value=mock_server),
            patch.object(provider, "get_oauth_settings", return_value=mock_settings),
            patch.object(provider, "encode_params", return_value="client_id=client-001"),
            patch.object(provider, "sanitize_kwargs", return_value={"client_id": "client-001"}),
        ):
            provider.authorize(client_id="client-001")

        self.assertEqual(stub.local.response["type"], "redirect")
        self.assertIn("approve", stub.local.response["location"])


class TestAuthorizeExistingTokenAutoApprove(unittest.TestCase):
    def test_existing_active_token_auto_approves_when_setting_is_auto(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe(skip_authorization=False, has_active_token=True)
        mock_server = MagicMock()
        mock_server.validate_authorization_request.return_value = (
            ["openid"],
            {"client_id": "client-001"},
        )
        mock_settings = MagicMock()
        mock_settings.skip_authorization = "Auto"

        with (
            patch.object(provider, "frappe", stub),
            patch.object(provider, "get_oauth_server", return_value=mock_server),
            patch.object(provider, "get_oauth_settings", return_value=mock_settings),
            patch.object(provider, "encode_params", return_value="client_id=client-001"),
            patch.object(provider, "sanitize_kwargs", return_value={"client_id": "client-001"}),
        ):
            provider.authorize(client_id="client-001")

        self.assertEqual(stub.local.response["type"], "redirect")


class TestAuthorizeConsentPageRendered(unittest.TestCase):
    def test_consent_page_rendered_for_eligible_user(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe(skip_authorization=False, has_active_token=False)
        mock_server = MagicMock()
        mock_server.validate_authorization_request.return_value = (
            ["openid", "profile", "email"],
            {"client_id": "client-001"},
        )
        mock_settings = MagicMock()
        mock_settings.skip_authorization = "Never"

        with (
            patch.object(provider, "frappe", stub),
            patch.object(provider, "get_oauth_server", return_value=mock_server),
            patch.object(provider, "get_oauth_settings", return_value=mock_settings),
            patch.object(provider, "encode_params", return_value="client_id=client-001"),
            patch.object(provider, "sanitize_kwargs", return_value={"client_id": "client-001"}),
            patch.object(provider, "_render_consent_page", return_value="<html>consent</html>") as mock_consent,
        ):
            provider.authorize(client_id="client-001")

        mock_consent.assert_called_once()
        call_args = mock_consent.call_args[0]
        # scopes list passed to consent renderer
        self.assertIn("openid", call_args[1])
        stub.respond_as_web_page.assert_called_once()


class TestAuthorizeUnmanagedClientPassthrough(unittest.TestCase):
    def test_unmanaged_client_bypasses_eligibility(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe(has_managed_app=False, skip_authorization=True)
        mock_server = MagicMock()
        mock_server.validate_authorization_request.return_value = (
            ["openid"],
            {"client_id": "unmanaged-client"},
        )
        mock_settings = MagicMock()
        mock_settings.skip_authorization = "Never"

        with (
            patch.object(provider, "frappe", stub),
            patch.object(provider, "get_oauth_server", return_value=mock_server),
            patch.object(provider, "get_oauth_settings", return_value=mock_settings),
            patch.object(provider, "encode_params", return_value="client_id=unmanaged-client"),
            patch.object(provider, "sanitize_kwargs", return_value={"client_id": "unmanaged-client"}),
            patch.object(provider, "_render_authorize_error") as mock_err,
        ):
            provider.authorize(client_id="unmanaged-client")

        mock_err.assert_not_called()
        self.assertEqual(stub.local.response["type"], "redirect")


class TestAuthorizeOAuthProtocolError(unittest.TestCase):
    def test_oauth_protocol_error_renders_error_page(self):
        import careverse_hq.api.oidc_provider as provider
        from oauthlib.oauth2 import OAuth2Error

        stub = _make_frappe()
        mock_server = MagicMock()
        exc = OAuth2Error()
        exc.error = "invalid_request"
        exc.description = "Bad redirect_uri"
        mock_server.validate_authorization_request.side_effect = exc

        with (
            patch.object(provider, "frappe", stub),
            patch.object(provider, "get_oauth_server", return_value=mock_server),
            patch.object(provider, "encode_params", return_value=""),
            patch.object(provider, "sanitize_kwargs", return_value={}),
            patch.object(provider, "_render_authorize_error") as mock_err,
        ):
            provider.authorize(client_id="client-001")

        mock_err.assert_called_once()
        self.assertEqual(mock_err.call_args[0][0], "invalid_request")


# ---------------------------------------------------------------------------
# get_token() tests
# ---------------------------------------------------------------------------

class TestGetTokenInactiveApp(unittest.TestCase):
    def test_inactive_app_returns_json_error(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe(managed_app_status="Disabled", has_auth_code=True)
        stub.form_dict = SimpleNamespace(
            get=lambda key, default=None: {"client_id": "client-001", "code": "auth-code-123"}.get(key, default)
        )

        with (
            patch.object(provider, "frappe", stub),
            patch.object(provider, "_json_error_response") as mock_json_err,
            patch.object(provider, "frappe_get_token") as mock_token,
        ):
            provider.get_token()

        mock_json_err.assert_called_once()
        args = mock_json_err.call_args[0]
        self.assertEqual(args[0], "invalid_client")
        mock_token.assert_not_called()


class TestGetTokenIneligibleUser(unittest.TestCase):
    def test_ineligible_code_user_returns_access_denied(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe(
            managed_app_status="Active",
            has_auth_code=True,
            auth_code_user="ineligible@example.com",
            hp_exists=False,
        )
        stub.form_dict = SimpleNamespace(
            get=lambda key, default=None: {"client_id": "client-001", "code": "auth-code-123"}.get(key, default)
        )

        with (
            patch.object(provider, "frappe", stub),
            patch.object(provider, "_json_error_response") as mock_json_err,
            patch.object(provider, "frappe_get_token") as mock_token,
        ):
            provider.get_token()

        mock_json_err.assert_called_once()
        args = mock_json_err.call_args[0]
        self.assertEqual(args[0], "access_denied")
        mock_token.assert_not_called()


class TestGetTokenActiveAppEligibleUser(unittest.TestCase):
    def test_active_app_eligible_user_calls_frappe_token(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe(
            managed_app_status="Active",
            has_auth_code=True,
            auth_code_user="health@example.com",
            hp_exists=True,
            hp_status="active",
        )
        stub.form_dict = SimpleNamespace(
            get=lambda key, default=None: {"client_id": "client-001", "code": "auth-code-123"}.get(key, default)
        )

        with (
            patch.object(provider, "frappe", stub),
            patch.object(provider, "_json_error_response") as mock_json_err,
            patch.object(provider, "frappe_get_token", return_value={"access_token": "tok"}) as mock_token,
        ):
            result = provider.get_token()

        mock_json_err.assert_not_called()
        mock_token.assert_called_once()
        self.assertEqual(result, {"access_token": "tok"})


class TestGetTokenUnmanagedClientPassthrough(unittest.TestCase):
    def test_unmanaged_client_delegates_directly(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe(has_managed_app=False)
        stub.form_dict = SimpleNamespace(
            get=lambda key, default=None: {"client_id": "unmanaged-client"}.get(key, default)
        )

        with (
            patch.object(provider, "frappe", stub),
            patch.object(provider, "_json_error_response") as mock_json_err,
            patch.object(provider, "frappe_get_token", return_value={"access_token": "tok"}) as mock_token,
        ):
            result = provider.get_token()

        mock_json_err.assert_not_called()
        mock_token.assert_called_once()


# ---------------------------------------------------------------------------
# _render_consent_page() unit tests
# ---------------------------------------------------------------------------

class TestRenderConsentPage(unittest.TestCase):
    def _call(self, app_name, scopes):
        import careverse_hq.api.oidc_provider as provider
        return provider._render_consent_page(
            app_name, scopes,
            success_url="/api/method/frappe.integrations.oauth2.approve?client_id=x",
            failure_url="https://app.example.com/callback?error=access_denied",
        )

    def test_app_name_appears_in_output(self):
        html = self._call("County HR Portal", ["openid", "email"])
        self.assertIn("County HR Portal", html)

    def test_known_scope_labels_rendered(self):
        html = self._call("Test App", ["openid", "email", "profile"])
        self.assertIn("Basic identity", html)
        self.assertIn("Email address", html)
        self.assertIn("Name &amp; photo", html)

    def test_unknown_scope_rendered_as_title_case(self):
        html = self._call("Test App", ["openid", "custom_scope"])
        self.assertIn("Custom_Scope", html)

    def test_duplicate_scopes_deduplicated(self):
        html = self._call("Test App", ["openid", "openid", "email"])
        self.assertEqual(html.count("Basic identity"), 1)

    def test_success_and_failure_urls_present(self):
        html = self._call("Test App", ["openid"])
        self.assertIn("approve", html)
        self.assertIn("access_denied", html)

    def test_xss_app_name_escaped(self):
        html = self._call("<script>alert(1)</script>", ["openid"])
        self.assertNotIn("<script>", html)
        self.assertIn("&lt;script&gt;", html)


# ---------------------------------------------------------------------------
# _render_authorize_error() unit tests
# ---------------------------------------------------------------------------

class TestRenderAuthorizeError(unittest.TestCase):
    def test_known_error_code_uses_user_friendly_message(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe()
        with patch.object(provider, "frappe", stub):
            provider._render_authorize_error("access_denied", "raw technical message")

        stub.respond_as_web_page.assert_called_once()
        html_arg = stub.respond_as_web_page.call_args[0][1]
        self.assertIn("have access to this app yet", html_arg)
        self.assertNotIn("raw technical message", html_arg)

    def test_unknown_error_code_falls_back_to_provided_message(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe()
        with patch.object(provider, "frappe", stub):
            provider._render_authorize_error("custom_error_xyz", "Something custom went wrong")

        html_arg = stub.respond_as_web_page.call_args[0][1]
        self.assertIn("Something custom went wrong", html_arg)

    def test_request_id_present_in_output(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe()
        with patch.object(provider, "frappe", stub):
            provider._render_authorize_error("server_error", "oops")

        html_arg = stub.respond_as_web_page.call_args[0][1]
        self.assertIn("deadbeef", html_arg)

    def test_safe_details_rendered(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe()
        with patch.object(provider, "frappe", stub):
            provider._render_authorize_error(
                "invalid_client", "App down",
                {"app": "County Portal", "status": "Disabled"},
            )

        html_arg = stub.respond_as_web_page.call_args[0][1]
        self.assertIn("County Portal", html_arg)
        self.assertIn("Disabled", html_arg)

    def test_unsafe_detail_keys_not_rendered(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe()
        with patch.object(provider, "frappe", stub):
            provider._render_authorize_error(
                "access_denied", "denied",
                {"health_professional": "HP-001", "user": "secret@example.com"},
            )

        html_arg = stub.respond_as_web_page.call_args[0][1]
        self.assertNotIn("HP-001", html_arg)
        self.assertNotIn("secret@example.com", html_arg)

    def test_http_status_set_to_403(self):
        import careverse_hq.api.oidc_provider as provider

        stub = _make_frappe()
        with patch.object(provider, "frappe", stub):
            provider._render_authorize_error("server_error", "err")

        self.assertEqual(stub.local.response.http_status_code, 403)


if __name__ == "__main__":
    unittest.main()
