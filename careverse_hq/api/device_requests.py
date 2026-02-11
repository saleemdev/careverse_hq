import frappe
from frappe import _
import re
from frappe.utils import escape_html, get_fullname ,strip_html_tags
from .utils import api_response
import json
from healthpro_erp.healthpro_erp.decorators.permissions import auth_required
from .utils import sanitize_request,api_response




@frappe.whitelist(methods=["GET"])
@sanitize_request
@auth_required()
def get_comments(**kwargs):
    # Get parameters from query string for GET request
    if not kwargs:
        kwargs = frappe.local.form_dict
    
    document_type = kwargs.get("document_type")
    doc_id = kwargs.get("id")
    
    # Pagination parameters
    page = int(kwargs.get("page", 1))
    per_page = int(kwargs.get("per_page", 10))
    
    # Validate page and per_page
    if page < 1:
        page = 1
    if per_page < 1 or per_page > 100:  # Set max limit to prevent abuse
        per_page = 10
    
    if not document_type or not doc_id:
        return api_response(
            success=False,
            message="Missing required fields: document_type and id",
            status_code=400
        )
    

    
    if not frappe.db.exists(document_type, doc_id):
        return api_response(
            success=False,
            message="Document not found",
            status_code=404
        )
    
    try:
        # Get total count first
        total_count = frappe.db.count("Comment", filters={
            "reference_doctype": document_type,
            "reference_name": doc_id,
            "comment_type": "Comment"
        })
        
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Get paginated comments
        comments = frappe.get_all("Comment",
            filters={
                "reference_doctype": document_type,
                "reference_name": doc_id,
                "comment_type": "Comment"
            },
            fields=[
                "name",
                "content",
                "comment_by",
                "creation",
                "comment_email"
            ],
            order_by="creation desc",
            limit_start=offset,
            limit_page_length=per_page
        )
        
        # Format the response to include user details
        formatted_comments = []
        for comment in comments:
            comment_by = comment.get("comment_by")
            comment_email = comment.get("comment_email")
            user_name = None
            user_id = comment_by or comment_email
            
            if user_id:
                user_name = frappe.db.get_value("User", user_id, "full_name")
            
            if not user_name:
                user_name = user_id
            
            designation = None
            employee = frappe.db.get_value("Employee", {"user_id": comment.get("comment_by")}, "designation")
            if employee:
                designation = employee
            
            plain_comment = re.sub('<[^<]+?>', '', comment.content or "")
            
            formatted_comments.append({
                "comment": plain_comment,
                "user": user_name,
                "designation": designation,
                "time": comment.creation.strftime("%Y-%m-%d %H:%M:%S")
            })
        
        return api_response(
            success=True,
            message="Comments retrieved successfully",
            data={
                "document_type": document_type,
                "document_id": doc_id,
                "comments": formatted_comments
            },
            pagination={
                "current_page": page,
                "per_page": per_page,
                "total_count": total_count
            },
            status_code=200
        )
        
    except Exception as e:
        frappe.log_error( title="Get Comments Error",message=str(e))
        return api_response(
            success=False,
            message=str(e),
            status_code=500
        )





@frappe.whitelist(methods=["POST"])
@auth_required()
def add_comment(**kwargs):
 
    if not kwargs:
        kwargs = frappe.local.request.get_json(silent=True)
    
    document_type = kwargs.get("document_type")
    doc_id = kwargs.get("id")
    comment_text = kwargs.get("comment")

    if not document_type or not doc_id or not comment_text:
        return {"status": "Failed", "error": "Missing required fields"}
   


    if not frappe.db.exists(document_type, doc_id):
        return {"status": "Failed", "error": "Document not found"}
    
    try:
    
        doc = frappe.get_doc(document_type, doc_id)
        comment = doc.add_comment("Comment", comment_text)
        frappe.enqueue(
            method="careverse_hq.api.new_device.send_email_notification",
            queue="short",
            timeout=60,
            doc=doc,
            comment_text=comment_text
        )
        
      
        return api_response(
                success=True, message=f"Comment Added Succesfully to { document_type}",data={"reference_id":comment.name} ,status_code=200
            )
    
    except Exception as e:
        frappe.log_error( title="Add Comment Error",message=str(e))
     
        return {"status": "Failed", "error": str(e)}

def send_email_notification(doc, comment_text):
 
    
   
    current_user = frappe.session.user
    commenter_name = get_fullname(current_user)
    
   
    recipients = get_email_recipients(doc, current_user)
    
    if not recipients:
        return  
    
    
    subject = f"New Comment on {doc.doctype} {doc.name}"
    
    message = f"""
    <h3>New Comment Added</h3>
    <p><strong>{commenter_name}</strong> added a comment:</p>
    <p style="background: #f5f5f5; padding: 10px; border-radius: 5px;">
        "{comment_text}"
    </p>
    <p><strong>Document:</strong> {doc.doctype} - {doc.name}</p>
    """
    

    # Send the email
    try:
        frappe.sendmail(
            recipients=recipients,
            subject=subject,
            message=message
        )
        print(f"Email sent to {len(recipients)} people")
    except Exception as e:
        frappe.log_error(str(e), "Email Send Error")

def get_email_recipients(doc, exclude_user):

    
    usernames = []
    
 
    all_users = frappe.get_all("User", 
        filters={"enabled": 1, "user_type": "System User"}, 
        fields=["name"]
    )
    
    for user in all_users:
        username = user.name
        
     
        if username == exclude_user:
            continue
     
        if frappe.has_permission(doc.doctype, "read", user=username):
            usernames.append(username)
    
 
    managers = frappe.get_all(
        "Has Role",
        filters={
            "role": ["in", ["System Manager", "Asset Manager"]],
            "parent": ["!=", exclude_user]
        },
        fields=["parent"]
    )
    
    for manager in managers:
        usernames.append(manager.parent)
    

    usernames = list(set(usernames))
    

    email_addresses = []
    for username in usernames:
        user_email = frappe.db.get_value("User", username, "email")
        if user_email:  
            email_addresses.append(user_email)
    
    return email_addresses


def send_email(document_type, doc_name, comment_text, commenter):

    
  
    subject = f"New Comment on {document_type}"
    
  
    message = f"""
    Hi,
    
    {get_fullname(commenter)} added a comment on {document_type} {doc_name}:
    
    "{comment_text}"
    
    Thank you!
    """
    
    # Send to all managers
    managers = frappe.get_all("User", 
        filters={"role_profile_name": "Asset Manager", "enabled": 1},
        fields=["email"]
    )
    
    emails = [m.email for m in managers if m.email]
    
    if emails:
        frappe.sendmail(
            recipients=emails,
            subject=subject,
            message=message
        )