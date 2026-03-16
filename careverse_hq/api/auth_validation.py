"""
Authentication Validation API
Provides endpoints for client to validate session state

This is a fallback endpoint used when client-side boot data is missing or inconsistent.
The client React app will call this to double-check authentication status with the server.
"""

import frappe
from frappe import _
import frappe.sessions


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


@frappe.whitelist()
def get_csrf_token():
	"""Return the current session's CSRF token.

	Used by the React frontend to recover from stale tokens without
	a full page reload.  Only authenticated users can call this
	(no allow_guest) so it cannot be abused.
	"""
	return {"csrf_token": frappe.sessions.get_csrf_token()}
