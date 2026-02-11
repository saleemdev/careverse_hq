import frappe
from frappe.utils import validate_email_address
import time


def send_test_email(
    recipient_email,
    subject="Test Email from Frappe",
    message="This is a test email sent from Frappe",
):
    """
    Send a test email using frappe.sendmail and verify it was actually sent

    Args:
        recipient_email (str): Email address to send the test email to
        subject (str, optional): Subject of the email
        message (str, optional): Body content of the email

    Returns:
        dict: Result of the email sending attempt with verification
    """
    # Validate email address format
    if not validate_email_address(recipient_email):
        return {
            "success": False,
            "message": f"Invalid email address: {recipient_email}",
        }

    try:
        # Check if email account is properly configured
        email_account = frappe.get_doc("Email Account", {"default_outgoing": 1})
        if not email_account:
            return {
                "success": False,
                "message": "No default outgoing email account found",
            }

        # Test SMTP connection before sending
        try:
            email_account.validate_smtp_conn()
        except Exception as e:
            return {"success": False, "message": f"SMTP connection failed: {str(e)}"}

        # Clear any existing failed email queue entries to avoid confusion
        frappe.db.sql("""DELETE FROM `tabEmail Queue` WHERE status='Error'""")

        # Send email using frappe.sendmail
        frappe.sendmail(
            recipients=recipient_email,
            subject=subject,
            message=message,
            now=False,  # Queue the email instead of sending immediately
        )

        # Get the email queue ID
        email_queue = frappe.get_all(
            "Email Queue",
            filters={"message": ["like", f"%{subject}%"]},
            fields=["name"],
            order_by="creation desc",
            limit=1,
        )

        if not email_queue:
            return {
                "success": False,
                "message": "Email queued but couldn't find queue entry",
            }

        email_queue_id = email_queue[0].name

        # Process the email queue
        frappe.db.commit()
        print(f"Attempting to send email from queue ID: {email_queue_id}")

        # Process the email queue
        from frappe.email.queue import flush

        flush(from_test=True)

        # Wait a moment for the email to be processed
        time.sleep(2)

        # Check if email was actually sent
        email_status = frappe.get_value("Email Queue", email_queue_id, "status")

        if email_status == "Sent":
            return {
                "success": True,
                "message": f"Test email sent successfully to {recipient_email}",
                "email_queue_id": email_queue_id,
            }
        else:
            # Get the error message if available
            error_message = (
                frappe.get_value("Email Queue", email_queue_id, "error")
                or "Unknown error"
            )
            return {
                "success": False,
                "message": f"Email failed to send. Status: {email_status}, Error: {error_message}",
                "email_queue_id": email_queue_id,
            }

    except Exception as e:
        frappe.log_error(f"Failed to send test email: {str(e)}", "Email Test Error")
        return {"success": False, "message": f"Failed to send email: {str(e)}"}


# Console test function
def test_from_console(your_email):
    """
    Function to test email sending from the console/bench with verification

    Usage:
        bench execute my_app.my_module.test_from_console --args "your_email@example.com"
    """
    print(f"Testing email send to {your_email}...")
    result = send_test_email(your_email)
    print(f"Result: {result}")
    return result


# For testing with HTML content
def send_html_test_email(recipient_email, subject="HTML Test Email from Frappe"):
    """Send a test email with HTML formatting and verify it was sent"""
    html_content = """
    <h2>This is a test HTML email from Frappe</h2>
    <p>This email confirms that your Frappe email configuration is working correctly.</p>
    <ul>
        <li>Your domain is set up</li>
        <li>Your email account is configured</li>
        <li>The system can send HTML emails</li>
    </ul>
    <p><strong>If you received this, everything is working correctly!</strong></p>
    """

    return send_test_email(recipient_email, subject, html_content)


# Quick verification of email setup
def verify_email_setup():
    """
    Check if email is properly configured in the system

    Usage:
        bench execute my_app.my_module.verify_email_setup
    """
    try:
        # Check if default outgoing email account exists
        email_account = frappe.get_doc("Email Account", {"default_outgoing": 1})
        if not email_account:
            print("❌ No default outgoing email account found")
            return False

        print(f"✅ Default outgoing email account found: {email_account.email_id}")

        # Test SMTP connection
        try:
            email_account.validate_smtp_conn()
            print(
                f"✅ SMTP connection successful to {email_account.smtp_server}:{email_account.smtp_port}"
            )
        except Exception as e:
            print(f"❌ SMTP connection failed: {str(e)}")
            return False

        return True

    except Exception as e:
        print(f"❌ Error checking email setup: {str(e)}")
        return False
