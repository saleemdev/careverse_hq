# Product Brief: Shift Management for Frappe HR in Careverse HQ

## Executive Summary

Careverse HQ needs a practical Shift Management capability that fits current organization-scoped operations while staying aligned with Frappe HRMS. The first release is **Admin Only** and should replace the current attendance placeholder experience with real shift creation, reassignment, and attendance visibility.

The strategy is to build a thin orchestration layer in `careverse_hq` and reuse HRMS for canonical shift and attendance records. This reduces implementation risk, keeps upgrade paths open, and speeds delivery.

## The Problem

Attendance routes exist but do not provide operational value yet. Organizations cannot reliably monitor shift assignments, handle change requests, or identify late/missing checkins from a single Careverse workflow.

Without this capability, HR/admin teams rely on fragmented tooling and manual follow-up, leading to delayed staffing corrections and poor operational visibility.

## The Solution

Deliver Shift Management as a scoped module that:
- Lets admins create shift allocations for employees and date ranges.
- Lets admins reassign shifts (including swap/reallocation flows supported by HRMS primitives).
- Shows attendance visibility and exceptions (late arrivals, missing checkouts, unresolved checkins).
- Uses HRMS entities and APIs as source of truth.

## What Makes This Different

- Brownfield-safe: no re-platforming, no custom clone of HRMS shift data.
- Security-aligned: company and facility scope controls follow existing Careverse API patterns.
- Fast path to value: ships directly into existing `attendance` route placeholders.

## Who This Serves

- Primary users: HR/Admin operators managing staffing and daily attendance quality.
- Access model: admin-only in phase 1.

## Success Criteria

- Admin users can create shifts without leaving Careverse.
- Admin users can reassign existing shifts from the same module.
- Attendance exception list is available for same-day admin action.
- No cross-company or unauthorized facility data exposure.

## Scope

In scope (first increment):
- Admin shift creation
- Admin shift reassignment
- Attendance visibility and exceptions dashboard
- UI consistency with Asset Management module patterns (tokens, cards, tables, filters)
- RBAC-safe querying via `frappe.get_list` patterns

Out of scope (first increment):
- Full roster builder UI
- Workforce optimization algorithms
- Employee self-service shift management
- Complex multi-step approval chains beyond baseline HRMS capability

## Vision

Evolve from visibility and approvals into a full staffing operations cockpit: predictive understaffing alerts, policy-driven scheduling rules, and deeper integration across leave, payroll, and compliance workflows.
