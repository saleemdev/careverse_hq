#!/usr/bin/env bash
# Run unaffiliation e2e test against desk.kns.co.ke and capture screenshots.
# Usage:
#   ADMIN_USERNAME=youruser ADMIN_PASSWORD=yourpass ./scripts/run-unaffiliation-e2e.sh
# Screenshots are saved to: frontend/test-results/screenshots/

set -e
cd "$(dirname "$0")/.."
export ADMIN_CENTRAL_BASE_URL="${ADMIN_CENTRAL_BASE_URL:-http://desk.kns.co.ke:8000}"

if [ -z "$ADMIN_USERNAME" ] || [ -z "$ADMIN_PASSWORD" ]; then
  echo "Set ADMIN_USERNAME and ADMIN_PASSWORD to run the test."
  echo "Example: ADMIN_USERNAME=admin ADMIN_PASSWORD=xxx ./scripts/run-unaffiliation-e2e.sh"
  exit 1
fi

mkdir -p test-results/screenshots
npx playwright test tests/unaffiliation.spec.ts --project=chromium

echo ""
echo "Screenshots (if test ran): test-results/screenshots/"
ls -la test-results/screenshots/ 2>/dev/null || true
