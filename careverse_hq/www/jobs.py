"""Public jobs list page."""

import frappe

from careverse_hq.public_page_context import apply_public_page_context

no_cache = True


def get_context(context):
    request = getattr(frappe.local, "request", None)
    current_path = getattr(request, "path", None) or "/jobs"
    apply_public_page_context(
        context,
        title="Healthcare Jobs - CareVerse HQ",
        current_path=current_path,
    )
    return context
