# OIDC Provider — Go-Live Readiness Checklist

Date: 2026-04-06  
Prepared by: CareVerse HQ Platform Team

---

## 1. Infrastructure & Configuration

- [ ] Frappe site is accessible over HTTPS with a valid TLS certificate
- [ ] `frappe.utils.get_url()` returns the correct production base URL (used in quickstart endpoints)
- [ ] OAuth Settings doctype is configured (`Administration > Integrations > OAuth Settings`)
  - `skip_authorization` set to `Auto` or `Never` per policy
  - `scopes_supported` includes at minimum: `openid profile email`
- [ ] `override_whitelisted_methods` entries are active in `hooks.py`:
  - `frappe.integrations.oauth2.authorize` → `careverse_hq.api.oidc_provider.authorize`
  - `frappe.integrations.oauth2.get_token` → `careverse_hq.api.oidc_provider.get_token`
- [ ] App is migrated (`bench migrate`) — OIDC App DocTypes are present in database

---

## 2. OIDC DocType Presence

Run from bench console or via API:

```python
from careverse_hq.api.oidc_apps import REQUIRED_OIDC_DOCTYPES
missing = [d for d in REQUIRED_OIDC_DOCTYPES if not frappe.db.exists("DocType", d)]
print("Missing:", missing)  # must be []
```

Expected: `Missing: []`

---

## 3. Identity Governance

- [ ] Subject stability backfill has been run at least once:

```python
from careverse_hq.api.oidc_identity import backfill_subject_stability
print(backfill_subject_stability())
```

Expected: `created >= 0`, `failed == 0`

- [ ] Reconciliation report shows zero `missing_sub` anomalies:

```python
from careverse_hq.api.oidc_identity import get_identity_reconciliation_report
r = get_identity_reconciliation_report()
missing_sub = [a for a in r["anomalies"] if a["category"] == "missing_sub"]
print("missing_sub anomalies:", len(missing_sub))  # must be 0
```

- [ ] Daily scheduled job `backfill_subject_stability` is registered in scheduler events

---

## 4. App Registration

- [ ] At least one OIDC App exists in `Active` status
- [ ] App has a valid HTTPS redirect URI (no `http://` non-localhost entries)
- [ ] App scopes include `openid`
- [ ] OAuth Client linked to app exists and has `client_id` and `client_secret`
- [ ] Quickstart endpoint returns a valid response for the app

---

## 5. Auth Flow Smoke Test

Perform manually or via integration test harness:

- [ ] **Guest redirect**: Visit authorize URL unauthenticated → redirected to `/login` with `redirect-to` preserved
- [ ] **Post-login return**: After login, redirect returns to authorize flow correctly
- [ ] **Consent page**: Eligible user sees branded CareVerse consent page with app name and scope list
- [ ] **Allow flow**: Clicking Allow → redirected to callback with `code` and `state`
- [ ] **Deny flow**: Clicking Cancel → redirected to callback with `error=access_denied` and `state`
- [ ] **Token exchange**: `code` exchanges successfully for `access_token` + `id_token`
- [ ] **Userinfo**: `GET /api/method/frappe.integrations.oauth2.openid_profile` returns `sub`, `email`, `name`
- [ ] **sub is stable**: `sub` matches `User Social Login(provider=frappe).userid` for the user

---

## 6. Negative Path Verification

- [ ] Disabled app → branded error page with `invalid_client`
- [ ] User with no Health Professional link → `access_denied` error page
- [ ] Inactive HP status → `access_denied` error page
- [ ] Invalid/missing `client_id` → `invalid_request` error page
- [ ] All error pages show Request ID and "Back to safety" link
- [ ] `http://` redirect URI (non-localhost) rejected at form save

---

## 7. Security Controls

- [ ] `Web Confidential` client: token exchange requires `client_secret`
- [ ] `Native Public` client: PKCE (`code_challenge` + `code_verifier`) enforced by Frappe core
- [ ] Secret is not stored in plaintext logs or API responses after initial reveal
- [ ] Secret rotation produces new credentials; old credentials rejected after rotation
- [ ] Audit trail entries appear on app detail after create, update, rotate, and status change

---

## 8. Operational Readiness

- [ ] Operator runbook reviewed by on-call team (`oidc-operator-runbook.md`)
- [ ] Integrator guide distributed to consuming app teams (`oidc-integrator-guide.md`)
- [ ] At least one admin has `Admin Central Admin` role and can access `Administration > OIDC Apps`
- [ ] Incident response: team knows to disable app immediately on suspected secret compromise

---

## Sign-off

| Role | Name | Date | Status |
|---|---|---|---|
| Platform Engineer | | | ☐ |
| Security Review | | | ☐ |
| Release Manager | | | ☐ |
