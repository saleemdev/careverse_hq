"""
Shift Management API (Admin Central)

Admin-only Shift Management implementation for:
- Shift assignment visibility
- Attendance visibility / exceptions
- Shift creation
- Shift reassignment

RBAC and consistency rules:
- Uses frappe.get_list for user-facing queries so User Permissions apply.
- Uses fail-closed facility scoping via validate_user_facilities.
- Returns normalized API response shapes via api_response.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

import frappe
from frappe import _
from frappe.utils import add_days, cstr, getdate, today

from careverse_hq.api.dashboard_utils import validate_user_facilities
from careverse_hq.api.response import api_response

ADMIN_ROLES = {"System Manager", "HR Manager", "HR User"}
ATTENDANCE_STATUS_OPTIONS = ["Present", "Absent", "On Leave", "Half Day"]
SHIFT_STATUS_OPTIONS = ["Active", "Inactive"]


def _to_bool(value: Any) -> bool:
	if isinstance(value, str):
		return value.strip().lower() in {"1", "true", "yes", "on"}
	return bool(value)


def _parse_facilities_csv(facilities: Optional[str]) -> List[str]:
	if not facilities:
		return []
	return [facility_id.strip() for facility_id in facilities.split(",") if facility_id.strip()]


def _normalize_page(value: Any, default: int = 1) -> int:
	try:
		page = int(value)
		return page if page > 0 else default
	except (TypeError, ValueError):
		return default


def _normalize_page_size(value: Any, default: int = 20, max_size: int = 100) -> int:
	try:
		page_size = int(value)
		if page_size < 1:
			return default
		return min(page_size, max_size)
	except (TypeError, ValueError):
		return default


def _normalize_optional_text(value: Optional[str]) -> Optional[str]:
	if value is None:
		return None
	text_value = cstr(value).strip()
	return text_value or None


def _empty_paginated(page: int, page_size: int) -> Dict[str, Any]:
	return {
		"items": [],
		"total_count": 0,
		"page": page,
		"page_size": page_size,
	}


def _format_time(value: Any) -> Optional[str]:
	if value in (None, ""):
		return None

	try:
		return value.strftime("%H:%M")
	except Exception:
		pass

	text_value = cstr(value).strip()
	if not text_value:
		return None
	return text_value[:5] if len(text_value) >= 5 else text_value


def _normalize_time_input(value: Optional[str]) -> Optional[str]:
	if value is None:
		return None

	text_value = cstr(value).strip()
	if not text_value:
		return None

	if len(text_value) == 5:
		return f"{text_value}:00"
	return text_value


def _require_admin_access() -> None:
	roles = set(frappe.get_roles(frappe.session.user))
	if not roles.intersection(ADMIN_ROLES):
		frappe.throw(_("Only admin users can access Shift Management."), frappe.PermissionError)


def _get_user_facility_hie_ids() -> List[str]:
	return [
		facility_id
		for facility_id in frappe.get_list("Health Facility", pluck="hie_id", limit_page_length=0)
		if facility_id
	]


def _resolve_facility_scope(facilities_csv: Optional[str]) -> Tuple[List[str], bool]:
	"""
	Returns:
		(tuple):
		- facility_ids: resolved facility scope
		- explicitly_filtered: True if caller passed facilities param
	"""
	requested_ids = _parse_facilities_csv(facilities_csv)
	if requested_ids:
		valid_ids = validate_user_facilities(requested_ids)
		return valid_ids, True

	return _get_user_facility_hie_ids(), False


def _get_employee_facility_field() -> Optional[str]:
	employee_meta = frappe.get_meta("Employee")
	for fieldname in ("custom_facility_id", "custom_facility", "facility"):
		if employee_meta.has_field(fieldname):
			return fieldname
	return None


def _get_scoped_employee_rows(
	facility_ids: List[str],
	employee: Optional[str] = None,
	employee_search: Optional[str] = None,
	limit: Optional[int] = None,
) -> List[Dict[str, Any]]:
	if not facility_ids:
		return []

	facility_field = _get_employee_facility_field()
	if not facility_field:
		# Fail closed if employee-to-facility mapping field is unavailable.
		return []

	filters: Dict[str, Any] = {"status": "Active", facility_field: ["in", facility_ids]}
	if employee:
		filters["name"] = employee

	or_filters = None
	if employee_search:
		search_term = f"%{employee_search.strip()}%"
		or_filters = [
			["name", "like", search_term],
			["employee_name", "like", search_term],
		]

	fields = ["name", "employee_name", "department", "company", facility_field]

	return frappe.get_list(
		"Employee",
		filters=filters,
		or_filters=or_filters,
		fields=fields,
		limit_page_length=limit or 0,
		order_by="employee_name asc",
	)


def _get_facility_name_map(facility_ids: List[str]) -> Dict[str, str]:
	if not facility_ids:
		return {}

	facilities = frappe.get_list(
		"Health Facility",
		filters={"hie_id": ["in", facility_ids]},
		fields=["hie_id", "facility_name"],
		limit_page_length=0,
	)
	return {facility.hie_id: facility.facility_name for facility in facilities if facility.hie_id}


def _ensure_employee_in_scope(employee: str, scoped_employee_ids: set[str]) -> None:
	if employee not in scoped_employee_ids:
		frappe.throw(
			_("You do not have permission to manage shifts for employee {0}.").format(employee),
			frappe.PermissionError,
		)


def _build_shift_type_map(shift_types: List[str]) -> Dict[str, Dict[str, Any]]:
	if not shift_types:
		return {}

	records = frappe.get_list(
		"Shift Type",
		filters={"name": ["in", list({shift for shift in shift_types if shift})]},
		fields=["name", "start_time", "end_time", "enable_auto_attendance", "color"],
		limit_page_length=0,
	)
	return {record.name: record for record in records}


def _get_location_options() -> List[Dict[str, str]]:
	try:
		meta = frappe.get_meta("Location")
	except frappe.DoesNotExistError:
		return []

	label_field = "location_name" if meta.has_field("location_name") else "name"
	fields = ["name", label_field] if label_field != "name" else ["name"]

	locations = frappe.get_list(
		"Location",
		fields=fields,
		order_by=f"{label_field} asc",
		limit_page_length=0,
	)

	options: List[Dict[str, str]] = []
	for location in locations:
		label = getattr(location, label_field, None) or location.name
		options.append({"name": location.name, "label": label})
	return options


@frappe.whitelist()
def get_shift_dashboard(
	facilities: Optional[str] = None,
	date_from: Optional[str] = None,
	date_to: Optional[str] = None,
):
	"""Dashboard aggregates for Shift Management."""
	try:
		_require_admin_access()

		date_from = date_from or today()
		date_to = date_to or add_days(date_from, 30)

		facility_ids, explicitly_filtered = _resolve_facility_scope(facilities)
		if explicitly_filtered and not facility_ids:
			return api_response(
				success=True,
				data={
					"status_aggregates": {
						"total_assignments": 0,
						"active_assignments": 0,
						"inactive_assignments": 0,
						"employees_with_shifts": 0,
						"attendance_records": 0,
						"late_entries": 0,
						"missing_checkouts": 0,
					}
				},
			)

		employee_rows = _get_scoped_employee_rows(facility_ids)
		employee_ids = [row["name"] for row in employee_rows]
		if not employee_ids:
			return api_response(
				success=True,
				data={
					"status_aggregates": {
						"total_assignments": 0,
						"active_assignments": 0,
						"inactive_assignments": 0,
						"employees_with_shifts": 0,
						"attendance_records": 0,
						"late_entries": 0,
						"missing_checkouts": 0,
					}
				},
			)

		shift_filters = {
			"docstatus": ["<", 2],
			"employee": ["in", employee_ids],
			"start_date": ["<=", date_to],
		}
		shift_or_filters = [["end_date", ">=", date_from], ["end_date", "is", "not set"]]

		total_assignments = len(
			frappe.get_list(
				"Shift Assignment",
				filters=shift_filters,
				or_filters=shift_or_filters,
				pluck="name",
				limit_page_length=0,
			)
		)
		active_assignments = len(
			frappe.get_list(
				"Shift Assignment",
				filters={**shift_filters, "status": "Active"},
				or_filters=shift_or_filters,
				pluck="name",
				limit_page_length=0,
			)
		)
		inactive_assignments = max(total_assignments - active_assignments, 0)

		employees_with_shifts = len(
			set(
				frappe.get_list(
					"Shift Assignment",
					filters=shift_filters,
					or_filters=shift_or_filters,
					pluck="employee",
					limit_page_length=0,
				)
			)
		)

		attendance_filters = {
			"docstatus": ["<", 2],
			"employee": ["in", employee_ids],
			"attendance_date": ["between", [date_from, date_to]],
		}
		attendance_records = len(
			frappe.get_list("Attendance", filters=attendance_filters, pluck="name", limit_page_length=0)
		)
		late_entries = len(
			frappe.get_list(
				"Attendance",
				filters={**attendance_filters, "late_entry": 1},
				pluck="name",
				limit_page_length=0,
			)
		)
		missing_checkouts = len(
			frappe.get_list(
				"Attendance",
				filters={**attendance_filters, "status": "Present", "out_time": ["is", "not set"]},
				pluck="name",
				limit_page_length=0,
			)
		)

		return api_response(
			success=True,
			data={
				"status_aggregates": {
					"total_assignments": total_assignments,
					"active_assignments": active_assignments,
					"inactive_assignments": inactive_assignments,
					"employees_with_shifts": employees_with_shifts,
					"attendance_records": attendance_records,
					"late_entries": late_entries,
					"missing_checkouts": missing_checkouts,
				}
			},
		)
	except frappe.PermissionError:
		return api_response(success=False, message="Permission denied", status_code=403)
	except Exception as exc:
		frappe.log_error(frappe.get_traceback(), "Shift Management Dashboard Error")
		return api_response(success=False, message=str(exc), status_code=500)


@frappe.whitelist()
def get_shift_assignments(
	facilities: Optional[str] = None,
	page: int = 1,
	page_size: int = 20,
	employee: Optional[str] = None,
	shift_type: Optional[str] = None,
	status: Optional[str] = "Active",
	date_from: Optional[str] = None,
	date_to: Optional[str] = None,
):
	"""Paginated Shift Assignment list for admin users."""
	try:
		_require_admin_access()

		page = _normalize_page(page)
		page_size = _normalize_page_size(page_size)
		date_from = date_from or today()
		date_to = date_to or add_days(date_from, 30)

		facility_ids, explicitly_filtered = _resolve_facility_scope(facilities)
		if explicitly_filtered and not facility_ids:
			return api_response(success=True, data=_empty_paginated(page, page_size))

		employee_rows = _get_scoped_employee_rows(facility_ids, employee=employee)
		employee_ids = [row["name"] for row in employee_rows]
		if not employee_ids:
			return api_response(success=True, data=_empty_paginated(page, page_size))

		filters: Dict[str, Any] = {
			"docstatus": ["<", 2],
			"employee": ["in", employee_ids],
			"start_date": ["<=", date_to],
		}
		or_filters = [["end_date", ">=", date_from], ["end_date", "is", "not set"]]
		if shift_type:
			filters["shift_type"] = shift_type
		if status:
			filters["status"] = status

		total_count = len(
			frappe.get_list(
				"Shift Assignment",
				filters=filters,
				or_filters=or_filters,
				pluck="name",
				limit_page_length=0,
			)
		)
		if total_count == 0:
			return api_response(success=True, data=_empty_paginated(page, page_size))

		offset = (page - 1) * page_size
		records = frappe.get_list(
			"Shift Assignment",
			filters=filters,
			or_filters=or_filters,
			fields=[
				"name",
				"employee",
				"employee_name",
				"department",
				"company",
				"shift_type",
				"start_date",
				"end_date",
				"status",
				"shift_location",
				"overtime_type",
			],
			order_by="start_date desc, creation desc",
			limit_start=offset,
			limit_page_length=page_size,
		)

		employee_map = {row["name"]: row for row in employee_rows}
		facility_field = _get_employee_facility_field()
		facility_name_map = _get_facility_name_map(facility_ids)
		shift_type_map = _build_shift_type_map([record.shift_type for record in records])

		items = []
		for record in records:
			employee_row = employee_map.get(record.employee, {})
			facility_id = employee_row.get(facility_field) if facility_field else None
			shift_type_info = shift_type_map.get(record.shift_type, {})

			items.append(
				{
					"name": record.name,
					"employee": record.employee,
					"employee_name": record.employee_name or employee_row.get("employee_name") or record.employee,
					"department": record.department or employee_row.get("department"),
					"company": record.company or employee_row.get("company"),
					"shift_type": record.shift_type,
					"shift_start_time": _format_time(shift_type_info.get("start_time")),
					"shift_end_time": _format_time(shift_type_info.get("end_time")),
					"start_date": record.start_date,
					"end_date": record.end_date,
					"status": record.status,
					"shift_location": record.shift_location,
					"overtime_type": record.overtime_type,
					"facility_id": facility_id or "",
					"facility_name": facility_name_map.get(facility_id, facility_id or ""),
					"enable_auto_attendance": bool(shift_type_info.get("enable_auto_attendance")),
				}
			)

		return api_response(
			success=True,
			data={
				"items": items,
				"total_count": total_count,
				"page": page,
				"page_size": page_size,
			},
		)
	except frappe.PermissionError:
		return api_response(success=False, message="Permission denied", status_code=403)
	except Exception as exc:
		frappe.log_error(frappe.get_traceback(), "Shift Assignment List Error")
		return api_response(success=False, message=str(exc), status_code=500)


@frappe.whitelist()
def get_attendance_visibility(
	facilities: Optional[str] = None,
	page: int = 1,
	page_size: int = 20,
	employee: Optional[str] = None,
	status: Optional[str] = None,
	date_from: Optional[str] = None,
	date_to: Optional[str] = None,
	late_only: Optional[bool] = False,
	missing_checkout_only: Optional[bool] = False,
):
	"""Paginated attendance visibility records (admin view)."""
	try:
		_require_admin_access()

		page = _normalize_page(page)
		page_size = _normalize_page_size(page_size)
		date_from = date_from or today()
		date_to = date_to or today()
		late_only = _to_bool(late_only)
		missing_checkout_only = _to_bool(missing_checkout_only)

		facility_ids, explicitly_filtered = _resolve_facility_scope(facilities)
		if explicitly_filtered and not facility_ids:
			return api_response(success=True, data=_empty_paginated(page, page_size))

		employee_rows = _get_scoped_employee_rows(facility_ids, employee=employee)
		employee_ids = [row["name"] for row in employee_rows]
		if not employee_ids:
			return api_response(success=True, data=_empty_paginated(page, page_size))

		filters: Dict[str, Any] = {
			"docstatus": ["<", 2],
			"employee": ["in", employee_ids],
			"attendance_date": ["between", [date_from, date_to]],
		}
		if status:
			filters["status"] = status
		if late_only:
			filters["late_entry"] = 1
		if missing_checkout_only:
			filters["out_time"] = ["is", "not set"]

		total_count = len(
			frappe.get_list("Attendance", filters=filters, pluck="name", limit_page_length=0)
		)
		if total_count == 0:
			return api_response(success=True, data=_empty_paginated(page, page_size))

		offset = (page - 1) * page_size
		records = frappe.get_list(
			"Attendance",
			filters=filters,
			fields=[
				"name",
				"attendance_date",
				"employee",
				"employee_name",
				"status",
				"late_entry",
				"in_time",
				"out_time",
				"shift",
				"company",
				"department",
				"working_hours",
			],
			order_by="attendance_date desc, creation desc",
			limit_start=offset,
			limit_page_length=page_size,
		)

		employee_map = {row["name"]: row for row in employee_rows}
		facility_field = _get_employee_facility_field()
		facility_name_map = _get_facility_name_map(facility_ids)

		items = []
		for record in records:
			employee_row = employee_map.get(record.employee, {})
			facility_id = employee_row.get(facility_field) if facility_field else None
			check_in = _format_time(record.in_time)
			check_out = _format_time(record.out_time)

			items.append(
				{
					"name": record.name,
					"attendance_date": record.attendance_date,
					"employee": record.employee,
					"employee_name": record.employee_name or employee_row.get("employee_name") or record.employee,
					"department": record.department or employee_row.get("department"),
					"company": record.company or employee_row.get("company"),
					"status": record.status,
					"shift": record.shift,
					"late_entry": bool(record.late_entry),
					"check_in": check_in,
					"check_out": check_out,
					"working_hours": record.working_hours,
					"is_missing_checkout": bool(record.status == "Present" and not check_out),
					"facility_id": facility_id or "",
					"facility_name": facility_name_map.get(facility_id, facility_id or ""),
				}
			)

		return api_response(
			success=True,
			data={
				"items": items,
				"total_count": total_count,
				"page": page,
				"page_size": page_size,
			},
		)
	except frappe.PermissionError:
		return api_response(success=False, message="Permission denied", status_code=403)
	except Exception as exc:
		frappe.log_error(frappe.get_traceback(), "Attendance Visibility API Error")
		return api_response(success=False, message=str(exc), status_code=500)


@frappe.whitelist()
def get_shift_filter_options(
	facilities: Optional[str] = None,
	employee_search: Optional[str] = None,
	employee_limit: int = 200,
):
	"""Filter options for shift/attendance admin screens."""
	try:
		_require_admin_access()

		employee_limit = _normalize_page_size(employee_limit, default=200, max_size=500)
		facility_ids, explicitly_filtered = _resolve_facility_scope(facilities)
		if explicitly_filtered and not facility_ids:
			return api_response(
				success=True,
				data={
					"facilities": [],
					"employees": [],
					"shift_types": [],
					"locations": [],
					"shift_status_options": SHIFT_STATUS_OPTIONS,
					"attendance_status_options": ATTENDANCE_STATUS_OPTIONS,
				},
			)

		facility_filters: Dict[str, Any] = {}
		if facility_ids:
			facility_filters["hie_id"] = ["in", facility_ids]

		facilities_data = frappe.get_list(
			"Health Facility",
			filters=facility_filters,
			fields=["hie_id", "facility_name", "facility_mfl"],
			order_by="facility_name asc",
			limit_page_length=0,
		)

		employees = _get_scoped_employee_rows(
			facility_ids,
			employee_search=employee_search,
			limit=employee_limit,
		)
		facility_field = _get_employee_facility_field()
		facility_name_map = _get_facility_name_map(facility_ids)
		employee_items = [
			{
				"name": employee["name"],
				"employee_name": employee.get("employee_name"),
				"department": employee.get("department"),
				"company": employee.get("company"),
				"facility_id": employee.get(facility_field) if facility_field else "",
				"facility_name": facility_name_map.get(employee.get(facility_field), "")
				if facility_field
				else "",
			}
			for employee in employees
		]

		shift_types = frappe.get_list(
			"Shift Type",
			fields=["name", "start_time", "end_time", "enable_auto_attendance", "color"],
			order_by="name asc",
			limit_page_length=0,
		)
		shift_type_items = [
			{
				"name": shift_type.name,
				"start_time": _format_time(shift_type.start_time),
				"end_time": _format_time(shift_type.end_time),
				"enable_auto_attendance": bool(shift_type.enable_auto_attendance),
				"color": shift_type.color,
			}
			for shift_type in shift_types
		]

		return api_response(
			success=True,
			data={
				"facilities": facilities_data,
				"employees": employee_items,
				"shift_types": shift_type_items,
				"locations": _get_location_options(),
				"shift_status_options": SHIFT_STATUS_OPTIONS,
				"attendance_status_options": ATTENDANCE_STATUS_OPTIONS,
			},
		)
	except frappe.PermissionError:
		return api_response(success=False, message="Permission denied", status_code=403)
	except Exception as exc:
		frappe.log_error(frappe.get_traceback(), "Shift Filter Options Error")
		return api_response(success=False, message=str(exc), status_code=500)


@frappe.whitelist()
def create_shift_assignment(
	employee: Optional[str] = None,
	shift_type: Optional[str] = None,
	start_date: Optional[str] = None,
	end_date: Optional[str] = None,
	status: str = "Active",
	shift_location: Optional[str] = None,
	overtime_type: Optional[str] = None,
):
	"""Create and submit a Shift Assignment (admin-only)."""
	try:
		_require_admin_access()

		if not frappe.has_permission("Shift Assignment", "create"):
			frappe.throw(_("Permission denied"), frappe.PermissionError)

		if not employee or not shift_type or not start_date:
			return api_response(
				success=False,
				message="employee, shift_type and start_date are required",
				status_code=400,
			)

		start_date_value = getdate(start_date)
		end_date_value = getdate(end_date) if end_date else None
		if end_date_value and end_date_value < start_date_value:
			return api_response(success=False, message="end_date cannot be before start_date", status_code=400)

		facility_ids, _ = _resolve_facility_scope(None)
		scoped_employee_rows = _get_scoped_employee_rows(facility_ids, employee=employee)
		scoped_employee_ids = {row["name"] for row in scoped_employee_rows}
		_ensure_employee_in_scope(employee, scoped_employee_ids)

		company = frappe.db.get_value("Employee", employee, "company")
		if not company:
			return api_response(success=False, message="Employee does not have a company", status_code=400)

		doc = frappe.new_doc("Shift Assignment")
		doc.employee = employee
		doc.company = company
		doc.shift_type = shift_type
		doc.start_date = start_date_value
		doc.status = status or "Active"
		if end_date_value:
			doc.end_date = end_date_value
		if shift_location:
			doc.shift_location = shift_location
		if overtime_type:
			doc.overtime_type = overtime_type

		doc.insert()
		if doc.docstatus == 0:
			doc.submit()

		return api_response(
			success=True,
			message="Shift assignment created successfully",
			data={
				"name": doc.name,
				"employee": doc.employee,
				"shift_type": doc.shift_type,
				"start_date": doc.start_date,
				"end_date": doc.end_date,
				"status": doc.status,
			},
		)
	except frappe.PermissionError:
		return api_response(success=False, message="Permission denied", status_code=403)
	except frappe.ValidationError as exc:
		return api_response(success=False, message=str(exc), status_code=400)
	except Exception as exc:
		frappe.log_error(frappe.get_traceback(), "Create Shift Assignment Error")
		return api_response(success=False, message=str(exc), status_code=500)


@frappe.whitelist()
def reassign_shift_assignment(
	source_shift: Optional[str] = None,
	target_employee: Optional[str] = None,
	target_date: Optional[str] = None,
	source_date: Optional[str] = None,
	target_shift: Optional[str] = None,
):
	"""Reassign a shift using HRMS roster swap utility (admin-only)."""
	try:
		_require_admin_access()

		if not frappe.has_permission("Shift Assignment", "write"):
			frappe.throw(_("Permission denied"), frappe.PermissionError)

		if not source_shift or not target_employee or not target_date:
			return api_response(
				success=False,
				message="source_shift, target_employee and target_date are required",
				status_code=400,
			)

		source_doc = frappe.get_doc("Shift Assignment", source_shift)
		if not source_doc.has_permission("write"):
			frappe.throw(_("Permission denied"), frappe.PermissionError)

		facility_ids, _ = _resolve_facility_scope(None)
		scoped_employee_rows = _get_scoped_employee_rows(facility_ids)
		scoped_employee_ids = {row["name"] for row in scoped_employee_rows}
		_ensure_employee_in_scope(source_doc.employee, scoped_employee_ids)
		_ensure_employee_in_scope(target_employee, scoped_employee_ids)

		src_date = source_date or target_date

		from hrms.api.roster import swap_shift

		swap_shift(
			src_shift=source_shift,
			src_date=cstr(src_date),
			tgt_employee=target_employee,
			tgt_date=cstr(target_date),
			tgt_shift=target_shift,
		)

		return api_response(
			success=True,
			message="Shift reassigned successfully",
			data={
				"source_shift": source_shift,
				"target_employee": target_employee,
				"target_date": target_date,
			},
		)
	except frappe.PermissionError:
		return api_response(success=False, message="Permission denied", status_code=403)
	except frappe.ValidationError as exc:
		return api_response(success=False, message=str(exc), status_code=400)
	except Exception as exc:
		frappe.log_error(frappe.get_traceback(), "Reassign Shift Error")
		return api_response(success=False, message=str(exc), status_code=500)


@frappe.whitelist()
def create_shift_type(
	name: Optional[str] = None,
	start_time: Optional[str] = None,
	end_time: Optional[str] = None,
	color: Optional[str] = None,
	enable_auto_attendance: Optional[bool] = False,
	process_attendance_after: Optional[str] = None,
):
	"""Create a Shift Type so Shift Assignment link references can be resolved from Admin UI."""
	try:
		_require_admin_access()

		if not frappe.has_permission("Shift Type", "create"):
			frappe.throw(_("Permission denied"), frappe.PermissionError)

		shift_type_name = cstr(name).strip()
		normalized_start = _normalize_time_input(start_time)
		normalized_end = _normalize_time_input(end_time)
		if not shift_type_name or not normalized_start or not normalized_end:
			return api_response(
				success=False,
				message="name, start_time and end_time are required",
				status_code=400,
			)

		if frappe.db.exists("Shift Type", shift_type_name):
			return api_response(
				success=False,
				message=f"Shift Type '{shift_type_name}' already exists",
				status_code=409,
			)

		auto_attendance_enabled = _to_bool(enable_auto_attendance)
		doc = frappe.new_doc("Shift Type")
		doc.name = shift_type_name
		doc.start_time = normalized_start
		doc.end_time = normalized_end
		doc.color = cstr(color).strip() or "Blue"
		doc.enable_auto_attendance = 1 if auto_attendance_enabled else 0
		doc.determine_check_in_and_check_out = (
			"Alternating entries as IN and OUT during the same shift"
		)
		doc.working_hours_calculation_based_on = "First Check-in and Last Check-out"
		if auto_attendance_enabled:
			doc.process_attendance_after = process_attendance_after or today()

		doc.insert()

		return api_response(
			success=True,
			message="Shift Type created successfully",
			data={
				"name": doc.name,
				"start_time": _format_time(doc.start_time),
				"end_time": _format_time(doc.end_time),
				"color": doc.color,
				"enable_auto_attendance": bool(doc.enable_auto_attendance),
			},
		)
	except frappe.PermissionError:
		return api_response(success=False, message="Permission denied", status_code=403)
	except frappe.ValidationError as exc:
		return api_response(success=False, message=str(exc), status_code=400)
	except Exception as exc:
		frappe.log_error(frappe.get_traceback(), "Create Shift Type Error")
		return api_response(success=False, message=str(exc), status_code=500)


@frappe.whitelist()
def create_shift_location(
	name: Optional[str] = None,
	parent_location: Optional[str] = None,
	is_group: Optional[bool] = False,
):
	"""Create a Location for Shift Assignment link references (admin-only)."""
	try:
		_require_admin_access()

		if not frappe.has_permission("Location", "create"):
			frappe.throw(_("Permission denied"), frappe.PermissionError)

		location_name = _normalize_optional_text(name)
		if not location_name:
			return api_response(success=False, message="name is required", status_code=400)

		if frappe.db.exists("Location", location_name):
			return api_response(
				success=False,
				message=f"Location '{location_name}' already exists",
				status_code=409,
			)

		meta = frappe.get_meta("Location")
		doc = frappe.new_doc("Location")
		if meta.has_field("location_name"):
			doc.location_name = location_name
		else:
			doc.name = location_name

		parent = _normalize_optional_text(parent_location)
		if parent and frappe.db.exists("Location", parent) and meta.has_field("parent_location"):
			doc.parent_location = parent

		if meta.has_field("is_group"):
			doc.is_group = 1 if _to_bool(is_group) else 0

		doc.insert()

		return api_response(
			success=True,
			message="Location created successfully",
			data={"name": doc.name},
		)
	except frappe.PermissionError:
		return api_response(success=False, message="Permission denied", status_code=403)
	except frappe.ValidationError as exc:
		return api_response(success=False, message=str(exc), status_code=400)
	except Exception as exc:
		frappe.log_error(frappe.get_traceback(), "Create Shift Location Error")
		return api_response(success=False, message=str(exc), status_code=500)
