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

import json
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

def _get_user_facility_hie_ids() -> List[str]:
    """Return all facility hie_ids the current user is allowed to access."""
    return [facility_id for facility_id in frappe.get_list(
        "Health Facility",
        pluck="hie_id",
        limit_page_length=0,
    ) if facility_id]


def _resolve_facility_locations(facility_csv: Optional[str]) -> List[str]:
    """Resolve requested facilities (or all user facilities) to Location names.

    This is intentionally fail-closed:
    - No facility selection means "all facilities user can access"
    - No accessible facilities yields an empty list
    """
    facility_ids: List[str] = []
    if facility_csv:
        facility_ids = [f.strip() for f in facility_csv.split(",") if f.strip()]
    else:
        facility_ids = _get_user_facility_hie_ids()

    if not facility_ids:
        return []

    return get_locations_for_user_facilities(facility_ids)


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


def _as_check(value: Any, default: int = 0) -> int:
    if value is None:
        return default

    if isinstance(value, str):
        return 0 if value.strip().lower() in {"", "0", "false", "no", "off"} else 1

    return 1 if value else 0


def _as_optional_text(value: Any) -> Optional[str]:
    if value is None:
        return None

    text = str(value).strip()
    return text or None


def _set_purchase_amount(target: Any, amount: Any) -> None:
    normalized_amount = flt(amount)

    if isinstance(target, dict):
        target["net_purchase_amount"] = normalized_amount
        target["gross_purchase_amount"] = normalized_amount
        return

    target.net_purchase_amount = normalized_amount
    if target.meta.has_field("gross_purchase_amount"):
        target.gross_purchase_amount = normalized_amount


def _validate_purchase_document_choice(
    is_existing_asset: int, purchase_receipt: Optional[str], purchase_invoice: Optional[str]
) -> None:
    if purchase_receipt and purchase_invoice:
        frappe.throw(_("Link either a Purchase Receipt or a Purchase Invoice, not both."))

    if not is_existing_asset and not (purchase_receipt or purchase_invoice):
        frappe.throw(
            _("Link a submitted Purchase Receipt or Purchase Invoice before saving a non-existing asset.")
        )


def _ensure_purchase_document_access(
    doctype: str,
    docname: Optional[str],
    company: Optional[str],
    item_code: Optional[str],
) -> None:
    if not docname:
        return

    filters: Dict[str, Any] = {"name": docname, "docstatus": 1}
    if company:
        filters["company"] = company
    if doctype == "Purchase Invoice":
        filters["update_stock"] = 1

    docs = frappe.get_list(
        doctype,
        filters=filters,
        fields=["name"],
        limit_page_length=1,
    )
    if not docs:
        frappe.throw(
            _("You do not have access to {0} {1}.").format(doctype, docname),
            frappe.PermissionError,
        )

    if item_code:
        child_doctype = f"{doctype} Item"
        child_rows = frappe.get_list(
            child_doctype,
            filters={"parent": docname, "item_code": item_code},
            pluck="name",
            limit_page_length=1,
        )
        if not child_rows:
            frappe.throw(
                _("{0} {1} does not contain item {2}.").format(doctype, docname, item_code),
                frappe.ValidationError,
            )


def _ensure_facility_access(facility_id: Optional[str]) -> None:
    if not facility_id:
        return

    permitted = set(validate_user_facilities([facility_id]))
    if facility_id not in permitted:
        frappe.throw(
            _("You do not have permission to access facility {0}.").format(facility_id),
            frappe.PermissionError,
        )


def _ensure_location_access(location_name: Optional[str]) -> None:
    if not location_name:
        return

    facility_id = get_facility_for_location(location_name)
    if not facility_id:
        frappe.throw(
            _("Location {0} is not mapped to a permitted facility.").format(location_name),
            frappe.PermissionError,
        )

    _ensure_facility_access(facility_id)


