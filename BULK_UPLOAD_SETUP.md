# Bulk Upload & User Management Setup Guide

This guide covers the setup and testing of the Bulk Facility Affiliation Upload and User Management features.

## Day 1: User Management Backend - COMPLETED ✅

### Files Created

1. **[careverse_hq/api/user_management.py](careverse_hq/api/user_management.py)** - User management API with:
   - `create_team_user()` - Creates users with auto-generated passwords
   - `reset_user_password()` - Resets user passwords
   - `update_user()` - Updates user details

2. **[careverse_hq/templates/emails/user_credentials.html](careverse_hq/templates/emails/user_credentials.html)** - Email template for:
   - New user credentials
   - Password reset notifications

3. **[careverse_hq/api/setup_assistant_role.py](careverse_hq/api/setup_assistant_role.py)** - Script to create Assistant role with permissions

---

## Setup Instructions

### Step 1: Create the Assistant Role

Run this from the Frappe bench console:

```bash
bench --site desk.kns.co.ke console
```

Then in the Python console:

```python
from careverse_hq.api.setup_assistant_role import setup_assistant_role
setup_assistant_role()
```

This will create the "Assistant" role with the following permissions:

| DocType | Create | Read | Write | Delete |
|---------|--------|------|-------|--------|
| Bulk Health Worker Upload | ✓ | ✓ (own) | ✗ | ✗ |
| Bulk Health Worker Upload Item | ✗ | ✓ (own) | ✗ | ✗ |
| Facility Affiliation | ✗ | ✓ | ✗ | ✗ |
| Health Professional | ✗ | ✓ | ✗ | ✗ |
| Health Facility | ✗ | ✓ | ✗ | ✗ |

---

### Step 2: Test User Creation API

#### Method 1: Using cURL

```bash
curl -X POST http://desk.kns.co.ke:8000/api/method/careverse_hq.api.user_management.create_team_user \
  -H "Authorization: token YOUR_API_KEY:YOUR_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@county.gov",
    "phone": "+254712345678",
    "role": "Assistant",
    "county": "Nairobi"
  }'
```

#### Method 2: Using Frappe Client (Python)

```python
import frappe

response = frappe.call(
    "careverse_hq.api.user_management.create_team_user",
    first_name="Jane",
    last_name="Doe",
    email="jane.doe@county.gov",
    phone="+254712345678",
    role="Assistant",
    county="Nairobi"
)

print(response)
```

#### Expected Response

```json
{
  "status": "success",
  "data": {
    "user": {
      "name": "jane.doe@county.gov",
      "email": "jane.doe@county.gov",
      "first_name": "Jane",
      "last_name": "Doe",
      "phone": "+254712345678",
      "role": "Assistant",
      "county": "Nairobi",
      "enabled": 1
    },
    "temp_password": "Abc123!@#XYZ"
  },
  "message": "User created successfully"
}
```

---

### Step 3: Verify User Creation

Check that the following were created:

1. **User Account**
   ```python
   frappe.get_doc("User", "jane.doe@county.gov")
   ```

2. **Role Assignment**
   ```python
   user = frappe.get_doc("User", "jane.doe@county.gov")
   roles = [r.role for r in user.roles]
   print("Assistant" in roles)  # Should be True
   ```

3. **User Permissions**
   ```python
   perms = frappe.get_all(
       "User Permission",
       filters={"user": "jane.doe@county.gov"},
       fields=["allow", "for_value"]
   )
   print(perms)  # Should show Department permission for Nairobi
   ```

4. **Email Sent**
   ```python
   # Check email queue
   emails = frappe.get_all(
       "Email Queue",
       filters={"recipient": "jane.doe@county.gov"},
       fields=["subject", "status", "creation"],
       order_by="creation desc",
       limit=1
   )
   print(emails)
   ```

---

### Step 4: Test Password Reset API

```bash
curl -X POST http://desk.kns.co.ke:8000/api/method/careverse_hq.api.user_management.reset_user_password \
  -H "Authorization: token YOUR_API_KEY:YOUR_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "user_email": "jane.doe@county.gov"
  }'
```

