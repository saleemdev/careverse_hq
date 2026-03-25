from urllib.parse import quote

import frappe


_PORTAL_ONLY_ROLES = {"Guest", "All", "Website User"}


def apply_public_page_context(context, *, title, current_path, page_label="Jobs Board"):
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
    context.header_context_label = page_label

    user = frappe.session.user
    is_authenticated = bool(user and user != "Guest")
    context.is_authenticated = is_authenticated
    context.current_path = current_path

    if not is_authenticated:
        context.header_sign_in_link = f"/login?redirect-to={quote(current_path or '/jobs', safe='/#?=&')}"
        context.header_primary_link = None
        context.header_primary_label = None
        context.profile_link = "/admin-central#profile"
        context.admin_central_link = "/admin-central"
        context.has_admin_access = False
        context.user_full_name = None
        context.user_initials = None
        context.user_email = None
        context.user_role_label = None
        context.header_context_mode = "Public access"
        return context

    full_name = frappe.utils.get_fullname(user) or user
    roles = set(frappe.get_roles(user))
    can_access_admin_central = bool(roles - _PORTAL_ONLY_ROLES)

    context.user_full_name = full_name
    context.user_initials = _build_initials(full_name)
    context.user_email = user
    context.header_sign_in_link = None
    context.admin_central_link = "/admin-central"
    context.profile_link = "/admin-central#profile"
    context.has_admin_access = can_access_admin_central
    context.header_primary_link = context.admin_central_link if can_access_admin_central else context.profile_link
    context.header_primary_label = "Back to Admin Central" if can_access_admin_central else "My Profile"
    context.user_role_label = "Executive dashboard user" if can_access_admin_central else "Signed-in applicant"
    context.header_context_mode = "Executive session" if can_access_admin_central else "Applicant session"

    return context


def _build_initials(name):
    parts = [part for part in (name or "").strip().split() if part]
    if not parts:
        return "CV"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()
