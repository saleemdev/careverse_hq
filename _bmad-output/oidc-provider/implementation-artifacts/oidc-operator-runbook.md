# OIDC Operator Runbook

Date: 2026-04-05

## Day-2 Operations

### Create New App
1. `Administration > OIDC Apps > Add App`
2. Validate redirect URIs and scopes
3. Save and distribute credentials securely
4. Record ownership/contact metadata

### Disable Compromised App
1. Set app status to `Disabled`
2. Notify owning team
3. Review app audit entries
4. Re-enable only after remediation and validation

### Rotate Secret
1. Select app and run `Rotate Secret`
2. Distribute new secret through secure channel
3. Confirm client deployment completed
4. Validate token exchange succeeds with new secret

## Incident Playbook

### Suspected Secret Leak
1. Disable app immediately.
2. Rotate secret.
3. Re-enable when consuming app confirms update.
4. Capture audit trail and incident notes.

### Authorization Failures
1. Check app status (`Active`).
2. Confirm user is enabled and linked to `Health Professional`.
3. Confirm `Health Professional.status` is active.
4. Confirm redirect URI exact match.

## Evidence to Retain
- App change timestamps
- Actor/user responsible
- Reason for disable/rotate operations
- Request IDs from blocked authorization pages
