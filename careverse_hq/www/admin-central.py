import frappe
from frappe.utils import get_system_timezone

no_cache = 1


def get_context():
	csrf_token = frappe.sessions.get_csrf_token()
	context = frappe._dict()
	context.boot = get_boot()
	context.boot.csrf_token = csrf_token
	return context


@frappe.whitelist(methods=["POST"], allow_guest=True)
def get_context_for_dev():
	if not frappe.conf.developer_mode:
		frappe.throw("This method is only meant for developer mode")
	return get_boot()


def get_boot():
	"""Provide boot data including session info for React app authentication"""
	return frappe._dict(
		{
			"frappe_version": "frappe.version",
			"site_name": frappe.local.site,
			"read_only_mode": frappe.flags.read_only,
			"system_timezone": get_system_timezone(),
			"session": {
				"user": frappe.session.user,
				"user_fullname": frappe.utils.get_fullname(frappe.session.user),
				"user_image": frappe.db.get_value("User", frappe.session.user, "user_image"),
			},
			"user": {
				"name": frappe.session.user,
				"email": frappe.session.user,
				"full_name": frappe.utils.get_fullname(frappe.session.user),
				"user_image": frappe.db.get_value("User", frappe.session.user, "user_image"),
				"roles": frappe.get_roles(frappe.session.user),
			}
		}
	)
