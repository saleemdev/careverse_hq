"""Shared app branding helpers for public and authenticated surfaces."""

from __future__ import annotations

import frappe
from frappe.core.doctype.navbar_settings.navbar_settings import get_app_logo


DEFAULT_APP_NAME = "CareVerse HQ"


def get_brand_initials(app_name: str | None) -> str:
	"""Build a compact monogram for logo fallback states."""
	parts = [part for part in (app_name or "").strip().split() if part]
	if not parts:
		return "CV"
	if len(parts) == 1:
		return parts[0][:2].upper()
	return (parts[0][0] + parts[-1][0]).upper()


def get_configured_app_brand() -> dict[str, str | None]:
	"""Return the global product brand configured for website/app chrome."""
	app_name = (frappe.get_website_settings("app_name") or DEFAULT_APP_NAME).strip() or DEFAULT_APP_NAME
	logo = (get_app_logo() or "").strip() or None

	return {
		"app_name": app_name,
		"logo": logo,
		"initials": get_brand_initials(app_name),
	}
