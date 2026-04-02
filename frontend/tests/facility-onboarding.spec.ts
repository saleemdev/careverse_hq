import { test } from '@playwright/test';

test.describe.skip('Facility onboarding flow', () => {
  test('owner with no company access can onboard a facility', async () => {
    // Unskip when the facilities/new route and stubbed onboarding backend are available.
  });

  test('company user can onboard an additional facility', async () => {
    // Unskip when the facilities/new route and stubbed onboarding backend are available.
  });

  test('owner mismatch is blocked before OTP', async () => {
    // Unskip when the facilities/new route and stubbed onboarding backend are available.
  });

  test('invalid OTP does not advance the flow', async () => {
    // Unskip when the facilities/new route and stubbed onboarding backend are available.
  });

  test('already onboarded facilities are rejected', async () => {
    // Unskip when the facilities/new route and stubbed onboarding backend are available.
  });
});