#### Expected Response

```json
{
  "status": "success",
  "data": {
    "email": "jane.doe@county.gov",
    "temp_password": "NewPass123!@#"
  },
  "message": "Password reset successfully"
}
```

---

### Step 5: Test User Login Flow

1. **Login with temporary password**
   ```bash
   curl -X POST http://desk.kns.co.ke:8000/api/method/login \
     -H "Content-Type: application/json" \
     -d '{
       "usr": "jane.doe@county.gov",
       "pwd": "Abc123!@#XYZ"
     }'
   ```

2. **Verify forced password change**
   - Check that `must_reset_password` flag is set to 1
   - User should be redirected to change password page

3. **Change password**
   ```python
   frappe.set_value("User", "jane.doe@county.gov", {
       "new_password": "NewSecurePassword123!",
       "must_reset_password": 0
   })
   ```

4. **Login with new password**
   - Verify login works with new password
   - Verify no forced redirect to change password page

---

## Test Scenarios Completed

### Test 1.1: User Creation - Direct ✅
- [x] Create user with required fields
- [x] Assign "Assistant" role
- [x] Create Department permission for county
- [x] Generate temporary password
- [x] Send email with credentials
- [x] Return success response with temp password

### Test 1.2: User Login and Password Change ✅
- [x] Login with temporary password
- [x] Forced to change password (must_reset_password=1)
- [x] Change password successfully
- [x] Login with new password

---

## API Endpoints Summary

### User Management APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/method/careverse_hq.api.user_management.create_team_user` | POST | Create new user with auto-generated password |
| `/api/method/careverse_hq.api.user_management.reset_user_password` | POST | Reset user password |
| `/api/method/careverse_hq.api.user_management.update_user` | POST | Update user details |

---

## Troubleshooting

### Issue: Email not sent

**Check**:
1. Email queue status: `frappe.get_all("Email Queue", filters={"status": "Error"})`
2. Email account configured: Check Site Settings → Email Accounts
3. SMTP settings correct

**Solution**:
```python
# Manually trigger email
from careverse_hq.api.user_management import send_user_credentials_email
send_user_credentials_email(
    email="jane.doe@county.gov",
    first_name="Jane",
    last_name="Doe",
    temp_password="Abc123!@#XYZ",
    role="Assistant",
    county="Nairobi"
)
```

### Issue: Permission denied error

**Check**:
1. Calling user has "System Manager" or appropriate permissions
2. Role exists: `frappe.db.exists("Role", "Assistant")`
3. Department exists: `frappe.db.exists("Department", "Nairobi")`

### Issue: User already exists

**Solution**:
- Delete existing user: `frappe.delete_doc("User", "jane.doe@county.gov")`
- Or use different email address

---

## Next Steps

### Day 2-3: Bulk Upload Frontend
- [ ] Build BulkUploadPage.tsx (full page wizard)
- [ ] Build StatusDashboard.tsx (full page status tracking)
- [ ] Update AffiliationsModule.tsx (add bulk upload button)
- [ ] Add routes for bulk upload pages

### Day 4: User Management Frontend
- [ ] Build UserListPage.tsx
- [ ] Build CreateUserPage.tsx
- [ ] Build EditUserPage.tsx
- [ ] Add routes for user management pages

### Day 5: Integration & Testing
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Security testing
- [ ] Bug fixes

---

## Security Notes

1. **Temporary passwords** are automatically generated with high entropy (12+ characters with mixed case, numbers, and symbols)
2. **must_reset_password** flag forces users to change password on first login
3. **User Permissions** are automatically created to restrict access by county/department
4. **Email notifications** are sent for all password operations
5. **API authentication** required for all user management operations

---

## Support

For issues or questions:
1. Check Frappe error logs: `bench logs`
2. Check Email Queue: `frappe.get_all("Email Queue", filters={"status": "Error"})`
3. Review this documentation
4. Contact system administrator
