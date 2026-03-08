# Claims Module

Facility claims list and summary, backed by the **Facility Claim** doctype (or mock data when the doctype is not installed).

## Where is the mock data?

**Backend:** `careverse_hq/api/claims.py`

- **Function:** `_get_mock_claims()` (around line 74).
- **Data:** The list `all_mock` is built from 6 calls to `_mock_claim_record(...)` in the same file. Each record has `date_start` in Sept or Oct 2025, facility `FID-14-116984-2` (KIAMURINGA DISPENSARY), and mix of statuses (approved, pending, rejected).
- **Behaviour:** When the **Facility Claim** doctype/table does not exist, `get_facility_claims` uses mock data. You can force mock with site_config `"claims_use_mock": 1` even when the table exists.

**Filters:** Mock supports `facilities`, `status`, and `date_from` / `date_to` (month filter). Use the **Facility** dropdown and **Month** picker on the Claims page to test.

## Test data (mock)

When the **Facility Claim** doctype does not exist (or when mock is forced), the API returns **20 mock records** so you can validate:

- **Summary cards**: total claims, pending, approved, total amount (KES)
- **Status tabs**: All, Pending, Approved, Rejected (2 records per status)
- **Facility filter**: use the Facility dropdown (or global context); mock facility is `FID-14-116984-2`.
- **Month filter**: use the Month picker; mock dates are Sept–Oct 2025 (e.g. select Oct 2025 to see a subset of the 20 records).
- **Pagination**: try page size 3 or 5 to see multiple pages
- **Table columns**: client, claim ID, period, diagnoses, status, amount, facility, insurer

Mock facility ID: `FID-14-116984-2` (KIAMURINGA DISPENSARY). If the frontend sends no facilities or this ID, all 6 records are returned; status and month filters still apply.

## Facility Claim DocType and sample data

- **DocType:** `Facility Claim` (module: Careverse Hq).  
  Path: `careverse_hq/careverse_hq/doctype/facility_claim/` (JSON, Python controller, JS).
- **Fields:** claim_id, client, client_name, claim_status, claim_upstream_error_group, claim_upstream_response, scheme_id, insurer, diagnoses, interventions, date_start, date_end, claim_subtype, claim_type, claim_amount, facility, facility_name, county, sub_county. Values for these fields come from the API only (no hardcoding).
- **Sample data:** After installing the app and running migrate, patch `careverse_hq.patches.insert_facility_claim_samples` inserts **55** sample records. Includes:
  - **KENYATTA NATIONAL HOSPITAL** (KNH-001) – 18 records
  - **KIAMURINGA DISPENSARY** (FID-14-116984-2) – 22 records
  - **MOI TEACHING AND REFERRAL HOSPITAL** (MTRH-001) – 15 records  

To run the patch manually if it did not run on migrate:
```bash
bench --site <your-site> execute careverse_hq.patches.insert_facility_claim_samples.execute
```

## Switching to real API

1. **Automatic**: Once the **Facility Claim** doctype exists in the app, `get_facility_claims` uses the database instead of mock. No frontend or config change needed.

2. **Force mock for testing**: In `site_config.json` (or Site Config in the bench), set:
   ```json
   "claims_use_mock": 1
   ```
   The API will keep returning mock data even when Facility Claim exists.

3. **Frontend**: Unchanged. It always calls `careverse_hq.api.claims.get_facility_claims`; the backend decides mock vs real.

## API contract

### Get facility claims (list)

- **Endpoint**: `careverse_hq.api.claims.get_facility_claims`
- **Parameters**: `facilities` (comma-separated), `page`, `page_size`, `status`, `date_from` (YYYY-MM-DD), `date_to` (YYYY-MM-DD)
- **Response**: `{ summary: { total_count, by_status, total_amount }, total_count, page, page_size, items: [...] }`

### Create facility claim (POST)

- **Endpoint**: `careverse_hq.api.claims.create_facility_claim`
- **Method**: POST
- **Parameters**: Pass any Facility Claim field names as kwargs (e.g. `claim_id`, `client`, `client_name`, `claim_status`, `facility`, `date_start`, `date_end`, `claim_amount`, etc.). `claim_id` is required.
- **Duplicate handling**: If a Facility Claim with the same `claim_id` already exists, the API returns 409 and does not create a duplicate.
- **Response (201)**: `{ data: { name, claim_id }, message: "Facility Claim created." }`
- **Response (409)**: `{ message: "A Facility Claim with claim_id '...' already exists. Duplicate claims are not allowed." }`
