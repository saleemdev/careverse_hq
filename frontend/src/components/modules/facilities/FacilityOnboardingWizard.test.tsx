import { describe, test } from 'vitest';

describe('FacilityOnboardingWizard', () => {
    test.todo('blocks step progression until the current step is valid');
    test.todo('shows a duplicate-facility stop state when onboarding is already complete');
    test.todo('submits owner verification and displays OTP delivery details without exposing the raw destination');
    test.todo('rejects invalid OTP attempts and enforces resend cooldown');
    test.todo('requires region selection for private facilities before review');
    test.todo('renders the review state from normalized API payloads');
    test.todo('submits the final payload and shows the success state');
    test.todo('warns before abandoning a dirty onboarding draft');
});
