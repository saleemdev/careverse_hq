# API Contract: Affiliation Management
## Terminate Affiliation + Lifecycle Automation

---

## 1. Overview

| Field | Details |
|---|---|
| **Endpoint** | `POST /v1/f360/affiliations/terminate` |
| **Purpose** | Immediately terminates an active affiliation |
| **Access** | Facility Administrators only |
| **Authentication** | x-access-token + x-sid-token (see Headers) |

---

## 2. Request

### 2.1 Headers

| Header | Type | Required | Description |
|---|---|---|---|
| x-access-token | string | ✅ Yes | Access token identifying the authenticated user |
| x-sid-token | string | ✅ Yes | Session ID token for request validation |

### 2.2 Request Body

**Content-Type:** `application/json`

| Field | Type | Required | Description |
|---|---|---|---|
| affiliation_id | string | ✅ Yes | The affiliation record to be terminated |
| termination_reason | string | ✅ Yes | Explanation for why the affiliation is being terminated |
| termination_document | array | ❌ No | ID of a previously uploaded supporting document |

### 2.3 Example Request Body (with document)

```json
{
  "affiliation_id": "kdfjeuir",
  "termination_reason": "Worker violated facility policy on 2025-02-15.",
  "termination_documents":[
        {
            "document":"m3i3blt918"
        }
    ]
}
```

### 2.4 Example Request Body (no document)

```json
{
  "affiliation_id": "kdfjeuir",
  "termination_reason": "Worker violated facility policy."
}
```

---

## 3. Process Flow — Terminate Affiliation

1. Authenticate and verify the requesting user is a **Organization Owner**.
2. Validate `affiliation_id` exists and its current status is `"Active"`.
3. Update affiliation status to `"Terminated"`.
4. Record `termination_date` as today's date (UTC).
5. Record `terminated_by` as the current authenticated user.
6. Persist `termination_reason`.
7. Save any uploaded `termination_documents`.
8. Send notification to the affiliated worker.
9. Sync updated record to C360 (see [Section 4](#4-c360-synchronization)).
10. Return success response with updated affiliation details.

---

## 4. C360 Synchronization

When an affiliation is terminated, the platform automatically initiates a synchronization with C360 to ensure the external system reflects the updated affiliation state.

### 4.1 Sync Trigger

The C360 sync is triggered immediately after the affiliation status is updated to `"Terminated"` (Step 9 of the process flow). It runs asynchronously after a successful termination as part of the same termination transaction.

### 4.2 Sync Payload

The following updated affiliation data is sent to C360:

```
{
   "affiliation":{
      "professional":{
         "registration_number":"PUID-00299938843-3",
         "external_reference_id":"A4261738",
         "identification_number":"10101010",
         "identification_type":"National ID",
         "first_name":"John",
         "last_name":"Doe",
         "id_number":"10101010",
         "email":""
      },
      "facility":{
         "registration_number":"847374640",
         "fid":"FID-07-0000003-7",
         "facility_name":"KENYAN DISPENSARY",
         "facility_type":"DISPENSARY",
         "address":"NAIROBI KENYA",
         "keph_level":"LEVEL 2"
      },
      "affiliation_status":"Terminated",
      "termination_reason":"End of employment contract or fixed-term agreement expiration",
      "termination_date":"2026-02-24",
      "terminated_by":"user@example.com",
      "termination_documents":[
         {
            "document_id":"foruiewor",
            "document_category":"Facility Affiliation",
            "document_type":"Termination Letter",
            "document_number":"1",
            "attachment":"restereuedfdk.pdf"
         },
         {
            "document_id":"foruiewor",
            "document_category":"Facility Affiliation",
            "document_type":"Termination Letter",
            "document_number":"1",
            "attachment":"restereuedfdk.pdf"
         }
      ]
   }
}
```

### 4.3 Sync Response Handling

The response returned by C360 is captured and persisted back to the affiliation record. This includes:

- C360 acknowledgment status (success / failure)
- C360 record reference ID (if provided)
- Timestamp of the sync operation
- Any error codes or messages returned by C360

> **Note:** If the C360 sync fails, the affiliation termination is **not** rolled back. The sync failure is logged and flagged for retry or manual review. The termination remains valid.

---

## 5. Automated Daily Affiliation Lifecycle Check

A scheduled background job runs **once every day** to evaluate the lifecycle state of all active affiliations. The check is governed by a configurable setting defined in the system backend.

### 5.1 Configuration

| Setting Key | Description |
|---|---|
| `affiliation_expiry_warning_days` | Number of days before the affiliation end date at which warning notifications are triggered. Configured in the backend settings panel. |

### 5.2 Warning Notification — Approaching End Date

When the daily check runs, if the number of days remaining until an affiliation's `end_date` equals the configured `affiliation_expiry_warning_days` threshold, the system:

1. Sends a notification to the **Organization Owner** informing them that the affiliation is approaching its end date.
2. Sends a notification to the **Health Practitioner** informing them that their affiliation will be expiring soon.
3. Presents the Facility Administrator with two available actions:

| Action | Description |
|---|---|
| **Extend Affiliation** | Extend the current affiliation by updating the end date for continued engagement. |
| **Create New Affiliation** | Initiate a new affiliation record to replace the current one upon expiry. |

> **Note:** Both notifications are sent simultaneously. The Organization Owner must take action before the end date to avoid automatic expiry.

### 5.3 Expiry on End Date

When the daily check determines that an affiliation's `end_date` is today (i.e., current UTC date equals `end_date`), the system automatically:

1. Updates the affiliation status from `"Active"` to `"Expired"`.
2. Records the `expiry_date` as today's date (UTC).
3. Sends a notification to the **Health Practitioner** informing them that their affiliation has expired.
4. Sends a notification to the **Organization Owner** informing them that an affiliation under their organization has expired.




## 6. Response

### 6.1 Success — 200 OK

```json
{
  "success": true,
  "message": "Affiliation successfully terminated.",
  "data": {
    "affiliation_id": "aff_abc123",
    "status": "Terminated",
    "termination_date": "2025-02-20",
    "terminated_by": {
      "user_id": "usr_xyz789",
      "name": "Jane Admin"
    }
  }
}
```

### 6.2 Error Responses

| Code | Condition | Message |
|---|---|---|
| `400` | Missing or invalid fields | `"termination_reason is required."` |
| `401` | Missing or invalid tokens | `"Invalid or missing x-access-token or x-sid-token."` |
| `403` | User is not a Facility Administrator | `"You do not have permission to terminate affiliations."` |
| `404` | Affiliation does not exist | `"Affiliation not found."` |
| `409` | Affiliation is not currently Active | `"Affiliation cannot be terminated. Current status: 'Terminated'."` |
| `500` | Unexpected server error | `"An unexpected error occurred. Please try again later."` |

#### 400 Bad Request

```json
{
  "success": false,
  "message": "termination_reason is required."
}
```

#### 401 Unauthorized

```json
{
  "success": false,
  "message": "Invalid or missing x-access-token or x-sid-token."
}
```

#### 403 Forbidden

```json
{
  "success": false,
  "message": "You do not have permission to terminate affiliations."
}
```

#### 404 Not Found

```json
{
  "success": false,
  "message": "Affiliation not found."
}
```

#### 40
9 Conflict

```json
{
  "success": false,
  "message": "Affiliation cannot be terminated. Current status: 'Terminated'."
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "message": "An unexpected error occurred. Please try again later."
}
```
