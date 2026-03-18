import frappe
from .response import api_response


@frappe.whitelist()
def get_account_balances():
    """
    Get balances for key account types: Asset, Liability, Equity, Income, Expense.

    RBAC: frappe.get_list applies User Permissions (including Company) automatically.
    """
    try:
        accounts = frappe.get_list(
            "Account",
            filters={"is_group": 0},
            fields=["name", "account_type", "root_type", "balance_must_be", "report_type"],
            limit_page_length=0
        )

        account_balances = []
        for acc in accounts:
            balance = frappe.db.get_value("Account", acc.name, "balance") or 0
            account_balances.append({
                "account": acc.name,
                "type": acc.root_type,
                "balance": balance
            })

        return api_response(success=True, data=account_balances)

    except Exception as e:
        frappe.log_error(message=frappe.get_traceback(), title="Finance API Error")
        return api_response(success=False, message=str(e), status_code=500)


@frappe.whitelist()
def get_chart_of_accounts_summary():
    """
    Get summary of Chart of Accounts.

    RBAC: frappe.get_list applies User Permissions (including Company) automatically.
    """
    try:
        return api_response(success=True, data={})
    except Exception as e:
        return api_response(success=False, message=str(e), status_code=500)
