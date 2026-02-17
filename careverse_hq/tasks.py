"""
Scheduled tasks for Careverse HQ
"""
import frappe


def sync_expired_licenses_from_hwr():
    """
    Sync Health Professionals with expired/expiring licenses from HWR.

    - Runs every 1 hour (configured in hooks.py)
    - Processes up to 500 records per run
    - Priority: never-synced first, then oldest last_sync_date
    - Excludes: recently synced (< 1 hour) or sync_in_progress
    - Executes each sync synchronously (no enqueue)
    """
    from careverse_hq.api.health_professionals import sync_health_professional_background

    try:
        one_hour_ago = frappe.utils.add_to_date(frappe.utils.now(), hours=-1)

        # Prioritize: never-synced first (last_sync_date IS NULL), then oldest sync date
        health_professionals = frappe.get_all(
            "Health Professional",
            filters=[
                ["sync_in_progress", "=", 0]
            ],
            or_filters=[
                ["last_sync_date", "<", one_hour_ago],
                ["last_sync_date", "is", "not set"]
            ],
            fields=["name", "full_name", "license_end", "last_sync_date"],
            order_by="last_sync_date asc",
            limit=500
        )

        total = len(health_professionals)

        if not total:
            print("No HPs found needing sync")
            frappe.logger().info("HP Batch Sync: No HPs found needing sync")
            return

        print(f"Found {total} HPs needing license sync")
        frappe.logger().info(f"HP Batch Sync: Found {total} HPs to process")

        success_count = 0
        fail_count = 0

        for i, hp in enumerate(health_professionals, 1):
            try:
                print(f"[{i}/{total}] Syncing {hp.name} ({hp.full_name}) - license_end: {hp.license_end}")
                sync_health_professional_background(hp.name)
                success_count += 1
                print(f"[{i}/{total}] OK")
            except Exception as e:
                fail_count += 1
                print(f"[{i}/{total}] FAILED: {str(e)}")
                frappe.log_error(
                    f"Batch sync failed for {hp.name} ({hp.full_name}): {str(e)}",
                    "HP Batch Sync Error"
                )

        summary = f"HP Batch Sync complete: {success_count} succeeded, {fail_count} failed out of {total}"
        print(summary)
        frappe.logger().info(summary)

    except Exception as e:
        print(f"Batch sync failed: {str(e)}")
        frappe.log_error(
            f"Batch sync failed: {str(e)}\n\n{frappe.get_traceback()}",
            "HP Batch Sync Failure"
        )
