import pandas as pd
import frappe

DEFAULT_DATE = "1990-01-01"
DEFAULT_DATE_1 = "1991-01-01"

def enqueue_device_mapping():
    offset = 0
    limit = 13000
    file_name = "device_mapping.csv"
    file_path = frappe.utils.get_site_path("public", "files", file_name)

    try:
        df = pd.read_csv(file_path, dtype=str).fillna("").applymap(lambda x: x.strip() if isinstance(x, str) else x)

        # Remove invalid rows (where ID No. is missing or NIL)
        df_valid = df[~df["ID No."].str.upper().isin(["", "NIL"])]

        for i in range(0, len(df_valid), limit):
            df_chunk = df_valid.iloc[i:i + limit]

            frappe.enqueue(
                "careverse_hq.api.device_mapping.process_uploaded_csv",
                queue="long",
                timeout=None,
                is_async=True,
                now=False,
                **{"df_chunk": df_chunk.to_dict(orient="records")}  # Convert to list of dicts for easy processing
            )

    except Exception as e:
        print(f"Error opening file: {e}")


def split_name(name):
    parts = name.split()
    if len(parts) == 1:
        return parts[0], "", ""
    elif len(parts) == 2:
        return parts[0], "", parts[1]
    else:
        return parts[0], parts[1], " ".join(parts[2:])

def create_or_get_employee(row):
    id_no = row["ID No."]
    employee = frappe.get_value("Employee", {"custom_identification_number": id_no}, "name")
    
    if employee:
        print(f"Employee Found: {employee}")
        return employee  
    
    first_name, middle_name, last_name = split_name(row["HEALTH WORKER NAME"])
    
    new_employee = frappe.get_doc({
        "doctype": "Employee",
        "employee_name": f"{first_name} {last_name}",
        "first_name": first_name,
        "middle_name": middle_name,
        "last_name": last_name,
        "custom_identification_number": id_no,
        "custom_identification_type": "National ID",
        "date_of_birth": DEFAULT_DATE,
        "date_of_joining": DEFAULT_DATE_1,
        "gender": "Unspecified",
        "custom_county_personnel_number": row.get("Personal No.", ""),
        "custom_practicing_license": row.get("License No", ""),
        # "company": row.get("SUB-COUNTY", ""),
        "department": row.get("FACILITY", ""),
        "create_user_permission": 0
    })
    
    new_employee.insert(ignore_permissions=True)
    frappe.db.commit()
    print(f"New Employee Created: {first_name} {last_name}")
    
    return new_employee.name

def create_health_device_record(row, employee_id):
    imei_1 = row.get("IMEI 1", "")

    existing_device = frappe.get_value("Health Automation Device", {"device_serial": imei_1})
    if existing_device:
        print(f"Skipping duplicate Health Device: {imei_1}")
        return  
    
    health_device = frappe.get_doc({
        "doctype": "Health Automation Device",
        "assigned_to_employee": employee_id,
        "device_serial": imei_1,
        "device_serial_2": row.get("IMEI 2", ""),
        "sim_serial": row.get("SIM SERIAL NO", ""),
        "device_type": "Tablet",
        "device_name":"NEON TAB 11",
        "device_description": "NEON TAB 11",
        "facility": row.get("SUB-COUNTY", ""),
        "health_department": row.get("FACILITY", ""),
    })
    
    health_device.insert(ignore_permissions=True)
    frappe.db.commit()
    return
    # print(f"Health Automation Device Record Created for Employee: {employee_id}")

def process_uploaded_csv(df_chunk):
    try:
        # First Pass: Create or Get Employees
        for row in df_chunk:
            create_or_get_employee(row)  # Ensure all employees exist first

        print("Finished creating employees. Now processing device records...")

        # Second Pass: Query Employee Doctype and Create Device Records
        for row in df_chunk:
            employee_id = frappe.get_value("Employee", {"custom_identification_number": row["ID No."]}, "name")

            if employee_id:
                create_health_device_record(row, employee_id)
            else:
                print(f"Warning: No employee found for ID No. {row['ID No.']}")

    except Exception as e:
        print(f"Error in process_uploaded_csv: {str(e)}")
