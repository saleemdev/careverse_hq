"""
OIDC identity governance for Admin Central.

Provides:
- Subject stability backfill: ensures every eligible health worker has a stable
  `User Social Login(provider=frappe)` entry so the OIDC `sub` claim is consistent.
- Identity reconciliation report: detects and categorises drift between users,
  health professional records, and social login mappings.
"""

from __future__ import annotations

from typing import Any, Dict, List

import frappe
from frappe import _


FRAPPE_PROVIDER = "frappe"
ACTIVE_HP_STATUSES = {"active"}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_eligible_users() -> List[str]:
    """Return names of enabled users linked to an active Health Professional."""
    if not frappe.db.exists("DocType", "Health Professional"):
        return []
    rows = frappe.get_all(
        "Health Professional",
        filters=[["status", "in", list(ACTIVE_HP_STATUSES)]],
        fields=["user"],
    )
    eligible = []
    for row in rows:
        user = row.get("user") or ""
        if not user:
            continue
        enabled = int(frappe.db.get_value("User", user, "enabled") or 0)
        if enabled:
            eligible.append(user)
    return eligible


def _has_social_login(user: str) -> bool:
    return bool(
        frappe.db.exists(
            "User Social Login",
            {"parent": user, "provider": FRAPPE_PROVIDER},
        )
    )


def _create_social_login(user: str) -> str:
    """Create a stable User Social Login entry for the given user."""
    stable_userid = frappe.generate_hash(user + FRAPPE_PROVIDER, length=32)
    user_doc = frappe.get_doc("User", user)
    user_doc.append(
        "social_logins",
        {
            "provider": FRAPPE_PROVIDER,
            "userid": stable_userid,
            "username": user,
        },
    )
    user_doc.save(ignore_permissions=True)
    return stable_userid


# ---------------------------------------------------------------------------
# Story 1.2 — Subject stability backfill
# ---------------------------------------------------------------------------

def backfill_subject_stability() -> Dict[str, Any]:
    """
    Scheduled job: ensure every eligible health worker has a stable
    User Social Login(provider=frappe) entry.

    Safe to run multiple times — skips users who already have an entry.
    Returns a summary dict for logging/reporting.
    """
    if not frappe.db.exists("DocType", "Health Professional"):
        frappe.log_error("Health Professional DocType not found — skipping backfill", "OIDC Identity")
        return {"status": "skipped", "reason": "Health Professional DocType missing"}

    eligible = _get_eligible_users()
    created = []
    already_mapped = []
    failed = []

    for user in eligible:
        try:
            if _has_social_login(user):
                already_mapped.append(user)
                continue
            stable_userid = _create_social_login(user)
            created.append({"user": user, "userid": stable_userid})
        except Exception as exc:
            frappe.log_error(
                f"backfill_subject_stability failed for {user}: {exc}\n{frappe.get_traceback()}",
                "OIDC Identity",
            )
            failed.append(user)

    if created:
        frappe.db.commit()

    summary = {
        "status": "ok",
        "eligible_total": len(eligible),
        "created": len(created),
        "already_mapped": len(already_mapped),
        "failed": len(failed),
        "failed_users": failed,
    }
    frappe.logger().info(f"OIDC backfill_subject_stability: {summary}")
    return summary


# ---------------------------------------------------------------------------
# Story 1.3 — Identity reconciliation report
# ---------------------------------------------------------------------------

def get_identity_reconciliation_report() -> Dict[str, Any]:
    """
    On-demand report: detect drift in user → health professional → social login mappings.

    Anomaly categories:
    - missing_hp: enabled user with no Health Professional record
    - inactive_hp: user linked to HP with non-active status
    - missing_sub: eligible user with no User Social Login(provider=frappe)
    - disabled_user_with_hp: disabled user still linked to an active HP
    """
    if not frappe.db.exists("DocType", "Health Professional"):
        return {
            "status": "unavailable",
            "reason": "Health Professional DocType not found",
            "anomalies": [],
        }

    anomalies: List[Dict[str, Any]] = []

    # All Health Professional records
    hp_rows = frappe.get_all(
        "Health Professional",
        fields=["name", "user", "status"],
    )

    for row in hp_rows:
        user = row.get("user") or ""
        hp_name = row.get("name") or ""
        hp_status = (row.get("status") or "").strip()

        if not user:
            anomalies.append({
                "category": "missing_user_link",
                "health_professional": hp_name,
                "user": None,
                "hp_status": hp_status,
                "remediation": "Link a user account to this Health Professional record.",
            })
            continue

        user_enabled = int(frappe.db.get_value("User", user, "enabled") or 0)

        if not user_enabled and hp_status.lower() in ACTIVE_HP_STATUSES:
            anomalies.append({
                "category": "disabled_user_with_active_hp",
                "health_professional": hp_name,
                "user": user,
                "hp_status": hp_status,
                "remediation": "Deactivate the Health Professional or re-enable the user account.",
            })
            continue

        if not user_enabled:
            continue

        if hp_status.lower() not in ACTIVE_HP_STATUSES:
            anomalies.append({
                "category": "inactive_hp",
                "health_professional": hp_name,
                "user": user,
                "hp_status": hp_status,
                "remediation": "Activate the Health Professional to allow OIDC sign-in.",
            })
            continue

        # User is enabled and HP is active — check sub mapping
        if not _has_social_login(user):
            anomalies.append({
                "category": "missing_sub",
                "health_professional": hp_name,
                "user": user,
                "hp_status": hp_status,
                "remediation": "Run backfill_subject_stability() to create the missing sub mapping.",
            })

    return {
        "status": "ok",
        "total_hp_records": len(hp_rows),
        "anomaly_count": len(anomalies),
        "anomalies": anomalies,
    }


@frappe.whitelist()
def run_identity_reconciliation_report() -> Dict[str, Any]:
    """API endpoint: run identity reconciliation report (admin only)."""
    user = frappe.session.user
    admin_roles = {"System Manager", "Admin Central Admin"}
    if not user or user == "Guest" or not set(frappe.get_roles(user)).intersection(admin_roles):
        frappe.local.response.http_status_code = 403
        return {"success": False, "error": "Forbidden"}
    report = get_identity_reconciliation_report()
    return {"success": True, "data": report}
