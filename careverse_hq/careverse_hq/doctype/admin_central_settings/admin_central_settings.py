import frappe
from frappe.model.document import Document


class AdminCentralSettings(Document):

	@staticmethod
	def get_oversight_roles() -> set[str]:
		"""Return the set of role names configured as oversight roles.

		Results are cached per-request so repeated calls within one
		API invocation are free.
		"""
		cache_key = "admin_central_oversight_roles"
		cached = frappe.local.flags.get(cache_key)
		if cached is not None:
			return cached

		try:
			doc = frappe.get_single("Admin Central Settings")
			roles = {row.role for row in (doc.oversight_roles or [])}
		except Exception:
			roles = set()

		frappe.local.flags[cache_key] = roles
		return roles

	@staticmethod
	def is_oversight_user(user: str | None = None) -> bool:
		"""Check whether *user* holds any of the configured oversight roles."""
		user = user or frappe.session.user
		user_roles = set(frappe.get_roles(user))
		return bool(user_roles & AdminCentralSettings.get_oversight_roles())
