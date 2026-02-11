import frappe
import erpnext
import requests
import json
import datetime
import pytz

import base64
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding

default_gw = "L4 Likoni" #frappe.db.get_single_value("Facility Settings","default_mpesa_gateway")
short_code = ""
prod_consumer_key = ""
prod_consumer_secret = ""
pass_key=""
if default_gw:
	gw = frappe.get_doc("Mpesa Settings", default_gw)
	short_code = gw.get("business_shortcode")
	prod_consumer_key = gw.get("consumer_key")
	prod_consumer_secret = gw.get_password("consumer_secret")
	pass_key=gw.get_password("online_passkey")

# mpesa event handlers

def get_access_token():

	consumer_key = prod_consumer_key
	consumer_secret = prod_consumer_secret
	# https://api.safaricom.co.ke/oauth/v1/generate
	headers = dict(Authorization=pass_key)
	api_URL = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
	r = requests.get(api_URL,headers=headers, auth=requests.auth.HTTPBasicAuth(consumer_key, consumer_secret))
	access_token = json.loads(r.text)
	print("Token==>{}".format(access_token))

	return access_token['access_token']

@frappe.whitelist(allow_guest=True)
def register_urls():
	credentials = get_credentials()
	short_code, prod_consumer_key, prod_consumer_secret, pass_key, initiator, security_credential = credentials.get("short_code"), credentials.get("prod_consumer_key"), credentials.get("prod_consumer_secret"), credentials.get("pass_key"), credentials.get("initiator_name"), credentials.get("security_credential")
	access_token = get_access_token()
	# https://api.safaricom.co.ke/mpesa/c2b/v1/registerurl
	api_url = "https://api.safaricom.co.ke/mpesa/c2b/v2/registerurl"
	headers = {"Authorization": "Bearer %s" % access_token}
	# print(headers,short_code)
	options = {
		"ShortCode": short_code,
		"ResponseType": "Completed",
		"ConfirmationURL": "https://webhook.site/da161c4a-b217-49d1-943d-b99c1b2f63dc",
		"ValidationURL": "https://webhook.site/da161c4a-b217-49d1-943d-b99c1b2f63dc"
	}
#  {
#     "ShortCode": "",
#     "ResponseType": "",
#     "ConfirmationURL": "",
#     "ValidationURL": ""
# }
	response = requests.post(api_url, json=options, headers=headers)
	# response = json.loads(response.text)

	# frappe.local.response.update(response)
	print(response.__dict__)

@frappe.whitelist(allow_guest=True)
def confirm(*args, **kwargs):

	data = kwargs
	frappe.logger("frappe.web").debug(kwargs)
	# amount = kwargs['TransAmount']
	# # account_number = data['BillRefNumber']
	# tx_reference = data['TransID']
	# phone_number = data['MSISDN']


	try:
		# payment = frappe.get_doc({
		#     "doctype":"MPESA Payments",
		#     "phone_number":phone_number,
		#     "reference_number":tx_reference,
		#     "bill_reference_number": account_number,
		#     "raw_json_response":json.dumps(data),
		#     "amount": amount,
		#     "transaction_time":data['TransTime'],
		#     "sender_name":  "{} {} {}".format(data['FirstName'], data['MiddleName'], data['LastName']) 
		# })
		# payment.run_method('set_missing_values')
		# payment.insert(
		#     ignore_permissions=True,
		#     ignore_links=True,
		# )
		# args = dict(doctype="MPESA Payload",phone=phone,amount=amount,transaction_reference=tx_reference,payload=kwargs)
		args = dict(doctype="MPESA Payload",json_dump=json.dumps(data))
		payment = frappe.get_doc(args)
		payment.flags.ignore_permissions = 1
		payment.insert()
		frappe.db.commit()
		payment.notify_update()
		
		frappe.logger("frappe.web").debug(payment)

	except Exception as e:
		frappe.throw("{}".format(e))
		frappe.log_error(title="MPESA Payload Receive Error", message="{}".format(e))
	frappe.local.response.update({
			"ResultCode": 0,
			"ResultDesc": "Accepted"
		})


@frappe.whitelist(allow_guest=True)
def validate(*args, **kwargs):
	frappe.logger("frappe.web").debug(kwargs)

	try:
		if (1 > 0):
			frappe.local.response.update({
				"ResultCode": 0,
				"ResultDesc": "Accepted"
			})

	except Exception as e:
		frappe.local.response.update({
			"ResultCode":1, 
			"ResultDesc":"Failed"
		})



