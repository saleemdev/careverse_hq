import frappe
from frappe import _
from frappe.model.document import Document


class OIDCApp(Document):
    def validate(self):
        self._normalize_redirect_uris()
        self._normalize_scopes()

    def _normalize_redirect_uris(self):
        deduped = []
        seen = set()
        for row in list(self.redirect_uris or []):
            uri = (row.redirect_uri or "").strip()
            if not uri or uri in seen:
                continue
            seen.add(uri)
            deduped.append({"redirect_uri": uri})

        default_redirect_uri = (self.default_redirect_uri or "").strip()
        if default_redirect_uri and default_redirect_uri not in seen:
            deduped.append({"redirect_uri": default_redirect_uri})
            seen.add(default_redirect_uri)

        if not deduped:
            frappe.throw(_("At least one redirect URI is required."))

        for row in deduped:
            uri = row["redirect_uri"]
            is_https = uri.startswith("https://")
            is_localhost = uri.startswith("http://localhost") or uri.startswith("http://127.0.0.1")
            if not (is_https or is_localhost):
                frappe.throw(_("Redirect URI must be https:// or localhost http:// in development."))

        self.redirect_uris = []
        for row in deduped:
            self.append("redirect_uris", row)

        if not default_redirect_uri:
            self.default_redirect_uri = deduped[0]["redirect_uri"]

    def _normalize_scopes(self):
        deduped = []
        seen = set()
        for row in list(self.scopes or []):
            scope = (row.scope or "").strip()
            if not scope or scope in seen:
                continue
            seen.add(scope)
            deduped.append({"scope": scope})

        if "openid" not in seen:
            deduped.insert(0, {"scope": "openid"})
            seen.add("openid")

        if len(deduped) == 1:
            for default_scope in ("profile", "email"):
                if default_scope not in seen:
                    deduped.append({"scope": default_scope})
                    seen.add(default_scope)

        self.scopes = []
        for row in deduped:
            self.append("scopes", row)