def _ensure_location_matches_facility(location_name: Optional[str], facility_id: Optional[str]) -> None:
    """Ensure location/facility pairing cannot be spoofed across scopes."""
    if not location_name or not facility_id:
        return

    expected_location = get_location_for_facility(facility_id)
    if not expected_location:
        frappe.throw(
            _("No Location found for facility {0}. Run location sync first.").format(facility_id),
            frappe.ValidationError,
        )
    if expected_location != location_name:
        frappe.throw(
            _("Location {0} does not belong to facility {1}.").format(location_name, facility_id),
            frappe.PermissionError,
        )


def _get_asset_doc_with_access(asset_name: str, perm_type: str = "read"):
    """Fetch an Asset doc and enforce both DocPerm and facility/location scope."""
    asset = frappe.get_doc("Asset", asset_name)
    if not asset.has_permission(perm_type):
        frappe.throw(_("Permission denied"), frappe.PermissionError)
    _ensure_location_access(asset.location)
    return asset


def _parse_finance_books_payload(raw_value: Any) -> Optional[List[Dict[str, Any]]]:
    if raw_value is None:
        return None

    parsed = raw_value
    if isinstance(raw_value, str):
        raw_value = raw_value.strip()
        if not raw_value:
            return []
        try:
            parsed = json.loads(raw_value)
        except json.JSONDecodeError:
            parsed = frappe.parse_json(raw_value)

    if not isinstance(parsed, list):
        frappe.throw(_("Finance books payload must be a list."))

    rows: List[Dict[str, Any]] = []
    for row in parsed:
        if not isinstance(row, dict):
            continue
        rows.append({
            "finance_book": _as_optional_text(row.get("finance_book")),
            "depreciation_method": row.get("depreciation_method") or "Straight Line",
            "total_number_of_depreciations": int(row.get("total_number_of_depreciations") or 5),
            "frequency_of_depreciation": int(row.get("frequency_of_depreciation") or 12),
            "expected_value_after_useful_life": flt(row.get("expected_value_after_useful_life") or 0),
            "depreciation_start_date": row.get("depreciation_start_date"),
            "rate_of_depreciation": flt(row.get("rate_of_depreciation") or 0),
        })

    return rows