@frappe.whitelist(allow_guest=True)
def simulate_tx(*args, **kwargs):

	access_token = get_access_token()
	api_url = "https://api.safaricom.co.ke/mpesa/c2b/v1/simulate"
	headers = {"Authorization": "Bearer %s" % access_token}
	request = {
		"ShortCode": short_code,
		"CommandID": "CustomerPayBillOnline",
		"Amount": kwargs['amount'],
		"Msisdn": "254708374149",
		"BillRefNumber": kwargs['account_no']
	}
	response = requests.post(api_url, json=request, headers=headers)
	response = json.loads(response.text)

	frappe.local.response.update(response)
def confirm_tx():
	pass
@frappe.whitelist()
def ping():
	return "pong", frappe.conf.mpesa_credentials
@frappe.whitelist(allow_guest=True)
def initiate_payment(*args, **kwargs):
	api_host = "https://api.safaricom.co.ke"
	host_url = frappe.utils.get_url()
	east_africa_tz = pytz.timezone('Africa/Nairobi')
	direct_eat_now = datetime.datetime.now(east_africa_tz) + datetime.timedelta(minutes=5)
	customer_id = kwargs['customer_id']
	_cr = get_credentials()
	print(_cr)
	phone = kwargs['phone']
	amount = float(kwargs["amount"])
	access_token = get_access_token()
	# patient_doc = frappe.get_doc("Patient", patient_id)
	api_url = "{}/mpesa/stkpush/v1/processrequest".format(api_host)
	headers = {"Authorization": "Bearer %s" % access_token}
	print(headers)
	time = str(direct_eat_now).split(".")[0].replace("-", "").replace(" ", "").replace(":", "")
	print(time)
	print(api_url)
	# pass_key ='fe7a127f0b28c764172382b54799d42868b99f85a62bb7ec3e77141b126714b0'
	password_data = "{0}{1}{2}".format(short_code ,pass_key , time)
	password_data = password_data.encode('utf-8')
	password = base64.b64encode(password_data).decode('utf-8')
	#stk_callback_handler
	print(password)
	request = {
		"BusinessShortCode":short_code,
		"Password": password,
		"Timestamp": time,
		"TransactionType": "CustomerPayBillOnline",
		"Amount": amount,
		# "Amount": reservation.charges,
		"PartyA":  phone,
		"PartyB": short_code,
		"PhoneNumber": phone,
  		"CallBackURL":"https://webhook.site/da161c4a-b217-49d1-943d-b99c1b2f63dc",
	# "CallBackURL":"https://webhook.site/0d54c75a-1415-4f75-a53d-9fc17f3fd447",
		# "CallBackURL": "{}/api/method/billing.billing.api.m_pay.handler.stk_handler".format(host_url),
		"AccountReference": customer_id,
		"TransactionDesc": "{}".format(frappe.defaults.get_user_default("Company"))
	}
	response = requests.post(api_url, json=request, headers=headers)
	print("Status Code {}".format(response.status_code))
	response = json.loads(response.text)
	return response
	frappe.logger("frappe.web").debug({"STK API response":response})
	if response.get('ResponseCode') == '0':
		# args = dict(doctype="MPESA Payload",phone=phone,json_dump=json.dumps(response))

		# payment = frappe.get_doc(args)
		# payment.flags.ignore_permissions = 1
		# payment.insert()
		# # payment.submit()
		# frappe.db.commit()
		# payment.notify_update()
		# payment = frappe.get_doc({
		# 	"doctype":"Payment",
		# 	"merchant_request_id": response['MerchantRequestID'],
		# 	"checkout_request_id": response['CheckoutRequestID'],
		# 	"amount": patient_doc.charges,
		# 	"status": "Unpaid",
		# 	"reservation": patient_id
		# })
		# payment.run_method('set_missing_values')
		# payment.insert(ignore_permissions=True)
		# payment.save()
		frappe.local.response.update({"status":"success", "payment": response})
		return
	# frappe.local.response.update({"status":"error", "error": response['ResponseDescription']})
	return request, response
