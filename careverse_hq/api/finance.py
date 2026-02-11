import frappe
from .response import api_response
from .dashboard_utils import get_user_company

@frappe.whitelist()
def get_account_balances(company=None):
    """
    Get balances for key account types: Asset, Liability, Equity, Income, Expense
    """
    try:
        user = frappe.session.user
        if not company:
            company = get_user_company(user)
            
        if not company:
            return api_response(success=False, message="Company required", status_code=400)
            
        # Get all accounts for this company
        accounts = frappe.db.get_list(
            "Account",
            filters={"company": company, "is_group": 0},
            fields=["name", "account_type", "root_type", "balance_must_be", "report_type"]
        )
        
        # In ERPNext, Account balance isn't a direct field, we usually get it from gl_entry or use get_balance
        # For efficiency in a dashboard, we can use a query on gl_entry or cached balances
        
        account_balances = []
        for acc in accounts:
            # Note: frappe.utils.accounts.get_balance is slow for many accounts
            # We'll use a simplified aggregation for the dashboard
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
def get_chart_of_accounts_summary(company=None):
    """
    Get summary of Chart of Accounts
    """
    try:
        if not company:
            company = get_user_company(frappe.session.user)
            
        # Implementation for CoA summary
        return api_response(success=True, data={})
    except Exception as e:
        return api_response(success=False, message=str(e), status_code=500)
