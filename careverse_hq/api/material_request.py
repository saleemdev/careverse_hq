import frappe
from frappe import _
from frappe.utils import now_datetime

@frappe.whitelist()
def forward_for_approval(docname):
    """
    Forward the Material Request for approval
    :param docname: Material Request document name
    :return: dict with success status
    """
    try:
        doc = frappe.get_doc("Material Request", docname)
        
        # Check permissions
        if not frappe.has_permission("Material Request", "write", doc):
            frappe.throw(_("You do not have permission to forward this Material Request"))
            
        # You can add any validation checks here
        if doc.status == "Approved":
            frappe.throw(_("This Material Request is already approved"))
            
        # Update the workflow state if you're using Frappe Workflow
        workflow = frappe.get_doc("Workflow", {"document_type": "Material Request", "is_active": 1})
        current_state = doc.workflow_state or "Draft"
        
        # Find the transition to "Forwarded to CEO"
        for transition in workflow.transitions:
            if transition.state == current_state and transition.action == "Forward for Approval":
                doc.workflow_state = transition.next_state
                break
        
        # If no workflow is found, update status directly
        if not doc.workflow_state or doc.workflow_state == current_state:
            doc.status = "Forwarded for Approval"
            
        # Add a comment
        doc.add_comment('Workflow', _('Forwarded for CEO Approval'))
        
        # Save the document
        doc.save(ignore_permissions=True)
        frappe.db.commit()
        
        # Notify the CEO or other approvers
        notify_approvers(doc)
        
        return {"success": True, "message": _("Successfully forwarded for approval")}
        
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(frappe.get_traceback(), _("Error in forwarding Material Request"))
        return {"success": False, "message": str(e)}


@frappe.whitelist()
def approve_material_request(docname):
    """
    Approve the Material Request
    :param docname: Material Request document name
    :return: dict with success status
    """
    try:
        doc = frappe.get_doc("Material Request", docname)
        
        # Check permissions - only users with approval role should be able to approve
        if not frappe.has_permission("Material Request", "write", doc):
            frappe.throw(_("You do not have permission to approve this Material Request"))
            
        # Check if user has the CEO role or appropriate approval role
        if not frappe.user.has_role("CEO") and not frappe.user.has_role("Material Request Approver"):
            frappe.throw(_("Only authorized personnel can approve Material Requests"))
            
        # Update the workflow state if you're using Frappe Workflow
        workflow = frappe.get_doc("Workflow", {"document_type": "Material Request", "is_active": 1})
        current_state = doc.workflow_state or "Pending CEO Approval"
        
        # Find the transition to "Approved"
        for transition in workflow.transitions:
            if transition.state == current_state and transition.action == "Approve":
                doc.workflow_state = transition.next_state
                break
        
        # If no workflow is found, update status directly
        if not doc.workflow_state or doc.workflow_state == current_state:
            doc.status = "Approved"
            
        # Add approval details
        doc.approved_by = frappe.session.user
        doc.approved_date = now_datetime()
        
        # Add a comment
        doc.add_comment('Workflow', _('Material Request Approved'))
        
        # Save the document
        doc.save(ignore_permissions=True)
        
        # Create follow-up documents if needed (e.g., Purchase Order)
        if doc.material_request_type == "Purchase":
            create_purchase_order(doc)
            
        frappe.db.commit()
        
        # Notify the requestor
        notify_requestor(doc)
        
        return {"success": True, "message": _("Material Request approved successfully")}
        
    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(frappe.get_traceback(), _("Error in approving Material Request"))
        return {"success": False, "message": str(e)}


def create_purchase_order(material_request_doc):
    """
    Create a Purchase Order from the approved Material Request
    :param material_request_doc: Material Request document
    """
    try:
        from erpnext.stock.doctype.material_request.material_request import make_purchase_order
        
        po = make_purchase_order(material_request_doc.name)
        po.insert(ignore_permissions=True)
        
        # You can also submit the PO if required
        # po.submit()
        
        # Add a comment about PO creation
        material_request_doc.add_comment(
            'Info', 
            _("Purchase Order {0} created").format(po.name)
        )
        
    except ImportError:
        # If ERPNext is not installed or custom implementation is needed
        frappe.log_error(
            _("ERPNext not installed or custom implementation required for PO creation"),
            _("Material Request Approval")
        )
    except Exception as e:
        frappe.log_error(
            frappe.get_traceback(),
            _("Error in creating Purchase Order from Material Request")
        )


def notify_approvers(doc):
    """
    Send notification to approvers
    :param doc: Material Request document
    """
    try:
        approvers = frappe.get_all(
            "Has Role", 
            filters={"role": "CEO", "parenttype": "User"},
            fields=["parent"]
        )
        
        if not approvers:
            return
            
        subject = _("Material Request {0} requires your approval").format(doc.name)
        message = _("""
            <p>Material Request <strong>{0}</strong> has been forwarded for your approval.</p>
            <p>Request details:</p>
            <ul>
                <li>Requested by: {1}</li>
                <li>Purpose: {2}</li>
                <li>Required by: {3}</li>
                <li>County: {4}</li>
            </ul>
            <p>Please review and approve at your earliest convenience.</p>
            <p><a href="{5}">View Material Request</a></p>
        """).format(
            doc.name,
            doc.owner,
            doc.purpose,
            doc.schedule_date,
            doc.county,
            frappe.utils.get_url_to_form(doc.doctype, doc.name)
        )
        
        for approver in approvers:
            frappe.sendmail(
                recipients=approver.parent,
                subject=subject,
                message=message
            )
    except Exception:
        frappe.log_error(frappe.get_traceback(), _("Error in sending Material Request approval notification"))


def notify_requestor(doc):
    """
    Send notification to the requestor about approval
    :param doc: Material Request document
    """
    try:
        subject = _("Material Request {0} has been approved").format(doc.name)
        message = _("""
            <p>Your Material Request <strong>{0}</strong> has been approved.</p>
            <p>Approved by: {1}</p>
            <p>Approval date: {2}</p>
            <p><a href="{3}">View Material Request</a></p>
        """).format(
            doc.name,
            doc.approved_by,
            frappe.utils.format_datetime(doc.approved_date),
            frappe.utils.get_url_to_form(doc.doctype, doc.name)
        )
        
        frappe.sendmail(
            recipients=doc.owner,
            subject=subject,
            message=message
        )
    except Exception:
        frappe.log_error(frappe.get_traceback(), _("Error in sending Material Request approval notification"))