# Copyright (c) 2025, Saleem and contributors
# For license information, please see license.txt

import frappe, requests, json
from frappe.model.document import Document
import jwt
import datetime


class FrappeMailSettings(Document):
    @frappe.whitelist()
    def show_password(self):
        return self.get_password("secret")

    def send_email(self, **kwargs):
        """
        Send an email with the specified parameters.

        Args:
                        from_ (str): The sender's email address.
                        to (str | list[str]): Recipient email(s).
                        subject (str): Subject of the email.
                        cc (str | list[str] | None): Optional carbon copy recipients.
                        bcc (str | list[str] | None): Optional blind carbon copy recipients.
                        html (str | None): Optional HTML body of the email.
                        reply_to (str | list[str] | None): Optional reply-to email(s).
                        in_reply_to_mail_type (str | None): Optional reference type for the email being replied to.
                        in_reply_to_mail_name (str | None): Optional reference ID for the email being replied to.
                        custom_headers (dict | None): Optional custom headers.
                        attachments (list[dict] | None): List of attachments.
                        is_newsletter (bool): Optional flag to mark the email as a newsletter. Defaults to False.
        """
        uri = self.get("default_uri") or "/send-mail"
        # uri = self.get("default_uri") or "/api/method/mail_client.api.outbound.send"
        base_url = self.get("base_url")
        token, secret = self.get("token"), self.get_password("secret")
        # t_auth = f"token {token}:{secret}"
        from .hie_settings import HIE

        hie = HIE()
        t_auth = hie.generate_jwt_token()
        headers = dict(Authorization=t_auth)
        if not kwargs.get("from_"):
            if not self.get("default_sender_email"):
                frappe.throw("Sorry, destination email from_ is not provided.")
            kwargs["from_"] = self.get("default_sender_email")
        response = requests.post(f"{base_url}{uri}", json=kwargs, headers=headers)
        response.raise_for_status()
        return response.json()

    def test_send_email(self):
        email_payload = dict(
            from_="admin@afyayangu.go.ke",
            to="michellemwangim@gmail.com",
            subject="How fast was that!",
            html="Your OTP is this one",
        )
        return self.send_email(**email_payload)


# info@healthpro.com