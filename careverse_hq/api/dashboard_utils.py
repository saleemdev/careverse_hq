"""
Dashboard Utility Functions

Helper functions for dashboard API endpoints.
"""

import frappe
from typing import Optional, List, Dict
from collections import defaultdict
from frappe.utils import get_first_day, get_last_day, add_months, getdate, today


def get_user_company(user: Optional[str] = None) -> Optional[str]:
    """
    Get user's Company from User Permission.
    
    Args:
        user: User email (defaults to current session user)
    
    Returns:
        Company name or None if no permission found
    """
    if not user:
        user = frappe.session.user
    
    perms = frappe.get_all(
        "User Permission",
        filters={"user": user, "allow": "Company"},
        fields=["for_value", "is_default"],
        order_by="is_default desc",
        limit=1
    )
    return perms[0].for_value if perms else None


def validate_user_facilities(user: str, company: str, facility_ids: List[str]) -> List[str]:
    """
    Ensure facilities belong to user's company.
    
    Args:
        user: User email
        company: Company name
        facility_ids: List of facility hie_ids to validate
    
    Returns:
        List of valid facility hie_ids
    """
    if not facility_ids:
        return []
    
    valid_facilities = frappe.get_all(
        "Health Facility",
        filters={
            "hie_id": ["in", facility_ids],
            "organization_company": company
        },
        pluck="hie_id"
    )
    return valid_facilities


def generate_monthly_trend(records: List[dict], date_field: str) -> List[dict]:
    """
    Group records by month from date field.
    
    Args:
        records: List of dict records
        date_field: Field name containing date
    
    Returns:
        List of dicts with 'month' and 'count' keys
    """
    by_month = defaultdict(int)
    for record in records:
        date = record.get(date_field)
        if date:
            # Handle both string and date objects
            if isinstance(date, str):
                date = getdate(date)
            month_key = date.strftime("%Y-%m") if date else None
            if month_key:
                by_month[month_key] += 1
    
    return [{"month": k, "count": v} for k, v in sorted(by_month.items())]


def get_period_dates(period_type: str = "monthly"):
    """
    Get start and end dates for current and previous periods.
    
    Args:
        period_type: 'monthly', 'quarterly', or 'yearly'
    
    Returns:
        dict with current_start, current_end, prev_start, prev_end
    """
    if period_type == "monthly":
        current_start = get_first_day()
        current_end = get_last_day()
        prev_start = get_first_day(add_months(current_start, -1))
        prev_end = get_last_day(prev_start)
    elif period_type == "quarterly":
        # Simplified - would need proper quarter calculation
        current_start = get_first_day()
        current_end = get_last_day()
        prev_start = get_first_day(add_months(current_start, -3))
        prev_end = get_last_day(add_months(prev_start, 2))
    else:  # yearly
        current_start = getdate(f"{today().year}-01-01")
        current_end = getdate(f"{today().year}-12-31")
        prev_start = getdate(f"{today().year - 1}-01-01")
        prev_end = getdate(f"{today().year - 1}-12-31")
    
    return {
        "current_start": current_start,
        "current_end": current_end,
        "prev_start": prev_start,
        "prev_end": prev_end
    }


def resolve_health_facility_reference(facility_ref: Optional[str]) -> Dict[str, str]:
    """Resolve a facility reference to canonical facility metadata.

    Supports references stored as Health Facility docname, HIE ID, and other
    common identifier fields. Always returns a stable payload so API consumers
    can render a facility name even when the source doctype does not store one.
    """
    normalized_ref = (str(facility_ref).strip() if facility_ref is not None else "")
    if not normalized_ref:
        return {
            "facility_docname": "",
            "facility_id": "",
            "facility_name": ""
        }

    fieldnames = ["name", "hie_id", "facility_name"]
    facility = frappe.db.get_value(
        "Health Facility",
        normalized_ref,
        fieldnames,
        as_dict=True
    )

    if not facility:
        meta = frappe.get_meta("Health Facility")
        lookup_fields = ["hie_id"]
        for optional_field in (
            "facility_mfl",
            "registration_number",
            "facility_id",
            "facility_code",
            "facility_fid",
        ):
            if meta.has_field(optional_field):
                lookup_fields.append(optional_field)

        for lookup_field in lookup_fields:
            facility = frappe.db.get_value(
                "Health Facility",
                {lookup_field: normalized_ref},
                fieldnames,
                as_dict=True
            )
            if facility:
                break

    if facility:
        return {
            "facility_docname": facility.get("name") or "",
            "facility_id": facility.get("hie_id") or normalized_ref,
            "facility_name": facility.get("facility_name") or normalized_ref
        }

    return {
        "facility_docname": "",
        "facility_id": normalized_ref,
        "facility_name": normalized_ref
    }
