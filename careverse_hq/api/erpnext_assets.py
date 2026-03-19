"""
ERPNext Asset Management API

New API layer for managing ERPNext Assets with facility-scoped access control.
Integrates with Asset Maintenance, Asset Repair, Asset Movement, and depreciation.

All endpoints use:
- @frappe.whitelist() for authentication (session cookie, no JWT required)
- frappe.get_list() for RBAC-compliant queries (never frappe.db.get_all)
- _count() from dashboard_utils for RBAC-safe aggregates
- api_response() for consistent response shape
"""

import frappe
from frappe import _
from frappe.utils import now_datetime, getdate, flt
from typing import Optional, List, Dict, Any
from careverse_hq.api.facilities import api_response
from .dashboard_utils import validate_user_facilities, _count
from .location_sync import (
    get_location_for_facility,
    get_facility_for_location,
    get_facility_name_for_location,
    get_locations_for_user_facilities,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _resolve_facility_locations(facility_csv: Optional[str]) -> Optional[List[str]]:
    """Parse comma-separated facility hie_ids and resolve to Location names.

    Returns None if no facility filter provided (= show all user-accessible assets).
    Returns empty list if user has no access to requested facilities.
    """
    if not facility_csv:
        return None

    facility_ids = [f.strip() for f in facility_csv.split(",") if f.strip()]
    if not facility_ids:
        return None

    locations = get_locations_for_user_facilities(facility_ids)
    return locations


def _enrich_assets_with_facility(assets: List[dict]) -> List[dict]:
    """Batch-enrich asset list items with facility_name and facility_id."""
    # Collect unique locations
    location_names = list({a.get("location") for a in assets if a.get("location")})
    if not location_names:
        return assets

    # Batch lookup: Location → Health Facility
    location_facility_map = {}
    for loc_name in location_names:
        facility_hie_id = get_facility_for_location(loc_name)
        facility_display = get_facility_name_for_location(loc_name)
        location_facility_map[loc_name] = {
            "facility_id": facility_hie_id or "",
            "facility_name": facility_display or loc_name,
        }

    for asset in assets:
        loc = asset.get("location")
        if loc and loc in location_facility_map:
            asset["facility_id"] = location_facility_map[loc]["facility_id"]
            asset["facility_name"] = location_facility_map[loc]["facility_name"]
        else:
            asset["facility_id"] = ""
            asset["facility_name"] = loc or ""

    return assets


ASSET_STATUSES = [
    "Draft",
    "Submitted",
    "Partially Depreciated",
    "Fully Depreciated",
    "In Maintenance",
    "Out of Order",
    "Scrapped",
    "Sold",
]


# ---------------------------------------------------------------------------
# Dashboard & List
# ---------------------------------------------------------------------------

@frappe.whitelist()
def get_asset_dashboard(**kwargs):
    """Dashboard KPIs and aggregates for the asset list view.

    Args (via kwargs):
        facilities: Comma-separated facility hie_ids (optional)
    """
    kwargs.pop("cmd", None)

    try:
        locations = _resolve_facility_locations(kwargs.get("facilities"))

        base_filters = {}
        if locations is not None:
            if not locations:
                return api_response(success=True, data={
                    "status_aggregates": {s.lower().replace(" ", "_"): 0 for s in ASSET_STATUSES},
                    "category_aggregates": [],
                    "maintenance_due_count": 0,
                    "overdue_maintenance_count": 0,
                })
            base_filters["location"] = ["in", locations]

        # Status aggregates
        status_agg = {"total": 0}
        for status in ASSET_STATUSES:
            key = status.lower().replace(" ", "_")
            count = _count("Asset", {**base_filters, "status": status})
            status_agg[key] = count
            status_agg["total"] += count

        # Category aggregates
        category_agg = frappe.get_list(
            "Asset",
            filters=base_filters,
            fields=["asset_category", "count(name) as count"],
            group_by="asset_category",
            limit_page_length=0,
        )

        # Maintenance counts
        maintenance_due = _count(
            "Asset",
            {**base_filters, "maintenance_required": 1},
        )

        overdue_maintenance = 0
        if maintenance_due > 0:
            # Get asset names that have maintenance required
            maint_assets = frappe.get_list(
                "Asset",
                filters={**base_filters, "maintenance_required": 1},
                pluck="name",
                limit_page_length=0,
            )
            if maint_assets:
                overdue_maintenance = _count(
                    "Asset Maintenance Log",
                    {
                        "asset_name": ["in", maint_assets],
                        "maintenance_status": "Overdue",
                    },
                )

        return api_response(
            success=True,
            data={
                "status_aggregates": status_agg,
                "category_aggregates": [
                    {"category": r.asset_category or "Uncategorized", "count": r.count}
                    for r in category_agg
                ],
                "maintenance_due_count": maintenance_due,
                "overdue_maintenance_count": overdue_maintenance,
            },
        )

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Asset Dashboard Error"))
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_assets_list(**kwargs):
    """Paginated asset list with filters.

    Args (via kwargs):
        facilities: Comma-separated facility hie_ids (optional)
        page: Page number (default 1)
        page_size: Items per page (default 20)
        status: Filter by Asset status
        category: Filter by Asset Category
        search: Search asset_name, item_code, item_name
        sort_by: Field to sort by (default "creation")
        sort_order: "asc" or "desc" (default "desc")
    """
    kwargs.pop("cmd", None)

    try:
        page = max(1, int(kwargs.get("page", 1)))
        page_size = min(100, max(1, int(kwargs.get("page_size", 20))))
    except (ValueError, TypeError):
        return api_response(success=False, message="Invalid pagination parameters", status_code=400)

    try:
        locations = _resolve_facility_locations(kwargs.get("facilities"))

        filters = {}
        if locations is not None:
            if not locations:
                return api_response(success=True, data={"items": [], "total_count": 0})
            filters["location"] = ["in", locations]

        status = kwargs.get("status")
        if status:
            filters["status"] = status

        category = kwargs.get("category")
        if category:
            filters["asset_category"] = category

        or_filters = []
        search = kwargs.get("search")
        if search:
            term = f"%{search}%"
            or_filters = [
                ["asset_name", "like", term],
                ["item_code", "like", term],
                ["item_name", "like", term],
            ]

        # Total count
        if or_filters:
            total_count = len(
                frappe.get_list(
                    "Asset",
                    filters=filters,
                    or_filters=or_filters,
                    pluck="name",
                    limit_page_length=0,
                )
            )
        else:
            total_count = _count("Asset", filters)

        # Sort
        sort_by = kwargs.get("sort_by", "creation")
        sort_order = kwargs.get("sort_order", "desc")
        allowed_sorts = ["creation", "modified", "asset_name", "purchase_date", "value_after_depreciation"]
        if sort_by not in allowed_sorts:
            sort_by = "creation"
        if sort_order not in ("asc", "desc"):
            sort_order = "desc"

        offset = (page - 1) * page_size

        fields = [
            "name", "asset_name", "item_code", "item_name", "asset_category",
            "status", "location", "custodian", "company", "department",
            "purchase_date", "gross_purchase_amount", "value_after_depreciation",
            "maintenance_required", "calculate_depreciation", "creation",
        ]

        assets = frappe.get_list(
            "Asset",
            filters=filters,
            or_filters=or_filters if or_filters else None,
            fields=fields,
            limit_start=offset,
            limit_page_length=page_size,
            order_by=f"{sort_by} {sort_order}",
        )

        # Enrich with facility info
        items = _enrich_assets_with_facility(assets)

        # Resolve custodian names
        custodian_ids = list({a.get("custodian") for a in items if a.get("custodian")})
        custodian_map = {}
        if custodian_ids:
            employees = frappe.get_list(
                "Employee",
                filters={"name": ["in", custodian_ids]},
                fields=["name", "employee_name"],
                limit_page_length=0,
            )
            custodian_map = {e.name: e.employee_name for e in employees}

        for item in items:
            item["custodian_name"] = custodian_map.get(item.get("custodian"), "")

        return api_response(
            success=True,
            data={"items": items, "total_count": total_count},
        )

    except frappe.PermissionError:
        return api_response(success=False, message="Permission denied", status_code=403)
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Asset List Error"))
        return api_response(success=False, message=str(e), status_code=500)


# ---------------------------------------------------------------------------
# Detail
# ---------------------------------------------------------------------------

@frappe.whitelist()
def get_asset_detail(**kwargs):
    """Full asset detail with related records.

    Args:
        asset_name: Asset docname (required)
    """
    kwargs.pop("cmd", None)
    asset_name = kwargs.get("asset_name")

    if not asset_name:
        return api_response(success=False, message="asset_name is required", status_code=400)

    try:
        asset = frappe.get_doc("Asset", asset_name)
    except frappe.PermissionError:
        return api_response(success=False, message="Permission denied", status_code=403)
    except frappe.DoesNotExistError:
        return api_response(success=False, message="Asset not found", status_code=404)

    try:
        result = asset.as_dict()

        # Facility info from Location
        if asset.location:
            result["facility_id"] = get_facility_for_location(asset.location) or ""
            result["facility_name"] = get_facility_name_for_location(asset.location) or asset.location
        else:
            result["facility_id"] = ""
            result["facility_name"] = ""

        # Custodian name
        if asset.custodian:
            result["custodian_name"] = frappe.db.get_value(
                "Employee", asset.custodian, "employee_name"
            ) or ""
        else:
            result["custodian_name"] = ""

        # Maintenance records
        maintenance_list = frappe.get_list(
            "Asset Maintenance",
            filters={"asset_name": asset_name},
            fields=["name", "maintenance_team", "maintenance_manager"],
            limit_page_length=5,
        )
        maintenance_records = []
        for m in maintenance_list:
            m_doc = frappe.get_doc("Asset Maintenance", m.name)
            tasks = [t.as_dict() for t in m_doc.asset_maintenance_tasks]
            maintenance_records.append({**m, "tasks": tasks})
        result["maintenance_records"] = maintenance_records

        # Maintenance logs
        result["maintenance_logs"] = frappe.get_list(
            "Asset Maintenance Log",
            filters={"asset_name": asset_name},
            fields=[
                "name", "task", "maintenance_type", "maintenance_status",
                "due_date", "completion_date", "actions_performed",
                "has_certificate", "certificate_attachment",
            ],
            order_by="due_date asc",
            limit_page_length=50,
        )

        # Recent repairs
        result["repairs"] = frappe.get_list(
            "Asset Repair",
            filters={"asset": asset_name},
            fields=[
                "name", "failure_date", "completion_date", "repair_status",
                "description", "actions_performed", "repair_cost",
                "total_repair_cost", "capitalize_repair_cost", "downtime",
            ],
            order_by="failure_date desc",
            limit_page_length=20,
        )

        # Movements
        movement_items = frappe.get_all(
            "Asset Movement Item",
            filters={"asset": asset_name},
            pluck="parent",
            limit_page_length=0,
        )
        if movement_items:
            unique_parents = list(set(movement_items))
            movements = frappe.get_list(
                "Asset Movement",
                filters={"name": ["in", unique_parents], "docstatus": 1},
                fields=["name", "purpose", "transaction_date", "company"],
                order_by="transaction_date desc",
                limit_page_length=20,
            )
            # Enrich with item details
            for mov in movements:
                items = frappe.get_all(
                    "Asset Movement Item",
                    filters={"parent": mov.name, "asset": asset_name},
                    fields=["source_location", "target_location", "from_employee", "to_employee"],
                    limit=1,
                )
                if items:
                    mov.update(items[0])
                    # Resolve names
                    if mov.get("source_location"):
                        mov["source_location_name"] = get_facility_name_for_location(mov["source_location"]) or mov["source_location"]
                    if mov.get("target_location"):
                        mov["target_location_name"] = get_facility_name_for_location(mov["target_location"]) or mov["target_location"]
                    if mov.get("from_employee"):
                        mov["from_employee_name"] = frappe.db.get_value("Employee", mov["from_employee"], "employee_name") or ""
                    if mov.get("to_employee"):
                        mov["to_employee_name"] = frappe.db.get_value("Employee", mov["to_employee"], "employee_name") or ""
            result["movements"] = movements
        else:
            result["movements"] = []

        # Depreciation
        if asset.calculate_depreciation:
            dep_schedules = frappe.get_list(
                "Asset Depreciation Schedule",
                filters={"asset": asset_name, "docstatus": 1},
                fields=["name", "finance_book"],
                limit_page_length=5,
            )
            schedules = []
            for ds in dep_schedules:
                entries = frappe.get_all(
                    "Depreciation Schedule",
                    filters={"parent": ds.name},
                    fields=[
                        "schedule_date", "depreciation_amount",
                        "accumulated_depreciation_amount", "journal_entry",
                    ],
                    order_by="schedule_date asc",
                    limit_page_length=0,
                )
                schedules.append({
                    "name": ds.name,
                    "finance_book": ds.finance_book,
                    "entries": entries,
                })
            result["depreciation_schedules"] = schedules
        else:
            result["depreciation_schedules"] = []

        # Insurance
        result["insurance"] = {
            "policy_number": asset.policy_number,
            "insurer": asset.insurer,
            "insured_value": asset.insured_value,
            "insurance_start_date": asset.insurance_start_date,
            "insurance_end_date": asset.insurance_end_date,
        }

        return api_response(success=True, data=result)

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Asset Detail Error"))
        return api_response(success=False, message=str(e), status_code=500)


# ---------------------------------------------------------------------------
# Create & Submit
# ---------------------------------------------------------------------------

@frappe.whitelist()
def create_asset(**kwargs):
    """Create a new ERPNext Asset as Draft.

    Args (via kwargs):
        asset_name (required), item_code (required), company (required),
        facility_id OR location (required),
        purchase_date, gross_purchase_amount, available_for_use_date,
        asset_category, is_existing_asset, custodian, department,
        calculate_depreciation, depreciation_method,
        total_number_of_depreciations, frequency_of_depreciation,
        expected_value_after_useful_life, depreciation_start_date
    """
    kwargs.pop("cmd", None)

    asset_name = kwargs.get("asset_name")
    item_code = kwargs.get("item_code")
    company = kwargs.get("company")

    if not all([asset_name, item_code, company]):
        return api_response(
            success=False,
            message="asset_name, item_code, and company are required",
            status_code=400,
        )

    try:
        # Validate item is a fixed asset
        item = frappe.db.get_value(
            "Item", item_code, ["is_fixed_asset", "asset_category", "item_name"], as_dict=True
        )
        if not item:
            return api_response(success=False, message=f"Item '{item_code}' not found", status_code=404)
        if not item.is_fixed_asset:
            return api_response(
                success=False,
                message=f"Item '{item_code}' is not marked as a Fixed Asset",
                status_code=400,
            )

        # Resolve location from facility_id if provided
        location = kwargs.get("location")
        facility_id = kwargs.get("facility_id")
        if facility_id and not location:
            location = get_location_for_facility(facility_id)
            if not location:
                return api_response(
                    success=False,
                    message=f"No Location found for facility '{facility_id}'. Run location sync first.",
                    status_code=400,
                )

        if not location:
            return api_response(
                success=False, message="location or facility_id is required", status_code=400
            )

        # Build asset doc
        asset_data = {
            "doctype": "Asset",
            "asset_name": asset_name,
            "item_code": item_code,
            "company": company,
            "location": location,
            "asset_category": kwargs.get("asset_category") or item.asset_category,
            "purchase_date": kwargs.get("purchase_date"),
            "gross_purchase_amount": flt(kwargs.get("gross_purchase_amount")),
            "available_for_use_date": kwargs.get("available_for_use_date"),
            "is_existing_asset": kwargs.get("is_existing_asset", 0),
            "custodian": kwargs.get("custodian"),
            "department": kwargs.get("department"),
            "calculate_depreciation": kwargs.get("calculate_depreciation", 0),
        }

        # Depreciation config
        if asset_data["calculate_depreciation"]:
            finance_book = {
                "depreciation_method": kwargs.get("depreciation_method", "Straight Line"),
                "total_number_of_depreciations": int(
                    kwargs.get("total_number_of_depreciations", 5)
                ),
                "frequency_of_depreciation": int(
                    kwargs.get("frequency_of_depreciation", 12)
                ),
                "expected_value_after_useful_life": flt(
                    kwargs.get("expected_value_after_useful_life", 0)
                ),
                "depreciation_start_date": kwargs.get("depreciation_start_date"),
            }
            asset_data["finance_books"] = [finance_book]

        doc = frappe.get_doc(asset_data)
        doc.insert()

        return api_response(
            success=True,
            message=f"Asset '{doc.name}' created as Draft",
            data={"name": doc.name, "asset_name": doc.asset_name, "status": doc.status},
        )

    except frappe.PermissionError:
        return api_response(success=False, message="Permission denied", status_code=403)
    except frappe.ValidationError as e:
        return api_response(success=False, message=str(e), status_code=400)
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Create Asset Error"))
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def submit_asset(**kwargs):
    """Submit a Draft asset.

    Args:
        asset_name (required)
    """
    kwargs.pop("cmd", None)
    asset_name = kwargs.get("asset_name")

    if not asset_name:
        return api_response(success=False, message="asset_name is required", status_code=400)

    try:
        doc = frappe.get_doc("Asset", asset_name)

        if doc.docstatus != 0:
            return api_response(
                success=False, message="Only Draft assets can be submitted", status_code=400
            )

        if not doc.available_for_use_date:
            return api_response(
                success=False,
                message="Available-for-use Date is required before submitting",
                status_code=400,
            )

        doc.submit()

        return api_response(
            success=True,
            message=f"Asset '{doc.name}' submitted",
            data={"name": doc.name, "status": doc.status},
        )

    except frappe.PermissionError:
        return api_response(success=False, message="Permission denied", status_code=403)
    except frappe.ValidationError as e:
        return api_response(success=False, message=str(e), status_code=400)
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Submit Asset Error"))
        return api_response(success=False, message=str(e), status_code=500)


# ---------------------------------------------------------------------------
# Maintenance
# ---------------------------------------------------------------------------

@frappe.whitelist()
def create_maintenance_request(**kwargs):
    """Schedule maintenance for an asset.

    Args:
        asset_name (required), maintenance_team (required),
        tasks: JSON list of task objects [{
            maintenance_task, maintenance_type, start_date, end_date,
            periodicity, assign_to, description, certificate_required
        }]
    """
    kwargs.pop("cmd", None)

    asset_name = kwargs.get("asset_name")
    maintenance_team = kwargs.get("maintenance_team")
    tasks_raw = kwargs.get("tasks")

    if not all([asset_name, maintenance_team]):
        return api_response(
            success=False,
            message="asset_name and maintenance_team are required",
            status_code=400,
        )

    try:
        import json
        tasks = json.loads(tasks_raw) if isinstance(tasks_raw, str) else (tasks_raw or [])

        if not tasks:
            return api_response(
                success=False, message="At least one maintenance task is required", status_code=400
            )

        asset = frappe.get_doc("Asset", asset_name)

        # Check if maintenance already exists (unique constraint)
        existing = frappe.db.exists("Asset Maintenance", {"asset_name": asset_name})
        if existing:
            return api_response(
                success=False,
                message=f"Maintenance schedule already exists for this asset: {existing}",
                status_code=400,
            )

        # Enable maintenance on asset
        frappe.db.set_value("Asset", asset_name, "maintenance_required", 1)

        doc = frappe.get_doc({
            "doctype": "Asset Maintenance",
            "asset_name": asset_name,
            "company": asset.company,
            "maintenance_team": maintenance_team,
            "asset_maintenance_tasks": tasks,
        })
        doc.insert()

        return api_response(
            success=True,
            message="Maintenance schedule created",
            data={"name": doc.name},
        )

    except frappe.PermissionError:
        return api_response(success=False, message="Permission denied", status_code=403)
    except frappe.ValidationError as e:
        return api_response(success=False, message=str(e), status_code=400)
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Create Maintenance Error"))
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_maintenance_schedule(**kwargs):
    """Get maintenance records, tasks, and logs for an asset.

    Args:
        asset_name (required)
    """
    kwargs.pop("cmd", None)
    asset_name = kwargs.get("asset_name")

    if not asset_name:
        return api_response(success=False, message="asset_name is required", status_code=400)

    try:
        maintenance = frappe.get_list(
            "Asset Maintenance",
            filters={"asset_name": asset_name},
            fields=["name", "maintenance_team", "maintenance_manager"],
            limit=1,
        )

        result = {"maintenance": None, "tasks": [], "logs": []}

        if maintenance:
            m_doc = frappe.get_doc("Asset Maintenance", maintenance[0].name)
            result["maintenance"] = maintenance[0]
            result["tasks"] = [t.as_dict() for t in m_doc.asset_maintenance_tasks]

        result["logs"] = frappe.get_list(
            "Asset Maintenance Log",
            filters={"asset_name": asset_name},
            fields=[
                "name", "task", "maintenance_type", "maintenance_status",
                "due_date", "completion_date", "actions_performed",
                "has_certificate", "certificate_attachment",
            ],
            order_by="due_date asc",
            limit_page_length=50,
        )

        return api_response(success=True, data=result)

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Get Maintenance Error"))
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def complete_maintenance_log(**kwargs):
    """Mark a maintenance log as completed and submit.

    Args:
        log_name (required), completion_date (required),
        actions_performed, certificate_attachment
    """
    kwargs.pop("cmd", None)

    log_name = kwargs.get("log_name")
    completion_date = kwargs.get("completion_date")

    if not all([log_name, completion_date]):
        return api_response(
            success=False, message="log_name and completion_date are required", status_code=400
        )

    try:
        doc = frappe.get_doc("Asset Maintenance Log", log_name)

        if doc.maintenance_status not in ("Planned", "Overdue"):
            return api_response(
                success=False,
                message=f"Log status is '{doc.maintenance_status}', can only complete Planned or Overdue",
                status_code=400,
            )

        doc.maintenance_status = "Completed"
        doc.completion_date = completion_date
        doc.actions_performed = kwargs.get("actions_performed", "")
        if kwargs.get("certificate_attachment"):
            doc.has_certificate = 1
            doc.certificate_attachment = kwargs["certificate_attachment"]

        doc.submit()

        return api_response(
            success=True,
            message="Maintenance log completed",
            data={"name": doc.name, "maintenance_status": doc.maintenance_status},
        )

    except frappe.PermissionError:
        return api_response(success=False, message="Permission denied", status_code=403)
    except frappe.ValidationError as e:
        return api_response(success=False, message=str(e), status_code=400)
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Complete Maintenance Log Error"))
        return api_response(success=False, message=str(e), status_code=500)


# ---------------------------------------------------------------------------
# Repairs
# ---------------------------------------------------------------------------

@frappe.whitelist()
def create_repair_request(**kwargs):
    """Create an Asset Repair in Pending status.

    Args:
        asset_name (required), failure_date (required), description (required),
        actions_performed, capitalize_repair_cost
    """
    kwargs.pop("cmd", None)

    asset_name = kwargs.get("asset_name")
    failure_date = kwargs.get("failure_date")
    description = kwargs.get("description")

    if not all([asset_name, failure_date, description]):
        return api_response(
            success=False,
            message="asset_name, failure_date, and description are required",
            status_code=400,
        )

    try:
        asset = frappe.get_doc("Asset", asset_name)

        if asset.status in ("Sold", "Scrapped"):
            return api_response(
                success=False,
                message=f"Cannot create repair for asset with status '{asset.status}'",
                status_code=400,
            )

        doc = frappe.get_doc({
            "doctype": "Asset Repair",
            "asset": asset_name,
            "failure_date": failure_date,
            "description": description,
            "actions_performed": kwargs.get("actions_performed", ""),
            "repair_status": "Pending",
            "capitalize_repair_cost": kwargs.get("capitalize_repair_cost", 0),
        })
        doc.insert()

        return api_response(
            success=True,
            message="Repair request created. Asset marked as Out of Order.",
            data={"name": doc.name, "repair_status": doc.repair_status},
        )

    except frappe.PermissionError:
        return api_response(success=False, message="Permission denied", status_code=403)
    except frappe.ValidationError as e:
        return api_response(success=False, message=str(e), status_code=400)
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Create Repair Error"))
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def complete_repair(**kwargs):
    """Complete a repair and submit.

    Args:
        repair_name (required), completion_date (required), actions_performed
    """
    kwargs.pop("cmd", None)

    repair_name = kwargs.get("repair_name")
    completion_date = kwargs.get("completion_date")

    if not all([repair_name, completion_date]):
        return api_response(
            success=False, message="repair_name and completion_date are required", status_code=400
        )

    try:
        doc = frappe.get_doc("Asset Repair", repair_name)

        if doc.repair_status != "Pending":
            return api_response(
                success=False,
                message=f"Repair status is '{doc.repair_status}', can only complete Pending repairs",
                status_code=400,
            )

        doc.repair_status = "Completed"
        doc.completion_date = completion_date
        if kwargs.get("actions_performed"):
            doc.actions_performed = kwargs["actions_performed"]

        doc.submit()

        return api_response(
            success=True,
            message="Repair completed",
            data={"name": doc.name, "repair_status": doc.repair_status},
        )

    except frappe.PermissionError:
        return api_response(success=False, message="Permission denied", status_code=403)
    except frappe.ValidationError as e:
        return api_response(success=False, message=str(e), status_code=400)
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Complete Repair Error"))
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_repairs(**kwargs):
    """Get repair records for an asset.

    Args:
        asset_name (required), repair_status (optional)
    """
    kwargs.pop("cmd", None)
    asset_name = kwargs.get("asset_name")

    if not asset_name:
        return api_response(success=False, message="asset_name is required", status_code=400)

    try:
        filters = {"asset": asset_name}
        if kwargs.get("repair_status"):
            filters["repair_status"] = kwargs["repair_status"]

        repairs = frappe.get_list(
            "Asset Repair",
            filters=filters,
            fields=[
                "name", "failure_date", "completion_date", "repair_status",
                "description", "actions_performed", "repair_cost",
                "total_repair_cost", "capitalize_repair_cost", "downtime",
            ],
            order_by="failure_date desc",
            limit_page_length=50,
        )

        return api_response(success=True, data={"items": repairs})

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Get Repairs Error"))
        return api_response(success=False, message=str(e), status_code=500)


# ---------------------------------------------------------------------------
# Movements
# ---------------------------------------------------------------------------

@frappe.whitelist()
def create_asset_movement(**kwargs):
    """Create and auto-submit an Asset Movement.

    Args:
        asset_name (required), purpose (required: Transfer|Issue|Receipt),
        target_location, to_employee, transaction_date
    """
    kwargs.pop("cmd", None)

    asset_name = kwargs.get("asset_name")
    purpose = kwargs.get("purpose")

    if not all([asset_name, purpose]):
        return api_response(
            success=False, message="asset_name and purpose are required", status_code=400
        )

    if purpose not in ("Transfer", "Issue", "Receipt"):
        return api_response(
            success=False,
            message="purpose must be one of: Transfer, Issue, Receipt",
            status_code=400,
        )

    try:
        asset = frappe.get_doc("Asset", asset_name)

        # Resolve target location from facility_id if provided
        target_location = kwargs.get("target_location")
        target_facility_id = kwargs.get("target_facility_id")
        if target_facility_id and not target_location:
            target_location = get_location_for_facility(target_facility_id)

        movement_item = {
            "asset": asset_name,
            "source_location": asset.location,
            "target_location": target_location,
            "from_employee": asset.custodian,
            "to_employee": kwargs.get("to_employee"),
        }

        doc = frappe.get_doc({
            "doctype": "Asset Movement",
            "company": asset.company,
            "purpose": purpose,
            "transaction_date": kwargs.get("transaction_date") or now_datetime(),
            "assets": [movement_item],
        })
        doc.insert()
        doc.submit()

        return api_response(
            success=True,
            message=f"Asset movement ({purpose}) completed",
            data={"name": doc.name, "purpose": doc.purpose},
        )

    except frappe.PermissionError:
        return api_response(success=False, message="Permission denied", status_code=403)
    except frappe.ValidationError as e:
        return api_response(success=False, message=str(e), status_code=400)
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Create Movement Error"))
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_asset_movements(**kwargs):
    """Get movement history for an asset.

    Args:
        asset_name (required)
    """
    kwargs.pop("cmd", None)
    asset_name = kwargs.get("asset_name")

    if not asset_name:
        return api_response(success=False, message="asset_name is required", status_code=400)

    try:
        # Get parent movement names from child table
        movement_items = frappe.get_all(
            "Asset Movement Item",
            filters={"asset": asset_name},
            pluck="parent",
            limit_page_length=0,
        )

        if not movement_items:
            return api_response(success=True, data={"items": []})

        unique_parents = list(set(movement_items))

        movements = frappe.get_list(
            "Asset Movement",
            filters={"name": ["in", unique_parents], "docstatus": 1},
            fields=["name", "purpose", "transaction_date", "company"],
            order_by="transaction_date desc",
            limit_page_length=50,
        )

        for mov in movements:
            items = frappe.get_all(
                "Asset Movement Item",
                filters={"parent": mov.name, "asset": asset_name},
                fields=["source_location", "target_location", "from_employee", "to_employee"],
                limit=1,
            )
            if items:
                mov.update(items[0])
                if mov.get("source_location"):
                    mov["source_location_name"] = (
                        get_facility_name_for_location(mov["source_location"]) or mov["source_location"]
                    )
                if mov.get("target_location"):
                    mov["target_location_name"] = (
                        get_facility_name_for_location(mov["target_location"]) or mov["target_location"]
                    )
                if mov.get("from_employee"):
                    mov["from_employee_name"] = (
                        frappe.db.get_value("Employee", mov["from_employee"], "employee_name") or ""
                    )
                if mov.get("to_employee"):
                    mov["to_employee_name"] = (
                        frappe.db.get_value("Employee", mov["to_employee"], "employee_name") or ""
                    )

        return api_response(success=True, data={"items": movements})

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Get Movements Error"))
        return api_response(success=False, message=str(e), status_code=500)


# ---------------------------------------------------------------------------
# Depreciation
# ---------------------------------------------------------------------------

@frappe.whitelist()
def get_depreciation_summary(**kwargs):
    """Get depreciation details for an asset.

    Args:
        asset_name (required)
    """
    kwargs.pop("cmd", None)
    asset_name = kwargs.get("asset_name")

    if not asset_name:
        return api_response(success=False, message="asset_name is required", status_code=400)

    try:
        asset = frappe.get_doc("Asset", asset_name)

        finance_books = []
        for fb in asset.finance_books:
            finance_books.append({
                "finance_book": fb.finance_book,
                "depreciation_method": fb.depreciation_method,
                "total_number_of_depreciations": fb.total_number_of_depreciations,
                "frequency_of_depreciation": fb.frequency_of_depreciation,
                "depreciation_start_date": fb.depreciation_start_date,
                "expected_value_after_useful_life": fb.expected_value_after_useful_life,
                "rate_of_depreciation": fb.rate_of_depreciation,
                "value_after_depreciation": fb.value_after_depreciation,
            })

        schedules = []
        dep_schedule_docs = frappe.get_list(
            "Asset Depreciation Schedule",
            filters={"asset": asset_name, "docstatus": 1},
            fields=["name", "finance_book"],
            limit_page_length=5,
        )
        for ds in dep_schedule_docs:
            entries = frappe.get_all(
                "Depreciation Schedule",
                filters={"parent": ds.name},
                fields=[
                    "schedule_date", "depreciation_amount",
                    "accumulated_depreciation_amount", "journal_entry",
                ],
                order_by="schedule_date asc",
                limit_page_length=0,
            )
            schedules.append({
                "name": ds.name,
                "finance_book": ds.finance_book,
                "entries": entries,
            })

        return api_response(
            success=True,
            data={
                "net_purchase_amount": asset.net_purchase_amount,
                "gross_purchase_amount": asset.gross_purchase_amount,
                "additional_asset_cost": asset.additional_asset_cost,
                "total_asset_cost": asset.total_asset_cost,
                "value_after_depreciation": asset.value_after_depreciation,
                "opening_accumulated_depreciation": asset.opening_accumulated_depreciation,
                "is_fully_depreciated": asset.is_fully_depreciated,
                "calculate_depreciation": asset.calculate_depreciation,
                "finance_books": finance_books,
                "schedules": schedules,
            },
        )

    except frappe.PermissionError:
        return api_response(success=False, message="Permission denied", status_code=403)
    except frappe.DoesNotExistError:
        return api_response(success=False, message="Asset not found", status_code=404)
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Depreciation Summary Error"))
        return api_response(success=False, message=str(e), status_code=500)


# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

@frappe.whitelist()
def get_asset_categories(**kwargs):
    """List asset categories.

    Args:
        search: Optional search term
    """
    kwargs.pop("cmd", None)

    try:
        filters = {}
        search = kwargs.get("search")
        if search:
            filters["asset_category_name"] = ["like", f"%{search}%"]

        categories = frappe.get_list(
            "Asset Category",
            filters=filters,
            fields=["name", "asset_category_name"],
            order_by="asset_category_name asc",
            limit_page_length=100,
            ignore_permissions=True,
        )

        return api_response(success=True, data={"items": categories})

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Get Categories Error"))
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_maintenance_teams(**kwargs):
    """List maintenance teams, optionally filtered by company.

    Args:
        company: Filter by company (optional)
    """
    kwargs.pop("cmd", None)

    try:
        filters = {}
        company = kwargs.get("company")
        if company:
            filters["company"] = company

        teams = frappe.get_list(
            "Asset Maintenance Team",
            filters=filters,
            fields=["name", "maintenance_team_name", "maintenance_manager", "company"],
            limit_page_length=100,
        )

        # Enrich with team members
        for team in teams:
            members = frappe.get_all(
                "Maintenance Team Member",
                filters={"parent": team.name},
                fields=["team_member", "full_name", "maintenance_role"],
                limit_page_length=0,
            )
            team["members"] = members

        return api_response(success=True, data={"items": teams})

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Get Teams Error"))
        return api_response(success=False, message=str(e), status_code=500)


# ---------------------------------------------------------------------------
# Item Management (for Asset creation flow)
# ---------------------------------------------------------------------------

@frappe.whitelist()
def search_fixed_asset_items(**kwargs):
    """Search Items that have is_fixed_asset=1.

    Args:
        search: Search term (matches item_code, item_name)
        limit: Max results (default 20)
    """
    kwargs.pop("cmd", None)

    try:
        search = kwargs.get("search", "")
        limit = min(50, int(kwargs.get("limit", 20)))

        filters = {"is_fixed_asset": 1, "disabled": 0}
        or_filters = []
        if search:
            term = f"%{search}%"
            or_filters = [
                ["item_code", "like", term],
                ["item_name", "like", term],
            ]

        items = frappe.get_list(
            "Item",
            filters=filters,
            or_filters=or_filters if or_filters else None,
            fields=[
                "name", "item_code", "item_name", "item_group",
                "asset_category", "stock_uom", "description", "image",
            ],
            order_by="item_name asc",
            limit_page_length=limit,
            ignore_permissions=True,
        )

        return api_response(success=True, data={"items": items})

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Search Items Error"))
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_item_naming_config(**kwargs):
    """Return how Items are named so the frontend can adapt the create form.

    Returns:
        item_naming_by: "Naming Series" | "Item Code"
        naming_series: The default series pattern (only when Naming Series)
    """
    kwargs.pop("cmd", None)
    try:
        naming_by = frappe.db.get_single_value("Stock Settings", "item_naming_by") or "Item Code"
        data: Dict[str, Any] = {"item_naming_by": naming_by}
        if naming_by == "Naming Series":
            ns_field = frappe.get_meta("Item").get_field("naming_series")
            data["naming_series"] = (ns_field.options or "").split("\n")[0].strip() if ns_field else ""
        return api_response(success=True, data=data)
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Get Item Naming Config Error"))
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def create_fixed_asset_item(**kwargs):
    """Create a new Item configured as a Fixed Asset.

    This abstracts the ERPNext Item creation, ensuring all fixed-asset
    constraints are met (is_fixed_asset=1, is_stock_item=0, asset_category set).

    Respects Stock Settings > Item Naming By:
    - "Naming Series": item_code is auto-generated, not required
    - "Item Code": item_code must be provided

    Args:
        item_name (required): Display name (e.g. "Lenovo Aspire 32GB 500GB")
        item_group (required): Link to Item Group (must be leaf node)
        asset_category (required): Link to Asset Category
        item_code: Unique identifier (required only when naming by Item Code)
        stock_uom: Unit of measure (default "Nos")
        description: Item description
    """
    kwargs.pop("cmd", None)

    item_code = kwargs.get("item_code")
    item_name = kwargs.get("item_name")
    item_group = kwargs.get("item_group")
    asset_category = kwargs.get("asset_category")

    # Detect naming mode
    naming_by = frappe.db.get_single_value("Stock Settings", "item_naming_by") or "Item Code"
    uses_naming_series = naming_by == "Naming Series"

    if not all([item_name, item_group, asset_category]):
        return api_response(
            success=False,
            message="item_name, item_group, and asset_category are required",
            status_code=400,
        )

    if not uses_naming_series and not item_code:
        return api_response(
            success=False,
            message="item_code is required when naming is by Item Code",
            status_code=400,
        )

    try:
        # Check for duplicate when code is provided manually
        if item_code and frappe.db.exists("Item", item_code):
            return api_response(
                success=False,
                message=f"Item '{item_code}' already exists",
                status_code=409,
            )

        # Validate item_group exists and is leaf
        ig = frappe.db.get_value("Item Group", item_group, ["is_group"], as_dict=True)
        if not ig:
            return api_response(
                success=False,
                message=f"Item Group '{item_group}' not found",
                status_code=404,
            )
        if ig.is_group:
            return api_response(
                success=False,
                message=f"Item Group '{item_group}' is a parent group. Select a leaf group.",
                status_code=400,
            )

        # Validate asset_category exists
        if not frappe.db.exists("Asset Category", asset_category):
            return api_response(
                success=False,
                message=f"Asset Category '{asset_category}' not found",
                status_code=404,
            )

        item_data: Dict[str, Any] = {
            "doctype": "Item",
            "item_name": item_name,
            "item_group": item_group,
            "stock_uom": kwargs.get("stock_uom", "Nos"),
            "is_fixed_asset": 1,
            "is_stock_item": 0,
            "asset_category": asset_category,
            "auto_create_assets": kwargs.get("auto_create_assets", 0),
            "description": kwargs.get("description", ""),
        }

        if uses_naming_series:
            ns_field = frappe.get_meta("Item").get_field("naming_series")
            item_data["naming_series"] = (ns_field.options or "STO-ITEM-.YYYY.-").split("\n")[0].strip()
        elif item_code:
            item_data["item_code"] = item_code

        doc = frappe.get_doc(item_data)
        doc.insert()

        return api_response(
            success=True,
            message=f"Fixed asset item '{doc.item_name}' created",
            data={
                "item_code": doc.item_code,
                "item_name": doc.item_name,
                "item_group": doc.item_group,
                "asset_category": doc.asset_category,
            },
        )

    except frappe.PermissionError:
        return api_response(success=False, message="Permission denied", status_code=403)
    except frappe.DuplicateEntryError:
        return api_response(success=False, message=f"Item '{item_code or item_name}' already exists", status_code=409)
    except frappe.ValidationError as e:
        return api_response(success=False, message=str(e), status_code=400)
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Create Item Error"))
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_item_groups(**kwargs):
    """List Item Groups (leaf nodes only, for item creation).

    Args:
        search: Optional search term
    """
    kwargs.pop("cmd", None)

    try:
        filters = {"is_group": 0}
        search = kwargs.get("search")
        if search:
            filters["item_group_name"] = ["like", f"%{search}%"]

        # Item Group is reference/lookup data — safe to read without per-user
        # permissions once the caller is authenticated via @frappe.whitelist().
        groups = frappe.get_list(
            "Item Group",
            filters=filters,
            fields=["name", "item_group_name", "parent_item_group"],
            order_by="item_group_name asc",
            limit_page_length=100,
            ignore_permissions=True,
        )

        return api_response(success=True, data={"items": groups})

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Get Item Groups Error"))
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_user_companies(**kwargs):
    """List companies the current user has access to.

    Uses frappe.get_list so User Permissions on Company are respected.
    """
    kwargs.pop("cmd", None)

    try:
        companies = frappe.get_list(
            "Company",
            fields=["name", "company_name", "abbr"],
            order_by="company_name asc",
            limit_page_length=100,
        )
        return api_response(success=True, data={"items": companies})

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Get Companies Error"))
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def search_employees(**kwargs):
    """Search employees, optionally filtered by company.

    Args:
        search: Search term (matches employee_name, name)
        company: Filter by company (optional)
        limit: Max results (default 20)
    """
    kwargs.pop("cmd", None)

    try:
        search = kwargs.get("search", "")
        company = kwargs.get("company")
        limit = min(50, int(kwargs.get("limit", 20)))

        filters: dict = {"status": "Active"}
        if company:
            filters["company"] = company

        or_filters = []
        if search:
            term = f"%{search}%"
            or_filters = [
                ["employee_name", "like", term],
                ["name", "like", term],
            ]

        employees = frappe.get_list(
            "Employee",
            filters=filters,
            or_filters=or_filters if or_filters else None,
            fields=["name", "employee_name", "designation", "department", "company"],
            order_by="employee_name asc",
            limit_page_length=limit,
            ignore_permissions=True,
        )

        return api_response(success=True, data={"items": employees})

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Search Employees Error"))
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_departments(**kwargs):
    """List departments, optionally filtered by company.

    Args:
        company: Filter by company (optional)
        search: Search term (optional)
    """
    kwargs.pop("cmd", None)

    try:
        filters: dict = {"is_group": 0}
        company = kwargs.get("company")
        if company:
            filters["company"] = company

        search = kwargs.get("search")
        if search:
            filters["department_name"] = ["like", f"%{search}%"]

        departments = frappe.get_list(
            "Department",
            filters=filters,
            fields=["name", "department_name", "company"],
            order_by="department_name asc",
            limit_page_length=100,
            ignore_permissions=True,
        )

        return api_response(success=True, data={"items": departments})

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Get Departments Error"))
        return api_response(success=False, message=str(e), status_code=500)
