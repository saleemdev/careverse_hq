# Copyright (c) 2025, HealthPro and contributors
# For license information, please see license.txt

"""
Facility Metrics API

This module provides API endpoints for retrieving facility metrics data.
All endpoints respect user permissions via Frappe's permission system.
"""

import frappe
import json
from careverse_hq.api.utils import api_response, sanitize_request
from healthpro_erp.healthpro_erp.decorators.permissions import auth_required


@frappe.whitelist()
@sanitize_request
@auth_required()
def get_latest_metrics(**kwargs):
    """
    Get latest facility metrics grouped by facility with pagination

    This endpoint returns the most recent metrics for facilities that the user
    has permission to access. Metrics are automatically filtered based on User
    Permissions set on the Health Facility doctype.

    Args (kwargs):
        health_facility (str, optional): Filter by specific facility ID
        metric_type (str, optional): Filter by specific metric type name
        page_size (int, optional): Number of facilities per page (default: 5, max: 100)
        page_number (int, optional): Page number, 1-based (default: 1)

    Returns:
        dict: API response with facilities, metrics, and pagination info

    Response Format:
        {
            "status": "success",
            "data": {
                "facilities": [
                    {
                        "health_facility": "FAC-001",
                        "facility_name": "Nairobi General Hospital",
                        "metrics": {
                            "Total Staff": {
                                "metric_name": "FM-00001",
                                "metric_value": 45,
                                "previous_period_value": 40,
                                "percentage_change": 12.5,
                                "change_direction": "Increase",
                                "calculation_date": "2025-10-09",
                                "period_type": "Monthly",
                                "period_start_date": "2025-10-01",
                                "period_end_date": "2025-10-31",
                                "metric_details": {
                                    "total": 45,
                                    "breakdown": []
                                }
                            },
                            ...
                        }
                    },
                    ...
                ]
            },
            "pagination": {
                "current_page": 1,
                "page_size": 5,
                "total_facilities": 45,
                "total_pages": 9,
                "has_next_page": true,
                "has_previous_page": false
            }
        }

    Example Usage:
        # Get all latest metrics for user's facilities (first page)
        GET /api/method/careverse_hq.api.facility_metrics.get_latest_metrics

        # Get metrics for specific facility
        GET /api/method/careverse_hq.api.facility_metrics.get_latest_metrics?health_facility=FAC-001

        # Get only Total Staff metrics across all facilities
        GET /api/method/careverse_hq.api.facility_metrics.get_latest_metrics?metric_type=Total Staff

        # Get page 2 with 10 facilities per page
        GET /api/method/careverse_hq.api.facility_metrics.get_latest_metrics?page_size=10&page_number=2
    """
    try:
        # Extract and validate parameters
        health_facility = kwargs.get("health_facility")
        metric_type_name = kwargs.get("metric_type")
        page_size = min(int(kwargs.get("page_size", 5)), 20)  # Default 5, max 100
        page_number = max(int(kwargs.get("page_number", 1)), 1)  # Default 1, min 1

        # Validate metric type if provided
        metric_type_id = None
        if metric_type_name:
            metric_type_id = frappe.db.get_value(
                "Registry Dictionary Concept",
                {
                    "concept_name": metric_type_name,
                    "concept_class": "Facility Metric Type",
                },
                "name",
            )

            if not metric_type_id:
                return api_response(
                    success=False,
                    message=f"Invalid metric type: '{metric_type_name}' does not exist",
                    status_code=400,
                )

        # Build filters for facilities
        facility_filters = {}
        if health_facility:
            facility_filters["name"] = health_facility

        # Get total count of accessible facilities (for pagination)
        total_facilities = frappe.db.count("Health Facility", filters=facility_filters)

        # Calculate pagination start
        start = (page_number - 1) * page_size

        # Get facilities with pagination (respects user permissions automatically)
        facilities = frappe.get_list(
            "Health Facility",
            fields=["name", "facility_name", "department"],
            filters=facility_filters,
            order_by="facility_name asc",
            start=start,
            limit_page_length=page_size,
            ignore_permissions=False,  
        )

        # If no facilities found
        if not facilities:
            return api_response(
                success=True,
                message=(
                    "No facilities accessible"
                    if not health_facility
                    else "Facility not found or no permission"
                ),
                data={"facilities": []},
                pagination={
                    "current_page": page_number,
                    "per_page": page_size,
                    "total_count": 0,
                },
            )

        # Build response data
        facilities_data = []

        for facility in facilities:
            # Get department name if department exists
            department_name = None
            if facility.get("department"):
                department_name = frappe.db.get_value(
                    "Department", facility.department, "department_name"
                )

            # Build filters for metrics
            metric_filters = {"health_facility": facility.name, "is_latest": 1}

            if metric_type_id:
                metric_filters["metric_type"] = metric_type_id

            # Get latest metrics for this facility
            metrics = frappe.get_list(
                "Facility Metrics",
                fields=[
                    "name",
                    "metric_type",
                    "metric_value",
                    "previous_period_value",
                    "percentage_change",
                    "change_direction",
                    "calculation_date",
                    "period_type",
                    "period_start_date",
                    "period_end_date",
                    "metric_details",
                ],
                filters=metric_filters,
                ignore_permissions=False, 
            )

            # Group metrics by type
            metrics_dict = {}

            for metric in metrics:
                # Get metric type name
                metric_type_concept_name = frappe.db.get_value(
                    "Registry Dictionary Concept", metric.metric_type, "concept_name"
                )

                # Get period type name
                period_type_name = frappe.db.get_value(
                    "Registry Dictionary Concept", metric.period_type, "concept_name"
                )

                # Parse metric_details JSON
                metric_details = {}
                if metric.metric_details:
                    try:
                        metric_details = json.loads(metric.metric_details)
                    except (json.JSONDecodeError, TypeError):
                        # If JSON parsing fails, return empty structure
                        metric_details = {"total": 0, "breakdown": []}
                else:
                    metric_details = {"total": 0, "breakdown": []}

                # Build metric data
                metrics_dict[metric_type_concept_name] = {
                    "metric_name": metric.name,
                    "metric_value": metric.metric_value or 0,
                    "previous_period_value": metric.previous_period_value or 0,
                    "percentage_change": metric.percentage_change or 0,
                    "change_direction": metric.change_direction or "No Change",
                    "calculation_date": (
                        str(metric.calculation_date)
                        if metric.calculation_date
                        else None
                    ),
                    "period_type": period_type_name,
                    "period_start_date": (
                        str(metric.period_start_date)
                        if metric.period_start_date
                        else None
                    ),
                    "period_end_date": (
                        str(metric.period_end_date) if metric.period_end_date else None
                    ),
                    "metric_details": metric_details,
                }

            # Add facility data
            facilities_data.append(
                {
                    "health_facility": facility.name,
                    "facility_name": facility.facility_name,
                    "metrics": metrics_dict,
                }
            )

        # Build pagination metadata (matching api_response expected format)
        pagination = {
            "current_page": page_number,
            "per_page": page_size,
            "total_count": total_facilities,
        }

        # Return success response
        return api_response(
            success=True,
            message="Metrics retrieved successfully",
            data={"facilities": facilities_data},
            pagination=pagination,
        )

    except ValueError as e:
        # Handle invalid page_size or page_number
        return api_response(
            success=False, message=f"Invalid parameter: {str(e)}", status_code=400
        )

    except frappe.PermissionError as e:
        # Handle permission errors
        frappe.log_error(
            title="Facility Metrics API Error - Permission denied:",
            message=f"Error in get_latest_metrics: {str(e)}",
        )
        return api_response(
            success=False,
            message="Permission denied: You don't have access to the requested facilies",
            status_code=403,
        )

    except Exception as e:
        # Log unexpected errors
        frappe.log_error(
            title="Facility Metrics API Error",
            message=f"Error in get_latest_metrics: {str(e)}\n\n{frappe.get_traceback()}",
        )

        return api_response(
            success=False,
            message="An error occurred while retrieving metrics. Please try again later.",
            status_code=500,
        )
