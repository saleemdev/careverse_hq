"""Redirect handler for /jobs/ -> /jobs"""
import frappe

no_cache = True


def get_context(context):
    frappe.local.flags.redirect_location = "/jobs"
    raise frappe.Redirect
