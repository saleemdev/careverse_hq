import frappe
from frappe.rate_limiter import rate_limit
from werkzeug.utils import secure_filename
from careverse_hq.api import utils

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf", "csv", "xlsx", "docx","xls", "doc"}
MAX_FILE_SIZE_MB = 5 

def is_file_allowed(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def is_file_size_allowed(file_stream):
    file_stream.seek(0, 2)  # Seek to end
    size = file_stream.tell()
    file_stream.seek(0)  # Reset to start
    return size <= MAX_FILE_SIZE_MB * 1024 * 1024

@frappe.whitelist()
@rate_limit(limit=10, seconds=60 * 5)
def upload_custom_document():
    files = frappe.request.files
    docname = frappe.form_dict.id
    filenames = list(files.keys())
    agent = frappe.form_dict.agent
    document_category = frappe.form_dict.document_category
    
    if not agent:
        http_status_code = 400
        message = "Please provide your Agent ID provided during API onboarding."
        response = utils.api_response(status_code=http_status_code,message=message)
        return response
    
    if not docname or not document_category:
        http_status_code = 400
        message = "Missing 'id' or 'document_category'."
        response = utils.api_response(status_code=http_status_code,message=message)
        return response
    
    if len(filenames) < 1:
        http_status_code = 400
        message = "No file provided."
        response = utils.api_response(status_code=http_status_code,message=message)
        return response
    
    if len(filenames) > 5:
        http_status_code = 400
        message = "Too many files uploaded. Limit to 5 files per request."
        response = utils.api_response(status_code=http_status_code,message=message)
        return response

    for filename in filenames:
        doc_obj = files[filename]
        file_stream = doc_obj.stream
        id_filename = secure_filename(doc_obj.filename)
        
        if not is_file_allowed(id_filename):
            http_status_code = 400
            message = "File type not allowed: {}".format(id_filename)
            response = utils.api_response(status_code=http_status_code,message=message)
            return response
        
        if not is_file_size_allowed(file_stream):
            http_status_code = 400
            message = f"File {id_filename} exceeds size limit of {MAX_FILE_SIZE_MB}MB."
            response = utils.api_response(status_code=http_status_code,message=message)
            return response
        
        file_stream.seek(0)
        doc_content = file_stream.read()
        
        id_ret = frappe.get_doc(
            {
                "doctype": "File",
                "attached_to_doctype": document_category,  # doctype,
                "attached_to_name": docname,
                "file_name": id_filename,
                "is_private": 0,
                "content": doc_content,
            }
        )
        id_ret.save()

        _d = frappe.get_doc("File", id_ret.get("name"))
        args = dict(
            doctype="Document Upload",
            document_category=document_category,
            document_id=docname,
            document_type=filename,
            document_number=id_filename,
            attachment=_d.get("file_url"),
        )
        
        try:
            frappe.get_doc(args).insert()
            frappe.db.commit()
        except frappe.PermissionError:
            frappe.db.rollback()
            http_status_code = 403
            message = "Not permitted to create Document Upload."
            response = utils.api_response(status_code=http_status_code,message=message)
            return response
        
    http_status_code = 200
    message = "Document upload was completed successfully."
    response = utils.api_response(success=True,status_code=http_status_code,message=message)
    return response

