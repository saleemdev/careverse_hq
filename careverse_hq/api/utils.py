"""
API utilities for CareVerse HQ
"""

import frappe
import math


def api_response(
    success=False, data=None, message=None, status_code=200, pagination=None
):
    """
    Standardize API responses across the application

    Args:
        success (bool): Whether the operation was successful
        data (Any): Data to return on success
        message (str): Error message or success message
        status_code (int): HTTP status code
        pagination (dict): Pagination metadata

    Returns:
        None: Sets frappe.local.response with standardized format
    """
    frappe.local.response.http_status_code = status_code

    response_data = {"status": "success" if success else "error"}

    # For success responses, include data
    if success and data is not None:
        response_data["data"] = data

    # For error responses, include message
    if not success and message is not None:
        response_data["message"] = message

    # For success responses with a message
    if success and message is not None:
        response_data["message"] = message

    if pagination:
        response_data["pagination"] = {
            "current_page": pagination["current_page"],
            "per_page": pagination["per_page"],
            "total_count": pagination["total_count"],
            "total_pages": math.ceil(
                pagination["total_count"] / int(pagination["per_page"])
            )
            or 1,
        }

    frappe.local.response.update(response_data)

    # Clear server messages in production to prevent leaking internal errors
    if not frappe.conf.get("developer_mode") or frappe.conf.get("developer_mode") == 0:
        frappe.clear_messages()
        frappe.local.response.pop("_server_messages", None)
