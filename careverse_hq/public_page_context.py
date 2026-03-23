from urllib.parse import quote

import frappe


_PORTAL_ONLY_ROLES = {"Guest", "All", "Website User"}


def apply_public_page_context(context, *, title, current_path):
    """Populate shared website context for public-facing jobs pages."""
    context.no_cache = 1
    context.no_header = True
    context.no_breadcrumbs = True
    context.title = title
    context.app_name = "CareVerse HQ"
    context.logo = "/assets/careverse_hq/images/logo.svg"
    context.site_url = frappe.utils.get_url()
    context.current_year = frappe.utils.now_datetime().year
    context.csrf_token = frappe.sessions.get_csrf_token()

    user = frappe.session.user
    is_authenticated = bool(user and user != "Guest")
    context.is_authenticated = is_authenticated
    context.current_path = current_path

    if not is_authenticated:
        context.header_sign_in_link = f"/login?redirect-to={quote(current_path or '/jobs', safe='/#?=&')}"
        context.header_primary_link = None
        context.header_primary_label = None
        context.user_full_name = None
        context.user_initials = None
        context.user_email = None
        return context

    full_name = frappe.utils.get_fullname(user) or user
    roles = set(frappe.get_roles(user))
    can_access_admin_central = bool(roles - _PORTAL_ONLY_ROLES)

    context.user_full_name = full_name
    context.user_initials = _build_initials(full_name)
    context.user_email = user
    context.header_sign_in_link = None
    context.header_primary_link = "/admin-central" if can_access_admin_central else "/admin-central#profile"
    context.header_primary_label = "Open Admin Central" if can_access_admin_central else "My Profile"

    return context


def _build_initials(name):
    parts = [part for part in (name or "").strip().split() if part]
    if not parts:
        return "CV"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()
