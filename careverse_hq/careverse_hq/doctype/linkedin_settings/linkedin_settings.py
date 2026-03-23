"""
LinkedIn Settings (Single DocType)

Manages LinkedIn Talent partner integration configuration.
Enforces credential requirements before enabling integration features.
Secrets (client_secret, webhook_signing_secret) are stored as Password fields
and never exposed in logs or API responses.
"""

import frappe
from frappe.model.document import Document


class LinkedInSettings(Document):
    def validate(self):
        self._validate_partner_approval()
        self._validate_credentials()
        self._validate_feature_flags()
        self._validate_sync_interval()

    def _validate_partner_approval(self):
        if self.is_enabled and not self.partner_approved:
            frappe.throw(
                "LinkedIn integration cannot be enabled without partner approval.",
                title="Partner Approval Required",
            )
        if self.is_enabled and self.partner_access_mode == "None":
            frappe.throw(
                "Select a partner access mode (Sandbox or Production) before enabling.",
                title="Access Mode Required",
            )

    def _validate_credentials(self):
        if not self.is_enabled:
            return
        required = {
            "client_id": "Client ID",
            "client_secret": "Client Secret",
            "redirect_uri": "Redirect URI",
            "organization_urn": "Organization URN",
        }
        missing = [
            label for field, label in required.items() if not self.get(field)
        ]
        if missing:
            frappe.throw(
                f"Cannot enable integration. Missing credentials: {', '.join(missing)}",
                title="Credentials Required",
            )

    def _validate_feature_flags(self):
        if not self.is_enabled:
            # Disable all features when integration is off
            self.apply_connect_enabled = 0
            self.sync_job_postings_enabled = 0
            self.compliance_api_enabled = 0

    def _validate_sync_interval(self):
        if self.sync_interval_minutes and self.sync_interval_minutes < 5:
            frappe.throw(
                "Sync interval must be at least 5 minutes.",
                title="Invalid Sync Interval",
            )
        if self.rate_limit_per_minute and self.rate_limit_per_minute < 1:
            frappe.throw(
                "Rate limit must be at least 1 request per minute.",
                title="Invalid Rate Limit",
            )

    def on_update(self):
        # Clear last sync error when integration is disabled
        if not self.is_enabled and self.last_sync_error:
            frappe.db.set_single_value("LinkedIn Settings", "last_sync_error", "")
            frappe.db.set_single_value("LinkedIn Settings", "last_sync_status", "Never")
