"""
Lightweight API response helper for dashboard APIs
Avoids heavy dependencies from utils.py
"""

import frappe


def api_response(success=False, data=None, message=None, status_code=200, pagination=None):
    """
    Standardize API responses across the application

    Args:
        success (bool): Whether the operation was successful
        data (Any): Data to return on success
        message (str): Error message or success message
        status_code (int): HTTP status code
        pagination (dict): Pagination metadata

    Returns:
        dict: Standardized response format compatible with Frappe's message wrapper
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

    # Include pagination if provided
    if pagination is not None:
        response_data["pagination"] = pagination

    return response_data
