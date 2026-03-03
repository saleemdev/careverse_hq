import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = path.join(process.cwd(), 'test-results', 'screenshots');

test.describe('Affiliation unaffiliation flow', () => {
  test('terminate affiliation and capture screenshots', async ({ page }) => {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    test.skip(!username || !password, 'ADMIN_USERNAME/ADMIN_PASSWORD env vars are required for this test.');

    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

    // Login via Frappe login page
    await page.goto('/login');
    await page.fill('input[name="usr"]', username!);
    await page.fill('input[name="pwd"]', password!);
    await page.click('button:has-text("Login")');
    await page.waitForURL('**/admin-central**', { timeout: 30000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-after-login.png'), fullPage: true });

    // Navigate to Affiliations module (hash route)
    await page.goto('/admin-central#affiliations');
    await expect(page.getByText('Affiliation Requests')).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-affiliations-list.png'), fullPage: true });

    // Wait for table to load and pick first Active/Confirmed row
    const row = page.locator('table tbody tr').filter({
      has: page.getByText(/Active|Confirmed/),
    }).first();
    await expect(row).toBeVisible();

    // Open detail modal via Review link/button
    await row.getByRole('link', { name: /Review/i }).or(row.getByRole('button', { name: /Review/i })).first().click();
    await expect(page.getByText('Affiliation Details')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-detail-modal.png'), fullPage: true });

    // Trigger terminate flow
    const terminateButton = page.getByRole('button', { name: /Terminate Affiliation/i });
    await expect(terminateButton).toBeVisible();
    await terminateButton.click();
    await expect(page.getByText('Terminate Affiliation')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-terminate-modal.png'), fullPage: true });

    // Fill termination form
    await page.getByLabel(/Termination reason/i).fill('End of contract (automated test)');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-form-filled.png'), fullPage: true });
    await page.getByRole('button', { name: /Confirm Termination/i }).click();

    // Wait for success toast
    await expect(page.getByText(/Affiliation terminated successfully/i)).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-success.png'), fullPage: true });

    // Terminate modal should close
    await expect(page.getByRole('dialog').filter({ hasText: 'Terminate Affiliation' })).not.toBeVisible();
  });
});

