"""Public jobs list page."""

import frappe

from careverse_hq.branding import get_configured_app_brand
from careverse_hq.public_page_context import apply_public_page_context

no_cache = True


def get_context(context):
    request = getattr(frappe.local, "request", None)
    current_path = (getattr(request, "path", None) or "/jobs").strip() or "/jobs"
    if current_path.startswith("/jobs") is False:
        current_path = "/jobs"

    job_slug = ""
    if current_path.startswith("/jobs/"):
        job_slug = current_path[len("/jobs/"):].strip("/")

    brand = get_configured_app_brand()
    context.job_slug = job_slug
    apply_public_page_context(
        context,
        title=f"Healthcare Jobs - {brand['app_name']}",
        current_path=current_path,
        page_label="Public Jobs Board",
    )
    return context
