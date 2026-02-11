import frappe, re
from frappe import _, _dict
from typing import Any, Dict
from .utils import api_response, sanitize_request
from healthpro_erp.healthpro_erp.decorators.permissions import auth_required, AuthError
from healthpro_erp.healthpro_erp.doctype.webapp_notification.webapp_notification import PRIORITIES, SENDER_TYPES, ACTIONABLE

# ===== Helper Functions =====

def _format_duplicate_entry_validation_msg(error_msg):
    m = re.search(r"Duplicate entry '([^']+)' for key '([^']+)'", error_msg)
    if m:
        dup_value, dup_field = m.groups()
        field_label = dup_field.replace("_", " ").title()
        msg = "Department already exist with primary field '{}'. Please provide a unique value as department name.".format(dup_value)
        return msg
    return error_msg

def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except Exception:
        return default

def _paginate(start: int, page_size: int, total: int) -> Dict[str, Any]:
    return {
        "current_page": int(start // page_size) + 1,
        "per_page": page_size,
        "total_count": total,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }
    
def _build_pagination_params(params, page_size_field = "limit", curr_page_field = "page"):
    curr_page = max(1, _safe_int(params.get(curr_page_field), 1))
    page_size = min(100, _safe_int(params.get(page_size_field), 20))
    offset = (curr_page - 1) * page_size
    return page_size, offset

def _read_query_params(kwargs: dict, expected_fields: list[str]) -> dict:
    """
    Extract and normalize common query params from API kwargs
    by extracting expected fields.
    """
    params = {}

    for field in expected_fields:
        params[field] = kwargs.get(field)

    return params

def _validate_request_data(
    params: dict, required_fields: list[tuple[str, str]]
) -> None:
    """
    Validate request params. Raises frappe.ValidationError on failure.
    
    Args:
        params (dict): Request parameters.
        required_fields (list[tuple[str, str]]): 
            List of (field_name, display_name) tuples for validation.

    Raises:
        frappe.ValidationError: If any required field is missing or falsy.
    """
    required_fields = required_fields or []

    missing_fields = []
    for field, display_name in required_fields:
        field_value = params.get(field)
        if isinstance(field_value, str):
            field_value = field_value.strip()
        if field_value is None or field_value == "":
            missing_fields.append("{display} ('{field}')".format(display=display_name, field=field))

    if missing_fields:
        message = "Missing required fields: " + ", ".join(missing_fields)
        frappe.throw(message, frappe.ValidationError)

def _build_notification_filter(params):
    filters = {}

    if params.get("unread_only"):
        filters["is_read"] = 0

    # Notification type (can be string or list)
    notification_type = params.get("notification_type")
    if notification_type:
        if isinstance(notification_type, list):
            filters["notification_type"] = ["in", notification_type]
        else:
            filters["notification_type"] = notification_type
    
    if params.get("is_actionable"):
        filters["is_actionable"] = params["is_actionable"]
    
    # Priority (can be string or list)
    priority = params.get("priority")
    if priority:
        if isinstance(priority, list):
            filters["priority"] = ["in", priority]
        else:
            filters["priority"] = priority

    return filters

def _build_mark_read_filter(params):
    filters = {}
    
    filters["is_read"] = 0
    
    notification_ids = params.get("notification_ids")
    if notification_ids:
        filters["name"] = ["in", notification_ids]
        
    return filters

# ===== Data Access Functions =====

@auth_required()
def _fetch_notifications(notifications_filters, start, page_size):
    
    # Fetch notifications
    notifications = frappe.get_list(
        "WebApp Notification",
        filters=notifications_filters,
        fields=[
            "name",
            "recipient_user",
            "sender_user",
            "sender_type",
            "notification_type",
            "priority",
            "is_actionable",
            "title",
            "content",
            "is_read",
            "read_at",
            "expires_at",
            "created",
            "modified"
        ],
        order_by="creation desc",
        page_length=page_size,
        start=start
    )
    if not notifications:
        return {
            "notifications_list": {
                "unread_count": 0,
                "total_count": 0,
                "notifications": [],
            },
            "total_notifications": 0
        }
    
    # Total count
    notifications_total = frappe.get_list(
        "WebApp Notification",
        filters=notifications_filters,
        fields=[
            "count(name) as total_count"
        ]
    )
    notifications_count = notifications_total[0].total_count if notifications_total else 0
    
    # Unread count
    if notifications_filters.get("is_read") != 0:
        notifications_filters["is_read"] = 0
        unread_notifications_total = frappe.get_list(
            "WebApp Notification",
            filters=notifications_filters,
            fields=[
                "count(name) as unread_count"
            ]
        )
        unread_notifications_count = unread_notifications_total[0].unread_count if unread_notifications_total else 0
    else:
        unread_notifications_count = notifications_count
    
    return {
        "notifications_list": {
            "unread_count": unread_notifications_count,
            "total_count": notifications_count,
            "notifications": notifications,
        },
        "total_notifications": notifications_count
    }

@auth_required()
def _mark_notifications_as_read(notifications_filters):
    
    # Fetch notifications
    notifications = frappe.get_list(
        "WebApp Notification",
        filters=notifications_filters,
        fields=[
            "name",
            "is_read"
        ]
    )
    
    # Mark notifications read
    marked_count = 0
    failed_ids = []
    
    for notification in notifications:
        try:
            if not notification.is_read:
                frappe.db.set_value(
                    "WebApp Notification",
                    notification.name,
                    {
                        "is_read": 1,
                        "read_at": frappe.utils.now()
                    },
                    update_modified=False
                )
                marked_count += 1
        except Exception as e:
            failed_ids.append(notification.name)
            frappe.log_error(f"Failed to mark notification {notification.name} as read: {str(e)}")
    frappe.db.commit()
    
    return {
        "marked_count": marked_count,
        "failed_ids": failed_ids
    }
        

# ===== API Functions =====
@frappe.whitelist(methods=['GET'])
@sanitize_request
def fetch_notifications(**kwargs):
    """
    Retrieves notifications for the authenticated user with filtering and pagination support.
    Args:
        unread_only         (int): Optional If 1, returns only unread notifications.
        notification_type   (str): Optional Filter by specific notification type name.
        is_actionable       (str): Optional Filter by "Actionable" or "Informational"
        priority            (str): Optional Filter by priority level "Low", "Medium", "High", "Urgent"
        limit               (int): page size   (default 10)
        page                (int): page number (default 1)
    Returns:
        dict: API response with success status and notifications list
        {
            "status": "success",
            "data": {
                "unread_count": 5,
                "total_count": 47,
                "notifications": [
                    {
                        "name": "NOTIF-2025-00123",
                        "recipient_user": "user@example.com",
                        "sender_user": "doctor@example.com",
                        "sender_type": "User",
                        "notification_type": "shift_change_request",
                        "priority": "High",
                        "is_actionable": "Actionable",
                        "title": "Shift Change Request",
                        "content": "John Doe has requested to swap shifts with you on November 15th from Morning Shift to Night Shift on November 14th.",
                        "is_read": 0,
                        "read_at": null,
                        "expires_at": "2025-11-15 23:59:59",
                        "created": "2025-11-08 10:30:00",
                        "modified": "2025-11-08 10:30:00"
                    }
                ]
            },
            "pagination": {
                "current_page": 1,
                "per_page": 10,
                "total_count": 1,
                "total_pages": 1
            }
        }
    """
    try:
        expected_data = ["unread_only", "notification_type", "is_actionable", "priority", "limit", "page"]

        request_data = _read_query_params(kwargs, expected_data)
        page_size, start = _build_pagination_params(request_data)
        
        if (request_data.get("unread_only") is not None) and (request_data.get("unread_only") not in [1, 0, "1", "0"]):
            frappe.throw(_("Invalid Notification Read status ('unread_only') value. Use 1 or 0."), frappe.ValidationError)
        elif request_data.get("unread_only"):
            request_data["unread_only"] = int(request_data.get("unread_only"))
        if request_data.get("is_actionable") and request_data.get("is_actionable") not in ACTIONABLE:
            frappe.throw(_("Invalid Notification Actionable value ('is_actionable') value. Use 'Actionable' or 'Informational'."), frappe.ValidationError)
        if request_data.get("priority") and request_data.get("priority") not in PRIORITIES:
            frappe.throw(_("Invalid Notification Priority value ('priority') value. Use 'Low' or 'Medium' or 'High' or 'Urgent'."), frappe.ValidationError)
        
        notifications_filters = _build_notification_filter(request_data)
        notifications_response = _fetch_notifications(notifications_filters, start, page_size)
        
        return api_response(
            success=True,
            data=notifications_response.get("notifications_list"),
            status_code=200,
            pagination=_paginate(start, page_size, notifications_response.get("total_notifications"))
        )
        
    except PermissionError as pe:
        return api_response(success=False, message=str(pe), status_code=403)

    except frappe.ValidationError as ve:
        frappe.log_error(frappe.get_traceback(), "Notifications fetch Failed")                
        return api_response(success=False, message=str(ve), status_code=400)

    except AuthError as ae:
        return api_response(success=False, message=ae.message, status_code=ae.status_code)
    
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Notifications fetch Failed")
        return api_response(success=False, message="Failed to fetch Notifications", status_code=500)
     
@frappe.whitelist(methods=['PUT'])
def mark_as_read(**kwargs):
    """
    Update Notifications 'Mark as Read' using request payload.
    Args:
        mark_all: 1 or 0
        notification_ids (array): ["NOTIF-2025-00123", "NOTIF-2025-00124"], Required if 'mark_all' is 0
    Returns:
        dict: API response with success status and department name and id
        {
            "status": "success",
            "data": {
                "marked_count": 2,
                "failed_ids": []
            }
        }
    """
    try:
        expected_data = ["mark_all", "notification_ids"]
        request_data = _read_query_params(kwargs, expected_data)
        
        mark_all = request_data.get("mark_all")
        notification_ids = request_data.get("notification_ids")
        
        if mark_all is None:
            mark_all = 0
        if mark_all not in [1, 0]:
            frappe.throw(_("Field 'mark_all' must be a 1 or 0."), frappe.ValidationError)
        if not mark_all:
            if not notification_ids or not isinstance(notification_ids, list):
                frappe.throw(_("Field 'notification_ids' must be a non-empty list."), frappe.ValidationError)
            
        mark_read_notifications_filters = _build_mark_read_filter(request_data)
        notifications_updation = _mark_notifications_as_read(mark_read_notifications_filters)
        
        return api_response(
            success=True,
            data={
                "marked_count": notifications_updation.get("marked_count"),
                "failed_ids": notifications_updation.get("failed_ids")
            },
            status_code=200
        )
        
    except PermissionError as pe:
        return api_response(success=False, message=str(pe), status_code=403)

    except frappe.ValidationError as ve:
        frappe.log_error(frappe.get_traceback(), "Notifications Updation Failed")                
        return api_response(success=False, message=str(ve), status_code=400)

    except AuthError as ae:
        return api_response(success=False, message=ae.message, status_code=ae.status_code)
    
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Notifications Updation Failed")
        return api_response(success=False, message="Failed to update Notification", status_code=500)
