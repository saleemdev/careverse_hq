import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const baseURL = process.env.ADMIN_CENTRAL_BASE_URL || 'http://desk.kns.co.ke:8000';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  outputDir: 'test-results/',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

