"""Public jobs list page."""

import frappe

from careverse_hq.public_page_context import apply_public_page_context

no_cache = True


def get_context(context):
    current_path = "/jobs"
    apply_public_page_context(
        context,
        title="Healthcare Jobs - CareVerse HQ",
        current_path=current_path,
        page_label="Public Jobs Board",
    )
    return context