@frappe.whitelist(allow_guest=True)
def get_stk_transaction_status(transaction_doc):
	# {"MerchantRequestID": "db57-40e1-af85-2424fab5a2e627926214", "CheckoutRequestID": "ws_CO_06022024081507375722810063", "ResponseCode": "0", "ResponseDescription": "Success. Request accepted for processing", "CustomerMessage": "Success. Request accepted for processing"}
	try:	
		tx_json =  json.loads(frappe.db.get_value("MPESA Payload",transaction_doc,"json_dump"))
		checkout_request_id = tx_json.get("CheckoutRequestID")
		credentials = get_credentials()
		short_code, prod_consumer_key, prod_consumer_secret, pass_key = credentials.get("short_code"), credentials.get("prod_consumer_key"), credentials.get("prod_consumer_secret"), credentials.get("pass_key")
		access_token = get_access_token()
		time = str(datetime.datetime.now()).split(".")[0].replace("-", "").replace(" ", "").replace(":", "")
		# pass_key ='91ff41d34e3df6d473656eafca0596bb88e6fdb41edc91d2b20f1590fafdb424'
		password_data = "{0}{1}{2}".format(short_code ,pass_key , time)
		password_data = password_data.encode('utf-8')
		password = base64.b64encode(password_data).decode('utf-8')
	
		headers = {"Authorization": "Bearer %s" % access_token}
		API_URL = "https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query"
		payload = {
			"BusinessShortCode": short_code ,
			"Password": password,
			"Timestamp": time,
			"CheckoutRequestID": checkout_request_id
		}
		response = requests.post(API_URL, json=payload, headers=headers)
		response = json.loads(response.text)
		return response
	except Exception as e:
		frappe.throw("{}".format(e))
@frappe.whitelist(allow_guest=True)
def get_transaction_query(transaction_ref):
	# return
	# {"MerchantRequestID": "db57-40e1-af85-2424fab5a2e627926214", "CheckoutRequestID": "ws_CO_06022024081507375722810063", "ResponseCode": "0", "ResponseDescription": "Success. Request accepted for processing", "CustomerMessage": "Success. Request accepted for processing"}
	try:	
		# tx_json =  json.loads(frappe.db.get_value("MPESA Payload",transaction_ref,"json_dump"))
		# checkout_request_id = tx_json.get("CheckoutRequestID")
		if frappe.db.exists('Payment Entry',{'reference_no': transaction_ref}):
			frappe.throw("Transaction {} already confirmed and utilized in Payment Entry".format(transaction_ref))
		credentials = get_credentials()
		short_code, prod_consumer_key, prod_consumer_secret, pass_key, initiator, security_credential = credentials.get("short_code"), credentials.get("prod_consumer_key"), credentials.get("prod_consumer_secret"), credentials.get("pass_key"), credentials.get("initiator_name"), credentials.get("security_credential")
		access_token = get_access_token()
	
		headers = {"Authorization": "Bearer %s" % access_token}
		API_URL = "https://api.safaricom.co.ke/mpesa/transactionstatus/v1/query"
		payload = {
			"Initiator": initiator,
			"SecurityCredential": security_credential,
			"CommandID": "TransactionStatusQuery",
			"TransactionID": transaction_ref,
			"PartyA": short_code,
			"IdentifierType": "4",
			# "ResultURL": "https://kapkatet.health.go.ke/api/method/billing.cnf_hndlr",
   			# "ResultURL":"https://webhook.site/0d54c75a-1415-4f75-a53d-9fc17f3fd447",
	  		"ResultURL": "https://hie.paperless.co.ke/mpay_tx_14706/mpesa_transaction_result",
			"QueueTimeOutURL": "https://hie.paperless.co.ke/mpay_tx_14706/mpesa_transaction_result",
			"Remarks": "To check the transaction details for {}".format(transaction_ref),
			"Occasion": "Payment of invoice for services rendered"
		}
		response = requests.post(API_URL, json=payload, headers=headers)
		response = json.loads(response.text)
		return response
	except Exception as e:
		frappe.throw("{}".format(e))