def _build_legacy_finance_book_row(kwargs: Dict[str, Any], fallback_row: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    fallback_row = fallback_row or {}
    return {
        "finance_book": _as_optional_text(kwargs.get("finance_book")) or fallback_row.get("finance_book"),
        "depreciation_method": kwargs.get("depreciation_method")
        or fallback_row.get("depreciation_method")
        or "Straight Line",
        "total_number_of_depreciations": int(
            kwargs.get("total_number_of_depreciations", fallback_row.get("total_number_of_depreciations") or 5)
        ),
        "frequency_of_depreciation": int(
            kwargs.get("frequency_of_depreciation", fallback_row.get("frequency_of_depreciation") or 12)
        ),
        "expected_value_after_useful_life": flt(
            kwargs.get("expected_value_after_useful_life", fallback_row.get("expected_value_after_useful_life") or 0)
        ),
        "depreciation_start_date": kwargs.get("depreciation_start_date")
        or fallback_row.get("depreciation_start_date"),
        "rate_of_depreciation": flt(
            kwargs.get("rate_of_depreciation", fallback_row.get("rate_of_depreciation") or 0)
        ),
    }


def _has_legacy_finance_book_fields(kwargs: Dict[str, Any]) -> bool:
    return any(
        key in kwargs
        for key in (
            "finance_book",
            "depreciation_method",
            "total_number_of_depreciations",
            "frequency_of_depreciation",
            "expected_value_after_useful_life",
            "depreciation_start_date",
            "rate_of_depreciation",
        )
    )


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
        if not locations:
            return api_response(success=True, data={
                "status_aggregates": {s.lower().replace(" ", "_"): 0 for s in ASSET_STATUSES},
                "category_aggregates": [],
                "maintenance_due_count": 0,
                "overdue_maintenance_count": 0,
            })

        base_filters = {"location": ["in", locations]}

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
        if not locations:
            return api_response(success=True, data={"items": [], "total_count": 0})

        filters = {"location": ["in", locations]}

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
            count_rows = frappe.get_list(
                "Asset",
                filters=filters,
                or_filters=or_filters,
                fields=["count(name) as count"],
                limit_page_length=1,
            )
            total_count = int((count_rows[0].get("count") if count_rows else 0) or 0)
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
        asset = _get_asset_doc_with_access(asset_name, "read")
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
        movement_items = frappe.get_list(
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
                items = frappe.get_list(
                    "Asset Movement Item",
                    filters={"parent": mov.name, "asset": asset_name},
                    fields=["source_location", "target_location", "from_employee", "to_employee"],
                    limit_page_length=1,
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
                entries = frappe.get_list(
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

        is_existing_asset = _as_check(kwargs.get("is_existing_asset"), 1)
        purchase_receipt = _as_optional_text(kwargs.get("purchase_receipt"))
        purchase_invoice = _as_optional_text(kwargs.get("purchase_invoice"))
        _validate_purchase_document_choice(is_existing_asset, purchase_receipt, purchase_invoice)

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

        if facility_id:
            _ensure_facility_access(facility_id)
            _ensure_location_matches_facility(location, facility_id)
        _ensure_location_access(location)

        _ensure_purchase_document_access("Purchase Receipt", purchase_receipt, company, item_code)
        _ensure_purchase_document_access("Purchase Invoice", purchase_invoice, company, item_code)

        # Build asset doc
        asset_data = {
            "doctype": "Asset",
            "asset_name": asset_name,
            "item_code": item_code,
            "company": company,
            "location": location,
            "asset_category": kwargs.get("asset_category") or item.asset_category,
            "purchase_date": kwargs.get("purchase_date"),
            "available_for_use_date": kwargs.get("available_for_use_date"),
            "is_existing_asset": is_existing_asset,
            "custodian": kwargs.get("custodian"),
            "department": kwargs.get("department"),
            "calculate_depreciation": kwargs.get("calculate_depreciation", 0),
            "purchase_receipt": purchase_receipt,
            "purchase_invoice": purchase_invoice,
        }
        _set_purchase_amount(
            asset_data, kwargs.get("gross_purchase_amount", kwargs.get("net_purchase_amount"))
        )

        # Depreciation config
        if asset_data["calculate_depreciation"]:
            finance_books_payload = _parse_finance_books_payload(kwargs.get("finance_books"))
            if finance_books_payload is not None:
                asset_data["finance_books"] = finance_books_payload
            else:
                asset_data["finance_books"] = [_build_legacy_finance_book_row(kwargs)]

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
def update_asset(**kwargs):
    """Update a Draft asset so setup can be completed after the quick-create flow."""
    kwargs.pop("cmd", None)
    asset_name = kwargs.get("asset_name") or kwargs.get("asset_id") or kwargs.get("name")

    if not asset_name:
        return api_response(success=False, message="asset_name is required", status_code=400)

    try:
        doc = _get_asset_doc_with_access(asset_name, "write")
    except frappe.PermissionError:
        return api_response(success=False, message="Permission denied", status_code=403)
    except frappe.DoesNotExistError:
        return api_response(success=False, message="Asset not found", status_code=404)

    if doc.docstatus != 0:
        return api_response(
            success=False,
            message="Only Draft assets can be updated from this screen",
            status_code=400,
        )

    try:
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

        if location:
            doc.location = location

        if facility_id:
            _ensure_facility_access(facility_id)
            _ensure_location_matches_facility(doc.location, facility_id)
        _ensure_location_access(doc.location)

        if "updated_asset_name" in kwargs:
            doc.asset_name = kwargs.get("updated_asset_name") or doc.asset_name

        if kwargs.get("company"):
            doc.company = kwargs.get("company")

        if "purchase_date" in kwargs and kwargs.get("purchase_date"):
            doc.purchase_date = kwargs.get("purchase_date")

        if "available_for_use_date" in kwargs:
            doc.available_for_use_date = kwargs.get("available_for_use_date") or None

        if "department" in kwargs:
            doc.department = kwargs.get("department") or None

        if "custodian" in kwargs:
            doc.custodian = kwargs.get("custodian") or None

        if "gross_purchase_amount" in kwargs or "net_purchase_amount" in kwargs:
            _set_purchase_amount(
                doc, kwargs.get("gross_purchase_amount", kwargs.get("net_purchase_amount"))
            )

        is_existing_asset = _as_check(kwargs.get("is_existing_asset"), int(doc.is_existing_asset or 0))
        if is_existing_asset:
            purchase_receipt = None
            purchase_invoice = None
        else:
            purchase_receipt = (
                _as_optional_text(kwargs.get("purchase_receipt"))
                if "purchase_receipt" in kwargs
                else _as_optional_text(doc.purchase_receipt)
            )
            purchase_invoice = (
                _as_optional_text(kwargs.get("purchase_invoice"))
                if "purchase_invoice" in kwargs
                else _as_optional_text(doc.purchase_invoice)
            )
        _validate_purchase_document_choice(is_existing_asset, purchase_receipt, purchase_invoice)
        _ensure_purchase_document_access("Purchase Receipt", purchase_receipt, doc.company, doc.item_code)
        _ensure_purchase_document_access("Purchase Invoice", purchase_invoice, doc.company, doc.item_code)

        doc.is_existing_asset = is_existing_asset
        doc.purchase_receipt = purchase_receipt
        doc.purchase_invoice = purchase_invoice

        calculate_depreciation = _as_check(
            kwargs.get("calculate_depreciation"), int(doc.calculate_depreciation or 0)
        )
        doc.calculate_depreciation = calculate_depreciation

        if calculate_depreciation:
            existing_rows = [row.as_dict() for row in doc.finance_books] if doc.finance_books else []
            finance_books_payload = _parse_finance_books_payload(kwargs.get("finance_books"))

            if finance_books_payload is not None:
                doc.set("finance_books", finance_books_payload)
            elif _has_legacy_finance_book_fields(kwargs):
                doc.set(
                    "finance_books",
                    [_build_legacy_finance_book_row(kwargs, existing_rows[0] if existing_rows else None)],
                )
            elif existing_rows:
                doc.set("finance_books", existing_rows)

            if is_existing_asset:
                doc.opening_accumulated_depreciation = flt(
                    kwargs.get("opening_accumulated_depreciation", 0)
                )
                doc.opening_number_of_booked_depreciations = int(
                    kwargs.get("opening_number_of_booked_depreciations", 0) or 0
                )
            else:
                doc.opening_accumulated_depreciation = 0
                doc.opening_number_of_booked_depreciations = 0
        else:
            doc.set("finance_books", [])
            doc.opening_accumulated_depreciation = 0
            doc.opening_number_of_booked_depreciations = 0

        doc.save()

        return api_response(
            success=True,
            message=f"Asset '{doc.name}' updated",
            data={"name": doc.name, "status": doc.status},
        )
    except frappe.PermissionError:
        return api_response(success=False, message="Permission denied", status_code=403)
    except frappe.ValidationError as e:
        return api_response(success=False, message=str(e), status_code=400)
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Update Asset Error"))
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
        doc = _get_asset_doc_with_access(asset_name, "submit")

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

        asset = _get_asset_doc_with_access(asset_name, "write")

        # Check if maintenance already exists (unique constraint)
        existing = frappe.db.exists("Asset Maintenance", {"asset_name": asset_name})
        if existing:
            return api_response(
                success=False,
                message=f"Maintenance schedule already exists for this asset: {existing}",
                status_code=400,
            )

        # Enable maintenance on asset after explicit write permission check.
        asset.db_set("maintenance_required", 1, update_modified=False)

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
        _get_asset_doc_with_access(asset_name, "read")

        maintenance = frappe.get_list(
            "Asset Maintenance",
            filters={"asset_name": asset_name},
            fields=["name", "maintenance_team", "maintenance_manager"],
            limit_page_length=1,
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
        _get_asset_doc_with_access(doc.asset_name, "read")

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
        asset = _get_asset_doc_with_access(asset_name, "read")

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
        _get_asset_doc_with_access(doc.asset, "read")

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
        _get_asset_doc_with_access(asset_name, "read")

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
        asset = _get_asset_doc_with_access(asset_name, "read")

        # Resolve target location from facility_id if provided
        target_location = kwargs.get("target_location")
        target_facility_id = kwargs.get("target_facility_id")
        if target_facility_id and not target_location:
            target_location = get_location_for_facility(target_facility_id)
            if not target_location:
                return api_response(
                    success=False,
                    message=f"No Location found for facility '{target_facility_id}'. Run location sync first.",
                    status_code=400,
                )

        if target_location:
            _ensure_location_access(target_location)

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
        _get_asset_doc_with_access(asset_name, "read")

        # Get parent movement names from child table
        movement_items = frappe.get_list(
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
            items = frappe.get_list(
                "Asset Movement Item",
                filters={"parent": mov.name, "asset": asset_name},
                fields=["source_location", "target_location", "from_employee", "to_employee"],
                limit_page_length=1,
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
        asset = _get_asset_doc_with_access(asset_name, "read")

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
            entries = frappe.get_list(
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
            members = frappe.get_list(
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
def get_finance_books(**kwargs):
    """List finance books for deferred depreciation setup."""
    kwargs.pop("cmd", None)

    try:
        filters: Dict[str, Any] = {}
        search = kwargs.get("search")
        if search:
            filters["finance_book_name"] = ["like", f"%{search}%"]

        finance_books = frappe.get_list(
            "Finance Book",
            filters=filters,
            fields=["name", "finance_book_name"],
            order_by="finance_book_name asc",
            limit_page_length=100,
        )

        return api_response(success=True, data={"items": finance_books})
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Get Finance Books Error"))
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def search_purchase_receipts_for_asset(**kwargs):
    """Search submitted Purchase Receipts containing the selected asset item."""
    kwargs.pop("cmd", None)
    return _search_purchase_documents_for_asset("Purchase Receipt", kwargs)


@frappe.whitelist()
def search_purchase_invoices_for_asset(**kwargs):
    """Search submitted stock-updating Purchase Invoices containing the selected asset item."""
    kwargs.pop("cmd", None)
    return _search_purchase_documents_for_asset("Purchase Invoice", kwargs)


def _search_purchase_documents_for_asset(doctype: str, kwargs: Dict[str, Any]):
    item_code = _as_optional_text(kwargs.get("item_code"))
    if not item_code:
        return api_response(success=False, message="item_code is required", status_code=400)

    search = _as_optional_text(kwargs.get("search"))
    company = _as_optional_text(kwargs.get("company"))
    exclude_asset_name = _as_optional_text(kwargs.get("exclude_asset_name"))
    limit = min(50, max(1, int(kwargs.get("limit", 20) or 20)))
    if not company:
        return api_response(success=False, message="company is required", status_code=400)

    child_doctype = f"{doctype} Item"

    try:
        purchase_doc_field = "purchase_receipt" if doctype == "Purchase Receipt" else "purchase_invoice"
        route = "purchase-receipt" if doctype == "Purchase Receipt" else "purchase-invoice"
        parent_filters: Dict[str, Any] = {"docstatus": 1, "company": company}
        if doctype == "Purchase Invoice":
            parent_filters["update_stock"] = 1

        parent_or_filters = None
        if search:
            term = f"%{search}%"
            parent_or_filters = [
                ["name", "like", term],
                ["supplier", "like", term],
            ]

        items: List[Dict[str, Any]] = []
        scanned_parents = 0
        page_start = 0
        page_length = max(limit * 5, 100)
        max_scan = 1000

        while len(items) < limit and scanned_parents < max_scan:
            parent_docs = frappe.get_list(
                doctype,
                filters=parent_filters,
                or_filters=parent_or_filters,
                fields=["name", "posting_date", "company", "supplier", "modified"],
                order_by="posting_date desc, modified desc",
                limit_start=page_start,
                limit_page_length=page_length,
            )
            if not parent_docs:
                break

            parent_names = [doc.name for doc in parent_docs]
            scanned_parents += len(parent_docs)
            page_start += page_length

            child_rows = frappe.get_list(
                child_doctype,
                filters={
                    "parent": ["in", parent_names],
                    "item_code": item_code,
                },
                fields=["parent", "item_name", "qty", "base_net_rate", "base_net_amount"],
                limit_page_length=0,
            )
            if not child_rows:
                continue

            parent_item_totals: Dict[str, Dict[str, Any]] = {}
            for row in child_rows:
                parent_name = row.parent
                current = parent_item_totals.get(parent_name)
                if not current:
                    current = {
                        "item_name": row.item_name,
                        "item_qty": 0.0,
                        "item_amount": 0.0,
                        "item_rate": flt(row.base_net_rate),
                    }
                    parent_item_totals[parent_name] = current

                current["item_qty"] += flt(row.qty)
                current["item_amount"] += flt(row.base_net_amount)
                if row.item_name and not current["item_name"]:
                    current["item_name"] = row.item_name

            linked_asset_qty_map: Dict[str, float] = {}
            linked_filters: Dict[str, Any] = {
                "docstatus": ["!=", 2],
                "item_code": item_code,
                purchase_doc_field: ["in", list(parent_item_totals.keys())],
            }
            if exclude_asset_name:
                linked_filters["name"] = ["!=", exclude_asset_name]

            linked_assets = frappe.get_list(
                "Asset",
                filters=linked_filters,
                fields=[purchase_doc_field, "asset_quantity"],
                limit_page_length=0,
            )
            for linked in linked_assets:
                purchase_doc = linked.get(purchase_doc_field)
                if not purchase_doc:
                    continue
                linked_asset_qty_map[purchase_doc] = linked_asset_qty_map.get(purchase_doc, 0.0) + (
                    flt(linked.get("asset_quantity")) or 1.0
                )

            for parent in parent_docs:
                totals = parent_item_totals.get(parent.name)
                if not totals:
                    continue

                item_qty = flt(totals["item_qty"])
                item_amount = flt(totals["item_amount"])
                item_rate = flt(totals["item_rate"])
                linked_asset_qty = linked_asset_qty_map.get(parent.name, 0.0)
                available_asset_qty = max(item_qty - linked_asset_qty, 0.0)
                if available_asset_qty <= 0:
                    continue

                items.append({
                    "name": parent.name,
                    "posting_date": parent.posting_date,
                    "company": parent.company,
                    "supplier": parent.supplier,
                    "item_name": totals["item_name"],
                    "item_qty": item_qty,
                    "item_rate": (item_amount / item_qty) if item_qty else item_rate,
                    "item_amount": item_amount,
                    "linked_asset_qty": linked_asset_qty,
                    "available_asset_qty": available_asset_qty,
                    "doctype": doctype,
                    "desk_url": f"/app/{route}/{parent.name}",
                })

                if len(items) >= limit:
                    break

        return api_response(success=True, data={"items": items[:limit]})
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Search Purchase Documents Error"))
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
        )

        return api_response(success=True, data={"items": departments})

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), _("Get Departments Error"))
        return api_response(success=False, message=str(e), status_code=500)
