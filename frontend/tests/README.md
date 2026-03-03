# E2E Tests (Playwright)

## Unaffiliation flow

- **Spec:** `tests/unaffiliation.spec.ts`
- **Browser:** Chromium (Chrome)

### Prerequisites

1. **Install browsers (once):**
   ```bash
   npx playwright install
   # or only Chromium:
   npx playwright install chromium
   ```

2. **Environment (for login):**
   - `ADMIN_USERNAME` – Frappe user (e.g. Administrator)
   - `ADMIN_PASSWORD` – Password for that user  
   If either is missing, the unaffiliation test is skipped.

3. **App and site:**
   - Bench/site running (e.g. `bench start`).
   - Admin Central reachable at `ADMIN_CENTRAL_BASE_URL` or `http://localhost:8000`.

### Run

Default base URL is **http://desk.kns.co.ke:8000** (override with `ADMIN_CENTRAL_BASE_URL`).

```bash
# With credentials (required)
ADMIN_USERNAME=youruser ADMIN_PASSWORD=yourpass npx playwright test tests/unaffiliation.spec.ts --project=chromium

# Or use the helper script from repo root
cd frontend && ADMIN_USERNAME=youruser ADMIN_PASSWORD=yourpass ./scripts/run-unaffiliation-e2e.sh
```

Screenshots are saved under **`frontend/test-results/screenshots/`**:
- `01-after-login.png`
- `02-affiliations-list.png`
- `03-detail-modal.png`
- `04-terminate-modal.png`
- `05-form-filled.png`
- `06-success.png`

### What the unaffiliation test does

1. Opens `/login`, logs in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
2. Goes to `#affiliations`.
3. Finds the first table row with status Active or Confirmed.
4. Clicks Review → opens Affiliation Details modal.
5. Clicks “Terminate Affiliation” → opens Terminate modal.
6. Fills termination reason and clicks “Confirm Termination”.
7. Asserts success message and that the Terminate modal closes.
