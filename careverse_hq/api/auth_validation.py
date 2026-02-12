"""
Authentication Validation API
Provides endpoints for client to validate session state

This is a fallback endpoint used when client-side boot data is missing or inconsistent.
The client React app will call this to double-check authentication status with the server.
"""

import frappe
from frappe import _


@frappe.whitelist(allow_guest=True)
def validate_session():
	"""
	Validate if current session is authenticated.

	This is a fallback endpoint when client-side boot data is missing or inconsistent.

	Returns:
		{
			"is_authenticated": bool,
			"user": str or None,
			"full_name": str or None,
			"user_image": str or None,
			"roles": list[str]
		}
	"""
	try:
		user = frappe.session.user

		# Check if user is authenticated (not Guest)
		is_authenticated = user and user != 'Guest'

		if not is_authenticated:
			return {
				"is_authenticated": False,
				"user": None,
				"full_name": None,
				"user_image": None,
				"roles": []
			}

		# User is authenticated, return their data
		full_name = frappe.utils.get_fullname(user)
		user_image = frappe.db.get_value("User", user, "user_image")
		roles = frappe.get_roles(user)

		return {
			"is_authenticated": True,
			"user": user,
			"full_name": full_name,
			"user_image": user_image,
			"roles": roles
		}

	except Exception as e:
		frappe.log_error(
			message=frappe.get_traceback(),
			title="Session Validation Error"
		)
		return {
			"is_authenticated": False,
			"user": None,
			"full_name": None,
			"user_image": None,
			"roles": [],
			"error": str(e)
		}