def get_credentials():
	default_gw = "L4 Likoni" #frappe.db.get_single_value("Facility Settings","default_mpesa_gateway")
	short_code = ""
	prod_consumer_key = ""
	prod_consumer_secret = ""
	pass_key=""
	if default_gw:
		gw = frappe.get_doc("Mpesa Settings", default_gw)
		short_code = gw.get("business_shortcode")
		prod_consumer_key = gw.get("consumer_key")
		prod_consumer_secret = gw.get_password("consumer_secret")
		pass_key=gw.get_password("online_passkey")
		initiator_name = gw.get("initiator_name")
		# confirmation_url = gw.get("custom_confirmation_url")
		# validation_url = gw.get("custom_validation_url")
		security_credential = "DDKsYzh73g/JhdYiitcmsWtzGbqfHQ/x0+9ViA5MI7idcs4/DISM2FRFNr0CYlULQB/1iGtUge6dt65zPTKfNYMEUORyLujfYi433tNCqqyJbgQO/GS0Cs45muU4GET30qVnKF1T2x6hU0ww+DxYgsbKG1sk4zdu60PM6QakdDOJxvmt+oxmVboGAxQ9MQoINzG0eHBLGN23r+039uCHHsdj+X/ub0wzYJGsQEvcr6q+Jhki72WcdgwS1Loeks7MhCsKcQne5ZosrgwfG6UGtmEwatW5C6wEmXt82IkFS9WVEdi1syk661JXYMUI8GTgJRXJS8svddOFnW3+lFbJWA==" #gw.get("security_credential") #frappe.conf.mpesa_credentials#
	return dict(short_code=short_code,prod_consumer_key=prod_consumer_key,prod_consumer_secret=prod_consumer_secret,pass_key=pass_key,initiator_name=initiator_name,security_credential=security_credential)


@frappe.whitelist()
def timeout_url(*args, **kwargs):
	data = kwargs
	return kwargs
@frappe.whitelist(allow_guest=True)
def stk_callback_handler(*args, **kwargs):
	data = kwargs
	sys_args = dict(doctype="MPESA Payload", json_dump=json.dumps(data))
	doc = frapppe.get_doc(sys_args).insert()
	return kwargs
"""
1. Lipa Na MPESA:
	{"TransactionType": "Pay Bill", "TransID": "SB62A1SVRK", "TransTime": "20240206175204", "TransAmount": "1.00", "BusinessShortCode": "4130669", "BillRefNumber": "peter", "InvoiceNumber": "", "OrgAccountBalance": "161.00", "ThirdPartyTransID": "", "MSISDN": "2547 ***** 845", "FirstName": "PETER", "cmd": "billing.mpay_14706"}
2. STK Push: 
	{"TransactionType": "Pay Bill", "TransID": "SB65A1TU7X", "TransTime": "20240206175212", "TransAmount": "4.00", "BusinessShortCode": "4130669", "BillRefNumber": "2046332", "InvoiceNumber": "", "OrgAccountBalance": "165.00", "ThirdPartyTransID": "", "MSISDN": "2547 ***** 063", "FirstName": "SALIM", "cmd": "billing.mpay_14706"}
3. Transaction Query:
	{"Result": {"ResultType": 0, "ResultCode": 0, "ResultDesc": "The service request is processed successfully.", "OriginatorConversationID": "8aec-4878-bb2e-835d301b747563942456", "ConversationID": "AG_20240206_202018931e291815db5d", "TransactionID": "SB60000000", "ResultParameters": {"ResultParameter": [{"Key": "DebitPartyName", "Value": "254722810063 - SALIM RURU"}, {"Key": "CreditPartyName", "Value": "4130669 - KERICHO COUNTY KAPKATET DISTRICT HOSPITAL                    "}, {"Key": "OriginatorConversationID", "Value": "3fec-4d4e-8899-f6343499627422355256"}, {"Key": "InitiatedTime", "Value": 20240206143645}, {"Key": "CreditPartyCharges"}, {"Key": "DebitAccountType", "Value": "MMF Account For Customer"}, {"Key": "TransactionReason"}, {"Key": "ReasonType", "Value": "Pay Utility with OD Online"}, {"Key": "TransactionStatus", "Value": "Completed"}, {"Key": "FinalisedTime", "Value": 20240206143645}, {"Key": "Amount", "Value": 1.0}, {"Key": "ConversationID", "Value": "AG_20240206_2070311589e691000924"}, {"Key": "ReceiptNo", "Value": "SB659DEI29"}]}, "ReferenceData": {"ReferenceItem": {"Key": "Occasion", "Value": "Payment of invoice for services rendered"}}}, "cmd": "billing.mpay_14706"}
"""