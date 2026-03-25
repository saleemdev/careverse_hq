"""Public job detail page."""

import frappe

from careverse_hq.public_page_context import apply_public_page_context

no_cache = True


def get_context(context):
    slug = (frappe.form_dict.get("job_slug") or "").strip()
    if not slug:
        request = getattr(frappe.local, "request", None)
        path = (getattr(request, "path", None) or "").strip()
        if path.startswith("/jobs/"):
            slug = path[len("/jobs/"):].strip("/")

    slug = slug.strip("/")
    context.job_slug = slug
    current_path = f"/jobs/{slug}" if slug else "/jobs"
    apply_public_page_context(
        context,
        title="Job Details - CareVerse HQ",
        current_path=current_path,
        page_label="Role Detail",
    )
    return context
